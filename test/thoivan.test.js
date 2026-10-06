import test from 'node:test';
import assert from 'node:assert/strict';
import { lunarMonthsOfYear } from '../src/engine/lunar.js';
import { normalizeProfile, buildChart, describeChart } from '../src/engine/index.js';
import { timeCycle, timeline, natalAttention, lifeStages, describeTimeCycle, relation, chiRelation, LEVELS } from '../src/engine/thoivan.js';
import { TU_HOA } from '../src/engine/tuvi.js';
import { demoReply } from '../server/demo.js';
import { EVENTS } from '../server/events.js';
import { safeZaloUrl } from '../server/zalo.js';
import { upgradePrices } from '../server/upgrade.js';
import { computeMetrics } from '../server/admin.js';
import { ingest } from '../server/events.js';
import { openDb } from '../server/db.js';
import { buildReminder } from '../server/reminders.js';

const NOW = new Date('2026-10-05');
const mk = (extra = {}) => {
  const profile = normalizeProfile({ fullName: 'Nguyễn Văn An', gender: 'nam', birth: { y: 1992, m: 7, d: 22, hour: 6, minute: 0 }, ...extra });
  return { profile, chart: buildChart(profile, NOW) };
};

test('Lịch tháng âm: mùng 1 Giêng và tháng nhuận khớp lịch thực', () => {
  const first = (y) => { const m = lunarMonthsOfYear(y)[0]; return [m.start.d, m.start.m]; };
  assert.deepEqual(first(2024), [10, 2]); assert.deepEqual(first(2025), [29, 1]); assert.deepEqual(first(2026), [17, 2]);
  assert.deepEqual(first(2000), [5, 2]); assert.deepEqual(first(1999), [16, 2]);
  const leap = (y) => lunarMonthsOfYear(y).find((m) => m.leap);
  assert.equal(lunarMonthsOfYear(2023).length, 13); assert.equal(leap(2023).month, 2);
  assert.equal(lunarMonthsOfYear(2025).length, 13); assert.equal(leap(2025).month, 6);
  assert.equal(lunarMonthsOfYear(2033).length, 13); assert.equal(leap(2033).month, 11);
  assert.equal(lunarMonthsOfYear(2026).length, 12);
});

test('Lịch tháng âm: các tháng nối liền nhau, mỗi tháng 29 hoặc 30 ngày', () => {
  for (const y of [1990, 2012, 2024, 2026, 2031]) {
    const L = lunarMonthsOfYear(y);
    for (let i = 0; i < L.length; i++) {
      const len = (i + 1 < L.length ? L[i + 1].startJdn : L[i].startJdn + 29.5) - L[i].startJdn;
      if (i + 1 < L.length) assert.ok(len === 29 || len === 30, `${y} tháng ${L[i].month}: ${len}`);
    }
  }
});

test('Quan hệ hành và địa chi', () => {
  assert.equal(relation('Mộc', 'Thủy'), 'sinh_ta'); assert.equal(relation('Mộc', 'Hỏa'), 'ta_sinh');
  assert.equal(relation('Mộc', 'Thổ'), 'ta_khac'); assert.equal(relation('Mộc', 'Kim'), 'khac_ta'); assert.equal(relation('Mộc', 'Mộc'), 'dong');
  assert.equal(chiRelation(0, 6), 'xung'); assert.equal(chiRelation(0, 1), 'hop'); assert.equal(chiRelation(2, 11), 'hop');
  assert.equal(chiRelation(8, 0), 'tamhop'); assert.equal(chiRelation(0, 0), null); assert.equal(chiRelation(0, 3), null);
});

test('Lưu niên: Thái Tuế đóng đúng chi của năm; Lưu Tứ Hóa theo can năm rơi đúng cung chứa sao', () => {
  const { profile, chart } = mk();
  const t = timeCycle(profile, chart, 2026); // Bính Ngọ
  assert.equal(t.yearPillar, 'Bính Ngọ');
  assert.equal(t.tuvi.ttChi, 'Ngọ'); assert.equal(chart.tuvi.palaces[t.tuvi.tt].chi, 'Ngọ');
  assert.equal(t.tuvi.cungs.find((c) => c.luuName === 'Mệnh').pos, t.tuvi.tt);
  assert.equal(t.tuvi.can, 'Bính');
  assert.deepEqual(t.tuvi.luuHoa.map((h) => h.star), TU_HOA.Bính);
  for (const h of t.tuvi.luuHoa) { const p = chart.tuvi.palaces[h.pos]; assert.ok([...p.chinh, ...p.phu].includes(h.star)); assert.equal(h.cung, p.name); }
  // tuổi âm và đại hạn: sinh âm lịch 1992 → 2026 là 35 tuổi, đại hạn chứa tuổi đó
  assert.equal(t.tuvi.age, 35); assert.ok(t.tuvi.dai.daiHan[0] <= 35 && 35 <= t.tuvi.dai.daiHan[1]);
});

test('Lưu nguyệt (Đẩu Quân): tháng sinh trong năm xem cách cung Thái Tuế đúng một khoảng bằng giờ sinh', () => {
  const { profile, chart } = mk();
  const t = timeCycle(profile, chart, 2027);
  assert.equal(t.months.length, 12);
  for (let i = 1; i < 12; i++) assert.equal(t.months[i].cung.pos, (t.months[i - 1].cung.pos + 1) % 12);
  const hourBranch = Math.floor((profile.birth.hour + 1) / 2) % 12;
  const sinh = t.months[chart.tuvi.lunar.month - 1].cung.pos;
  assert.equal(sinh, (t.tuvi.tt + hourBranch) % 12);
});

test('Mức chú ý: chỉ có ba mức, cấu trúc đầy đủ, và radar 12 cung', () => {
  const { profile, chart } = mk();
  const nat = natalAttention(chart.tuvi);
  assert.equal(nat.length, 12);
  for (const c of nat) { assert.ok(c.level >= 0 && c.level <= 2); assert.ok(c.score >= 0); }
  const t = timeCycle(profile, chart, 2026);
  assert.equal(t.tuvi.cungs.length, 12); assert.ok(t.level >= 0 && t.level <= 2);
  for (const m of t.months) { assert.ok(m.level >= 0 && m.level <= 2); assert.ok(m.pillar); assert.ok(m.notes.length >= 2); }
  assert.deepEqual(LEVELS, ['nhẹ', 'vừa', 'nhiều']);
  const st = lifeStages(chart.tuvi, NOW); assert.equal(st.filter((s) => s.current).length, 1);
  const tl = timeline(profile, chart, 2025, 5); assert.equal(tl.length, 5); assert.equal(tl[1].year, 2026);
});

test('Thiếu giờ sinh hoặc giới tính: vẫn có thời vận theo Tứ Trụ và thần số, không có Tử Vi', () => {
  const { profile, chart } = mk({ birth: { y: 1992, m: 7, d: 22, hour: null } });
  assert.equal(chart.tuvi, null);
  const t = timeCycle(profile, chart, 2026);
  assert.equal(t.tuvi, null); assert.equal(t.months.length, 12);
  assert.ok(t.months.every((m) => m.cung === null && m.level >= 0 && m.level <= 2));
  assert.ok(describeTimeCycle(profile, chart, NOW).includes('Tứ Trụ'));
  // có giờ sinh nhưng không có giới tính cũng không được ném lỗi
  const g = mk({ gender: 'khac' }); assert.doesNotThrow(() => describeChart(g.profile, g.chart, NOW));
});

test('Lời cho AI có khối thời vận, không chứa từ dọa hạn', () => {
  const { profile, chart } = mk();
  const txt = describeChart(profile, chart, NOW);
  assert.match(txt, /THỜI VẬN/); assert.match(txt, /Năm 2026 \(Bính Ngọ, năm nay\)/); assert.match(txt, /Tháng 1 \(17\/2/);
  assert.doesNotMatch(describeTimeCycle(profile, chart, NOW), /hạn nặng|sao xấu|vận đen|đại họa|tai họa|đoản mệnh|số khổ/i);
});

test('Phân bố mức chú ý không dồn vào một mức (hiệu chỉnh trên 60 hồ sơ ngẫu nhiên)', () => {
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const mo = [0, 0, 0], cu = [0, 0, 0];
  for (let i = 0; i < 60; i++) {
    const profile = normalizeProfile({ fullName: 'Thử Nghiệm', gender: rnd() < 0.5 ? 'nam' : 'nu', birth: { y: 1960 + Math.floor(rnd() * 45), m: 1 + Math.floor(rnd() * 12), d: 1 + Math.floor(rnd() * 28), hour: Math.floor(rnd() * 24), minute: 0 } });
    const chart = buildChart(profile, NOW); const t = timeCycle(profile, chart, 2026);
    for (const m of t.months) mo[m.level]++;
    for (const c of t.tuvi.cungs) cu[c.level]++;
  }
  const share = (a, i) => a[i] / a.reduce((p, q) => p + q, 0);
  for (const a of [mo, cu]) { assert.ok(share(a, 0) < 0.7, 'quá nhiều mức nhẹ'); assert.ok(share(a, 2) > 0.08, 'gần như không có mức nhiều'); assert.ok(share(a, 2) < 0.4, 'quá nhiều mức nhiều'); }
});

test('Chế độ demo trả lời câu hỏi bấm từ hình lá số bằng dữ kiện đã tính; sự kiện mới được phép ghi', () => {
  const { profile, chart } = mk();
  const ask = (q) => demoReply({ phase: 'companion', profile, chart, messages: [{ role: 'user', content: q }] });
  assert.match(ask('My nói giúp mình về tháng 6 âm lịch năm 2026 nhé, tháng đó mình nên để ý điều gì?'), /Tháng 6 âm lịch năm 2026, mức chú ý (nhẹ|vừa|nhiều)/);
  assert.match(ask('My nói giúp mình về cung Quan Lộc (công việc, sự nghiệp) trong năm 2027 nhé.'), /Năm 2027, cung Quan Lộc/);
  assert.match(ask('My nói giúp mình về cung Tài Bạch (tiền bạc, cách kiếm và giữ) trong lá số của mình nhé.'), /Cung Tài Bạch/);
  for (const e of ['time_year', 'time_month', 'cung_pick', 'chart_ask', 'resonance_time']) assert.ok(EVENTS.has(e), e);
});

test('Zalo: chỉ nhận liên kết https tới Zalo, có trong email nhắc khi được cấu hình', () => {
  assert.equal(safeZaloUrl('https://zalo.me/g/abcxyz'), 'https://zalo.me/g/abcxyz');
  assert.equal(safeZaloUrl(' https://chat.zalo.me/?g=1 '), 'https://chat.zalo.me/?g=1');
  for (const bad of ['http://zalo.me/g/x', 'https://evil.com/zalo.me', 'https://zalo.me.evil.com/', 'javascript:alert(1)', 'https://user:pw@zalo.me/x', '', undefined, 'zalo.me']) assert.equal(safeZaloUrl(bad), '', String(bad));
  assert.match(buildReminder('https://x.vn', 'tok', 'https://zalo.me/g/abc').text, /https:\/\/zalo\.me\/g\/abc/);
  assert.doesNotMatch(buildReminder('https://x.vn', 'tok').text, /Zalo/);
});

test('Thử giá: tắt mặc định, bật bằng UPGRADE_TEST, lọc mức giá sai', () => {
  assert.equal(upgradePrices({}), null); assert.equal(upgradePrices({ UPGRADE_TEST: 'off' }), null);
  assert.deepEqual(upgradePrices({ UPGRADE_TEST: 'on' }), [49000, 59000, 79000]);
  assert.deepEqual(upgradePrices({ UPGRADE_TEST: 'ON', UPGRADE_PRICES: '39000, 59000,59000,abc,5,99000000,79000,89000,99000' }), [39000, 59000, 79000, 89000]);
  assert.deepEqual(upgradePrices({ UPGRADE_TEST: 'on', UPGRADE_PRICES: 'x,y' }), [49000, 59000, 79000]);
});

test('Thử giá: số liệu theo từng mức giá, đếm người không trùng', () => {
  const db = openDb(':memory:'), T0 = 1_800_000_000_000;
  const add = (actor, name, props) => ingest(db, { actor, userId: null, sid: 's' + actor, events: [{ name, props, t: T0 }] }, T0);
  for (const a of ['a', 'b', 'c']) add(a, 'upgrade_view', { v: 59, where: 'rest' });
  add('a', 'upgrade_view', { v: 59, where: 'close' }); // cùng người, không đếm hai lần
  add('d', 'upgrade_view', { v: 79, where: 'rest' });
  add('a', 'upgrade_open', { v: 59 }); add('b', 'upgrade_open', { v: 59 }); add('a', 'upgrade_click', { v: 59, plan: 'month' }); add('a', 'upgrade_feel', { v: 59, value: 3 }); add('b', 'upgrade_feel', { v: 59, value: 9 });
  const rows = computeMetrics(db, { days: 7, now: T0 + 1000 }).upgrade;
  assert.deepEqual(rows.map((r) => r.price), [59000, 79000]);
  const r = rows[0]; assert.equal(r.views, 3); assert.equal(r.opens, 2); assert.equal(r.clicks, 1); assert.equal(r.clickRate.p, 0.5); assert.deepEqual(r.feel, [0, 0, 1, 0], 'bỏ qua giá trị ngoài 1-4');
  assert.equal(rows[1].opens, 0);
});

test('Đối chiếu iztro (cố định): lưu nguyệt Đẩu Quân của 22/7/1992 giờ Mão nam, năm 2026', () => {
  // Giá trị lấy từ thư viện iztro 2.x (astro.bySolar + horoscope) cho 12 tháng âm 2026; nhánh 0 = Tý. Chạy lại bằng tools/compare-iztro.mjs.
  const { profile, chart } = mk();
  const t = timeCycle(profile, chart, 2026);
  assert.deepEqual(t.months.map((m) => m.cung.pos), [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3]);
  assert.equal(t.tuvi.ttChi, 'Ngọ'); assert.equal(chart.tuvi.palaces[t.tuvi.tt].name, 'Phúc Đức');
  assert.deepEqual(t.tuvi.luuHoa.map((h) => [h.hoa, h.star]), [['Hóa Lộc', 'Thiên Đồng'], ['Hóa Quyền', 'Thiên Cơ'], ['Hóa Khoa', 'Văn Xương'], ['Hóa Kỵ', 'Liêm Trinh']]);
});
