import test from 'node:test';
import assert from 'node:assert/strict';
import { findPlaces, norm } from '../src/engine/places.js';
import { PLACES } from '../src/engine/astro.js';

test('chuẩn hóa bỏ dấu và tiền tố hành chính', () => {
  assert.equal(norm('Thành phố Đà Nẵng'), 'da nang');
  assert.equal(norm('TP. Hồ Chí Minh'), 'ho chi minh');
  assert.equal(norm('Tỉnh Bình Định'), 'binh dinh');
});
test('khớp chính xác, không dấu, tên khác', () => {
  assert.deepEqual(findPlaces('Cần Thơ'), ['can-tho']);
  assert.deepEqual(findPlaces('can tho'), ['can-tho']);
  assert.deepEqual(findPlaces('Sài Gòn'), ['tp-hcm']);
  assert.deepEqual(findPlaces('Nghệ An'), ['vinh']);
  assert.deepEqual(findPlaces('Bình Định'), ['quy-nhon']);
});
test('chữ dài chứa tên tỉnh trả về nơi đó', () => {
  assert.deepEqual(findPlaces('xã Tân Thông Hội, huyện Củ Chi, TP.HCM'), ['tp-hcm']);
  assert.deepEqual(findPlaces('huyện Tam Bình, Vĩnh Long'), ['vinh-long']);
});
test('gõ dở thì trả về nhiều gợi ý để hỏi lại', () => {
  const r = findPlaces('bình');
  assert.ok(r.length > 1 && r.includes('quy-nhon') && r.includes('phan-thiet'));
});
test('không có trong dữ liệu thì rỗng', () => {
  assert.deepEqual(findPlaces('Paris'), []);
  assert.deepEqual(findPlaces('x'), []);
});
test('mọi nơi đều có tọa độ hợp lệ trong lãnh thổ Việt Nam', () => {
  for (const [k, p] of Object.entries(PLACES)) {
    assert.ok(p.lat > 8 && p.lat < 24 && p.lon > 102 && p.lon < 110, k);
  }
});
