import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, normalizeRow, selectPerDay, dedupe, audit, normName } from '../tools/famous-lib.mjs';

test('gán lĩnh vực từ nhãn nghề Wikidata', () => {
  assert.equal(classify(['singer', 'actor']).f, 'm');
  assert.equal(classify(['physicist']).f, 's');
  assert.equal(classify(['association football player']).f, 'p');
  assert.equal(classify(['businessperson', 'investor']).f, 'b');
  assert.equal(classify(['unknown thing']), null);
});
test('chuẩn hoá hàng thô, loại dữ liệu xấu', () => {
  const ok = normalizeRow({ qid: 'Q1', name: 'Jane Doe', born: '1990-05-17T00:00:00Z', links: 80, occ: 'singer', country: 'United States' });
  assert.deepEqual(ok.slice(0, 7), [5, 17, 1990, 'Jane Doe', 'nghệ sĩ âm nhạc', 'm', 0]);
  assert.equal(normalizeRow({ name: 'X', born: '1990-02-31T00:00:00Z', occ: 'singer' }), null); // ngày không tồn tại
  assert.equal(normalizeRow({ name: 'Q123', born: '1990-05-17T00:00:00Z', occ: 'singer' }), null); // chưa có nhãn
  assert.equal(normalizeRow({ name: 'Old', born: '1100-05-17T00:00:00Z', occ: 'singer' }), null);
  assert.equal(normalizeRow({ name: 'Nobody', born: '1990-05-17T00:00:00Z', occ: '' }), null);
  assert.equal(normalizeRow({ name: 'Bạn', born: '1990-05-17T00:00:00Z', occ: 'singer', country: 'Vietnam' })[6], 1);
});
test('chọn mỗi ngày: giới hạn số người và số người một lĩnh vực, người Việt trước', () => {
  const rows = [];
  for (let i = 0; i < 6; i++) rows.push([5, 17, 1980 + i, 'S' + i, 'ca sĩ', 'm', 0, 100 - i]);
  rows.push([5, 17, 1950, 'Viet', 'nhà văn', 'a', 1, 30], [5, 17, 1940, 'Sci', 'nhà khoa học', 's', 0, 60]);
  const r = selectPerDay(rows, 5, 2);
  assert.equal(r.length, 4); // Viet, S0, S1 (đủ 2 ca sĩ), Sci; các ca sĩ còn lại bị bỏ vì quá số người một lĩnh vực
  assert.ok(r.some((x) => x[3] === 'Viet'));
  assert.ok(r.filter((x) => x[5] === 'm').length <= 2);
});
test('bỏ trùng tên không dấu với bộ tự soạn', () => {
  const out = dedupe([[1, 1, 1900, 'Nguyễn Du', 'x', 'a', 1, 1], [1, 2, 1900, 'New Person', 'x', 'a', 0, 1]], ['Nguyen Du']);
  assert.deepEqual(out.map((r) => r[3]), ['New Person']);
  assert.equal(normName('Đặng Thái Sơn'), 'dang thai son');
});
test('đối chiếu bộ tự soạn: phát hiện ngày sinh lệch', () => {
  const r = audit([{ name: 'A B', m: 5, d: 1, y: 1900 }, { name: 'C D', m: 6, d: 2, y: 1950 }, { name: 'E F', m: 1, d: 1, y: 1800 }],
    [{ qid: 'Q1', name: 'A B', born: '1900-05-01T00:00:00Z' }, { qid: 'Q2', name: 'C D', born: '1950-06-03T00:00:00Z' }]);
  assert.equal(r.confirmed, 1); assert.equal(r.mismatches.length, 1); assert.equal(r.mismatches[0].wikidata, '3/6/1950'); assert.deepEqual(r.missing, ['E F']);
});
