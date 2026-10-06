// Thời gian trò chuyện mỗi ngày và thưởng giới thiệu bạn bè.
// Quy tắc: tài khoản có BASE phút mỗi ngày. Mỗi người bạn được giới thiệu qua liên kết của mình, đã đăng ký bằng email xác thực
// và đã trò chuyện với My trên QUALIFY phút, cộng thêm PER phút mỗi ngày cho người giới thiệu, cộng dồn, tối đa MAX người.
// Chỉ lưu con số (phút, ngày), không lưu nội dung trò chuyện.
const DAY = 86_400_000, GAP_MAX = 5 * 60_000;
export const vnDayKey = (t) => new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);

export function createRewards({ db, env = process.env, now = () => Date.now() }) {
  const cfg = {
    baseMin: Number.isFinite(+env.HUYENMY_DAILY_MINUTES) && env.HUYENMY_DAILY_MINUTES !== undefined && env.HUYENMY_DAILY_MINUTES !== '' ? +env.HUYENMY_DAILY_MINUTES : 30,
    perMin: +env.HUYENMY_REF_BONUS_MINUTES || 30,
    maxRefs: +env.HUYENMY_REF_MAX || 10,
    qualifyMin: +env.HUYENMY_REF_QUALIFY_MINUTES || 10,
  };
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_day (user_id INTEGER NOT NULL, day TEXT NOT NULL, ms INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day));
    CREATE TABLE IF NOT EXISTS referrals (referee_id INTEGER PRIMARY KEY, code TEXT NOT NULL, referrer_id INTEGER, created_at INTEGER NOT NULL, qualified_at INTEGER);
    CREATE INDEX IF NOT EXISTS rf_referrer ON referrals(referrer_id);
  `);
  const ucols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  for (const [n, d] of [['chat_ms', 'INTEGER NOT NULL DEFAULT 0'], ['last_chat', 'INTEGER']]) if (!ucols.includes(n)) db.exec(`ALTER TABLE users ADD COLUMN ${n} ${d}`);

  /** Cộng thời gian trò chuyện thực (khoảng cách giữa hai lượt tối đa 5 phút) cho người đã đăng nhập. */
  function addActive(userId, t = now()) {
    const u = db.prepare('SELECT last_chat FROM users WHERE id = ?').get(userId); if (!u) return;
    const delta = u.last_chat ? Math.min(Math.max(t - u.last_chat, 0), GAP_MAX) : 0;
    db.prepare('UPDATE users SET chat_ms = chat_ms + ?, last_chat = ? WHERE id = ?').run(delta, t, userId);
    if (delta) db.prepare('INSERT INTO usage_day(user_id, day, ms) VALUES (?,?,?) ON CONFLICT(user_id, day) DO UPDATE SET ms = ms + excluded.ms').run(userId, vnDayKey(t), delta);
  }
  const usedMs = (userId, t = now()) => db.prepare('SELECT ms FROM usage_day WHERE user_id = ? AND day = ?').get(userId, vnDayKey(t))?.ms ?? 0;
  const totalChatMs = (userId) => {
    const u = db.prepare('SELECT chat_ms FROM users WHERE id = ?').get(userId)?.chat_ms ?? 0;
    const a = db.prepare('SELECT COALESCE(SUM(a.active_ms),0) s FROM anon a JOIN anon_links l ON l.anon_id = a.id WHERE l.user_id = ?').get(userId)?.s ?? 0;
    return u + a;
  };
  const linkedAnons = (userId) => db.prepare('SELECT anon_id FROM anon_links WHERE user_id = ?').all(userId).map((r) => r.anon_id);

  /** Ghi nhận người mới đăng ký đến từ liên kết của ai. Bỏ qua mã sai, tự giới thiệu chính mình hoặc cùng một trình duyệt. */
  function recordReferral(refereeId, code, t = now()) {
    code = String(code ?? '').replace(/[^a-f0-9]/g, '').slice(0, 8);
    if (code.length < 8 || db.prepare('SELECT 1 FROM referrals WHERE referee_id = ?').get(refereeId)) return false;
    db.prepare('INSERT INTO referrals(referee_id, code, created_at) VALUES (?,?,?)').run(refereeId, code, t);
    return true;
  }
  function resolveReferrer(row) {
    if (row.referrer_id) return row.referrer_id;
    const hit = db.prepare("SELECT user_id FROM anon_links WHERE anon_id LIKE ? || '%' LIMIT 1").get(row.code);
    if (!hit || hit.user_id === row.referee_id) return null;
    const mine = new Set(linkedAnons(row.referee_id)); // cùng một trình duyệt tạo hai tài khoản thì không tính
    if (linkedAnons(hit.user_id).some((a) => mine.has(a))) return null;
    db.prepare('UPDATE referrals SET referrer_id = ? WHERE referee_id = ?').run(hit.user_id, row.referee_id);
    return hit.user_id;
  }
  /** Gọi sau mỗi lượt trò chuyện của người được giới thiệu: đủ phút thì tính là một lượt giới thiệu thành công. */
  function settle(refereeId, t = now()) {
    const row = db.prepare('SELECT * FROM referrals WHERE referee_id = ?').get(refereeId);
    if (!row || row.qualified_at) return false;
    if (!resolveReferrer(row)) return false;
    if (totalChatMs(refereeId) < cfg.qualifyMin * 60_000) return false;
    db.prepare('UPDATE referrals SET qualified_at = ? WHERE referee_id = ?').run(t, refereeId);
    return true;
  }
  function referralsOf(userId) {
    const rows = db.prepare('SELECT * FROM referrals WHERE referrer_id IS NULL OR referrer_id = ? ORDER BY created_at').all(userId);
    const mine = [];
    for (const r of rows) { if (r.referrer_id === userId || (!r.referrer_id && resolveReferrer(r) === userId)) mine.push(r); }
    return mine.map((r, i) => ({ n: i + 1, at: r.created_at, qualified: !!r.qualified_at, chatMin: Math.min(cfg.qualifyMin, Math.floor(totalChatMs(r.referee_id) / 60_000)) }));
  }
  function allowance(userId, role = 'user', t = now()) {
    const refs = referralsOf(userId), ok = refs.filter((r) => r.qualified).length, counted = Math.min(ok, cfg.maxRefs);
    const unlimited = role === 'admin' || cfg.baseMin === 0;
    const bonusMin = counted * cfg.perMin, totalMin = cfg.baseMin + bonusMin, usedMin = Math.floor(usedMs(userId, t) / 60_000);
    return { unlimited, baseMin: cfg.baseMin, bonusMin, totalMin, usedMin, leftMin: unlimited ? null : Math.max(0, totalMin - Math.ceil(usedMs(userId, t) / 60_000)), invited: refs.length, qualified: ok, maxRefs: cfg.maxRefs, perMin: cfg.perMin, qualifyMin: cfg.qualifyMin, refs };
  }
  const exhausted = (userId, role, t = now()) => { const a = allowance(userId, role, t); return !a.unlimited && usedMs(userId, t) >= a.totalMin * 60_000 ? a : null; };
  const forget = (userId) => { db.prepare('DELETE FROM usage_day WHERE user_id = ?').run(userId); db.prepare('DELETE FROM referrals WHERE referrer_id = ?').run(userId); }; // người được giới thiệu xóa tài khoản: lượt đã đạt vẫn giữ cho người giới thiệu (chỉ còn mã số, không còn danh tính)
  return { cfg, addActive, usedMs, recordReferral, settle, allowance, exhausted, referralsOf, forget, totalChatMs };
}
