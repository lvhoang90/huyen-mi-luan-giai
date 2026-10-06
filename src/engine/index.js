import { natalAstro, PLACES } from './astro.js';
import { FIELD_OPTIONS } from './famous.js';
import { computeBazi, cungMenh, yearPillarOfYear } from './bazi.js';
import { computeTuVi, DEFAULT_LEAP_RULE } from './tuvi.js';
import { solarToLunar } from './lunar.js';
import { computeNumerology, NUMBER_KEYWORDS, PERSONAL_YEAR_THEME } from './numerology.js';
import { CUNG_TEN } from './tuvi.js';
import { describeTimeCycle } from './thoivan.js';

export { PLACES };
export { findPlaces } from './places.js';
export { pickFamous, famousFor, FIELD_OPTIONS } from './famous.js';
export { timeCycle, timeline, natalAttention, lifeStages, describeTimeCycle, describeTimeExtra, LEVELS, CUNG_DOI_THUONG } from './thoivan.js';

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
  const field = FIELD_OPTIONS.some((o) => o.key === p?.field) ? p.field : null;
  const leapRule = p?.leapRule === 'goc' ? 'goc' : DEFAULT_LEAP_RULE;
  return { fullName, nickname, gender, birth: { y, m, d, hour, minute }, place, field, leapRule };
}

export function buildChart(profile, now = new Date()) {
  const { birth } = profile;
  const bazi = computeBazi(birth);
  const num = computeNumerology({ fullName: profile.fullName, ...birth }, now);
  const astro = natalAstro(birth, profile.place);
  const cung = cungMenh(bazi.baziYear, profile.gender);
  const thisYear = yearPillarOfYear(now.getFullYear());
  const tuvi = computeTuVi(birth, profile.gender, { leapRule: profile.leapRule });
  const lunar = solarToLunar(birth.y, birth.m, birth.d);

  const caveats = [];
  if (birth.hour === null) caveats.push('Không rõ giờ sinh: bỏ Trụ Giờ và Cung Mọc; vị trí Mặt Trăng có thể lệch trong ngày.');
  if (birth.hour !== null && !profile.place) caveats.push('Không rõ nơi sinh: không tính được Cung Mọc.');
  if (bazi.monthBoundaryUncertain) caveats.push('Bạn sinh sát ranh giữa hai tiết khí: Trụ Tháng có thể đổi nếu giờ/phút sinh lệch vài giờ.');
  if (bazi.lateRatHour) caveats.push('Sinh trong giờ Tý muộn (23:00-24:00): theo quy ước phổ biến, Trụ Ngày tính sang ngày kế.');
  if (!tuvi) caveats.push(birth.hour === null ? 'Không rõ giờ sinh: không lập được lá số Tử Vi Đẩu Số (cần giờ sinh).' : 'Tử Vi Đẩu Số cần giới tính nam/nữ để xác định chiều đại hạn và vị trí Hỏa/Linh Tinh: chưa lập.');
  if (tuvi) caveats.push('Tử Vi lập theo trường phái phổ biến ở Việt Nam; chưa có độ sáng (miếu/hãm) của sao, Tuần/Triệt, tiểu hạn. Giờ Tý (23h-1h) tính cùng ngày sinh dương.');
  if (lunar.leap && tuvi) caveats.push(lunar.day <= 15 ? `Bạn sinh ngày ${lunar.day} tháng ${lunar.month} nhuận (nửa đầu tháng): Tử Vi lập theo tháng ${lunar.month}, trùng cả hai quy ước tháng nhuận phổ biến.`
    : tuvi.leapRule === 'goc' ? `Bạn sinh ngày ${lunar.day} tháng ${lunar.month} nhuận (nửa sau tháng): Tử Vi đang lập theo số tháng gốc (${lunar.month}). Nhiều ứng dụng chia đôi tháng nhuận và lập như tháng ${lunar.month % 12 + 1}; bạn đổi được ở khung "Quy ước đang dùng".`
    : `Bạn sinh ngày ${lunar.day} tháng ${lunar.month} nhuận (nửa sau tháng): theo quy ước chia đôi, Tử Vi được lập như tháng ${tuvi.monthUsed}. Một số ứng dụng lấy số tháng gốc (${lunar.month}) cho cả tháng nhuận; bạn đổi được ở khung "Quy ước đang dùng".`);
  if (birth.y >= 1968 && birth.y <= 1975) caveats.push('Lịch âm giai đoạn 1968-1975 từng khác nhau giữa hai miền; My dùng múi giờ UTC+7.');
  if (astro.moonUncertain) caveats.push('Mặt Trăng sát ranh cung và không rõ giờ sinh: cung Mặt Trăng chỉ mang tính tham khảo.');
  if (birth.y < 1976) caveats.push('Múi giờ Việt Nam từng thay đổi trước 1976; nếu giờ sinh ghi theo múi giờ khác (+8) thì kết quả có thể lệch.');
  caveats.push('Vị trí thiên thể và tiết khí tính bằng astronomy-engine (sai số dưới 0,01° với Mặt Trời); đủ cho mục đích chiêm nghiệm, không thay thế lịch vạn niên chuyên dụng.');

  return { bazi, numerology: num, astro, tuvi, lunar, cungMenh: cung, thisYear: { year: now.getFullYear(), pillar: thisYear }, caveats };
}

const P = (p) => (p ? `${p.name} (${p.hanhCan}/${p.hanhChi}${p.yang ? ', dương' : ', âm'})` : 'không rõ');

/** Văn bản mô tả lá số - đưa vào system prompt (dữ kiện đã tính, AI không được tự bịa thêm). */
export function describeChart(profile, chart, now = new Date()) {
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
  const k = (x) => `${x} - ${NUMBER_KEYWORDS[x]}`;
  L.push(`- Số chủ đạo (đường đời): ${k(n.lifePath)}`);
  L.push(`- Số biểu đạt (tên): ${k(n.expression)}; số linh hồn: ${k(n.soul)}; số nhân cách: ${k(n.personality)}`);
  L.push(`- Số ngày sinh: ${n.birthDay}; số trưởng thành: ${n.maturity}; năm cá nhân ${thisYear.year}: ${n.personalYear} - ${PERSONAL_YEAR_THEME[n.personalYear]}`);
  L.push(`- Chữ số vắng trong tên: ${n.missingDigits.join(', ') || 'không'}`);
  L.push('');
  L.push('CHIÊM TINH (tropical):');
  L.push(`- Mặt Trời: ${astro.sun.name} (${astro.sun.element}, ${astro.sun.mode}) ${astro.sun.degree}°${astro.sunUncertain ? ' [sát ranh, chưa chắc]' : ''}`);
  L.push(`- Mặt Trăng: ${astro.moon.name} (${astro.moon.element}) ${astro.moon.degree}°${astro.moonUncertain ? ' [không chắc do thiếu giờ sinh]' : ''}`);
  L.push(`- Cung Mọc: ${astro.asc ? `${astro.asc.name} (${astro.asc.element})` : 'không tính được'}`);
  L.push('');
  if (astro.planets?.length) {
    L.push('- Hành tinh: ' + astro.planets.slice(2).map((p) => `${p.name} ${p.sign}${p.retrograde ? ' (nghịch hành)' : ''}${p.house ? ` nhà ${p.house}` : ''}${p.uncertain ? ' [không chắc]' : ''}`).join('; '));
    if (astro.aspects.length) L.push('- Góc chiếu chặt nhất: ' + astro.aspects.slice(0, 6).map((a) => `${a.a} ${a.type} ${a.b} (lệch ${a.orb}°)`).join('; '));
    if (astro.stellium.length) L.push('- Tụ hành tinh: ' + astro.stellium.map((x) => `${x.sign}: ${x.planets.join(', ')}`).join('; '));
    L.push(`- Phân bố nguyên tố (7 thiên thể đầu): ${Object.entries(astro.elementCount).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }
  L.push('');
  const tv = chart.tuvi;
  L.push('TỬ VI ĐẨU SỐ (âm lịch Việt Nam, UTC+7):');
  L.push(`- Ngày sinh âm lịch: ${chart.lunar.day}/${chart.lunar.month}${chart.lunar.leap ? ' nhuận' : ''}/${chart.lunar.year}${tv ? ` (năm ${tv.lunar.canChiYear})` : ''}`);
  if (tv) {
    if (tv.monthUsed !== chart.lunar.month) L.push(`- Người này sinh nửa sau tháng ${chart.lunar.month} nhuận; lá số được lập như tháng ${tv.monthUsed} theo quy ước chia đôi tháng nhuận (có thể khác ứng dụng khác)`);
    L.push(`- ${tv.cuc.ten}; ${tv.amDuong}; Mệnh tại ${tv.palaces[tv.menh].chi}, Thân cư ${tv.thanCu} (${tv.palaces[tv.than].chi})${tv.menhVoChinhDieu ? '; Mệnh VÔ CHÍNH DIỆU (xem sao cung Thiên Di)' : ''}`);
    L.push(`- Tứ Hóa (can năm ${tv.lunar.canChiYear.split(' ')[0]}): ${Object.entries(tv.hoaAt).map(([h, v]) => `${h} → ${v.star} tại cung ${tv.palaces[v.pos].name}`).join('; ')}`);
    for (const p of tv.palaces) {
      const st = [...p.chinh, ...p.phu, ...p.sat].join(', ') || 'không có sao chính';
      L.push(`- ${p.name} (${p.can} ${p.chi}${p.isThan ? ', Thân' : ''}${p.daiHan ? `; đại hạn ${p.daiHan[0]}-${p.daiHan[1]} tuổi` : ''}): ${st}${p.hoa.length ? ` [${p.hoa.join(', ')}]` : ''}`);
    }
  } else L.push('- Chưa lập được (thiếu giờ sinh hoặc giới tính).');
  L.push('');
  L.push(describeTimeCycle(profile, chart, now));
  L.push('');
  L.push('GIỚI HẠN CỦA DỮ LIỆU:');
  for (const cv of chart.caveats) L.push(`- ${cv}`);
  return L.join('\n');
}

/**
 * "Nét riêng" của lá số này: các đặc điểm hiếm/nổi bật, xếp theo độ hiếm.
 * Dùng để mỗi người nhận một câu chuyện khác nhau thay vì cùng một khuôn.
 */
export function distinctiveTraits(profile, chart) {
  const T = [];
  const add = (score, text) => T.push({ score, text });
  const { bazi, numerology: n, astro, tuvi } = chart;
  const e = bazi.elements;
  if ([11, 22, 33].includes(n.lifePath)) add(9, `Số chủ đạo ${n.lifePath} là số bậc thầy (hiếm hơn các số còn lại)`);
  if (e.missing.length >= 2) add(8, `Tứ Trụ vắng hẳn ${e.missing.join(' và ')}`);
  else if (e.missing.length === 1) add(6, `Tứ Trụ vắng hành ${e.missing[0]}`);
  const top = Math.max(...Object.values(e.counts));
  if (top >= 4) add(8, `Ngũ hành dồn về ${e.dominant} (${top}/${e.total} ký tự)`);
  if (e.strength !== 'cân bằng') add(5, `Nhật chủ ${bazi.dayMaster.can} (${bazi.dayMaster.hanh}) thân ${e.strength}`);
  if (astro.stellium.length) add(9, `Tụ ${astro.stellium[0].planets.length} thiên thể ở ${astro.stellium[0].sign}`);
  const retro = astro.planets.filter((p) => p.retrograde && ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(p.key));
  if (retro.length) add(5, `${retro.map((p) => p.name).join(', ')} nghịch hành lúc sinh`);
  if (astro.aspects[0] && astro.aspects[0].orb < 1) add(6, `Góc chiếu rất chặt: ${astro.aspects[0].a} ${astro.aspects[0].type} ${astro.aspects[0].b}`);
  if (astro.sun.element !== bazi.dayMaster.hanh) add(3, `Mặt Trời cung ${astro.sun.element} trong khi Nhật chủ hành ${bazi.dayMaster.hanh}: hai lăng kính nhìn khác nhau`);
  if (tuvi) {
    if (tuvi.menhVoChinhDieu) add(8, 'Cung Mệnh vô chính diệu (mượn sao cung Thiên Di)');
    const m = tuvi.palaces[tuvi.menh];
    if (m.chinh.length) add(7, `Mệnh có ${m.chinh.join(', ')}`);
    for (const [h, v] of Object.entries(tuvi.hoaAt)) if (h === 'Hóa Kỵ' || h === 'Hóa Lộc') add(5, `${h} (${v.star}) rơi vào cung ${tuvi.palaces[v.pos].name}`);
    if (tuvi.palaces.some((p) => p.chinh.length === 0 && ['Quan Lộc', 'Tài Bạch', 'Phu Thê'].includes(p.name))) {
      const e2 = tuvi.palaces.filter((p) => p.chinh.length === 0 && ['Quan Lộc', 'Tài Bạch', 'Phu Thê'].includes(p.name)).map((p) => p.name);
      add(6, `Cung ${e2.join(', ')} không có chính tinh`);
    }
  }
  if (n.lifePath === n.expression) add(6, `Số chủ đạo trùng số biểu đạt (${n.lifePath}): bản chất và cách biểu hiện cùng một hướng`);
  if (n.missingDigits.length >= 3) add(4, `Tên vắng các con số ${n.missingDigits.join(', ')}`);
  return T.sort((a, b) => b.score - a.score).slice(0, 6).map((t) => t.text);
}
