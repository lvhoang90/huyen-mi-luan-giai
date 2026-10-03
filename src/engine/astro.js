// Thiên văn học xấp xỉ (Meeus, độ chính xác thấp) — đủ để xác định cung hoàng đạo,
// tiết khí (cho Tứ Trụ) và cung mọc. Không cần dữ liệu ngoài.
const RAD = Math.PI / 180;
const norm = (x) => ((x % 360) + 360) % 360;

export const VN_UTC_OFFSET = 7;

export function julianDay(y, m, d, hUT = 0) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hUT / 24;
}

/** Số ngày Julian (nguyên) của ngày dương lịch — dùng cho Can Chi ngày. */
export function julianDayNumber(y, m, d) {
  return Math.round(julianDay(y, m, d, 12));
}

export function sunLongitude(jd) {
  const n = jd - 2451545.0;
  const L = norm(280.46 + 0.9856474 * n);
  const g = norm(357.528 + 0.9856003 * n) * RAD;
  return norm(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

export function moonLongitude(jd) {
  const d = jd - 2451545.0;
  const Lp = 218.3164477 + 13.17639648 * d;
  const D = (297.8501921 + 12.19074912 * d) * RAD;
  const M = (357.5291092 + 0.98560028 * d) * RAD;
  const Mp = (134.9633964 + 13.06499295 * d) * RAD;
  const F = (93.272095 + 13.22935 * d) * RAD;
  const lon =
    Lp +
    6.288774 * Math.sin(Mp) +
    1.274027 * Math.sin(2 * D - Mp) +
    0.658314 * Math.sin(2 * D) +
    0.213618 * Math.sin(2 * Mp) -
    0.185116 * Math.sin(M) -
    0.114332 * Math.sin(2 * F) +
    0.058793 * Math.sin(2 * D - 2 * Mp) +
    0.057066 * Math.sin(2 * D - M - Mp) +
    0.053322 * Math.sin(2 * D + Mp) +
    0.045758 * Math.sin(2 * D - M);
  return norm(lon);
}

export function ascendant(jd, latDeg, lonEastDeg) {
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0);
  const ramc = norm(gmst + lonEastDeg) * RAD;
  const eps = 23.4393 * RAD;
  const lat = latDeg * RAD;
  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
  return norm(Math.atan2(y, x) / RAD);
}

export const SIGNS = [
  { name: 'Bạch Dương', en: 'Aries', element: 'Lửa', mode: 'Tiên phong' },
  { name: 'Kim Ngưu', en: 'Taurus', element: 'Đất', mode: 'Kiên định' },
  { name: 'Song Tử', en: 'Gemini', element: 'Khí', mode: 'Linh hoạt' },
  { name: 'Cự Giải', en: 'Cancer', element: 'Nước', mode: 'Tiên phong' },
  { name: 'Sư Tử', en: 'Leo', element: 'Lửa', mode: 'Kiên định' },
  { name: 'Xử Nữ', en: 'Virgo', element: 'Đất', mode: 'Linh hoạt' },
  { name: 'Thiên Bình', en: 'Libra', element: 'Khí', mode: 'Tiên phong' },
  { name: 'Bọ Cạp', en: 'Scorpio', element: 'Nước', mode: 'Kiên định' },
  { name: 'Nhân Mã', en: 'Sagittarius', element: 'Lửa', mode: 'Linh hoạt' },
  { name: 'Ma Kết', en: 'Capricorn', element: 'Đất', mode: 'Tiên phong' },
  { name: 'Bảo Bình', en: 'Aquarius', element: 'Khí', mode: 'Kiên định' },
  { name: 'Song Ngư', en: 'Pisces', element: 'Nước', mode: 'Linh hoạt' },
];

/** Khoảng cách (độ) tới ranh giới cung gần nhất — để cảnh báo khi sát ranh. */
export function signEdgeDistance(lon) {
  const r = lon % 30;
  return Math.min(r, 30 - r);
}

export function signOf(lon) {
  const i = Math.floor(norm(lon) / 30);
  return { ...SIGNS[i], index: i, degree: +(norm(lon) % 30).toFixed(1), edge: +signEdgeDistance(lon).toFixed(2) };
}

export const PLACES = {
  'ha-noi': { name: 'Hà Nội', lat: 21.03, lon: 105.85 },
  'tp-hcm': { name: 'TP. Hồ Chí Minh', lat: 10.78, lon: 106.7 },
  'hai-phong': { name: 'Hải Phòng', lat: 20.86, lon: 106.68 },
  'da-nang': { name: 'Đà Nẵng', lat: 16.05, lon: 108.2 },
  'can-tho': { name: 'Cần Thơ', lat: 10.03, lon: 105.78 },
  hue: { name: 'Huế', lat: 16.46, lon: 107.59 },
  'nha-trang': { name: 'Nha Trang', lat: 12.24, lon: 109.19 },
  'da-lat': { name: 'Đà Lạt', lat: 11.94, lon: 108.44 },
  vinh: { name: 'Vinh', lat: 18.68, lon: 105.68 },
  'quy-nhon': { name: 'Quy Nhơn', lat: 13.78, lon: 109.22 },
  'buon-ma-thuot': { name: 'Buôn Ma Thuột', lat: 12.67, lon: 108.04 },
  'vung-tau': { name: 'Vũng Tàu', lat: 10.35, lon: 107.08 },
  'thai-nguyen': { name: 'Thái Nguyên', lat: 21.59, lon: 105.84 },
  'nam-dinh': { name: 'Nam Định', lat: 20.42, lon: 106.17 },
  'bien-hoa': { name: 'Biên Hòa', lat: 10.95, lon: 106.82 },
  'long-xuyen': { name: 'Long Xuyên', lat: 10.37, lon: 105.43 },
  'ca-mau': { name: 'Cà Mau', lat: 9.18, lon: 105.15 },
  'my-tho': { name: 'Mỹ Tho', lat: 10.36, lon: 106.36 },
  'thanh-hoa': { name: 'Thanh Hóa', lat: 19.81, lon: 105.78 },
  'ha-long': { name: 'Hạ Long', lat: 20.95, lon: 107.08 },
  pleiku: { name: 'Pleiku', lat: 13.98, lon: 108.0 },
  'phan-thiet': { name: 'Phan Thiết', lat: 10.93, lon: 108.1 },
};

/**
 * Tính vị trí Mặt Trời / Mặt Trăng / cung mọc cho thời điểm sinh theo giờ Việt Nam (UTC+7).
 * hour = null nghĩa là không rõ giờ sinh: dùng 12:00 cho Mặt Trời, bỏ qua Mặt Trăng nếu sát ranh, bỏ cung mọc.
 */
export function natalAstro({ y, m, d, hour, minute }, placeKey) {
  const known = hour !== null && hour !== undefined;
  const h = known ? hour + (minute || 0) / 60 : 12;
  const jd = julianDay(y, m, d, h - VN_UTC_OFFSET);
  const sun = signOf(sunLongitude(jd));
  const moonLon = moonLongitude(jd);
  const moon = signOf(moonLon);
  // Mặt Trăng đi ~13°/ngày: nếu không rõ giờ, vị trí có thể lệch tới ±6.5° trong ngày.
  const moonUncertain = !known && moon.edge < 6.5;
  const sunUncertain = !known && sun.edge < 0.6;
  let asc = null;
  const place = PLACES[placeKey];
  if (known && place) asc = signOf(ascendant(jd, place.lat, place.lon));
  return { sun, moon, moonUncertain, sunUncertain, asc, place: place?.name ?? null, jd };
}
