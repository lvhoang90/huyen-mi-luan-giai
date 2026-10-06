import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, cardById, drawCards, dailyCard, vnDay } from '../src/tarot/cards.js';
import { tarotBlock, buildSystemPrompt } from '../server/persona.js';
import { normalizeProfile, buildChart } from '../src/engine/index.js';

test('bộ bài có đủ 22 lá, mỗi lá đủ trường và không trùng', () => {
  assert.equal(CARDS.length, 22);
  assert.deepEqual(CARDS.map((c) => c.id), Array.from({ length: 22 }, (_, i) => i));
  assert.equal(new Set(CARDS.map((c) => c.name)).size, 22);
  for (const c of CARDS) {
    for (const k of ['roman', 'name', 'en', 'gist', 'mirror', 'step', 'emo']) assert.ok(c[k] && String(c[k]).length >= 1, `${c.id} thiếu ${k}`);
    assert.equal(c.keys.length, 3);
    assert.ok(c.gist.length < 260 && c.mirror.endsWith('?'), `${c.id} lời quá dài hoặc câu hỏi không có dấu hỏi`);
    // lời đọc không dọa và không dự báo sự kiện
    assert.doesNotMatch(`${c.gist} ${c.mirror} ${c.step}`, /sẽ chết|tai họa|đại họa|hạn nặng|số khổ/i, `${c.name} có lời dọa`);
  }
  assert.equal(cardById('13').name, 'Chuyển Hóa'); assert.equal(cardById(99), null);
});

test('rút bài: ba lá khác nhau, nằm trong bộ; lá của ngày cố định theo người và ngày', () => {
  for (let i = 0; i < 50; i++) { const d = drawCards(3); assert.equal(new Set(d).size, 3); assert.ok(d.every((x) => x >= 0 && x <= 21)); }
  assert.equal(drawCards(30).length, 22, 'không rút quá số lá có');
  assert.equal(dailyCard('abc', '2026-10-06'), dailyCard('abc', '2026-10-06'));
  const days = new Set(Array.from({ length: 40 }, (_, i) => dailyCard('abc', `2026-10-${String(i + 1).padStart(2, '0')}`)));
  assert.ok(days.size >= 12, 'các ngày khác nhau cho nhiều lá khác nhau');
  const people = new Set(Array.from({ length: 40 }, (_, i) => dailyCard(`u${i}`, '2026-10-06')));
  assert.ok(people.size >= 12, 'người khác nhau cho nhiều lá khác nhau');
  // phân bố không thiên vị quá mức
  const cnt = new Array(22).fill(0); for (let i = 0; i < 4400; i++) cnt[dailyCard(`p${i}`, '2026-01-01')]++;
  assert.ok(Math.min(...cnt) > 100 && Math.max(...cnt) < 320, `phân bố lệch: ${cnt.join(',')}`);
  assert.equal(vnDay(new Date(Date.UTC(2026, 9, 5, 18, 0, 0))), '2026-10-06', 'ngày tính theo giờ Việt Nam (UTC+7)');
});

test('lời nhắc cho My: có lá bài vừa rút, đã lọc và chỉ khi có', () => {
  assert.equal(tarotBlock(null), ''); assert.equal(tarotBlock([]), ''); assert.equal(tarotBlock([99, -1, 'x']), '');
  const t = tarotBlock([16, '0', 7, 3, 1]);
  assert.match(t, /Tòa Tháp/); assert.match(t, /Kẻ Khờ/); assert.match(t, /Cỗ Xe/); assert.doesNotMatch(t, /Hoàng Hậu/, 'tối đa ba lá');
  assert.match(t, /rút ngẫu nhiên/); assert.match(t, /không dự báo/);
  const profile = normalizeProfile({ fullName: 'Trần An', gender: 'nu', birth: { y: 1990, m: 5, d: 5, hour: 9, minute: 0 } }), chart = buildChart(profile);
  const withT = buildSystemPrompt('companion', profile, chart, [{ role: 'user', content: 'chào' }], { tarot: [13] });
  assert.match(withT, /Chuyển Hóa/); assert.doesNotMatch(buildSystemPrompt('companion', profile, chart, [{ role: 'user', content: 'chào' }], {}), /VỪA RÚT TAROT/);
});
