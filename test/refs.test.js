import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { refStats, refFunnelOf, channelCode } from '../server/refs.js';

function mk() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE anon (id TEXT PRIMARY KEY, first_seen INTEGER NOT NULL, first_chat INTEGER, ref TEXT);
    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, created_at INTEGER, role TEXT DEFAULT 'user', ref TEXT, anon_id TEXT);
    CREATE TABLE referrals (referee_id INTEGER PRIMARY KEY, code TEXT NOT NULL, referrer_id INTEGER, created_at INTEGER NOT NULL, qualified_at INTEGER);`);
  return db;
}

test('Mã kênh và mã thành viên: phễu vào trang, trò chuyện, đăng ký, đạt', () => {
  const db = mk(), T = 1_000_000;
  db.prepare("INSERT INTO users(id, email, created_at, role, anon_id) VALUES (1, 'a@x', ?, 'user', 'abcd1234zzzz')").run(T);
  const ins = db.prepare('INSERT INTO anon(id, first_seen, first_chat, ref) VALUES (?,?,?,?)');
  ins.run('v1', T + 1, T + 5, 'abcd1234'); ins.run('v2', T + 2, null, 'abcd1234'); ins.run('v3', T + 3, T + 9, 'zalo-nhom1'); ins.run('v4', T + 4, null, 'zalo-nhom1'); ins.run('v5', T + 5, null, 'zalo-nhom1');
  ins.run('v6', T + 6, null, null); // không có mã: không tính
  db.prepare("INSERT INTO users(id, email, created_at, role, ref) VALUES (2, 'b@x', ?, 'user', 'abcd1234'), (3, 'c@x', ?, 'user', 'zalo-nhom1'), (4, 'd@x', ?, 'admin', 'zalo-nhom1')").run(T + 10, T + 11, T + 12);
  db.prepare('INSERT INTO referrals(referee_id, code, referrer_id, created_at, qualified_at) VALUES (2, ?, 1, ?, ?)').run('abcd1234', T + 10, T + 99);
  const { rows, totals } = refStats(db, { from: 0 });
  const mem = rows.find((r) => r.code === 'abcd1234'), ch = rows.find((r) => r.code === 'zalo-nhom1');
  assert.deepEqual([mem.kind, mem.visitors, mem.chatted, mem.signups, mem.qualified], ['member', 2, 1, 1, 1]);
  assert.equal(mem.memberId, 1);
  assert.deepEqual([ch.kind, ch.visitors, ch.chatted, ch.signups, ch.qualified], ['channel', 3, 1, 1, 0], 'tài khoản quản trị không tính là đăng ký');
  assert.equal(ch.conv, 33.3);
  assert.deepEqual([totals.visitors, totals.signups, totals.member, totals.channel], [5, 2, 1, 1]);
  assert.ok(!JSON.stringify(rows).includes('@x'), 'không lộ email');
  assert.deepEqual(refFunnelOf(db, 'abcd1234'), { visitors: 2, chatted: 1, signups: 1 });
  assert.deepEqual(refFunnelOf(db, 'khong-co'), { visitors: 0, chatted: 0, signups: 0 });
  assert.equal(refStats(db, { from: T + 4 }).rows.find((r) => r.code === 'zalo-nhom1').visitors, 2, 'lọc theo kỳ');
});

test('Mã kênh được chuẩn hóa an toàn cho ?ref=', () => {
  assert.equal(channelCode('Nhóm Zalo Tarot #1!'), 'nhom-zalo-tarot-1');
  assert.equal(channelCode('Đà Nẵng'), 'da-nang');
  assert.equal(channelCode('x'.repeat(50)).length, 20);
  assert.equal(channelCode('<script>'), 'script');
});
