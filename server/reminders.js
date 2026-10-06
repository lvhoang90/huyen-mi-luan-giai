// Email nhắc quay lại: chỉ gửi cho người đã TỰ CHỌN nhận khi đăng ký (ô đồng ý riêng, mặc định không chọn).
// Quy tắc: không gửi trước khi người dùng vắng 24 giờ, tối đa một thư mỗi 7 ngày, dừng sau 3 thư nếu người dùng chưa quay lại,
// luôn có liên kết hủy một chạm. Nội dung nhẹ nhàng, không thúc ép. Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.
import crypto from 'node:crypto';

const HOUR = 3_600_000, DAY = 24 * HOUR;
export const AWAY_MS = 24 * HOUR, GAP_MS = 7 * DAY, MAX_UNANSWERED = 3;

/** Người dùng đã đồng ý nhận nhắc và đến hạn được nhắc ở thời điểm `now`. */
export function dueReminders(db, now) {
  const rows = db.prepare(`SELECT u.id, u.email, u.remind_token, u.remind_last, u.remind_count, u.last_login,
      (SELECT MAX(ts) FROM turns WHERE actor = 'u' || u.id) AS last_turn
    FROM users u WHERE u.remind_optin = 1`).all();
  const out = [];
  for (const r of rows) {
    const lastActive = Math.max(r.last_login ?? 0, r.last_turn ?? 0);
    let count = r.remind_count ?? 0;
    if (r.remind_last && lastActive > r.remind_last) count = 0;          // đã quay lại sau thư trước: tính lại từ đầu
    if (count >= MAX_UNANSWERED) continue;                              // không quay lại sau ba thư: dừng hẳn
    if (now - lastActive < AWAY_MS) continue;                           // mới dùng gần đây
    if (r.remind_last && now - r.remind_last < GAP_MS) continue;        // tối đa một thư mỗi tuần
    out.push({ ...r, count });
  }
  return out;
}

export function buildReminder(baseUrl, token, zaloUrl = '') {
  const unsub = `${baseUrl}/api/unsub?t=${token}`;
  return {
    subject: 'My vẫn ở đây, khi nào bạn rảnh ta kể tiếp nhé',
    text: `Chào bạn,

Đây là lời nhắc nhẹ từ Huyền My. Lần trước ta chưa đi hết câu chuyện, và My vẫn sẵn sàng khi nào bạn muốn nói tiếp. Không có gì gấp cả.

Quay lại gặp My: ${baseUrl}
${zaloUrl ? `\nNếu bạn thích, nhóm Zalo của My ở đây (không bắt buộc): ${zaloUrl}\n` : ''}
Bạn nhận thư này vì đã chọn nhận lời nhắc khi đăng ký. My gửi tối đa một thư mỗi tuần và sẽ dừng hẳn nếu bạn chưa quay lại sau ba thư. Muốn thôi nhận ngay bây giờ: ${unsub}

Huyền My Luận Giải · © 2026 Lương Việt Hoàng`,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

/** Gửi các thư đến hạn. `mail` là hàm gửi thư (có thể giả lập khi kiểm thử). Trả về số thư đã gửi. */
export async function runReminders({ db, mail, now = Date.now(), baseUrl, zaloUrl = '', log = () => {} }) {
  let sent = 0;
  for (const u of dueReminders(db, now)) {
    try {
      const m = buildReminder(baseUrl, u.remind_token, zaloUrl);
      await mail({ to: u.email, ...m });
      db.prepare('UPDATE users SET remind_last = ?, remind_count = ? WHERE id = ?').run(now, u.count + 1, u.id);
      db.prepare('INSERT INTO events(ts, actor, user_id, sid, name, props) VALUES (?,?,?,?,?,?)').run(now, `u${u.id}`, u.id, null, 'reminder_sent', JSON.stringify({ n: u.count + 1 }));
      sent++;
    } catch (e) { log(`[reminder] ${e.message}`); }
  }
  return sent;
}

export const newToken = () => crypto.randomBytes(24).toString('base64url');
