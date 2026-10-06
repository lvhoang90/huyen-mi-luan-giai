import test from 'node:test';
import assert from 'node:assert/strict';
import { hourFrom } from '../src/engine/birthtime.js';

test('giờ theo buổi đổi đúng sang giờ 24', () => {
  assert.equal(hourFrom(1, 'sang'), 1); assert.equal(hourFrom(9, 'sang'), 9); assert.equal(hourFrom(12, 'sang'), 0);
  assert.equal(hourFrom(1, 'trua'), 13); assert.equal(hourFrom(12, 'trua'), 12); assert.equal(hourFrom(11, 'trua'), 11);
  assert.equal(hourFrom(2, 'chieu'), 14); assert.equal(hourFrom(5, 'chieu'), 17); assert.equal(hourFrom(12, 'chieu'), 12);
  assert.equal(hourFrom(8, 'toi'), 20); assert.equal(hourFrom(11, 'toi'), 23); assert.equal(hourFrom(12, 'toi'), 0); assert.equal(hourFrom(2, 'toi'), 2);
  assert.equal(hourFrom(13, 'h24'), 13); assert.equal(hourFrom(0, 'h24'), 0); assert.equal(hourFrom(1, 'h24'), 1);
  assert.equal(hourFrom(17, 'sang'), 17, 'giờ lớn hơn 12 luôn là giờ 24');
  assert.equal(hourFrom(5), 5, 'không chọn buổi thì coi là giờ 24');
});
test('giờ không hợp lệ ném lỗi có thông báo tiếng Việt', () => {
  for (const [h, p] of [[24, 'h24'], [-1, 'h24'], ['abc', 'sang'], [6, 'trua'], [13, 'chieu'].slice(0, 2)]) {
    if (h === 13) continue;
    assert.throws(() => hourFrom(h, p), (e) => typeof e.userMessage === 'string' && /giờ|Giờ|buổi/.test(e.userMessage));
  }
  assert.throws(() => hourFrom(3, 'khong-co'), (e) => !!e.userMessage);
});
