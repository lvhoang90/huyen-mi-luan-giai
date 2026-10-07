// Tab "Thưởng tester" của trang quản trị: chấm điểm top tester theo nhiều tiêu chí, tặng phút (tự động theo hạng hoặc thủ công),
// xuất ảnh vinh danh để gửi nhóm tester, xem lịch sử và thu hồi quà. Tên hiển thị mặc định là email che bớt; quản trị tự sửa thành tên thật trước khi xuất ảnh.
import { esc, nf, download } from './admin-ui.js';

const DEFAULT_MSG = 'Chúc mừng bạn là một trong những tester xuất sắc nhất của Huyền My! Cảm ơn bạn đã dành thời gian trò chuyện và góp ý chân thành. Admin tặng bạn thêm thời gian trò chuyện với My.';
const fmtDate = (t) => new Date(t).toLocaleDateString('vi-VN');
const post = async (path, body) => { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { ok: r.ok, ...(await r.json().catch(() => ({}))) }; };
const state = { n: 5, minutes: 60, days: 30, msg: DEFAULT_MSG, names: {} };

export async function loadRewards(host) {
  host.innerHTML = '<p class="muted" style="padding:16px">Đang tải…</p>';
  const [tr, gr] = await Promise.all([fetch(`/api/admin/testers?n=${state.n}`, { cache: 'no-store' }), fetch('/api/admin/grants', { cache: 'no-store' })]);
  if (!tr.ok || !gr.ok) { host.innerHTML = `<p class="err">Không tải được (${tr.status}/${gr.status}).</p>`; return; }
  paint(host, await tr.json(), (await gr.json()).grants);
}

const nameOf = (x) => state.names[x.id] ?? x.masked;
function rankTable(r) {
  const head = r.criteria.map((c) => `<th class="num" title="${esc(c.hint)}">${esc(c.label)}<br><small>/${c.w}</small></th>`).join('');
  const rows = r.top.map((x) => `<tr><td><b>#${x.rank}</b></td><td><input type="text" class="nm" data-id="${x.id}" maxlength="30" value="${esc(nameOf(x))}" aria-label="Tên hiển thị hạng ${x.rank}"><div class="m">${esc(x.email)}${x.gifted ? ` · đã được tặng ${x.gifted} lần` : ''}</div></td><td class="num"><b>${x.score}</b></td>${x.parts.map((p) => `<td class="num">${p.pts}</td>`).join('')}<td class="m">${x.days} ngày, ${x.minutes} phút, ${x.feedbackN} góp ý, ${x.reports} báo cáo, ${x.qualified} bạn mời đạt, ${x.shares} chia sẻ</td></tr>`).join('');
  return `<div class="scroll"><table><thead><tr><th>Hạng</th><th>Tên hiển thị (sửa được)</th><th class="num">Điểm</th>${head}<th>Chi tiết</th></tr></thead><tbody>${rows || '<tr><td colspan="12" class="muted">Chưa có tester nào đủ điều kiện (cần trò chuyện từ 3 phút hoặc có góp ý).</td></tr>'}</tbody></table></div>`;
}
const statusOf = (g, t = Date.now()) => (g.revokedAt ? 'Đã thu hồi' : g.expiresAt && g.expiresAt <= t ? 'Hết hạn' : g.seenAt ? 'Đã xem' : 'Chưa xem');
function histTable(list) {
  const rows = list.map((g) => `<tr><td>${fmtDate(g.createdAt)}</td><td>${esc(g.email ?? '(đã xóa)')}</td><td class="num">+${g.minutes}</td><td>${g.days ? `${g.days} ngày (đến ${fmtDate(g.expiresAt)})` : 'không hết hạn'}</td><td>${g.rank ? '#' + g.rank : ''} ${esc(g.title ?? '')}</td><td>${statusOf(g)}</td><td>${g.revokedAt || (g.expiresAt && g.expiresAt <= Date.now()) ? '' : `<button type="button" class="btn" data-revoke="${g.id}">Thu hồi</button>`}</td></tr>`).join('');
  return `<div class="scroll"><table><thead><tr><th>Ngày tặng</th><th>Người nhận</th><th class="num">Phút/ngày</th><th>Thời hạn</th><th>Lời</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted">Chưa tặng quà nào.</td></tr>'}</tbody></table></div>`;
}

function paint(host, r, grants) {
  const field = (id, label, val, type = 'number', extra = '') => `<label class="fld"><span>${label}</span><input id="${id}" type="${type}" value="${esc(val)}" ${extra}></label>`;
  host.innerHTML = `<section class="panel"><h2>Chọn top tester xuất sắc</h2>
    <p class="sub">Chấm 0 đến 100 từ sáu tiêu chí: ${r.criteria.map((c) => `${esc(c.label)} ${c.w}`).join(', ')}. Mỗi tiêu chí lấy giá trị của từng người chia cho người cao nhất trong nhóm rồi lấy căn bậc hai, nên người nổi bật không ăn hết điểm; có hạn mức tối đa chặn việc cày số. Đủ điều kiện: ${nf.format(r.eligible)} tester (trò chuyện từ 3 phút hoặc có góp ý). Thành viên quản trị không tính.</p>
    <div class="row-actions rw-form">${field('rw-n', 'Số người', state.n, 'number', 'min="1" max="20"')}${field('rw-min', 'Phút thưởng mỗi ngày', state.minutes, 'number', 'min="1" max="600"')}${field('rw-days', 'Số ngày (0 = không hết hạn)', state.days, 'number', 'min="0" max="365"')}</div>
    <label class="fld wide"><span>Lời chúc hiện trên màn hình chúc mừng của tester</span><textarea id="rw-msg" rows="3" maxlength="400">${esc(state.msg)}</textarea></label>
    ${rankTable(r)}
    <div class="row-actions"><button type="button" class="btn" id="rw-reload">Chấm lại</button><button type="button" class="btn" id="rw-img">Xuất ảnh vinh danh</button><button type="button" class="btn primary" id="rw-grant">Tặng thưởng cho ${r.top.length} người này</button><span id="rw-out" class="m" role="status"></span></div>
    <div id="rw-prev"></div></section>
  <section class="panel"><h2>Tặng thưởng thủ công</h2><p class="sub">Tặng cho một thành viên theo email đã đăng ký. Người nhận sẽ thấy màn hình chúc mừng bắn pháo hoa khi vào hệ thống.</p>
    <div class="row-actions rw-form">${field('mg-email', 'Email thành viên', '', 'email', 'placeholder="ten@gmail.com"')}${field('mg-min', 'Phút mỗi ngày', 30)}${field('mg-days', 'Số ngày (0 = không hết hạn)', 30)}</div>
    <div class="row-actions rw-form">${field('mg-title', 'Tiêu đề', 'Quà từ Admin', 'text', 'maxlength="80"')}${field('mg-msg', 'Lời chúc', 'Cảm ơn bạn đã đồng hành cùng Huyền My.', 'text', 'maxlength="400" style="min-width:320px"')}<button type="button" class="btn primary" id="mg-go">Tặng</button><span id="mg-out" class="m" role="status"></span></div></section>
  <section class="panel"><h2>Lịch sử quà tặng</h2>${histTable(grants)}</section>`;
  wire(host, r);
}

function wire(host, r) {
  const $ = (s) => host.querySelector(s), say = (id, t) => { $(id).textContent = t; };
  const read = () => { state.n = Math.min(20, Math.max(1, +$('#rw-n').value || 5)); state.minutes = Math.round(+$('#rw-min').value) || 60; state.days = Math.max(0, Math.round(+$('#rw-days').value) || 0); state.msg = $('#rw-msg').value.trim() || DEFAULT_MSG; };
  host.querySelectorAll('.nm').forEach((i) => (i.oninput = () => { state.names[i.dataset.id] = i.value; }));
  $('#rw-reload').onclick = () => { read(); loadRewards(host); };
  $('#rw-img').onclick = async () => { read(); const c = await poster(r.top.map((x) => ({ ...x, name: nameOf(x) })), state); const prev = $('#rw-prev'); prev.innerHTML = ''; c.style.cssText = 'max-width:420px;width:100%;border-radius:12px;margin-top:12px;display:block'; prev.append(c, Object.assign(document.createElement('div'), { className: 'row-actions', innerHTML: '<button type="button" class="btn primary" id="rw-dl">Tải ảnh PNG</button>' })); $('#rw-dl').onclick = () => c.toBlob((b) => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'huyenmy-top-tester.png' }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png'); };
  const grant = $('#rw-grant');
  grant.onclick = async () => {
    read(); const again = r.top.filter((x) => x.gifted).length;
    if (grant.dataset.sure !== '1') { grant.dataset.sure = '1'; grant.textContent = `Bấm lần nữa để tặng +${state.minutes} phút/ngày${state.days ? ` trong ${state.days} ngày` : ''} cho ${r.top.length} người${again ? ` (${again} người đã được tặng trước đó)` : ''}`; setTimeout(() => { grant.dataset.sure = ''; grant.textContent = `Tặng thưởng cho ${r.top.length} người này`; }, 7000); return; }
    grant.disabled = true;
    const res = await post('/api/admin/grants', { items: r.top.map((x) => ({ userId: x.id, minutes: state.minutes, days: state.days, rank: x.rank, title: 'Tester xuất sắc', message: state.msg })) });
    grant.disabled = false; grant.dataset.sure = '';
    if (res.ok) { await loadRewards(host); host.querySelector('#rw-out').textContent = `Đã tặng cho ${res.done.length} người${res.failed.length ? `, lỗi ${res.failed.length}` : ''}. Họ sẽ thấy màn hình chúc mừng khi vào hệ thống.`; } else say('#rw-out', res.error ?? 'Không tặng được.');
  };
  $('#mg-go').onclick = async () => {
    const res = await post('/api/admin/grants', { items: [{ email: $('#mg-email').value, minutes: $('#mg-min').value, days: $('#mg-days').value, title: $('#mg-title').value, message: $('#mg-msg').value }] });
    if (res.ok) { await loadRewards(host); host.querySelector('#mg-out').textContent = 'Đã tặng. Người nhận sẽ thấy màn hình chúc mừng khi vào hệ thống.'; } else say('#mg-out', res.error ?? res.failed?.[0]?.error ?? 'Không tặng được.');
  };
  host.querySelectorAll('[data-revoke]').forEach((b) => (b.onclick = async () => { if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Chắc chưa?'; return; } await post('/api/admin/grants/revoke', { id: +b.dataset.revoke }); loadRewards(host); }));
}

// ---------- ảnh vinh danh 1080 x 1350 ----------
const MEDAL = ['#f2c94c', '#cfd3da', '#d99a5b'];
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function fit(ctx, text, max) { let t = String(text); while (ctx.measureText(t).width > max && t.length > 1) t = t.slice(0, -1); return t === String(text) ? t : t + '…'; }
export async function poster(winners, { minutes, days }) {
  try { await Promise.all([document.fonts.load('600 60px "Cormorant Garamond"'), document.fonts.load('500 30px "Be Vietnam Pro"')]); } catch {}
  const W = 1080, H = 1350, c = Object.assign(document.createElement('canvas'), { width: W, height: H }), x = c.getContext('2d');
  const serif = '"Cormorant Garamond", Georgia, "Times New Roman", serif', sans = '"Be Vietnam Pro", system-ui, "Segoe UI", sans-serif';
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2b1d78'); g.addColorStop(0.55, '#150f45'); g.addColorStop(1, '#0a0730'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < 90; i++) { x.globalAlpha = 0.2 + rnd() * 0.6; x.fillStyle = '#f7e6b0'; x.beginPath(); x.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 1.6, 0, 6.283); x.fill(); } x.globalAlpha = 1;
  x.textAlign = 'center'; x.fillStyle = '#e9cf88'; x.font = `500 28px ${sans}`; x.fillText('HUYỀN MY LUẬN GIẢI', W / 2, 92);
  x.fillStyle = '#fff'; x.font = `600 92px ${serif}`; x.fillText(`Top ${winners.length}`, W / 2, 190); x.fillStyle = '#e9cf88'; x.font = `italic 600 64px ${serif}`; x.fillText('tester xuất sắc nhất', W / 2, 262);
  x.fillStyle = '#cfc6ee'; x.font = `400 26px ${sans}`; x.fillText('Cảm ơn các bạn đã đồng hành và góp ý chân thành', W / 2, 314);
  const top = 360, gap = 18, rowH = Math.min(150, Math.floor((H - top - 230 - gap * (winners.length - 1)) / Math.max(1, winners.length)));
  winners.forEach((w, i) => {
    const y = top + i * (rowH + gap), hi = i < 3;
    x.fillStyle = hi ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)'; rr(x, 70, y, W - 140, rowH, 26); x.fill(); x.strokeStyle = hi ? 'rgba(233,207,136,.6)' : 'rgba(233,207,136,.25)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = MEDAL[i] ?? '#7d6cf0'; x.beginPath(); x.arc(150, y + rowH / 2, Math.min(44, rowH / 2 - 12), 0, 6.283); x.fill();
    x.fillStyle = i < 3 ? '#2a1b05' : '#fff'; x.font = `600 ${Math.round(rowH * 0.34)}px ${serif}`; x.textBaseline = 'middle'; x.fillText(String(w.rank), 150, y + rowH / 2 + 2);
    x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = `600 ${Math.round(rowH * 0.27)}px ${sans}`; x.fillText(fit(x, w.name, 560), 225, y + rowH * 0.36);
    const best = [...w.parts].sort((a, b) => b.pts / b.w - a.pts / a.w).slice(0, 2).map((p) => p.label).join(' · ');
    x.fillStyle = '#cfc6ee'; x.font = `400 ${Math.round(rowH * 0.18)}px ${sans}`; x.fillText(fit(x, `Nổi bật: ${best}`, 560), 225, y + rowH * 0.69);
    x.textAlign = 'right'; x.fillStyle = '#e9cf88'; x.font = `600 ${Math.round(rowH * 0.38)}px ${serif}`; x.fillText(String(Math.round(w.score)), W - 130, y + rowH * 0.46); x.fillStyle = '#b8aedf'; x.font = `400 ${Math.round(rowH * 0.16)}px ${sans}`; x.fillText('điểm', W - 130, y + rowH * 0.76);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  });
  const by = H - 200; x.fillStyle = 'rgba(233,207,136,.14)'; rr(x, 70, by, W - 140, 118, 26); x.fill(); x.strokeStyle = 'rgba(233,207,136,.55)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#fff'; x.font = `600 38px ${sans}`; x.fillText(`Mỗi bạn được tặng +${minutes} phút mỗi ngày`, W / 2, by + 52); x.fillStyle = '#e9cf88'; x.font = `400 28px ${sans}`; x.fillText(days ? `trong ${days} ngày, từ Admin Huyền My` : 'không giới hạn thời gian, từ Admin Huyền My', W / 2, by + 94);
  x.fillStyle = '#b8aedf'; x.font = `400 22px ${sans}`; x.fillText('huyenmy.isavietnam.app', W / 2, H - 40);
  return c;
}
