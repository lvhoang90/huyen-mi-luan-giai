// Nghi thức trước khi bốc bài: chuỗi ngày rút bài và đếm ngược tới lá bài của ngày mai (giờ Việt Nam, UTC+7).
const DAY = 86_400_000, VN = 7 * 3_600_000;
const num = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY;
export const prevDay = (day) => new Date((num(day) - 1) * DAY).toISOString().slice(0, 10);

/** Chuỗi ngày liên tiếp có rút lá của ngày. `prev`: { last, n } đã lưu; `today`: YYYY-MM-DD. Rút nhiều lần trong cùng ngày không cộng thêm. */
export function nextStreak(prev, today) {
  if (prev?.last === today) return { last: today, n: Math.max(1, +prev.n || 1) };
  if (prev?.last === prevDay(today)) return { last: today, n: Math.max(1, +prev.n || 1) + 1 };
  return { last: today, n: 1 };
}
/** Số ngày chuỗi đang còn hiệu lực hôm nay: đã rút hôm nay hoặc hôm qua thì còn, bỏ lỡ một ngày thì về 0. */
export function liveStreak(prev, today) {
  if (!prev?.last) return 0;
  return prev.last === today || prev.last === prevDay(today) ? Math.max(0, +prev.n || 0) : 0;
}
/** Số mili giây từ `now` tới 0 giờ ngày kế tiếp theo giờ Việt Nam. */
export const msUntilNextVnDay = (now = Date.now()) => DAY - ((now + VN) % DAY);
export function fmtCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000)), p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
