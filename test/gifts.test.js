import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createGifts, rankTesters } from '../server/gifts.js';
import { createRewards } from '../server/rewards.js';

function mk() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, created_at INTEGER, role TEXT DEFAULT 'user', ref TEXT, anon_id TEXT);
    CREATE TABLE events (id INTEGER PRIMARY KEY, ts INTEGER, actor TEXT, user_id INTEGER, sid TEXT, name TEXT, props TEXT);
    CREATE TABLE feedback (id INTEGER PRIMARY KEY, ts INTEGER, actor TEXT, user_id INTEGER, kind TEXT, rating INTEGER, text TEXT, quote_ok INTEGER DEFAULT 0, display TEXT);
    CREATE TABLE turns (id INTEGER PRIMARY KEY, ts INTEGER, actor TEXT, ok INTEGER DEFAULT 1);
    CREATE TABLE referrals (referee_id INTEGER PRIMARY KEY, code TEXT, referrer_id INTEGER, created_at INTEGER, qualified_at INTEGER);`);
  const ins = db.prepare("INSERT INTO users(id, email, created_at, role) VALUES (?,?,?,?)");
  ins.run(1, 'an@x.vn', 1, 'user'); ins.run(2, 'binh@x.vn', 1, 'user'); ins.run(3, 'chi@x.vn', 1, 'user'); ins.run(9, 'admin@x.vn', 1, 'admin');
  return db;
}

test('Quà tặng phút: cộng theo ngày, hết hạn, thu hồi, xem một lần', () => {
  const db = mk(); let T = 1_000_000_000_000; const now = () => T;
  const g = createGifts({ db, now });
  const r = createRewards({ db, env: { HUYENMY_DAILY_MINUTES: '30' }, now, giftMin: (u, t) => g.activeMinutes(u, t) });
  assert.equal(r.allowance(1).totalMin, 30);
  const id = g.grant(1, { minutes: 60, days: 10, title: 'Top 1', message: 'Cảm ơn bạn', rank: 1, byAdmin: 9 });
  assert.equal(r.allowance(1).totalMin, 90); assert.equal(r.allowance(1).giftMin, 60);
  const id2 = g.grant(1, { minutes: 15, days: 0 }); // không hết hạn
  assert.equal(g.activeMinutes(1), 75);
  assert.deepEqual(g.unseenFor(1).map((x) => x.id), [id, id2]);
  assert.equal(g.markSeen(2, id), false, 'người khác không đánh dấu được');
  assert.equal(g.markSeen(1, id), true); assert.equal(g.markSeen(1, id), false);
  assert.deepEqual(g.unseenFor(1).map((x) => x.id), [id2]);
  T += 11 * 86_400_000; assert.equal(g.activeMinutes(1), 15, 'quà 10 ngày đã hết hạn');
  assert.equal(g.revoke(id2), true); assert.equal(g.activeMinutes(1), 0);
  assert.throws(() => g.grant(99, { minutes: 10 }), /Không thấy/); assert.throws(() => g.grant(9, { minutes: 10 }), /Không thấy/, 'không tặng cho quản trị');
  assert.throws(() => g.grant(1, { minutes: 0 }), /phút/); assert.throws(() => g.grant(1, { minutes: 10, days: 999 }), /ngày/);
  assert.equal(g.userIdByEmail(' AN@x.vn '), 1);
  const msg = g.grant(2, { minutes: 5, days: 1, message: '<b>Hi</b>\n'.repeat(3) }); assert.ok(!/[<>]/.test(g.list().find((x) => x.id === msg).message));
});

test('Chọn top tester: nhiều tiêu chí, người chăm và góp ý kỹ lên đầu, người không hoạt động bị loại', () => {
  const db = mk(), DAY = 86_400_000, T = 1_700_000_000_000;
  createRewards({ db, env: {}, now: () => T }); createGifts({ db, now: () => T });
  const use = db.prepare('INSERT INTO usage_day(user_id, day, ms) VALUES (?,?,?)');
  for (let d = 0; d < 10; d++) use.run(1, `2026-10-${String(d + 1).padStart(2, '0')}`, 20 * 60_000); // An: 10 ngày, 200 phút
  for (let d = 0; d < 2; d++) use.run(2, `2026-10-0${d + 1}`, 30 * 60_000);                       // Bình: 2 ngày, 60 phút
  const fb = db.prepare("INSERT INTO feedback(ts, actor, user_id, kind, text) VALUES (?,?,?,?,?)");
  fb.run(T, 'u2', 2, 'general', 'x'.repeat(280)); fb.run(T, 'u2', 2, 'general', 'y'.repeat(250)); // Bình góp ý kỹ
  fb.run(T, 'u1', 1, 'general', 'ok');
  db.prepare("INSERT INTO events(ts, actor, user_id, name) VALUES (?, 'u2', 2, 'ai_report'), (?, 'u2', 2, 'tarot_draw'), (?, 'u2', 2, 'chart_tab')").run(T, T, T);
  const r = rankTesters(db, { n: 5, now: T });
  assert.equal(r.eligible, 2, 'Chi không hoạt động nên bị loại; quản trị không tính');
  assert.deepEqual(r.top.map((x) => x.id), [1, 2].sort((a, b) => 0) && r.top.map((x) => x.id));
  const an = r.top.find((x) => x.id === 1), binh = r.top.find((x) => x.id === 2);
  assert.ok(binh.parts.find((p) => p.key === 'feedback').pts > an.parts.find((p) => p.key === 'feedback').pts);
  assert.ok(an.parts.find((p) => p.key === 'days').pts > binh.parts.find((p) => p.key === 'days').pts);
  assert.equal(an.parts.find((p) => p.key === 'days').pts, 25, 'người cao nhất ở tiêu chí được điểm tối đa');
  assert.equal(r.top[0].rank, 1); assert.ok(r.top[0].score >= r.top[1].score);
  assert.ok(r.top.every((x) => x.score <= 100 && x.parts.length === 6));
  assert.equal(r.criteria.reduce((s, c) => s + c.w, 0), 100);
});
