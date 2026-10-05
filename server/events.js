// Thu thập sự kiện hành trình. Chỉ nhận tên sự kiện trong danh sách cho phép và giá trị ngắn: không bao giờ nhận nội dung trò chuyện.
export const EVENTS = new Set([
  'landing_view', 'enter_click', 'resume_click', 'intake_step', 'intake_done', 'hook_shown', 'start_choice', 'first_message', 'message_sent',
  'reading_requested', 'reading_received', 'resonance', 'share_card', 'chart_open', 'pace_toggle', 'warn_shown', 'session_close',
  'intro_view', 'intro_skip', 'sound_toggle', 'nps', 'signup_view', 'signup_submit', 'signup_verified', 'signup_skip', 'return_visit', 'rest_view', 'client_error', 'feedback',
]);
const KEY_RE = /^[a-zA-Z_]{1,24}$/;

/** Làm sạch props: tối đa 8 khoá, chỉ số/boolean/chuỗi ngắn (<= 32 ký tự). */
export function cleanProps(p) {
  const out = {};
  if (!p || typeof p !== 'object') return out;
  for (const [k, v] of Object.entries(p).slice(0, 8)) {
    if (!KEY_RE.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(v * 100) / 100;
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = v.replace(/[\u0000-\u001f<>"'`\\]/g, ' ').trim().slice(0, 32);
  }
  return out;
}

export function ingest(db, { actor, userId, sid, events }, now = Date.now()) {
  if (!Array.isArray(events)) return 0;
  const st = db.prepare('INSERT INTO events(ts, actor, user_id, sid, name, props) VALUES (?,?,?,?,?,?)');
  let n = 0;
  const safeSid = String(sid ?? '').replace(/[^\w-]/g, '').slice(0, 24) || null;
  for (const e of events.slice(0, 50)) {
    if (!e || !EVENTS.has(e.name)) continue;
    const t = Number.isFinite(e.t) && Math.abs(now - e.t) < 6 * 3_600_000 ? e.t : now; // chấp nhận lệch tối đa 6 giờ
    st.run(t, actor, userId ?? null, safeSid, e.name, JSON.stringify(cleanProps(e.props)));
    n++;
  }
  return n;
}
