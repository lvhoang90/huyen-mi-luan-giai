// Lời My nói có thể chứa thẻ cảm xúc dạng [[ten_cam_xuc]] ở đầu mỗi đoạn. Thẻ không hiển thị cho người dùng.
const TAG_RE = /\[\[([a-z_]+)\]\]/g;

/** Thay gạch dài bằng dấu gạch nối thường cho giống người viết (khoảng số thì nối liền: 6-15). */
export function normalizeDashes(s) {
  return s.replace(/(\d)\s*[—–]\s*(\d)/g, '$1-$2').replace(/\s*[—–]\s*/g, ' - ').replace(/ {2,}/g, ' ');
}

/** Tách thẻ cảm xúc khỏi văn bản. events[].pos là vị trí (trong text sạch) mà cảm xúc bắt đầu có hiệu lực. */
export function parseTagged(raw) {
  const src = normalizeDashes(raw);
  let text = '', last = 0; const events = [];
  for (const m of src.matchAll(TAG_RE)) { text += src.slice(last, m.index); events.push({ pos: text.length, emo: m[1] }); last = m.index + m[0].length; }
  text += src.slice(last);
  const open = text.lastIndexOf('[[');                       // thẻ đang gõ dở ở cuối luồng
  if (open >= 0 && !text.slice(open).includes(']]') && text.length - open <= 24) text = text.slice(0, open);
  return { text, events };
}
export const stripTags = (raw) => parseTagged(raw).text;
