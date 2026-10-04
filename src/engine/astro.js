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
