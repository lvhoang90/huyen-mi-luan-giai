// Dữ liệu người tham gia và phân tích hành trình cảm xúc cho trang quản trị.
// Mọi con số đến từ bảng events (sự kiện ngắn) và turns (chỉ số từng lượt); không có nội dung trò chuyện, họ tên hay ngày sinh.
// Cảm xúc suy ra từ từ điển (server/affect.js) là ước lượng thô để nhìn xu hướng theo nhóm, nên mọi kết luận đều kèm cỡ mẫu và khoảng tin cậy.
import { EMO } from './affect.js';
import { wilson } from './admin.js';

const DAY = 86_400_000, VN = 7 * 3_600_000;
const parse = (s) => { try { return JSON.parse(s ?? '{}'); } catch { return {}; } };
const r1 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const sd = (a) => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const T975 = [0, 12.71, 4.3, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23, 2.2, 2.18, 2.16, 2.14, 2.13, 2.12, 2.11, 2.1, 2.09, 2.09, 2.08, 2.07, 2.07, 2.06, 2.06, 2.06, 2.05, 2.05, 2.04];
const tq = (df) => (df < 1 ? null : df <= 29 ? T975[df] : 1.96);
/** Trung bình kèm khoảng tin cậy 95% (phân phối t). */
export function meanCi(a) {
  const n = a.length; if (!n) return { n: 0, mean: null, lo: null, hi: null };
  const m = mean(a), s = sd(a);
  if (n < 2 || s == null) return { n, mean: r2(m), lo: null, hi: null };
  const h = tq(n - 1) * s / Math.sqrt(n);
  return { n, mean: r2(m), lo: r2(m - h), hi: r2(m + h) };
}
function slope(xs, ys) {
  const n = xs.length; if (n < 3) return null;
  const mx = mean(xs), my = mean(ys); let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den ? num / den : null;
}
export function pearson(xs, ys) {
  const n = xs.length; if (n < 3) return null;
  const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
const mode = (arr) => { const m = new Map(); for (const x of arr) if (x) m.set(x, (m.get(x) ?? 0) + 1); let b = null, c = 0; for (const [k, v] of m) if (v > c) { b = k; c = v; } return b; };
const isoDay = (ts) => (ts ? new Date(ts + VN).toISOString().slice(0, 10) : null);
const isoMin = (ts) => (ts ? new Date(ts + VN).toISOString().slice(0, 16).replace('T', ' ') : null);

export const STAGES = ['Mở trang', 'Bước vào', 'Điền hồ sơ', 'Xem điểm chung', 'Trò chuyện', 'Nhận luận giải', 'Trọn buổi', 'Đã đăng ký'];
export const MOOD_LABEL = ['', 'Nặng nề', 'Hơi chùng', 'Bình thường', 'Khá nhẹ', 'Nhẹ nhõm'];
const CLASS_LABEL = { up: 'Cải thiện', flat: 'Ổn định', down: 'Đi xuống' };
const classify = (d) => (d == null ? null : d >= 0.3 ? 'up' : d <= -0.3 ? 'down' : 'flat');

/** Khai báo cột: dùng chung cho bảng, bộ lọc và tệp CSV. type: text | num | bool | date | cat */
export const COLUMNS = [
  { key: 'id', label: 'Mã', type: 'text', group: 'Định danh', def: true },
  { key: 'kind', label: 'Loại', type: 'cat', group: 'Định danh', def: true },
  { key: 'email', label: 'Email', type: 'text', group: 'Định danh', def: true },
  { key: 'stage', label: 'Đi tới bước', type: 'cat', group: 'Hành trình', def: true },
  { key: 'firstSeen', label: 'Lần đầu thấy', type: 'date', group: 'Hành trình', def: true },
  { key: 'lastSeen', label: 'Lần cuối', type: 'date', group: 'Hành trình', def: true },
  { key: 'daysActive', label: 'Số ngày dùng', type: 'num', group: 'Hành trình' },
  { key: 'sessions', label: 'Số phiên', type: 'num', group: 'Hành trình' },
  { key: 'activeMin', label: 'Phút trò chuyện', type: 'num', group: 'Hành trình', def: true },
  { key: 'userTurns', label: 'Số lượt người nói', type: 'num', group: 'Hành trình', def: true },
  { key: 'read', label: 'Nhận luận giải', type: 'bool', group: 'Hành trình' },
  { key: 'closed', label: 'Trọn buổi', type: 'bool', group: 'Hành trình' },
  { key: 'returned', label: 'Quay lại', type: 'bool', group: 'Hành trình' },
  { key: 'shared', label: 'Chia sẻ thẻ', type: 'bool', group: 'Hành trình' },
  { key: 'ageBand', label: 'Nhóm tuổi', type: 'cat', group: 'Hồ sơ', def: true },
  { key: 'gender', label: 'Giới tính', type: 'cat', group: 'Hồ sơ' },
  { key: 'field', label: 'Lĩnh vực', type: 'cat', group: 'Hồ sơ' },
  { key: 'hasTime', label: 'Biết giờ sinh', type: 'bool', group: 'Hồ sơ' },
  { key: 'hasPlace', label: 'Có nơi sinh', type: 'bool', group: 'Hồ sơ' },
  { key: 'device', label: 'Thiết bị', type: 'cat', group: 'Kỹ thuật' },
  { key: 'os', label: 'Hệ điều hành', type: 'cat', group: 'Kỹ thuật' },
  { key: 'browser', label: 'Trình duyệt', type: 'cat', group: 'Kỹ thuật' },
  { key: 'ref', label: 'Nguồn giới thiệu', type: 'cat', group: 'Kỹ thuật' },
  { key: 'greet', label: 'Lời chào mở đầu (thử nghiệm)', type: 'cat', group: 'Kỹ thuật' },
  { key: 'skipIntro', label: 'Bỏ qua màn mở đầu', type: 'bool', group: 'Kỹ thuật' },
  { key: 'moodStart', label: 'Tâm trạng lúc đầu (1-5)', type: 'num', group: 'Cảm xúc', def: true },
  { key: 'moodEnd', label: 'Tâm trạng lúc sau (1-5)', type: 'num', group: 'Cảm xúc', def: true },
  { key: 'moodDelta', label: 'Thay đổi tâm trạng', type: 'num', group: 'Cảm xúc', def: true },
  { key: 'valFirst', label: 'Sắc thái nửa đầu', type: 'num', group: 'Cảm xúc' },
  { key: 'valLast', label: 'Sắc thái nửa sau', type: 'num', group: 'Cảm xúc' },
  { key: 'valDelta', label: 'Thay đổi sắc thái', type: 'num', group: 'Cảm xúc' },
  { key: 'trend', label: 'Xu hướng cảm xúc', type: 'cat', group: 'Cảm xúc', def: true },
  { key: 'valMean', label: 'Sắc thái trung bình', type: 'num', group: 'Cảm xúc' },
  { key: 'valSlope', label: 'Độ dốc theo lượt', type: 'num', group: 'Cảm xúc' },
  { key: 'domEmo', label: 'Cảm xúc nổi bật', type: 'cat', group: 'Cảm xúc', def: true },
  { key: 'aroMean', label: 'Cường độ trung bình', type: 'num', group: 'Cảm xúc' },
  { key: 'discMean', label: 'Mức mở lòng (0-3)', type: 'num', group: 'Cảm xúc' },
  { key: 'myTone', label: 'Giọng My hay dùng', type: 'cat', group: 'Cảm xúc' },
  { key: 'resonance', label: 'Độ đúng (1-3)', type: 'num', group: 'Đánh giá', def: true },
  { key: 'nps', label: 'Giới thiệu (0-10)', type: 'num', group: 'Đánh giá', def: true },
  { key: 'quality', label: 'Điểm chất lượng My', type: 'num', group: 'Đánh giá' },
  { key: 'crisis', label: 'Lượt khủng hoảng', type: 'num', group: 'An toàn' },
  { key: 'consent', label: 'Đồng ý lưu trò chuyện', type: 'bool', group: 'Tài khoản' },
  { key: 'remind', label: 'Nhận email nhắc', type: 'bool', group: 'Tài khoản' },
  { key: 'created', label: 'Ngày đăng ký', type: 'date', group: 'Tài khoản' },
];

function loadBase(db, { days, now }) {
  const from = days > 0 ? now - days * DAY : 0;
  const evs = db.prepare('SELECT ts, actor, sid, name, props FROM events WHERE ts >= ? ORDER BY ts').all(from).map((e) => ({ ...e, p: parse(e.props) }));
  const turns = db.prepare('SELECT * FROM turns WHERE ts >= ? ORDER BY ts').all(from);
  const users = new Map(db.prepare("SELECT * FROM users WHERE role != 'admin'").all().map((u) => [u.id, u]));
  const admins = new Set(db.prepare("SELECT id FROM users WHERE role = 'admin'").all().map((u) => `u${u.id}`));
  const links = new Map(db.prepare('SELECT anon_id, user_id FROM anon_links').all().map((l) => [l.anon_id, l.user_id]));
  const anon = new Map(db.prepare('SELECT * FROM anon').all().map((a) => [a.id, a]));
  return { from, evs, turns, users, admins, links, anon };
}
const keyOf = (actor, links) => { const m = /^u(\d+)$/.exec(actor); if (m) return `U${m[1]}`; return links.has(actor) ? `U${links.get(actor)}` : `A${String(actor).slice(0, 8)}`; };

/** Gom toàn bộ dữ liệu theo từng người (tài khoản được nối với phiên ẩn danh trước đó). */
function gather(db, opts) {
  const b = loadBase(db, opts), people = new Map();
  const P = (k) => { let p = people.get(k); if (!p) { p = { key: k, evs: [], turns: [], actors: new Set() }; people.set(k, p); } return p; };
  for (const e of b.evs) { if (b.admins.has(e.actor)) continue; const p = P(keyOf(e.actor, b.links)); p.evs.push(e); p.actors.add(e.actor); }
  for (const t of b.turns) { if (b.admins.has(t.actor)) continue; const p = P(keyOf(t.actor, b.links)); p.turns.push(t); p.actors.add(t.actor); }
  return { ...b, people };
}

function buildRow(p, b) {
  const uid = p.key[0] === 'U' ? +p.key.slice(1) : null, u = uid ? b.users.get(uid) : null;
  if (uid && !u) return null; // quản trị viên hoặc tài khoản đã xoá
  const firstEv = (name) => p.evs.find((e) => e.name === name), allEv = (name) => p.evs.filter((e) => e.name === name);
  const has = (...names) => p.evs.some((e) => names.includes(e.name));
  const intake = allEv('intake_done').at(-1)?.p ?? {};
  const mood = allEv('mood_check').map((e) => ({ phase: e.p.phase, v: +e.p.value, ts: e.ts })).filter((m) => m.v >= 1 && m.v <= 5);
  const moodStart = mood.find((m) => m.phase === 'start')?.v ?? null;
  const moodEnd = [...mood].reverse().find((m) => m.phase === 'end')?.v ?? [...mood].reverse().find((m) => m.phase === 'mid')?.v ?? null;
  const ok = p.turns.filter((t) => t.ok), vals = ok.filter((t) => t.u_val != null);
  const half = Math.floor(vals.length / 2);
  const firstH = vals.length >= 4 ? vals.slice(0, half).map((t) => t.u_val) : [], lastH = vals.length >= 4 ? vals.slice(vals.length - half).map((t) => t.u_val) : [];
  const valDelta = firstH.length ? mean(lastH) - mean(firstH) : null;
  const sl = slope(vals.map((t, i) => i + 1), vals.map((t) => t.u_val));
  // thời gian trò chuyện thực: khoảng cách giữa hai lượt, tối đa 5 phút
  let act = 0; for (let i = 0; i < p.turns.length; i++) if (i) act += Math.min(p.turns[i].ts - p.turns[i - 1].ts, 5 * 60_000);
  const sids = new Set(p.evs.map((e) => e.sid).filter(Boolean)); for (const t of p.turns) if (t.sid) sids.add(t.sid);
  const days = new Set([...p.evs.map((e) => e.ts), ...p.turns.map((t) => t.ts)].map((ts) => Math.floor((ts + VN) / DAY)));
  const stageIdx = has('signup_verified') || u ? 7 : has('session_close') ? 6 : has('reading_received') ? 5 : has('first_message') ? 4 : has('hook_shown') ? 3 : has('intake_done') ? 2 : has('enter_click', 'resume_click') ? 1 : 0;
  const anonRec = [...p.actors].map((a) => b.anon.get(a)).find((a) => a?.device);
  const crisis = ok.filter((t) => /khung_hoang/.test(t.flags ?? '')).length;
  const stamps = [...p.evs.map((e) => e.ts), ...p.turns.map((t) => t.ts)];
  const row = {
    id: p.key[0] === 'A' ? `A-${p.key.slice(1, 7)}` : `U${String(uid).padStart(3, '0')}`,
    kind: u ? 'Tài khoản' : 'Ẩn danh', email: u?.email ?? null,
    stage: STAGES[stageIdx], stageNo: stageIdx,
    firstSeen: isoMin(stamps.length ? Math.min(...stamps) : u?.created_at), lastSeen: isoMin(stamps.length ? Math.max(...stamps) : u?.last_login),
    daysActive: days.size, sessions: sids.size, activeMin: r1(act / 60000), userTurns: ok.length ? Math.max(...ok.map((t) => t.ut ?? 0), ok.length) : 0,
    read: has('reading_received'), closed: has('session_close'), returned: has('return_visit') || days.size >= 2, shared: has('share_card'),
    ageBand: intake.ageBand ?? null, gender: intake.gender ?? null, field: intake.field && intake.field !== 'none' ? intake.field : null, hasTime: intake.hasTime ?? null, hasPlace: intake.hasPlace ?? null,
    device: u?.device ?? anonRec?.device ?? null, os: u?.os ?? anonRec?.os ?? null, browser: u?.browser ?? anonRec?.browser ?? null,
    ref: firstEv('landing_view')?.p.ref || u?.ref || null,
    greet: allEv('landing_view').map((e) => e.p.gv).find(Boolean) ?? null,
    sawFullIntro: p.evs.some((e) => e.name === 'intro_view' && e.p.kind === 'full'), skipIntro: p.evs.some((e) => e.name === 'intro_skip' && e.p.kind === 'full'),
    moodStart, moodEnd, moodDelta: moodStart != null && moodEnd != null ? moodEnd - moodStart : null,
    valFirst: r2(firstH.length ? mean(firstH) : null), valLast: r2(lastH.length ? mean(lastH) : null), valDelta: r2(valDelta), trend: CLASS_LABEL[classify(valDelta)] ?? null,
    valMean: r2(mean(vals.map((t) => t.u_val))), valSlope: r2(sl), domEmo: mode(vals.filter((t) => t.u_emo !== 'trung_tinh').map((t) => t.u_emo)) ?? (vals.length ? 'trung_tinh' : null),
    aroMean: r1(mean(vals.map((t) => t.u_aro))), discMean: r1(mean(vals.map((t) => t.u_disc))), myTone: mode(ok.map((t) => t.my_emo)),
    resonance: allEv('resonance').map((e) => +e.p.value).filter((v) => v >= 1 && v <= 3).at(-1) ?? null,
    nps: allEv('nps').map((e) => +e.p.value).filter((v) => v >= 0 && v <= 10).at(-1) ?? null,
    quality: ok.length ? Math.round(mean(ok.map((t) => t.score))) : null, crisis,
    consent: u ? !!u.consent_memory : null, remind: u ? !!u.remind_optin : null, created: u ? isoDay(u.created_at) : null,
  };
  if (row.domEmo) row.domEmoLabel = EMO[row.domEmo]?.label ?? row.domEmo;
  return row;
}

/** Danh sách người tham gia (một dòng một người), kèm khai báo cột. days = 0 là toàn thời gian. */
export function listParticipants(db, { days = 0, now = Date.now() } = {}) {
  const b = gather(db, { days, now });
  const rows = [];
  for (const p of b.people.values()) { const r = buildRow(p, b); if (r) rows.push(r); }
  // tài khoản mới tạo nhưng chưa có sự kiện nào trong kỳ vẫn cần có mặt
  const seen = new Set(rows.map((r) => r.id));
  for (const u of b.users.values()) {
    const id = `U${String(u.id).padStart(3, '0')}`; if (seen.has(id) || (days > 0 && u.created_at < b.from)) continue;
    const row = buildRow({ key: `U${u.id}`, evs: [], turns: [], actors: new Set() }, b); if (row) rows.push(row);
  }
  rows.sort((a, c) => (c.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
  const stageCounts = STAGES.map((s, i) => ({ stage: s, n: rows.filter((r) => r.stageNo === i).length }));
  return { columns: COLUMNS, rows, total: rows.length, stages: STAGES, stageCounts, emotions: Object.fromEntries(Object.entries(EMO).map(([k, v]) => [k, v.label])), moodLabels: MOOD_LABEL };
}

/** Hành trình cảm xúc của một người: từng lượt (con số), các lần tự đánh giá, và các mốc chính. */
export function participantDetail(db, id, { now = Date.now() } = {}) {
  const b = gather(db, { days: 0, now });
  const m = /^U0*(\d+)$/.exec(id); const key = m ? `U${m[1]}` : [...b.people.keys()].find((k) => k.startsWith(`A${id.replace(/^A-/, '')}`));
  const p = key && b.people.get(key); if (!p) return null;
  const row = buildRow(p, b); if (!row) return null;
  const turns = p.turns.map((t) => ({ ts: isoMin(t.ts), ut: t.ut, phase: t.phase, minute: t.minute, val: t.u_val, aro: t.u_aro, emo: t.u_emo, disc: t.u_disc, words: t.u_words, myTone: t.my_emo, score: t.score, flags: t.flags ? t.flags.split(',') : [], ok: !!t.ok }));
  const mood = p.evs.filter((e) => e.name === 'mood_check').map((e) => ({ ts: isoMin(e.ts), phase: e.p.phase, value: +e.p.value }));
  const timeline = p.evs.filter((e) => !['client_error'].includes(e.name)).slice(0, 400).map((e) => ({ ts: isoMin(e.ts), name: e.name, props: e.p }));
  return { row, turns, mood, timeline };
}

/** Phân tích hành trình cảm xúc và tâm lý trên toàn bộ người tham gia trong kỳ. */
export function computeJourney(db, { days = 0, now = Date.now() } = {}) {
  const b = gather(db, { days, now });
  const persons = [...b.people.values()].map((p) => ({ p, row: buildRow(p, b) })).filter((x) => x.row);
  const withTurns = persons.filter((x) => x.p.turns.filter((t) => t.ok && t.u_val != null).length > 0);
  const allTurns = withTurns.flatMap((x) => x.p.turns.filter((t) => t.ok && t.u_val != null).map((t) => ({ ...t, person: x.row.id })));

  // ---- tự đánh giá tâm trạng (đo trực tiếp, đáng tin hơn suy luận từ chữ) ----
  const pairs = persons.filter((x) => x.row.moodStart != null && x.row.moodEnd != null);
  const deltas = pairs.map((x) => x.row.moodDelta);
  const dist = (k) => [1, 2, 3, 4, 5].map((v) => persons.filter((x) => x.row[k] === v).length);
  const selfReport = {
    startDist: dist('moodStart'), endDist: dist('moodEnd'), paired: pairs.length, delta: meanCi(deltas),
    improved: wilson(deltas.filter((d) => d > 0).length, deltas.length), same: wilson(deltas.filter((d) => d === 0).length, deltas.length), worse: wilson(deltas.filter((d) => d < 0).length, deltas.length),
    startMean: r2(mean(persons.filter((x) => x.row.moodStart != null).map((x) => x.row.moodStart))), endMean: r2(mean(persons.filter((x) => x.row.moodEnd != null).map((x) => x.row.moodEnd))),
    labels: MOOD_LABEL.slice(1),
  };

  // ---- sắc thái theo lượt nói và theo phút ----
  const byTurn = [];
  for (let k = 1; k <= 12; k++) {
    const g = allTurns.filter((t) => (k < 12 ? t.ut === k : t.ut >= 12));
    byTurn.push({ turn: k === 12 ? '12+' : String(k), n: g.length, val: meanCi(g.map((t) => t.u_val)), aro: r2(mean(g.map((t) => t.u_aro))), disc: r2(mean(g.map((t) => t.u_disc))), words: r1(mean(g.map((t) => t.u_words))) });
  }
  const byMinute = [];
  for (let m0 = 0; m0 < 30; m0 += 5) {
    const g = allTurns.filter((t) => t.minute != null && t.minute >= m0 && t.minute < m0 + 5);
    byMinute.push({ range: `${m0}-${m0 + 5}′`, n: g.length, val: meanCi(g.map((t) => t.u_val)), disc: r2(mean(g.map((t) => t.u_disc))) });
  }

  // ---- phân loại xu hướng từng người ----
  const cls = persons.map((x) => x.row.trend).filter(Boolean);
  const valDeltas = persons.map((x) => x.row.valDelta).filter((v) => v != null);
  const trend = {
    eligible: cls.length, up: wilson(cls.filter((c) => c === 'Cải thiện').length, cls.length), flat: wilson(cls.filter((c) => c === 'Ổn định').length, cls.length), down: wilson(cls.filter((c) => c === 'Đi xuống').length, cls.length),
    delta: meanCi(valDeltas),
  };

  // ---- cảm xúc đầu và cuối cuộc trò chuyện ----
  const emoShare = [];
  const firstT = [], lastT = [];
  for (const x of withTurns) { const ts = x.p.turns.filter((t) => t.ok && t.u_val != null); if (ts.length < 3) continue; const third = Math.max(1, Math.floor(ts.length / 3)); firstT.push(...ts.slice(0, third)); lastT.push(...ts.slice(ts.length - third)); }
  for (const k of Object.keys(EMO)) {
    const a = firstT.filter((t) => t.u_emo === k).length, c = lastT.filter((t) => t.u_emo === k).length;
    emoShare.push({ emo: k, label: EMO[k].label, first: firstT.length ? a / firstT.length : null, last: lastT.length ? c / lastT.length : null, nFirst: a, nLast: c, delta: firstT.length && lastT.length ? c / lastT.length - a / firstT.length : null });
  }
  const overall = Object.keys(EMO).map((k) => ({ emo: k, label: EMO[k].label, n: allTurns.filter((t) => t.u_emo === k).length })).sort((a, c) => c.n - a.n);

  // ---- chuyển trạng thái và hồi phục ----
  const trans = new Map(); let negPeople = 0, recovered = 0;
  for (const x of withTurns) {
    const ts = x.p.turns.filter((t) => t.ok && t.u_val != null);
    for (let i = 0; i + 1 < ts.length; i++) { const a = ts[i].u_emo, c = ts[i + 1].u_emo; if (a === c && a === 'trung_tinh') continue; const k = `${a}>${c}`; trans.set(k, (trans.get(k) ?? 0) + 1); }
    const firstNeg = ts.findIndex((t) => t.u_val <= -0.8);
    if (firstNeg >= 0) { negPeople++; if (ts.slice(firstNeg + 1, firstNeg + 6).some((t) => t.u_val >= 0.5)) recovered++; }
  }
  const transitions = [...trans].map(([k, n]) => { const [a, c] = k.split('>'); return { from: a, to: c, fromLabel: EMO[a]?.label ?? a, toLabel: EMO[c]?.label ?? c, n }; }).sort((a, c) => c.n - a.n).slice(0, 12);
  const recovery = wilson(recovered, negPeople);

  // ---- tác động của luận giải (trước và sau lượt luận giải, cùng một người) ----
  const rd = [];
  for (const x of withTurns) {
    const ts = x.p.turns.filter((t) => t.ok && t.u_val != null), ri = ts.findIndex((t) => t.phase === 'reading');
    if (ri < 0) continue; const before = ts.slice(Math.max(0, ri - 3), ri), after = ts.slice(ri + 1, ri + 4);
    if (before.length && after.length) rd.push(mean(after.map((t) => t.u_val)) - mean(before.map((t) => t.u_val)));
  }
  const readingEffect = { n: rd.length, delta: meanCi(rd), improved: wilson(rd.filter((d) => d > 0.2).length, rd.length) };

  // ---- giọng của My và phản ứng của người dùng ở lượt kế tiếp (thăm dò, chưa phải quan hệ nhân quả) ----
  const tone = new Map();
  for (const x of withTurns) {
    const ts = x.p.turns.filter((t) => t.ok && t.u_val != null);
    for (let i = 0; i + 1 < ts.length; i++) { if (!ts[i].my_emo) continue; const arr = tone.get(ts[i].my_emo) ?? []; arr.push(ts[i + 1].u_val - ts[i].u_val); tone.set(ts[i].my_emo, arr); }
  }
  const toneEffect = [...tone].filter(([, a]) => a.length >= 5).map(([k, a]) => ({ tone: k, ...meanCi(a) })).sort((a, c) => c.mean - a.mean);

  // ---- tự đánh giá so với suy luận từ chữ (kiểm tra độ hợp lệ của từ điển) ----
  const both = persons.filter((x) => x.row.moodDelta != null && x.row.valDelta != null);
  const validity = { n: both.length, r: both.length >= 8 ? r2(pearson(both.map((x) => x.row.moodDelta), both.map((x) => x.row.valDelta))) : null };

  // ---- thử nghiệm lời chào mở đầu: mỗi người mới được gán ngẫu nhiên một biến thể ----
  const gv = new Map();
  for (const x of persons) { const k = x.row.greet; if (k) { const a = gv.get(k) ?? []; a.push(x.row); gv.set(k, a); } }
  const greetTest = [...gv].map(([v, rows]) => {
    const full = rows.filter((r) => r.sawFullIntro), moodD = rows.map((r) => r.moodDelta).filter((d) => d != null);
    return {
      variant: v, n: rows.length,
      skip: wilson(full.filter((r) => r.skipIntro).length, full.length),
      enter: wilson(rows.filter((r) => r.stageNo >= 1).length, rows.length), intake: wilson(rows.filter((r) => r.stageNo >= 2).length, rows.length),
      chat: wilson(rows.filter((r) => r.stageNo >= 4).length, rows.length), closed: wilson(rows.filter((r) => r.stageNo >= 6).length, rows.length),
      moodStart: r2(mean(rows.map((r) => r.moodStart).filter((d) => d != null))), moodDelta: meanCi(moodD),
      valDelta: meanCi(rows.map((r) => r.valDelta).filter((d) => d != null)), nps: r1(mean(rows.map((r) => r.nps).filter((d) => d != null))),
    };
  }).sort((a, c) => c.n - a.n);
  const ready = greetTest.filter((g) => g.chat.n >= 20);
  let greetVerdict = greetTest.length < 2 ? 'Cần ít nhất hai biến thể có người dùng.' : ready.length < 2 ? 'Chưa đủ dữ liệu: cần từ 20 người mỗi biến thể trở lên mới so sánh.' : null;
  if (!greetVerdict) {
    const best = [...ready].sort((a, c) => c.chat.p - a.chat.p)[0], clear = ready.filter((g) => g !== best && g.chat.hi < best.chat.lo);
    greetVerdict = clear.length ? `"${best.variant}" dẫn đầu rõ rệt về tỉ lệ bắt đầu trò chuyện (khoảng tin cậy không chồng lên ${clear.map((g) => `"${g.variant}"`).join(', ')}).` : 'Chưa có biến thể nào dẫn đầu rõ rệt: các khoảng tin cậy còn chồng nhau. Cứ để chạy thêm.';
  }

  // ---- an toàn ----
  const crisisPeople = persons.filter((x) => x.row.crisis > 0).length;
  const notes = [];
  const note = (level, text) => notes.push({ level, text });
  if (!allTurns.length) note('info', 'Chưa có lượt trò chuyện nào được ghi sắc thái. Dữ liệu sẽ xuất hiện khi có người nói chuyện với My sau bản cập nhật này.');
  else if (withTurns.length < 10) note('info', `Mới ${withTurns.length} người có dữ liệu cảm xúc: chỉ nên đọc như gợi ý, chưa kết luận.`);
  if (selfReport.paired >= 5) note(selfReport.delta.mean > 0 ? 'good' : 'warn', `Tâm trạng tự báo ${selfReport.delta.mean > 0 ? 'nhẹ hơn' : selfReport.delta.mean < 0 ? 'nặng hơn' : 'không đổi'} sau khi trò chuyện: trung bình ${selfReport.delta.mean > 0 ? '+' : ''}${selfReport.delta.mean} điểm (n=${selfReport.paired}${selfReport.delta.lo != null ? `, KTC 95%: ${selfReport.delta.lo} đến ${selfReport.delta.hi}` : ''}).`);
  else if (persons.length >= 5) note('info', `Mới ${selfReport.paired} người có đủ hai lần tự đánh giá tâm trạng (đầu và cuối). Cần thêm người đi hết buổi để kết luận.`);
  if (trend.eligible >= 8 && trend.down.p >= 0.3) note('warn', `${Math.round(trend.down.p * 100)}% người có sắc thái đi xuống ở nửa sau cuộc trò chuyện (n=${trend.eligible}). Nên đọc các hành trình đi xuống để xem My có thể làm khác điều gì.`);
  if (recovery.n >= 5) note(recovery.p < 0.4 ? 'warn' : 'good', `Trong ${recovery.n} người có lúc nặng lòng, ${Math.round(recovery.p * 100)}% có lúc nhẹ hơn trong 5 lượt sau đó.`);
  if (crisisPeople) note('crit', `${crisisPeople} người có lượt chứa dấu hiệu khủng hoảng. Mở mục Chất lượng và an toàn để xem My có kèm hỗ trợ không.`);
  if (validity.r != null && validity.r < 0.3) note('warn', `Suy luận từ chữ khớp yếu với tự đánh giá (r=${validity.r}, n=${validity.n}). Ưu tiên tin số tự đánh giá; từ điển cần mở rộng.`);

  return {
    range: { days, from: b.from ? new Date(b.from).toISOString() : null },
    coverage: { people: persons.length, withTurns: withTurns.length, turns: allTurns.length, selfReportPairs: pairs.length },
    selfReport, byTurn, byMinute, trend, emoShare, overall, transitions, recovery, readingEffect, toneEffect, validity,
    greetTest, greetVerdict, crisis: { people: crisisPeople }, notes,
    emotions: Object.fromEntries(Object.entries(EMO).map(([k, v]) => [k, v.label])),
  };
}

/** Bộ dữ liệu từng lượt để nghiên cứu: mã người đã băm một chiều, không email, không nội dung. */
export function exportTurns(db, { days = 0, now = Date.now(), salt = '' } = {}, hash) {
  const b = gather(db, { days, now }), out = [];
  for (const p of b.people.values()) {
    const code = hash(`${salt}${p.key}`);
    for (const t of p.turns) out.push({ person: code, ts: new Date(t.ts).toISOString(), ut: t.ut, phase: t.phase, minute: t.minute, val: t.u_val, aro: t.u_aro, emo: t.u_emo, disc: t.u_disc, words: t.u_words, my_tone: t.my_emo, score: t.score, flags: t.flags, ok: t.ok });
  }
  return out;
}
