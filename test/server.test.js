import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApi } from '../server/routes.js';
import { assessTurn } from '../server/quality.js';
import { computeMetrics, wilson, insights } from '../server/admin.js';
import { cleanProps, ingest } from '../server/events.js';
import { openDb } from '../server/db.js';

function harness(env = {}) {
  const db = openDb(':memory:'); const mails = []; let t = Date.UTC(2026, 9, 4, 3, 0, 0);
  const api = createApi({ db, env: { ADMIN_EMAILS: 'admin@x.vn', ...env }, mailer: async (m) => { mails.push(m); }, now: () => t });
  const server = http.createServer(async (req, res) => { const { pathname } = new URL(req.url, 'http://x'); if (pathname === '/__gate') { const id = api.chatGate(req, res); if (id) res.end('ok'); return; } if (!(await api.handle(req, res, pathname))) { res.writeHead(404); res.end(); } });
  return new Promise((resolve) => server.listen(0, () => {
    const base = `http://127.0.0.1:${server.address().port}`; let jar = {};
    const call = async (method, path, body) => {
      const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') }, body: body ? JSON.stringify(body) : undefined });
      for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); if (/Max-Age=0/.test(c)) delete jar[kv.slice(0, i)]; }
      const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch {} return { status: r.status, body: j, text };
    };
    resolve({ db, api, mails, call, tick: (ms) => { t += ms; }, newJar: () => { jar = {}; }, close: () => server.close() });
  }));
}
const codeOf = (m) => /(\d{6})/.exec(m.text)[1];

test('đăng ký bằng email: mã sai, mã đúng, phiên đăng nhập', async () => {
  const h = await harness();
  assert.equal((await h.call('POST', '/api/auth/request', { email: 'abc' })).status, 400);
  assert.equal((await h.call('POST', '/api/auth/request', { email: 'Nguoi.Dung@Mail.com' })).status, 200);
  assert.equal(h.mails.length, 1); assert.equal(h.mails[0].to, 'nguoi.dung@mail.com');
  assert.equal((await h.call('POST', '/api/auth/request', { email: 'nguoi.dung@mail.com' })).status, 429, 'gửi lại quá nhanh');
  assert.equal((await h.call('POST', '/api/auth/verify', { email: 'nguoi.dung@mail.com', code: '000000' })).status, 401);
  const ok = await h.call('POST', '/api/auth/verify', { email: 'nguoi.dung@mail.com', code: codeOf(h.mails[0]) });
  assert.equal(ok.status, 200); assert.equal(ok.body.isNew, true); assert.equal(ok.body.user.role, 'user');
  const me = await h.call('GET', '/api/me'); assert.equal(me.body.user.email, 'nguoi.dung@mail.com');
  assert.equal((await h.call('POST', '/api/auth/verify', { email: 'nguoi.dung@mail.com', code: codeOf(h.mails[0]) })).status, 400, 'mã dùng một lần');
  await h.call('POST', '/api/auth/logout'); assert.equal((await h.call('GET', '/api/me')).body.user, null);
  h.close();
});

test('nhập sai quá 5 lần thì khóa mã', async () => {
  const h = await harness();
  await h.call('POST', '/api/auth/request', { email: 'a@b.vn' });
  for (let i = 0; i < 5; i++) await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: '111111' });
  assert.equal((await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: codeOf(h.mails[0]) })).status, 429);
  h.close();
});

test('mã hết hạn sau 10 phút', async () => {
  const h = await harness();
  await h.call('POST', '/api/auth/request', { email: 'a@b.vn' }); h.tick(11 * 60_000);
  assert.equal((await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: codeOf(h.mails[0]) })).status, 400);
  h.close();
});

test('người vắng mặt rồi quay lại không bị tính là đã hết buổi đầu', async () => {
  const h = await harness();
  assert.equal((await h.call('POST', '/__gate')).text, 'ok');
  h.tick(6 * 3600_000); assert.equal((await h.call('POST', '/__gate')).text, 'ok');
  h.tick(2 * 24 * 3600_000); assert.equal((await h.call('POST', '/__gate')).text, 'ok');
  h.close();
});

test('người ẩn danh chỉ chat được ~30 phút, đăng ký xong thì tiếp tục', async () => {
  const h = await harness();
  assert.equal((await h.call('POST', '/__gate')).text, 'ok');
  for (let i = 0; i < 7; i++) { h.tick(4 * 60_000); assert.equal((await h.call('POST', '/__gate')).text, 'ok'); } // trò chuyện liên tục tới phút 28
  h.tick(4 * 60_000); h.tick(1); await h.call('POST', '/__gate'); h.tick(4 * 60_000);
  const blocked = await h.call('POST', '/__gate'); assert.equal(blocked.status, 401); assert.equal(blocked.body.needAuth, true);
  await h.call('POST', '/api/auth/request', { email: 'a@b.vn' });
  await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: codeOf(h.mails[0]) });
  assert.equal((await h.call('POST', '/__gate')).text, 'ok');
  h.close();
});

test('tắt tài khoản thì không chặn', async () => {
  const h = await harness({ HUYENMY_ACCOUNTS: 'off' });
  await h.call('POST', '/__gate'); h.tick(90 * 60_000);
  assert.equal((await h.call('POST', '/__gate')).text, 'ok'); h.close();
});

test('đồng bộ trạng thái chỉ khi người dùng đồng ý, lưu mã hóa khi có khóa', async () => {
  const h = await harness({ HUYENMY_DATA_KEY: 'khoa-thu-nghiem' });
  await h.call('POST', '/api/auth/request', { email: 'a@b.vn' });
  await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: codeOf(h.mails[0]) });
  assert.equal((await h.call('PUT', '/api/state', { state: { messages: ['x'] } })).status, 403);
  assert.equal((await h.call('PUT', '/api/state', { consentMemory: true, state: { messages: ['xin chào bí mật'] } })).status, 200);
  const raw = h.db.prepare('SELECT state FROM users').get().state; assert.ok(raw.startsWith('e:') && !raw.includes('bí mật'));
  assert.deepEqual((await h.call('GET', '/api/state')).body.state, { messages: ['xin chào bí mật'] });
  assert.equal((await h.call('PUT', '/api/state', { consentMemory: false })).status, 403);
  assert.equal(h.db.prepare('SELECT state FROM users').get().state, null, 'rút đồng ý thì xóa dữ liệu');
  h.close();
});

test('xóa tài khoản xóa người dùng và phiên, giữ số liệu ẩn danh', async () => {
  const h = await harness();
  await h.call('POST', '/api/auth/request', { email: 'a@b.vn' });
  await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: codeOf(h.mails[0]) });
  await h.call('POST', '/api/event', { sid: 's1', events: [{ name: 'landing_view' }] });
  assert.equal((await h.call('POST', '/api/account/delete')).status, 200);
  assert.equal(h.db.prepare('SELECT COUNT(*) c FROM users').get().c, 0);
  assert.equal(h.db.prepare('SELECT COUNT(*) c FROM events WHERE user_id IS NOT NULL').get().c, 0);
  h.close();
});

test('sự kiện: chỉ nhận tên cho phép, props được làm sạch, không nhận nội dung dài', () => {
  const p = cleanProps({ chip: 'a'.repeat(100), ok: true, n: 3.14159, bad: { x: 1 }, 'x y': 1 });
  assert.equal(p.chip.length, 32); assert.equal(p.ok, true); assert.equal(p.n, 3.14); assert.equal(p.bad, undefined);
  const db = openDb(':memory:');
  assert.equal(ingest(db, { actor: 'a', events: [{ name: 'landing_view' }, { name: 'tu_che' }, { name: 'message_sent', props: { text: 'x'.repeat(500) } }] }), 2);
  assert.equal(JSON.parse(db.prepare("SELECT props FROM events WHERE name='message_sent'").get().props).text.length, 32);
});

test('chất lượng tư vấn: khủng hoảng thiếu hỗ trợ, khẳng định chắc nịch, hỏi dồn, lặp', () => {
  const miss = assessTurn({ phase: 'companion', userMsg: 'Mình muốn chết quá', reply: 'Hà ơi, mình nghe rồi. Bạn kể thêm nhé?', prevReplies: [] });
  assert.ok(miss.flags.includes('khung_hoang_THIEU_HO_TRO') && miss.score <= 40);
  const ok = assessTurn({ phase: 'companion', userMsg: 'Mình muốn chết quá', reply: 'Mình ở đây với bạn. Nếu nguy cấp hãy gọi 115 hoặc nhờ người thân ở bên.', prevReplies: [] });
  assert.ok(ok.flags.includes('khung_hoang_co_ho_tro') && ok.score >= 90);
  assert.ok(assessTurn({ phase: 'companion', userMsg: 'x', reply: 'Chắc chắn bạn sẽ giàu to năm sau.' }).flags.includes('noi_chac_nich'));
  assert.ok(assessTurn({ phase: 'listen', userMsg: 'x', reply: 'Một? Hai? Ba?' }).flags.includes('qua_nhieu_cau_hoi'));
  const a = 'Bạn đã làm việc ở ngân hàng sáu năm rồi mà vẫn chưa được ghi nhận, điều đó thật nặng nề.';
  assert.ok(assessTurn({ phase: 'listen', userMsg: 'ngân hàng', reply: a, prevReplies: [a] }).flags.includes('lap_lai'));
  const g = assessTurn({ phase: 'listen', userMsg: 'công việc ngân hàng mệt mỏi', reply: 'Công việc ở ngân hàng làm bạn mệt mỏi, mình hiểu.', prevReplies: [] });
  assert.ok(g.echo >= 2 && !g.flags.includes('khong_bam_loi_nguoi_dung'));
});

test('Wilson: khoảng tin cậy hợp lý', () => {
  const w = wilson(50, 100); assert.ok(Math.abs(w.p - 0.5) < 1e-9 && w.lo > 0.39 && w.hi < 0.61);
  assert.equal(wilson(0, 0).p, null);
});

function seed(db, now) {
  const ev = db.prepare('INSERT INTO events(ts, actor, sid, name, props) VALUES (?,?,?,?,?)');
  const plan = [['landing_view'], ['enter_click'], ['intake_done', { ageBand: '18-26', field: 'tech' }], ['hook_shown'], ['first_message'], ['message_sent'], ['reading_received'], ['resonance', { value: 3 }], ['session_close'], ['signup_submit'], ['signup_verified']];
  for (let i = 0; i < 100; i++) {
    const depth = i < 100 ? [100, 90, 80, 75, 50, 50, 30, 25, 15, 8, 6].findIndex((n) => i >= n) : 11;
    const steps = depth === -1 ? 11 : depth;
    for (let k = 0; k < steps; k++) ev.run(now - 3 * 86_400_000 + k * 60_000, `a${i}`, `s${i}`, plan[k][0], JSON.stringify(plan[k][1] ?? {}));
    if (i < 40) ev.run(now - 2 * 86_400_000, `a${i}`, `s${i}b`, 'landing_view', '{}'); // quay lại sau 1 ngày
  }
}
test('số liệu quản trị: phễu, giữ chân, khuyến nghị, quyền truy cập', async () => {
  const h = await harness(); const now = Date.UTC(2026, 9, 4, 3, 0, 0);
  seed(h.db, now);
  h.db.prepare("INSERT INTO turns(ts, actor, phase, ms, words, q, tags, rep, echo, score, flags, ok) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)").run(now - 1000, 'a1', 'companion', 30000, 60, 1, 1, 0, 2, 40, 'khung_hoang_THIEU_HO_TRO');
  const m = computeMetrics(h.db, { days: 14, now });
  assert.equal(m.funnel[0].count, 100); assert.ok(m.funnel[4].count < m.funnel[3].count);
  assert.ok(m.retention.d1.p > 0.3, 'D1 từ 40 người quay lại'); assert.equal(m.satisfaction.resonance.n, m.funnel.find((f) => f.key === 'resonance').count);
  assert.equal(m.insights[0].id, 'khung-hoang', 'khủng hoảng thiếu hỗ trợ luôn xếp đầu');
  assert.ok(m.insights.some((i) => i.id.startsWith('phễu-')));
  assert.ok(m.insights.every((i) => i.confidence >= 1 && i.confidence <= 5 && Number.isFinite(i.score)));
  assert.equal(insights({ ...m, visitors: 10 }).some((i) => i.id === 'du-lieu'), true);
  // quyền truy cập
  assert.equal((await h.call('GET', '/api/admin/metrics')).status, 401);
  await h.call('POST', '/api/auth/request', { email: 'user@x.vn' }); await h.call('POST', '/api/auth/verify', { email: 'user@x.vn', code: codeOf(h.mails[0]) });
  assert.equal((await h.call('GET', '/api/admin/metrics')).status, 403);
  h.newJar(); h.tick(61_000);
  await h.call('POST', '/api/auth/request', { email: 'admin@x.vn' }); await h.call('POST', '/api/auth/verify', { email: 'admin@x.vn', code: codeOf(h.mails.at(-1)) });
  const r = await h.call('GET', '/api/admin/metrics?days=14'); assert.equal(r.status, 200); assert.ok(r.body.funnel.length === 10);
  h.close();
});

test('gửi điều thú vị vào email: cần đăng nhập, làm sạch nội dung, giới hạn tần suất', async () => {
  const h = await harness();
  assert.equal((await h.call('POST', '/api/account/hook', { lines: ['x'] })).status, 401);
  await h.call('POST', '/api/auth/request', { email: 'a@b.vn' });
  await h.call('POST', '/api/auth/verify', { email: 'a@b.vn', code: codeOf(h.mails[0]) });
  assert.equal((await h.call('POST', '/api/account/hook', { lines: [] })).status, 400);
  const r = await h.call('POST', '/api/account/hook', { lines: ['Ngày 5/8 có Reid Hoffman <b>x</b>', 'Nét hiếm: Tụ 4 thiên thể'] });
  assert.equal(r.status, 200);
  const m = h.mails.at(-1); assert.equal(m.to, 'a@b.vn'); assert.ok(m.text.includes('Reid Hoffman') && !m.text.includes('<b>') && m.text.includes('không phải lời tiên đoán'));
  assert.equal((await h.call('POST', '/api/account/hook', { lines: ['lại'] })).status, 429);
  h.close();
});

import { repeatedPhrases, stockHits, pickLinkers, wordsOf } from '../server/voice.js';
import { voiceBlock } from '../server/persona.js';
test('giọng người thật: bắt cụm lặp, khuôn sáo, và đổi cách nối mỗi lượt', () => {
  const prev = ['Nhưng My muốn hỏi thẳng, bạn đã thử ngỏ lời với ai chưa?', 'Nhưng My muốn hỏi thẳng, điều gì làm bạn mệt nhất?', 'Ừ, chỗ đó nghe cũng buồn cười thật.'];
  const rep = repeatedPhrases(prev);
  assert.ok(rep.some((g) => g.includes('my muốn hỏi')), 'phải bắt được cụm lặp');
  assert.ok(!rep.some((g) => g.includes('buồn cười')), 'cụm chỉ xuất hiện một lần thì không bị tính là lặp');
  assert.deepEqual(stockHits('Mình làm bằng sự tử tế chứ không phải để dội nước lạnh.').sort(), ['doi_lap', 'hoi_thang']);
  assert.deepEqual(stockHits('Hôm nay trời mát, bạn đi bộ một vòng thử xem.'), []);
  assert.deepEqual(stockHits('Cảm ơn bạn đã chia sẻ, My nghe rồi.'), ['nghe_roi']);
  assert.notDeepEqual(pickLinkers('lượt 1'), pickLinkers('lượt 2'));
  assert.equal(new Set(pickLinkers('x', 3)).size, 3);
  const msgs = [{ role: 'user', content: 'a' }, ...prev.slice(0, 2).flatMap((c) => [{ role: 'assistant', content: c }, { role: 'user', content: 'b' }])];
  assert.match(voiceBlock(msgs), /TUYỆT ĐỐI KHÔNG dùng lại/);
  assert.ok(wordsOf('[[vui]]Xin chào!').join(' ') === 'xin chào');
});
test('chấm chất lượng bắt khuôn sáo và lặp cụm', () => {
  const a = assessTurn({ phase: 'companion', userMsg: 'công việc mệt mỏi', reply: 'Nhưng My muốn hỏi thẳng, bằng sự tử tế chứ không phải để dội nước lạnh: công việc làm bạn mệt thế nào?', prevReplies: ['Nhưng My muốn hỏi thẳng, bạn mệt vì điều gì?', 'Nhưng My muốn hỏi thẳng, bạn đã nói với ai chưa?'] });
  assert.ok(a.flags.includes('cum_sao_ron') && a.flags.includes('lap_cum_tu'));
  const b = assessTurn({ phase: 'companion', userMsg: 'công việc mệt mỏi', reply: 'Sáu năm một bàn làm việc, nghe là biết mệt rồi. Hôm nay có chuyện gì thêm không?', prevReplies: ['Ừ, chỗ đó My cũng thấy lạ.'] });
  assert.ok(!b.flags.includes('cum_sao_ron') && !b.flags.includes('lap_cum_tu'));
});

test('sendMail: production không có Resend thì báo lỗi, trừ khi bật MAIL_TO_LOG=1', async () => {
  const { sendMail } = await import('../server/auth.js');
  await assert.rejects(() => sendMail({ to: 'a@b.vn', subject: 's', text: 't' }, { NODE_ENV: 'production' }));
  const r = await sendMail({ to: 'a@b.vn', subject: 's', text: 't' }, { NODE_ENV: 'production', MAIL_TO_LOG: '1' });
  assert.equal(r.sent, false);
});

import { dueReminders, runReminders, buildReminder } from '../server/reminders.js';
test('email nhắc: chỉ gửi cho người đồng ý, đúng thời điểm, tối đa 1 thư/tuần, dừng sau 3 thư, hủy được', async () => {
  const db = openDb(':memory:'), H = 3_600_000, D = 24 * H, T0 = 1_800_000_000_000;
  const ins = db.prepare('INSERT INTO users(email, created_at, last_login, remind_optin, remind_token) VALUES (?,?,?,?,?)');
  ins.run('yes@x.vn', T0, T0, 1, 'tok-yes'); ins.run('no@x.vn', T0, T0, 0, 'tok-no');
  const sent = []; const mail = async (m) => { sent.push(m); };
  const run = (now) => runReminders({ db, mail, now, baseUrl: 'https://x.app' });
  assert.equal(await run(T0 + 5 * H), 0);                       // mới dùng, chưa đến 24 giờ
  assert.equal(await run(T0 + 25 * H), 1);                      // vắng 25 giờ: nhắc người đã đồng ý, không nhắc người chưa đồng ý
  assert.equal(sent[0].to, 'yes@x.vn'); assert.match(sent[0].text, /api\/unsub\?t=tok-yes/); assert.ok(sent[0].headers['List-Unsubscribe']);
  assert.equal(await run(T0 + 3 * D), 0);                       // chưa đủ 7 ngày
  assert.equal(await run(T0 + 9 * D), 1); assert.equal(await run(T0 + 17 * D), 1);   // thư 2, thư 3
  assert.equal(await run(T0 + 30 * D), 0);                      // đã 3 thư mà chưa quay lại: dừng hẳn
  db.prepare('UPDATE users SET last_login = ? WHERE email = ?').run(T0 + 31 * D, 'yes@x.vn'); // người dùng quay lại
  assert.equal(await run(T0 + 33 * D), 1);                      // tính lại từ đầu
  db.prepare('UPDATE users SET remind_optin = 0 WHERE remind_token = ?').run('tok-yes');       // hủy
  assert.equal(await run(T0 + 90 * D), 0);
  assert.match(buildReminder('https://x.app', 'abc').text, /hủy|thôi nhận/i);
});

test('đăng ký có chọn nhận nhắc, hủy bằng liên kết một chạm, bật tắt trong tài khoản', async () => {
  const h = await harness();
  await h.call('POST', '/api/auth/request', { email: 'r@x.vn' });
  const v = await h.call('POST', '/api/auth/verify', { email: 'r@x.vn', code: codeOf(h.mails[0]), remind: true });
  assert.equal(v.body.user.remind, true);
  const tok = h.db.prepare('SELECT remind_token t FROM users').get().t; assert.ok(tok);
  const un = await h.call('GET', `/api/unsub?t=${tok}`); assert.equal(un.status, 200); assert.match(un.text, /Đã hủy/);
  assert.equal(h.db.prepare('SELECT remind_optin o FROM users').get().o, 0);
  assert.equal((await h.call('GET', '/api/unsub?t=sai')).text.includes('không còn hiệu lực'), true);
  assert.equal((await h.call('POST', '/api/account/remind', { on: true })).body.remind, true);
  assert.equal(h.db.prepare('SELECT remind_optin o FROM users').get().o, 1);
  assert.equal((await h.call('POST', '/api/unsub?t=' + tok)).status, 200);  // hủy một chạm theo chuẩn List-Unsubscribe-Post
  h.close();
});

// ---- quản trị: người tham gia và hành trình cảm xúc ----
import { analyzeAffect } from '../server/affect.js';
import { computeJourney, listParticipants, meanCi } from '../server/people.js';

test('từ điển cảm xúc: phủ định, cường độ, emoji và không lưu chữ', () => {
  assert.equal(analyzeAffect('Tôi rất mệt và lo').emo === 'met_moi' || analyzeAffect('Tôi rất mệt và lo').emo === 'lo_au', true);
  assert.ok(analyzeAffect('Mình thấy nhẹ lòng hơn nhiều, cảm ơn My').val > 0.5);
  assert.ok(analyzeAffect('Tôi buồn lắm, cô đơn nữa').val < -0.8);
  assert.equal(analyzeAffect('Tôi không vui, chẳng ai hiểu mình cả').emo, 'buon');
  assert.ok(analyzeAffect('Mình không buồn nữa, bớt lo rồi').val > 0, 'phủ định chỉ áp cho từ khoá sát bên');
  assert.equal(analyzeAffect('ừ').emo, 'trung_tinh');
  assert.equal(analyzeAffect('ừ').disc, 0);
  assert.ok(analyzeAffect('toi chan nan va co don, gia dinh khong ai hieu').val < 0, 'gõ không dấu vẫn hiểu');
  const r = analyzeAffect('Mình rất lo, tôi buồn');
  assert.deepEqual(Object.keys(r).sort(), ['aro', 'disc', 'emo', 'hits', 'val', 'words']);
});

test('khoảng tin cậy trung bình: cỡ mẫu nhỏ thì rộng, n=1 thì không có khoảng', () => {
  assert.equal(meanCi([]).mean, null);
  assert.equal(meanCi([2]).lo, null);
  const c = meanCi([1, 1, 1, 1, 3]); assert.ok(c.lo < c.mean && c.hi > c.mean);
});

test('quản trị: người tham gia, tự đánh giá tâm trạng và hành trình cảm xúc', async () => {
  const h = await harness();
  const T0 = Date.UTC(2026, 9, 4, 3, 0, 0);
  const evt = (actor, name, props, t) => ingest(h.db, { actor, sid: `s-${actor}`, events: [{ name, props, t }] }, T0 + 3_600_000);
  const turn = (actor, ut, msg, phase = 'listen') => h.api.recordTurn({ actor, sid: `s-${actor}`, phase, minute: ut * 2, ms: 1000, ttft: 300, reply: '[[dong_cam]]My nghe bạn.', userMsg: msg, userHistory: '', prevReplies: [], ok: true, ut });
  const people = [['a1', 2, 5], ['a2', 3, 3], ['a3', 1, 2]]; // [actor, đầu, cuối]
  for (const [a, s, e] of people) {
    evt(a, 'landing_view', {}, T0); evt(a, 'intake_done', { ageBand: '27-40', gender: 'nu', field: 'edu' }, T0 + 1000);
    evt(a, 'mood_check', { phase: 'start', value: s }, T0 + 2000); evt(a, 'first_message', {}, T0 + 3000);
    ['Tôi rất buồn và mệt', 'Vẫn lo lắm', 'Có nói ra thì nhẹ lòng hơn', 'Cảm ơn My, mình thấy bình yên hơn'].forEach((m, i) => turn(a, i + 1, m, i === 1 ? 'reading' : 'listen'));
    evt(a, 'mood_check', { phase: 'end', value: e }, T0 + 9000);
  }
  const rows = listParticipants(h.db, { now: T0 + 3_600_000 }).rows;
  assert.equal(rows.length, 3);
  const r1 = rows.find((r) => r.id.startsWith('A-a1'));
  assert.equal(r1.moodDelta, 3); assert.equal(r1.ageBand, '27-40'); assert.equal(r1.userTurns, 4); assert.equal(r1.trend, 'Cải thiện');
  const j = computeJourney(h.db, { now: T0 + 3_600_000 });
  assert.equal(j.selfReport.paired, 3);
  assert.equal(j.selfReport.delta.mean, 1.33, 'trung bình (3 + 0 + -1) / 3');
  assert.equal(j.byTurn[0].n, 3); assert.ok(j.byTurn[3].val.mean > j.byTurn[0].val.mean, 'sắc thái nhẹ dần theo lượt');
  assert.ok(j.emoShare.find((e) => e.emo === 'buon').first > 0);
  // quyền truy cập
  assert.equal((await h.call('GET', '/api/admin/journey')).status, 401);
  await h.call('POST', '/api/auth/request', { email: 'user@x.vn' }); await h.call('POST', '/api/auth/verify', { email: 'user@x.vn', code: codeOf(h.mails.at(-1)) });
  assert.equal((await h.call('GET', '/api/admin/participants')).status, 403);
  h.tick(60_000); await h.call('POST', '/api/auth/logout'); h.newJar();
  await h.call('POST', '/api/auth/request', { email: 'admin@x.vn' }); await h.call('POST', '/api/auth/verify', { email: 'admin@x.vn', code: codeOf(h.mails.at(-1)) });
  const list = await h.call('GET', '/api/admin/participants'); assert.equal(list.status, 200); assert.equal(list.body.rows.length, 4, '3 người thử và tài khoản user@x.vn vừa tạo, admin không tính');
  const det = await h.call('GET', `/api/admin/participant?id=${encodeURIComponent(r1.id)}`); assert.equal(det.status, 200); assert.equal(det.body.turns.length, 4);
  const csv = await h.call('GET', '/api/admin/export/turns.csv'); assert.equal(csv.status, 200); assert.match(csv.text, /person,ts,ut,phase/); assert.ok(!/Tôi rất buồn/.test(csv.text), 'không có nội dung trò chuyện');
  h.close();
});

test('xóa tài khoản xóa luôn chỉ số cảm xúc và liên kết', async () => {
  const h = await harness();
  await h.call('POST', '/api/auth/request', { email: 'xoa@x.vn' }); const v = await h.call('POST', '/api/auth/verify', { email: 'xoa@x.vn', code: codeOf(h.mails[0]) });
  const uid = v.body.user.id;
  h.api.recordTurn({ actor: `u${uid}`, sid: 's', phase: 'listen', minute: 1, ms: 1, ttft: 1, reply: '[[an_ui]]ok', userMsg: 'tôi buồn', userHistory: '', prevReplies: [], ok: true, ut: 1 });
  assert.equal(h.db.prepare('SELECT COUNT(*) c FROM turns WHERE actor = ?').get(`u${uid}`).c, 1);
  assert.equal((await h.call('POST', '/api/account/delete')).status, 200);
  assert.equal(h.db.prepare('SELECT COUNT(*) c FROM turns WHERE actor = ?').get(`u${uid}`).c, 0);
  h.close();
});

test('một lăng kính mỗi lượt: cờ trộn nhiều hệ và lời dặn theo lăng kính đã chọn', async () => {
  const mix = assessTurn({ phase: 'companion', reply: '[[chia_se]]Theo Tử Vi cung Mệnh của bạn mạnh, Tứ Trụ nhật chủ Đinh cũng vậy, còn chiêm tinh Mặt Trăng thì khác.', userMsg: 'công việc', prevReplies: [] });
  assert.ok(mix.flags.includes('qua_nhieu_he'));
  const one = assessTurn({ phase: 'companion', reply: '[[chia_se]]Theo Tử Vi, cung Mệnh của bạn có sao chủ về sự kiên nhẫn.', userMsg: 'công việc', prevReplies: [] });
  assert.ok(!one.flags.includes('qua_nhieu_he'));
  const { buildSystemPrompt } = await import('../server/persona.js');
  const { normalizeProfile, buildChart } = await import('../src/engine/index.js');
  const profile = normalizeProfile({ fullName: 'Trần An', gender: 'nu', birth: { y: 1990, m: 5, d: 5, hour: null, minute: null } });
  const chart = buildChart(profile);
  assert.match(buildSystemPrompt('reading', profile, chart, [], { lens: 'tutru' }), /LĂNG KÍNH NGƯỜI NÀY CHỌN: Tứ Trụ/);
  assert.match(buildSystemPrompt('reading', profile, chart, [], { lens: 'none' }), /không dùng thuật ngữ nào/);
  assert.doesNotMatch(buildSystemPrompt('reading', profile, chart, [], {}), /LĂNG KÍNH NGƯỜI NÀY CHỌN:/);
});

test('thử nghiệm lời chào: gom theo biến thể và chỉ kết luận khi đủ mẫu', async () => {
  const h = await harness(); const T0 = Date.UTC(2026, 9, 4, 3, 0, 0), N = T0 + 3_600_000;
  const evt = (a, name, props) => ingest(h.db, { actor: a, sid: `s-${a}`, events: [{ name, props, t: T0 }] }, N);
  for (let i = 0; i < 6; i++) { // 3 người bỏ qua mở đầu ở biến thể goc, 3 người xem hết ở biến thể an_tam
    const a = `g${i}`, v = i < 3 ? 'goc' : 'an_tam';
    evt(a, 'landing_view', { gv: v }); evt(a, 'intro_view', { kind: 'full', gv: v });
    if (i < 3) evt(a, 'intro_skip', { kind: 'full', gv: v });
    evt(a, 'enter_click', {}); if (i % 2) { evt(a, 'intake_done', {}); evt(a, 'first_message', {}); }
  }
  const j = computeJourney(h.db, { now: N });
  const goc = j.greetTest.find((g) => g.variant === 'goc'), at = j.greetTest.find((g) => g.variant === 'an_tam');
  assert.equal(goc.n, 3); assert.equal(goc.skip.p, 1); assert.equal(at.skip.p, 0);
  assert.equal(at.chat.p, 2 / 3);
  assert.match(j.greetVerdict, /Chưa đủ dữ liệu/);
  assert.ok(listParticipants(h.db, { now: N }).rows.every((r) => r.greet), 'mỗi người có lời chào được gán');
  h.close();
});
