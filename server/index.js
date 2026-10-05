import { clientIp } from './ip.js';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { normalizeProfile, buildChart } from '../src/engine/index.js';
import { buildSystemPrompt, PHASE_LIST } from './persona.js';
import { demoReply } from './demo.js';
import { openDb } from './db.js';
import { createApi } from './routes.js';

try { process.loadEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env')); } catch {}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.env.PORT || 5173;
const MODEL = process.env.HUYENMY_MODEL || 'claude-sonnet-5-5';
const isProd = process.env.NODE_ENV === 'production';
const hasKey = !!process.env.ANTHROPIC_API_KEY;
const client = hasKey ? new Anthropic() : null;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
const db = openDb(process.env.DATABASE_FILE || path.join(DATA_DIR, 'huyenmy.db'));
const api = createApi({ db });
const ACCESS_CODE = (process.env.HUYENMY_ACCESS_CODE || '').trim();   // để trống = ai cũng vào được

// ---- mã truy cập: so sánh hằng thời gian, đếm lần nhập sai theo IP ----
const norm = (v) => String(v ?? '').trim().toLowerCase(); // không phân biệt hoa thường: điện thoại hay tự viết hoa chữ đầu
const sha = (v) => crypto.createHash('sha256').update(norm(v)).digest();
const codeOk = (v) => !ACCESS_CODE || crypto.timingSafeEqual(sha(v ?? ''), sha(ACCESS_CODE));
const fails = new Map();
const lockedOut = (ip) => (fails.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60_000).length >= 8;
const noteFail = (ip) => fails.set(ip, [...(fails.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60_000), Date.now()]);

// ---- giới hạn tần suất đơn giản theo IP ----
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 60_000)) hits.delete(k); }, 60_000).unref();

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

function readBody(req, max = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('Nội dung quá lớn')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('JSON không hợp lệ')); } });
    req.on('error', reject);
  });
}

function cleanMessages(raw) {
  if (!Array.isArray(raw) || !raw.length) throw new Error('Thiếu tin nhắn');
  const out = [];
  for (const m of raw.slice(-40)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const content = String(m.content ?? '').slice(0, 4000).trim();
    if (!content) continue;
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content += '\n\n' + content; else out.push({ role: m.role, content });
  }
  if (!out.length || out[out.length - 1].role !== 'user') throw new Error('Tin nhắn cuối phải của người dùng');
  if (out[0].role === 'assistant') out.unshift({ role: 'user', content: '(Cuộc trò chuyện bắt đầu.)' });
  return out;
}

function handleUnlock(req, res) {
  const ip = clientIp(req);
  if (lockedOut(ip)) return json(res, 429, { error: 'Bạn nhập sai nhiều lần. Hãy thử lại sau ít phút nhé.' });
  return readBody(req, 1024).then((b) => {
    if (codeOk(b.code)) return json(res, 200, { ok: true });
    noteFail(ip); return json(res, 401, { error: 'Mã chưa đúng, bạn kiểm tra lại giúp My nhé.' });
  }).catch((e) => json(res, 400, { error: e.message }));
}

async function handleChat(req, res) {
  const ip = clientIp(req);
  if (ACCESS_CODE) {
    if (lockedOut(ip)) return json(res, 429, { error: 'Bạn nhập sai nhiều lần. Hãy thử lại sau ít phút nhé.' });
    if (!codeOk(req.headers['x-access-code'])) { noteFail(ip); return json(res, 401, { error: 'Cần mã truy cập để trò chuyện với My.', locked: true }); }
  }
  if (limited(ip)) return json(res, 429, { error: 'My cần thở một chút - bạn đợi một lát rồi nói tiếp nhé.' });
  const who = api.chatGate(req, res); if (!who) return;
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, 400, { error: e.message }); }
  let profile, messages, chart;
  const phase = PHASE_LIST.includes(body.phase) ? body.phase : 'companion';
  try { profile = normalizeProfile(body.profile); messages = cleanMessages(body.messages); chart = buildChart(profile); }
  catch (e) { return json(res, 400, { error: e.message }); }

  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  const t0 = Date.now(); let ttft = null, reply = '';
  const lastUser = messages[messages.length - 1]?.content ?? '', prevReplies = messages.filter((m) => m.role === 'assistant').map((m) => m.content), userHistory = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
  const minute = Number.isFinite(+body.minute) ? Math.min(60, Math.max(0, +body.minute)) : null;
  const record = (ok) => { try { api.recordTurn({ actor: who.actor, sid: body.sid, phase, minute, ms: Date.now() - t0, ttft, reply, userMsg: lastUser, userHistory, prevReplies, ok }); } catch (e) { console.error('[turn]', e.message); } };

  if (!client) {
    send({ demo: true });
    const text = demoReply({ phase, profile, chart, messages });
    reply = text;
    for (const part of text.match(/.{1,24}/gs)) { send({ t: part }); await new Promise((r) => setTimeout(r, 15)); }
    record(true); send({ done: true }); return res.end();
  }

  const system = buildSystemPrompt(phase, profile, chart, messages, { minute });
  const stream = client.messages.stream({ model: MODEL, max_tokens: phase === 'reading' ? 1400 : 1000, thinking: { type: 'between_tools' }, system, messages });
  res.on('close', () => { try { stream.abort(); } catch {} });
  stream.on('text', (t) => { if (ttft == null) ttft = Date.now() - t0; reply += t; send({ t }); });
  try { await stream.finalMessage(); record(true); send({ done: true }); }
  catch (e) {
    record(false);
    console.error('[anthropic]', e?.status ?? '', e?.message);
    send({ error: 'Đường truyền tới My đang chập chờn. Bạn thử nói lại giúp My nhé.' });
  }
  res.end();
}

// ---- static / vite ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
let vite = null;
if (!isProd) {
  const { createServer } = await import('vite');
  vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
}
function serveStatic(req, res) {
  const dist = path.join(root, 'dist');
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(dist, p));
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
  fs.createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  let { pathname } = new URL(req.url, 'http://x');
  if (pathname.startsWith('/api/') && await api.handle(req, res, pathname)) return;
  if (pathname === '/admin' || pathname === '/admin/') { req.url = '/admin.html'; pathname = '/admin.html'; }
  if (pathname === '/api/status' && req.method === 'GET') return json(res, 200, { ai: hasKey, model: hasKey ? MODEL : null, locked: !!ACCESS_CODE, accounts: api.accountsOn });
  if (pathname === '/api/unlock' && req.method === 'POST') return handleUnlock(req, res);
  if (pathname === '/api/chat' && req.method === 'POST') return handleChat(req, res).catch((e) => { console.error(e); if (!res.headersSent) json(res, 500, { error: 'Lỗi máy chủ' }); else res.end(); });
  if (vite) return vite.middlewares(req, res);
  serveStatic(req, res);
}).listen(PORT, () => console.log(`Huyền My Luận Giải - http://localhost:${PORT}  (AI: ${hasKey ? MODEL : 'DEMO, chưa có ANTHROPIC_API_KEY'}; mã truy cập: ${ACCESS_CODE ? 'BẬT' : 'tắt'}; tài khoản: ${api.accountsOn ? 'BẬT' : 'tắt'}; quản trị: ${api.adminConfigured ? 'có' : 'chưa đặt ADMIN_EMAILS'})`));
