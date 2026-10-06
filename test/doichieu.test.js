import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProfile, buildChart } from '../src/engine/index.js';
import { solarToLunar } from '../src/engine/lunar.js';
import { computeTuViLunar } from '../src/engine/tuvi.js';
import { conventionsFor, compareTuVi } from '../src/engine/doichieu.js';

const mk = (b, gender = 'nam') => { const { leapRule, ...birth } = b; const profile = normalizeProfile({ fullName: 'Thử Nghiệm', gender, birth, leapRule }); return { profile, chart: buildChart(profile, new Date('2026-10-06')) }; };
const truth = (c) => ({ cucSo: c.tuvi.cuc.so, menhPos: c.tuvi.menh });

test('Lịch âm: ép múi giờ UTC+8 ra lịch Trung Quốc, mặc định giữ lịch Việt Nam', () => {
  const vn = solarToLunar(1985, 1, 21), cn = solarToLunar(1985, 1, 21, { tz: 8 });
  assert.deepEqual([vn.day, vn.month], [1, 1]); assert.deepEqual([cn.day, cn.month, cn.year], [1, 12, 1984]);
  assert.deepEqual(solarToLunar(2024, 2, 10), solarToLunar(2024, 2, 10, { tz: 7 }));
});

test('Quy ước đang dùng: luôn có ba điều, và chỉ đánh dấu điều chạm vào ngày sinh', () => {
  const key = (b) => conventionsFor(...(([x]) => [x.profile, x.chart])([mk(b)])).filter((x) => x.affects).map((x) => x.key);
  assert.deepEqual(conventionsFor(...(([x]) => [x.profile, x.chart])([mk({ y: 1992, m: 7, d: 22, hour: 6, minute: 0 })])).map((x) => x.key), ['cn', 'leap', 'ty']);
  assert.deepEqual(key({ y: 1992, m: 7, d: 22, hour: 6, minute: 0 }), []);
  assert.deepEqual(key({ y: 1984, m: 12, d: 27, hour: 10, minute: 0 }), ['cn']);          // lịch Việt và Trung Quốc lệch tháng
  assert.deepEqual(key({ y: 1960, m: 8, d: 8, hour: 5, minute: 0 }), ['leap']);           // sinh trong tháng 6 nhuận
  const leapItem = (b) => { const x = mk(b); return conventionsFor(x.profile, x.chart).find((c) => c.key === 'leap'); };
  assert.match(leapItem({ y: 1960, m: 8, d: 8, hour: 5, minute: 0 }).you, /nửa sau tháng.*lập như tháng 7/);
  assert.match(leapItem({ y: 1960, m: 7, d: 25, hour: 5, minute: 0 }).you, /nửa đầu tháng.*cùng một lá số/); // 25/7/1960 = ngày 3 tháng 6 nhuận
  assert.deepEqual(key({ y: 1992, m: 7, d: 22, hour: 23, minute: 30 }), ['ty']);          // giờ Tý muộn
});

test('Đối chiếu: khớp, và lệch không giải thích được khi nhập sai', () => {
  const { profile, chart } = mk({ y: 1992, m: 7, d: 22, hour: 6, minute: 0 });
  assert.equal(compareTuVi(profile, chart, truth(chart)).verdict, 'khop');
  assert.equal(compareTuVi(profile, chart, { ...truth(chart), stars: chart.tuvi.palaces[chart.tuvi.menh].chinh }).verdict, 'khop');
  const wrong = compareTuVi(profile, chart, { cucSo: 2, menhPos: (chart.tuvi.menh + 5) % 12 });
  assert.equal(wrong.verdict, 'lech_khong_ro'); assert.ok(wrong.diffs.length >= 1 && wrong.tips.length >= 1);
  const stars = compareTuVi(profile, chart, { ...truth(chart), stars: ['Tử Vi', 'Phá Quân', 'Thất Sát'] });
  assert.ok(stars.diffs.some((d) => d.field === 'Chính tinh ở Mệnh'));
});

test('Đối chiếu: giải thích bằng quy ước đúng (giá trị lấy từ một thư viện độc lập khác, lịch Trung Quốc)', () => {
  // 27/12/1984 10h nam: thư viện khác ra Thổ ngũ cục, Mệnh ở Mùi (nhánh 7); lá số Việt Nam ra Kim tứ cục, Mệnh ở Thân (nhánh 8).
  let { profile, chart } = mk({ y: 1984, m: 12, d: 27, hour: 10, minute: 0 });
  let r = compareTuVi(profile, chart, { cucSo: 5, menhPos: 7 });
  assert.equal(r.verdict, 'lech_giai_thich_duoc'); assert.deepEqual(r.explain.map((e) => e.key), ['cn']);
  // 8/8/1960 5h nam, sinh ngày 16 tháng 6 nhuận (nửa sau tháng). Thư viện khác chia đôi tháng nhuận: Kim tứ cục, Mệnh ở Tỵ (nhánh 5); số tháng gốc ra Mệnh ở Thìn (nhánh 4).
  ({ profile, chart } = mk({ y: 1960, m: 8, d: 8, hour: 5, minute: 0 }));
  assert.equal(profile.leapRule, 'chia-doi', 'mặc định là chia đôi');
  assert.equal(compareTuVi(profile, chart, { cucSo: 4, menhPos: 5 }).verdict, 'khop');
  r = compareTuVi(profile, chart, { cucSo: 4, menhPos: 4 });
  assert.equal(r.verdict, 'lech_giai_thich_duoc'); assert.deepEqual(r.explain.map((e) => e.key), ['leap']);
  assert.match(r.explain[0].text, /số tháng gốc/);
  // người dùng đổi sang số tháng gốc: chiều giải thích đảo lại
  ({ profile, chart } = mk({ y: 1960, m: 8, d: 8, hour: 5, minute: 0, leapRule: 'goc' }));
  r = compareTuVi(profile, chart, { cucSo: 4, menhPos: 5 });
  assert.deepEqual(r.explain.map((e) => e.key), ['leap']); assert.match(r.explain[0].text, /chia đôi/);
});

test('Đối chiếu: giờ Tý muộn tính sang ngày kế được nhận ra', () => {
  const { profile, chart } = mk({ y: 1990, m: 5, d: 5, hour: 23, minute: 30 });
  const next = computeTuViLunar(solarToLunar(1990, 5, 6), 23, 'nam'); // Mệnh có chính tinh khác nhau giữa hai quy ước
  const input = { cucSo: next.cuc.so, menhPos: next.menh, stars: next.palaces[next.menh].chinh };
  assert.notEqual(chart.tuvi.palaces[chart.tuvi.menh].chinh.join(), next.palaces[next.menh].chinh.join(), 'ca thử phải khác nhau');
  const r = compareTuVi(profile, chart, input);
  assert.equal(r.verdict, 'lech_giai_thich_duoc'); assert.deepEqual(r.explain.map((e) => e.key), ['ty']);
});

test('Đối chiếu: thiếu giờ sinh thì báo thiếu dữ liệu, không ném lỗi', () => {
  const { profile, chart } = mk({ y: 1992, m: 7, d: 22, hour: null });
  const r = compareTuVi(profile, chart, { cucSo: 4, menhPos: 3 });
  assert.equal(r.verdict, 'thieu_du_lieu');
});

test('Tháng nhuận: hai quy ước chỉ khác nhau ở nửa sau tháng nhuận, và tháng sinh dùng cho Đẩu Quân là tháng đã dùng để lập Mệnh', async () => {
  const { computeTuViLunar } = await import('../src/engine/tuvi.js');
  const { timeCycle } = await import('../src/engine/thoivan.js');
  const half = (day, rule) => computeTuViLunar({ day, month: 6, year: 1960, leap: true }, 5, 'nam', { leapRule: rule });
  assert.equal(half(10, 'chia-doi').monthUsed, 6); assert.equal(half(10, 'goc').monthUsed, 6);
  assert.equal(half(16, 'chia-doi').monthUsed, 7); assert.equal(half(16, 'goc').monthUsed, 6);
  assert.notEqual(half(16, 'chia-doi').menh, half(16, 'goc').menh);
  assert.equal(computeTuViLunar({ day: 16, month: 6, year: 1960, leap: false }, 5, 'nam').monthUsed, 6, 'tháng thường không bị đổi');
  for (const rule of ['chia-doi', 'goc']) {
    const { profile, chart } = mk({ y: 1960, m: 8, d: 8, hour: 5, minute: 0, leapRule: rule });
    const t = timeCycle(profile, chart, 2027), hb = Math.floor((5 + 1) / 2) % 12;
    assert.equal(t.months[chart.tuvi.monthUsed - 1].cung.pos, (t.tuvi.tt + hb) % 12, rule);
  }
  assert.equal(normalizeProfile({ fullName: 'A', birth: { y: 1990, m: 1, d: 1 }, leapRule: 'khác' }).leapRule, 'chia-doi');
  assert.equal(normalizeProfile({ fullName: 'A', birth: { y: 1990, m: 1, d: 1 }, leapRule: 'goc' }).leapRule, 'goc');
});
