// Lịch âm Việt Nam tính trực tiếp từ thiên văn (trăng non + Đông chí/trung khí),
// múi giờ UTC+8 trước 1968 và UTC+7 từ 1968 - đúng thông lệ lịch âm Việt Nam.
import * as Astronomy from 'astronomy-engine';
import { julianDayNumber } from './astro.js';

const tzOf = (y) => (y < 1968 ? 8 : 7);
const DAY_MS = 86400000;
/** Số ngày địa phương (JDN) chứa một thời điểm UTC. */
const localDay = (date, tz) => Math.floor((date.getTime() + tz * 3600000) / DAY_MS) + 2440588; // 1970-01-01 = JDN 2440588
const dayStartUTC = (jdn, tz) => new Date((jdn - 2440588) * DAY_MS - tz * 3600000);

function newMoonDays(fromY, toY, tz) {
  const out = [];
  let t = Astronomy.SearchMoonPhase(0, new Date(Date.UTC(fromY, 9, 1)), 40);
  while (t && t.date.getUTCFullYear() <= toY) {
    out.push(localDay(t.date, tz));
    t = Astronomy.SearchMoonPhase(0, new Date(t.date.getTime() + 20 * DAY_MS), 40);
  }
  return out;
}
/** Ngày địa phương Mặt Trời đạt kinh độ `lon` trong cửa sổ 40 ngày từ `from`; null nếu không rơi vào cửa sổ. */
const termDay = (lon, from, tz) => {
  const r = Astronomy.SearchSunLongitude(lon, from, 40);
  return r ? localDay(r.date, tz) : null;
};

/**
 * Đổi dương lịch → âm lịch.
 * Trả về { day, month, year, leap, monthStartJdn }.
 */
export function solarToLunar(y, m, d, { tz: tzOpt } = {}) { // tz: ép múi giờ (ví dụ 8 để xem lịch Trung Quốc); mặc định theo lịch Việt Nam
  const tz = tzOpt ?? tzOf(y);
  const D = julianDayNumber(y, m, d);
  const S = newMoonDays(y - 2, y + 1, tz); // đầu các tháng âm
  const idx = (day) => { let i = 0; while (i + 1 < S.length && S[i + 1] <= day) i++; return i; };
  const solstice = (yr) => termDay(270, new Date(Date.UTC(yr, 11, 1)), tz);

  let ya = y - 1; // năm có Đông chí mở đầu chu kỳ
  if (D >= S[idx(solstice(y))]) ya = y;
  const A = idx(solstice(ya)), B = idx(solstice(ya + 1));
  const n = B - A; // 12 hoặc 13 tháng

  // Tháng nào chứa trung khí?
  const hasTerm = (i) => {
    for (let k = 0; k < 12; k++) {
      const lon = k * 30;
      const td = termDay(lon, new Date(dayStartUTC(S[i], tz).getTime() - 2 * DAY_MS), tz);
      if (td !== null && td >= S[i] && td < S[i + 1]) return true;
    }
    return false;
  };
  let leapAt = -1;
  if (n === 13) { for (let i = A + 1; i < B; i++) if (!hasTerm(i)) { leapAt = i; break; } if (leapAt < 0) leapAt = B - 1; }

  const j = idx(D);
  let num = 11, leap = false;
  for (let i = A; i <= j; i++) {
    if (i === A) { num = 11; continue; }
    if (i === leapAt) { leap = true; continue; }
    leap = false; num = num === 12 ? 1 : num + 1;
  }
  const year = num >= 11 ? ya : ya + 1;
  return { day: D - S[j] + 1, month: num, year, leap, monthStartJdn: S[j] };
}

const fromJdn = (j) => { const t = new Date((j - 2440588) * DAY_MS); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };

/**
 * Các tháng âm lịch của năm âm `year` (từ mùng 1 tháng Giêng đến hết tháng Chạp, gồm cả tháng nhuận nếu có).
 * Mỗi mục: { month, leap, startJdn, start: {y,m,d}, end: {y,m,d} }. Dò theo ngày đầu tháng nên chỉ cần khoảng 30 lần đổi lịch.
 */
const MONTHS_CACHE = new Map();
export function lunarMonthsOfYear(year) {
  if (!MONTHS_CACHE.has(year)) MONTHS_CACHE.set(year, computeMonthsOfYear(year));
  return MONTHS_CACHE.get(year);
}
function computeMonthsOfYear(year) {
  // Mùng 1 Tết rơi trong khoảng 21/1-21/2, nên 1/3 luôn nằm trong tháng Giêng hoặc các tháng sau đó: lùi từng tháng về tháng Giêng.
  let cur = solarToLunar(year, 3, 1), s = cur.monthStartJdn;
  for (let g = 0; g < 4 && !(cur.month === 1 && !cur.leap); g++) { const b = fromJdn(s - 1); cur = solarToLunar(b.y, b.m, b.d); s = cur.monthStartJdn; }
  const out = [];
  for (let guard = 0; guard < 14; guard++) {
    const probe = fromJdn(s + 29), r = solarToLunar(probe.y, probe.m, probe.d);
    const next = r.monthStartJdn === s ? s + 30 : s + 29;
    out.push({ month: cur.month, leap: cur.leap, startJdn: s, start: fromJdn(s), end: fromJdn(next - 1) });
    s = next; const f = fromJdn(s); cur = solarToLunar(f.y, f.m, f.d);
    if (cur.year !== year || (cur.month === 1 && !cur.leap)) break;
  }
  return out;
}
