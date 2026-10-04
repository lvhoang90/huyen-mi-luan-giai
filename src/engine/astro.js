// Thiên văn học xấp xỉ (Meeus, độ chính xác thấp) - đủ để xác định cung hoàng đạo,
// tiết khí (cho Tứ Trụ) và cung mọc. Không cần dữ liệu ngoài.
import * as Astronomy from 'astronomy-engine';

const RAD = Math.PI / 180;
const timeOfJD = (jd) => Astronomy.MakeTime(new Date((jd - 2440587.5) * 86400000));
const norm = (x) => ((x % 360) + 360) % 360;

export const VN_UTC_OFFSET = 7;

export function julianDay(y, m, d, hUT = 0) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hUT / 24;
}

/** Số ngày Julian (nguyên) của ngày dương lịch - dùng cho Can Chi ngày. */
export function julianDayNumber(y, m, d) {
  return Math.round(julianDay(y, m, d, 12));
}

/** Kinh độ hoàng đạo thực (of date) - astronomy-engine (VSOP87 / ELP), sai số < 0,01°. */
export function sunLongitude(jd) { return norm(Astronomy.SunPosition(timeOfJD(jd)).elon); }
export function moonLongitude(jd) { return norm(Astronomy.Ecliptic(Astronomy.GeoVector('Moon', timeOfJD(jd), true)).elon); }

export const PLANETS = [
  ['Sun', 'Mặt Trời'], ['Moon', 'Mặt Trăng'], ['Mercury', 'Thủy Tinh'], ['Venus', 'Kim Tinh'], ['Mars', 'Hỏa Tinh'],
  ['Jupiter', 'Mộc Tinh'], ['Saturn', 'Thổ Tinh'], ['Uranus', 'Thiên Vương'], ['Neptune', 'Hải Vương'], ['Pluto', 'Diêm Vương'],
];
export function planetLongitude(body, jd) {
  const t = timeOfJD(jd);
  if (body === 'Sun') return norm(Astronomy.SunPosition(t).elon);
  return norm(Astronomy.Ecliptic(Astronomy.GeoVector(body, t, true)).elon);
}
/** Hành tinh có đang nghịch hành không (so kinh độ ±1 ngày). */
export function isRetrograde(body, jd) {
  if (body === 'Sun' || body === 'Moon') return false;
  const d = ((planetLongitude(body, jd + 0.5) - planetLongitude(body, jd - 0.5) + 540) % 360) - 180;
  return d < 0;
}

export function ascendant(jd, latDeg, lonEastDeg) {
  const gmst = Astronomy.SiderealTime(timeOfJD(jd)) * 15; // giờ → độ
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

/** Khoảng cách (độ) tới ranh giới cung gần nhất - để cảnh báo khi sát ranh. */
export function signEdgeDistance(lon) {
  const r = lon % 30;
  return Math.min(r, 30 - r);
}

export function signOf(lon) {
  const i = Math.floor(norm(lon) / 30);
  return { ...SIGNS[i], index: i, degree: +(norm(lon) % 30).toFixed(1), edge: +signEdgeDistance(lon).toFixed(2) };
}

export const PLACES = {
  'ha-noi': { name: 'Hà Nội', alias: ['Hanoi'], lat: 21.03, lon: 105.85 },
  'tp-hcm': { name: 'TP. Hồ Chí Minh', alias: ['Sài Gòn', 'Saigon', 'TPHCM', 'HCM', 'Hồ Chí Minh', 'Gia Định'], lat: 10.78, lon: 106.7 },
  'hai-phong': { name: 'Hải Phòng', lat: 20.86, lon: 106.68 },
  'da-nang': { name: 'Đà Nẵng', lat: 16.05, lon: 108.2 },
  'can-tho': { name: 'Cần Thơ', lat: 10.03, lon: 105.78 },
  hue: { name: 'Huế', alias: ['Thừa Thiên Huế', 'Thừa Thiên - Huế'], lat: 16.46, lon: 107.59 },
  'nha-trang': { name: 'Nha Trang', alias: ['Khánh Hòa', 'Cam Ranh'], lat: 12.24, lon: 109.19 },
  'da-lat': { name: 'Đà Lạt', alias: ['Lâm Đồng', 'Bảo Lộc'], lat: 11.94, lon: 108.44 },
  vinh: { name: 'Vinh', alias: ['Nghệ An'], lat: 18.68, lon: 105.68 },
  'quy-nhon': { name: 'Quy Nhơn', alias: ['Bình Định'], lat: 13.78, lon: 109.22 },
  'buon-ma-thuot': { name: 'Buôn Ma Thuột', alias: ['Đắk Lắk', 'Đăk Lăk', 'Dak Lak', 'Buôn Mê Thuột'], lat: 12.67, lon: 108.04 },
  'vung-tau': { name: 'Vũng Tàu', alias: ['Bà Rịa - Vũng Tàu', 'Bà Rịa', 'Bà Rịa Vũng Tàu'], lat: 10.35, lon: 107.08 },
  'thai-nguyen': { name: 'Thái Nguyên', lat: 21.59, lon: 105.84 },
  'nam-dinh': { name: 'Nam Định', lat: 20.42, lon: 106.17 },
  'bien-hoa': { name: 'Biên Hòa', alias: ['Đồng Nai'], lat: 10.95, lon: 106.82 },
  'long-xuyen': { name: 'Long Xuyên', alias: ['An Giang'], lat: 10.37, lon: 105.43 },
  'ca-mau': { name: 'Cà Mau', lat: 9.18, lon: 105.15 },
  'my-tho': { name: 'Mỹ Tho', alias: ['Tiền Giang'], lat: 10.36, lon: 106.36 },
  'thanh-hoa': { name: 'Thanh Hóa', lat: 19.81, lon: 105.78 },
  'ha-long': { name: 'Hạ Long', alias: ['Quảng Ninh', 'Cẩm Phả'], lat: 20.95, lon: 107.08 },
  pleiku: { name: 'Pleiku', alias: ['Gia Lai'], lat: 13.98, lon: 108.0 },
  'phan-thiet': { name: 'Phan Thiết', alias: ['Bình Thuận'], lat: 10.93, lon: 108.1 },
  'ha-giang': { name: 'Hà Giang', lat: 22.82, lon: 104.98 },
  'cao-bang': { name: 'Cao Bằng', lat: 22.67, lon: 106.26 },
  'bac-kan': { name: 'Bắc Kạn', lat: 22.15, lon: 105.83 },
  'tuyen-quang': { name: 'Tuyên Quang', lat: 21.82, lon: 105.21 },
  'lao-cai': { name: 'Lào Cai', lat: 22.48, lon: 103.97, alias: ['Sa Pa', 'Sapa'] },
  'dien-bien': { name: 'Điện Biên', lat: 21.39, lon: 103.02 },
  'lai-chau': { name: 'Lai Châu', lat: 22.4, lon: 103.46 },
  'son-la': { name: 'Sơn La', lat: 21.33, lon: 103.91 },
  'yen-bai': { name: 'Yên Bái', lat: 21.72, lon: 104.9 },
  'hoa-binh': { name: 'Hòa Bình', lat: 20.82, lon: 105.34 },
  'lang-son': { name: 'Lạng Sơn', lat: 21.85, lon: 106.76 },
  'bac-giang': { name: 'Bắc Giang', lat: 21.27, lon: 106.19 },
  'phu-tho': { name: 'Phú Thọ', lat: 21.32, lon: 105.4, alias: ['Việt Trì'] },
  'vinh-phuc': { name: 'Vĩnh Phúc', lat: 21.31, lon: 105.6, alias: ['Vĩnh Yên'] },
  'bac-ninh': { name: 'Bắc Ninh', lat: 21.19, lon: 106.07 },
  'hai-duong': { name: 'Hải Dương', lat: 20.94, lon: 106.33 },
  'hung-yen': { name: 'Hưng Yên', lat: 20.65, lon: 106.05 },
  'thai-binh': { name: 'Thái Bình', lat: 20.45, lon: 106.34 },
  'ha-nam': { name: 'Hà Nam', lat: 20.54, lon: 105.91, alias: ['Phủ Lý'] },
  'ninh-binh': { name: 'Ninh Bình', lat: 20.25, lon: 105.97 },
  'ha-tinh': { name: 'Hà Tĩnh', lat: 18.34, lon: 105.91 },
  'quang-binh': { name: 'Quảng Bình', lat: 17.47, lon: 106.62, alias: ['Đồng Hới'] },
  'quang-tri': { name: 'Quảng Trị', lat: 16.82, lon: 107.1, alias: ['Đông Hà'] },
  'tam-ky': { name: 'Tam Kỳ', lat: 15.57, lon: 108.47, alias: ['Quảng Nam'] },
  'hoi-an': { name: 'Hội An', lat: 15.88, lon: 108.34 },
  'quang-ngai': { name: 'Quảng Ngãi', lat: 15.12, lon: 108.8 },
  'tuy-hoa': { name: 'Tuy Hòa', lat: 13.09, lon: 109.31, alias: ['Phú Yên'] },
  'phan-rang': { name: 'Phan Rang', lat: 11.57, lon: 108.99, alias: ['Ninh Thuận', 'Tháp Chàm'] },
  'kon-tum': { name: 'Kon Tum', lat: 14.35, lon: 108.0 },
  'gia-nghia': { name: 'Gia Nghĩa', lat: 12.0, lon: 107.69, alias: ['Đắk Nông', 'Đăk Nông'] },
  'dong-xoai': { name: 'Đồng Xoài', lat: 11.53, lon: 106.89, alias: ['Bình Phước'] },
  'tay-ninh': { name: 'Tây Ninh', lat: 11.31, lon: 106.1 },
  'thu-dau-mot': { name: 'Thủ Dầu Một', lat: 10.99, lon: 106.65, alias: ['Bình Dương'] },
  'tan-an': { name: 'Tân An', lat: 10.54, lon: 106.41, alias: ['Long An'] },
  'ben-tre': { name: 'Bến Tre', lat: 10.24, lon: 106.38 },
  'tra-vinh': { name: 'Trà Vinh', lat: 9.93, lon: 106.34 },
  'vinh-long': { name: 'Vĩnh Long', lat: 10.25, lon: 105.97 },
  'cao-lanh': { name: 'Cao Lãnh', lat: 10.46, lon: 105.63, alias: ['Đồng Tháp', 'Sa Đéc'] },
  'chau-doc': { name: 'Châu Đốc', lat: 10.7, lon: 105.12 },
  'rach-gia': { name: 'Rạch Giá', lat: 10.01, lon: 105.08, alias: ['Kiên Giang'] },
  'phu-quoc': { name: 'Phú Quốc', lat: 10.22, lon: 103.96 },
  'vi-thanh': { name: 'Vị Thanh', lat: 9.78, lon: 105.47, alias: ['Hậu Giang'] },
  'soc-trang': { name: 'Sóc Trăng', lat: 9.6, lon: 105.97 },
  'bac-lieu': { name: 'Bạc Liêu', lat: 9.29, lon: 105.72 },
};

const ASPECTS = [['Hợp', 0, 8], ['Đối', 180, 8], ['Tam hợp', 120, 6], ['Vuông', 90, 6], ['Lục hợp', 60, 4]];

/**
 * Chiêm tinh tropical: Mặt Trời → Diêm Vương, nhà cung nguyên (whole sign), góc chiếu chính.
 * hour = null: dùng 12:00 UT+7 - Mặt Trăng/ cung mọc/ nhà không đáng tin, được đánh dấu.
 */
export function natalAstro({ y, m, d, hour, minute }, placeKey) {
  const known = hour !== null && hour !== undefined;
  const h = known ? hour + (minute || 0) / 60 : 12;
  const jd = julianDay(y, m, d, h - VN_UTC_OFFSET);
  const sun = signOf(sunLongitude(jd));
  const moon = signOf(moonLongitude(jd));
  const moonUncertain = !known && moon.edge < 6.5; // Mặt Trăng đi ~13°/ngày
  const sunUncertain = !known && sun.edge < 0.6;
  const place = PLACES[placeKey];
  const asc = known && place ? signOf(ascendant(jd, place.lat, place.lon)) : null;

  const planets = PLANETS.map(([key, vi]) => {
    const lon = planetLongitude(key, jd);
    const sg = signOf(lon);
    const fast = key === 'Moon';
    return {
      key, name: vi, lon, sign: sg.name, element: sg.element, degree: sg.degree,
      retrograde: isRetrograde(key, jd),
      house: asc ? ((sg.index - asc.index + 12) % 12) + 1 : null,
      uncertain: (!known && fast && moonUncertain) || (!known && key === 'Mercury' && sg.edge < 1.5) || (!known && key === 'Venus' && sg.edge < 1),
      edge: sg.edge,
    };
  });
  const aspects = [];
  for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) {
    const diff = Math.abs(planets[i].lon - planets[j].lon); const ang = diff > 180 ? 360 - diff : diff;
    for (const [nm, deg, orb] of ASPECTS) {
      const off = Math.abs(ang - deg);
      if (off <= orb) { aspects.push({ a: planets[i].name, b: planets[j].name, type: nm, orb: +off.toFixed(1) }); break; }
    }
  }
  aspects.sort((x, y2) => x.orb - y2.orb);
  // Tập trung hành tinh theo cung (stellium)
  const bySign = {}; for (const p of planets) (bySign[p.sign] ||= []).push(p.name);
  const stellium = Object.entries(bySign).filter(([, v]) => v.length >= 3).map(([k, v]) => ({ sign: k, planets: v }));
  const elementCount = { Lửa: 0, Đất: 0, Khí: 0, Nước: 0 }; for (const p of planets.slice(0, 7)) elementCount[p.element]++;
  return { sun, moon, moonUncertain, sunUncertain, asc, place: place?.name ?? null, planets, aspects, stellium, elementCount, jd };
}
