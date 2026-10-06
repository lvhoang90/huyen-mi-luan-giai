// Tab "Người tham gia": bảng một dòng một người, lọc nhiều trường, sắp xếp nhiều cấp, chọn cột, xuất CSV/JSON, và hành trình cảm xúc từng người.
import { esc, nf, fx, sgn, download, toCsv, FIELD, GENDER, DEVICE, TONE, MOOD, EMO_COLOR } from './admin-ui.js';

const LS_COLS = 'hm_admin_cols', LS_SIZE = 'hm_admin_size';
const st = { data: null, cols: [], vis: new Set(), sort: [{ key: 'lastSeen', dir: -1 }], q: '', filters: [], page: 0, size: 25, emo: {}, preset: 'all' };
const OPS = {
  text: [['has', 'chứa'], ['eq', 'đúng bằng'], ['empty', 'để trống'], ['filled', 'có giá trị']],
  cat: [['is', 'là'], ['not', 'không phải'], ['empty', 'để trống'], ['filled', 'có giá trị']],
  num: [['gte', '≥'], ['lte', '≤'], ['eq', '='], ['empty', 'chưa có'], ['filled', 'đã có']],
  bool: [['yes', 'có'], ['no', 'không']],
  date: [['after', 'từ ngày'], ['before', 'đến ngày']],
};
const TIER_CLS = { 'Gắn bó cao': 'hi', 'Đang quan tâm': 'mid', 'Nhẹ nhàng': 'lo', 'Mới ghé': 'new', 'Cần chú ý': 'warn', 'Cần chú ý (an toàn)': 'crit' };
// Cách xem nhanh: một chạm đặt sẵn sắp xếp, bộ lọc và cột cho từng câu hỏi hay gặp.
const PRESETS = [
  { k: 'all', label: 'Tất cả', sort: [{ key: 'lastSeen', dir: -1 }], filters: [] },
  { k: 'tok', label: 'Đốt token nhiều nhất', sort: [{ key: 'tokTotal', dir: -1 }], filters: [{ key: 'tokTotal', op: 'filled', val: '' }], show: ['tokTotal', 'tokShare', 'tokPerTurn', 'tokPerMin', 'costUsd', 'score', 'tier'] },
  { k: 'waste', label: 'Đốt nhiều, gắn bó thấp', sort: [{ key: 'tokTotal', dir: -1 }], filters: [{ key: 'costFlag', op: 'yes', val: '' }], show: ['tokTotal', 'tokShare', 'score', 'tier', 'activeMin'] },
  { k: 'best', label: 'Gắn bó cao nhất', sort: [{ key: 'score', dir: -1 }], filters: [], show: ['score', 'tier', 'activeMin', 'daysActive', 'returned'] },
  { k: 'care', label: 'Cần chú ý', sort: [{ key: 'crisis', dir: -1 }, { key: 'score', dir: 1 }], filters: [{ key: 'attention', op: 'yes', val: '' }], show: ['attention', 'tier', 'crisis', 'trend', 'moodDelta', 'nps', 'resonance'] },
  { k: 'new', label: 'Mới đăng ký', sort: [{ key: 'created', dir: -1 }], filters: [{ key: 'kind', op: 'is', val: 'Tài khoản' }], show: ['created', 'stage', 'score', 'tier'] },
  { k: 'lost', label: 'Từng sâu sắc, đã vắng', sort: [{ key: 'lastSeen', dir: 1 }], filters: [{ key: 'score', op: 'gte', val: 40 }, { key: 'returned', op: 'no', val: '' }], show: ['score', 'tier', 'lastSeen', 'activeMin'] },
];
const pick = (map) => (v) => (v == null ? null : map[v] ?? v);
const LABEL = { gender: pick(GENDER), field: pick(FIELD), device: pick(DEVICE), myTone: pick(TONE), domEmo: (v) => (v == null ? null : st.emo[v] ?? v) };

/** Giá trị hiển thị (chữ) của một ô, dùng cho bảng, bộ lọc nhóm và tệp xuất. */
function disp(col, r) {
  const v = r[col.key];
  if (v == null || v === '') return null;
  if (LABEL[col.key]) return LABEL[col.key](v);
  if (col.type === 'bool') return v ? 'Có' : 'Không';
  return v;
}
const cellHtml = (col, r) => {
  const v = r[col.key], d = disp(col, r);
  if (d == null) return '<span class="muted">–</span>';
  switch (col.key) {
    case 'trend': return `<span class="tr ${v === 'Cải thiện' ? 'up' : v === 'Đi xuống' ? 'dn' : 'fl'}">${v === 'Cải thiện' ? '▲' : v === 'Đi xuống' ? '▼' : '●'} ${esc(v)}</span>`;
    case 'domEmo': return `<i class="dot" style="background:${EMO_COLOR[v] ?? '#999'}"></i>${esc(d)}`;
    case 'moodStart': case 'moodEnd': return `${v} <span class="muted">${MOOD[v] ?? ''}</span>`;
    case 'moodDelta': case 'valDelta': case 'valSlope': return `<span class="${v > 0 ? 'good' : v < 0 ? 'bad' : ''}">${sgn(v)}</span>`;
    case 'crisis': return v ? `<span class="bad">▲ ${v}</span>` : '0';
    case 'score': return `<span class="scorebar" title="${esc(`Điểm ${v}/100`)}"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></span> <b>${v}</b>`;
    case 'tier': return `<span class="tier t${TIER_CLS[v] ?? 'x'}">${esc(v)}</span>`;
    case 'attention': return v ? `<span class="bad" title="${esc(r.attentionWhy ?? '')}">▲ Cần chú ý</span>` : '<span class="muted">–</span>';
    case 'costFlag': return v ? '<span class="bad" title="Nhóm 20% đốt nhiều token nhất nhưng điểm gắn bó dưới 40">▲ Có</span>' : '<span class="muted">–</span>';
    case 'tokTotal': case 'tokPerTurn': case 'tokPerMin': case 'tokIn': case 'tokOut': case 'tokCr': case 'tokCw': return nf.format(v);
    case 'tokShare': return `${fx(v, 1)}%`;
    case 'costUsd': return `$${fx(v, v < 10 ? 3 : 2)}`;
    case 'stage': return `<span class="stg s${r.stageNo}">${esc(v)}</span>`;
    case 'kind': return `<span class="chip ${v === 'Tài khoản' ? 'info' : ''}">${esc(v)}</span>`;
    default: break;
  }
  if (col.type === 'bool') return v ? '✓' : '<span class="muted">–</span>';
  if (col.type === 'num') return fx(v, 2);
  return esc(d);
};

// ---------------- lọc và sắp xếp ----------------
function matchFilter(f, r) {
  const col = st.cols.find((c) => c.key === f.key); if (!col) return true;
  const v = r[f.key], has = v != null && v !== '';
  switch (f.op) {
    case 'empty': return !has; case 'filled': return has;
    case 'yes': return v === true; case 'no': return v === false || v == null;
    case 'has': return has && String(v).toLowerCase().includes(String(f.val).toLowerCase());
    case 'eq': return col.type === 'num' ? has && +v === +f.val : has && String(disp(col, r)).toLowerCase() === String(f.val).toLowerCase();
    case 'is': return has && (String(v) === String(f.val) || disp(col, r) === f.val);
    case 'not': return !has || (String(v) !== String(f.val) && disp(col, r) !== f.val);
    case 'gte': return has && +v >= +f.val; case 'lte': return has && +v <= +f.val;
    case 'after': return has && String(v).slice(0, 10) >= f.val; case 'before': return has && String(v).slice(0, 10) <= f.val;
    default: return true;
  }
}
function view() {
  const q = st.q.trim().toLowerCase(), searchCols = st.cols.filter((c) => c.type === 'text' || c.type === 'cat');
  let rows = st.data.rows.filter((r) => (!q || searchCols.some((c) => String(disp(c, r) ?? '').toLowerCase().includes(q))) && st.filters.every((f) => (f.val === '' && !['empty', 'filled', 'yes', 'no'].includes(f.op)) || matchFilter(f, r)));
  const cmp = (c, a, b) => {
    const x = a[c.key], y = b[c.key], nx = x == null || x === '', ny = y == null || y === '';
    if (nx || ny) return nx && ny ? 0 : nx ? 1 : -1; // ô trống luôn xuống cuối
    return c.type === 'num' ? x - y : c.type === 'bool' ? (x === y ? 0 : x ? 1 : -1) : String(disp(c, a)).localeCompare(String(disp(c, b)), 'vi', { numeric: true });
  };
  rows = [...rows].sort((a, b) => { for (const s of st.sort) { const c = st.cols.find((k) => k.key === s.key); if (!c) continue; const nx = a[c.key] == null || a[c.key] === '', ny = b[c.key] == null || b[c.key] === ''; const r = cmp(c, a, b); if (r) return nx || ny ? r : r * s.dir; } return 0; });
  return rows;
}

// ---------------- hiển thị ----------------
const distinct = (key) => { const c = st.cols.find((k) => k.key === key); return [...new Set(st.data.rows.map((r) => disp(c, r)).filter((v) => v != null))].sort((a, b) => String(a).localeCompare(String(b), 'vi')); };

function filterRow(f, i) {
  const col = st.cols.find((c) => c.key === f.key) ?? st.cols[0], ops = OPS[col.type];
  const needsVal = !['empty', 'filled', 'yes', 'no'].includes(f.op);
  const input = !needsVal ? '' : col.type === 'cat' ? `<input list="dl-${i}" data-fv="${i}" value="${esc(f.val)}" placeholder="chọn hoặc gõ"><datalist id="dl-${i}">${distinct(col.key).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`
    : `<input data-fv="${i}" type="${col.type === 'num' ? 'number' : col.type === 'date' ? 'date' : 'text'}" step="any" value="${esc(f.val)}">`;
  return `<div class="frm"><select data-fk="${i}" aria-label="Cột lọc">${st.cols.map((c) => `<option value="${c.key}" ${c.key === f.key ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
    <select data-fo="${i}" aria-label="Điều kiện">${ops.map(([k, l]) => `<option value="${k}" ${k === f.op ? 'selected' : ''}>${l}</option>`).join('')}</select>${input}<button class="btn sm" data-fx="${i}" aria-label="Bỏ bộ lọc">×</button></div>`;
}

function render(host) {
  const rows = view(), pages = Math.max(1, Math.ceil(rows.length / st.size)); st.page = Math.min(st.page, pages - 1);
  const shown = st.cols.filter((c) => st.vis.has(c.key)), slice = rows.slice(st.page * st.size, (st.page + 1) * st.size);
  const stageBars = (() => { const mx = Math.max(1, ...st.data.stages.map((_, i) => rows.filter((r) => r.stageNo === i).length)); return st.data.stages.map((s, i) => { const n = rows.filter((r) => r.stageNo === i).length; return `<div class="sb" title="${esc(s)}: ${n}"><i style="height:${Math.max(3, (n / mx) * 34)}px"></i><b>${n}</b><span>${esc(s)}</span></div>`; }).join(''); })();
  const groups = [...new Set(st.cols.map((c) => c.group))];
  const th = shown.map((c) => { const i = st.sort.findIndex((s) => s.key === c.key), s = st.sort[i]; return `<th data-sort="${c.key}" class="${c.type === 'num' ? 'num' : ''} sortable" aria-sort="${s ? (s.dir > 0 ? 'ascending' : 'descending') : 'none'}" title="Bấm để sắp xếp, giữ Shift để sắp xếp thêm cấp">${esc(c.label)}${s ? `<b class="arr">${s.dir > 0 ? '▲' : '▼'}${st.sort.length > 1 ? i + 1 : ''}</b>` : ''}</th>`; }).join('');
  const body = slice.map((r) => `<tr data-id="${esc(r.id)}" tabindex="0">${shown.map((c) => `<td class="${c.type === 'num' ? 'num' : ''}${c.key === 'email' ? ' em' : ''}">${cellHtml(c, r)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${shown.length}" class="muted" style="padding:24px;text-align:center">Không có ai khớp bộ lọc.</td></tr>`;
  host.innerHTML = `<section class="panel"><div class="ph"><div><h2>Người tham gia</h2><p class="sub" style="margin:0">Một dòng một người. Tài khoản được nối với các lần ghé ẩn danh trước khi đăng ký. Bấm tiêu đề cột để sắp xếp (giữ Shift để thêm cấp), bấm một dòng để xem hành trình cảm xúc.</p></div>
      <div class="toolbar"><button class="btn" id="px-csv">Tải CSV</button><button class="btn" id="px-json">Tải JSON</button><button class="btn" id="px-mail" title="Sao chép email của các dòng đang lọc">Sao chép email</button></div></div>
    <div class="stagebars" aria-label="Số người theo bước đã tới (theo bộ lọc)">${stageBars}</div>
    <div class="presets" role="group" aria-label="Cách xem nhanh">${PRESETS.map((p) => `<button type="button" class="pchip ${st.preset === p.k ? 'on' : ''}" data-preset="${p.k}" aria-pressed="${st.preset === p.k}">${esc(p.label)}</button>`).join('')}</div>
    <div class="ptools"><input id="px-q" type="search" placeholder="Tìm theo email, mã, lĩnh vực, thiết bị…" value="${esc(st.q)}" aria-label="Tìm kiếm">
      <button class="btn" id="px-addf">+ Thêm bộ lọc</button><button class="btn" id="px-clr" ${st.filters.length || st.q ? '' : 'disabled'}>Xóa lọc</button>
      <details class="colpick"><summary class="btn">Cột hiển thị (${shown.length}/${st.cols.length})</summary><div class="cp">${groups.map((g) => `<fieldset><legend>${esc(g)}</legend>${st.cols.filter((c) => c.group === g).map((c) => `<label><input type="checkbox" data-col="${c.key}" ${st.vis.has(c.key) ? 'checked' : ''}> ${esc(c.label)}</label>`).join('')}</fieldset>`).join('')}
        <div class="cpb"><button class="btn sm" id="cp-def">Mặc định</button><button class="btn sm" id="cp-all">Tất cả</button></div></div></details></div>
    ${st.filters.length ? `<div class="flist">${st.filters.map(filterRow).join('')}</div>` : ''}
    <p class="note" style="margin:8px 0"><b>${nf.format(rows.length)}</b> / ${nf.format(st.data.total)} người${st.sort.length ? ` · sắp xếp: ${st.sort.map((s) => `${esc(st.cols.find((c) => c.key === s.key)?.label ?? s.key)} ${s.dir > 0 ? '↑' : '↓'}`).join(', ')}` : ''}</p>
    <div class="scroll tablewrap"><table class="ptable"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>
    <div class="pager"><span class="muted">Trang ${st.page + 1}/${pages}</span><button class="btn sm" data-pg="-1" ${st.page ? '' : 'disabled'}>‹ Trước</button><button class="btn sm" data-pg="1" ${st.page < pages - 1 ? '' : 'disabled'}>Sau ›</button>
      <label class="muted">Dòng mỗi trang <select id="px-size">${[10, 25, 50, 100, 250].map((n) => `<option ${n === st.size ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <p class="note">Email chỉ có với người đã đăng ký. Người ẩn danh được nhận diện bằng mã ngắn từ cookie. Bảng không chứa nội dung trò chuyện, họ tên hay ngày sinh. Cột "Xu hướng cảm xúc" và "Cảm xúc nổi bật" là ước lượng từ từ điển (xem tab Hành trình cảm xúc); cột tâm trạng là số tự đánh giá của người dùng.</p></section>
    <div id="drawer" class="drawer" hidden></div>`;
  wire(host, rows);
}

function wire(host, rows) {
  const again = () => render(host);
  host.querySelectorAll('[data-preset]').forEach((el) => (el.onclick = () => {
    const p = PRESETS.find((x) => x.k === el.dataset.preset); if (!p) return;
    st.preset = p.k; st.sort = p.sort.map((s) => ({ ...s })); st.filters = p.filters.map((f) => ({ ...f })); st.q = ''; st.page = 0;
    if (p.show) { st.vis = new Set(['id', 'email', 'kind', ...p.show.filter((k) => st.cols.some((c) => c.key === k))]); if (!st.data.priced) st.vis.delete('costUsd'); } // mỗi cách xem chỉ bày đúng các cột cần cho câu hỏi đó
    else { let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_COLS)); } catch {} st.vis = new Set(Array.isArray(saved) && saved.length ? saved.filter((k) => st.cols.some((c) => c.key === k)) : st.cols.filter((c) => c.def).map((c) => c.key)); if (!st.data.priced) st.vis.delete('costUsd'); }
    again();
  }));
  host.querySelector('#px-q').oninput = (e) => { st.q = e.target.value; st.page = 0; const pos = e.target.selectionStart; again(); const q = host.querySelector('#px-q'); q.focus(); q.setSelectionRange(pos, pos); };
  host.querySelector('#px-addf').onclick = () => { st.filters.push({ key: 'ageBand', op: 'is', val: '' }); again(); };
  host.querySelector('#px-clr').onclick = () => { st.filters = []; st.q = ''; st.page = 0; again(); };
  host.querySelectorAll('[data-fk]').forEach((el) => (el.onchange = () => { const f = st.filters[+el.dataset.fk], c = st.cols.find((k) => k.key === el.value); f.key = el.value; f.op = OPS[c.type][0][0]; f.val = ''; st.page = 0; again(); }));
  host.querySelectorAll('[data-fo]').forEach((el) => (el.onchange = () => { st.filters[+el.dataset.fo].op = el.value; st.page = 0; again(); }));
  host.querySelectorAll('[data-fv]').forEach((el) => (el.onchange = () => { st.filters[+el.dataset.fv].val = el.value; st.page = 0; again(); }));
  host.querySelectorAll('[data-fx]').forEach((el) => (el.onclick = () => { st.filters.splice(+el.dataset.fx, 1); st.page = 0; again(); }));
  host.querySelectorAll('[data-sort]').forEach((el) => (el.onclick = (e) => {
    const k = el.dataset.sort, i = st.sort.findIndex((s) => s.key === k);
    if (e.shiftKey) { if (i < 0) st.sort.push({ key: k, dir: 1 }); else if (st.sort[i].dir === 1) st.sort[i].dir = -1; else st.sort.splice(i, 1); }
    else st.sort = i >= 0 && st.sort.length === 1 ? (st.sort[0].dir === 1 ? [{ key: k, dir: -1 }] : []) : [{ key: k, dir: st.cols.find((c) => c.key === k).type === 'num' ? -1 : 1 }];
    again();
  }));
  host.querySelectorAll('[data-col]').forEach((el) => (el.onchange = () => { el.checked ? st.vis.add(el.dataset.col) : st.vis.delete(el.dataset.col); saveCols(); keepOpen(); }));
  const keepOpen = () => { again(); host.querySelector('.colpick').open = true; };
  host.querySelector('#cp-def').onclick = () => { st.vis = new Set(st.cols.filter((c) => c.def).map((c) => c.key)); saveCols(); keepOpen(); };
  host.querySelector('#cp-all').onclick = () => { st.vis = new Set(st.cols.map((c) => c.key)); saveCols(); keepOpen(); };
  host.querySelectorAll('[data-pg]').forEach((el) => (el.onclick = () => { st.page += +el.dataset.pg; again(); }));
  host.querySelector('#px-size').onchange = (e) => { st.size = +e.target.value; st.page = 0; try { localStorage.setItem(LS_SIZE, st.size); } catch {} again(); };
  const exportRows = () => rows.map((r) => Object.fromEntries(st.cols.map((c) => [c.key, c.type === 'bool' ? (r[c.key] == null ? '' : r[c.key] ? 'có' : 'không') : LABEL[c.key] ? disp(c, r) : r[c.key]])));
  const stamp = new Date().toISOString().slice(0, 10);
  host.querySelector('#px-csv').onclick = () => { const shown = st.cols.filter((c) => st.vis.has(c.key)); download(`huyenmy-nguoi-tham-gia-${stamp}.csv`, toCsv(shown, exportRows())); };
  host.querySelector('#px-json').onclick = () => download(`huyenmy-nguoi-tham-gia-${stamp}.json`, JSON.stringify(rows, null, 2), 'application/json');
  host.querySelector('#px-mail').onclick = async (e) => { const m = rows.map((r) => r.email).filter(Boolean).join(', '); try { await navigator.clipboard.writeText(m); e.target.textContent = `Đã chép ${rows.filter((r) => r.email).length} email`; } catch { prompt('Sao chép danh sách email:', m); } };
  const open = (id) => openDrawer(host.querySelector('#drawer'), id);
  host.querySelectorAll('tbody tr[data-id]').forEach((tr) => { tr.onclick = () => open(tr.dataset.id); tr.onkeydown = (e) => { if (e.key === 'Enter') open(tr.dataset.id); }; });
}
const saveCols = () => { try { localStorage.setItem(LS_COLS, JSON.stringify([...st.vis])); } catch {} };

// ---------------- hành trình cảm xúc của một người ----------------
function turnChart(turns) {
  const pts = turns.filter((t) => t.val != null && t.ok);
  if (pts.length < 1) return '<p class="muted">Chưa có lượt nói nào được phân tích.</p>';
  const W = 640, H = 190, L = 36, R = 12, T = 10, B = 26, n = pts.length;
  const x = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R)), y = (v) => T + (1 - (v + 2) / 4) * (H - T - B);
  const grid = [-2, 0, 2].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? 'var(--grid)' : 'var(--axis)'}" ${v ? '' : 'stroke-dasharray="4 3"'}/><text x="${L - 5}" y="${y(v) + 4}" text-anchor="end" fill="var(--muted)" font-size="10.5">${v > 0 ? '+' : ''}${v}</text>`).join('');
  const line = n > 1 ? `<polyline fill="none" stroke="var(--s1)" stroke-width="2" points="${pts.map((t, i) => `${x(i)},${y(t.val)}`).join(' ')}"/>` : '';
  const dots = pts.map((t, i) => `<circle cx="${x(i)}" cy="${y(t.val)}" r="${4 + (t.aro ?? 0)}" fill="${EMO_COLOR[t.emo] ?? '#999'}" stroke="var(--surface)" stroke-width="2"><title>Lượt ${t.ut ?? i + 1}: ${esc(st.emo[t.emo] ?? t.emo)}, sắc thái ${sgn(t.val, 1)}, mở lòng ${t.disc ?? '–'}/3${t.myTone ? `. My trả lời giọng "${esc(TONE[t.myTone] ?? t.myTone)}"` : ''}</title></circle>`).join('');
  const xt = pts.map((t, i) => (n <= 14 || i % Math.ceil(n / 14) === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${t.ut ?? i + 1}</text>` : '')).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sắc thái theo lượt nói">${grid}${line}${dots}${xt}</svg></div><p class="note" style="margin:2px 0 0">Mỗi chấm là một lượt người dùng nói (màu theo cảm xúc, chấm to hơn là cường độ cao hơn). Rê chuột để xem chi tiết.</p>`;
}
async function openDrawer(el, id) {
  el.hidden = false; el.innerHTML = '<div class="dcard"><p class="muted">Đang tải…</p></div>';
  const r = await fetch(`/api/admin/participant?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!r.ok) { el.innerHTML = `<div class="dcard"><button class="btn sm dx">Đóng</button><p class="err">Không tải được (${r.status}).</p></div>`; el.querySelector('.dx').onclick = () => (el.hidden = true); return; }
  const d = await r.json(), row = d.row, g = (k) => { const c = st.cols.find((x) => x.key === k); return c ? cellHtml(c, row) : ''; };
  const facts = ['kind', 'email', 'stage', 'firstSeen', 'lastSeen', 'daysActive', 'sessions', 'activeMin', 'userTurns', 'ageBand', 'gender', 'field', 'device', 'os', 'browser', 'ref', 'resonance', 'nps', 'quality', 'crisis', 'consent', 'remind'].map((k) => { const c = st.cols.find((x) => x.key === k); return c ? `<div><span>${esc(c.label)}</span><b>${g(k)}</b></div>` : ''; }).join('');
  const moods = d.mood.map((m) => `<span class="chip">${{ start: 'Đầu buổi', mid: 'Giữa buổi', end: 'Cuối buổi' }[m.phase] ?? m.phase}: ${m.value} · ${MOOD[m.value]}</span>`).join(' ') || '<span class="muted">Chưa tự đánh giá tâm trạng.</span>';
  const rowsT = d.turns.map((t, i) => `<tr><td class="num">${t.ut ?? i + 1}</td><td>${esc(t.ts?.slice(11) ?? '')}</td><td>${esc(t.phase ?? '')}</td><td class="num">${t.tok == null ? '–' : nf.format(t.tok)}</td><td><i class="dot" style="background:${EMO_COLOR[t.emo] ?? '#999'}"></i>${esc(st.emo[t.emo] ?? t.emo ?? '–')}</td><td class="num">${sgn(t.val, 1)}</td><td class="num">${fx(t.aro, 1)}</td><td class="num">${t.disc ?? '–'}</td><td>${esc(TONE[t.myTone] ?? t.myTone ?? '–')}</td><td class="num">${t.score ?? '–'}</td><td>${t.flags.map((f) => `<span class="chip warn">${esc(f)}</span>`).join(' ')}</td></tr>`).join('');
  const tl = d.timeline.map((e) => `<tr><td>${esc(e.ts)}</td><td>${esc(e.name)}</td><td class="muted">${esc(Object.entries(e.props).map(([k, v]) => `${k}=${v}`).join(' '))}</td></tr>`).join('');
  el.innerHTML = `<div class="dcard" role="dialog" aria-label="Hành trình ${esc(row.id)}"><div class="dh"><div><h2>${esc(row.email ?? row.id)}</h2><p class="sub" style="margin:0">${esc(row.id)} · ${esc(row.kind)} · đi tới "${esc(row.stage)}"</p></div><button class="btn dx">Đóng ✕</button></div>
    <div class="facts">${facts}</div>
    <h3>Đánh giá tổng hợp: ${g('tier')} · ${row.score}/100</h3>
    ${row.attentionWhy ? `<p class="bad">▲ ${esc(row.attentionWhy)}</p>` : ''}
    <ul class="evl">${(row.evalParts ?? []).map((x) => `<li><span class="el">${esc(x.label)}</span><span class="scorebar"><i style="width:${(x.got / x.max) * 100}%"></i></span><b>${x.got}/${x.max}</b><span class="muted">${esc(x.why)}</span></li>`).join('')}</ul>
    <p class="note" style="margin:2px 0 8px">Điểm cộng từ các phần trên (thời gian, lượt nói, quay lại, luận giải, cảm nhận, lan tỏa). Không phải dự báo, chỉ để sắp xếp và nhìn nhanh.</p>
    <h3>Token đã đốt</h3>${row.tokTotal == null ? '<p class="muted">Chưa có ghi nhận token cho người này (các lượt cũ không có số).</p>' : `<div class="facts"><div><span>Tổng token</span><b>${nf.format(row.tokTotal)}</b></div><div><span>% tổng của mọi người</span><b>${fx(row.tokShare, 1)}%</b></div><div><span>Mỗi lượt</span><b>${nf.format(row.tokPerTurn)}</b></div><div><span>Mỗi phút trò chuyện</span><b>${row.tokPerMin == null ? '–' : nf.format(row.tokPerMin)}</b></div><div><span>Vào (không đệm)</span><b>${nf.format(row.tokIn)}</b></div><div><span>Đọc từ đệm</span><b>${nf.format(row.tokCr)}</b></div><div><span>Ghi vào đệm</span><b>${nf.format(row.tokCw)}</b></div><div><span>Ra</span><b>${nf.format(row.tokOut)}</b></div>${row.costUsd != null ? `<div><span>Chi phí ước tính</span><b>$${fx(row.costUsd, 3)}</b></div>` : ''}</div>`}
    <h3>Tâm trạng tự báo</h3><p>${moods}${row.moodDelta != null ? ` <b class="${row.moodDelta > 0 ? 'good' : row.moodDelta < 0 ? 'bad' : ''}">${sgn(row.moodDelta, 0)} điểm</b>` : ''}</p>
    <h3>Hành trình sắc thái qua các lượt nói</h3>${turnChart(d.turns)}
    <p>${g('trend')} · cảm xúc nổi bật ${g('domEmo')} · mở lòng trung bình ${fx(row.discMean, 1)}/3 · giọng My hay dùng ${esc(TONE[row.myTone] ?? row.myTone ?? '–')}</p>
    <details open><summary>Từng lượt (${d.turns.length})</summary><div class="scroll"><table><thead><tr><th class="num">Lượt</th><th>Giờ</th><th>Giai đoạn</th><th class="num">Token</th><th>Cảm xúc</th><th class="num">Sắc thái</th><th class="num">Cường độ</th><th class="num">Mở lòng</th><th>Giọng My</th><th class="num">Điểm</th><th>Cờ</th></tr></thead><tbody>${rowsT || '<tr><td colspan="10" class="muted">Chưa có.</td></tr>'}</tbody></table></div></details>
    <details><summary>Dòng thời gian sự kiện (${d.timeline.length})</summary><div class="scroll"><table><tbody>${tl}</tbody></table></div></details>
    <p class="note">Không có nội dung trò chuyện trong dữ liệu này. Sắc thái và cảm xúc là ước lượng thô, chỉ dùng để nhìn xu hướng.</p></div>`;
  const close = () => (el.hidden = true);
  el.querySelector('.dx').onclick = close; el.onclick = (e) => { if (e.target === el) close(); };
}

export async function loadPeople(host, days) {
  host.innerHTML = '<p class="muted" style="padding:16px">Đang tải danh sách…</p>';
  const r = await fetch(`/api/admin/participants?days=${days}`, { cache: 'no-store' });
  if (!r.ok) { host.innerHTML = `<p class="err">Không tải được (${r.status}).</p>`; return; }
  st.data = await r.json(); st.cols = st.data.columns; st.emo = st.data.emotions;
  if (!st.data.priced) { const c = st.cols.find((x) => x.key === 'costUsd'); if (c) c.def = false; } // chưa khai đơn giá: không bày cột tiền
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_COLS)); } catch {}
  st.vis = new Set((Array.isArray(saved) ? saved.filter((k) => st.cols.some((c) => c.key === k)) : null)?.length ? saved : st.cols.filter((c) => c.def).map((c) => c.key));
  if (!st.data.priced) st.vis.delete('costUsd');
  try { st.size = +localStorage.getItem(LS_SIZE) || 25; } catch {}
  st.preset = 'all';
  render(host);
  let want = null; try { want = sessionStorage.getItem('hm_open_person'); sessionStorage.removeItem('hm_open_person'); } catch {}
  if (want) openDrawer(host.querySelector('#drawer'), want);
}
