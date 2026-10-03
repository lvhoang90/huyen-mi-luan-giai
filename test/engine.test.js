import test from 'node:test';
import assert from 'node:assert/strict';
import { julianDay, sunLongitude, moonLongitude, ascendant, signOf } from '../src/engine/astro.js';
import { computeBazi, cungMenh } from '../src/engine/bazi.js';
import { computeNumerology, stripVN } from '../src/engine/numerology.js';
import { buildChart, normalizeProfile, describeChart } from '../src/engine/index.js';

test('Julian day J2000', () => assert.equal(julianDay(2000, 1, 1, 12), 2451545.0));

test('Mặt Trời & Mặt Trăng J2000', () => {
  assert.ok(Math.abs(sunLongitude(2451545.0) - 280.37) < 0.1);
  assert.ok(Math.abs(moonLongitude(2451545.0) - 223.3) < 0.6);
});

test('Cung mọc: mốc hình học', () => {
  // RAMC=270° tại xích đạo → Bạch Dương 0°; RAMC=0° → Cự Giải 0°
  const jd = 2451545.0;
  // chọn kinh độ để RAMC mong muốn: GMST(J2000)=280.46°
  assert.ok(Math.abs(ascendant(jd, 0, 270 - 280.46) - 0) < 0.5 || Math.abs(ascendant(jd, 0, 270 - 280.46) - 360) < 0.5);
  assert.ok(Math.abs(ascendant(jd, 0, 0 - 280.46) - 90) < 0.5);
});

test('Tứ Trụ 2000-01-01 12:00 = Kỷ Mão / Bính Tý / Mậu Ngọ', () => {
  const b = computeBazi({ y: 2000, m: 1, d: 1, hour: 12, minute: 0 });
  assert.equal(b.pillars.year.name, 'Kỷ Mão');
  assert.equal(b.pillars.month.name, 'Bính Tý');
  assert.equal(b.pillars.day.name, 'Mậu Ngọ');
  assert.equal(b.pillars.hour.name, 'Mậu Ngọ');
});

test('Lập Xuân 1984: trước = Quý Hợi, sau = Giáp Tý', () => {
  assert.equal(computeBazi({ y: 1984, m: 2, d: 3, hour: 12 }).pillars.year.name, 'Quý Hợi');
  assert.equal(computeBazi({ y: 1984, m: 2, d: 6, hour: 12 }).pillars.year.name, 'Giáp Tý');
  assert.equal(computeBazi({ y: 1984, m: 2, d: 6, hour: 12 }).napAmYear.name, 'Hải Trung Kim');
});

test('Cung mệnh', () => {
  assert.equal(cungMenh(1984, 'nam').name, 'Đoài'); // 1+9+8+4=22→4; 11-4=7 Đoài
  assert.equal(cungMenh(1984, 'nu').name, 'Cấn'); // 4+4=8 Cấn
  assert.equal(cungMenh(1990, 'nam').name, 'Khảm'); // 1990→1; 11-1=10→1 Khảm
  assert.equal(cungMenh(1990, 'khac'), null);
});

test('Thần số học', () => {
  const n = computeNumerology({ fullName: 'Nguyễn Văn An', y: 1990, m: 5, d: 15 }, new Date('2026-10-03'));
  assert.equal(n.lifePath, 3); // 15→6, 5, 1990→1 → 12 → 3
  assert.equal(stripVN('Đặng Thùy'), 'DANG THUY');
  assert.ok(n.expression >= 1 && n.expression <= 33);
});

test('Chuẩn hóa hồ sơ & mô tả lá số', () => {
  const p = normalizeProfile({ fullName: ' Trần  Thị <b>Mai ', gender: 'nu', birth: { y: 1992, m: 8, d: 20, hour: 6, minute: 30 }, place: 'ha-noi' });
  assert.ok(!p.fullName.includes('<'));
  const chart = buildChart(p, new Date('2026-10-03'));
  const text = describeChart(p, chart);
  assert.match(text, /Trụ Năm/);
  assert.ok(chart.astro.asc);
  assert.throws(() => normalizeProfile({ fullName: 'A', birth: { y: 2001, m: 2, d: 30 } }));
});
