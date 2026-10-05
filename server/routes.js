// API tài khoản, theo dõi hành trình, đồng bộ trạng thái và trang quản trị.
import { clientIp } from './ip.js';
import crypto from 'node:crypto';
import { createAuth, parseCookies, cookie, sendMail } from './auth.js';
import { ingest } from './events.js';
import { computeMetrics } from './admin.js';
import { analyzeAffect, firstTag } from './affect.js';
import { deviceOf } from './device.js';
import { listParticipants, participantDetail, computeJourney, exportTurns } from './people.js';
import { assessTurn } from './quality.js';
import { newToken } from './reminders.js';

const DAY = 86_400_000;
export const ANON_LIMIT_MS = 32 * 60_000; // 30 phút + 2 phút châm chước

export function createApi({ db, env = process.env, mailer, now = () => Date.now() }) {
  const accountsOn = (env.HUYENMY_ACCOUNTS ?? 'on') !== 'off';
  const adminEmails = String(env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const pepper = env.HUYENMY_PEPPER || crypto.randomBytes(16).toString('hex');
  const auth = createAuth({ db, pepper, adminEmails, mailer, now });
  const dataKey = env.HUYENMY_DATA_KEY ? crypto.createHash('sha256').update(env.HUYENMY_DATA_KEY).digest() : null;
  const dailyCap = +env.HUYENMY_DAILY_TURNS || 200;
  const send = mailer ?? ((m) => sendMail(m, env));
  const lastHookMail = new Map();

  const enc = (s) => { if (!dataKey) return 'p:' + s; const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', dataKey, iv); const b = Buffer.concat([c.update(s, 'utf8'), c.final()]); return 'e:' + Buffer.concat([iv, c.getAuthTag(), b]).toString('base64'); };
  const dec = (s) => { if (!s) return null; if (s.startsWith('p:')) return s.slice(2); if (!dataKey) return null; const b = Buffer.from(s.slice(2), 'base64'); const d = crypto.createDecipheriv('aes-256-gcm', dataKey, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'); };

  const json = (res, code, obj, headers = {}) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(obj)); };
  const secure = (req) => req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  const ipOf = (req) => clientIp(req);
  function readBody(req, max = 64 * 1024) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('Nội dung quá lớn')); req.destroy(); } else chunks.push(c); });
      req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('JSON không hợp lệ')); } });
      req.on('error', reject);
    });
  }

  /** Nhận diện người dùng: phiên đăng nhập (nếu có) và mã ẩn danh (cookie), tạo mã ẩn danh khi chưa có. */
  function identify(req, res) {
    const c = parseCookies(req.headers.cookie);
    const user = auth.fromToken(c.hm_s);
    let anon = /^[a-f0-9]{32}$/.test(c.hm_a ?? '') ? c.hm_a : null;
    const t = now();
    if (!anon) {
      anon = crypto.randomBytes(16).toString('hex');
      const ref = String(new URL(req.url, 'http://x').searchParams.get('ref') ?? '').replace(/[^\w-]/g, '').slice(0, 20) || null;
      db.prepare('INSERT OR IGNORE INTO anon(id, first_seen, ref) VALUES (?,?,?)').run(anon, t, ref);
      const prev = res.getHeader('Set-Cookie');
      res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [prev] : []), cookie('hm_a', anon, { maxAgeSec: 365 * 86400, secure: secure(req) })]);
    }
    return { user, anon, actor: user ? `u${user.id}` : anon };
  }

  /** Cổng cho /api/chat: người ẩn danh chỉ được trò chuyện tối đa ~30 phút, sau đó cần tài khoản. Có trần số lượt mỗi ngày. */
  function chatGate(req, res) {
    const id = identify(req, res), t = now();
    if (accountsOn && !id.user) {
      const row = db.prepare('SELECT first_chat, active_ms, last_chat FROM anon WHERE id = ?').get(id.anon);
      if (!row) db.prepare('INSERT OR IGNORE INTO anon(id, first_seen) VALUES (?,?)').run(id.anon, t);
      // Chỉ cộng thời gian trò chuyện thực: khoảng cách giữa hai lượt tối đa 5 phút, nên người rời đi rồi quay lại sau vài giờ không bị tính là đã dùng hết buổi.
      const active = (row?.active_ms ?? 0) + (row?.last_chat ? Math.min(Math.max(t - row.last_chat, 0), 5 * 60_000) : 0);
      if (row?.first_chat && active > ANON_LIMIT_MS) { json(res, 401, { error: 'Buổi đầu của bạn đã trọn 30 phút. Tạo tài khoản bằng email để My nhớ bạn và hẹn lần sau nhé.', needAuth: true }); return null; }
      db.prepare('UPDATE anon SET first_chat = COALESCE(first_chat, ?), active_ms = ?, last_chat = ? WHERE id = ?').run(t, active, t, id.anon);
    }
    const today = db.prepare('SELECT COUNT(*) c FROM turns WHERE actor = ? AND ts >= ?').get(id.actor, t - DAY).c;
    if (today >= dailyCap) { json(res, 429, { error: 'Hôm nay My đã trò chuyện khá nhiều với bạn, hẹn bạn ngày mai nhé.' }); return null; }
    return id;
  }

  function recordTurn({ actor, sid, phase, minute, ms, ttft, reply, userMsg, userHistory, prevReplies, ok, ut }) {
    const a = ok ? assessTurn({ phase, reply, userMsg, userHistory, prevReplies }) : { words: 0, q: 0, tags: 0, rep: 0, echo: 0, score: 0, flags: [] };
    const af = analyzeAffect(userMsg); // chỉ giữ các con số, không giữ nội dung
    db.prepare('INSERT INTO turns(ts, actor, sid, phase, minute, ms, ttft, words, q, tags, rep, echo, score, flags, ok, u_val, u_aro, u_emo, u_disc, u_words, my_emo, ut) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(now(), actor, String(sid ?? '').slice(0, 24) || null, phase, Number.isFinite(minute) ? Math.round(minute) : null, ms ?? null, ttft ?? null, a.words, a.q, a.tags, a.rep, a.echo, a.score, a.flags.join(','), ok ? 1 : 0,
        af.val, af.aro, af.emo, af.disc, af.words, firstTag(reply), Number.isFinite(ut) ? ut : null);
    return a;
  }

  async function handle(req, res, pathname) {
    const method = req.method;
    if (pathname === '/api/me' && method === 'GET') {
      const id = identify(req, res);
      return json(res, 200, { accounts: accountsOn, user: id.user, refCode: id.anon.slice(0, 8) }), true;
    }
    if (pathname === '/api/auth/request' && method === 'POST') {
      if (!accountsOn) return json(res, 404, { error: 'Tính năng tài khoản đang tắt.' }), true;
      let b; try { b = await readBody(req, 2048); } catch (e) { return json(res, 400, { error: e.message }), true; }
      const r = await auth.requestCode(b.email, ipOf(req));
      return json(res, r.ok ? 200 : r.status, r.ok ? { ok: true } : { error: r.error }), true;
    }
    if (pathname === '/api/auth/verify' && method === 'POST') {
      if (!accountsOn) return json(res, 404, { error: 'Tính năng tài khoản đang tắt.' }), true;
      let b; try { b = await readBody(req, 2048); } catch (e) { return json(res, 400, { error: e.message }), true; }
      const id = identify(req, res);
      const anonRow = db.prepare('SELECT ref FROM anon WHERE id = ?').get(id.anon);
      const r = auth.verify(b.email, b.code, { ref: anonRow?.ref ?? null, consentMemory: b.consentMemory === true, remind: b.remind === true });
      if (!r.ok) return json(res, r.status, { error: r.error }), true;
      try { // nối người ẩn danh với tài khoản để hành trình trước và sau đăng ký thành một người
        const d = db.prepare('SELECT device, os, browser FROM anon WHERE id = ?').get(id.anon) ?? deviceOf(req.headers['user-agent']);
        db.prepare('UPDATE users SET anon_id = COALESCE(anon_id, ?), device = COALESCE(device, ?), os = COALESCE(os, ?), browser = COALESCE(browser, ?) WHERE id = ?').run(id.anon, d.device ?? null, d.os ?? null, d.browser ?? null, r.user.id);
        db.prepare('INSERT OR REPLACE INTO anon_links(anon_id, user_id, linked_at) VALUES (?,?,?)').run(id.anon, r.user.id, now());
      } catch (e) { console.error('[link]', e.message); }
      const prev = res.getHeader('Set-Cookie');
      res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [prev] : []), cookie('hm_s', r.token, { maxAgeSec: r.maxAgeSec, secure: secure(req) })]);
      return json(res, 200, { ok: true, user: r.user, isNew: r.isNew }), true;
    }
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const c = parseCookies(req.headers.cookie); auth.logout(c.hm_s);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookie('hm_s', '', { maxAgeSec: 0, secure: secure(req) }) }), true;
    }
    if (pathname === '/api/event' && method === 'POST') {
      let b; try { b = await readBody(req, 16 * 1024); } catch { return res.writeHead(204).end(), true; }
      const id = identify(req, res);
      ingest(db, { actor: id.actor, userId: id.user?.id, sid: b.sid, events: b.events }, now());
      try { // ghi nhóm thiết bị một lần cho mỗi người (chỉ loại máy, hệ điều hành, trình duyệt)
        const d = deviceOf(req.headers['user-agent']);
        db.prepare('INSERT OR IGNORE INTO anon(id, first_seen) VALUES (?,?)').run(id.anon, now());
        db.prepare('UPDATE anon SET device = COALESCE(device, ?), os = COALESCE(os, ?), browser = COALESCE(browser, ?) WHERE id = ?').run(d.device, d.os, d.browser, id.anon);
        if (id.user) db.prepare('UPDATE users SET device = COALESCE(device, ?), os = COALESCE(os, ?), browser = COALESCE(browser, ?), anon_id = COALESCE(anon_id, ?) WHERE id = ?').run(d.device, d.os, d.browser, id.anon, id.user.id);
      } catch (e) { console.error('[device]', e.message); }
      return res.writeHead(204).end(), true;
    }
    if (pathname === '/api/state') {
      const id = identify(req, res);
      if (!id.user) return json(res, 401, { error: 'Cần đăng nhập.' }), true;
      const u = db.prepare('SELECT consent_memory, state, state_at FROM users WHERE id = ?').get(id.user.id);
      if (method === 'GET') {
        if (!u.consent_memory || !u.state) return json(res, 200, { state: null }), true;
        try { return json(res, 200, { state: JSON.parse(dec(u.state)), at: u.state_at }), true; } catch { return json(res, 200, { state: null }), true; }
      }
      if (method === 'PUT') {
        let b; try { b = await readBody(req, 256 * 1024); } catch (e) { return json(res, 400, { error: e.message }), true; }
        if (b.consentMemory === true && !u.consent_memory) db.prepare('UPDATE users SET consent_memory = 1, consent_at = ? WHERE id = ?').run(now(), id.user.id);
        else if (b.consentMemory === false) db.prepare('UPDATE users SET consent_memory = 0, state = NULL WHERE id = ?').run(id.user.id);
        const consent = db.prepare('SELECT consent_memory FROM users WHERE id = ?').get(id.user.id).consent_memory;
        if (!consent) return json(res, 403, { error: 'Bạn chưa cho phép My lưu cuộc trò chuyện.' }), true;
        if (b.state) db.prepare('UPDATE users SET state = ?, state_at = ? WHERE id = ?').run(enc(JSON.stringify(b.state)), now(), id.user.id);
        return json(res, 200, { ok: true }), true;
      }
    }
    if (pathname === '/api/account/hook' && method === 'POST') {
      const id = identify(req, res);
      if (!id.user) return json(res, 401, { error: 'Cần đăng nhập.' }), true;
      let b; try { b = await readBody(req, 8 * 1024); } catch (e) { return json(res, 400, { error: e.message }), true; }
      const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 6).map((l) => String(l ?? '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)).filter(Boolean);
      if (!lines.length) return json(res, 400, { error: 'Không có nội dung.' }), true;
      const t = now();
      if (t - (lastHookMail.get(id.user.id) ?? 0) < 10 * 60_000) return json(res, 429, { error: 'My vừa gửi rồi, bạn xem hộp thư nhé.' }), true;
      lastHookMail.set(id.user.id, t);
      const link = env.PUBLIC_URL ? `\n\nQuay lại gặp My: ${env.PUBLIC_URL}` : '';
      try { await send({ to: id.user.email, subject: 'Điều thú vị My vừa kể với bạn', text: `${lines.join('\n\n')}\n\nĐây chỉ là điểm chung để bắt đầu câu chuyện, không phải lời tiên đoán hay số phận.${link}` }); }
      catch (e) { console.error('[mail]', e.message); return json(res, 503, { error: 'My chưa gửi được email lúc này.' }), true; }
      return json(res, 200, { ok: true }), true;
    }
    if (pathname === '/api/account/remind' && method === 'POST') {
      const id = identify(req, res);
      if (!id.user) return json(res, 401, { error: 'Cần đăng nhập.' }), true;
      let b; try { b = await readBody(req, 1024); } catch (e) { return json(res, 400, { error: e.message }), true; }
      if (b.on === true) db.prepare('UPDATE users SET remind_optin = 1, remind_token = COALESCE(remind_token, ?), remind_count = 0 WHERE id = ?').run(newToken(), id.user.id);
      else db.prepare('UPDATE users SET remind_optin = 0 WHERE id = ?').run(id.user.id);
      return json(res, 200, { ok: true, remind: b.on === true }), true;
    }
    if (pathname === '/api/unsub' && (method === 'GET' || method === 'POST')) {
      const t = String(new URL(req.url, 'http://x').searchParams.get('t') ?? '').replace(/[^\w-]/g, '').slice(0, 64);
      const r = t ? db.prepare('UPDATE users SET remind_optin = 0 WHERE remind_token = ?').run(t) : { changes: 0 };
      if (method === 'POST') return res.writeHead(r.changes ? 200 : 404).end(), true;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Huyền My</title><body style="margin:0;background:#0b0912;color:#e9e1cf;font:17px/1.7 system-ui,sans-serif"><main style="max-width:520px;margin:12vh auto;padding:0 20px"><h1 style="font-size:1.4rem">${r.changes ? 'Đã hủy nhận email nhắc' : 'Liên kết này không còn hiệu lực'}</h1><p>${r.changes ? 'My sẽ không gửi thư nhắc nữa. Bạn vẫn có thể quay lại gặp My bất cứ lúc nào.' : 'Có thể bạn đã hủy trước đó. Nếu vẫn nhận được thư, hãy trả lời thư hoặc viết tới luongviethoang.hcm@gmail.com.'}</p><p><a style="color:#e8c46a" href="/">Về Huyền My</a></p></main>`);
      return true;
    }
    if (pathname === '/api/account/delete' && method === 'POST') {
      const id = identify(req, res);
      if (!id.user) return json(res, 401, { error: 'Cần đăng nhập.' }), true;
      auth.deleteAccount(id.user.id);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookie('hm_s', '', { maxAgeSec: 0, secure: secure(req) }) }), true;
    }
    if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/metrics' && method === 'GET') {
      const id = identify(req, res);
      if (!id.user) return json(res, 401, { error: 'Cần đăng nhập.' }), true;
      if (id.user.role !== 'admin') return json(res, 403, { error: 'Chỉ dành cho quản trị viên.' }), true;
      const q = new URL(req.url, 'http://x').searchParams, days = Math.min(365, Math.max(0, +q.get('days') || 0));
      if (pathname === '/api/admin/participants') return json(res, 200, listParticipants(db, { days, now: now() })), true;
      if (pathname === '/api/admin/participant') { const d = participantDetail(db, String(q.get('id') ?? ''), { now: now() }); return d ? json(res, 200, d) : json(res, 404, { error: 'Không thấy người này.' }), true; }
      if (pathname === '/api/admin/journey') return json(res, 200, computeJourney(db, { days, now: now() })), true;
      if (pathname === '/api/admin/export/turns.csv') {
        const rows = exportTurns(db, { days, now: now(), salt: pepper }, (x) => crypto.createHash('sha256').update(x).digest('hex').slice(0, 10));
        const cols = ['person', 'ts', 'ut', 'phase', 'minute', 'val', 'aro', 'emo', 'disc', 'words', 'my_tone', 'score', 'flags', 'ok'];
        const csv = '\uFEFF' + cols.join(',') + '\n' + rows.map((r) => cols.map((c) => { const v = r[c] ?? ''; return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v; }).join(',')).join('\n');
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="huyenmy-luot-tro-chuyen.csv"', 'Cache-Control': 'no-store' }); res.end(csv); return true;
      }
      return false;
    }
    if (pathname === '/api/admin/metrics' && method === 'GET') {
      const id = identify(req, res);
      if (!id.user) return json(res, 401, { error: 'Cần đăng nhập.' }), true;
      if (id.user.role !== 'admin') return json(res, 403, { error: 'Chỉ dành cho quản trị viên.' }), true;
      const days = Math.min(90, Math.max(1, +new URL(req.url, 'http://x').searchParams.get('days') || 14));
      return json(res, 200, computeMetrics(db, { days, now: now() })), true;
    }
    return false;
  }
  return { handle, chatGate, recordTurn, identify, auth, accountsOn, adminConfigured: adminEmails.length > 0 };
}
