import './admin.css';

const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('vi-VN');
const pct = (w, d = 0) => (w?.p == null ? '–' : `${(w.p * 100).toFixed(d)}%`);
const ci = (w) => (w?.p == null ? '' : `KTC 95%: ${Math.round(w.lo * 100)}–${Math.round(w.hi * 100)}%, n=${nf.format(w.n)}`);
const SEV = { critical: ['▲', 'Nghiêm trọng'], warn: ['●', 'Cần xem'], info: ['○', 'Gợi ý'] };
let days = +(new URLSearchParams(location.search).get('days')) || 14, data = null;

async function load() {
  const r = await fetch(`/api/admin/metrics?days=${days}`, { cache: 'no-store' });
  if (r.status === 401) return renderLogin();
  if (r.status === 403) return renderDenied();
  if (!r.ok) return (app.innerHTML = `<div class="wrap"><p class="err">Không tải được số liệu (${r.status}).</p></div>`);
  data = await r.json(); render();
}

/* ---------- đăng nhập quản trị (cùng cơ chế email) ---------- */
function renderLogin() {
  app.innerHTML = `<div class="wrap"><div class="panel login"><h1>Quản trị Huyền My</h1><p class="sub">Đăng nhập bằng email quản trị. My gửi một mã 6 số, không cần mật khẩu.</p>
    <div class="row"><input id="em" type="email" placeholder="Email quản trị" autocomplete="email" aria-label="Email quản trị"><button class="btn primary" id="send">Gửi mã</button></div>
    <div class="row" id="step2" hidden><input id="cd" inputmode="numeric" maxlength="6" placeholder="Mã 6 số" autocomplete="one-time-code" aria-label="Mã"><button class="btn primary" id="ok">Vào</button></div><p class="err" id="msg" role="alert"></p></div></div>`;
  const $ = (id) => document.getElementById(id), post = (p, b) => fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));
  $('send').onclick = async () => { const r = await post('/api/auth/request', { email: $('em').value }); $('msg').textContent = r.ok ? '' : r.error; if (r.ok) $('step2').hidden = false; };
  $('ok').onclick = async () => { const r = await post('/api/auth/verify', { email: $('em').value, code: $('cd').value }); if (r.ok) load(); else $('msg').textContent = r.error; };
}
function renderDenied() {
  app.innerHTML = `<div class="wrap"><div class="panel login"><h1>Không có quyền</h1><p class="sub">Tài khoản này không phải quản trị viên. Quản trị viên được khai báo bằng biến môi trường <code>ADMIN_EMAILS</code> trên máy chủ.</p><button class="btn" id="out">Đăng xuất</button></div></div>`;
  document.getElementById('out').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); load(); };
}

/* ---------- thành phần ---------- */
function insightCard(i) {
  const [ic, lab] = SEV[i.severity];
  return `<article class="insight ${i.severity}"><h3><span class="chip ${i.severity}"><span aria-hidden="true">${ic}</span>${lab}</span>${esc(i.title)}</h3>
    <p class="why">${esc(i.evidence)}</p><p><b>Đề xuất:</b> ${esc(i.action)}</p>
    <div class="meta"><span>Tác động ${i.impact}/5</span><span>Độ tin cậy dữ liệu ${i.confidence}/5</span><span>Công sức ${i.effort}/5</span><span>Điểm ưu tiên ${i.score}</span></div></article>`;
}
function frameworkTable(title, obj) {
  const rows = Object.entries(obj).map(([k, v]) => `<tr><td>${esc(k.trim())}</td><td class="num"><b>${v.value == null ? '–' : esc(nf.format(v.value)) + (v.unit ?? '')}</b></td><td class="muted">${esc(v.note)}</td></tr>`).join('');
  return `<div class="panel"><h2>${esc(title)}</h2><div class="scroll"><table><thead><tr><th>Chỉ số</th><th class="num">Giá trị</th><th>Cách đo</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function funnel(f) {
  const top = f[0].count || 1;
  const rows = f.map((s, i) => `<div class="frow"><div>${esc(s.label)}</div><div class="bar" role="img" aria-label="${esc(s.label)}: ${s.count}"><i style="width:${Math.max(1, (s.count / top) * 100)}%"></i></div>
    <div class="c"><b>${nf.format(s.count)}</b>${i ? ` · ${pct(s.fromPrev)} từ bước trước` : ''}</div></div>`).join('');
  const table = f.map((s, i) => `<tr><td>${esc(s.label)}</td><td class="num">${nf.format(s.count)}</td><td class="num">${i ? pct(s.fromPrev, 1) : '–'}</td><td class="muted">${i ? ci(s.fromPrev) : ''}</td><td class="num">${pct(s.fromTop, 1)}</td></tr>`).join('');
  return `${rows}<details><summary>Xem dạng bảng, kèm khoảng tin cậy</summary><div class="scroll"><table><thead><tr><th>Bước</th><th class="num">Người</th><th class="num">Từ bước trước</th><th>Độ chắc chắn</th><th class="num">Từ đầu phễu</th></tr></thead><tbody>${table}</tbody></table></div></details>`;
}
/** Biểu đồ đường 3 chuỗi, có chú giải, nhãn cuối đường, đường dóng và chú thích khi rê chuột. */
function lineChart(series) {
  const W = 760, H = 240, L = 40, R = 90, T = 14, B = 28, keys = [['visitors', 'Người mở trang', 'var(--s1)'], ['started', 'Bắt đầu trò chuyện', 'var(--s2)'], ['signups', 'Đăng ký xong', 'var(--s3)']];
  const n = series.length, max = Math.max(5, ...series.flatMap((d) => keys.map(([k]) => d[k]))), nice = Math.ceil(max / 5) * 5;
  const x = (i) => L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R)), y = (v) => T + (1 - v / nice) * (H - T - B);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((t) => { const v = Math.round(nice * t), yy = y(v); return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--grid)"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" fill="var(--muted)" font-size="11">${v}</text>`; }).join('');
  const lines = keys.map(([k, , c]) => `<polyline fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" points="${series.map((d, i) => `${x(i)},${y(d[k])}`).join(' ')}"/>`).join('');
  const ends = keys.map(([k, lab, c], j) => `<circle cx="${x(n - 1)}" cy="${y(series[n - 1][k])}" r="4" fill="${c}" stroke="var(--surface)" stroke-width="2"/><text x="${x(n - 1) + 8}" y="${y(series[n - 1][k]) + 4 + (j === 2 ? 10 : 0)}" fill="var(--ink2)" font-size="11.5">${nf.format(series[n - 1][k])}</text>`).join('');
  const step = Math.ceil(n / 7), xt = series.map((d, i) => (i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" fill="var(--muted)" font-size="11">${esc(d.day.slice(5))}</text>` : '')).join('');
  const table = series.map((d) => `<tr><td>${esc(d.day)}</td><td class="num">${d.visitors}</td><td class="num">${d.started}</td><td class="num">${d.signups}</td></tr>`).join('');
  return `<div class="legend">${keys.map(([, lab, c]) => `<span><i style="background:${c}"></i>${lab}</span>`).join('')}</div>
    <div class="chart" id="lc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Số người theo ngày"><g>${grid}${xt}${lines}${ends}</g><line id="cross" y1="${T}" y2="${H - B}" stroke="var(--axis)" visibility="hidden"/><rect id="hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/></svg><div class="tip" id="tip" hidden></div></div>
    <details><summary>Xem dạng bảng</summary><div class="scroll"><table><thead><tr><th>Ngày</th><th class="num">Mở trang</th><th class="num">Bắt đầu</th><th class="num">Đăng ký</th></tr></thead><tbody>${table}</tbody></table></div></details>`;
}
function wireLine(series) {
  const box = document.getElementById('lc'); if (!box) return;
  const svg = box.querySelector('svg'), hit = box.querySelector('#hit'), cross = box.querySelector('#cross'), tip = box.querySelector('#tip');
  const W = 760, L = 40, R = 90, n = series.length;
  const move = (ev) => {
    const rect = svg.getBoundingClientRect(), px = ((ev.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1)))), xx = L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R)), d = series[i];
    cross.setAttribute('x1', xx); cross.setAttribute('x2', xx); cross.setAttribute('visibility', 'visible');
    tip.hidden = false; tip.innerHTML = `<b>${esc(d.day)}</b><br>Mở trang ${d.visitors} · Bắt đầu ${d.started} · Đăng ký ${d.signups}`;
    tip.style.left = `${(xx / W) * rect.width}px`; tip.style.top = `${ev.clientY - rect.top}px`;
  };
  hit.addEventListener('pointermove', move); hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; });
}
function heat(v) { if (v == null) return '<td class="muted">–</td>'; const a = Math.min(1, v / 0.5); return `<td><div class="heat" style="background:color-mix(in srgb, var(--s1) ${Math.round(a * 70)}%, transparent)">${(v * 100).toFixed(0)}%</div></td>`; }
function cohorts(r) {
  const rows = r.cohorts.map((c) => `<tr><td>${esc(c.day)}</td><td class="num">${c.n}</td>${heat(c.d1)}${heat(c.d3)}${heat(c.d7)}</tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có cohort.</td></tr>';
  return `<div class="kpis"><div class="kpi"><div class="v">${pct(r.d1)}</div><div class="l">Quay lại sau 1 ngày</div><div class="n">${ci(r.d1)}</div></div><div class="kpi"><div class="v">${pct(r.d3)}</div><div class="l">Sau 3 ngày</div><div class="n">${ci(r.d3)}</div></div><div class="kpi"><div class="v">${pct(r.d7)}</div><div class="l">Sau 7 ngày</div><div class="n">${ci(r.d7)}</div></div></div>
    <div class="scroll" style="margin-top:12px"><table><thead><tr><th>Ngày đầu</th><th class="num">Người</th><th>D1</th><th>D3</th><th>D7</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
const FLAG_LABEL = { qua_nhieu_cau_hoi: 'Hỏi dồn nhiều câu', qua_dai: 'Trả lời quá dài', lap_lai: 'Lặp ý hoặc lặp lời mở đầu', noi_chac_nich: 'Nói chắc nịch, tiên đoán', doa_han_hoac_ban_cung: 'Dọa hạn, gợi ý cúng bái', thieu_nhan_tang: 'Luận giải thiếu nhãn tầng', thieu_canh_bao_gioi_han: 'Luận giải thiếu cảnh báo giới hạn', khong_bam_loi_nguoi_dung: 'Không bám lời người dùng', cum_sao_ron: 'Khuôn sáo nghe như máy viết sẵn', lap_cum_tu: 'Lặp cụm từ giữa các lượt', vien_dan_nhieu: 'Viện dẫn tâm lý học, khoa học quá dày' };
function quality(q) {
  const rows = Object.entries(q.flags).map(([k, w]) => `<tr><td>${esc(FLAG_LABEL[k] ?? k)}</td><td class="num"><b>${pct(w, 1)}</b></td><td class="muted">${ci(w)}</td></tr>`).join('');
  const cr = q.crisis, ms = (v) => (v == null ? '–' : `${(v / 1000).toFixed(1)} giây`);
  return `<div class="kpis"><div class="kpi"><div class="v">${q.meanScore ?? '–'}</div><div class="l">Điểm chất lượng trung bình (0-100)</div><div class="n">${nf.format(q.turns)} lượt trả lời</div></div>
    <div class="kpi"><div class="v">${cr.safety?.p == null ? '–' : pct(cr.safety)}</div><div class="l">An toàn khi khủng hoảng</div><div class="n">${cr.handled} có hỗ trợ · ${cr.missed} thiếu</div></div>
    <div class="kpi"><div class="v">${ms(q.latency.p50)}</div><div class="l">Thời gian trả lời (trung vị)</div><div class="n">Phân vị 95: ${ms(q.latency.p95)}</div></div>
    <div class="kpi"><div class="v">${pct(q.errors, 1)}</div><div class="l">Tỉ lệ lỗi gọi AI</div><div class="n">${ci(q.errors)}</div></div></div>
    <div class="scroll" style="margin-top:12px"><table><thead><tr><th>Dấu hiệu cần xem lại</th><th class="num">Tỉ lệ lượt</th><th>Độ chắc chắn</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="note">Mỗi lượt được chấm bằng quy tắc minh bạch ngay trên máy chủ. Hệ thống không lưu nội dung trò chuyện, chỉ lưu chỉ số: số từ, số câu hỏi, độ lặp, số chi tiết người dùng được nhắc lại và các cờ an toàn. Trung bình ${q.meanQuestions ?? '–'} câu hỏi và ${q.meanWords ?? '–'} từ mỗi lượt.</p>`;
}
function satisfaction(s, intro) {
  const r = s.resonance, tot = r.n || 1, cols = ['var(--seq1)', 'var(--seq2)', 'var(--seq4)'], names = ['Chưa đúng lắm', 'Gần đúng', 'Rất đúng'];
  const bar = r.dist.map((v, i) => `<span style="flex:${v};background:${cols[i]}" title="${names[i]}: ${v}"></span>`).join('');
  const key = r.dist.map((v, i) => `<span><i style="background:${cols[i]}"></i>${names[i]} ${Math.round((v / tot) * 100)}% (${v})</span>`).join('');
  const nps = s.nps;
  return `<div class="kpis"><div class="kpi"><div class="v">${pct(r.good)}</div><div class="l">Cho rằng My nói đúng (gần đúng trở lên)</div><div class="n">${ci(r.good)}</div></div>
    <div class="kpi"><div class="v">${pct(r.strong)}</div><div class="l">Cho rằng "rất đúng"</div><div class="n">${ci(r.strong)}</div></div>
    <div class="kpi"><div class="v">${nps.score ?? '–'}</div><div class="l">NPS (muốn giới thiệu bạn bè)</div><div class="n">n=${nps.n}: ${nps.promoters} ủng hộ, ${nps.passives} trung lập, ${nps.detractors} chưa hài lòng</div></div>
    <div class="kpi"><div class="v">${pct(intro?.skipFirstVisit)}</div><div class="l">Bỏ qua màn mở đầu (lần đầu)</div><div class="n">${ci(intro?.skipFirstVisit) || 'Chưa có dữ liệu'}. Trên 40% thì nên rút ngắn.</div></div></div>
    <div class="stack" role="img" aria-label="Phân bố đánh giá độ đúng">${bar}</div><div class="stackkey">${key}</div>
    <p class="note">Lưu ý hiệu ứng Barnum: người dùng dễ thấy lời nói chung chung là "đúng với mình". Đừng dùng điểm này một mình để kết luận My chính xác; hãy đọc cùng tỉ lệ "bám lời người dùng" và phản hồi tự do.</p>`;
}
function segTable(title, rows) {
  const body = rows.map((g) => `<tr><td>${esc(g.name)}</td><td class="num">${g.n}</td><td class="num">${pct(g.firstMessage)}</td><td class="num">${g.resonance ? pct(g.resonance) : '–'}</td><td class="num">${pct(g.verified)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có dữ liệu.</td></tr>';
  return `<div class="panel"><h2>${esc(title)}</h2><div class="scroll"><table><thead><tr><th>Nhóm</th><th class="num">Người</th><th class="num">Bắt đầu</th><th class="num">Đúng ≥ gần đúng</th><th class="num">Đăng ký</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}
const listTable = (rows, a, b) => `<div class="scroll"><table><tbody>${rows.map((r) => `<tr><td>${esc(r[a])}</td><td class="num">${r[b]}</td></tr>`).join('') || '<tr><td class="muted">Chưa có dữ liệu.</td></tr>'}</tbody></table></div>`;

function render() {
  const m = data, f = (k) => m.funnel.find((x) => x.key === k);
  const crit = m.insights.filter((i) => i.severity === 'critical').length;
  app.innerHTML = `<div class="wrap">
    <header class="top"><div><h1>Quản trị Huyền My</h1><p class="sub" style="margin:2px 0 0">Kỳ ${m.range.days} ngày, tính theo giờ Việt Nam. Cập nhật ${new Date(m.range.to).toLocaleString('vi-VN')}.</p></div>
      <div class="toolbar"><div class="seg" role="group" aria-label="Khoảng thời gian">${[7, 14, 30, 90].map((d) => `<button data-d="${d}" aria-pressed="${d === days}">${d} ngày</button>`).join('')}</div>
        <button class="btn" id="exp">Tải JSON</button><button class="btn" id="out">Đăng xuất</button></div></header>

    <section class="panel"><h2>Khuyến nghị ưu tiên ${crit ? `<span class="chip critical">▲ ${crit} việc nghiêm trọng</span>` : ''}</h2>
      <p class="sub">Sinh tự động từ số liệu, xếp theo mức nghiêm trọng rồi điểm ưu tiên (tác động × độ tin cậy dữ liệu ÷ công sức). Khi mẫu còn nhỏ, độ tin cậy thấp sẽ hạ điểm, và hệ thống nói rõ "chưa đủ dữ liệu" thay vì kết luận vội.</p>
      ${m.insights.length ? m.insights.map(insightCard).join('') : '<p class="muted">Chưa có khuyến nghị nào. Các chỉ số đang trong ngưỡng.</p>'}</section>

    <section class="kpis" style="margin-bottom:16px">
      <div class="kpi"><div class="v">${nf.format(m.visitors)}</div><div class="l">Người mở trang</div><div class="n">${nf.format(m.accounts.newInRange)} tài khoản mới · ${nf.format(m.accounts.total)} tổng</div></div>
      <div class="kpi"><div class="v">${pct(f('first_message').fromTop)}</div><div class="l">Kích hoạt (nói câu đầu)</div><div class="n">${ci(f('first_message').fromTop)}</div></div>
      <div class="kpi"><div class="v">${m.sessions.medianMin ?? '–'}′</div><div class="l">Thời lượng buổi (trung vị)</div><div class="n">${m.sessions.meanMsgs ?? '–'} tin nhắn mỗi buổi</div></div>
      <div class="kpi"><div class="v">${pct(m.sessions.reachedCap)}</div><div class="l">Đi trọn 30 phút</div><div class="n">${ci(m.sessions.reachedCap)}</div></div>
      <div class="kpi"><div class="v">${pct(f('signup_verified').fromTop, 1)}</div><div class="l">Đăng ký xong / người mở trang</div><div class="n">${ci(f('signup_verified').fromTop)}</div></div></section>

    <section class="panel"><h2>Hành trình khách hàng</h2><p class="sub">Số người duy nhất đi tới từng bước. "Từ bước trước" là tỉ lệ chuyển đổi, kèm khoảng tin cậy ở bảng bên dưới.</p>${funnel(m.funnel)}</section>
    <section class="panel"><h2>Theo ngày</h2><p class="sub">Người mở trang, người bắt đầu trò chuyện và người đăng ký xong mỗi ngày.</p>${lineChart(m.series)}</section>
    <div class="grid2"><section class="panel"><h2>Giữ chân</h2><p class="sub">Tỉ lệ người mới quay lại đúng ngày thứ 1, 3, 7 sau lần đầu.</p>${cohorts(m.retention)}</section>
      <section class="panel"><h2>Hài lòng và độ đúng</h2><p class="sub">Đánh giá sau luận giải và điểm giới thiệu cuối buổi.</p>${satisfaction(m.satisfaction, m.intro)}</section></div>
    <section class="panel" style="margin-top:16px"><h2>Chất lượng tư vấn</h2><p class="sub">An toàn, độ bám người dùng, độ lặp và tốc độ của từng lượt trả lời.</p>${quality(m.quality)}</section>
    <div class="grid2">${segTable('Theo nhóm tuổi', m.segments.age)}${segTable('Theo lĩnh vực làm việc', m.segments.field)}</div>
    <div class="grid2" style="margin-top:16px"><section class="panel"><h2>Gợi ý bắt đầu được chọn</h2>${listTable(m.startChoices, 'name', 'n')}</section><section class="panel"><h2>Giới thiệu</h2><p class="sub">Chia sẻ thẻ: ${pct(m.growth.share)} (${ci(m.growth.share)}).</p>${listTable(m.growth.referrals, 'ref', 'n')}</section></div>
    <div class="grid2" style="margin-top:16px">${frameworkTable('AARRR (thu hút, kích hoạt, giữ chân, giới thiệu, doanh thu)', m.frameworks.AARRR)}${frameworkTable('HEART (hài lòng, tham gia, tiếp nhận, giữ chân, hoàn thành)', m.frameworks.HEART)}</div>
    <section class="panel" style="margin-top:16px"><h2>Phương pháp và quyền riêng tư</h2>
      <p class="note">Khung đo: AARRR (McClure, 2007), HEART (Rodden và cộng sự, Google, 2010), NPS (Reichheld, 2003). Mọi tỉ lệ có khoảng tin cậy Wilson 95%; khuyến nghị chỉ kết luận khi đủ cỡ mẫu. Người dùng được nhận diện bằng mã ẩn danh trong cookie; sự kiện chỉ gồm tên bước và vài giá trị ngắn, không chứa nội dung trò chuyện, tên hay ngày sinh. Nội dung trò chuyện chỉ được lưu khi người dùng đã đăng nhập và đồng ý, mã hóa nếu đặt <code>HUYENMY_DATA_KEY</code>, và xóa được cùng tài khoản.</p></section>
    <p class="note" style="text-align:center;margin-top:18px">© 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.</p></div>`;
  app.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { days = +b.dataset.d; history.replaceState(null, '', `?days=${days}`); load(); }));
  document.getElementById('out').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); load(); };
  document.getElementById('exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = `huyenmy-${days}d.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };
  wireLine(m.series);
}
load();
