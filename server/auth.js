// Tài khoản tối giản: chỉ cần email, xác thực bằng mã 6 số gửi qua email (không mật khẩu).
import crypto from 'node:crypto';

const DAY = 86_400_000;
export const SESSION_DAYS = 30, CODE_TTL_MS = 10 * 60_000, CODE_MAX_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[^\s@<>"']{2,}$/;

export const normEmail = (e) => String(e ?? '').trim().toLowerCase().slice(0, 254);
export const validEmail = (e) => EMAIL_RE.test(e) && e.length <= 254;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}
export function cookie(name, value, { maxAgeSec, secure } = {}) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}${maxAgeSec != null ? `; Max-Age=${maxAgeSec}` : ''}`;
}

/** Gửi email: Resend (RESEND_API_KEY) nếu có; không thì in ra console khi chạy thử (không bao giờ trả mã về trình duyệt). */
export async function sendMail({ to, subject, text }, env = process.env, fetchImpl = fetch) {
  if (env.RESEND_API_KEY) {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM || 'Huyền My <onboarding@resend.dev>', to: [to], subject, text }),
    });
    if (!r.ok) throw new Error(`mail ${r.status}`);
    return { sent: true };
  }
  // MAIL_TO_LOG=1: chỉ để thử riêng khi chưa có Resend; mã đăng nhập sẽ nằm trong nhật ký máy chủ (ai đọc được nhật ký đều thấy). Đừng bật khi đã mở công khai.
  if (env.NODE_ENV === 'production' && env.MAIL_TO_LOG !== '1') throw new Error('Chưa cấu hình gửi email (RESEND_API_KEY)');
  console.log(`\n[email thử nghiệm] gửi tới ${to}\n${subject}\n${text}\n`);
  return { sent: false, dev: true };
}

export function createAuth({ db, pepper, adminEmails = [], mailer = sendMail, now = () => Date.now() }) {
  const admins = new Set(adminEmails.map(normEmail).filter(Boolean));
  const lastSend = new Map(), perHour = new Map(), perIp = new Map();
  const within = (map, key, ms, max, t) => { const a = (map.get(key) ?? []).filter((x) => t - x < ms); map.set(key, a); return a.length >= max; };
  const note = (map, key, t) => map.set(key, [...(map.get(key) ?? []), t]);
  const hashCode = (email, code) => sha(`${pepper}|${email}|${code}`);

  async function requestCode(emailRaw, ip = '?') {
    const email = normEmail(emailRaw), t = now();
    if (!validEmail(email)) return { ok: false, status: 400, error: 'Email chưa đúng định dạng, bạn kiểm tra lại giúp My nhé.' };
    if (t - (lastSend.get(email) ?? 0) < 45_000) return { ok: false, status: 429, error: 'Mã vừa được gửi, bạn đợi chừng một phút rồi thử lại nhé.' };
    if (within(perHour, email, 3_600_000, 5, t) || within(perIp, ip, 3_600_000, 20, t)) return { ok: false, status: 429, error: 'Bạn đã yêu cầu mã nhiều lần. Hãy thử lại sau ít phút.' };
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    db.prepare('INSERT INTO codes(email, hash, expires, attempts, sent_at) VALUES (?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET hash=excluded.hash, expires=excluded.expires, attempts=0, sent_at=excluded.sent_at')
      .run(email, hashCode(email, code), t + CODE_TTL_MS, 0, t);
    try { await mailer({ to: email, subject: 'Mã đăng nhập Huyền My của bạn', text: `Mã của bạn là ${code}. Mã có hiệu lực 10 phút. Nếu bạn không yêu cầu, cứ bỏ qua email này.` }); }
    catch (e) { console.error('[mail]', e.message); return { ok: false, status: 503, error: 'My chưa gửi được email lúc này, bạn thử lại sau nhé.' }; }
    lastSend.set(email, t); note(perHour, email, t); note(perIp, ip, t);
    return { ok: true };
  }

  function verify(emailRaw, codeRaw, { ref = null, consentMemory = false } = {}) {
    const email = normEmail(emailRaw), code = String(codeRaw ?? '').replace(/\D/g, ''), t = now();
    const row = db.prepare('SELECT * FROM codes WHERE email = ?').get(email);
    if (!row || row.expires < t) return { ok: false, status: 400, error: 'Mã đã hết hạn, bạn yêu cầu mã mới nhé.' };
    if (row.attempts >= CODE_MAX_ATTEMPTS) return { ok: false, status: 429, error: 'Nhập sai quá nhiều lần, bạn yêu cầu mã mới nhé.' };
    if (!/^\d{6}$/.test(code) || !eq(hashCode(email, code), row.hash)) {
      db.prepare('UPDATE codes SET attempts = attempts + 1 WHERE email = ?').run(email);
      return { ok: false, status: 401, error: 'Mã chưa đúng, bạn kiểm tra lại giúp My nhé.' };
    }
    db.prepare('DELETE FROM codes WHERE email = ?').run(email);
    const role = admins.has(email) ? 'admin' : 'user';
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email), isNew = false;
    if (!user) {
      isNew = true;
      db.prepare('INSERT INTO users(email, created_at, last_login, role, consent_memory, consent_at, ref) VALUES (?,?,?,?,?,?,?)')
        .run(email, t, t, role, consentMemory ? 1 : 0, consentMemory ? t : null, ref);
    } else {
      db.prepare('UPDATE users SET last_login = ?, role = ? WHERE id = ?').run(t, role, user.id);
      if (consentMemory && !user.consent_memory) db.prepare('UPDATE users SET consent_memory = 1, consent_at = ? WHERE id = ?').run(t, user.id);
    }
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const token = crypto.randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions(token_hash, user_id, created, expires) VALUES (?,?,?,?)').run(sha(token), user.id, t, t + SESSION_DAYS * DAY);
    return { ok: true, token, user: publicUser(user), isNew, maxAgeSec: SESSION_DAYS * 86400 };
  }

  const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role, consentMemory: !!u.consent_memory });
  function fromToken(token) {
    if (!token) return null;
    const row = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ?').get(sha(token), now());
    return row ? publicUser(row) : null;
  }
  const logout = (token) => { if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token)); };
  function deleteAccount(userId) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    db.prepare('UPDATE events SET user_id = NULL WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
  return { requestCode, verify, fromToken, logout, deleteAccount, publicUser };
}
