// Đổi giờ người dùng nhập theo cách nói quen thuộc ("1 giờ 20 sáng", "8 giờ tối", "1 giờ trưa") sang giờ 24 để tính lá số.
// Nhiều người không nhớ giờ theo 24 giờ, mà nhớ theo buổi: nhập "1h20" rất dễ lẫn giữa 01:20 (khuya) và 13:20 (trưa).
export const PERIODS = [['h24', '24 giờ'], ['sang', 'Sáng'], ['trua', 'Trưa'], ['chieu', 'Chiều'], ['toi', 'Tối / đêm']];
const bad = (msg) => { const e = new Error(msg); e.userMessage = msg; throw e; };

/** hour: 0-23 (giờ 24) hoặc 1-12 kèm buổi. Trả về giờ 24 (0-23), hoặc ném lỗi có `userMessage` tiếng Việt. */
export function hourFrom(hour, period = 'h24') {
  const h = Math.trunc(+hour);
  if (!Number.isFinite(h) || h < 0 || h > 23) bad('Giờ sinh cần từ 0 đến 23 (hoặc từ 1 đến 12 kèm buổi).');
  if (period === 'h24' || h > 12) return h; // quá 12 giờ thì rõ ràng là giờ 24, bất kể buổi nào
  if (period === 'sang') return h === 12 ? 0 : h; // 12 giờ sáng cũng gọi là 12 giờ đêm: đầu ngày mới
  if (period === 'trua') { if (h >= 10 && h <= 12) return h; if (h >= 1 && h <= 3) return h + 12; bad('Buổi trưa thường từ 10 đến 3 giờ. Bạn kiểm tra lại giờ hoặc chọn buổi khác nhé.'); }
  if (period === 'chieu') { if (h === 12) return 12; if (h >= 1 && h <= 11) return h + 12; bad('Giờ chiều cần từ 1 đến 11. Bạn kiểm tra lại giúp nhé.'); }
  if (period === 'toi') { if (h === 12) return 0; if (h >= 5 && h <= 11) return h + 12; if (h >= 1 && h <= 4) return h; bad('Giờ tối hoặc đêm cần từ 1 đến 12. Bạn kiểm tra lại giúp nhé.'); }
  bad('Bạn chọn giúp My buổi sáng, trưa, chiều, tối hoặc nhập giờ 24.');
}
/** Nhãn dễ đọc: "01:20 (1 giờ 20 sáng)". */
export function describeHour(h24, minute, period) {
  const p2 = (v) => String(v).padStart(2, '0'), base = `${p2(h24)}:${p2(minute)}`;
  const name = PERIODS.find(([k]) => k === period)?.[1];
  return period && period !== 'h24' ? `${base} (${name.toLowerCase()})` : base;
}
