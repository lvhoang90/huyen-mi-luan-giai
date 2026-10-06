// Đối chiếu lớp thời vận (src/engine/thoivan.js) với một thư viện Tử Vi độc lập khác (mã nguồn mở, giấy phép MIT).
// Thư viện đó KHÔNG nằm trong sản phẩm hay package.json; chỉ cài tạm vào một thư mục riêng để kiểm thử (tên gói nằm ở dòng require bên dưới):
//   mkdir /tmp/ext && cd /tmp/ext && npm init -y && npm i <tên gói ở dòng require>
//   EXTERNAL_LIB_DIR=/tmp/ext node tools/compare-external.mjs 400
// So: cục và cung Mệnh, chính tinh, đại hạn (đến 100 tuổi), Lưu Thái Tuế, tên cung lưu niên, Lưu Tứ Hóa, cung lưu nguyệt Đẩu Quân.
// Lá số có gốc lệch (lịch âm khác 1 ngày do múi giờ, hoặc quy ước tháng nhuận) được bỏ qua phần vận hạn và liệt kê riêng.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const EXT = process.env.EXTERNAL_LIB_DIR;
if (!EXT) { console.error('Đặt EXTERNAL_LIB_DIR là thư mục đã cài thư viện đối chiếu (xem đầu tệp).'); process.exit(1); }
const { astro } = createRequire(path.join(path.resolve(EXT), 'x.js'))('iztro');
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'engine') + '/';
const { normalizeProfile, buildChart } = await import(R + 'index.js');
const { timeCycle } = await import(R + 'thoivan.js');
const { lunarMonthsOfYear } = await import(R + 'lunar.js');
const BR = { 子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11 };
const NAME = { 命宫: 'Mệnh', 父母: 'Phụ Mẫu', 福德: 'Phúc Đức', 田宅: 'Điền Trạch', 官禄: 'Quan Lộc', 仆役: 'Nô Bộc', 迁移: 'Thiên Di', 疾厄: 'Tật Ách', 财帛: 'Tài Bạch', 子女: 'Tử Tức', 夫妻: 'Phu Thê', 兄弟: 'Huynh Đệ' };
const STAR = { 紫微: 'Tử Vi', 天机: 'Thiên Cơ', 太阳: 'Thái Dương', 武曲: 'Vũ Khúc', 天同: 'Thiên Đồng', 廉贞: 'Liêm Trinh', 天府: 'Thiên Phủ', 太阴: 'Thái Âm', 贪狼: 'Tham Lang', 巨门: 'Cự Môn', 天相: 'Thiên Tướng', 天梁: 'Thiên Lương', 七杀: 'Thất Sát', 破军: 'Phá Quân', 文昌: 'Văn Xương', 文曲: 'Văn Khúc', 左辅: 'Tả Phụ', 右弼: 'Hữu Bật' };
const HOA = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
let seed = 20261006; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const N = +process.argv[2] || 150;
const bad = { cuc_menh: 0, chinh: 0, daihan: 0, ttuMenh: 0, luuHoa: 0, luuCung: 0, thang: 0 }, tot = { chart: 0, year: 0, month: 0, daihan: 0 };
const ex = {}; let lastBad = { ...bad }; const skipped = [];
const note = (k, s) => { bad[k]++; (ex[k] ??= []).length < 3 && ex[k].push(s); };
for (let i = 0; i < N; i++) {
  const y = 1950 + Math.floor(rnd() * 70), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28), hour = Math.floor(rnd() * 23), gender = rnd() < .5 ? 'nam' : 'nu';
  const ti = hour === 0 ? 0 : Math.floor((hour + 1) / 2);
  const profile = normalizeProfile({ fullName: 'Thử Nghiệm', gender, birth: { y, m, d, hour, minute: 0 } });
  const chart = buildChart(profile, new Date('2026-10-06')), tv = chart.tuvi;
  const a = astro.bySolar(`${y}-${m}-${d}`, ti, gender === 'nam' ? '男' : '女', true, 'zh-CN');
  const tag = `${d}/${m}/${y} ${hour}h ${gender}`;
  tot.chart++;
  const pi = (p) => BR[p.earthlyBranch];
  // Mệnh, cục
  const menh = a.palaces.find((p) => p.name === '命宫');
  if (BR[menh.earthlyBranch] !== tv.menh || a.fiveElementsClass.slice(-2) !== ({ 2: '二局', 3: '三局', 4: '四局', 5: '五局', 6: '六局' })[tv.cuc.so]) note('cuc_menh', `${tag}: thư viện khác ${menh.earthlyBranch}/${a.fiveElementsClass} vs ${tv.menh}/${tv.cuc.so}`);
  // chính tinh
  for (const p of a.palaces) { const mine = tv.palaces[pi(p)].chinh.slice().sort().join(); const theirs = p.majorStars.map((s) => STAR[s.name]).filter(Boolean).sort().join(); if (mine !== theirs) { note('chinh', `${tag} ${p.earthlyBranch}: ${theirs} vs ${mine}`); break; } }
  // đại hạn: khoảng tuổi mỗi cung
  for (const p of a.palaces) { tot.daihan++; const mine = tv.palaces[pi(p)].daiHan; if (p.decadal.range[0] <= 100 && (!mine || mine[0] !== p.decadal.range[0] || mine[1] !== p.decadal.range[1])) { note('daihan', `${tag} ${p.earthlyBranch}: thư viện khác ${p.decadal.range} vs ${mine}`); break; } }
  const sameNatal = !(bad.cuc_menh !== lastBad.cuc_menh || bad.chinh !== lastBad.chinh); lastBad = { ...bad };
  if (!sameNatal) { skipped.push(tag); continue; }
  // theo năm 2026..2028
  for (const yr of [2026, 2027, 2028]) {
    tot.year++;
    const tc = timeCycle(profile, chart, yr), h = a.horoscope(`${yr}-9-15`);
    const ttPos = BR[h.yearly.earthlyBranch] ?? null;
    if (tc.tuvi.tt !== BR[h.yearly.earthlyBranch]) note('ttuMenh', `${tag} ${yr}: thư viện khác ${h.yearly.earthlyBranch} vs ${tc.tuvi.ttChi}`);
    // cung được đặt tên Mệnh lưu niên phải là nhánh Thái Tuế; so tên cung lưu niên ở từng nhánh
    const theirsNames = Object.fromEntries(a.palaces.map((p) => [BR[p.earthlyBranch], NAME[h.yearly.palaceNames[p.index]]]));
    for (const c of tc.tuvi.cungs) if (theirsNames[c.pos] !== c.luuName) { note('luuCung', `${tag} ${yr} nhánh ${c.pos}: ${theirsNames[c.pos]} vs ${c.luuName}`); break; }
    const theirHoa = h.yearly.mutagen.map((s) => STAR[s]); const mineHoa = tc.tuvi.luuHoa.map((x) => x.star);
    if (JSON.stringify(theirHoa) !== JSON.stringify(Object.values(Object.fromEntries(HOA.map((hh, k) => [k, STAR[h.yearly.mutagen[k]]]))))) {}
    const mineByHoa = Object.fromEntries(tc.tuvi.luuHoa.map((x) => [x.hoa, x.star]));
    for (let k = 0; k < 4; k++) if (STAR[h.yearly.mutagen[k]] !== mineByHoa[HOA[k]]) { note('luuHoa', `${tag} ${yr} ${HOA[k]}: ${h.yearly.mutagen[k]} vs ${mineByHoa[HOA[k]]}`); break; }
    // lưu nguyệt: tháng âm k → nhánh
    const months = lunarMonthsOfYear(yr).filter((lm) => !lm.leap);
    for (const mo of tc.months) {
      tot.month++;
      const lm = months.find((x) => x.month === mo.month), mid = new Date((lm.startJdn + 14 - 2440588) * 86400000);
      const hh = a.horoscope(`${mid.getUTCFullYear()}-${mid.getUTCMonth() + 1}-${mid.getUTCDate()}`);
      const theirPos = BR[a.palaces[hh.monthly.index].earthlyBranch];
      if (mo.cung.pos !== theirPos) { note('thang', `${tag} ${yr} tháng ${mo.month}: thư viện khác nhánh ${theirPos} vs ${mo.cung.pos}`); }
    }
  }
}
console.log('số lá số', tot.chart, '| năm xét', tot.year, '| tháng xét', tot.month);
console.log('lá số gốc lệch (bỏ qua phần vận hạn):', skipped.length, skipped.join(' | '));
console.log('sai khác:', JSON.stringify(bad));
for (const [k, v] of Object.entries(ex)) console.log(k, v);
