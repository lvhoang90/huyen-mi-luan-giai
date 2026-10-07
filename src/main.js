import './pwa.js';
import './style.css';
import { createCharacter } from './character.js';
import { createBackdrop } from './backdrop.js';
import { track, sessionId, ageBand } from './track.js';
import { icon } from './icons.js';
import { hourFrom, describeHour, PERIODS } from './engine/birthtime.js';
import { vnDay, parseCardIds, topicLabel } from './tarot/ids.js';
import { shouldNudge, nudgeShown, nudgeSkipped, nudgeAccepted, NUDGE_KEY } from './nudge.js';
import { mountLogo } from './logo.js';
import { createIntro } from './intro.js';
import { endedWithFarewell, clarifyResume } from './resume.js';
import { GREETS, GV } from './greetings.js';
import { sound } from './sound.js';
import { parseTagged, stripTags, extractSuggestions } from './emotion-tags.js';
import { normalizeProfile, buildChart, PLACES, findPlaces, distinctiveTraits, famousStory, pickFamous, FIELD_OPTIONS } from './engine/index.js';

const $ = (s) => document.querySelector(s);
// Phần tạo ảnh chia sẻ (khá nặng) nạp lúc rảnh, không chặn màn chào; khi bấm chia sẻ thì thường đã có sẵn.
let shareMod = null; const loadShare = () => (shareMod ??= import('./share.js'));
if ('requestIdleCallback' in window) requestIdleCallback(() => loadShare(), { timeout: 8000 }); else setTimeout(loadShare, 4000);
const STORE = 'huyenmy.v1';
const character = createCharacter($('#char'));
const backdrop = createBackdrop($('#stage'), $('#wheel'));
mountLogo($('#veil-logo'), 'hero'); mountLogo($('#brand'), 'compact');
const intro = createIntro({ veil: $('#veil'), area: $('#stage-area'), setEmo: (n) => character.setEmotion(n), poke: (x, y) => character.poke(x, y), variant: GV, greeting: () => { const nick = load()?.profile?.nickname; return nick ? `Chào mừng ${nick} trở lại` : GREETS[GV].veil(); } });
const sndBtn = $('#snd'), sndTop = $('#btn-sound');
for (const el of document.querySelectorAll('[data-ic]')) el.outerHTML = icon(el.dataset.ic); // biểu tượng của các nút tĩnh trong index.html
const showSnd = () => { const t = sound.on ? 'Tắt nhạc nền' : 'Bật nhạc nền'; sndBtn.innerHTML = `${icon(sound.on ? 'soundOn' : 'soundOff')} <span class="snd-t">${sound.on ? 'Nhạc nền: bật' : 'Nhạc nền: tắt'}</span>`; sndTop.innerHTML = icon(sound.on ? 'soundOn' : 'soundOff'); sndTop.classList.toggle('on', sound.on); sndTop.title = t; sndTop.setAttribute('aria-label', t); for (const b of [sndBtn, sndTop]) b.setAttribute('aria-pressed', String(sound.on)); };
const toggleSnd = () => { sound.set(!sound.on); showSnd(); track('sound_toggle', { on: sound.on }); };
showSnd(); sndBtn.onclick = toggleSnd; sndTop.onclick = toggleSnd;
window.__introStarted = true; requestAnimationFrame(() => intro.start());
console.info('%cHuyền My Luận Giải 1.0%c © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.', 'color:#e2c27d;font-weight:700', 'color:inherit');
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
/** Tài khoản quản trị tự có nút cài đặt ở thanh trên để vào trang quản trị. */
const showAdmin = () => { const a = document.getElementById('btn-admin'); if (a) a.hidden = ACCOUNT.user?.role !== 'admin'; };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} scheduleSync(); };
/** Người dùng đã đăng nhập và đồng ý lưu: đẩy trạng thái lên máy chủ (chỉ hồ sơ, tin nhắn và nhịp buổi), gom 8 giây một lần. */
function scheduleSync() {
  if (!ACCOUNT.user?.consentMemory || !S.profile) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushState, 8000);
}
// Cờ báo: vừa đăng nhập lại và nạp xong bản đã lưu, nên vào thẳng cuộc trò chuyện, không bắt bấm "Tiếp tục".
const AUTORESUME = 'huyenmy.autoresume';
const pushState = () => { if (ACCOUNT.user?.consentMemory && S.profile) fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: S }), keepalive: true }).catch(() => {}); };
// Đóng tab hoặc chuyển ứng dụng trong lúc còn chờ 8 giây: đẩy ngay để thiết bị khác không thấy bản cũ.
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && syncTimer) { clearTimeout(syncTimer); syncTimer = 0; pushState(); } });
addEventListener('pagehide', () => { if (syncTimer) { clearTimeout(syncTimer); syncTimer = 0; pushState(); } });
/** Lấy lại cuộc trò chuyện đã lưu trên máy chủ nếu nó đầy đủ hơn bản trên thiết bị này. Trả về true khi đã thay trạng thái. */
async function restoreFromServer() {
  const r = await apiJson('/api/state');
  if (!r.state?.profile) return false;
  const local = load();
  if (local?.profile && (local.messages?.length ?? 0) >= (r.state.messages?.length ?? 0)) return false;
  try { S = { ...r.state, profile: normalizeProfile(r.state.profile) }; } catch { return false; }
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {}
  return true;
}
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } };
let chart = null;

// ---------------- hiển thị văn bản ----------------
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')}</p>`).join('');
const log = $('#log');
// Cuộn khi My đang nói: lời ngắn thì giữ ở cuối khung; lời dài hơn khung thì giữ ĐẦU lời đó ở trên cùng để người đọc đọc từ đầu
// và tự cuộn xuống (không đẩy chữ lên liên tục). Người đọc vừa tự cuộn thì không kéo nữa. Nút "Còn nữa" báo còn chữ phía dưới.
let hold = false;
for (const ev of ['wheel', 'touchmove']) log.addEventListener(ev, () => { hold = true; }, { passive: true });
const moreBtn = $('#more');
const updateMore = () => { moreBtn.hidden = log.scrollHeight - log.scrollTop - log.clientHeight <= 56; };
log.addEventListener('scroll', updateMore, { passive: true });
try { new ResizeObserver(updateMore).observe(log); } catch {} // khung đổi cỡ (ô nhập hiện ra, xoay máy) mà không có sự kiện cuộn
moreBtn.onclick = () => { hold = true; log.scrollBy({ top: Math.round(log.clientHeight * 0.8), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
const scrollDown = () => { hold = false; log.scrollTop = log.scrollHeight; updateMore(); };
function follow(el) {
  if (!hold) {
    if (el.offsetHeight <= log.clientHeight - 16) log.scrollTop = log.scrollHeight;
    else log.scrollTop = el.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop - 6;
  }
  updateMore();
}

// Huyền My chỉ trò chuyện bằng chữ: miệng mấp máy theo từng chữ hiện ra, không dùng giọng đọc.
let typing = false;
const syncSpeaking = () => stage.setSpeaking(typing);

// ---------------- bong bóng của Huyền My (gõ chữ dần) ----------------
let current = null; // bong bóng đang gõ dở: chạm vào để hiện hết
class Bubble {
  constructor(instant = false) {
    this.el = document.createElement('div'); this.el.className = 'msg my' + (instant ? '' : ' typing');
    log.append(this.el); hold = false; this.raw = ''; this.shown = 0; this.fired = 0; this.ended = false; this.instant = instant; this.talking = false; this.rush = false; this.finished = false;
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
    this.el.innerHTML = md(t); follow(this.el);
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
const showPace = () => { paceBtn.innerHTML = icon(pace === 'auto' ? 'paceAuto' : 'paceTap'); paceBtn.title = pace === 'auto' ? 'Nhịp: tự động (bấm để chuyển sang chạm Tiếp)' : 'Nhịp: chạm Tiếp (bấm để chuyển sang tự động)'; paceBtn.setAttribute('aria-label', paceBtn.title); };
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
    const hintEl = h('div', { className: 'hint', textContent: hint }); if (hint) composer.append(hintEl);
    if (chips.length) composer.append(chipsRow(chips, (c) => done(c.value ?? c, c.label ?? c)));
    if (kind === 'choice') return;
    // Ngày và giờ nhập bằng ô số thường: hộp chọn ngày gốc của trình duyệt trong Zalo/Facebook có thể làm trang bị nạp lại giữa chừng.
    const num = (ph, len, label) => h('input', { className: 'field num', type: 'text', inputMode: 'numeric', pattern: '[0-9]*', placeholder: ph, maxLength: len, autocomplete: 'off', ariaLabel: label, size: len });
    const fields = kind === 'date' ? [num('Ngày', 2, 'Ngày sinh'), num('Tháng', 2, 'Tháng sinh'), num('Năm', 4, 'Năm sinh')] : kind === 'time' ? [num('Giờ', 2, 'Giờ sinh (0-23, hoặc 1-12 kèm buổi)'), num('Phút', 2, 'Phút sinh')] : [];
    // Giờ sinh: hàng chọn buổi để người nhập "1 giờ 20" biết rõ là sáng, trưa, chiều hay tối (mặc định: giờ 24).
    let period = 'h24'; const periodRow = kind === 'time' ? h('div', { className: 'periods', role: 'group', ariaLabel: 'Buổi trong ngày' }, ...PERIODS.map(([k, l]) => h('button', { type: 'button', className: 'chip' + (k === period ? ' on' : ''), textContent: l, ariaPressed: String(k === period), onclick: (e) => { period = k; for (const b of periodRow.children) { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); } } }))) : null;
    if (periodRow) composer.append(periodRow);
    const input = fields[0] ?? h('input', { className: 'field', type: 'text', placeholder, maxLength: 80, autocomplete: 'off', ariaLabel: placeholder || 'Câu trả lời của bạn' });
    const go = h('button', { className: 'send', innerHTML: icon('send'), ariaLabel: 'Gửi' });
    const p2 = (v) => String(v).padStart(2, '0');
    const bad = (el) => { el.style.borderColor = '#ff8a8a'; };
    const submit = () => {
      fields.forEach((f) => (f.style.borderColor = ''));
      if (kind === 'date') {
        const [d, m, y] = fields.map((f) => +f.value), now = new Date().getFullYear();
        if (!(d >= 1 && d <= 31)) return bad(fields[0]); if (!(m >= 1 && m <= 12)) return bad(fields[1]); if (!(y >= 1900 && y <= now)) return bad(fields[2]);
        return done(`${y}-${p2(m)}-${p2(d)}`, `${p2(d)}/${p2(m)}/${y}`);
      }
      if (kind === 'time') {
        if (fields.every((f) => !f.value)) return;
        const [hh, mm] = fields.map((f) => +f.value || 0);
        if (!(mm >= 0 && mm <= 59)) return bad(fields[1]);
        let h24; try { h24 = hourFrom(hh, period); } catch (e) { bad(fields[0]); hintEl.textContent = e.userMessage ?? 'Giờ chưa hợp lệ.'; return; }
        return done(`${p2(h24)}:${p2(mm)}`, describeHour(h24, mm, period));
      }
      const v = input.value.trim(); if (!v) return;
      if (validate && !validate(v)) { input.style.borderColor = '#ff8a8a'; return; }
      done(v, v);
    };
    go.onclick = submit;
    const all = fields.length ? fields : [input];
    all.forEach((f, i) => {
      f.onkeydown = (e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Backspace' && !f.value && i) all[i - 1].focus(); }; // không để trả về false: sẽ chặn mọi phím gõ
      if (fields.length) f.oninput = () => { f.value = f.value.replace(/\D/g, ''); if (f.value.length >= f.maxLength && all[i + 1]) all[i + 1].focus(); };
    });
    composer.append(h('div', { className: 'row' }, ...all, go));
    if (matchMedia('(pointer:fine)').matches) input.focus();
  });
}
/** Ô trò chuyện tự do; trả về {text, chip}. */
function askChat(chips = []) {
  return new Promise((resolve) => {
    clearComposer();
    const send = (text, chip = false) => { injectAsk = null; clearComposer(); resolve({ text, chip }); };
    injectAsk = (text) => send(text);
    if (pendingAsk) { const t = pendingAsk; pendingAsk = null; setTimeout(() => send(t), 0); } // câu hỏi bấm từ hình lá số khi My đang bận
    if (chips.length) composer.append(chipsRow(chips, (c) => send(c.value ?? c, c.action ?? false)));
    const ta = h('textarea', { className: 'field', rows: 1, placeholder: 'Kể với My…', maxLength: 2000, ariaLabel: 'Kể với My' });
    const go = h('button', { className: 'send', innerHTML: icon('send'), ariaLabel: 'Gửi' });
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
// Câu hỏi cuối cùng My đã hỏi trước khi người dùng rời đi (rút gọn), để nhắc lại khi họ quay về và đáp "ok"
const lastAsk = (msgs) => {
  const a = [...msgs].reverse().find((m) => m.role === 'assistant'); if (!a) return '';
  const parts = stripTags(a.content).replace(/\s+/g, ' ').split(/(?<=[.?!])\s+/).filter(Boolean);
  const q = [...parts].reverse().find((x) => x.includes('?')) ?? parts.at(-1) ?? '';
  return q.slice(0, 200);
};
let resumeGreet = null; // { at: số tin nhắn lúc chào, text }
// Buổi trước kết thúc bằng lời tạm biệt? Khi người dùng quay lại và đáp ngắn "ok", đó là muốn bắt đầu lại, không phải chào tạm biệt tiếp.
let resumeChips = null; // lựa chọn hiện ngay sau lời chào quay lại, để không phải đoán ý người dùng
/** Lịch sử gửi cho My. Tin ngắn đầu tiên ("ok") sau lời chào quay lại được nói rõ ý, vì lịch sử có thể vẫn kết thúc bằng lời tạm biệt; màn hình và bộ nhớ vẫn giữ đúng chữ người dùng gõ. */
const apiMessages = () => clarifyResume(S.messages, resumeGreet);
async function streamChat(phase, onText) {
  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Access-Code': getCode() }, body: JSON.stringify({ phase, profile: S.profile, messages: apiMessages(), sid: sessionId, minute: Math.round(elapsedMin()), lens: S.lens ?? null, resumeGreet: resumeGreet && S.messages.length === resumeGreet.at + 1 ? resumeGreet.text : null, resumeLast: resumeGreet && S.messages.length === resumeGreet.at + 1 ? resumeGreet.last : null, tarot: S.tarot && S.messages.filter((m) => m.role === 'user').length <= 6 ? S.tarot : null, tarotTopic: S.tarot && S.messages.filter((m) => m.role === 'user').length <= 6 ? (S.tarotTopic ?? null) : null }) });
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

// Báo cáo câu trả lời của My (Google Play yêu cầu ứng dụng dùng AI tạo lời phải có cách báo cáo ngay trong ứng dụng). Chỉ gửi lý do và giai đoạn, không gửi nội dung trò chuyện.
const REPORT_REASONS = [['khong_phu_hop', 'Không phù hợp'], ['sai_su_that', 'Sai sự thật'], ['gay_lo_so', 'Làm mình lo sợ'], ['khac', 'Lý do khác']];
function addReport(b) {
  const box = h('div', { className: 'rep-box' }), btn = h('button', { className: 'rep', type: 'button', title: 'Báo cáo câu trả lời này', innerHTML: `${icon('flag')}<span>Báo cáo</span>` });
  box.append(btn); b.el.append(box);
  const done = () => box.replaceChildren(h('span', { className: 'rep-q', textContent: 'Cảm ơn bạn. My ghi nhận để cải thiện, và không gửi kèm nội dung cuộc trò chuyện.' }));
  btn.onclick = () => box.replaceChildren(h('span', { className: 'rep-q', textContent: 'Câu trả lời này có vấn đề gì?' }),
    ...REPORT_REASONS.map(([k, l]) => h('button', { className: 'chip sm', type: 'button', textContent: l, onclick: () => { track('ai_report', { reason: k, phase: S.phase ?? '' }); done(); } })),
    h('button', { className: 'rep', type: 'button', textContent: 'Hủy', onclick: () => box.replaceChildren(btn) }));
}
let suggestions = []; // gợi ý trả lời do chính My đưa ra ở lượt vừa rồi (chỉ khi hợp ngữ cảnh)
async function aiTurnInner(phase) {
  suggestions = [];
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
  addReport(b);
  suggestions = extractSuggestions(raw);
  S.messages.push({ role: 'assistant', content: stripTags(raw) }); save();
  return true;
}

// ---------------- giới hạn phiên: mỗi buổi tối đa 30 phút, rồi My nghỉ và hẹn lần sau ----------------
const SESSION_MIN = 30, WARN_MIN = 25, COOLDOWN_MIN = 45, AWAY_MIN = 20; // vắng quá AWAY_MIN phút thì buổi cũ coi như đã khép, lần quay lại là một buổi mới trọn vẹn
let clockTimer = 0, limitHit = false, closed = false, busy = false;
// Chỉ tính thời gian My và bạn thật sự trò chuyện (tab đang mở và có thao tác gần đây), không tính lúc bạn rời đi.
const elapsedMin = () => (S.sessionStart ? (S.activeMs ?? 0) / 60000 : 0);
let lastInput = Date.now(), lastTick = Date.now();
for (const ev of ['pointerdown', 'keydown', 'touchstart', 'input']) addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true });
function accrue() {
  const n = Date.now(), dt = Math.min(n - lastTick, 10_000); lastTick = n;
  if (document.hidden || !S.sessionStart) return;
  if (busy || n - lastInput < 120_000) { S.activeMs = (S.activeMs ?? 0) + dt; S.lastActive = n; }
}
const hhmm = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
function startClock() {
  // Quay lại sau khi vắng lâu: buổi cũ đã khép, mở buổi mới. Quay lại sớm hơn: tiếp tục buổi cũ với phần thời gian còn lại.
  if (S.sessionStart && S.lastActive && (Date.now() - S.lastActive) / 60000 > AWAY_MIN) S.sessionStart = null;
  if (!S.sessionStart) { S.sessionStart = Date.now(); S.activeMs = 0; S.sessions = (S.sessions ?? 0) + 1; }
  S.lastActive = Date.now(); lastTick = lastInput = Date.now(); save();
  closed = limitHit = false; clearInterval(clockTimer);
  const pill = $('#clock'); let n = 0;
  const tick = () => {
    accrue();
    const left = Math.ceil(SESSION_MIN - elapsedMin());
    if (left <= SESSION_MIN - WARN_MIN) { if (pill.hidden) track('warn_shown'); pill.hidden = false; pill.textContent = `Còn ${Math.max(left, 0)}′`; }
    if (left <= 0) { limitHit = true; if (!busy) closeSession(); }
    if (++n % 6 === 0) { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} } // lưu cục bộ mỗi 30 giây, không đồng bộ lên máy chủ
  };
  tick(); clockTimer = setInterval(tick, 5000);
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
  await askMood('end');
  const nps = await askNps(); if (nps !== '' && nps != null) await askWhy('nps', nps);
  await offerZalo('close');
  await offerUpgrade('close');
  await signupGate('close');
  await say('[[vui]]Trong lúc chờ, bạn thử để ý xem điều gì hôm nay chạm bạn nhất. Hẹn gặp lại.', 300);
  clearComposer(); watchRest(composer, async () => { S.restUntil = null; save(); startClock(); await say(`[[vui]]Chào ${S.profile.nickname}, My nghỉ xong rồi. ${S.teaser ? `Hôm nay My kể về **${S.teaser}** nhé, hay bạn có điều gì muốn nói trước?` : 'Bạn muốn kể gì với My?'}`, 300); S.teaser = null; save(); converse(); });
}
/** Hiển thị thời gian nghỉ còn lại và tự mở lối quay lại ngay khi hết giờ: không bắt người dùng phải làm mới trang để biết đã được nói tiếp. */
function watchRest(host, onBack) {
  const label = h('span', { className: 'rest-label' }), btn = h('button', { className: 'btn primary', textContent: 'Gặp lại My', hidden: true });
  const upd = () => {
    const left = Math.ceil((S.restUntil - Date.now()) / 60000);
    if (left > 0) { label.textContent = `My nghỉ thêm khoảng ${left} phút nữa (đến ${hhmm(S.restUntil)}). Bạn cứ để trang đó, hết giờ nút gặp lại sẽ hiện.`; return; }
    clearInterval(timer); label.textContent = 'My nghỉ xong rồi.'; btn.hidden = false; track('rest_over');
  };
  btn.onclick = () => { clearInterval(timer); onBack(); };
  const timer = setInterval(upd, 20000); host.replaceChildren(h('div', { className: 'rest' }, label, btn)); upd();
}
/** Màn nghỉ được vẽ trước khi trạng thái máy chủ về, nên nút Zalo được thêm vào sau nếu cần. */
function paintRestZalo() {
  const host = document.querySelector('#veil-actions .rest:last-child');
  if (!host) return;
  if (ZALO && !host.querySelector('.rest-zalo')) host.append(h('button', { className: 'btn sm rest-zalo', textContent: 'Vào nhóm Zalo của My', onclick: () => openZalo('rest') }));
  if (UPG && !host.querySelector('.rest-upg')) host.append(upgradeButton('rest'));
}
function restScreen() {
  track('rest_view');
  $('#veil').classList.remove('gone'); $('#dialog').hidden = true; intro.showStatic();
  const box = h('div');
  $('#veil-actions').replaceChildren(box, ...(S.teaser ? [h('p', { className: 'fine', innerHTML: md(`Lần sau My sẽ kể về **${S.teaser}**.`) })] : []));
  const viewChart = h('button', { className: 'btn sm', textContent: 'Xem lại lá số của bạn (không cần đăng nhập)', onclick: () => { track('static_view', { via: 'rest' }); sheetTab = 'tomtat'; renderSheet(); sheet.hidden = false; } });
  $('#veil-actions').append(h('div', { className: 'rest' }, viewChart));
  paintRestZalo();
  watchRest(box, () => enter(true));
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
  const consent = h('input', { type: 'checkbox' });
  const remind = h('input', { type: 'checkbox' });
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
      h('label', { className: 'su-consent' }, consent, h('span', { textContent: 'Cho My nhớ cuộc trò chuyện của mình: lần sau chỉ cần nhập email là My đưa bạn về đúng chỗ đang dở, kể cả trên máy khác, không hỏi lại từ đầu (lưu trên máy chủ, bạn xóa được bất cứ lúc nào). Không chọn thì My chỉ nhớ trên thiết bị này.' })),
      h('label', { className: 'su-consent' }, remind, h('span', { textContent: 'Gửi cho mình một email nhắc nhẹ khi đến lúc kể tiếp (tối đa một thư mỗi tuần, hủy được bất cứ lúc nào). Không chọn thì My không gửi gì ngoài mã đăng nhập.' })),
      h('p', { className: 'su-legal' }, 'Khi tiếp tục, bạn đồng ý với ', h('a', { href: '/terms.html', target: '_blank', rel: 'noopener', textContent: 'Điều khoản' }), ' và ', h('a', { href: '/privacy.html', target: '_blank', rel: 'noopener', textContent: 'Chính sách quyền riêng tư' }), '.'),
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
    const r = await apiJson('/api/auth/verify', 'POST', { email: email.value, code: code.value, consentMemory: wantsMemory, remind: remind.checked });
    ok.disabled = false;
    if (!r.ok) { msg.textContent = r.error || 'Chưa xác nhận được.'; return; }
    ACCOUNT.user = r.user; showAdmin(); track('signup_verified', { isNew: !!r.isNew });
    // Tài khoản cũ đăng nhập trên thiết bị mới: nạp lại hồ sơ và cuộc trò chuyện đã lưu, không hỏi lại từ đầu. Phải xong trước khi máy này kịp ghi đè bản đã lưu.
    if (!r.isNew && r.user.consentMemory && await restoreFromServer()) { msg.textContent = 'My nhận ra bạn rồi, đang đưa bạn về đúng chỗ đang dở…'; try { sessionStorage.setItem(AUTORESUME, '1'); } catch {} setTimeout(() => location.reload(), 500); return; }
    if (wantsMemory) { ACCOUNT.user.consentMemory = true; scheduleSync(); }
    done(true);
  };
  ok.onclick = verify; code.onkeydown = (e) => { if (e.key === 'Enter') verify(); }; email.onkeydown = (e) => { if (e.key === 'Enter') go.click(); };
  step1();
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
const MOODS = [['Nặng nề', 1], ['Hơi chùng', 2], ['Bình thường', 3], ['Khá nhẹ', 4], ['Nhẹ nhõm', 5]];
/** Tự đánh giá tâm trạng bằng một lần chạm (không bắt buộc). Ba thời điểm: đầu buổi, giữa buổi, cuối buổi, để quản trị đo được lòng người nhẹ đi hay nặng thêm. */
async function askMood(phase) {
  const lead = { start: 'Trước khi bắt đầu, hôm nay bạn đang thấy trong người thế nào? Chạm một ô, hoặc bỏ qua cũng được.', mid: 'Hỏi nhỏ một chút thôi: lúc này lòng bạn thấy thế nào so với lúc mới đến?', end: 'Trước khi nghỉ, lòng bạn đang thấy thế nào? Chỉ để My biết mình có làm bạn nhẹ đi chút nào không.' }[phase];
  await say(`[[lang_nghe]]${lead}`, 300);
  const v = await ask({ kind: 'choice', chips: [...MOODS.map(([label, value]) => ({ label, value })), { label: 'Bỏ qua', value: '' }] });
  if (v !== '') track('mood_check', { phase, value: v });
  return v;
}
async function askNps() {
  await say('[[lang_nghe]]Một câu cuối thôi: bạn có muốn giới thiệu My cho bạn bè không? Chọn từ 0 (không) đến 10 (chắc chắn).', 300);
  const v = await ask({ kind: 'choice', chips: [...Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })), { label: 'Bỏ qua', value: '' }] });
  if (v !== '') track('nps', { value: v });
  return v;
}
/** Hỏi lý do (không bắt buộc) và xin phép trích dẫn ẩn danh: đây là nguồn đánh giá thật để giới thiệu My, người dùng quyết định phần nào được dùng. */
async function offerZalo(via) {
  if (!ZALO) return;
  await say('[[vui]]Nếu bạn thích, My có một nhóm Zalo: nơi nhận lời nhắc nhẹ, góp ý cho My và trao đổi về lá số. Không bắt buộc nhé.', 300);
  const v = await ask({ kind: 'choice', chips: [{ label: 'Mở nhóm Zalo', value: 'open' }, { label: 'Để sau', value: '' }] });
  if (v === 'open') openZalo(via);
}
async function askWhy(kind, rating) {
  await say('[[lang_nghe]]Nếu bạn muốn, kể My nghe vì sao bạn chọn như vậy: điều gì làm bạn thích, hoặc còn thiếu gì. Một hai câu thôi, bỏ qua cũng được.', 300);
  const text = await ask({ placeholder: 'Vì sao bạn chọn như vậy?', chips: [{ label: 'Bỏ qua', value: '' }] });
  if (!text) return;
  await say('[[vui]]Cảm ơn bạn. Một câu nữa thôi: My có được trích lời bạn khi giới thiệu My tới người khác không? Bạn chọn cách ghi, và My chỉ dùng đúng phần bạn cho phép.', 300);
  const q = await ask({ kind: 'choice', chips: [{ label: 'Được, ẩn danh', value: 'anon' }, { label: `Được, ghi "${S.profile.nickname}"`, value: 'name' }, { label: 'Không, chỉ để My đọc', value: '' }] });
  const r = await apiJson('/api/feedback', 'POST', { kind, rating: Number(rating), text, quoteOk: !!q, display: q === 'name' ? S.profile.nickname : '' }).catch(() => ({ ok: false }));
  if (r.ok) { track('feedback_text', { kind, quote: q || 'no' }); await say('[[xuc_dong]]My đã ghi lại. Cảm ơn bạn nhiều.', 300); }
  else note(r.error || 'Chưa gửi được góp ý, bạn thử lại sau nhé.');
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
  const { shareCard, shareMessage } = await loadShare();
  const f = pickFamous(S.profile).sameDay[0] ?? pickFamous(S.profile).nearDay[0];
  const r = await shareCard({ nickname: S.profile.nickname, element: chart?.bazi.dayMaster.hanh, trait: hookTrait, famous: f?.name, url: `${location.origin}/?ref=${ACCOUNT.refCode}` });
  track('share_card', { action: r });
  note(shareMessage(r) || 'Bạn chưa chia sẻ thẻ.');
}
function openAccount() {
  if (ACCOUNT.user) { location.href = '/goc-cua-toi'; return; } // đã đăng nhập: vào thẳng Góc của tôi
  if ($('.modal')) return;
  const close = () => $('.modal')?.remove();
  const card = h('div', { className: 'modal-card', role: 'dialog', ariaLabel: 'Tài khoản' });
  const host = h('div', { className: 'signup' });
  const render = () => {
    card.replaceChildren(h('button', { className: 'icon close', innerHTML: icon('close'), ariaLabel: 'Đóng', title: 'Đóng', onclick: close }));
    if (!ACCOUNT.user) { card.append(host); buildSignup(host, { title: 'Đăng nhập hoặc đăng ký bằng email', canSkip: false, done: () => render() }); return; }
    close(); // đã đăng nhập: không còn gì để hiện ở đây, Góc của tôi mở bằng nút tài khoản
  };
  render();
  document.body.append(h('div', { className: 'modal', onclick: (e) => { if (e.target.classList.contains('modal')) close(); } }, card));
}
$('#btn-account').onclick = openAccount;
if (/[?&]login=1/.test(location.search)) setTimeout(() => { if (!ACCOUNT.user) openAccount(); }, 900);
$('#veil-login').onclick = () => { track('login_click', { where: 'landing' }); openAccount(); };

// ---------------- hành trình ----------------
const INTRO = () => GREETS[GV].intro();

/** Dịch vụ dành cho người từ đủ 16 tuổi. Người dưới 16 chỉ tiếp tục khi có cha mẹ hoặc người giám hộ đồng ý. Trả về false nếu dừng. */
async function ageGate(y, m, d) {
  const n = new Date(); let age = n.getFullYear() - y; if (n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) age--;
  if (age >= 16) return true;
  track('age_gate', { ageBand: ageBand(y) });
  await say('[[dong_cam]]My cần dừng lại một chút. Dịch vụ này dành cho người từ đủ 16 tuổi. Nếu bạn chưa đủ 16, My chỉ trò chuyện tiếp khi có cha mẹ hoặc người giám hộ biết, đồng ý và ở cạnh bạn. Có người lớn đang đồng hành cùng bạn không?');
  const ok = await ask({ kind: 'choice', chips: [{ label: 'Có, người giám hộ đồng ý và ở cạnh mình', value: 'yes' }, { label: 'Không có', value: 'no' }] });
  track('age_gate_answer', { ok: ok === 'yes' });
  if (ok === 'yes') return true;
  await say('[[an_ui]]Không sao đâu. Khi nào có người lớn cùng bạn, hoặc khi bạn đủ 16 tuổi, My rất vui được gặp lại. Chúc bạn một ngày dễ chịu.');
  clearComposer(); composer.append(h('div', { className: 'rest' }, h('span', { textContent: 'Hẹn gặp lại bạn khi đủ điều kiện.' })));
  return false;
}
async function collect() {
  S.phase = 'collect'; const D = (S.draft ??= {}); save();
  // Hồ sơ điền dở được lưu từng bước: nếu trang bị nạp lại giữa chừng (hay xảy ra trong trình duyệt của Zalo), My nối tiếp đúng chỗ, không hỏi lại.
  const keep = (k, v) => { D[k] = v; save(); return v; };
  if (D.fromExplore && D.fullName) { track('explore_handoff'); await say(`[[vui]]Chào bạn. My đã nhận thông tin bạn vừa điền ở trang Khám phá, mình đi tiếp từ đó nhé, bạn không phải nhập lại.`, 300); }
  else if (D.fullName) await say('[[vui]]Chào bạn quay lại. My nhớ bạn đang điền dở, mình nối tiếp ngay từ chỗ đó nhé, không phải nhập lại.', 300);
  else await say('[[lang_nghe]]Trước hết, xin cho My biết họ và tên khai sinh của bạn. Mỗi con chữ mang một rung động riêng, nên My cần đúng cái tên cha mẹ đã đặt.');
  const fullName = D.fullName ?? keep('fullName', await ask({ placeholder: 'Họ và tên khai sinh', validate: (v) => v.length >= 2 && /\p{L}/u.test(v) }));
  if (!D.nameTracked) { track('intake_step', { step: 'name' }); D.nameTracked = true; }
  const nickname = fullName.trim().split(/\s+/).pop(); // My gọi bằng tên cuối, đỡ một câu hỏi
  if (D.gender === undefined) {
    await say(`[[e_then]]Rất vui được gặp ${nickname}. [[lang_nghe]]Truyền thống Bát Trạch tính cung mệnh khác nhau theo giới tính khi sinh. Bạn cho My biết, hoặc bỏ qua cũng không sao.`);
    keep('gender', await ask({ kind: 'choice', chips: [{ label: 'Nữ', value: 'nu' }, { label: 'Nam', value: 'nam' }, { label: 'Không muốn nói', value: 'khac' }] }));
    track('intake_step', { step: 'gender' });
  }
  const gender = D.gender;
  let profile;
  for (;;) {
    if (!D.date) {
      await say('[[chia_se]]Ngày tháng năm sinh dương lịch của bạn? Bạn không cần quy ra âm lịch, My sẽ tự đối chiếu theo tiết khí thật của trời đất.');
      keep('date', await ask({ kind: 'date' })); track('intake_step', { step: 'date' });
    }
    const [y, m, d] = D.date.split('-').map(Number);
    if (!D.ageOk) { if (!(await ageGate(y, m, d))) { delete D.date; save(); return; } keep('ageOk', true); }
    if (D.time === undefined) {
      await say('[[suy_nghi]]Bạn chào đời lúc mấy giờ? Nếu không nhớ cũng không sao - My sẽ nói rõ phần nào vì thế mà kém chắc chắn, chứ không nói liều.');
      keep('time', await ask({ kind: 'time', hint: 'Bạn nhập giờ theo cách quen nói rồi chọn buổi: ví dụ 1 giờ 20, chọn Sáng (khuya) hay Trưa hay Chiều. Hoặc chọn "24 giờ" và nhập 13:20.', chips: [{ label: 'Không rõ giờ sinh', value: '' }, { label: 'Không chắc sáng hay tối', value: '' }] })); track('intake_step', { step: 'time' });
    }
    let hour = null, minute = null; if (D.time) [hour, minute] = D.time.split(':').map(Number);
    if (D.place === undefined) {
      let place = null;
      if (D.time) {
        await say('[[chiem_nghiem]]Và nơi bạn chào đời? Giờ sinh chỉ có nghĩa khi gắn với một vùng trời.');
        place = await askPlace();
      }
      keep('place', place); track('intake_step', { step: 'place' });
    }
    if (D.field === undefined) { keep('field', await askField()); track('intake_step', { step: 'field' }); }
    try { profile = normalizeProfile({ fullName, nickname, gender, birth: { y, m, d, hour, minute }, place: D.place, field: D.field }); break; }
    catch (e) { await say(`[[ngac_nhien]]Hình như có điều gì chưa khớp (${e.message}). Mình thử nhập lại ngày giờ sinh nhé.`); delete D.date; delete D.ageOk; delete D.time; delete D.place; delete D.field; save(); }
  }
  S.profile = profile; delete S.draft; save();
  track('intake_done', { ageBand: ageBand(profile.birth.y), gender: profile.gender ?? 'khac', field: profile.field ?? 'none', hasTime: profile.birth.hour != null, hasPlace: !!profile.place });
  await askMood('start');
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
  await say(`[[hao_hung]]Xong rồi, ${p.nickname}. Bạn mang tuổi ${y.name}, nạp âm ${chart.bazi.napAmYear.name} (${chart.bazi.napAmYear.image}). Nhật chủ của bạn là hành ${chart.bazi.dayMaster.hanh}. Bạn có thể mở lá số bất cứ lúc nào bằng nút radar (hình sao sáu cạnh) ở góc phải để xem My đã tính ra sao.`, 650, true);
  // Điểm chung có thật để mở chuyện: MỘT người nổi tiếng gần gũi, cùng ngày hoặc sát ngày sinh, kèm điểm chung trong lá số (nhật chủ, số chủ đạo, tuổi), rồi hỏi lại một câu.
  const story = famousStory(p, chart);
  if (story) { await say(`[[hao_hung]]${story.text}`, 650, true); S.famousShown = story.name; }
  else await say(`[[binh_thuong]]Trong sổ của My chưa có ai trùng ngày sinh với bạn. Cũng không sao, ta đi thẳng vào chuyện của bạn.`, 650, true);
  track('hook_shown', { found: !!story, ties: story?.ties?.length ?? 0, n: story?.n ?? 0 });
  note('Hình lá số của bạn nằm ở nút hình sao sáu cạnh (radar) ở góc trên bên phải. Bạn bấm xem bất cứ lúc nào để theo dõi cùng My.');
  hookTrait = distinctiveTraits(p, chart)[0] ?? null;
  if (hookTrait) await say(`[[chiem_nghiem]]Còn trong lá số của bạn, My để ý một nét khá hiếm: **${hookTrait}**. Nét ấy nói điều gì về cách bạn đi đường, My sẽ kể khi bạn muốn nghe.`, 650, true);
  const opener = `[[dong_cam]]Bạn muốn bắt đầu từ đâu, ${p.nickname}? Chạm một gợi ý bên dưới, hoặc cứ kể tự do. My ở đây, và My nghe.`;
  await say(opener, 200);
  S.messages = [{ role: 'assistant', content: stripTags(opener) }]; S.phase = 'listen'; save();
  await converse();
}

const READ_CHIP = { label: 'Mời My luận giải', value: 'Mình đã kể xong rồi. Mời My luận giải giúp mình.', action: 'read' };
let cardById = () => null; // dữ liệu 78 lá chỉ nạp khi người dùng đến từ trang Tarot
const wantCards = () => import('./tarot/cards.js').then((m) => { cardById = m.cardById; });
const tarotChip = () => { const t = (S.tarot ?? []).map(cardById).filter(Boolean); return t.length ? [{ label: `Nói về lá ${t.map((c) => c.name).join(', ')}`, value: `Mình vừa rút Tarot ${t.length > 1 ? 'ba lá' : 'lá'} ${t.map((c) => c.name).join(', ')}${topicLabel(S.tarotTopic) ? `, mình đang nghĩ về chuyện ${topicLabel(S.tarotTopic).toLowerCase()}` : ''}. My nói giúp mình nhé.` }] : []; };
const startChips = () => [
  ...tarotChip(),
  ...(S.famousShown ? [{ label: 'Còn ai nổi tiếng cùng ngày sinh nữa?', value: 'Còn ai nổi tiếng sinh cùng ngày hoặc sát ngày sinh với mình nữa không, My kể thử xem?' }] : []),
  ...(hookTrait ? [{ label: 'Nghe nét hiếm trong lá số của tôi', value: `Mình muốn nghe trước về nét này trong lá số của mình: ${hookTrait}.`, action: 'read' }] : []),
  { label: 'Chuyện sự nghiệp, tiền bạc', value: 'Mình đang băn khoăn về chuyện sự nghiệp và tiền bạc.' },
  { label: 'Chuyện tình cảm', value: 'Mình muốn nói về chuyện tình cảm của mình.' },
  { label: 'Một chuyện đang làm mình rối', value: 'Dạo này có một chuyện đang làm mình rối.' },
];
// Lăng kính để soi tiếp: chỉ hiện đúng một lần, ngay sau lần luận giải đầu, để người dùng biết còn lựa chọn khác.
/** Trước khi luận giải, hỏi người dùng quen cách xem nào để My chỉ dùng đúng một hệ và nói đúng ngôn ngữ của họ. */
async function askLens(early = false) {
  if (S.lens || S.lensAsked) return;
  S.lensAsked = true; save();
  await say(early
    ? '[[lang_nghe]]Trước khi mình trò chuyện, một câu thôi nhé: bạn quen xem lá số theo cách nào nhất? My sẽ nghiêng về đúng cách ấy và dùng đúng từ bạn đã quen. Muốn đổi lúc nào cũng được.'
    : '[[lang_nghe]]Trước khi My nói, một câu thôi nhé: bạn quen với cách xem nào nhất? My sẽ chỉ dùng đúng cách ấy cho dễ theo dõi, bạn muốn đổi lúc nào cũng được.', 300);
  const v = await ask({ kind: 'choice', chips: [
    { label: 'Tử Vi', value: 'tuvi' }, { label: '12 cung', value: 'cung12' }, { label: 'Thời vận (năm, tháng)', value: 'thoivan' },
    { label: 'Tứ Trụ (Bát Tự)', value: 'tutru' }, { label: 'Chiêm tinh', value: 'astro' }, { label: 'Thần số học', value: 'thanso' },
    { label: 'Mình chưa biết gì, My nói đơn giản thôi', value: 'none' }, ...(early ? [{ label: 'Để My chọn giúp', value: '' }] : []),
  ] });
  if (v) { S.lens = v; save(); track('lens_pick', { lens: v, via: early ? 'early' : 'ask' }); }
}
// Cách xem người dùng chọn quyết định tab mở đầu của hình lá số, để hình và lời My nói cùng một ngôn ngữ.
const LENS_TAB = { tuvi: 'tuvi', tutru: 'tutru', astro: 'astro', thanso: 'thanso', cung12: 'cung12', thoivan: 'thoivan' };
const openTab = () => LENS_TAB[S.lens] ?? 'tomtat';
const CHART_CHIP = { label: 'Xem hình lá số', value: '', action: 'chart' };
const LENS_CHIPS = [
  CHART_CHIP,
  { lens: 'tuvi', label: 'Soi thêm theo Tử Vi', value: 'My soi giúp mình theo Tử Vi Đẩu Số nhé.' },
  { lens: 'cung12', label: 'Soi thêm theo 12 cung', value: 'My soi giúp mình theo 12 cung, từng lĩnh vực một nhé.' },
  { lens: 'thoivan', label: 'Soi thêm theo thời vận', value: 'My soi giúp mình theo thời vận, năm nay và những tháng tới nhé.' },
  { lens: 'tutru', label: 'Soi thêm theo Tứ Trụ', value: 'My soi giúp mình theo Tứ Trụ (Bát Tự) nhé.' },
  { lens: 'astro', label: 'Soi thêm theo Chiêm tinh', value: 'My soi giúp mình theo chiêm tinh phương Tây nhé.' },
  { lens: 'thanso', label: 'Soi thêm theo Thần số học', value: 'My soi giúp mình theo thần số học nhé.' },
];
/** Nút gợi ý theo ngữ cảnh: lượt đầu có lối vào; còn lại chỉ là gợi ý do My tự đưa ra khi hợp, không có thì để trống cho người dùng tự nói. */
function contextChips(userTurns, justRead) {
  if (resumeChips) { const c = resumeChips; resumeChips = null; return c; } // ngay sau lời chào quay lại
  const mine = suggestions.map((t) => ({ label: t, value: t }));
  if (S.phase === 'listen') return userTurns === 0 ? startChips() : [...mine, ...(userTurns >= 3 ? [READ_CHIP] : []), CHART_CHIP]; // đã kể đủ nhiều thì mới nhắc có thể mời luận giải
  if (S.phase === 'companion') return justRead ? LENS_CHIPS : mine;
  return [];
}

async function converse() {
  if (!S.sessionStart) startClock(); // người mới: đồng hồ chỉ chạy từ lúc bắt đầu trò chuyện, không tính thời gian điền hồ sơ
  let justRead = false;
  let userTurns = S.messages.filter((m) => m.role === 'user').length;
  if (S.phase === 'listen' && userTurns === 0) await askLens(true); // hỏi sớm, ngay sau bước điền hồ sơ, để mọi lời My nói sau đó theo đúng cách người dùng quen
  for (;;) {
    if (limitHit) return closeSession();
    stage.setMood('listen');
    const chips = contextChips(userTurns, justRead); justRead = false;
    const { text, chip } = await askChat(chips);
    if (chip === 'chart') { track('chart_open', { via: 'chip' }); sheetTab = openTab(); renderSheet(); sheet.hidden = false; continue; } // chỉ mở hình lá số, không gửi tin nhắn
    const picked = LENS_CHIPS.find((c) => c.lens && c.value === text); if (picked) { S.lens = picked.lens; track('lens_pick', { lens: picked.lens, via: 'chip' }); }
    const sc = userTurns === 0 && S.phase === 'listen' ? startChips().find((c) => c.value === text) : null;
    if (userTurns === 0) track('first_message', { viaChip: !!sc });
    if (sc) track('start_choice', { chip: sc.label });
    showUser(text); S.messages.push({ role: 'user', content: text }); userTurns++;
    track('message_sent', { n: userTurns });
    const reading = S.phase === 'listen' && chip === 'read';
    if (reading) { stage.cast(4); track('reading_requested'); await askLens(); }
    save();
    const ok = await aiTurn(reading ? 'reading' : S.phase);
    if (!ok) { userTurns--; continue; }
    if (reading) { S.phase = 'companion'; justRead = true; suggestions = []; save(); track('reading_received'); await askResonance(); }
    else if (userTurns === 8 && !S.moodMid) { S.moodMid = true; save(); await askMood('mid'); }
    save();
  }
}

// ---------------- lá số (vẽ bằng chart-view.js, dùng chung với trang Khám phá mẫu) ----------------
let sheetTab = 'tomtat';
const sheetState = { tab: 'tomtat' };
let injectAsk = null, pendingAsk = null; // câu hỏi bấm từ hình lá số: gửi thẳng vào ô trò chuyện, hoặc giữ lại tới khi ô trò chuyện sẵn sàng
const canAsk = () => ['listen', 'companion'].includes(S.phase) && !closed && !limitHit && !S.restUntil;
function askFromSheet(text) {
  sheet.hidden = true;
  if (injectAsk) injectAsk(text);
  else { pendingAsk = text; note('My ghi nhớ câu hỏi của bạn, nói xong My trả lời ngay.'); }
}
async function chartShare(mode) {
  const { shareChart, shareMessage } = await loadShare();
  const c = chart ?? (chart = buildChart(S.profile));
  const url = ACCOUNT.refCode ? `${location.origin}/?ref=${ACCOUNT.refCode}` : location.origin; // liên kết giới thiệu: người mới vào qua đây được ghi nhận nguồn
  const r = await shareChart({ nickname: S.profile.nickname, chart: c, url }, mode);
  track('share_card', { action: r, via: 'chart', mode });
  return shareMessage(r);
}
let chartView = null; // bảng lá số và phần giải thích chỉ nạp khi người dùng mở lá số, để màn chào nhanh hơn trên mạng chậm
async function renderSheet() {
  const p = S.profile, c = chart ?? (chart = buildChart(p));
  sheetState.tab = sheetTab;
  const { renderChart } = (chartView ??= await import('./chart-view.js'));
  renderChart($('#sheet-body'), {
    profile: p, chart: c, state: sheetState, track,
    ask: canAsk() ? askFromSheet : null, cta: canAsk() ? '' : 'My đang nghỉ hoặc chưa sẵn sàng; khi My quay lại, bạn bấm hỏi tiếp nhé.',
    onShare: chartShare,
    onRate: ({ year, value }) => track('resonance_time', { value, ago: new Date().getFullYear() - year }),
    onLeapRule: (rule) => { S.profile = { ...S.profile, leapRule: rule }; chart = buildChart(S.profile); save(); sheetTab = sheetState.tab; renderSheet(); }, // giữ nguyên tab đang xem
  });
  sheetTab = sheetState.tab;
}
let ZALO = ''; // liên kết nhóm hoặc OA Zalo do máy chủ cấu hình (ZALO_URL), trống thì không hiện
// ---- thử giá (UPGRADE_TEST=on): chưa có thanh toán, nói rõ gói chưa mở bán; chỉ đo xem người ta có quan tâm và thấy giá thế nào ----
let UPG = null; // danh sách mức giá (đồng mỗi tháng) do máy chủ đưa ra
const UPV_KEY = 'huyenmy.upv';
const upgradePrice = () => {
  if (!UPG) return null; let i = NaN; try { i = +localStorage.getItem(UPV_KEY); } catch {}
  if (!(i >= 0 && i < UPG.length)) { i = Math.floor(Math.random() * UPG.length); try { localStorage.setItem(UPV_KEY, String(i)); } catch {} }
  return UPG[i];
};
const money = (n) => `${n.toLocaleString('vi-VN')}đ`;
function openUpgrade(where, price) {
  if ($('.modal')) return;
  const v = price / 1000, close = () => $('.modal')?.remove();
  track('upgrade_open', { v, where });
  const card = h('div', { className: 'modal-card upg', role: 'dialog', ariaLabel: 'Gói Đồng hành' });
  const x = h('button', { className: 'icon close', innerHTML: icon('close'), ariaLabel: 'Đóng', title: 'Đóng', onclick: close });
  const plan = (key, label, sub) => h('button', { className: 'btn primary upg-plan', onclick: () => { track('upgrade_click', { v, where, plan: key }); feel(); } }, h('b', { textContent: label }), h('span', { textContent: sub }));
  const feel = () => {
    card.replaceChildren(x, h('p', { className: 'su-title', textContent: 'Cảm ơn bạn.' }),
      h('p', { className: 'su-sub', textContent: 'Gói này chưa mở bán nên My chưa thu của bạn đồng nào. Việc bạn bấm giúp My biết có nên mở hay không. Khi mở, My sẽ báo ngay trên trang này.' }),
      h('p', { className: 'su-sub', textContent: `Một câu hỏi nhỏ: với bạn, ${money(price)} mỗi tháng là mức giá…` }),
      h('div', { className: 'chips' }, ...[['Rẻ', 1], ['Hợp lý', 2], ['Hơi đắt', 3], ['Quá đắt', 4]].map(([l, val]) => h('button', { className: 'chip', textContent: l, onclick: () => { track('upgrade_feel', { v, value: val }); close(); } })), h('button', { className: 'chip', textContent: 'Bỏ qua', onclick: close })));
  };
  card.append(x, h('p', { className: 'su-title', textContent: 'Gói Đồng hành' }), h('p', { className: 'upg-tag', textContent: 'Sắp mở · hiện chưa thu tiền' }),
    h('p', { className: 'su-sub', textContent: 'Dự kiến gồm: gặp My nhiều buổi mỗi ngày mà không phải chờ, và My nhớ cuộc trò chuyện của bạn nếu bạn đồng ý. Lá số, 12 cung, thời vận và buổi đầu tiên vẫn miễn phí.' }),
    h('div', { className: 'upg-plans' }, plan('month', `${money(price)} mỗi tháng`, 'trả theo tháng'), plan('year', `${money(price * 10)} mỗi năm`, 'tương đương 10 tháng')),
    h('p', { className: 'su-sub', textContent: 'Bấm chọn gói nghĩa là bạn quan tâm, chưa có khoản thanh toán nào.' }));
  document.body.append(h('div', { className: 'modal', onclick: (e) => { if (e.target.classList.contains('modal')) close(); } }, card));
}
function upgradeButton(where) {
  const p = upgradePrice(); if (!p) return null;
  track('upgrade_view', { v: p / 1000, where });
  return h('button', { className: 'btn sm rest-upg', textContent: 'Gặp My ngay, xem gói Đồng hành (sắp mở)', onclick: () => openUpgrade(where, p) });
}
async function offerUpgrade(where) {
  const p = upgradePrice(); if (!p) return;
  await say('[[chia_se]]Hiện My miễn phí. My đang cân nhắc một gói để bạn gặp My thoải mái hơn mà không phải chờ giữa các buổi. Bạn có muốn xem thử không? Chưa thu tiền gì cả.', 300);
  track('upgrade_view', { v: p / 1000, where });
  const c = await ask({ kind: 'choice', chips: [{ label: 'Xem gói', value: 'open' }, { label: 'Để sau', value: '' }] });
  if (c === 'open') openUpgrade(where, p);
}
const openZalo = (via) => { track('zalo_click', { via }); window.open(ZALO, '_blank', 'noopener'); };
const sheet = $('#sheet');
$('#btn-chart').onclick = () => { track('chart_open'); sheetTab = openTab(); renderSheet(); sheet.hidden = false; };
$('#sheet-close').onclick = () => (sheet.hidden = true);
sheet.onclick = (e) => { if (e.target === sheet) sheet.hidden = true; };
addEventListener('keydown', (e) => e.key === 'Escape' && (sheet.hidden = true));

function resetAll() {
  if (!confirm('Bắt đầu lại từ đầu? Cuộc trò chuyện và hồ sơ trên thiết bị này sẽ được xóa.')) return;
  try { localStorage.removeItem(STORE); } catch {} location.reload();
}
$('#sheet-reset').onclick = resetAll; // nút nhỏ ở cuối bảng lá số, tránh bấm nhầm

// ---------------- khởi động ----------------
let LOCKED = false, OPEN = true;
async function tryCode(code) {
  const r = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
  if (r.ok) { setCode(code); return null; }
  return (await r.json().catch(() => ({}))).error || 'Chưa mở được, bạn thử lại nhé.';
}
// Máy chủ bật mã truy cập: ô nhập hiện ngay trong màn chào, chỉ vào được sau khi mã đúng (mã đúng được nhớ trên thiết bị).
const urlRef = (new URLSearchParams(location.search).get('ref') ?? '').replace(/[^\w-]/g, '').slice(0, 20);
// Lá Tarot vừa rút ở trang /tarot (liên kết "Hỏi My về lá bài này"): My biết người dùng vừa rút lá nào để nói đúng chuyện đó.
const urlTarot = parseCardIds(new URLSearchParams(location.search).get('tarot')), urlTopic = topicLabel(new URLSearchParams(location.search).get('chu')) ? new URLSearchParams(location.search).get('chu') : null;
track('landing_view', { ref: urlRef, gv: GV });
try { const nav = performance.getEntriesByType('navigation')[0]; if (nav && nav.type !== 'navigate') track('page_reload', { type: nav.type, step: load()?.phase ?? 'new' }); } catch {}
const meReady = fetch('/api/me' + (urlRef ? `?ref=${urlRef}` : '')).then((r) => r.json()).then(async (me) => {
  ACCOUNT = { accounts: !!me.accounts, user: me.user ?? null, refCode: me.refCode ?? '' };
  $('#btn-account').hidden = !ACCOUNT.accounts; showAdmin();
  $('#veil-login').hidden = !ACCOUNT.accounts || !!ACCOUNT.user;
  // Đăng nhập trên thiết bị mới: lấy lại cuộc trò chuyện đã lưu nếu người dùng đã đồng ý.
  if (ACCOUNT.user?.consentMemory && await restoreFromServer()) { offerResume(); enter(true); } // thiết bị mới đã đăng nhập sẵn: vào thẳng đúng phiên (không await: enter chờ chính promise này)
}).catch(() => {});
const ready = Promise.all([fetch('/api/status').then((r) => r.json()).then(async (s) => {
  $('#demo-badge').hidden = s.ai; ZALO = s.zalo || ''; UPG = Array.isArray(s.upgrade) && s.upgrade.length ? s.upgrade : null; paintRestZalo();
  LOCKED = !!s.locked; OPEN = !LOCKED || (!!getCode() && (await tryCode(getCode())) === null);
}).catch(() => {}), meReady]);
function askCode(then) {
  if ($('.code-box')) return;
  const input = h('input', { type: 'password', className: 'code-input', placeholder: 'Mã truy cập', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, ariaLabel: 'Mã truy cập' });
  input.setAttribute('autocorrect', 'off');
  const eye = h('button', { type: 'button', className: 'btn', textContent: 'Hiện mã', onclick: () => { input.type = input.type === 'password' ? 'text' : 'password'; eye.textContent = input.type === 'password' ? 'Hiện mã' : 'Ẩn mã'; } });
  const msg = h('p', { className: 'code-msg', role: 'alert' });
  const submit = async () => { const err = await tryCode(input.value.trim()); if (err) { msg.textContent = err; return; } OPEN = true; $('.code-box').remove(); then(); };
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#veil-actions').before(h('div', { className: 'code-box' }, h('p', { className: 'code-hint', textContent: 'Phòng này cần mã truy cập.' }), input, h('button', { className: 'btn', textContent: 'Mở cửa', onclick: submit }), eye, msg));
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

// Nhắc khéo xem Tarot cho người quay lại, trước khi vào khung chat (tối đa mỗi ngày một lần, thưa dần nếu bạn bỏ qua; xem src/nudge.js)
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
function tarotNudge() {
  const today = vnDay(), nudge = lsGet(NUDGE_KEY);
  if (!shouldNudge({ daily: lsGet('huyenmy.tarotdaily'), nudge, today })) return Promise.resolve(false);
  lsSet(NUDGE_KEY, nudgeShown(nudge, today)); track('tarot_nudge', { action: 'shown' });
  return new Promise((resolve) => {
    const done = (go) => { back.remove(); resolve(go); };
    const back = h('div', { className: 'nudge-back', role: 'dialog', ariaLabel: 'Tarot hôm nay' }, h('div', { className: 'nudge' },
      h('div', { className: 'nd-card', innerHTML: icon('tarot') }),
      h('h2', { textContent: 'Hôm nay bạn có muốn xem Tarot không?' }),
      h('p', { textContent: 'Mỗi ngày một lá, như một câu hỏi nhỏ để soi mình. Chỉ mất chưa đầy một phút.' }),
      h('div', { className: 'nd-acts' },
        h('a', { className: 'btn primary', href: '/tarot', textContent: 'Rút lá hôm nay', onclick: () => { lsSet(NUDGE_KEY, nudgeAccepted(today)); track('tarot_nudge', { action: 'accept' }); } }),
        h('button', { type: 'button', className: 'nd-later', textContent: 'Để sau, vào trò chuyện với My', onclick: () => { lsSet(NUDGE_KEY, nudgeSkipped(lsGet(NUDGE_KEY), today)); track('tarot_nudge', { action: 'later' }); done(false); } }))));
    document.body.append(back);
  });
}

for (const a of document.querySelectorAll('[data-where]')) a.addEventListener('click', () => track('tarot_cta', { where: a.dataset.where }));
try { if (lsGet('huyenmy.tarotdaily')?.day !== vnDay()) $('#btn-tarot').classList.add('new'); } catch {}

async function enter(resume, { nudge = true } = {}) {
  track(resume ? 'resume_click' : 'enter_click');
  if (resume && (S.sessions ?? 0) >= 1) track('return_visit', { n: S.sessions });
  await ready;
  if (!OPEN) return askCode(() => enter(resume));
  if (resume && S.restUntil && Date.now() < S.restUntil) return restScreen();
  if (resume && S.restUntil) { S.restUntil = null; save(); }
  if (resume && nudge && !urlTarot.length && await tarotNudge()) return; // đã đi xem Tarot
  intro.release(); $('#veil').classList.add('gone'); $('#dialog').hidden = false;
  await sleep(900);
  if (resume) {
    chart = buildChart(S.profile); stage.setElement(chart.bazi.dayMaster.hanh); $('#btn-chart').hidden = false; dock();
    for (const m of S.messages) { if (m.role === 'assistant') { const b = new Bubble(true); b.push(m.content); b.end(); } else showUser(m.content); }
    note('- My vẫn ở đây -');
    const farewell = endedWithFarewell(S.messages);
    const greet = S.teaser ? `[[vui]]Chào mừng ${S.profile.nickname} trở lại. Lần trước My hẹn kể về **${S.teaser}**. Bạn muốn nghe luôn, hay có điều gì mới muốn nói trước?` : farewell ? `[[vui]]Chào mừng ${S.profile.nickname} trở lại. Mình bắt đầu lại nhé: bạn muốn tiếp tục chuyện đang dở, hay nói một chuyện mới?` : `[[vui]]Chào mừng ${S.profile.nickname} trở lại. Ta tiếp tục từ chỗ đang dở nhé.`;
    resumeChips = [...(S.teaser ? [{ label: 'Nghe điều My hẹn', value: `Mình muốn nghe luôn điều My hẹn kể: ${S.teaser.replace(/\*/g, '')}.` }] : [{ label: 'Tiếp tục chuyện đang dở', value: 'Mình quay lại rồi, mình muốn tiếp tục chuyện đang dở lúc nãy.' }]), { label: 'Nói một chuyện mới', value: 'Mình quay lại rồi, mình muốn nói một chuyện mới.' }];
    await say(greet, 300);
    resumeGreet = { at: S.messages.length, text: stripTags(greet), last: lastAsk(S.messages) }; // lời chào chỉ hiện trên màn hình; báo cho AI để tin ngắn đầu tiên ("ok") được hiểu là đáp lại lời chào
    if (S.teaser) { S.teaser = null; save(); }
    startClock();
    return converse();
  }
  S.phase = 'intro'; stage.emo('binh_thuong');
  if (S.draft?.fullName) return collect(); // điền dở từ lần trước: bỏ qua lời chào, nối tiếp luôn
  for (const line of INTRO()) await say(line, 900, true);
  await collect();
}

function offerResume() {
  $('#veil-actions').replaceChildren(
    h('button', { className: 'btn primary', textContent: `Tiếp tục cùng ${S.profile.nickname}`, onclick: () => enter(true) }));
  $('#veil-reset-wrap').hidden = false; $('#veil-reset').onclick = resetAll; // đường lui nhỏ ở cuối màn chào, không đặt cạnh nút chính
  if (S.restUntil && Date.now() < S.restUntil) restScreen();
}
const saved = load();
if (urlTarot.length || saved?.tarot?.length) wantCards();
// lá Tarot vừa rút ở trang /tarot được giữ vào trạng thái sau khi trạng thái đã lưu được nạp (nạp xong mới gán, tránh bị ghi đè)
queueMicrotask(() => { if (urlTarot.length) { S.tarot = urlTarot; S.tarotTopic = urlTopic; try { save(); } catch {} } });
if (saved?.profile && saved.messages?.length && ['listen', 'companion'].includes(saved.phase)) {
  try { S = { ...saved, profile: normalizeProfile(saved.profile) }; offerResume(); } catch { $('#enter').onclick = () => enter(false); }
} else $('#enter').onclick = () => enter(false);
if (!S.profile && saved?.draft?.fullName && saved.phase === 'collect') { S = { ...saved }; enter(false); } // trang bị nạp lại giữa lúc điền hồ sơ: vào thẳng, nối tiếp
try { if (sessionStorage.getItem(AUTORESUME)) { sessionStorage.removeItem(AUTORESUME); if (S.profile && S.messages?.length) enter(true, { nudge: false }); } } catch {}
