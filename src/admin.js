import './admin.css';
import { esc, nf, pct, ci, download, toCsv } from './admin-ui.js';
import { renderJourney, wireJourney } from './admin-journey.js';
import { loadPeople } from './admin-people.js';
import { initViz, tile, ring, barList, funnelChart, areaChart, cohortHeat, npsBar, agreeBar, feelBar } from './admin-viz.js';

const app = document.getElementById('app');
const SEV = { critical: ['▲', 'Nghiêm trọng'], warn: ['●', 'Cần xem'], info: ['○', 'Gợi ý'] };
let days = +(new URLSearchParams(location.search).get('days')) || 14, data = null, journey = null;
const TABS = [['tong-quan', 'Tổng quan'], ['cam-xuc', 'Cảm xúc'], ['nguoi', 'Người dùng'], ['tang-truong', 'Tăng trưởng'], ['chat-luong', 'Chất lượng'], ['gop-y', 'Góp ý'], ['phuong-phap', 'Phương pháp']];
const tabNow = () => { const h = location.hash.replace(/^#\/?/, ''); return TABS.some(([k]) => k === h) ? h : 'tong-quan'; };

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

const FLAG_LABEL = { qua_nhieu_cau_hoi: 'Hỏi dồn nhiều câu', qua_dai: 'Trả lời quá dài', lap_lai: 'Lặp ý hoặc lặp lời mở đầu', noi_chac_nich: 'Nói chắc nịch, tiên đoán', doa_han_hoac_ban_cung: 'Dọa hạn, gợi ý cúng bái', thieu_nhan_tang: 'Luận giải thiếu nhãn tầng', thieu_canh_bao_gioi_han: 'Luận giải thiếu cảnh báo giới hạn', khong_bam_loi_nguoi_dung: 'Không bám lời người dùng', cum_sao_ron: 'Khuôn sáo nghe như máy viết sẵn', lap_cum_tu: 'Lặp cụm từ giữa các lượt', qua_nhieu_he: 'Trộn nhiều hệ (Tử Vi, Tứ Trụ, chiêm tinh…) một lượt', vien_dan_nhieu: 'Viện dẫn tâm lý học, khoa học quá dày' };
/* ---------- thành phần (bố cục ưu tiên điện thoại, biểu đồ trong admin-viz.js) ---------- */
/** Nửa sau kỳ so với nửa đầu kỳ: chỉ nói hướng và độ lớn, không phán tốt xấu. */
function half(series, k) {
  const n = series.length; if (n < 6) return null;
  const a = series.slice(0, n >> 1).reduce((s, d) => s + d[k], 0), b = series.slice(n >> 1).reduce((s, d) => s + d[k], 0);
  if (!a) return b ? { text: 'mới bắt đầu có', dir: 'up' } : null;
  const p = Math.round(((b - a) / a) * 100);
  return { text: `${Math.abs(p)}% so với nửa đầu kỳ`, dir: p > 3 ? 'up' : p < -3 ? 'down' : 'flat' };
}
function insightCard(i, open = false) {
  const [ic, lab] = SEV[i.severity];
  return `<details class="ins ${i.severity}"${open ? ' open' : ''}><summary><span class="ins-ic" aria-hidden="true">${ic}</span><span class="ins-t">${esc(i.title)}</span><span class="ins-p" title="Điểm ưu tiên">${i.score}</span></summary>
    <div class="ins-b"><span class="chip ${i.severity}">${lab}</span><p class="why">${esc(i.evidence)}</p><p><b>Đề xuất:</b> ${esc(i.action)}</p>
    <div class="meta"><span>Tác động ${i.impact}/5</span><span>Độ tin cậy dữ liệu ${i.confidence}/5</span><span>Công sức ${i.effort}/5</span></div></div></details>`;
}
function insightsBlock(list) {
  const c = { critical: 0, warn: 0, info: 0 }; list.forEach((i) => c[i.severity]++);
  const chips = ['critical', 'warn', 'info'].filter((k) => c[k]).map((k) => `<span class="chip ${k}"><span aria-hidden="true">${SEV[k][0]}</span>${c[k]} ${SEV[k][1].toLowerCase()}</span>`).join('');
  const first = list.slice(0, 3), rest = list.slice(3);
  return `<section class="panel"><div class="ph2"><h2>Khuyến nghị ưu tiên</h2><div class="chips">${chips}</div></div>
    <p class="sub">Tự động từ số liệu, xếp theo mức nghiêm trọng rồi điểm ưu tiên (tác động × độ tin cậy ÷ công sức). Mẫu còn nhỏ thì nói "chưa đủ dữ liệu" thay vì kết luận vội. Chạm một dòng để xem lý do.</p>
    ${list.length ? first.map((i) => insightCard(i, i.severity === 'critical')).join('') : '<p class="muted">Chưa có khuyến nghị nào. Các chỉ số đang trong ngưỡng.</p>'}
    ${rest.length ? `<details class="more"><summary>Xem thêm ${rest.length} khuyến nghị</summary>${rest.map((i) => insightCard(i)).join('')}</details>` : ''}</section>`;
}
function frameworkGrid(title, obj) {
  const cells = Object.entries(obj).map(([k, v]) => `<div class="fwc"><b>${v.value == null ? '–' : esc(nf.format(v.value)) + (v.unit ?? '')}</b><span>${esc(k.trim())}</span><small>${esc(v.note)}</small></div>`).join('');
  return `<details class="panel fw"><summary><h2>${esc(title)}</h2></summary><div class="fwg">${cells}</div></details>`;
}
const wl = (w) => (w?.p == null ? '' : `KTC ${Math.round(w.lo * 100)}–${Math.round(w.hi * 100)}%, n=${nf.format(w.n)}`);

function overviewTab(m) {
  const f = (k) => m.funnel.find((x) => x.key === k) ?? { count: 0 }, s = m.series, sp = (k) => s.map((d) => d[k]);
  const act = f('first_message').fromTop, su = f('signup_verified').fromTop;
  return `<section class="tiles">
      ${tile({ label: 'Người mở trang', value: nf.format(m.visitors), sub: `${nf.format(m.accounts.newInRange)} tài khoản mới · ${nf.format(m.accounts.total)} tổng`, spark: sp('visitors'), delta: half(s, 'visitors'), tone: 's1' })}
      ${tile({ label: 'Bắt đầu trò chuyện', value: nf.format(f('first_message').count), sub: act?.p == null ? '' : `${Math.round(act.p * 100)}% người mở trang`, spark: sp('started'), delta: half(s, 'started'), tone: 's2' })}
      ${tile({ label: 'Đăng ký xong', value: nf.format(f('signup_verified').count), sub: su?.p == null ? '' : `${(su.p * 100).toFixed(1)}% người mở trang`, spark: sp('signups'), delta: half(s, 'signups'), tone: 's3' })}
      ${tile({ label: 'Một buổi trò chuyện', value: `${m.sessions.medianMin ?? '–'}′`, sub: `${m.sessions.meanMsgs ?? '–'} tin nhắn mỗi buổi (trung bình)`, tone: 's4', tipText: 'Thời lượng trung vị của một buổi' })}</section>
    <section class="panel"><h2>Sức khỏe sản phẩm</h2><p class="sub">Bốn tỉ lệ chính. Vòng càng đầy càng tốt; chạm để xem khoảng tin cậy.</p>
      <div class="rings">${ring(act?.p, { label: 'Kích hoạt', sub: 'nói câu đầu', tone: 's2', w: act })}${ring(m.sessions.reachedCap?.p, { label: 'Đi trọn 30′', sub: 'hết giờ buổi', tone: 's4', w: m.sessions.reachedCap })}${ring(m.retention.d1?.p, { label: 'Quay lại 1 ngày', sub: 'sau lần đầu', tone: 's3', w: m.retention.d1 })}${ring(m.satisfaction.resonance.good?.p, { label: 'My nói đúng', sub: 'gần đúng trở lên', tone: 's1', w: m.satisfaction.resonance.good })}</div></section>
    ${insightsBlock(m.insights)}
    <section class="panel"><h2>Hành trình khách hàng</h2><p class="sub">Số người duy nhất đi tới từng bước, và bao nhiêu phần trăm đi tiếp từ bước trước.</p>${funnelChart(m.funnel)}</section>
    <section class="panel"><h2>Theo ngày</h2><p class="sub">Người mở trang, bắt đầu trò chuyện và đăng ký xong mỗi ngày. Chạm vào biểu đồ để xem từng ngày.</p>${areaChart(s, [['visitors', 'Mở trang', 'var(--s1)'], ['started', 'Bắt đầu trò chuyện', 'var(--s2)'], ['signups', 'Đăng ký xong', 'var(--s3)']], { label: 'Số người theo ngày' })}</section>
    ${frameworkGrid('AARRR: thu hút, kích hoạt, giữ chân, giới thiệu, doanh thu', m.frameworks.AARRR)}${frameworkGrid('HEART: hài lòng, tham gia, tiếp nhận, giữ chân, hoàn thành', m.frameworks.HEART)}`;
}

const segList = (rows) => barList(rows.map((g) => ({ label: g.name, value: g.n, sub: `bắt đầu ${pct(g.firstMessage)} · đúng ${g.resonance ? pct(g.resonance) : '–'} · đăng ký ${pct(g.verified)}`, tip: `Bắt đầu ${pct(g.firstMessage)}\nĐúng ≥ gần đúng ${g.resonance ? pct(g.resonance) : '–'}\nĐăng ký ${pct(g.verified)}` })), { fmt: (v) => `${nf.format(v)} người`, empty: 'Chưa có dữ liệu.' });
const compareBlock = (c) => `<section class="panel"><h2>Đối chiếu lá số với ứng dụng khác</h2>
  <p class="sub">Người dùng nhập Cục và cung Mệnh từ lá số khác. Khớp là bằng chứng nhất quán; lệch giải thích được cho biết quy ước nào hay gặp; lệch chưa giải thích được là chỗ My còn thiếu.</p>
  ${c.runs ? '' : '<p class="muted">Chưa có ai đối chiếu.</p>'}
  <div class="rings">${ring(c.opened ? c.runRate?.p : null, { label: 'Mở rồi đối chiếu', sub: `${c.people}/${c.opened} người`, tone: 's1', w: c.runRate })}${ring(c.giaiThich + c.khongRo ? c.explainedOfDiff?.p : null, { label: 'Lệch được giải thích', sub: `${c.giaiThich} trong ${c.giaiThich + c.khongRo} ca lệch`, tone: 's3', w: c.explainedOfDiff })}</div>
  <h3>Kết quả (số lần)</h3>${barList([{ label: 'Khớp', value: c.khop }, { label: 'Lệch, giải thích được', value: c.giaiThich }, { label: 'Lệch, chưa giải thích được', value: c.khongRo }, { label: 'Thiếu giờ sinh', value: c.thieuDuLieu }], { empty: '' })}
  <h3>Vì sao lệch (trong các ca giải thích được)</h3>${barList([{ label: 'Lịch Trung Quốc (UTC+8)', value: c.reasons.cn }, { label: 'Quy ước tháng nhuận', value: c.reasons.leap }, { label: 'Giờ Tý muộn', value: c.reasons.ty }], { tone: 's2', empty: '' })}</section>`;
const upgradeBlock = (rows) => `<section class="panel"><h2>Thử nút nâng cấp (chưa thu tiền)</h2>
  <p class="sub">Mỗi người được gán một mức giá và ở lại mức đó. "Mở" là bấm xem gói; "quan tâm" là chọn gói sau khi đã thấy giá. Cần ít nhất 30 người mở mỗi mức mới đáng tin, và đây là ý định chứ chưa phải trả tiền.</p>
  ${rows.length ? `<div class="pcs">${rows.map((r) => `<article class="pc"><div class="pc-h"><b>${nf.format(r.price)}đ</b><span>mỗi tháng</span></div>
    <div class="pc-n"><div><b>${r.views}</b><span>thấy nút</span></div><div><b>${r.opens}</b><span>mở xem</span></div><div><b>${r.clicks}</b><span>quan tâm</span></div></div>
    <div class="rings one">${ring(r.opens ? r.clickRate?.p : null, { label: 'Quan tâm / mở', sub: r.opens >= 30 ? wl(r.clickRate) : `n=${r.opens}, chưa đủ 30`, tone: 's2', w: r.clickRate })}</div>
    <h3>Cảm nhận giá</h3>${feelBar(r.feel)}</article>`).join('')}</div>` : '<p class="muted">Chưa có dữ liệu. Bật bằng UPGRADE_TEST=on trên máy chủ.</p>'}</section>`;

function growthTab(m) {
  const r = m.satisfaction.resonance, rt = m.retention, e = m.explore, t = m.thoivan, tf = m.satisfaction.timeFit;
  return `<section class="panel"><h2>Giữ chân</h2><p class="sub">Người mới quay lại đúng ngày thứ 1, 3, 7 sau lần đầu.</p>
      <div class="rings">${ring(rt.d1?.p, { label: 'Sau 1 ngày', sub: wl(rt.d1), tone: 's3', w: rt.d1 })}${ring(rt.d3?.p, { label: 'Sau 3 ngày', sub: wl(rt.d3), tone: 's3', w: rt.d3 })}${ring(rt.d7?.p, { label: 'Sau 7 ngày', sub: wl(rt.d7), tone: 's3', w: rt.d7 })}</div>
      ${cohortHeat(rt.cohorts)}</section>
    <section class="panel"><h2>Hài lòng và độ đúng</h2><p class="sub">Đánh giá sau luận giải và điểm giới thiệu cuối buổi.</p>
      <div class="rings">${ring(r.good?.p, { label: 'My nói đúng', sub: 'gần đúng trở lên', tone: 's1', w: r.good })}${ring(r.strong?.p, { label: 'Rất đúng', sub: wl(r.strong), tone: 's1', w: r.strong })}${ring(tf.n ? tf.good?.p : null, { label: 'Thời vận khớp', sub: tf.n ? `${tf.n} câu trả lời` : 'chưa có ai trả lời', tone: 's7', w: tf.good })}${ring(m.intro?.skipFirstVisit?.p, { label: 'Bỏ qua mở đầu', sub: 'lần đầu, trên 40% thì rút ngắn', tone: 's8', w: m.intro?.skipFirstVisit })}</div>
      <h3>Độ đúng người dùng đánh giá</h3>${agreeBar(r.dist)}<h3>Điểm giới thiệu</h3>${npsBar(m.satisfaction.nps)}
      <p class="note">Hiệu ứng Barnum: lời nói chung chung dễ bị thấy là "đúng với mình". Đừng dùng điểm này một mình để kết luận My chính xác; đọc cùng tỉ lệ "bám lời người dùng" ở tab Chất lượng và phản hồi tự do.</p></section>
    <div class="grid2"><section class="panel"><h2>Trang Khám phá</h2><p class="sub">Xem lá số không cần đăng nhập. Số người, không trùng.</p>${barList([{ label: 'Vào trang', value: e.visitors }, { label: 'Xem một lá số', value: e.viewedChart }, { label: 'Chọn hồ sơ mẫu', value: e.pickedSample }, { label: 'Bấm sang trò chuyện với My', value: e.toChat }, { label: 'Đã đến ứng dụng với hồ sơ', value: e.arrived }, { label: 'Bấm vào Zalo', value: e.zalo }], { tone: 's3', empty: '' })}</section>
      <section class="panel"><h2>12 cung và thời vận</h2><p class="sub">Số người, không trùng.</p>${barList([{ label: 'Mở tab 12 cung hoặc Thời vận', value: t.openedTab }, { label: 'Xem chi tiết một tháng', value: t.monthViews }, { label: 'Bấm hỏi My từ lá số', value: t.asked }, { label: 'Trả lời năm đã qua có khớp không', value: t.rated }], { tone: 's7', empty: '' })}</section></div>
    <section class="panel"><h2>Tarot</h2><p class="sub">Trang /tarot, số người không trùng. "Rút lại" là người quay lại xem lá của ngày.</p>${barList([{ label: 'Vào trang', value: m.tarot.visitors }, { label: 'Rút ít nhất một lần', value: m.tarot.drew }, { label: 'Rút lá của ngày', value: m.tarot.daily }, { label: 'Trải ba lá', value: m.tarot.three }, { label: 'Quay lại xem lá hôm nay', value: m.tarot.returned }, { label: 'Xem từng lá trong bộ', value: m.tarot.browsed }, { label: 'Tải ảnh hoặc chia sẻ', value: m.tarot.shared }, { label: 'Bấm hỏi My về lá bài', value: m.tarot.asked }], { tone: 's5', empty: 'Chưa có dữ liệu.' })}</section>
    <section class="panel"><h2>Giới thiệu bạn bè</h2><p class="sub">Người mở "Góc của tôi" và các lượt giới thiệu. Một lượt đạt là bạn đã đăng ký bằng email và trò chuyện đủ số phút quy định.</p>${barList([{ label: 'Mở Góc của tôi', value: m.referral.opened }, { label: 'Sao chép hoặc chia sẻ liên kết', value: m.referral.copied }, { label: 'Bạn được mời đã đăng ký', value: m.referral.invited }, { label: 'Lượt giới thiệu đạt', value: m.referral.qualified }, { label: 'Người nhận thêm giờ', value: m.referral.referrers }], { tone: 's3', empty: 'Chưa có dữ liệu.' })}<p class="sub">Từ trước đến nay: ${m.referral.totalInvited} bạn đã đăng ký qua liên kết, ${m.referral.totalQualified} lượt đạt.</p></section>
    ${compareBlock(m.compare)}${upgradeBlock(m.upgrade)}
    <div class="grid2"><section class="panel"><h2>Theo nhóm tuổi</h2>${segList(m.segments.age)}</section><section class="panel"><h2>Theo lĩnh vực làm việc</h2>${segList(m.segments.field)}</section></div>
    <div class="grid2"><section class="panel"><h2>Gợi ý bắt đầu được chọn</h2>${barList(m.startChoices.map((x) => ({ label: x.name, value: x.n })), { tone: 's2', empty: 'Chưa có dữ liệu.' })}</section>
      <section class="panel"><h2>Giới thiệu</h2><p class="sub">Chia sẻ thẻ: ${pct(m.growth.share)} (${ci(m.growth.share)}). Mã ref theo từng kênh.</p>${barList(m.growth.referrals.map((x) => ({ label: x.ref, value: x.n })), { tone: 's5', empty: 'Chưa có lượt giới thiệu.' })}</section></div>`;
}

function qualityTab(m) {
  const q = m.quality, cr = q.crisis, ms = (v) => (v == null ? '–' : `${(v / 1000).toFixed(1)}s`);
  const flags = Object.entries(q.flags).map(([k, w]) => ({ label: FLAG_LABEL[k] ?? k, value: w.p == null ? 0 : w.p * 100, tip: wl(w) }));
  return `<section class="tiles">
      ${tile({ label: 'Điểm chất lượng', value: q.meanScore ?? '–', sub: `thang 0-100 · ${nf.format(q.turns)} lượt trả lời`, tone: 's1' })}
      ${tile({ label: 'An toàn khi khủng hoảng', value: cr.safety?.p == null ? '–' : pct(cr.safety), sub: `${cr.handled} có hỗ trợ · ${cr.missed} thiếu`, tone: 's3' })}
      ${tile({ label: 'Thời gian trả lời', value: ms(q.latency.p50), sub: `trung vị · phân vị 95: ${ms(q.latency.p95)}`, tone: 's4' })}
      ${tile({ label: 'Lỗi gọi AI', value: pct(q.errors, 1), sub: ci(q.errors) || '', tone: 's8' })}</section>
    <section class="panel"><h2>Dấu hiệu cần xem lại</h2><p class="sub">Tỉ lệ lượt trả lời có từng dấu hiệu. Thấp là tốt; mục an toàn (nói chắc nịch, dọa hạn, thiếu hỗ trợ khi khủng hoảng) mong muốn gần 0%.</p>
      ${barList(flags, { tone: 's2', fmt: (v) => `${v.toFixed(1)}%`, max: Math.max(10, ...flags.map((x) => x.value)), empty: 'Chưa có lượt nào được chấm.' })}
      <p class="note">Mỗi lượt được chấm bằng quy tắc minh bạch ngay trên máy chủ. Hệ thống không lưu nội dung trò chuyện, chỉ lưu chỉ số: số từ, số câu hỏi, độ lặp, số chi tiết người dùng được nhắc lại và các cờ an toàn. Trung bình ${q.meanQuestions ?? '–'} câu hỏi mỗi lượt.</p></section>`;
}

function render() {
  const m = data, tab = tabNow(), crit = m.insights.filter((i) => i.severity === 'critical').length;
  const when = new Date(m.range.to).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' });
  app.innerHTML = `<div class="wrap">
    <header class="top"><div class="ttl"><span class="orb" aria-hidden="true"></span><div><h1>Quản trị Huyền My</h1><p class="sub">${days ? `Kỳ ${days} ngày` : 'Toàn thời gian'} · giờ Việt Nam · cập nhật ${when}</p></div></div>
      <div class="acts"><a class="ib" href="/" aria-label="Mở ứng dụng" title="Mở ứng dụng">↗</a><button class="ib" id="out" aria-label="Đăng xuất" title="Đăng xuất">⎋</button></div></header>
    <div class="seg period" role="group" aria-label="Khoảng thời gian">${[[7, '7 ngày'], [14, '14 ngày'], [30, '30 ngày'], [90, '90 ngày'], [365, '1 năm']].map(([d, l]) => `<button data-d="${d}" aria-pressed="${d === days}">${l}</button>`).join('')}</div>
    <nav class="tabs" role="tablist" aria-label="Mục quản trị">${TABS.map(([k, l]) => `<a role="tab" href="#/${k}" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}">${l}${k === 'tong-quan' && crit ? ` <span class="chip critical">▲ ${crit}</span>` : ''}</a>`).join('')}</nav>
    <main id="tabbody"></main>
    <p class="note foot">© 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.</p></div>`;
  app.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { days = +b.dataset.d; history.replaceState(null, '', `?days=${days}${location.hash}`); journey = null; document.getElementById('tabbody')?.classList.add('busy'); load(); }));
  document.getElementById('out').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); load(); };
  app.querySelector('.tabs a.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  paintTab(tab);
}

const methodTab = () => `<section class="panel"><h2>Phương pháp và quyền riêng tư</h2>
      <p class="note">Khung đo: AARRR (McClure, 2007), HEART (Rodden và cộng sự, Google, 2010), NPS (Reichheld, 2003). Mọi tỉ lệ có khoảng tin cậy Wilson 95%; trung bình dùng khoảng tin cậy t 95%. Khuyến nghị chỉ kết luận khi đủ cỡ mẫu.</p>
      <p class="note"><b>Dữ liệu thu thập.</b> Người dùng được nhận diện bằng mã ẩn danh trong cookie; sự kiện chỉ gồm tên bước và vài giá trị ngắn. Với mỗi lượt trò chuyện, máy chủ tính tại chỗ vài con số (sắc thái, cường độ, nhóm cảm xúc, mức mở lòng, số từ, giọng của My) rồi bỏ nội dung ngay, nên trang này không có nội dung trò chuyện, họ tên hay ngày sinh. Nhóm thiết bị chỉ gồm loại máy, hệ điều hành và trình duyệt.</p>
      <p class="note"><b>Tự đánh giá tâm trạng.</b> Người dùng có thể chạm một ô (1 đến 5) ở đầu buổi, giữa buổi và cuối buổi, hoặc bỏ qua. Đây là số đo chính của hành trình cảm xúc; số suy ra từ chữ chỉ để bổ sung.</p>
      <p class="note"><b>Giới hạn.</b> Từ điển cảm xúc tiếng Việt chưa được kiểm định; nhóm người thử còn nhỏ và tự chọn nên không đại diện cho cộng đồng; các so sánh trước-sau không loại trừ được yếu tố khác (hôm đó người dùng vốn đang vui hay buồn). Không dùng số liệu này để gán nhãn hay chẩn đoán từng người.</p>
      <p class="note"><b>Lưu trữ và xóa.</b> Nội dung trò chuyện chỉ được lưu khi người dùng đã đăng nhập và đồng ý, mã hóa nếu đặt <code>HUYENMY_DATA_KEY</code>. Khi người dùng xóa tài khoản, sự kiện, chỉ số lượt và liên kết của họ bị xóa theo. Mã người trong tệp CSV từng lượt là mã băm một chiều; đặt <code>HUYENMY_PEPPER</code> cố định để mã không đổi sau mỗi lần khởi động lại.</p></section>`;

async function paintTab(tab) {
  const host = document.getElementById('tabbody'); if (!host) return;
  if (tab === 'tong-quan') host.innerHTML = overviewTab(data);
  else if (tab === 'tang-truong') host.innerHTML = growthTab(data);
  else if (tab === 'chat-luong') host.innerHTML = qualityTab(data);
  else if (tab === 'gop-y') await loadFeedback(host);
  else if (tab === 'phuong-phap') host.innerHTML = methodTab();
  else if (tab === 'nguoi') await loadPeople(host, 0);
  else if (tab === 'cam-xuc') {
    host.innerHTML = '<p class="muted" style="padding:16px">Đang phân tích…</p>';
    if (!journey) { const r = await fetch(`/api/admin/journey?days=${days}`, { cache: 'no-store' }); if (!r.ok) { host.innerHTML = `<p class="err">Không tải được (${r.status}).</p>`; return; } journey = await r.json(); }
    host.innerHTML = renderJourney(journey); wireJourney(journey, days);
  }
}
async function loadFeedback(host) {
  host.innerHTML = '<p class="muted" style="padding:16px">Đang tải…</p>';
  const r = await fetch(`/api/admin/feedback?days=${days}`, { cache: 'no-store' });
  if (!r.ok) { host.innerHTML = `<p class="err">Không tải được (${r.status}).</p>`; return; }
  const rows = await r.json(), KIND = { nps: 'Lý do điểm giới thiệu', resonance: 'Độ đúng', time: 'Thời vận', general: 'Góp ý chung' };
  const quotable = rows.filter((x) => x.quoteOk);
  host.innerHTML = `<section class="panel"><h2>Góp ý và lời được phép trích dẫn</h2>
    <p class="sub">${rows.length} góp ý trong kỳ, ${quotable.length} người cho phép trích dẫn ẩn danh khi giới thiệu My. Chỉ dùng đúng phần được phép; không đoán danh tính. Lời trích ghi theo tên hiển thị người ấy tự chọn.</p>
    <div class="row-actions"><button class="btn" id="fb-csv">Tải CSV</button></div>
    <div class="scroll"><table><thead><tr><th>Ngày</th><th>Loại</th><th class="num">Điểm</th><th>Lời góp ý</th><th>Trích dẫn</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${new Date(x.ts).toLocaleDateString('vi-VN')}</td><td>${esc(KIND[x.kind] ?? x.kind)}</td><td class="num">${x.rating ?? '–'}</td><td>${esc(x.text)}</td><td>${x.quoteOk ? `Được phép${x.display ? `, ghi "${esc(x.display)}"` : ', ẩn danh'}` : 'Không'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có góp ý.</td></tr>'}</tbody></table></div></section>`;
  document.getElementById('fb-csv').onclick = () => download('huyenmy-gop-y.csv', toCsv([{ key: 'date', label: 'Ngày' }, { key: 'kind', label: 'Loại' }, { key: 'rating', label: 'Điểm' }, { key: 'text', label: 'Lời góp ý' }, { key: 'quoteOk', label: 'Được trích dẫn' }, { key: 'display', label: 'Tên hiển thị' }], rows.map((x) => ({ ...x, date: new Date(x.ts).toISOString().slice(0, 10) }))));
}
addEventListener('hashchange', () => { if (data) render(); });
// biểu đồ chọn kích thước theo bề rộng màn hình: vẽ lại khi đổi nhóm (điện thoại, máy gập, máy tính)
const bucket = () => (document.documentElement.clientWidth < 520 ? 0 : document.documentElement.clientWidth < 860 ? 1 : 2);
let lastBucket = bucket(), rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (data && bucket() !== lastBucket) { lastBucket = bucket(); render(); } }, 200); });
initViz();
load();
