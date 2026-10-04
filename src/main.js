import './style.css';
import { createCharacter } from './character.js';
import { createBackdrop } from './backdrop.js';
import { createLanterns } from './lanterns.js';
import { parseTagged, stripTags } from './emotion-tags.js';
import { normalizeProfile, buildChart, PLACES, findPlaces, distinctiveTraits } from './engine/index.js';
import { famousFor } from './engine/famous.js';
import { NUMBER_KEYWORDS, PERSONAL_YEAR_THEME } from './engine/numerology.js';
import { HANH } from './engine/bazi.js';

const $ = (s) => document.querySelector(s);
const STORE = 'huyenmy.v1';
const character = createCharacter($('#char'));
const backdrop = createBackdrop($('#stage'), $('#wheel'));
createLanterns($('#lanterns'));
const ELEMENT_COLOR = { Kim: '#f1ead2', Mộc: '#7fe3a0', Thủy: '#6fb7ff', Hỏa: '#ff8a5c', Thổ: '#e0b86a' };
const stage = {
  setMood: (m) => character.setMood(m), setSpeaking: (v) => character.setSpeaking(v), emo: (n) => character.setEmotion(n),
  cast: (sec) => { character.cast(sec); backdrop.cast(sec); },
  setElement: (name) => { const c = ELEMENT_COLOR[name]; if (c) { character.setElement(c); backdrop.setElement(name, c); } },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- trạng thái ----------------
let S = { profile: null, messages: [], phase: 'intro' };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} };
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
paceBtn.onclick = () => { pace = pace === 'auto' ? 'tap' : 'auto'; try { localStorage.setItem(PACE_KEY, pace); } catch {} showPace(); note(pace === 'auto' ? 'Nhịp tự động: My sẽ tự nói tiếp sau mỗi câu.' : 'Nhịp chạm: bạn bấm "Tiếp" khi đã đọc xong.'); };
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
  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Access-Code': getCode() }, body: JSON.stringify({ phase, profile: S.profile, messages: S.messages }) });
  if (!res.ok) { const j = await res.json().catch(() => ({})); if (res.status === 401) { setCode(''); setTimeout(() => location.reload(), 2500); } throw new Error(j.error || 'Không kết nối được tới My.'); }
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
  stage.setMood('think'); // suy nghĩ trong lúc chờ
  const b = new Bubble(); let first = true, raw = '';
  try {
    await streamChat(phase, (t) => { if (first) { first = false; stage.emo(DEFAULT_EMO[phase] ?? 'binh_thuong'); } raw += t; b.push(t); });
  } catch (e) {
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
  const nickname = fullName.trim().split(/\s+/).pop(); // My gọi bằng tên cuối, đỡ một câu hỏi
  await say(`[[e_then]]Rất vui được gặp ${nickname}. [[lang_nghe]]Truyền thống Bát Trạch tính cung mệnh khác nhau theo giới tính khi sinh. Bạn cho My biết, hoặc bỏ qua cũng không sao.`);
  const gender = await ask({ kind: 'choice', chips: [{ label: 'Nữ', value: 'nu' }, { label: 'Nam', value: 'nam' }, { label: 'Không muốn nói', value: 'khac' }] });
  let profile;
  for (;;) {
    await say('[[chia_se]]Ngày tháng năm sinh dương lịch của bạn? Bạn không cần quy ra âm lịch, My sẽ tự đối chiếu theo tiết khí thật của trời đất.');
    const date = await ask({ kind: 'date' });
    const [y, m, d] = date.split('-').map(Number);
    await say('[[suy_nghi]]Bạn chào đời lúc mấy giờ? Nếu không nhớ cũng không sao - My sẽ nói rõ phần nào vì thế mà kém chắc chắn, chứ không nói liều.');
    const time = await ask({ kind: 'time', chips: [{ label: 'Không rõ giờ sinh', value: '' }] });
    let hour = null, minute = null; if (time) [hour, minute] = time.split(':').map(Number);
    let place = null;
    if (time) {
      await say('[[chiem_nghiem]]Và nơi bạn chào đời? Giờ sinh chỉ có nghĩa khi gắn với một vùng trời.');
      place = await askPlace();
    }
    try { profile = normalizeProfile({ fullName, nickname, gender, birth: { y, m, d, hour, minute }, place }); break; }
    catch (e) { await say(`[[ngac_nhien]]Hình như có điều gì chưa khớp (${e.message}). Mình thử nhập lại ngày giờ sinh nhé.`); }
  }
  S.profile = profile; save();
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
  // Điểm chung có thật để mở chuyện: người nổi tiếng cùng ngày sinh, rồi một nét hiếm trong chính lá số.
  const { d, m } = p.birth;
  const f = famousFor(m, d);
  const list = (arr) => arr.map((e) => `**${e.name}** (${e.y}, ${e.desc})`).join('; ');
  const near = f.near.map((e) => `**${e.name}** (${e.d}/${e.m}/${e.y}, ${e.desc})`).join('; ');
  if (f.exact.length) await say(`[[hao_hung]]Ngày ${d}/${m} này có những người đáng nể từng chào đời: ${list(f.exact)}.${near ? ` Và sát ngày bạn: ${near}.` : ''} Ngày sinh không làm nên ai cả, và My không dám nói bạn sẽ giống họ. Nhưng đó là điểm chung có thật để ta bắt đầu.`, 650, true);
  else if (near) await say(`[[hao_hung]]Trong sổ của My chưa có ai trùng đúng ngày ${d}/${m}, nhưng sát ngày bạn có: ${near}. Chỉ là điểm chung nhỏ thôi, không phải số phận.`, 650, true);
  hookTrait = distinctiveTraits(p, chart)[0] ?? null;
  if (hookTrait) await say(`[[chiem_nghiem]]Còn trong lá số của bạn, My để ý một nét khá hiếm: **${hookTrait}**. Nét ấy nói điều gì về cách bạn đi đường, My sẽ kể khi bạn muốn nghe.`, 650, true);
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
    stage.setMood('listen');
    const chips = S.phase === 'listen' ? (userTurns >= 1 ? [READ_CHIP, ...READ_LENS] : startChips()) : S.phase === 'companion' ? (userTurns <= 2 ? [...FOLLOW_CHIPS, ...LENS_CHIPS] : LENS_CHIPS) : [];
    const { text, chip } = await askChat(chips);
    showUser(text); S.messages.push({ role: 'user', content: text }); userTurns++;
    const reading = S.phase === 'listen' && chip;
    if (reading) { stage.cast(4); }
    save();
    const ok = await aiTurn(reading ? 'reading' : S.phase);
    if (!ok) { userTurns--; continue; }
    if (reading) S.phase = 'companion'; save();
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
$('#btn-chart').onclick = () => { renderSheet(); sheet.hidden = false; };
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
const ready = fetch('/api/status').then((r) => r.json()).then(async (s) => {
  $('#demo-badge').hidden = s.ai;
  LOCKED = !!s.locked; OPEN = !LOCKED || (!!getCode() && (await tryCode(getCode())) === null);
}).catch(() => {});
function askCode(then) {
  if ($('.code-box')) return;
  const input = h('input', { type: 'password', className: 'code-input', placeholder: 'Mã truy cập', autocomplete: 'off', ariaLabel: 'Mã truy cập' });
  const msg = h('p', { className: 'code-msg', role: 'alert' });
  const submit = async () => { const err = await tryCode(input.value.trim()); if (err) { msg.textContent = err; return; } OPEN = true; $('.code-box').remove(); then(); };
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#veil-actions').before(h('div', { className: 'code-box' }, h('p', { className: 'code-hint', textContent: 'Phòng này cần mã truy cập.' }), input, h('button', { className: 'btn', textContent: 'Mở cửa', onclick: submit }), msg));
  input.focus();
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
  await ready;
  if (!OPEN) return askCode(() => enter(resume));
  $('#veil').classList.add('gone'); $('#dialog').hidden = false;
  await sleep(900);
  if (resume) {
    chart = buildChart(S.profile); stage.setElement(chart.bazi.dayMaster.hanh); $('#btn-chart').hidden = false; dock();
    for (const m of S.messages) { if (m.role === 'assistant') { const b = new Bubble(true); b.push(m.content); b.end(); } else showUser(m.content); }
    note('- My vẫn ở đây -');
    await say(`[[vui]]Chào mừng ${S.profile.nickname} trở lại. Ta tiếp tục từ chỗ đang dở nhé.`, 300);
    return converse();
  }
  S.phase = 'intro'; stage.emo('binh_thuong');
  for (const line of INTRO) await say(line, 900, true);
  await collect();
}

const saved = load();
if (saved?.profile && saved.messages?.length && ['listen', 'companion'].includes(saved.phase)) {
  try {
    S = { ...saved, profile: normalizeProfile(saved.profile) };
    $('#veil-actions').replaceChildren(
      h('button', { className: 'btn primary', textContent: `Tiếp tục cùng ${S.profile.nickname}`, onclick: () => enter(true) }),
      h('button', { className: 'btn', textContent: 'Bắt đầu lại', onclick: () => { try { localStorage.removeItem(STORE); } catch {} S = { profile: null, messages: [], phase: 'intro' }; location.reload(); } }));
  } catch { $('#enter').onclick = () => enter(false); }
} else $('#enter').onclick = () => enter(false);
