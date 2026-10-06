import test from 'node:test';
import assert from 'node:assert/strict';
import { solarToLunar } from '../src/engine/lunar.js';
import { computeTuVi, computeTuViLunar } from '../src/engine/tuvi.js';
import { buildChart, normalizeProfile, describeChart, distinctiveTraits } from '../src/engine/index.js';

test('Âm lịch: mùng 1 Tết các năm', () => {
  for (const [y, m, d] of [[2023, 1, 22], [2024, 2, 10], [2025, 1, 29], [2020, 1, 25], [2000, 2, 5]]) {
    const l = solarToLunar(y, m, d); assert.deepEqual([l.day, l.month, l.year, l.leap], [1, 1, y, false], `${d}/${m}/${y}`);
  }
});

test('Âm lịch: tháng nhuận (đối chiếu lịch thực)', () => {
  assert.deepEqual(pick(solarToLunar(2023, 3, 22)), [1, 2, 2023, true]);
  assert.deepEqual(pick(solarToLunar(2025, 7, 25)), [1, 6, 2025, true]);
  assert.deepEqual(pick(solarToLunar(2020, 5, 23)), [1, 4, 2020, true]);
  assert.deepEqual(pick(solarToLunar(2000, 1, 1)), [25, 11, 1999, false]);
});
const pick = (l) => [l.day, l.month, l.year, l.leap];

test('Tử Vi: lá số 22/7 Nhâm Thân, giờ Mão, nữ (đối chiếu độc lập 4.000 lá số với tuvi-neo)', () => {
  const t = computeTuViLunar({ day: 22, month: 7, year: 1992 }, 6, 'nu');
  assert.equal(t.cuc.ten, 'Hỏa lục cục');
  assert.equal(t.palaces[t.menh].chi, 'Tỵ');
  assert.equal(t.thanCu, 'Thiên Di');
  assert.ok(t.menhVoChinhDieu);
  const at = (chi) => t.palaces.find((p) => p.chi === chi);
  assert.deepEqual(at('Mùi').chinh.sort(), ['Phá Quân', 'Tử Vi']);
  assert.deepEqual(at('Hợi').chinh.sort(), ['Liêm Trinh', 'Tham Lang']);
  assert.equal(at('Dậu').chinh[0], 'Thiên Phủ');
  assert.equal(t.hoaAt['Hóa Kỵ'].star, 'Vũ Khúc');
  assert.equal(at('Tý').phu.concat(at('Tý').sat).includes('Kình Dương'), true);
});

test('Tử Vi: cặp sao cố định luôn đi cùng nhau', () => {
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 29; d += 4) {
    const t = computeTuViLunar({ day: d, month: m, year: 1990 }, 5, 'nam');
    const pos = (n) => t.palaces.findIndex((p) => p.chinh.includes(n));
    assert.equal((pos('Tử Vi') + pos('Thiên Phủ')) % 12, 4); // đối xứng qua trục Dần–Thân
    assert.equal(t.palaces.reduce((a, p) => a + p.chinh.length, 0), 14);
  }
});

test('Thiếu giờ sinh hoặc giới tính → không lập Tử Vi, có cảnh báo', () => {
  assert.equal(computeTuVi({ y: 1990, m: 5, d: 15, hour: null }, 'nam'), null);
  assert.equal(computeTuVi({ y: 1990, m: 5, d: 15, hour: 8 }, 'khac'), null);
  const p = normalizeProfile({ fullName: 'An', gender: 'nam', birth: { y: 1990, m: 5, d: 15 } });
  const c = buildChart(p, new Date('2026-10-03'));
  assert.equal(c.tuvi, null);
  assert.ok(c.caveats.some((x) => /Tử Vi/.test(x)));
});

test('Nét riêng khác nhau giữa hai người', () => {
  const mk = (n, g, b) => { const p = normalizeProfile({ fullName: n, gender: g, birth: b, place: 'ha-noi' }); return distinctiveTraits(p, buildChart(p, new Date('2026-10-03'))).join('|'); };
  const a = mk('Trần Thị Mai', 'nu', { y: 1992, m: 8, d: 20, hour: 6, minute: 30 });
  const b = mk('Lê Văn Hùng', 'nam', { y: 1978, m: 1, d: 3, hour: 22, minute: 10 });
  assert.notEqual(a, b);
  assert.match(describeChart(normalizeProfile({ fullName: 'Lê Văn Hùng', gender: 'nam', birth: { y: 1978, m: 1, d: 3, hour: 22, minute: 10 } }), buildChart(normalizeProfile({ fullName: 'Lê Văn Hùng', gender: 'nam', birth: { y: 1978, m: 1, d: 3, hour: 22, minute: 10 } }), new Date('2026-10-03'))), /TỬ VI ĐẨU SỐ/);
});

test('Lịch âm Việt Nam khác Trung Quốc ở 1984-1985 (UTC+7): không nhuận 10, Tết Ất Sửu là 21/1/1985', () => {
  // Đông chí 1984 rơi 23:23 ngày 21/12 giờ Việt Nam (00:23 ngày 22/12 giờ Trung Quốc) nên hai nước chia tháng khác nhau.
  // Mùng 1 Tết Ất Sửu 1985 ở Việt Nam là 21/1/1985 (xác nhận bởi lịch chính thức); lịch Trung Quốc có nhuận 10 và Tết 20/2. KHÔNG sửa theo lịch Trung Quốc.
  assert.deepEqual(pick(solarToLunar(1985, 1, 21)), [1, 1, 1985, false]);
  assert.deepEqual(pick(solarToLunar(1984, 12, 22)), [1, 12, 1984, false]);
  assert.deepEqual(pick(solarToLunar(1984, 11, 25)), [3, 11, 1984, false]);
  assert.deepEqual(pick(solarToLunar(1985, 2, 20)), [1, 2, 1985, false]);
});
