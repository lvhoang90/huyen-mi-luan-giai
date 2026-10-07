// Quà tặng phút từ quản trị: tặng thủ công hoặc theo bảng xếp hạng tester, hiện màn hình chúc mừng khi người nhận vào hệ thống.
// Mỗi quà là "+N phút mỗi ngày trong D ngày" (D = 0: không hết hạn). Cộng thêm vào hạn mức mỗi ngày của người nhận.
// Chỉ lưu con số và lời chúc do quản trị viết; không có nội dung trò chuyện.
export const MAX_MIN = 600, MAX_DAYS = 365;
const DAY = 86_400_000;
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>`\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

export function createGifts({ db, now = () => Date.now() }) {
  db.exec(`CREATE TABLE IF NOT EXISTS grants (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, minutes INTEGER NOT NULL, days INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
    expires_at INTEGER, title TEXT, message TEXT, rank INTEGER, by_admin INTEGER, seen_at INTEGER, revoked_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS gr_user ON grants(user_id);`);

  /** Tổng phút quà đang còn hiệu lực của một người (đã tính hết hạn và thu hồi). */
  const activeMinutes = (userId, t = now()) => db.prepare('SELECT COALESCE(SUM(minutes), 0) m FROM grants WHERE user_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)').get(userId, t).m;

  function grant(userId, { minutes, days = 30, title = '', message = '', rank = null, byAdmin = null } = {}) {
    const m = Math.round(+minutes), d = Math.round(+days);
    if (!Number.isInteger(userId) || !db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'user'").get(userId)) throw new Error('Không thấy thành viên này.');
    if (!(m >= 1 && m <= MAX_MIN)) throw new Error(`Số phút mỗi ngày phải từ 1 đến ${MAX_MIN}.`);
    if (!(d >= 0 && d <= MAX_DAYS)) throw new Error(`Số ngày phải từ 0 (không hết hạn) đến ${MAX_DAYS}.`);
    const t = now(), r = rank == null ? null : Math.max(1, Math.min(99, Math.round(+rank) || 1));
    const info = db.prepare('INSERT INTO grants(user_id, minutes, days, created_at, expires_at, title, message, rank, by_admin) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(userId, m, d, t, d ? t + d * DAY : null, clean(title, 80) || null, clean(message, 400) || null, r, byAdmin);
    return Number(info.lastInsertRowid);
  }

  /** Quà chưa xem (kể cả đã hết hạn thì thôi không chúc nữa). Người nhận chỉ thấy số phút, thời hạn, lời chúc và hạng. */
  const unseenFor = (userId, t = now()) => db.prepare('SELECT id, minutes, days, title, message, rank, created_at createdAt FROM grants WHERE user_id = ? AND seen_at IS NULL AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at').all(userId, t);
  const markSeen = (userId, id, t = now()) => db.prepare('UPDATE grants SET seen_at = ? WHERE id = ? AND user_id = ? AND seen_at IS NULL').run(t, id, userId).changes > 0;
  const revoke = (id, t = now()) => db.prepare('UPDATE grants SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(t, id).changes > 0;
  const list = (limit = 200) => db.prepare('SELECT g.id, g.user_id userId, u.email, g.minutes, g.days, g.created_at createdAt, g.expires_at expiresAt, g.title, g.message, g.rank, g.seen_at seenAt, g.revoked_at revokedAt FROM grants g LEFT JOIN users u ON u.id = g.user_id ORDER BY g.created_at DESC LIMIT ?').all(limit);
  const userIdByEmail = (email) => db.prepare("SELECT id FROM users WHERE email = ? AND role = 'user'").get(String(email ?? '').trim().toLowerCase())?.id ?? null;
  return { activeMinutes, grant, unseenFor, markSeen, revoke, list, userIdByEmail };
}

// ---------- chọn top tester ----------
// Điểm 0-100 là tổng có trọng số của sáu tiêu chí. Mỗi tiêu chí lấy giá trị của từng người chia cho giá trị cao nhất trong nhóm, rồi lấy căn bậc hai
// để người nổi bật không "ăn hết" điểm (căn bậc hai nâng người ở giữa lên nhưng vẫn giữ thứ tự). Hạn mức tối đa của từng tiêu chí chặn việc cày số.
export const CRITERIA = [
  { key: 'days', label: 'Chuyên cần', hint: 'số ngày có trò chuyện', w: 25 },
  { key: 'minutes', label: 'Tham gia', hint: 'phút trò chuyện thực', w: 20 },
  { key: 'feedback', label: 'Góp ý', hint: 'góp ý chi tiết, dài và có ích (tối đa 5 góp ý)', w: 25 },
  { key: 'reports', label: 'Báo lỗi', hint: 'bấm báo cáo câu trả lời AI chưa ổn (tối đa 5)', w: 10 },
  { key: 'spread', label: 'Lan tỏa', hint: 'bạn mời đã trò chuyện đủ giờ và lượt chia sẻ (tối đa 10)', w: 15 },
  { key: 'explore', label: 'Khám phá', hint: 'số tính năng đã thử', w: 5 },
];
const FEATURES = ['tarot_draw', 'tarot_share', 'share_card', 'chart_tab', 'time_month', 'sample_pick', 'me_view', 'chart_ask', 'resonance'];

export function rankTesters(db, { n = 5, now = Date.now(), minMinutes = 3 } = {}) {
  const safe = (sql, ...a) => { try { return db.prepare(sql).all(...a); } catch { return []; } };
  const users = safe("SELECT id, email, created_at createdAt FROM users WHERE role = 'user'");
  const by = (rows, key = 'uid') => new Map(rows.map((r) => [r[key], r]));
  const usage = by(safe('SELECT user_id uid, COUNT(DISTINCT CASE WHEN ms > 0 THEN day END) days, COALESCE(SUM(ms), 0) / 60000.0 minutes FROM usage_day GROUP BY user_id'));
  const fbRows = safe("SELECT user_id uid, text FROM feedback WHERE user_id IS NOT NULL ORDER BY ts DESC");
  const fb = new Map();
  for (const r of fbRows) { const e = fb.get(r.uid) ?? { n: 0, q: 0 }; if (e.n < 5) { e.n++; e.q += Math.min(String(r.text).length, 300) / 300; } fb.set(r.uid, e); }
  const ev = (names) => by(safe(`SELECT CAST(substr(actor, 2) AS INTEGER) uid, COUNT(*) c FROM events WHERE actor LIKE 'u%' AND name IN (${names.map(() => '?').join(',')}) GROUP BY actor`, ...names), 'uid');
  const reports = ev(['ai_report']), shares = ev(['tarot_share', 'share_card']);
  const feat = by(safe(`SELECT CAST(substr(actor, 2) AS INTEGER) uid, COUNT(DISTINCT name) c FROM events WHERE actor LIKE 'u%' AND name IN (${FEATURES.map(() => '?').join(',')}) GROUP BY actor`, ...FEATURES), 'uid');
  const refs = by(safe('SELECT referrer_id uid, SUM(qualified_at IS NOT NULL) q FROM referrals WHERE referrer_id IS NOT NULL GROUP BY referrer_id'));
  const given = new Map(safe('SELECT user_id uid, COUNT(*) c FROM grants WHERE revoked_at IS NULL GROUP BY user_id').map((r) => [r.uid, r.c]));
  const raw = users.map((u) => {
    const us = usage.get(u.id), f = fb.get(u.id);
    return { id: u.id, email: u.email, days: us?.days ?? 0, minutes: Math.round((us?.minutes ?? 0) * 10) / 10, feedbackN: f?.n ?? 0,
      v: { days: us?.days ?? 0, minutes: us?.minutes ?? 0, feedback: f?.q ?? 0, reports: Math.min(5, reports.get(u.id)?.c ?? 0), spread: Math.min(10, (refs.get(u.id)?.q ?? 0) + (shares.get(u.id)?.c ?? 0)), explore: feat.get(u.id)?.c ?? 0 },
      reports: reports.get(u.id)?.c ?? 0, qualified: refs.get(u.id)?.q ?? 0, shares: shares.get(u.id)?.c ?? 0, features: feat.get(u.id)?.c ?? 0, gifted: given.get(u.id) ?? 0 };
  }).filter((r) => r.minutes >= minMinutes || r.feedbackN > 0);
  const max = Object.fromEntries(CRITERIA.map((c) => [c.key, Math.max(0, ...raw.map((r) => r.v[c.key]))]));
  const rows = raw.map((r) => {
    const parts = CRITERIA.map((c) => ({ key: c.key, label: c.label, w: c.w, pts: max[c.key] > 0 ? Math.round(c.w * Math.sqrt(r.v[c.key] / max[c.key]) * 10) / 10 : 0 }));
    return { ...r, parts, score: Math.round(parts.reduce((s, p) => s + p.pts, 0) * 10) / 10 };
  }).sort((a, b) => b.score - a.score || b.minutes - a.minutes || a.id - b.id);
  return { criteria: CRITERIA, eligible: rows.length, top: rows.slice(0, n).map((r, i) => ({ ...r, rank: i + 1, v: undefined })), at: now };
}
