import test from 'node:test';
import assert from 'node:assert/strict';
import { prevDay, nextStreak, liveStreak, msUntilNextVnDay, fmtCountdown } from '../src/tarot/ritual.js';
import { TOPICS, topicLabel } from '../src/tarot/cards.js';

test('chuỗi ngày rút bài: liên tiếp thì cộng, cùng ngày không cộng, bỏ lỡ thì về 1', () => {
  assert.equal(prevDay('2026-03-01'), '2026-02-28'); assert.equal(prevDay('2026-01-01'), '2025-12-31');
  assert.deepEqual(nextStreak(null, '2026-10-06'), { last: '2026-10-06', n: 1 });
  assert.deepEqual(nextStreak({ last: '2026-10-05', n: 3 }, '2026-10-06'), { last: '2026-10-06', n: 4 });
  assert.deepEqual(nextStreak({ last: '2026-10-06', n: 4 }, '2026-10-06'), { last: '2026-10-06', n: 4 });
  assert.deepEqual(nextStreak({ last: '2026-10-03', n: 9 }, '2026-10-06'), { last: '2026-10-06', n: 1 });
  assert.equal(liveStreak({ last: '2026-10-05', n: 3 }, '2026-10-06'), 3, 'hôm qua đã rút: chuỗi còn, chờ hôm nay');
  assert.equal(liveStreak({ last: '2026-10-04', n: 3 }, '2026-10-06'), 0); assert.equal(liveStreak(null, '2026-10-06'), 0);
});

test('đếm ngược tới 0 giờ ngày mai theo giờ Việt Nam', () => {
  const t = Date.UTC(2026, 9, 6, 16, 0, 0); // 23:00 giờ Việt Nam ngày 6/10
  assert.equal(msUntilNextVnDay(t), 3_600_000); assert.equal(fmtCountdown(3_600_000), '01:00:00');
  assert.equal(msUntilNextVnDay(Date.UTC(2026, 9, 6, 17, 0, 0)), 86_400_000, 'đúng 0 giờ thì còn đủ một ngày');
  assert.equal(fmtCountdown(8_132_100), '02:15:33'); assert.equal(fmtCountdown(-5), '00:00:00');
});

test('chủ đề bốc bài: có nhãn và khóa không trùng', () => {
  assert.equal(new Set(TOPICS.map((t) => t[0])).size, TOPICS.length); assert.equal(topicLabel('tinh-cam'), 'Tình cảm'); assert.equal(topicLabel('x'), null);
});
