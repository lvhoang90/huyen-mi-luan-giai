// Nhắc khéo xem Tarot mỗi ngày cho người quay lại, không quá nhiều:
// mỗi ngày nhắc tối đa một lần; đã rút lá hôm nay thì không nhắc; mỗi lần bạn bấm "để sau" thì thưa dần (1, 1, 2, rồi 4 ngày một lần).
// Rút lá hoặc bấm vào nhắc thì trở lại nhịp mỗi ngày. Chỉ lưu ngày nhắc gần nhất và số lần bỏ qua trên máy này.
export const NUDGE_KEY = 'huyenmy.tarotnudge';
const GAPS = [1, 1, 2, 4];
const dayNum = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000;

/** `daily`: lá của ngày đã lưu ({ day, id }) hoặc null; `nudge`: { last, skips } hoặc null; `today`: ngày hôm nay theo giờ Việt Nam (YYYY-MM-DD). */
export function shouldNudge({ daily, nudge, today }) {
  if (daily?.day === today) return false;
  if (!nudge?.last) return true;
  if (nudge.last === today) return false;
  return dayNum(today) - dayNum(nudge.last) >= GAPS[Math.min(Math.max(+nudge.skips || 0, 0), GAPS.length - 1)];
}
export const nudgeShown = (nudge, today) => ({ last: today, skips: Math.max(+nudge?.skips || 0, 0) });
export const nudgeSkipped = (nudge, today) => ({ last: today, skips: Math.max(+nudge?.skips || 0, 0) + 1 });
export const nudgeAccepted = (today) => ({ last: today, skips: 0 });
