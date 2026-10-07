// Quay lại sau khi buổi trước kết thúc bằng lời tạm biệt: tin ngắn đầu tiên ("ok") phải được hiểu là muốn bắt đầu lại.
export const FAREWELL = /ngủ ngon|hẹn (gặp|nghe|lại)|tạm biệt|dừng ở đây|nghỉ ngơi|chúc bạn|nghỉ cho/i;
export const SHORT_ACK = /^\s*(ok|oke|okay|ok nhé|ok nha|ừ|ừm|ờ|vâng|dạ|được|đồng ý|bắt đầu|tiếp đi|tiếp nhé|yes)\s*[.!]*\s*$/i;
/** Lời My nói gần nhất có phải lời tạm biệt hay chúc nghỉ không. */
export const endedWithFarewell = (msgs) => FAREWELL.test([...(msgs ?? [])].reverse().find((m) => m.role === 'assistant')?.content ?? '');
/**
 * Lịch sử gửi cho My. Tin ngắn đầu tiên sau lời chào quay lại được nói rõ ý, vì lịch sử có thể vẫn kết thúc bằng lời tạm biệt;
 * màn hình và bộ nhớ vẫn giữ đúng chữ người dùng gõ. greet: { at } là số tin nhắn lúc giao diện chào.
 */
export function clarifyResume(msgs, greet) {
  if (!greet || msgs.length !== greet.at + 1) return msgs;
  const last = msgs[msgs.length - 1];
  if (last?.role !== 'user' || !SHORT_ACK.test(last.content)) return msgs;
  return [...msgs.slice(0, -1), { ...last, content: `${last.content} (mình vừa quay lại và muốn nói chuyện tiếp, bắt đầu lại câu chuyện chứ không phải chào tạm biệt)` }];
}
