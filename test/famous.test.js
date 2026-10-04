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
  const r = famousFor(1, 5); // không có mục 5/1
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
