import './style.css';
import { createCharacter } from './character.js';
import { createBackdrop } from './backdrop.js';
import { createLanterns } from './lanterns.js';
import { track, sessionId, ageBand } from './track.js';
import { shareCard } from './share.js';
import { mountLogo } from './logo.js';
import { createIntro } from './intro.js';
import { parseTagged, stripTags } from './emotion-tags.js';
import { normalizeProfile, buildChart, PLACES, findPlaces, distinctiveTraits, pickFamous, FIELD_OPTIONS } from './engine/index.js';
import { NUMBER_KEYWORDS, PERSONAL_YEAR_THEME } from './engine/numerology.js';
import { HANH } from './engine/bazi.js';

const $ = (s) => document.querySelector(s);
const STORE = 'huyenmy.v1';
const character = createCharacter($('#char'));
const backdrop = createBackdrop($('#stage'), $('#wheel'));
createLanterns($('#lanterns'));
mountLogo($('#veil-logo'), 'hero'); mountLogo($('#brand'), 'compact');
const intro = createIntro({ veil: $('#veil'), area: $('#stage-area'), setEmo: (n) => character.setEmotion(n) });
window.__introStarted = true; requestAnimationFrame(() => intro.start());
console.info('%cHuyền My Luận Giải 1.0%c © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền, mọi sử dụng cần có sự cho phép bằng văn bản của tác giả.', 'color:#e2c27d;font-weight:700', 'color:inherit');
const ELEMENT_COLOR = { Kim: '#f1ead2', Mộc: '#7fe3a0', Thủy: '#6fb7ff', Hỏa: '#ff8a5c', Thổ: '#e0b86a' };
const stage = {
  setMood: (m) => character.setMood(m), setSpeaking: (v) => character.setSpeaking(v), emo: (n) => character.setEmotion(n),
  cast: (sec) => { character.cast(sec); backdrop.cast(sec); },
  setElement: (name) => { const c = ELEMENT_COLOR[name]; if (c) { character.setElement(c); backdrop.setElement(name, c); } },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- trạng thái ----------------
let S = { profile: null, messages: [], phase: 'intro' };
let ACCOUNT = { accounts: false, user: null, refCode: '' }, syncTimer = 0;
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} scheduleSync(); };
/** Người dùng đã đăng nhập và đồng ý lưu: đẩy trạng thái lên máy chủ (chỉ hồ sơ, tin nhắn và nhịp buổi), gom 8 giây một lần. */
function scheduleSync() {
  if (!ACCOUNT.user?.consentMemory || !S.profile) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: S }) }).catch(() => {}), 8000);
}
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } };
let chart = null;

// ---------------- hiển thị văn bản ----------------
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')}</p>`).join('');
const log = $('#log');
const scrollDown = () => { log.scrollTop = log.scrollHeight; };

// Huyền My chỉ trò chuyện bằng chữ: miệng mấp máy theo từng chữ hiện ra, không dùng giọng đọc.
let typing = false;
const syncSpeaking = () => stage.setSpeaking(typing);

// ---------------- bong bóng của Huyền My (gõ chữ dần) ----------------
let current = null; // bong bóng đang gõ dở: chạm vào để hiện hết
class Bubble {
  constructor(instant = false) {
    this.el = document.createElement('div'); this.el.className = 'msg my' + (instant ? '' : ' typing');
    log.append(this.el); this.raw = ''; this.shown = 0; this.fired = 0; this.ended = false; this.instant = instant; this.talking = false; this.rush = false; this.finished = false;
    this.done = new Promise((r) => (this.resolve = r));
    if (!instant) this.timer = setInterval(() => this.tick(), 38);
    if (!instant) current = this;
  }
  get text() { return parseTagged(this.raw).text; }
  skip() { this.rush = true; }
  push(t) {
    this.raw += t;
    if (this.instant) return this.render();
    if (!this.talking) { this.talking = true; typing = true; syncSpeaking(); } // miệng chỉ động khi đã có chữ để nói
  }
  tick() {
    const p = parseTagged(this.raw), backlog = p.text.length - this.shown;
    if (backlog > 0) {
      const prev = this.shown;
      this.shown = this.rush ? p.text.length : Math.min(p.text.length, this.shown + (backlog > 300 ? 6 : backlog > 140 ? 3 : backlog > 60 ? 2 : 1));
      character.feed(p.text.slice(prev, this.shown)); this.fire(p); this.render(p);
    } else if (this.ended) this.finish(p);
  }
  fire(p) { while (this.fired < p.events.length && p.events[this.fired].pos <= this.shown) stage.emo(p.events[this.fired++].emo); }
  render(p = parseTagged(this.raw)) {
    let t = this.instant ? p.text : p.text.slice(0, this.shown);
    if (!this.instant && this.shown < p.text.length && (t.match(/\*/g) ?? []).length % 2) t += '*'; // đóng tạm dấu nghiêng khi đang gõ dở
    this.el.innerHTML = md(t); scrollDown();
  }
  end() { this.ended = true; if (this.instant) { this.render(); this.resolve(); } return this.done; }
  finish(p) {
    clearInterval(this.timer); this.finished = true; if (current === this) current = null; this.el.classList.remove('typing'); this.shown = p.text.length; this.fire(p); this.render(p);
    if (this.talking) { typing = false; syncSpeaking(); } this.resolve();
  }
}
// Nhịp đọc: 'tap' = chạm "Tiếp" để sang câu sau (mặc định), 'auto' = tự sang sau một lúc theo độ dài câu (cho người đọc nhanh).
const PACE_KEY = 'huyenmy.pace';
let pace = 'tap'; try { if (localStorage.getItem(PACE_KEY) === 'auto') pace = 'auto'; } catch {}
const autoDelay = (text) => Math.min(8000, Math.max(1500, stripTags(text).length * 55));
/** gate: true khi sau câu này chưa có ô nhập (lời kể liên tiếp), nên cho người đọc quyết định nhịp. */
async function say(text, pause = 650, gate = false) {
  const b = new Bubble(); b.push(text);
  let btn = null;
  if (gate && pace === 'tap') {
    clearComposer();
    btn = h('button', { className: 'chip next', textContent: 'Hiện hết', onclick: () => b.skip() });
    composer.append(h('div', { className: 'chips' }, btn));
  }
  await b.end();
  if (btn) {
    await new Promise((res) => { btn.textContent = 'Tiếp ›'; btn.onclick = res; btn.focus({ preventScroll: true }); });
    clearComposer(); await sleep(250);
  } else await sleep(gate ? autoDelay(text) : pause);
}
log.addEventListener('click', () => current?.skip());
const paceBtn = $('#btn-pace');
const showPace = () => { paceBtn.textContent = pace === 'auto' ? '»' : '›'; paceBtn.title = pace === 'auto' ? 'Nhịp: tự động (bấm để chuyển sang chạm Tiếp)' : 'Nhịp: chạm Tiếp (bấm để chuyển sang tự động)'; paceBtn.setAttribute('aria-label', paceBtn.title); };
showPace();
paceBtn.onclick = () => { pace = pace === 'auto' ? 'tap' : 'auto'; try { localStorage.setItem(PACE_KEY, pace); } catch {} showPace(); track('pace_toggle', { mode: pace }); note(pace === 'auto' ? 'Nhịp tự động: My sẽ tự nói tiếp sau mỗi câu.' : 'Nhịp chạm: bạn bấm "Tiếp" khi đã đọc xong.'); };
function showUser(text) { const d = document.createElement('div'); d.className = 'msg me'; d.textContent = text; log.append(d); scrollDown(); }
function note(text) { const d = document.createElement('div'); d.className = 'msg note'; d.textContent = text; log.append(d); scrollDown(); }

// ---------------- ô nhập ----------------
const composer = $('#composer');
function h(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of kids) e.append(k); return e;
}
function clearComposer() { composer.replaceChildren(); }
function chipsRow(items, onPick) {
  const row = h('div', { className: 'chips' });
  for (const it of items) row.append(h('button', { className: 'chip', textContent: it.label ?? it, onclick: () => onPick(it) }));
  return row;
}
/** Hỏi một giá trị. kind: text | date | time | choice */
function ask({ kind = 'text', placeholder = '', chips = [], hint = '', validate }) {
  return new Promise((resolve) => {
    clearComposer();
    const done = (value, label) => { clearComposer(); showUser(label ?? String(value)); resolve(value); };
    if (hint) composer.append(h('div', { className: 'hint', textContent: hint }));
    if (chips.length) composer.append(chipsRow(chips, (c) => done(c.value ?? c, c.label ?? c)));
    if (kind === 'choice') return;
    const input = h('input', { className: 'field', type: kind === 'date' ? 'date' : kind === 'time' ? 'time' : 'text', placeholder, maxLength: 80, autocomplete: 'off' });
    if (kind === 'date') { input.max = new Date().toISOString().slice(0, 10); input.min = '1900-01-01'; }
    const go = h('button', { className: 'send', textContent: '➤', ariaLabel: 'Gửi' });
    const submit = () => {
      const v = input.value.trim(); if (!v) return;
      if (validate && !validate(v)) { input.style.borderColor = '#ff8a8a'; return; }
      const label = kind === 'date' ? v.split('-').reverse().join('/') : kind === 'time' ? `${v}` : v;
      done(v, label);
    };
    go.onclick = submit; input.onkeydown = (e) => e.key === 'Enter' && submit();
    composer.append(h('div', { className: 'row' }, input, go));
    if (matchMedia('(pointer:fine)').matches) input.focus();
  });
}
/** Ô trò chuyện tự do; trả về {text, chip}. */
function askChat(chips = []) {
  return new Promise((resolve) => {
    clearComposer();
    const send = (text, chip = false) => { clearComposer(); resolve({ text, chip }); };
    if (chips.length) composer.append(chipsRow(chips, (c) => send(c.value ?? c, !!c.action)));
    const ta = h('textarea', { className: 'field', rows: 1, placeholder: 'Kể với My…', maxLength: 2000 });
    const go = h('button', { className: 'send', textContent: '➤', ariaLabel: 'Gửi' });
    const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; };
    const submit = () => { const v = ta.value.trim(); if (v) send(v); };
    ta.oninput = grow; go.onclick = submit;
    ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } };
    composer.append(h('div', { className: 'row' }, ta, go));
    if (matchMedia('(pointer:fine)').matches) ta.focus();
  });
}

// ---------------- gọi AI (SSE) ----------------
const CODE_KEY = 'huyenmy.code';
const getCode = () => { try { return localStorage.getItem(CODE_KEY) || ''; } catch { return ''; } };
const setCode = (v) => { try { v ? localStorage.setItem(CODE_KEY, v) : localStorage.removeItem(CODE_KEY); } catch {} };
async function streamChat(phase, onText) {
  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Access-Code': getCode() }, body: JSON.stringify({ phase, profile: S.profile, messages: S.messages, sid: sessionId, minute: Math.round(elapsedMin()) }) });
  if (!res.ok) { const j = await res.json().catch(() => ({})); if (j.needAuth) throw Object.assign(new Error(j.error), { needAuth: true }); if (res.status === 401) { setCode(''); setTimeout(() => location.reload(), 2500); } throw new Error(j.error || 'Không kết nối được tới My.'); }
  const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
      if (!line.startsWith('data:')) continue;
      const o = JSON.parse(line.slice(5));
      if (o.error) throw new Error(o.error);
      if (o.demo) $('#demo-badge').hidden = false;
      if (o.t) onText(o.t);
    }
  }
}
const DEFAULT_EMO = { listen: 'lang_nghe', reading: 'nghiem_tuc', companion: 'chia_se' };
async function aiTurn(phase) {
  busy = true;
  try { return await aiTurnInner(phase); } finally { busy = false; if (limitHit) closeSession(); }
}
async function aiTurnInner(phase) {
  stage.setMood('think'); // suy nghĩ trong lúc chờ
  const b = new Bubble(); let first = true, raw = '';
  try {
    await streamChat(phase, (t) => { if (first) { first = false; stage.emo(DEFAULT_EMO[phase] ?? 'binh_thuong'); } raw += t; b.push(t); });
  } catch (e) {
    if (e.needAuth) { b.push('[[dong_cam]]' + e.message); await b.end(); S.messages.pop(); save(); signupGate('limit'); return false; }
    stage.emo('tran_tro');
    if (!raw) b.push(e.message || 'Đường truyền chập chờn, bạn thử lại giúp My nhé.');
    else b.push('\n\n*(đường truyền bị ngắt giữa chừng)*');
    await b.end();
    if (!raw) { S.messages.pop(); save(); } // bỏ tin nhắn chưa được trả lời để người dùng gửi lại
    return false;
  }
  await b.end();
  S.messages.push({ role: 'assistant', content: stripTags(raw) }); save();
  return true;
}

// ---------------- giới hạn phiên: mỗi buổi tối đa 30 phút, rồi My nghỉ và hẹn lần sau ----------------
const SESSION_MIN = 30, WARN_MIN = 25, COOLDOWN_MIN = 180;
let clockTimer = 0, limitHit = false, closed = false, busy = false;
const elapsedMin = () => (S.sessionStart ? (Date.now() - S.sessionStart) / 60000 : 0);
const hhmm = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
function startClock() {
  if (!S.sessionStart) { S.sessionStart = Date.now(); S.sessions = (S.sessions ?? 0) + 1; save(); }
  closed = limitHit = false; clearInterval(clockTimer);
  const pill = $('#clock'), tick = () => {
    const left = Math.ceil(SESSION_MIN - elapsedMin());
    if (left <= SESSION_MIN - WARN_MIN) { if (pill.hidden) track('warn_shown'); pill.hidden = false; pill.textContent = `Còn ${Math.max(left, 0)}′`; }
    if (left <= 0) { limitHit = true; if (!busy) closeSession(); }
  };
  tick(); clockTimer = setInterval(tick, 15000);
}
/** Những điều My thật sự chưa kể, lấy từ lá số đã tính: mỗi buổi dành một điều cho lần sau. */
function teasers() {
  const c = chart ?? (chart = buildChart(S.profile)), t = distinctiveTraits(S.profile, c), out = [];
  if (c?.tuvi) out.push('cung Quan Lộc và cung Tài Bạch trong Tử Vi của bạn');
  out.push(`năm ${c.thisYear?.year ?? 'nay'} của bạn trong thần số học và Tứ Trụ`);
  if (t[1]) out.push(`nét này trong lá số: ${t[1]}`);
  if (t[2]) out.push(`một nét nữa: ${t[2]}`);
  out.push('cách ngũ hành trong Tứ Trụ của bạn cân bằng với công việc hiện tại');
  return out;
}
async function closeSession() {
  if (closed) return; closed = true; clearInterval(clockTimer); $('#clock').hidden = true;
  clearComposer();
  const list = teasers(), next = list[(S.sessions ?? 1) % list.length];
  const spent = Math.round(elapsedMin() || SESSION_MIN);
  S.teaser = next; S.restUntil = Date.now() + COOLDOWN_MIN * 60000; S.sessionStart = null; save();
  await say(`[[dong_cam]]Đã đến lúc My nghỉ một chút, ${S.profile.nickname}. Mỗi buổi My chỉ trò chuyện tối đa ${SESSION_MIN} phút, để lần nào cũng dành trọn cho bạn.`, 500);
  await say(`[[chiem_nghiem]]Hôm nay ta đã đi được một đoạn. Còn một điều My chưa kể: **${next}**. My để dành cho lần sau, khoảng ${hhmm(S.restUntil)} My lại ngồi đây.`, 500);
  track('session_close', { min: spent });
  await askNps();
  await signupGate('close');
  await say('[[vui]]Trong lúc chờ, bạn thử để ý xem điều gì hôm nay chạm bạn nhất. Hẹn gặp lại.', 300);
  clearComposer(); composer.append(h('div', { className: 'rest' }, h('span', { textContent: `My nghỉ đến ${hhmm(S.restUntil)}` })));
}
function restScreen() {
  track('rest_view');
  $('#veil').classList.remove('gone'); $('#dialog').hidden = true; intro.showStatic();
  $('#veil-actions').replaceChildren(
    h('p', { className: 'tag', textContent: `My đang nghỉ. Hẹn gặp lại lúc ${hhmm(S.restUntil)}.` }),
    ...(S.teaser ? [h('p', { className: 'fine', innerHTML: md(`Lần sau My sẽ kể về **${S.teaser}**.`) })] : []));
}

// ---------------- tài khoản (email), đánh giá, chia sẻ ----------------
async function apiJson(path, method = 'GET', body) {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, ...j };
}
/** Biểu mẫu đăng ký tối giản trong `host`: email, mã 6 số, một ô đồng ý lưu trò chuyện (mặc định không chọn). `done(bool)` khi xong hoặc bỏ qua. */
function buildSignup(host, { title, done, canSkip = true }) {
  host.replaceChildren();
  const msg = h('p', { className: 'su-msg', role: 'alert' });
  const email = h('input', { className: 'field', type: 'email', placeholder: 'Email của bạn', autocomplete: 'email', inputMode: 'email', maxLength: 120, ariaLabel: 'Email' });
  const consent = h('input', { type: 'checkbox', id: 'su-consent' });
  const go = h('button', { className: 'btn primary', textContent: 'Gửi mã vào email' });
  const skip = h('button', { className: 'btn', textContent: 'Để sau', onclick: () => { track('signup_skip'); done(false); } });
  const code = h('input', { className: 'field', placeholder: 'Mã 6 số', autocomplete: 'one-time-code', inputMode: 'numeric', maxLength: 6, ariaLabel: 'Mã xác nhận' });
  const ok = h('button', { className: 'btn primary', textContent: 'Xác nhận' });
  const again = h('button', { className: 'btn', textContent: 'Gửi lại mã' });
  const step1 = () => {
    host.replaceChildren(
      h('p', { className: 'su-title', textContent: title }),
      h('p', { className: 'su-sub', textContent: 'Không cần mật khẩu. My chỉ gửi một mã 6 số để xác nhận email của bạn.' }),
      h('div', { className: 'row' }, email),
      h('label', { className: 'su-consent', htmlFor: 'su-consent' }, consent, h('span', { textContent: 'Cho My nhớ cuộc trò chuyện của mình để tiếp tục trên mọi thiết bị (lưu trên máy chủ, bạn xóa được bất cứ lúc nào). Không chọn thì My chỉ nhớ trên thiết bị này.' })),
      msg, h('div', { className: 'su-actions' }, go, ...(canSkip ? [skip] : [])));
    email.focus();
  };
  const step2 = () => {
    host.replaceChildren(
      h('p', { className: 'su-title', textContent: `My đã gửi mã tới ${email.value.trim()}` }),
      h('p', { className: 'su-sub', textContent: 'Mã có hiệu lực 10 phút. Nếu chưa thấy, bạn xem cả thư mục thư rác nhé.' }),
      h('div', { className: 'row' }, code), msg,
      h('div', { className: 'su-actions' }, ok, again, h('button', { className: 'btn', textContent: 'Đổi email', onclick: () => { msg.textContent = ''; step1(); } })));
    code.focus();
  };
  go.onclick = async () => {
    msg.textContent = ''; go.disabled = true; track('signup_submit');
    const r = await apiJson('/api/auth/request', 'POST', { email: email.value });
    go.disabled = false;
    if (!r.ok) { msg.textContent = r.error || 'Chưa gửi được mã, bạn thử lại nhé.'; return; }
    step2();
  };
  again.onclick = async () => { const r = await apiJson('/api/auth/request', 'POST', { email: email.value }); msg.textContent = r.ok ? 'My đã gửi lại mã.' : (r.error || 'Chưa gửi lại được.'); };
  const verify = async () => {
    msg.textContent = ''; ok.disabled = true;
    const wantsMemory = consent.checked;
    const r = await apiJson('/api/auth/verify', 'POST', { email: email.value, code: code.value, consentMemory: wantsMemory });
    ok.disabled = false;
    if (!r.ok) { msg.textContent = r.error || 'Chưa xác nhận được.'; return; }
    ACCOUNT.user = r.user; track('signup_verified', { isNew: !!r.isNew });
    if (wantsMemory) { ACCOUNT.user.consentMemory = true; scheduleSync(); }
    done(true);
  };
  ok.onclick = verify; code.onkeydown = (e) => e.key === 'Enter' && verify(); email.onkeydown = (e) => e.key === 'Enter' && go.click();
  step1();
}
/** Gắn email sớm, ngay sau điều thú vị đầu tiên: My đề nghị gửi chính điều vừa kể vào hộp thư và nhớ bạn. Không bắt buộc. */
async function earlySignup(lines) {
  if (!ACCOUNT.accounts || ACCOUNT.user) return;
  await say('[[chia_se]]Điều vừa rồi mới là phần mở đầu thôi. Bạn để lại email, My gửi chính những điều vừa kể vào hộp thư và nhớ bạn cho lần gặp sau nhé? Không cần mật khẩu, và bạn bỏ qua cũng không sao.', 300);
  track('signup_view', { why: 'hook' });
  await new Promise((resolve) => {
    clearComposer();
    const host = h('div', { className: 'signup' }); composer.append(host);
    buildSignup(host, {
      title: 'Nhận điều thú vị này qua email',
      done: async (created) => { clearComposer(); if (created) { apiJson('/api/account/hook', 'POST', { lines }).then((r) => note(r.ok ? 'My đã gửi vào email của bạn.' : 'My chưa gửi được email, bạn xem lại sau nhé.')); } resolve(created); },
    });
  });
}
/** Cổng đăng ký sau buổi đầu 30 phút, hoặc khi máy chủ yêu cầu. Trả về promise khi xong hoặc bỏ qua. */
function signupGate(why) {
  if (!ACCOUNT.accounts || ACCOUNT.user) return Promise.resolve(!!ACCOUNT.user);
  track('signup_view', { why });
  return new Promise((resolve) => {
    clearComposer();
    const host = h('div', { className: 'signup' }); composer.append(host);
    buildSignup(host, {
      title: why === 'limit' ? 'Tạo tài khoản để My nhớ bạn và hẹn buổi sau' : 'Giữ lại buổi hôm nay và hẹn lần sau',
      done: async (created) => { clearComposer(); if (created) await say(`[[vui]]Cảm ơn bạn, ${S.profile?.nickname ?? ''}. My đã ghi nhớ bạn. Lần sau My kể tiếp điều đã hứa nhé.`, 300); resolve(created); },
    });
  });
}
async function askNps() {
  await say('[[lang_nghe]]Một câu cuối thôi: bạn có muốn giới thiệu My cho bạn bè không? Chọn từ 0 (không) đến 10 (chắc chắn).', 300);
  const v = await ask({ kind: 'choice', chips: [...Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })), { label: 'Bỏ qua', value: '' }] });
  if (v !== '') track('nps', { value: v });
}
async function askResonance() {
  await say('[[lang_nghe]]Điều My vừa nói có đúng với bạn không? Bạn cứ nói thật, My không phật lòng đâu.', 300);
  const v = await ask({ kind: 'choice', chips: [{ label: 'Rất đúng với mình', value: 3 }, { label: 'Gần đúng', value: 2 }, { label: 'Chưa đúng lắm', value: 1 }, { label: 'Bỏ qua', value: '' }] });
  if (v === '') return;
  track('resonance', { value: v });
  await say(v === 3 ? '[[xuc_dong]]Cảm ơn bạn. Đoạn nào chạm bạn nhất, bạn kể My nghe nhé? My cũng có thể làm một tấm thẻ nhỏ để bạn lưu hoặc gửi bạn bè.' : v === 2 ? '[[suy_nghi]]Cảm ơn bạn. Phần nào chưa thật khớp với bạn? Bạn nói ra, My sẽ soi lại cho đúng hơn.' : '[[dong_cam]]Cảm ơn bạn đã nói thẳng, điều đó quý với My. Phần nào My nói chưa đúng với bạn? Lá số chỉ là tấm gương, và gương có thể soi lệch.', 300);
  if (v === 3) { const c = await ask({ kind: 'choice', chips: [{ label: 'Tạo thẻ chia sẻ', value: 'card' }, { label: 'Để sau', value: '' }] }); if (c === 'card') await doShare(); }
}
async function doShare() {
  const f = pickFamous(S.profile).sameDay[0] ?? pickFamous(S.profile).nearDay[0];
  const r = await shareCard({ nickname: S.profile.nickname, element: chart?.bazi.dayMaster.hanh, trait: hookTrait, famous: f?.name, url: `${location.origin}/?ref=${ACCOUNT.refCode}` });
  track('share_card', { action: r });
  note(r === 'saved' ? 'Thẻ đã được tải về máy bạn.' : r === 'shared' ? 'Đã mở chia sẻ.' : 'Bạn chưa chia sẻ thẻ.');
}
function openAccount() {
  if ($('.modal')) return;
  const close = () => $('.modal')?.remove();
  const card = h('div', { className: 'modal-card', role: 'dialog', ariaLabel: 'Tài khoản' });
  const host = h('div', { className: 'signup' });
  const render = () => {
    card.replaceChildren(h('button', { className: 'icon close', textContent: '×', ariaLabel: 'Đóng', onclick: close }));
    if (!ACCOUNT.user) { card.append(host); buildSignup(host, { title: 'Đăng nhập hoặc đăng ký bằng email', canSkip: false, done: () => render() }); return; }
    const u = ACCOUNT.user;
    card.append(h('p', { className: 'su-title', textContent: u.email }),
      h('p', { className: 'su-sub', textContent: u.consentMemory ? 'My đang lưu cuộc trò chuyện của bạn trên máy chủ để bạn tiếp tục ở mọi thiết bị.' : 'My chỉ nhớ bạn trên thiết bị này.' }),
      h('div', { className: 'su-actions' },
        h('button', { className: 'btn', textContent: u.consentMemory ? 'Tắt lưu và xóa bản đã lưu' : 'Bật lưu cuộc trò chuyện', onclick: async () => { const want = !u.consentMemory; const r = await apiJson('/api/state', 'PUT', want ? { consentMemory: true, state: S } : { consentMemory: false }); if (r.ok || !want) { u.consentMemory = want; } render(); } }),
        h('button', { className: 'btn', textContent: 'Đăng xuất', onclick: async () => { await apiJson('/api/auth/logout', 'POST'); ACCOUNT.user = null; close(); } }),
        h('button', { className: 'btn danger', textContent: 'Xóa tài khoản và dữ liệu', onclick: (e) => { if (e.target.dataset.sure) { apiJson('/api/account/delete', 'POST').then(() => { ACCOUNT.user = null; try { localStorage.removeItem(STORE); } catch {} location.reload(); }); } else { e.target.dataset.sure = '1'; e.target.textContent = 'Bấm lần nữa để xác nhận xóa'; } } })));
  };
  render();
  document.body.append(h('div', { className: 'modal', onclick: (e) => e.target.classList.contains('modal') && close() }, card));
}
$('#btn-account').onclick = openAccount;

// ---------------- hành trình ----------------
const INTRO = [
  '[[vui]]Chào bạn, người lữ khách đã tìm đến đây.',
  '[[chiem_nghiem]]Tôi là Huyền My. Tôi giữ lại những gì còn sót của một dòng truyền thừa xưa: thần số, tinh tượng, âm dương ngũ hành.',
  '[[nghiem_tuc]]My không nói trước điều chưa đến, cũng không nói điều bạn chỉ muốn nghe. [[chia_se]]My chỉ soi lại tấm bản đồ mà trời đất khẽ đặt vào ngày bạn sinh ra, để bạn nhìn mình rõ hơn.',
];

async function collect() {
  S.phase = 'collect'; save();
  await say('[[lang_nghe]]Trước hết, xin cho My biết họ và tên khai sinh của bạn. Mỗi con chữ mang một rung động riêng, nên My cần đúng cái tên cha mẹ đã đặt.');
  const fullName = await ask({ placeholder: 'Họ và tên khai sinh', validate: (v) => v.length >= 2 && /\p{L}/u.test(v) });
  track('intake_step', { step: 'name' });
  const nickname = fullName.trim().split(/\s+/).pop(); // My gọi bằng tên cuối, đỡ một câu hỏi
  await say(`[[e_then]]Rất vui được gặp ${nickname}. [[lang_nghe]]Truyền thống Bát Trạch tính cung mệnh khác nhau theo giới tính khi sinh. Bạn cho My biết, hoặc bỏ qua cũng không sao.`);
  const gender = await ask({ kind: 'choice', chips: [{ label: 'Nữ', value: 'nu' }, { label: 'Nam', value: 'nam' }, { label: 'Không muốn nói', value: 'khac' }] });
  track('intake_step', { step: 'gender' });
  let profile;
  for (;;) {
    await say('[[chia_se]]Ngày tháng năm sinh dương lịch của bạn? Bạn không cần quy ra âm lịch, My sẽ tự đối chiếu theo tiết khí thật của trời đất.');
    const date = await ask({ kind: 'date' });
    const [y, m, d] = date.split('-').map(Number);
    track('intake_step', { step: 'date' });
    await say('[[suy_nghi]]Bạn chào đời lúc mấy giờ? Nếu không nhớ cũng không sao - My sẽ nói rõ phần nào vì thế mà kém chắc chắn, chứ không nói liều.');
    const time = await ask({ kind: 'time', chips: [{ label: 'Không rõ giờ sinh', value: '' }] });
    track('intake_step', { step: 'time' });
    let hour = null, minute = null; if (time) [hour, minute] = time.split(':').map(Number);
    let place = null;
    if (time) {
      await say('[[chiem_nghiem]]Và nơi bạn chào đời? Giờ sinh chỉ có nghĩa khi gắn với một vùng trời.');
      place = await askPlace();
    }
    track('intake_step', { step: 'place' });
    const field = await askField();
    track('intake_step', { step: 'field' });
    try { profile = normalizeProfile({ fullName, nickname, gender, birth: { y, m, d, hour, minute }, place, field }); break; }
    catch (e) { await say(`[[ngac_nhien]]Hình như có điều gì chưa khớp (${e.message}). Mình thử nhập lại ngày giờ sinh nhé.`); }
  }
  S.profile = profile; save();
  track('intake_done', { ageBand: ageBand(profile.birth.y), field: profile.field ?? 'none', hasTime: profile.birth.hour != null, hasPlace: !!profile.place });
  await ritual();
}

/** My lùi về góc trái để chừa chỗ cho phần luận giải. */
function dock() { document.body.classList.add('docked'); }
let hookTrait = null;
async function ritual() {
  const p = S.profile;
  clearComposer(); stage.cast(5.5);
  await say('[[an_ui]]*My khép mắt, đặt hai lòng bàn tay lại gần nhau. Giữa lòng tay, một đốm sáng nhỏ bừng lên…*', 2200);
  chart = buildChart(p);
  stage.setElement(chart.bazi.dayMaster.hanh); $('#btn-chart').hidden = false;
  dock();
  const y = chart.bazi.pillars.year;
  await say(`[[hao_hung]]Xong rồi, ${p.nickname}. Bạn mang tuổi ${y.name}, nạp âm ${chart.bazi.napAmYear.name} (${chart.bazi.napAmYear.image}). Nhật chủ của bạn là hành ${chart.bazi.dayMaster.hanh}. Bạn có thể mở lá số bất cứ lúc nào bằng nút ☯ ở góc phải để xem My đã tính ra sao.`, 650, true);
  // Điểm chung có thật để mở chuyện: cùng ngày sinh, cùng nghề, cùng năm sinh; chọn theo tuổi và lĩnh vực của người dùng.
  const { d, m, y: by } = p.birth;
  const pick = pickFamous(p);
  const one = (e) => `**${e.name}** (${e.gap ? `${e.d}/${e.m}/` : ''}${e.y}, ${e.desc})`;
  const same = pick.sameDay.map(one).join('; '), near = pick.nearDay.map(one).join('; ');
  const plain = (t) => stripTags(t).replace(/\*/g, '');
  const hookLines = [];
  if (same) await say(`[[hao_hung]]Ngày ${d}/${m} này có những người từng chào đời: ${same}.${near ? ` Sát ngày bạn còn có ${near}.` : ''} Ngày sinh không làm nên ai cả, và My không dám nói bạn sẽ giống họ. Nhưng đó là điểm chung có thật để ta bắt đầu.`, 650, true);
  else if (near) await say(`[[hao_hung]]Trong sổ của My chưa có ai trùng đúng ngày ${d}/${m}, nhưng sát ngày bạn có: ${near}. Chỉ là điểm chung nhỏ thôi, không phải số phận.`, 650, true);
  if (same) hookLines.push(plain(`Ngày ${d}/${m} có những người từng chào đời: ${same}.${near ? ` Sát ngày bạn còn có ${near}.` : ''}`)); else if (near) hookLines.push(plain(`Sát ngày ${d}/${m} có: ${near}.`));
  track('hook_shown', { same: pick.sameDay.length, near: pick.nearDay.length, field: !!pick.sameField, year: pick.sameYear.length > 0 });
  const extra = [];
  if (pick.sameField) extra.push(`Bạn làm ở lĩnh vực ${pick.fieldName.toLowerCase()}, và My thấy ${one(pick.sameField)} sinh chỉ cách ngày sinh của bạn ${pick.sameField.gap || 0} ngày. Chuyện trùng hợp ấy làm My tò mò, dù nó không chứng minh điều gì.`);
  if (pick.sameYear.length) extra.push(`Cùng năm ${by} với bạn còn có ${pick.sameYear.map((e) => `**${e.name}** (${e.desc})`).join(' và ')}.`);
  if (extra.length) { await say(`[[chia_se]]${extra.join(' ')}`, 650, true); hookLines.push(plain(extra.join(' '))); }
  hookTrait = distinctiveTraits(p, chart)[0] ?? null;
  if (hookTrait) await say(`[[chiem_nghiem]]Còn trong lá số của bạn, My để ý một nét khá hiếm: **${hookTrait}**. Nét ấy nói điều gì về cách bạn đi đường, My sẽ kể khi bạn muốn nghe.`, 650, true);
  if (hookTrait) hookLines.push(`Nét hiếm trong lá số của bạn: ${hookTrait}.`);
  await earlySignup(hookLines);
  const opener = `[[dong_cam]]Bạn muốn bắt đầu từ đâu, ${p.nickname}? Chạm một gợi ý bên dưới, hoặc cứ kể tự do. My ở đây, và My nghe.`;
  await say(opener, 200);
  S.messages = [{ role: 'assistant', content: stripTags(opener) }]; S.phase = 'listen'; save();
  await converse();
}

const READ_CHIP = { label: 'Mời My luận giải', value: 'Mình đã kể xong rồi. Mời My luận giải giúp mình.', action: 'read' };
const READ_LENS = [
  { label: 'Luận theo Tử Vi', value: 'Mình đã kể xong rồi. Mời My luận giải theo Tử Vi Đẩu Số giúp mình.', action: 'read' },
  { label: 'Luận theo Tứ Trụ', value: 'Mình đã kể xong rồi. Mời My luận giải theo Tứ Trụ giúp mình.', action: 'read' },
  { label: 'Luận theo Chiêm tinh', value: 'Mình đã kể xong rồi. Mời My luận giải theo chiêm tinh phương Tây giúp mình.', action: 'read' },
];
const startChips = () => [
  ...(hookTrait ? [{ label: 'Nghe nét hiếm trong lá số của tôi', value: `Mình muốn nghe trước về nét này trong lá số của mình: ${hookTrait}.`, action: 'read' }] : []),
  { label: 'Chuyện sự nghiệp, tiền bạc', value: 'Mình đang băn khoăn về chuyện sự nghiệp và tiền bạc.' },
  { label: 'Chuyện tình cảm', value: 'Mình muốn nói về chuyện tình cảm của mình.' },
  { label: 'Một chuyện đang làm mình rối', value: 'Dạo này có một chuyện đang làm mình rối.' },
];
const FOLLOW_CHIPS = ['Về con đường sự nghiệp của mình', 'Về chuyện tình cảm', 'Năm nay của mình có gì đáng lưu tâm?', 'Điều đang làm mình rối nhất'];
const LENS_CHIPS = [
  { label: 'Soi theo Tử Vi', value: 'My soi giúp mình theo Tử Vi Đẩu Số nhé.' },
  { label: 'Soi theo Tứ Trụ', value: 'My soi giúp mình theo Tứ Trụ (Bát Tự) nhé.' },
  { label: 'Soi theo Chiêm tinh', value: 'My soi giúp mình theo chiêm tinh phương Tây nhé.' },
  { label: 'Soi theo Thần số học', value: 'My soi giúp mình theo thần số học nhé.' },
  { label: 'Kết hợp tất cả', value: 'My kết hợp các phương pháp để soi giúp mình nhé.' },
];

async function converse() {
  let userTurns = S.messages.filter((m) => m.role === 'user').length;
  for (;;) {
    if (limitHit) return closeSession();
    stage.setMood('listen');
    const chips = S.phase === 'listen' ? (userTurns >= 1 ? [READ_CHIP, ...READ_LENS] : startChips()) : S.phase === 'companion' ? (userTurns <= 2 ? [...FOLLOW_CHIPS, ...LENS_CHIPS] : LENS_CHIPS) : [];
    const { text, chip } = await askChat(chips);
    const sc = userTurns === 0 && S.phase === 'listen' ? startChips().find((c) => c.value === text) : null;
    if (userTurns === 0) track('first_message', { viaChip: !!sc });
    if (sc) track('start_choice', { chip: sc.label });
    showUser(text); S.messages.push({ role: 'user', content: text }); userTurns++;
    track('message_sent', { n: userTurns });
    const reading = S.phase === 'listen' && chip;
    if (reading) { stage.cast(4); track('reading_requested'); }
    save();
    const ok = await aiTurn(reading ? 'reading' : S.phase);
    if (!ok) { userTurns--; continue; }
    if (reading) { S.phase = 'companion'; save(); track('reading_received'); await askResonance(); }
    save();
  }
}

// ---------------- lá số ----------------
const ELC = { Kim: '#f1ead2', Mộc: '#7fe3a0', Thủy: '#6fb7ff', Hỏa: '#ff8a5c', Thổ: '#e0b86a' };
const el = (hanh) => `<span class="${hanh}">${hanh}</span>`;
const cell = (k, v, d = '') => `<div class="cell"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;

function tabTuTru(c) {
  const b = c.bazi;
  const pill = (label, pl, dm) => pl
    ? `<div class="pillar ${dm ? 'dm' : ''}"><div class="lbl">${label}</div><div class="nm">${pl.name}</div><div class="el">${el(pl.hanhCan)} · ${el(pl.hanhChi)}</div></div>`
    : `<div class="pillar"><div class="lbl">${label}</div><div class="nm"> - </div><div class="el">không rõ giờ</div></div>`;
  const max = Math.max(...Object.values(b.elements.counts), 1);
  const bars = HANH.map((k) => `<div class="bar"><span class="${k}">${k}</span><i><b style="width:${(b.elements.counts[k] / max) * 100}%;background:${ELC[k]}"></b></i><span>${b.elements.counts[k]}</span></div>`).join('');
  return `<h3>Tứ Trụ <small>theo tiết khí thật · tầng Tính toán</small></h3>
    <div class="pillars">${pill('Giờ', b.pillars.hour)}${pill('Ngày', b.pillars.day, true)}${pill('Tháng', b.pillars.month)}${pill('Năm', b.pillars.year)}</div>
    <p class="sub" style="margin-top:10px">Nhật chủ <b>${b.dayMaster.can}</b> (${el(b.dayMaster.hanh)}, ${b.dayMaster.yang ? 'dương' : 'âm'}) · sinh tháng ${b.pillars.month.chi}, ${b.elements.inSeason ? 'đắc lệnh' : 'không đắc lệnh'} · thân ${b.elements.strength} <i>(tham khảo)</i><br>Nạp âm năm: <b>${b.napAmYear.name}</b> - ${b.napAmYear.image}${c.cungMenh ? ` · Cung mệnh: <b>${c.cungMenh.name}</b> (${el(c.cungMenh.hanh)}, ${c.cungMenh.nhom})` : ''}</p>
    <h3>Ngũ hành <small>can + chi chính khí</small></h3><div class="bars">${bars}</div>
    <p class="sub" style="margin-top:8px">${b.elements.missing.length ? 'Vắng: ' + b.elements.missing.map(el).join(', ') + '. ' : 'Đủ cả năm hành. '}Trội: ${el(b.elements.dominant)}.${b.elements.balancing.length ? ' Hướng cân bằng gợi ý: ' + b.elements.balancing.map(el).join(' / ') + '.' : ''}</p>`;
}

function tabTuVi(c) {
  const t = c.tuvi;
  if (!t) return `<h3>Tử Vi Đẩu Số</h3><p class="sub">Chưa lập được: cần giờ sinh và giới tính nam/nữ (để xác định chiều đại hạn). Ngày sinh âm lịch của bạn: ${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? ' nhuận' : ''}/${c.lunar.year}.</p>`;
  // Bố cục 4×4 truyền thống: Tỵ Ngọ Mùi Thân / Thìn … Dậu / Mão … Tuất / Dần Sửu Tý Hợi
  const order = [5, 6, 7, 8, 4, null, null, 9, 3, null, null, 10, 2, 1, 0, 11];
  const cellHtml = (pos) => {
    const p = t.palaces[pos];
    const stars = p.chinh.map((s) => `<b class="chinh">${s}</b>`).join('');
    const rest = [...p.phu].map((s) => `<span>${s}</span>`).join('') + p.sat.map((s) => `<span class="sat">${s}</span>`).join('');
    return `<div class="tv ${pos === t.menh ? 'menh' : ''}"><div class="tv-h"><i>${p.can} ${p.chi}</i><em>${p.name}${p.isThan ? ' · Thân' : ''}</em></div>
      <div class="tv-s">${stars || '<span class="dim">vô chính diệu</span>'}</div><div class="tv-o">${rest}</div>
      <div class="tv-f">${p.hoa.map((h) => `<u class="${h.slice(5)}">${h}</u>`).join('')}<span>${p.truongSinh}</span>${p.daiHan ? `<span>${p.daiHan[0]}-${p.daiHan[1]}</span>` : ''}</div></div>`;
  };
  const center = `<div class="tv-c"><h4>${esc(S.profile.nickname)}</h4><p>Âm lịch ${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? ' nhuận' : ''}/${t.lunar.year}<br>${t.lunar.canChiYear}</p><p><b>${t.cuc.ten}</b><br>${t.amDuong}</p><p>Thân cư ${t.thanCu}</p></div>`;
  const grid = order.map((pos, i) => pos === null ? (i === 5 ? center : '') : cellHtml(pos)).join('');
  return `<h3>Tử Vi Đẩu Số <small>âm lịch Việt Nam · tầng Tính toán</small></h3><div class="tv-grid">${grid}</div>
    <p class="sub" style="margin-top:10px">Tứ Hóa năm ${t.lunar.canChiYear.split(' ')[0]}: ${Object.entries(t.hoaAt).map(([h, v]) => `${h} → <b>${v.star}</b> (${t.palaces[v.pos].name})`).join(' · ')}.${t.menhVoChinhDieu ? ' Cung Mệnh vô chính diệu: xem sao cung Thiên Di.' : ''}</p>`;
}

function tabAstro(c) {
  const a = c.astro;
  const rows = a.planets.map((p) => `<tr><td>${p.name}</td><td>${p.sign}${p.uncertain ? ' ?' : ''}</td><td>${p.degree}°${p.retrograde ? ' ℞' : ''}</td><td>${p.house ? 'Nhà ' + p.house : '-'}</td></tr>`).join('');
  return `<h3>Chiêm tinh <small>tropical · astronomy-engine · nhà cung nguyên</small></h3>
    <div class="grid">
      ${cell('Mặt Trời', a.sun.name + (a.sunUncertain ? ' ?' : ''), `${a.sun.element} · ${a.sun.degree}°`)}
      ${cell('Mặt Trăng', a.moon.name + (a.moonUncertain ? ' ?' : ''), a.moonUncertain ? 'thiếu giờ sinh nên chưa chắc' : `${a.moon.element} · ${a.moon.degree}°`)}
      ${cell('Cung mọc', a.asc ? a.asc.name : '-', a.asc ? `${a.asc.element} · ${a.asc.degree}°` : 'cần giờ và nơi sinh')}
    </div>
    <table class="tbl"><thead><tr><th>Thiên thể</th><th>Cung</th><th>Độ</th><th>Nhà</th></tr></thead><tbody>${rows}</tbody></table>
    ${a.aspects.length ? `<p class="sub" style="margin-top:10px">Góc chiếu chặt: ${a.aspects.slice(0, 6).map((x) => `${x.a} ${x.type.toLowerCase()} ${x.b}`).join(' · ')}.</p>` : ''}`;
}

function tabThanSo(c) {
  const n = c.numerology;
  return `<h3>Thần số học <small>Pythagoras · tên bỏ dấu</small></h3><div class="grid">
    ${cell('Chủ đạo', n.lifePath, NUMBER_KEYWORDS[n.lifePath])}${cell('Biểu đạt', n.expression, NUMBER_KEYWORDS[n.expression])}
    ${cell('Linh hồn', n.soul, NUMBER_KEYWORDS[n.soul])}${cell('Nhân cách', n.personality, NUMBER_KEYWORDS[n.personality])}
    ${cell('Năm cá nhân ' + c.thisYear.year, n.personalYear, PERSONAL_YEAR_THEME[n.personalYear])}</div>`;
}

let sheetTab = 'tuvi';
function renderSheet() {
  const p = S.profile, c = chart ?? (chart = buildChart(p)), a = c.astro;
  const tabs = [['tuvi', 'Tử Vi'], ['tutru', 'Tứ Trụ'], ['astro', 'Chiêm tinh'], ['thanso', 'Thần số']];
  const body = { tuvi: tabTuVi, tutru: tabTuTru, astro: tabAstro, thanso: tabThanSo }[sheetTab](c);
  $('#sheet-body').innerHTML = `
    <h2>Lá số của ${esc(p.nickname)}</h2>
    <p class="sub">${esc(p.fullName)} · ${p.birth.d}/${p.birth.m}/${p.birth.y}${p.birth.hour !== null ? ` · ${String(p.birth.hour).padStart(2, '0')}:${String(p.birth.minute).padStart(2, '0')}` : ' · không rõ giờ'}${a.place ? ' · ' + esc(a.place) : ''}</p>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${k === sheetTab ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${body}
    <div class="src"><b>Minh chứng & giới hạn.</b> Các con số được <b>tính</b> bằng thuật toán thiên văn (astronomy-engine) và quy tắc cổ truyền, không do AI đoán; My nhận chúng làm dữ kiện. Ý nghĩa gán cho chúng thuộc tầng <b>truyền thống</b> - một lăng kính biểu tượng. Hiện chưa có bằng chứng khoa học cho thấy ngày giờ sinh quyết định số phận hay dự báo được sự kiện; giá trị của lá số là gợi những câu hỏi đáng hỏi, rồi My đối chiếu với câu chuyện thật của bạn và những khung <b>tâm lý học đã được kiểm chứng</b>.
    <ul>${c.caveats.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  for (const btn of $('#sheet-body').querySelectorAll('[data-tab]')) btn.onclick = () => { sheetTab = btn.dataset.tab; renderSheet(); };
}
const sheet = $('#sheet');
$('#btn-chart').onclick = () => { track('chart_open'); renderSheet(); sheet.hidden = false; };
$('#sheet-close').onclick = () => (sheet.hidden = true);
sheet.onclick = (e) => { if (e.target === sheet) sheet.hidden = true; };
addEventListener('keydown', (e) => e.key === 'Escape' && (sheet.hidden = true));

$('#btn-reset').onclick = () => {
  if (!confirm('Bắt đầu lại từ đầu? Cuộc trò chuyện và hồ sơ trên thiết bị này sẽ được xóa.')) return;
  try { localStorage.removeItem(STORE); } catch {} location.reload();
};

// ---------------- khởi động ----------------
let LOCKED = false, OPEN = true;
async function tryCode(code) {
  const r = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
  if (r.ok) { setCode(code); return null; }
  return (await r.json().catch(() => ({}))).error || 'Chưa mở được, bạn thử lại nhé.';
}
// Máy chủ bật mã truy cập: ô nhập hiện ngay trong màn chào, chỉ vào được sau khi mã đúng (mã đúng được nhớ trên thiết bị).
const urlRef = (new URLSearchParams(location.search).get('ref') ?? '').replace(/[^\w-]/g, '').slice(0, 20);
track('landing_view', { ref: urlRef });
const meReady = fetch('/api/me' + (urlRef ? `?ref=${urlRef}` : '')).then((r) => r.json()).then(async (me) => {
  ACCOUNT = { accounts: !!me.accounts, user: me.user ?? null, refCode: me.refCode ?? '' };
  $('#btn-account').hidden = !ACCOUNT.accounts;
  // Đăng nhập trên thiết bị mới: lấy lại cuộc trò chuyện đã lưu nếu người dùng đã đồng ý.
  if (ACCOUNT.user?.consentMemory && !load()?.profile) {
    const r = await apiJson('/api/state');
    if (r.state?.profile) { try { S = { ...r.state, profile: normalizeProfile(r.state.profile) }; save(); offerResume(); } catch {} }
  }
}).catch(() => {});
const ready = Promise.all([fetch('/api/status').then((r) => r.json()).then(async (s) => {
  $('#demo-badge').hidden = s.ai;
  LOCKED = !!s.locked; OPEN = !LOCKED || (!!getCode() && (await tryCode(getCode())) === null);
}).catch(() => {}), meReady]);
function askCode(then) {
  if ($('.code-box')) return;
  const input = h('input', { type: 'password', className: 'code-input', placeholder: 'Mã truy cập', autocomplete: 'off', ariaLabel: 'Mã truy cập' });
  const msg = h('p', { className: 'code-msg', role: 'alert' });
  const submit = async () => { const err = await tryCode(input.value.trim()); if (err) { msg.textContent = err; return; } OPEN = true; $('.code-box').remove(); then(); };
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#veil-actions').before(h('div', { className: 'code-box' }, h('p', { className: 'code-hint', textContent: 'Phòng này cần mã truy cập.' }), input, h('button', { className: 'btn', textContent: 'Mở cửa', onclick: submit }), msg));
  input.focus();
}

/** Lĩnh vực làm việc: một lần chạm (hoặc bỏ qua), để My chọn người nổi tiếng gần gũi với bạn. */
async function askField() {
  await say('[[chia_se]]Một câu nhẹ thôi: bạn đang làm trong lĩnh vực nào? My sẽ chọn những người cùng đường với bạn để làm quen.');
  const v = await ask({ kind: 'choice', chips: [...FIELD_OPTIONS.map((o) => ({ label: o.label, value: o.key })), { label: 'Khác / bỏ qua', value: '' }] });
  return v || null;
}

/** Nơi sinh: người dùng tự gõ, My đối chiếu với dữ liệu có sẵn rồi hỏi lại cho chắc. Trả về khóa PLACES hoặc null. */
async function askPlace() {
  const unknown = { label: 'Không rõ / sinh ở nước ngoài', value: '' };
  for (;;) {
    const typed = await ask({ placeholder: 'Gõ nơi sinh (xã, huyện, tỉnh hoặc thành phố)', chips: [unknown] });
    if (typed === '') return null;
    const found = findPlaces(typed);
    if (found.length === 1) {
      const name = PLACES[found[0]].name;
      await say(`[[lang_nghe]]Có phải bạn sinh ra ở khu vực **${name}** không? My dùng vị trí trung tâm của nơi này để tính Cung Mọc, sai lệch nhỏ không đáng kể.`);
      const yes = await ask({ kind: 'choice', chips: [{ label: 'Đúng rồi', value: 'yes' }, { label: 'Không phải, nhập lại', value: 'no' }, unknown] });
      if (yes === 'yes') return found[0];
      if (yes === '') return null;
      continue;
    }
    if (found.length > 1) {
      await say('[[suy_nghi]]Trong dữ liệu của My có mấy nơi gần với chữ bạn gõ. Ý bạn là nơi nào?');
      const pick = await ask({ kind: 'choice', chips: [...found.map((k) => ({ label: PLACES[k].name, value: k })), { label: 'Nơi khác, nhập lại', value: 'no' }, unknown] });
      if (pick === 'no') continue;
      return pick || null;
    }
    await say('[[an_ui]]My chưa có nơi này trong dữ liệu. Bạn gõ giúp My tên tỉnh hoặc thành phố (hay thị xã lớn) gần nơi bạn sinh nhất nhé, vị trí chỉ cần xấp xỉ.');
  }
}

async function enter(resume) {
  track(resume ? 'resume_click' : 'enter_click');
  if (resume && (S.sessions ?? 0) >= 1) track('return_visit', { n: S.sessions });
  await ready;
  if (!OPEN) return askCode(() => enter(resume));
  if (resume && S.restUntil && Date.now() < S.restUntil) return restScreen();
  if (resume && S.restUntil) { S.restUntil = null; save(); }
  intro.release(); $('#veil').classList.add('gone'); $('#dialog').hidden = false;
  await sleep(900);
  if (resume) {
    chart = buildChart(S.profile); stage.setElement(chart.bazi.dayMaster.hanh); $('#btn-chart').hidden = false; dock();
    for (const m of S.messages) { if (m.role === 'assistant') { const b = new Bubble(true); b.push(m.content); b.end(); } else showUser(m.content); }
    note('- My vẫn ở đây -');
    await say(S.teaser ? `[[vui]]Chào mừng ${S.profile.nickname} trở lại. Lần trước My hẹn kể về **${S.teaser}**. Bạn muốn nghe luôn, hay có điều gì mới muốn nói trước?` : `[[vui]]Chào mừng ${S.profile.nickname} trở lại. Ta tiếp tục từ chỗ đang dở nhé.`, 300);
    if (S.teaser) { S.teaser = null; save(); }
    startClock();
    return converse();
  }
  S.phase = 'intro'; stage.emo('binh_thuong'); startClock();
  for (const line of INTRO) await say(line, 900, true);
  await collect();
}

function offerResume() {
  $('#veil-actions').replaceChildren(
    h('button', { className: 'btn primary', textContent: `Tiếp tục cùng ${S.profile.nickname}`, onclick: () => enter(true) }),
    h('button', { className: 'btn', textContent: 'Bắt đầu lại', onclick: () => { try { localStorage.removeItem(STORE); } catch {} S = { profile: null, messages: [], phase: 'intro' }; location.reload(); } }));
  if (S.restUntil && Date.now() < S.restUntil) restScreen();
}
const saved = load();
if (saved?.profile && saved.messages?.length && ['listen', 'companion'].includes(saved.phase)) {
  try { S = { ...saved, profile: normalizeProfile(saved.profile) }; offerResume(); } catch { $('#enter').onclick = () => enter(false); }
} else $('#enter').onclick = () => enter(false);
