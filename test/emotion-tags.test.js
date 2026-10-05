import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTagged, normalizeDashes, extractSuggestions } from '../src/emotion-tags.js';

test('Tách thẻ cảm xúc và ghi vị trí', () => {
  const r = parseTagged('[[dong_cam]]Mình hiểu.\n\n[[chiem_nghiem]]Thử nghĩ xem.');
  assert.equal(r.text, 'Mình hiểu.\n\nThử nghĩ xem.');
  assert.deepEqual(r.events, [{ pos: 0, emo: 'dong_cam' }, { pos: 'Mình hiểu.\n\n'.length, emo: 'chiem_nghiem' }]);
});
test('Thẻ gõ dở ở cuối luồng không lộ ra', () => {
  assert.equal(parseTagged('Xin chào [[dong_c').text, 'Xin chào ');
  assert.equal(parseTagged('Xin chào [').text, 'Xin chào [');
});
test('Gạch dài thành dấu gạch nối', () => {
  assert.equal(normalizeDashes('Bạn à — nghe My nói'), 'Bạn à - nghe My nói');
  assert.equal(normalizeDashes('tuổi 6–15'), 'tuổi 6-15');
  assert.equal(normalizeDashes('a—b'), 'a - b');
});
test('Vị trí thẻ tính trên văn bản đã chuẩn hóa gạch', () => {
  const r = parseTagged('Một — hai [[vui]]ba');
  assert.equal(r.text, 'Một - hai ba'); assert.equal(r.events[0].pos, 'Một - hai '.length);
});

test('Gợi ý trả lời được tách khỏi lời My và thành danh sách', () => {
  const raw = '[[dong_cam]]Nghe bạn kể My thấy xót.\n\n[[goi_y: Kể thêm về chuyện này | Mình muốn hiểu vì sao | Kể thêm về chuyện này | x]]';
  assert.equal(parseTagged(raw).text, 'Nghe bạn kể My thấy xót.');
  assert.deepEqual(extractSuggestions(raw), ['Kể thêm về chuyện này', 'Mình muốn hiểu vì sao']); // bỏ trùng, bỏ mục quá ngắn
  assert.deepEqual(extractSuggestions('[[vui]]Không có gợi ý.'), []);
});
test('Gợi ý đang gõ dở không lộ ra trong lúc phát chữ', () => {
  assert.equal(parseTagged('Xong rồi.\n\n[[goi_y: Kể thêm về chuyện này | Mình muốn').text, 'Xong rồi.');
  assert.equal(parseTagged('Xong rồi.\n\n[[goi').text, 'Xong rồi.');
});
test('Gợi ý quá dài bị bỏ, tối đa ba', () => {
  assert.equal(extractSuggestions('[[goi_y: ' + 'a'.repeat(60) + ' | Một | Hai ý | Ba ý nữa | Bốn ý nữa]]').length, 3);
});
