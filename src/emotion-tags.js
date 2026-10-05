// Lời My nói có thể chứa thẻ cảm xúc dạng [[ten_cam_xuc]] ở đầu mỗi đoạn. Thẻ không hiển thị cho người dùng.
const TAG_RE = /\[\[([a-z_]+)\]\]/g;
const SUGGEST_RE = /\[\[goi_y:([^\]]*)\]\]/g; // gợi ý trả lời: [[goi_y: a | b | c]], thành nút bấm chứ không hiện trong lời My

/** Thay gạch dài bằng dấu gạch nối thường cho giống người viết (khoảng số thì nối liền: 6-15). */
export function normalizeDashes(s) {
  return s.replace(/(\d)\s*[—–]\s*(\d)/g, '$1-$2').replace(/\s*[—–]\s*/g, ' - ').replace(/ {2,}/g, ' ');
}

/** Tách thẻ cảm xúc khỏi văn bản. events[].pos là vị trí (trong text sạch) mà cảm xúc bắt đầu có hiệu lực. */
export function parseTagged(raw) {
  const src = normalizeDashes(raw).replace(SUGGEST_RE, '');
  let text = '', last = 0; const events = [];
  for (const m of src.matchAll(TAG_RE)) { text += src.slice(last, m.index); events.push({ pos: text.length, emo: m[1] }); last = m.index + m[0].length; }
  text += src.slice(last);
  const open = text.lastIndexOf('[[');                       // thẻ đang gõ dở ở cuối luồng
  if (open >= 0 && !text.slice(open).includes(']]') && (text.length - open <= 24 || /^\[\[goi_y/.test(text.slice(open)))) {
    const tail = text.slice(open); text = text.slice(0, open);
    if (tail.length > 2 && ('[[goi_y'.startsWith(tail) || tail.startsWith('[[goi_y'))) text = text.trimEnd(); // gợi ý gõ dở: bỏ luôn dòng trống phía trước
  }
  if (/\[\[goi_y:[^\]]*\]\]/.test(normalizeDashes(raw))) text = text.trimEnd(); // gợi ý đã đủ: bỏ dòng trống còn lại
  return { text, events };
}
export const stripTags = (raw) => parseTagged(raw).text;
/** Gợi ý trả lời do My đưa ra (tối đa 3, mỗi gợi ý tối đa 48 ký tự); rỗng nếu không có. */
export function extractSuggestions(raw) {
  const m = [...String(raw).matchAll(SUGGEST_RE)].pop(); if (!m) return [];
  const seen = new Set();
  return m[1].split('|').map((x) => normalizeDashes(x).trim()).filter((x) => x.length >= 3 && x.length <= 48 && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase())).slice(0, 3);
}
