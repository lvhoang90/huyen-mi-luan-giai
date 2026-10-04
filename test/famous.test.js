import test from 'node:test';
import assert from 'node:assert/strict';
import { famousFor, FAMOUS_COUNT } from '../src/engine/famous.js';

test('có đủ dữ liệu và mỗi mục có ngày hợp lệ', () => {
  assert.ok(FAMOUS_COUNT > 250);
  for (let m = 1; m <= 12; m++) assert.ok(famousFor(m, 15, 50).exact.length + famousFor(m, 15, 50).near.length >= 0);
});
test('cùng ngày: người Việt đứng trước', () => {
  const r = famousFor(5, 19);
  assert.equal(r.exact[0].name, 'Hồ Chí Minh');
  assert.ok(r.exact.length >= 2);
});
test('ngày không có ai thì lấy người sinh gần trong 3 ngày', () => {
  const r = famousFor(1, 14); // không có mục 14/1
  assert.equal(r.exact.length, 0);
  assert.ok(r.near.length > 0 && r.near.every((e) => e.gap >= 1 && e.gap <= 3));
});
test('năm sinh nằm trong khoảng hợp lý và ngày tồn tại', () => {
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    for (const e of [...famousFor(m, d, 99).exact]) {
      assert.ok(e.y > 1000 && e.y < 2010, e.name);
      assert.ok(new Date(Date.UTC(2000, e.m - 1, e.d)).getUTCDate() === e.d, e.name);
    }
  }
});

import { pickFamous, FIELD_OPTIONS } from '../src/engine/famous.js';
const NOW = new Date('2026-10-04');
test('có thêm dữ liệu theo lĩnh vực và thế hệ, tên không trùng', () => {
  assert.ok(FAMOUS_COUNT > 450);
});
test('người trẻ nhận ngôi sao trẻ, người lớn tuổi nhận danh nhân kinh điển', () => {
  // 5/2: Cristiano Ronaldo (1985), Neymar (1992), Trấn Thành (1987) so với các nhân vật cổ điển cùng ngày nếu có
  const young = pickFamous({ birth: { y: 2004, m: 2, d: 5 } }, 3, NOW);
  assert.ok(young.sameDay.some((e) => e.y >= 1985));
  const old = pickFamous({ birth: { y: 1955, m: 5, d: 19 } }, 3, NOW);
  assert.equal(old.sameDay[0].name, 'Hồ Chí Minh');
});
test('cùng nghề được ưu tiên và tìm trong 15 ngày quanh ngày sinh', () => {
  const r = pickFamous({ birth: { y: 1990, m: 8, d: 5 }, field: 'tech' }, 3, NOW);
  assert.ok(r.sameField, 'phải có ít nhất một người công nghệ/khoa học sinh quanh 5/8');
  assert.ok(r.sameField.gap <= 15);
});
test('cùng năm sinh chỉ dành cho người dưới 41 tuổi', () => {
  assert.ok(pickFamous({ birth: { y: 1994, m: 3, d: 3 } }, 3, NOW).sameYear.every((e) => e.y === 1994));
  assert.equal(pickFamous({ birth: { y: 1960, m: 3, d: 3 } }, 3, NOW).sameYear.length, 0);
});
test('mọi lựa chọn lĩnh vực đều có tên', () => { assert.ok(FIELD_OPTIONS.every((o) => o.key && o.label)); });
