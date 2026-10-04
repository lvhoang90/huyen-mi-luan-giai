// Tứ Trụ (Bát Tự), Nạp Âm, Ngũ Hành, Cung Mệnh (Bát Trạch).
// Năm/tháng được xác định theo tiết khí thật (kinh độ Mặt Trời), không theo mùng 1 âm lịch.
import { julianDay, julianDayNumber, sunLongitude, VN_UTC_OFFSET } from './astro.js';

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const CAN_HANH = ['Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ', 'Kim', 'Kim', 'Thủy', 'Thủy'];
export const CHI_HANH = ['Thủy', 'Thổ', 'Mộc', 'Mộc', 'Thổ', 'Hỏa', 'Hỏa', 'Thổ', 'Kim', 'Kim', 'Thổ', 'Thủy'];
export const HANH = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
const SINH = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
const KHAC = { Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim', Kim: 'Mộc' };

const NAP_AM = [
  'Hải Trung Kim', 'Lư Trung Hỏa', 'Đại Lâm Mộc', 'Lộ Bàng Thổ', 'Kiếm Phong Kim',
  'Sơn Đầu Hỏa', 'Giản Hạ Thủy', 'Thành Đầu Thổ', 'Bạch Lạp Kim', 'Dương Liễu Mộc',
  'Tuyền Trung Thủy', 'Ốc Thượng Thổ', 'Phích Lịch Hỏa', 'Tùng Bách Mộc', 'Trường Lưu Thủy',
  'Sa Trung Kim', 'Sơn Hạ Hỏa', 'Bình Địa Mộc', 'Bích Thượng Thổ', 'Kim Bạch Kim',
  'Phúc Đăng Hỏa', 'Thiên Hà Thủy', 'Đại Dịch Thổ', 'Thoa Xuyến Kim', 'Tang Đố Mộc',
  'Đại Khê Thủy', 'Sa Trung Thổ', 'Thiên Thượng Hỏa', 'Thạch Lựu Mộc', 'Đại Hải Thủy',
];
const NAP_AM_Y = {
  'Hải Trung Kim': 'vàng dưới đáy biển', 'Lư Trung Hỏa': 'lửa trong lò', 'Đại Lâm Mộc': 'cây rừng lớn',
  'Lộ Bàng Thổ': 'đất ven đường', 'Kiếm Phong Kim': 'vàng mũi kiếm', 'Sơn Đầu Hỏa': 'lửa đầu núi',
  'Giản Hạ Thủy': 'nước khe suối', 'Thành Đầu Thổ': 'đất đầu thành', 'Bạch Lạp Kim': 'vàng chân đèn',
  'Dương Liễu Mộc': 'gỗ dương liễu', 'Tuyền Trung Thủy': 'nước giữa suối', 'Ốc Thượng Thổ': 'đất trên mái nhà',
  'Phích Lịch Hỏa': 'lửa sấm sét', 'Tùng Bách Mộc': 'cây tùng bách', 'Trường Lưu Thủy': 'dòng nước dài',
  'Sa Trung Kim': 'vàng trong cát', 'Sơn Hạ Hỏa': 'lửa chân núi', 'Bình Địa Mộc': 'cây đồng bằng',
  'Bích Thượng Thổ': 'đất trên vách', 'Kim Bạch Kim': 'vàng bạch kim', 'Phúc Đăng Hỏa': 'lửa ngọn đèn',
  'Thiên Hà Thủy': 'nước sông Ngân', 'Đại Dịch Thổ': 'đất dịch trạm lớn', 'Thoa Xuyến Kim': 'vàng trang sức',
  'Tang Đố Mộc': 'gỗ cây dâu', 'Đại Khê Thủy': 'nước khe lớn', 'Sa Trung Thổ': 'đất trong cát',
  'Thiên Thượng Hỏa': 'lửa trên trời', 'Thạch Lựu Mộc': 'cây thạch lựu', 'Đại Hải Thủy': 'nước biển lớn',
};

const pillar = (stem, branch) => ({
  can: CAN[stem], chi: CHI[branch], stem, branch,
  name: `${CAN[stem]} ${CHI[branch]}`,
  hanhCan: CAN_HANH[stem], hanhChi: CHI_HANH[branch],
  yang: stem % 2 === 0,
});

/** Chỉ số 0..59 (Giáp Tý = 0) → trụ. */
export function pillarFromIndex60(i) {
  i = ((i % 60) + 60) % 60;
  return pillar(i % 10, i % 12);
}

export function napAm(p) {
  // Tìm chỉ số 60 từ (stem, branch)
  for (let i = 0; i < 60; i++) if (i % 10 === p.stem && i % 12 === p.branch) {
    const name = NAP_AM[Math.floor(i / 2)];
    return { name, image: NAP_AM_Y[name], hanh: name.split(' ').pop() };
  }
}

/** Trụ năm theo Lập Xuân (kinh độ Mặt Trời = 315°). */
function yearPillarFor(y, m, lon) {
  let by = y;
  if (m <= 2 && lon >= 270 && lon < 315) by = y - 1;
  return { by, p: pillar(((by - 4) % 10 + 10) % 10, ((by - 4) % 12 + 12) % 12) };
}

export function computeBazi({ y, m, d, hour, minute }) {
  const known = hour !== null && hour !== undefined;
  const h = known ? hour + (minute || 0) / 60 : 12;
  const jd = julianDay(y, m, d, h - VN_UTC_OFFSET);
  const lon = sunLongitude(jd);

  const { by, p: yearP } = yearPillarFor(y, m, lon);

  // Tháng: Dần bắt đầu tại 315°, mỗi tháng 30°.
  const mi = Math.floor((((lon - 315) % 360) + 360) % 360 / 30); // 0 = Dần
  const monthBranch = (2 + mi) % 12;
  const monthStem = (((yearP.stem % 5) * 2 + 2) + mi) % 10;
  const monthP = pillar(monthStem, monthBranch);
  const toBoundary = (((lon - 315) % 30) + 30) % 30;
  const monthBoundaryUncertain = Math.min(toBoundary, 30 - toBoundary) < (known ? 0.15 : 0.6);

  // Ngày: đổi ngày lúc 23:00 (giờ Tý sớm → tính sang ngày kế).
  const lateRat = known && hour >= 23;
  const dayJdn = julianDayNumber(y, m, d) + (lateRat ? 1 : 0);
  const dayP = pillarFromIndex60(dayJdn + 49);

  let hourP = null;
  if (known) {
    const hb = Math.floor((hour + 1) / 2) % 12;
    const hs = (((dayP.stem % 5) * 2) + hb) % 10;
    hourP = pillar(hs, hb);
  }

  const pillars = { year: yearP, month: monthP, day: dayP, hour: hourP };
  const elements = elementBalance(pillars);
  return {
    pillars,
    baziYear: by,
    napAmYear: napAm(yearP),
    napAmDay: napAm(dayP),
    dayMaster: { can: dayP.can, hanh: dayP.hanhCan, yang: dayP.yang },
    elements,
    monthBoundaryUncertain,
    lateRatHour: lateRat,
  };
}

/** Đếm ngũ hành (can + chi chính khí) và nhận định thân vượng/nhược mang tính tham khảo. */
export function elementBalance(pillars) {
  const counts = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  const ps = ['year', 'month', 'day', 'hour'].map((k) => pillars[k]).filter(Boolean);
  for (const p of ps) { counts[p.hanhCan]++; counts[p.hanhChi]++; }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const dm = pillars.day.hanhCan;
  const resource = Object.keys(SINH).find((k) => SINH[k] === dm);
  // Đắc lệnh: chi tháng cùng hành hoặc sinh cho Nhật chủ (tính gấp đôi).
  const monthEl = pillars.month.hanhChi;
  const inSeason = monthEl === dm || monthEl === resource;
  let support = counts[dm] + counts[resource] + (inSeason ? 2 : 0) - 1; // trừ chính Nhật chủ
  const weight = total - 1 + (inSeason ? 2 : 0);
  const ratio = support / weight;
  const strength = ratio >= 0.55 ? 'vượng' : ratio <= 0.38 ? 'nhược' : 'cân bằng';
  const missing = HANH.filter((h) => counts[h] === 0);
  const dominant = HANH.reduce((a, b) => (counts[b] > counts[a] ? b : a));
  let balancing = [];
  if (strength === 'vượng') balancing = [SINH[dm], KHAC[dm]];
  else if (strength === 'nhược') balancing = [dm, resource];
  return { counts, total, dayMasterElement: dm, resource, inSeason, strength, ratio: +ratio.toFixed(2), missing, dominant, balancing };
}

// ---- Cung mệnh (Bát Trạch) ----
const QUAI = {
  1: { name: 'Khảm', hanh: 'Thủy', nhom: 'Đông tứ mệnh' },
  2: { name: 'Khôn', hanh: 'Thổ', nhom: 'Tây tứ mệnh' },
  3: { name: 'Chấn', hanh: 'Mộc', nhom: 'Đông tứ mệnh' },
  4: { name: 'Tốn', hanh: 'Mộc', nhom: 'Đông tứ mệnh' },
  6: { name: 'Càn', hanh: 'Kim', nhom: 'Tây tứ mệnh' },
  7: { name: 'Đoài', hanh: 'Kim', nhom: 'Tây tứ mệnh' },
  8: { name: 'Cấn', hanh: 'Thổ', nhom: 'Tây tứ mệnh' },
  9: { name: 'Ly', hanh: 'Hỏa', nhom: 'Đông tứ mệnh' },
};
const digitRoot = (n) => { while (n > 9) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };

export function cungMenh(baziYear, gender) {
  if (gender !== 'nam' && gender !== 'nu') return null;
  const r = digitRoot(baziYear);
  const post2000 = baziYear >= 2000;
  let n;
  if (gender === 'nam') n = digitRoot(post2000 ? 9 - r : 11 - r) || 9;
  else n = digitRoot(post2000 ? r + 6 : r + 4);
  if (n === 0) n = 9;
  if (n === 5) n = gender === 'nam' ? 2 : 8;
  return { so: n, ...QUAI[n] };
}

/** Trụ của một năm dương lịch (lưu niên) - dùng cho "năm nay". */
export function yearPillarOfYear(y) {
  return pillar(((y - 4) % 10 + 10) % 10, ((y - 4) % 12 + 12) % 12);
}
