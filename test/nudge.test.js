import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldNudge, nudgeShown, nudgeSkipped, nudgeAccepted } from '../src/nudge.js';

test('nhắc Tarot: lần đầu thì nhắc, mỗi ngày tối đa một lần, đã rút hôm nay thì thôi', () => {
  const today = '2026-10-06';
  assert.equal(shouldNudge({ daily: null, nudge: null, today }), true);
  assert.equal(shouldNudge({ daily: { day: today, id: 3 }, nudge: null, today }), false, 'đã rút lá hôm nay');
  assert.equal(shouldNudge({ daily: { day: '2026-10-05', id: 3 }, nudge: null, today }), true, 'lá của hôm qua thì chưa tính');
  assert.equal(shouldNudge({ daily: null, nudge: nudgeShown(null, today), today }), false, 'đã nhắc hôm nay');
});

test('nhắc Tarot: bỏ qua nhiều lần thì thưa dần, rút lá hoặc bấm nhắc thì về nhịp mỗi ngày', () => {
  let n = null, day = '2026-10-01';
  const next = (d) => new Date(Date.parse(d) + 86_400_000).toISOString().slice(0, 10);
  const shownDays = [];
  for (let i = 0; i < 14; i++) { if (shouldNudge({ daily: null, nudge: n, today: day })) { shownDays.push(day); n = nudgeSkipped(nudgeShown(n, day), day); } day = next(day); }
  assert.deepEqual(shownDays.slice(0, 4), ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-08'], 'khoảng cách tăng dần: 1, 2, 4 ngày');
  assert.ok(shownDays.length <= 5, `14 ngày chỉ nhắc ${shownDays.length} lần`);
  assert.equal(shouldNudge({ daily: null, nudge: nudgeAccepted('2026-10-10'), today: '2026-10-11' }), true, 'bấm nhắc xong thì ngày mai nhắc lại bình thường');
});
