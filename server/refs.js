// Theo dõi mã giới thiệu (ref): mỗi mã là một liên kết ?ref=MÃ. Có hai loại:
// - mã của một thành viên (8 ký tự đầu của mã trình duyệt gắn với tài khoản của họ), dùng để mời bạn bè;
// - mã kênh do quản trị tự đặt (ví dụ "zalo-nhom1", "fb-tarot") để biết kênh nào đem người tới.
// Phễu: vào trang (anon.ref) -> đã trò chuyện (anon.first_chat) -> đăng ký bằng email (users.ref) -> bạn đã trò chuyện đủ giờ (referrals.qualified_at).
// Chỉ có số lượng. Không trả email hay nội dung trò chuyện của ai.
const safe = (db, sql, ...a) => { try { return db.prepare(sql).all(...a); } catch { return []; } };

export function refStats(db, { from = 0, limit = 40 } = {}) {
  const visits = safe(db, 'SELECT ref code, COUNT(*) visitors, SUM(first_chat IS NOT NULL) chatted, MAX(first_seen) lastSeen FROM anon WHERE ref IS NOT NULL AND first_seen >= ? GROUP BY ref', from);
  const signups = new Map(safe(db, "SELECT ref code, COUNT(*) n FROM users WHERE role = 'user' AND ref IS NOT NULL AND created_at >= ? GROUP BY ref", from).map((r) => [r.code, r.n]));
  const qual = new Map(safe(db, 'SELECT code, SUM(qualified_at IS NOT NULL) q FROM referrals WHERE created_at >= ? GROUP BY code', from).map((r) => [r.code, r.q ?? 0]));
  const members = new Map(safe(db, "SELECT substr(anon_id, 1, 8) code, id FROM users WHERE anon_id IS NOT NULL AND role = 'user'").map((r) => [r.code, r.id]));
  const by = new Map(visits.map((r) => [r.code, { code: r.code, visitors: r.visitors, chatted: r.chatted ?? 0, lastSeen: r.lastSeen }]));
  for (const code of [...signups.keys(), ...qual.keys()]) if (!by.has(code)) by.set(code, { code, visitors: 0, chatted: 0, lastSeen: null });
  const rows = [...by.values()].map((r) => ({
    ...r, signups: signups.get(r.code) ?? 0, qualified: qual.get(r.code) ?? 0,
    kind: members.has(r.code) ? 'member' : 'channel', memberId: members.get(r.code) ?? null,
    conv: r.visitors ? Math.round(((signups.get(r.code) ?? 0) / r.visitors) * 1000) / 10 : null,
  })).sort((a, b) => b.signups - a.signups || b.visitors - a.visitors).slice(0, limit);
  const sum = (k, kind) => rows.filter((r) => !kind || r.kind === kind).reduce((s, r) => s + r[k], 0);
  return { rows, totals: { visitors: sum('visitors'), chatted: sum('chatted'), signups: sum('signups'), qualified: sum('qualified'), member: sum('signups', 'member'), channel: sum('signups', 'channel') } };
}

/** Phễu của riêng một mã (cho thành viên xem liên kết của mình): số người vào, đã trò chuyện, đã đăng ký. Không có danh tính. */
export function refFunnelOf(db, code) {
  const a = safe(db, 'SELECT COUNT(*) visitors, SUM(first_chat IS NOT NULL) chatted FROM anon WHERE ref = ?', code)[0] ?? {};
  const s = safe(db, "SELECT COUNT(*) n FROM users WHERE role = 'user' AND ref = ?", code)[0] ?? {};
  return { visitors: a.visitors ?? 0, chatted: a.chatted ?? 0, signups: s.n ?? 0 };
}

/** Chuẩn hóa mã kênh quản trị gõ vào thành mã dùng được trong ?ref=. */
export const channelCode = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
