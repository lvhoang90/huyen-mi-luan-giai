import { natalAstro, PLACES } from './astro.js';
import { computeBazi, cungMenh, yearPillarOfYear } from './bazi.js';
import { computeNumerology, NUMBER_KEYWORDS, PERSONAL_YEAR_THEME } from './numerology.js';

export { PLACES };

/** Kiểm tra & chuẩn hóa hồ sơ người dùng. Ném Error nếu sai. */
export function normalizeProfile(p) {
  const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>{}\[\]"`\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  const fullName = clean(p?.fullName, 80);
  if (!fullName) throw new Error('Thiếu họ tên');
  const nickname = clean(p?.nickname, 40) || fullName.split(' ').pop();
  const gender = ['nam', 'nu', 'khac'].includes(p?.gender) ? p.gender : 'khac';
  const b = p?.birth ?? {};
  const y = +b.y, m = +b.m, d = +b.d;
  const now = new Date();
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (!Number.isInteger(y) || y < 1900 || y > now.getFullYear() || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d)
    throw new Error('Ngày sinh không hợp lệ');
  let hour = null, minute = null;
  if (b.hour !== null && b.hour !== undefined && b.hour !== '') {
    hour = +b.hour; minute = +(b.minute ?? 0);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59)
      throw new Error('Giờ sinh không hợp lệ');
  }
  const place = PLACES[p?.place] ? p.place : null;
  return { fullName, nickname, gender, birth: { y, m, d, hour, minute }, place };
}

export function buildChart(profile, now = new Date()) {
  const { birth } = profile;
  const bazi = computeBazi(birth);
  const num = computeNumerology({ fullName: profile.fullName, ...birth }, now);
  const astro = natalAstro(birth, profile.place);
  const cung = cungMenh(bazi.baziYear, profile.gender);
  const thisYear = yearPillarOfYear(now.getFullYear());

  const caveats = [];
  if (birth.hour === null) caveats.push('Không rõ giờ sinh: bỏ Trụ Giờ và Cung Mọc; vị trí Mặt Trăng có thể lệch trong ngày.');
  if (birth.hour !== null && !profile.place) caveats.push('Không rõ nơi sinh: không tính được Cung Mọc.');
  if (bazi.monthBoundaryUncertain) caveats.push('Bạn sinh sát ranh giữa hai tiết khí: Trụ Tháng có thể đổi nếu giờ/phút sinh lệch vài giờ.');
  if (bazi.lateRatHour) caveats.push('Sinh trong giờ Tý muộn (23:00–24:00): theo quy ước phổ biến, Trụ Ngày tính sang ngày kế.');
  if (astro.moonUncertain) caveats.push('Mặt Trăng sát ranh cung và không rõ giờ sinh: cung Mặt Trăng chỉ mang tính tham khảo.');
  if (birth.y < 1976) caveats.push('Múi giờ Việt Nam từng thay đổi trước 1976; nếu giờ sinh ghi theo múi giờ khác (+8) thì kết quả có thể lệch.');
  caveats.push('Mọi con số được tính bằng thuật toán thiên văn xấp xỉ, đủ cho mục đích chiêm nghiệm, không thay thế lịch vạn niên chuyên dụng.');

  return { bazi, numerology: num, astro, cungMenh: cung, thisYear: { year: now.getFullYear(), pillar: thisYear }, caveats };
}

const P = (p) => (p ? `${p.name} (${p.hanhCan}/${p.hanhChi}${p.yang ? ', dương' : ', âm'})` : 'không rõ');

/** Văn bản mô tả lá số — đưa vào system prompt (dữ kiện đã tính, AI không được tự bịa thêm). */
export function describeChart(profile, chart) {
  const { bazi, numerology: n, astro, cungMenh: c, thisYear } = chart;
  const e = bazi.elements;
  const L = [];
  L.push(`TỨ TRỤ (theo tiết khí thật, giờ Việt Nam UTC+7):`);
  L.push(`- Trụ Năm: ${P(bazi.pillars.year)}; Trụ Tháng: ${P(bazi.pillars.month)}; Trụ Ngày: ${P(bazi.pillars.day)}; Trụ Giờ: ${P(bazi.pillars.hour)}`);
  L.push(`- Nhật chủ: ${bazi.dayMaster.can} (${bazi.dayMaster.hanh}, ${bazi.dayMaster.yang ? 'dương' : 'âm'}); sinh tháng ${bazi.pillars.month.chi}, ${e.inSeason ? 'đắc lệnh' : 'không đắc lệnh'}; thân ${e.strength} (tham khảo)`);
  L.push(`- Nạp âm năm sinh: ${bazi.napAmYear.name} ("${bazi.napAmYear.image}"); nạp âm ngày: ${bazi.napAmDay.name}`);
  L.push(`- Phân bố ngũ hành (can+chi, ${e.total} ký tự): ${Object.entries(e.counts).map(([k, v]) => `${k} ${v}`).join(', ')}; thiếu: ${e.missing.join(', ') || 'không'}; trội: ${e.dominant}; hướng cân bằng gợi ý: ${e.balancing.join(' / ') || 'không'}`);
  if (c) L.push(`- Cung mệnh Bát Trạch: ${c.name} (${c.hanh}), ${c.nhom}`);
  L.push(`- Năm hiện tại ${thisYear.year}: ${thisYear.pillar.name} (${thisYear.pillar.hanhCan}/${thisYear.pillar.hanhChi})`);
  L.push('');
  L.push('THẦN SỐ HỌC (Pythagoras):');
  const k = (x) => `${x} — ${NUMBER_KEYWORDS[x]}`;
  L.push(`- Số chủ đạo (đường đời): ${k(n.lifePath)}`);
  L.push(`- Số biểu đạt (tên): ${k(n.expression)}; số linh hồn: ${k(n.soul)}; số nhân cách: ${k(n.personality)}`);
  L.push(`- Số ngày sinh: ${n.birthDay}; số trưởng thành: ${n.maturity}; năm cá nhân ${thisYear.year}: ${n.personalYear} — ${PERSONAL_YEAR_THEME[n.personalYear]}`);
  L.push(`- Chữ số vắng trong tên: ${n.missingDigits.join(', ') || 'không'}`);
  L.push('');
  L.push('CHIÊM TINH (tropical):');
  L.push(`- Mặt Trời: ${astro.sun.name} (${astro.sun.element}, ${astro.sun.mode}) ${astro.sun.degree}°${astro.sunUncertain ? ' [sát ranh, chưa chắc]' : ''}`);
  L.push(`- Mặt Trăng: ${astro.moon.name} (${astro.moon.element}) ${astro.moon.degree}°${astro.moonUncertain ? ' [không chắc do thiếu giờ sinh]' : ''}`);
  L.push(`- Cung Mọc: ${astro.asc ? `${astro.asc.name} (${astro.asc.element})` : 'không tính được'}`);
  L.push('');
  L.push('GIỚI HẠN CỦA DỮ LIỆU:');
  for (const cv of chart.caveats) L.push(`- ${cv}`);
  return L.join('\n');
}
