import test from 'node:test';
import assert from 'node:assert/strict';
import { circadian, biorhythm, parseSleepTimes, describeNhipExtra, fmtHour } from '../src/engine/nhip.js';
import { normalizeProfile, buildChart, describeDayExtra } from '../src/engine/index.js';

const profile = normalizeProfile({ fullName: 'Lương Việt Hoàng', nickname: 'Hoàng', gender: 'nam', birth: { y: 1990, m: 5, d: 5, hour: 9, minute: 0 } });
const chart = buildChart(profile);
const NOW = new Date('2026-10-07T03:00:00Z');

test('Nhịp thức-ngủ: CBTmin cách giờ dậy khoảng 2-3 giờ khi ngủ đủ 8 giờ, và dịch theo giờ dậy', () => {
  const a = circadian(7, 23), b = circadian(8, 0);
  assert.ok(a.wakeAfterCbt > 1.5 && a.wakeAfterCbt < 3.5, `CBTmin cách giờ dậy ${a.wakeAfterCbt}`);
  assert.ok(Math.abs(b.cbt - a.cbt - 1) < 0.1, 'dậy muộn 1 giờ thì CBTmin muộn 1 giờ');
  assert.ok(Math.abs(((a.cbt - a.dlmo + 24) % 24) - 7) < 1e-9, 'DLMO = CBTmin - 7 giờ');
  assert.equal(circadian(7, 7), null, 'dậy và ngủ cùng giờ là vô lý');
  assert.equal(circadian(30, 2), null);
  assert.equal(fmtHour(5.55), '05:33'); assert.equal(fmtHour(23.999), '00:00');
});

test('Nhịp thức-ngủ khớp bản tham chiếu độc lập (cùng phương trình đã công bố)', () => {
  // Số lấy từ bản tính viết riêng bằng ngôn ngữ khác, bước 0.05 giờ, 30 ngày.
  const c = circadian(7, 23); assert.ok(Math.abs(c.cbt - 4.55) < 0.06, String(c.cbt));
  const d = circadian(6, 22); assert.ok(Math.abs(d.cbt - 3.55) < 0.06, String(d.cbt));
});

test('Đọc giờ dậy và giờ ngủ từ lời người dùng', () => {
  assert.deepEqual(parseSleepTimes(['mình thường thức dậy lúc 6h30 và đi ngủ lúc 23h']), { wake: 6.5, bed: 23, bedAssumed: false });
  assert.equal(parseSleepTimes(['hôm nay trời đẹp']), null);
  const only = parseSleepTimes(['mình hay dậy lúc 7 giờ']); assert.equal(only.wake, 7); assert.equal(only.bed, 23); assert.equal(only.bedAssumed, true);
  const late = parseSleepTimes(['dậy 8h', 'ngủ lúc 1h sáng']); assert.equal(late.bed, 1);
  assert.equal(parseSleepTimes(['dậy lúc 6h', 'thật ra dậy lúc 7h30'])?.wake, 7.5, 'tin mới nhất thắng');
});

test('Biorhythm: đường sin theo ngày sinh, ngày sinh là 0', () => {
  const b0 = biorhythm({ y: 1990, m: 5, d: 5 }, { y: 1990, m: 5, d: 5 });
  assert.deepEqual(b0.map((c) => c.value), [0, 0, 0]);
  const b7 = biorhythm({ y: 1990, m: 5, d: 5 }, { y: 1990, m: 5, d: 12 }); // 7 ngày: 1/4 chu kỳ cảm xúc 28 ngày
  assert.equal(b7.find((c) => c.period === 28).value, 100);
  assert.equal(biorhythm({ y: 1990, m: 5, d: 5 }, { y: 1990, m: 5, d: 13 }).find((c) => c.period === 28).trend, 'nửa xuống'); // vừa qua đỉnh
  assert.equal(biorhythm({ y: 1990, m: 5, d: 5 }, { y: 1990, m: 5, d: 11 }).find((c) => c.period === 28).trend, 'nửa lên');
  const full = biorhythm({ y: 1990, m: 5, d: 5 }, { y: 1990, m: 5, d: 5 + 23 * 28 }); // bội chung của chu kỳ thể chất
  assert.equal(full.find((c) => c.period === 23).value, 0);
});

test('Khối nhịp sinh học chỉ có khi nhắc giấc ngủ/năng lượng, luôn kèm nhãn chưa được xác nhận', () => {
  assert.equal(describeNhipExtra(profile, ['hôm nay trời đẹp'], NOW), '');
  const t = describeNhipExtra(profile, ['dạo này mất ngủ, mình thường dậy lúc 6h30 và ngủ lúc 0h30'], NOW);
  assert.match(t, /NHỊP SINH HỌC/); assert.match(t, /CBTmin\) khoảng \d\d:\d\d/); assert.match(t, /chưa được nghiên cứu xác nhận/);
  assert.match(t, /nên gặp nhân viên y tế/);
  const ask = describeNhipExtra(profile, ['mình mệt quá'], NOW);
  assert.match(ask, /Chưa biết giờ thức dậy/); assert.doesNotMatch(ask, /CBTmin\) khoảng/);
  assert.doesNotMatch(t, /dự đoán chắc|chắc chắn sẽ|hạn nặng|bệnh/i);
});

test('Khối ngày kèm một dòng biorhythm có nhãn chưa được xác nhận', () => {
  assert.match(describeDayExtra(profile, chart, 'hôm nay thế nào', NOW), /biorhythm \(chưa được nghiên cứu xác nhận\): thể chất [+-]?\d+%/);
});
