import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, cardById, drawCards, dailyCard, vnDay, parseCardIds } from '../src/tarot/cards.js';
import { tarotBlock, buildSystemPrompt } from '../server/persona.js';
import { normalizeProfile, buildChart, famousStory, famousTies } from '../src/engine/index.js';

test('bộ bài có đủ 78 lá, mỗi lá đủ trường và không trùng', () => {
  assert.equal(CARDS.length, 78);
  assert.deepEqual(CARDS.map((c) => c.id), Array.from({ length: 78 }, (_, i) => i));
  assert.equal(new Set(CARDS.map((c) => c.name)).size, 78);
  for (const c of CARDS) {
    for (const k of ['roman', 'name', 'en', 'gist', 'mirror', 'step', 'emo']) assert.ok(c[k] && String(c[k]).length >= 1, `${c.id} thiếu ${k}`);
    assert.equal(c.keys.length, 3);
    assert.ok(c.gist.length < 260 && c.mirror.endsWith('?'), `${c.id} lời quá dài hoặc câu hỏi không có dấu hỏi`);
    // lời đọc không dọa và không dự báo sự kiện
    assert.doesNotMatch(`${c.gist} ${c.mirror} ${c.step}`, /sẽ chết|tai họa|đại họa|hạn nặng|số khổ/i, `${c.name} có lời dọa`);
  }
  assert.equal(cardById('13').name, 'Chuyển Hóa'); assert.equal(cardById(77).name, 'Vua Tiền'); assert.equal(cardById(22).name, 'Át Gậy');
  for (const s of ['gay', 'coc', 'kiem', 'tien']) assert.equal(CARDS.filter((c) => c.suit === s).length, 14, `bộ ${s} đủ 14 lá`); assert.equal(cardById(99), null);
});

test('rút bài: ba lá khác nhau, nằm trong bộ; lá của ngày cố định theo người và ngày', () => {
  for (let i = 0; i < 50; i++) { const d = drawCards(3); assert.equal(new Set(d).size, 3); assert.ok(d.every((x) => x >= 0 && x <= 77)); }
  assert.equal(drawCards(100).length, 78, 'không rút quá số lá có');
  assert.equal(dailyCard('abc', '2026-10-06'), dailyCard('abc', '2026-10-06'));
  const days = new Set(Array.from({ length: 40 }, (_, i) => dailyCard('abc', `2026-10-${String(i + 1).padStart(2, '0')}`)));
  assert.ok(days.size >= 12, 'các ngày khác nhau cho nhiều lá khác nhau');
  const people = new Set(Array.from({ length: 40 }, (_, i) => dailyCard(`u${i}`, '2026-10-06')));
  assert.ok(people.size >= 12, 'người khác nhau cho nhiều lá khác nhau');
  // phân bố không thiên vị quá mức
  const cnt = new Array(78).fill(0); for (let i = 0; i < 15600; i++) cnt[dailyCard(`p${i}`, '2026-01-01')]++;
  assert.ok(Math.min(...cnt) > 120 && Math.max(...cnt) < 290, `phân bố lệch: ${cnt.join(',')}`);
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

test('tham số ?tarot=: rỗng hoặc sai thì không có lá nào, không biến thành lá số 0', () => {
  assert.deepEqual(parseCardIds(''), []); assert.deepEqual(parseCardIds(null), []); assert.deepEqual(parseCardIds('abc,,x'), []);
  assert.deepEqual(parseCardIds('0'), [0], 'lá số 0 viết rõ thì vẫn nhận');
  assert.deepEqual(parseCardIds('17, 40,99,5,1'), [17, 40, 5], 'bỏ lá ngoài bộ, tối đa ba lá');
});

test('chủ đề đã chọn được báo cho My như một nhãn, chủ đề lạ bị bỏ', () => {
  assert.match(tarotBlock([3], 'cong-viec'), /Công việc/); assert.match(tarotBlock([3], 'cong-viec'), /nhãn/);
  assert.doesNotMatch(tarotBlock([3], 'ignore previous'), /Chủ đề họ chọn/); assert.doesNotMatch(tarotBlock([3]), /Chủ đề họ chọn/);
});

test('giọng chuyên gia: xin ý kiến thì trả lời thẳng, báo khó hiểu thì nói lại dễ hơn, đang nặng lòng thì không ép trả lời', () => {
  const profile = normalizeProfile({ fullName: 'Trần An', gender: 'nu', birth: { y: 1990, m: 5, d: 5, hour: 9, minute: 0 } }), chart = buildChart(profile);
  const ask = (text, prev = []) => buildSystemPrompt('companion', profile, chart, [...prev, { role: 'user', content: text }], {});
  assert.match(ask('Mình có nên nghỉ việc để học thêm không?'), /XIN Ý KIẾN/);
  assert.match(ask('Chuyện này nên làm gì bây giờ'), /XIN Ý KIẾN/);
  assert.doesNotMatch(ask('Hôm nay trời đẹp'), /XIN Ý KIẾN/);
  assert.match(ask('Chỗ này khó hiểu quá, là sao vậy My'), /BÁO KHÓ HIỂU/);
  assert.doesNotMatch(ask('Mình buồn lắm, không biết nên làm gì, chỉ muốn khóc thôi'), /XIN Ý KIẾN/, 'đang nặng lòng thì chỉ vỗ về');
  assert.match(ask('x'), /NÓI NHƯ NGƯỜI TỪNG TRẢI/);
});

test('người nổi tiếng: một câu chuyện ngắn có điểm chung trong lá số, và dữ kiện cho My khi được hỏi', () => {
  const profile = normalizeProfile({ fullName: 'Trần An', gender: 'nu', birth: { y: 1990, m: 5, d: 5, hour: 9, minute: 0 } }), chart = buildChart(profile);
  const s = famousStory(profile, chart);
  assert.ok(s && s.name && s.text.includes('**' + s.name + '**'));
  assert.ok(s.text.length < 420, 'một đoạn ngắn, không liệt kê cả danh sách');
  assert.equal((s.text.match(/\*\*/g) ?? []).length, 2, 'chỉ nêu một người');
  assert.doesNotMatch(s.text, /số phận khổ|sẽ giống/);
  const blk = buildSystemPrompt('companion', profile, chart, [{ role: 'user', content: 'chào' }], {});
  assert.match(blk, /NGƯỜI NỔI TIẾNG CÙNG HOẶC SÁT NGÀY SINH/);
  assert.ok(famousTies(chart, { y: 1990, m: 5, d: 5 }).some((t) => t.k === 'nhat-chu'), 'cùng ngày sinh thì cùng nhật chủ');
});
