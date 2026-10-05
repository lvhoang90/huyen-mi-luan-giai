// Số liệu trang quản trị: phễu hành trình, giữ chân theo cohort, chất lượng tư vấn, và khuyến nghị có xếp hạng.
// Khung tham chiếu: AARRR (McClure 2007), HEART (Rodden và cộng sự, Google 2010), NPS (Reichheld 2003).
// Mọi tỉ lệ kèm khoảng tin cậy Wilson 95%, và khuyến nghị chỉ đưa ra kết luận khi đủ cỡ mẫu.
const DAY = 86_400_000, VN = 7 * 3_600_000;
export const dayOf = (ts) => Math.floor((ts + VN) / DAY);
const dayLabel = (d) => new Date(d * DAY).toISOString().slice(0, 10);

export function wilson(k, n, z = 1.96) {
  if (!n) return { p: null, lo: null, hi: null, n: 0 };
  const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { p, lo: Math.max(0, (c - m) / d), hi: Math.min(1, (c + m) / d), n };
}
const pct = (k, n) => wilson(k, n);
const quantile = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const parse = (s) => { try { return JSON.parse(s ?? '{}'); } catch { return {}; } };

export const FUNNEL = [
  { key: 'landing_view', label: 'Mở trang chào', names: ['landing_view'] },
  { key: 'enter', label: 'Bấm "Bước vào"', names: ['enter_click', 'resume_click'] },
  { key: 'intake_done', label: 'Điền xong thông tin', names: ['intake_done'] },
  { key: 'hook_shown', label: 'Xem "điểm chung" mở đầu', names: ['hook_shown'] },
  { key: 'first_message', label: 'Nói câu đầu tiên', names: ['first_message'] },
  { key: 'reading', label: 'Nhận luận giải', names: ['reading_received'] },
  { key: 'resonance', label: 'Đánh giá "có đúng không"', names: ['resonance'] },
  { key: 'session_close', label: 'Trọn buổi 30 phút', names: ['session_close'] },
  { key: 'signup_submit', label: 'Nhập email đăng ký', names: ['signup_submit'] },
  { key: 'signup_verified', label: 'Xác thực xong', names: ['signup_verified'] },
];

export function computeMetrics(db, { days = 14, now = Date.now() } = {}) {
  const from = now - days * DAY;
  const evs = db.prepare('SELECT ts, actor, sid, name, props FROM events WHERE ts >= ? ORDER BY ts').all(from).map((e) => ({ ...e, p: parse(e.props) }));
  const actorsBy = (names) => new Set(evs.filter((e) => names.includes(e.name)).map((e) => e.actor));
  const allActors = new Set(evs.map((e) => e.actor));

  // ---- phễu ----
  const funnel = FUNNEL.map((s, i) => ({ key: s.key, label: s.label, actors: actorsBy(s.names) }));
  const top = funnel[0].actors.size || allActors.size;
  const funnelOut = funnel.map((s, i) => {
    const prev = i ? funnel[i - 1].actors.size : null, n = s.actors.size;
    return { key: s.key, label: s.label, count: n, fromPrev: prev ? pct(Math.min(n, prev), prev) : null, fromTop: top ? pct(Math.min(n, top), top) : null };
  });

  // ---- phiên ----
  const bySid = new Map();
  for (const e of evs) { if (!e.sid) continue; const s = bySid.get(e.sid) ?? { first: e.ts, last: e.ts, msgs: 0, closed: false, actor: e.actor }; s.last = e.ts; if (e.name === 'message_sent') s.msgs++; if (e.name === 'session_close') s.closed = true; bySid.set(e.sid, s); }
  const engaged = [...bySid.values()].filter((s) => s.msgs >= 1);
  const sessions = {
    total: bySid.size, engaged: engaged.length,
    medianMin: engaged.length ? Math.round((quantile(engaged.map((s) => (s.last - s.first) / 60000), 0.5)) * 10) / 10 : null,
    meanMsgs: engaged.length ? Math.round(mean(engaged.map((s) => s.msgs)) * 10) / 10 : null,
    reachedCap: pct(engaged.filter((s) => s.closed).length, engaged.length),
  };

  // ---- giữ chân theo cohort (ngày theo giờ Việt Nam) ----
  const actorDays = new Map();
  for (const e of db.prepare('SELECT actor, ts FROM events WHERE ts >= ?').all(from - 8 * DAY)) { const set = actorDays.get(e.actor) ?? new Set(); set.add(dayOf(e.ts)); actorDays.set(e.actor, set); }
  const today = dayOf(now), cohorts = new Map();
  for (const [a, set] of actorDays) {
    const d0 = Math.min(...set);
    if (d0 < dayOf(from)) continue; // chỉ tính người mới xuất hiện trong kỳ
    const c = cohorts.get(d0) ?? { day: d0, n: 0, d1: 0, d3: 0, d7: 0 };
    c.n++; if (set.has(d0 + 1)) c.d1++; if (set.has(d0 + 3)) c.d3++; if (set.has(d0 + 7)) c.d7++;
    cohorts.set(d0, c);
  }
  const cohortRows = [...cohorts.values()].sort((a, b) => a.day - b.day).map((c) => ({ day: dayLabel(c.day), n: c.n, d1: today - c.day >= 1 ? c.d1 / c.n : null, d3: today - c.day >= 3 ? c.d3 / c.n : null, d7: today - c.day >= 7 ? c.d7 / c.n : null }));
  const ret = (k) => { let a = 0, n = 0; for (const c of cohorts.values()) if (today - c.day >= k) { a += c[`d${k}`]; n += c.n; } return pct(a, n); };

  // ---- hài lòng ----
  const res = evs.filter((e) => e.name === 'resonance').map((e) => +e.p.value).filter((v) => v >= 1 && v <= 3);
  const nps = evs.filter((e) => e.name === 'nps').map((e) => +e.p.value).filter((v) => v >= 0 && v <= 10);
  const prom = nps.filter((v) => v >= 9).length, det = nps.filter((v) => v <= 6).length;
  const satisfaction = {
    resonance: { n: res.length, dist: [1, 2, 3].map((v) => res.filter((x) => x === v).length), good: pct(res.filter((v) => v >= 2).length, res.length), strong: pct(res.filter((v) => v === 3).length, res.length) },
    nps: { n: nps.length, score: nps.length ? Math.round((100 * (prom - det)) / nps.length) : null, promoters: prom, passives: nps.length - prom - det, detractors: det },
  };

  // ---- phân khúc ----
  const seg = (key) => {
    const info = new Map();
    for (const e of evs) if (e.name === 'intake_done' && e.p[key]) info.set(e.actor, String(e.p[key]));
    const fm = actorsBy(['first_message']), ve = actorsBy(['signup_verified']);
    const rActors = new Map(); for (const e of evs) if (e.name === 'resonance') rActors.set(e.actor, Math.max(rActors.get(e.actor) ?? 0, +e.p.value || 0));
    const groups = new Map();
    for (const [a, v] of info) { const g = groups.get(v) ?? { n: 0, fm: 0, ve: 0, rn: 0, rg: 0 }; g.n++; if (fm.has(a)) g.fm++; if (ve.has(a)) g.ve++; if (rActors.has(a)) { g.rn++; if (rActors.get(a) >= 2) g.rg++; } groups.set(v, g); }
    return [...groups].map(([name, g]) => ({ name, n: g.n, firstMessage: pct(g.fm, g.n), verified: pct(g.ve, g.n), resonance: g.rn ? pct(g.rg, g.rn) : null })).sort((a, b) => b.n - a.n);
  };
  const dist = (name, key) => { const m = new Map(); for (const e of evs) if (e.name === name && e.p[key] != null) m.set(String(e.p[key]), (m.get(String(e.p[key])) ?? 0) + 1); return [...m].map(([k, v]) => ({ name: k, n: v })).sort((a, b) => b.n - a.n); };

  // ---- chất lượng tư vấn (từ bảng turns) ----
  const turns = db.prepare('SELECT * FROM turns WHERE ts >= ?').all(from);
  const okTurns = turns.filter((t) => t.ok);
  const fl = (t) => (t.flags ? t.flags.split(',') : []);
  const flagCount = (f) => okTurns.filter((t) => fl(t).includes(f)).length;
  const cs = flagCount('khung_hoang_co_ho_tro'), cm = flagCount('khung_hoang_THIEU_HO_TRO');
  const quality = {
    turns: turns.length, errors: pct(turns.length - okTurns.length, turns.length),
    meanScore: okTurns.length ? Math.round(mean(okTurns.map((t) => t.score))) : null,
    latency: { p50: quantile(okTurns.map((t) => t.ms), 0.5), p95: quantile(okTurns.map((t) => t.ms), 0.95), ttftP50: quantile(okTurns.filter((t) => t.ttft != null).map((t) => t.ttft), 0.5) },
    meanQuestions: okTurns.length ? Math.round(mean(okTurns.map((t) => t.q)) * 100) / 100 : null,
    meanWords: okTurns.length ? Math.round(mean(okTurns.map((t) => t.words))) : null,
    flags: Object.fromEntries(['qua_nhieu_cau_hoi', 'qua_dai', 'lap_lai', 'noi_chac_nich', 'doa_han_hoac_ban_cung', 'thieu_nhan_tang', 'thieu_canh_bao_gioi_han', 'khong_bam_loi_nguoi_dung', 'cum_sao_ron', 'lap_cum_tu', 'vien_dan_nhieu'].map((f) => [f, pct(flagCount(f), okTurns.length)])),
    crisis: { handled: cs, missed: cm, safety: cs + cm ? pct(cs, cs + cm) : null },
  };

  // ---- chuỗi theo ngày, tăng trưởng, tài khoản ----
  const series = [];
  for (let d = dayOf(from); d <= today; d++) {
    const of = (names) => new Set(evs.filter((e) => dayOf(e.ts) === d && names.includes(e.name)).map((e) => e.actor)).size;
    series.push({ day: dayLabel(d), visitors: of(['landing_view']), started: of(['first_message']), signups: of(['signup_verified']) });
  }
  const refs = new Map(); for (const e of evs) if (e.name === 'landing_view' && e.p.ref) refs.set(e.p.ref, (refs.get(e.p.ref) ?? 0) + 1);
  const users = db.prepare("SELECT COUNT(*) c, SUM(created_at >= ?) n, SUM(consent_memory) m FROM users WHERE role = 'user'").get(from);
  const sharers = actorsBy(['share_card']).size, readers = funnel[5].actors.size;
  const introSeen = actorsBy(['intro_view']).size, introSkipped = actorsBy(['intro_skip']).size;
  const introFull = new Set(evs.filter((e) => e.name === 'intro_view' && e.p.kind === 'full').map((e) => e.actor));
  const skipFull = new Set(evs.filter((e) => e.name === 'intro_skip' && e.p.kind === 'full').map((e) => e.actor));
  const m = {
    intro: { skip: wilson(introSkipped, introSeen), skipFirstVisit: wilson(skipFull.size, introFull.size) },
    range: { days, from: new Date(from).toISOString(), to: new Date(now).toISOString() },
    visitors: funnel[0].actors.size || allActors.size, funnel: funnelOut, sessions, retention: { d1: ret(1), d3: ret(3), d7: ret(7), cohorts: cohortRows.slice(-10) },
    satisfaction, quality, series,
    segments: { age: seg('ageBand'), field: seg('field') }, startChoices: dist('start_choice', 'chip'), pace: dist('pace_toggle', 'mode'),
    growth: { share: pct(sharers, readers), referrals: [...refs].map(([k, v]) => ({ ref: k, n: v })).sort((a, b) => b.n - a.n).slice(0, 8) },
    accounts: { total: users.c ?? 0, newInRange: users.n ?? 0, memoryConsent: pct(users.m ?? 0, users.c ?? 0) },
  };
  m.frameworks = frameworks(m);
  m.insights = insights(m);
  return m;
}

const rate = (w) => (w?.p == null ? null : Math.round(w.p * 1000) / 10);
function frameworks(m) {
  const f = (k) => m.funnel.find((x) => x.key === k);
  return {
    AARRR: {
      'Thu hút': { value: m.visitors, note: 'người dùng mới mở trang' },
      'Kích hoạt': { value: rate(f('first_message').fromTop), unit: '%', note: 'nói câu đầu tiên / người mở trang' },
      'Giữ chân': { value: rate(m.retention.d1), unit: '%', note: 'quay lại sau 1 ngày' },
      'Giới thiệu': { value: rate(m.growth.share), unit: '%', note: 'chia sẻ thẻ / người nhận luận giải' },
      'Doanh thu': { value: null, note: 'chưa có mô hình thu phí' },
    },
    HEART: {
      'Hài lòng': { value: rate(m.satisfaction.resonance.good), unit: '%', note: 'cho rằng My nói đúng ("gần đúng" trở lên)' },
      'Tham gia': { value: m.sessions.meanMsgs, note: 'tin nhắn mỗi buổi' },
      'Tiếp nhận': { value: rate(f('first_message').fromTop), unit: '%', note: 'bắt đầu trò chuyện' },
      'Giữ chân ': { value: rate(m.retention.d7), unit: '%', note: 'quay lại sau 7 ngày' },
      'Hoàn thành': { value: rate(f('session_close').fromPrev), unit: '%', note: 'đi hết buổi sau khi bắt đầu' },
    },
  };
}

const conf = (n) => (n < 20 ? 1 : n < 50 ? 2 : n < 150 ? 3 : n < 400 ? 4 : 5);
const STEP_ACTIONS = {
  enter: ['Trang chào chưa đủ hấp dẫn', 'Nêu rõ lời hứa ngay trên trang chào: "2 phút để thấy bản đồ ngày sinh của bạn, không cần đăng ký". Thêm một kết quả mẫu và đo lại.', 2],
  intake_done: ['Người dùng bỏ ngang lúc điền thông tin', 'Rút gọn thu thập: cho phép bỏ qua giờ sinh và nơi sinh, hiện thanh tiến độ ("còn 2 câu"), kiểm tra xem câu nào có tỉ lệ thoát cao nhất ở bảng intake_step.', 2],
  hook_shown: ['Lỗi giữa lúc tính lá số hoặc bước hỏi cuối', 'Kiểm tra lỗi trình duyệt (sự kiện client_error) và thời gian tính lá số trên điện thoại cũ.', 3],
  first_message: ['Điểm chung mở đầu chưa đủ kéo người dùng nói tiếp', 'Thử biến thể hook: đưa nét hiếm trong lá số lên trước người nổi tiếng, hoặc đổi ba gợi ý bắt đầu thành câu hỏi gần với đời sống hơn. Chạy A/B bằng cách đổi theo ngày và so sánh.', 2],
  reading: ['Chưa nhiều người đi đến luận giải', 'Mời luận giải sớm hơn (sau lượt kể thứ hai) và nhắc nét hiếm trong lá số như lời hứa kết quả.', 2],
  resonance: ['Ít người bấm đánh giá "có đúng không"', 'Đưa nút đánh giá lên ngay dưới bong bóng luận giải, không cần thêm câu hỏi.', 1],
  session_close: ['Ít người đi trọn buổi', 'Người dùng rời đi giữa buổi: xem phiên trung vị và mốc thoát; đưa điều giá trị nhất (thẻ tóm tắt, bước nhỏ) lên sớm hơn.', 3],
  signup_submit: ['Người dùng không đăng ký lúc hết buổi', 'Nêu lợi ích cụ thể trước khi xin email: "My nhớ bạn và hẹn lần sau, kể điều đã hứa", gửi tóm tắt buổi vào email, nhấn mạnh không cần mật khẩu.', 2],
  signup_verified: ['Nhập email xong nhưng không xác thực', 'Kiểm tra email có tới hộp thư chính không (SPF/DKIM), cho phép tự điền mã (autocomplete one-time-code), kéo dài thời hạn mã.', 2],
};

export function insights(m) {
  const out = [];
  const add = (id, severity, title, evidence, action, impact, n, effort) => out.push({ id, severity, title, evidence, action, impact, confidence: conf(n), effort, score: Math.round((impact * conf(n) * 10) / effort) / 10 });
  const q = m.quality, pc = (w) => (w?.p == null ? 'n/a' : `${Math.round(w.p * 100)}% (KTC 95%: ${Math.round(w.lo * 100)}-${Math.round(w.hi * 100)}%, n=${w.n})`);

  if (m.visitors < 50) add('du-lieu', 'info', 'Chưa đủ dữ liệu để kết luận', `Mới ${m.visitors} người dùng trong kỳ.`, 'Chưa tối ưu theo số liệu. Mục tiêu 200 người dùng đầu tiên rồi mới đọc phễu; trong lúc đó đọc từng cuộc trò chuyện mẫu (khi người dùng đồng ý) để hiểu lý do.', 3, 50, 1);
  if (q.crisis.missed > 0) add('khung-hoang', 'critical', 'Có lượt khủng hoảng chưa kèm hỗ trợ', `${q.crisis.missed} lượt My không nêu đường dây hay hướng đến người thân, y tế (an toàn: ${pc(q.crisis.safety)}).`, 'Bắt buộc sửa ngay: thêm kiểm tra cứng phía máy chủ, nếu tin nhắn có dấu hiệu khủng hoảng thì luôn chèn khối hỗ trợ cố định, không phụ thuộc lời AI.', 5, 99, 2);
  if (q.flags.noi_chac_nich.p > 0) add('noi-chac-nich', 'critical', 'My có lúc nói chắc nịch hoặc tiên đoán', `Tỉ lệ lượt có cụm khẳng định tuyệt đối: ${pc(q.flags.noi_chac_nich)}.`, 'Siết lời dặn (cấm "chắc chắn", "100%", "số phận định sẵn") và thêm bước lọc sau khi AI trả lời.', 5, q.turns, 2);
  if (q.flags.doa_han_hoac_ban_cung.p > 0) add('doa-han', 'critical', 'Lời của My có dấu hiệu dọa hạn hoặc gợi ý cúng bái', `Tỉ lệ: ${pc(q.flags.doa_han_hoac_ban_cung)}.`, 'Xem lại các lượt này và siết lời dặn: My không dọa, không gợi ý cúng giải hạn.', 5, q.turns, 2);
  if (q.errors.p > 0.03 && q.turns >= 20) add('loi', 'critical', 'Tỉ lệ lỗi gọi AI cao', `Lượt lỗi: ${pc(q.errors)}.`, 'Kiểm tra hạn mức API, thêm thử lại một lần có độ trễ, hiển thị thông báo thân thiện và lưu tin nhắn để gửi lại.', 5, q.turns, 2);
  if (q.latency.p95 > 25000) add('do-tre', 'warn', 'Độ trễ trả lời cao', `Trung vị ${Math.round(q.latency.p50 / 1000)} giây, phân vị 95 là ${Math.round(q.latency.p95 / 1000)} giây.`, 'Dùng model nhanh cho giai đoạn lắng nghe, giảm độ dài lời dặn hệ thống, hiển thị "My đang suy nghĩ" có hình động để người dùng đỡ sốt ruột.', 4, q.turns, 2);
  if (q.flags.lap_lai.p > 0.1) add('lap', 'warn', 'My còn lặp ý hoặc lặp lời mở đầu', `Tỉ lệ lượt lặp: ${pc(q.flags.lap_lai)}.`, 'Đưa thêm 5 lời mở đầu gần nhất vào lời dặn kèm yêu cầu khác biệt rõ rệt (đã có cơ chế, tăng số lượng) và theo dõi lại.', 3, q.turns, 1);
  if (q.flags.cum_sao_ron.p > 0.15) add('sao-ron', 'warn', 'Lời My còn nhiều khuôn nghe như máy viết sẵn', `Tỉ lệ lượt có khuôn sáo ("không phải X mà là Y", "My nghe rồi", "hãy nhớ rằng"…): ${pc(q.flags.cum_sao_ron)}.`, 'Đây là điều người dùng phàn nàn: thêm cụm vừa bắt được vào danh sách cấm của lời dặn, đọc 20 lượt mẫu (khi được đồng ý) để tìm khuôn mới, và đo lại sau mỗi lần sửa.', 4, q.turns, 1);
  if (q.flags.vien_dan_nhieu.p > 0.15) add('vien-dan', 'warn', 'My viện dẫn tâm lý học, khoa học, lăng kính quá nhiều', `Tỉ lệ lượt viện dẫn dày: ${pc(q.flags.vien_dan_nhieu)}.`, 'Làm giọng My gần gũi hơn: nói như bạn bè, chỉ nêu nguồn khi cần, chia sẻ cảm nhận của chính My thay vì giải thích bằng khung lý thuyết.', 4, q.turns, 1);
  if (q.flags.lap_cum_tu.p > 0.15) add('lap-cum', 'warn', 'My lặp lại cụm từ giữa các lượt', `Tỉ lệ lượt dùng lại cụm đã nói: ${pc(q.flags.lap_cum_tu)}.`, 'Máy chủ đã đưa danh sách cụm bị lặp vào lời dặn mỗi lượt; nếu vẫn cao, thử model mạnh hơn cho giai đoạn đồng hành hoặc giảm số lượt cố gắng dùng cùng hình ảnh.', 4, q.turns, 2);
  if (q.flags.qua_nhieu_cau_hoi.p > 0.15) add('hoi-nhieu', 'warn', 'My hỏi dồn quá nhiều', `Tỉ lệ lượt hỏi quá mức: ${pc(q.flags.qua_nhieu_cau_hoi)}.`, 'Đúng điều người dùng đã phàn nàn lúc đầu: ràng buộc mỗi lượt tối đa một câu hỏi và luôn tặng một nhận định có giá trị trước khi hỏi.', 4, q.turns, 1);
  if (q.flags.khong_bam_loi_nguoi_dung.p > 0.2) add('khong-bam', 'warn', 'My chưa bám vào chi tiết người dùng kể', `Tỉ lệ lượt không nhắc lại ý nào của người dùng: ${pc(q.flags.khong_bam_loi_nguoi_dung)}.`, 'Nhấn mạnh kỹ thuật phản chiếu: nhắc lại một cụm từ cụ thể của người dùng trong câu đầu.', 4, q.turns, 1);
  const sk = m.intro?.skipFirstVisit;
  if (sk && sk.n >= 20 && sk.p > 0.4) add('bo-qua-intro', 'warn', 'Nhiều người bỏ qua màn mở đầu lần đầu', `Tỉ lệ bỏ qua bản dài (lần đầu): ${pc(sk)}.`, 'Rút bản dài từ khoảng 8,4 giây xuống 4-5 giây (bỏ pha cận mặt nhắm mắt hoặc cho lời chào hiện sớm hơn), rồi đo lại. Chạm để bỏ qua luôn có sẵn nên không mất gì.', 3, sk.n, 1);
  const r = m.satisfaction.resonance;
  if (r.n >= 15 && r.good.p < 0.7) add('dong-cam', 'warn', 'Nhiều người cho rằng My nói chưa đúng', `Tỉ lệ "gần đúng" trở lên: ${pc(r.good)}.`, 'Hỏi "đoạn nào chưa đúng" ngay sau khi đánh giá, rồi dùng câu trả lời để huấn luyện lại cách chọn chi tiết (ưu tiên nét hiếm đã tính, tránh nhận định ai cũng thấy đúng). Lưu ý hiệu ứng Barnum: điểm cao chưa chắc là chính xác.', 5, r.n, 3);
  if (m.satisfaction.nps.n >= 20 && m.satisfaction.nps.score < 30) add('nps', 'warn', 'NPS thấp', `NPS ${m.satisfaction.nps.score} (n=${m.satisfaction.nps.n}).`, 'Đọc lý do của người chấm 0-6 (khi có ô ghi chú), kiểm tra với nhóm tuổi và lĩnh vực nào điểm thấp nhất ở bảng phân khúc.', 4, m.satisfaction.nps.n, 3);
  // điểm rơi lớn nhất của phễu
  let worst = null;
  m.funnel.forEach((s, i) => { if (i && s.fromPrev && s.fromPrev.n >= 20) { const lost = s.fromPrev.n * (1 - s.fromPrev.p); if (!worst || lost > worst.lost) worst = { s, lost }; } });
  if (worst && STEP_ACTIONS[worst.s.key]) {
    const [t, a, ef] = STEP_ACTIONS[worst.s.key];
    add('phễu-' + worst.s.key, 'warn', `Điểm rơi lớn nhất của phễu: ${worst.s.label}`, `${t}. Chuyển đổi từ bước trước: ${pc(worst.s.fromPrev)}; mất khoảng ${Math.round(worst.lost)} người.`, a, 4, worst.s.fromPrev.n, ef);
  }
  if (m.retention.d1.n >= 30 && m.retention.d1.p < 0.2) add('giu-chan', 'warn', 'Tỉ lệ quay lại sau 1 ngày thấp', `D1: ${pc(m.retention.d1)}.`, 'Gửi email nhắc khi hết thời gian nghỉ ("My đã sẵn sàng kể tiếp điều hôm trước"), nội dung nêu đúng điều đã hẹn. Chỉ gửi cho người đã đồng ý.', 4, m.retention.d1.n, 2);
  if (m.growth.share.n >= 30 && m.growth.share.p < 0.05) add('chia-se', 'info', 'Ít người chia sẻ thẻ', `Tỉ lệ chia sẻ: ${pc(m.growth.share)}.`, 'Đưa nút chia sẻ ngay sau lúc người dùng bấm "rất đúng", làm thẻ có câu nói đắt giá thay vì thông tin chung, thêm mã giới thiệu.', 3, m.growth.share.n, 2);
  const cap = m.sessions.reachedCap;
  if (cap.n >= 20) {
    if (cap.p < 0.1) add('gioi-han-30', 'info', 'Hiếm người chạm mốc 30 phút', `Chỉ ${pc(cap)} đi hết buổi.`, 'Giới hạn chưa là yếu tố giữ chân: giá trị chủ yếu quyết định ở 10 phút đầu. Tập trung rút ngắn thời gian tới "điều chạm" đầu tiên.', 3, cap.n, 2);
    else if (cap.p > 0.5) add('gioi-han-30', 'info', 'Đa số chạm mốc 30 phút', `${pc(cap)} đi hết buổi.`, 'Tín hiệu tốt về mức độ gắn kết. Theo dõi tỉ lệ đăng ký sau buổi và phàn nàn về việc bị ngắt giữa chừng.', 2, cap.n, 1);
  }
  for (const key of ['age', 'field']) for (const g of m.segments[key]) {
    const o = m.funnel.find((x) => x.key === 'first_message').fromTop;
    if (g.n >= 20 && o?.p != null && g.firstMessage.p < o.p - 0.15) add(`phan-khuc-${key}-${g.name}`, 'info', `Nhóm "${g.name}" ít bắt đầu trò chuyện`, `Bắt đầu: ${pc(g.firstMessage)} so với mức chung ${Math.round(o.p * 100)}%.`, 'Xem lại bước điểm chung mở đầu cho nhóm này (người nổi tiếng hoặc ngôn ngữ có thực sự gần gũi không).', 3, g.n, 2);
  }
  return out.sort((a, b) => ({ critical: 0, warn: 1, info: 2 }[a.severity] - { critical: 0, warn: 1, info: 2 }[b.severity]) || b.score - a.score);
}
