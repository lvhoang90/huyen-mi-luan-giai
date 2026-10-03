import './style.css';
import { createStage } from './stage.js';
import { normalizeProfile, buildChart, PLACES } from './engine/index.js';
import { NUMBER_KEYWORDS, PERSONAL_YEAR_THEME } from './engine/numerology.js';
import { HANH } from './engine/bazi.js';

const $ = (s) => document.querySelector(s);
const STORE = 'huyenmy.v1';
const stage = createStage($('#stage'));
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

// ---------------- giọng nói (tùy chọn) ----------------
let soundOn = false, ttsBusy = 0, typing = false;
const syncSpeaking = () => stage.setSpeaking(typing || ttsBusy > 0);
function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  const clean = text.replace(/\*/g, '').trim(); if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'vi-VN'; u.rate = 0.92; u.pitch = 1.05;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('vi')); if (v) u.voice = v;
  ttsBusy++; syncSpeaking();
  u.onend = u.onerror = () => { ttsBusy = Math.max(0, ttsBusy - 1); syncSpeaking(); };
  speechSynthesis.speak(u);
}
$('#btn-sound').onclick = (e) => {
  soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn);
  if (!soundOn) { speechSynthesis?.cancel(); ttsBusy = 0; syncSpeaking(); }
};

// ---------------- bong bóng của Huyền My (gõ chữ dần) ----------------
class Bubble {
  constructor(instant = false) {
    this.el = document.createElement('div'); this.el.className = 'msg my' + (instant ? '' : ' typing');
    log.append(this.el); this.full = ''; this.shown = 0; this.ended = false; this.instant = instant;
    this.done = new Promise((r) => (this.resolve = r));
    if (instant) return;
    typing = true; syncSpeaking();
    this.timer = setInterval(() => this.tick(), 30);
  }
  push(t) { this.full += t; if (this.instant) this.render(); }
  tick() {
    const backlog = this.full.length - this.shown;
    if (backlog > 0) {
      this.shown += backlog > 160 ? 8 : backlog > 70 ? 4 : backlog > 24 ? 2 : 1;
      this.render();
    } else if (this.ended) this.finish();
  }
  render() {
    let t = this.instant ? this.full : this.full.slice(0, this.shown);
    if (this.shown < this.full.length && (t.match(/\*/g) ?? []).length % 2) t += '*'; // đóng tạm dấu nghiêng khi đang gõ dở
    this.el.innerHTML = md(t); scrollDown();
  }
  end() { this.ended = true; if (this.instant) { this.render(); this.resolve(); } return this.done; }
  finish() {
    clearInterval(this.timer); this.el.classList.remove('typing'); this.render();
    typing = false; syncSpeaking(); speak(this.full); this.resolve();
  }
}
async function say(text, pause = 650) { const b = new Bubble(); b.push(text); await b.end(); await sleep(pause); }
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
/** Hỏi một giá trị. kind: text | date | time | place | choice */
function ask({ kind = 'text', placeholder = '', chips = [], hint = '', validate }) {
  return new Promise((resolve) => {
    clearComposer();
    const done = (value, label) => { clearComposer(); showUser(label ?? String(value)); resolve(value); };
    if (hint) composer.append(h('div', { className: 'hint', textContent: hint }));
    if (chips.length) composer.append(chipsRow(chips, (c) => done(c.value ?? c, c.label ?? c)));
    if (kind === 'choice') return;
    let input;
    if (kind === 'place') {
      input = h('select', { className: 'field' }, h('option', { value: '', textContent: 'Chọn nơi sinh…' }),
        ...Object.entries(PLACES).map(([k, p]) => h('option', { value: k, textContent: p.name })));
    } else input = h('input', { className: 'field', type: kind === 'date' ? 'date' : kind === 'time' ? 'time' : 'text', placeholder, maxLength: 80, autocomplete: 'off' });
    if (kind === 'date') { input.max = new Date().toISOString().slice(0, 10); input.min = '1900-01-01'; }
    const go = h('button', { className: 'send', textContent: '➤', ariaLabel: 'Gửi' });
    const submit = () => {
      const v = input.value.trim(); if (!v) return;
      if (validate && !validate(v)) { input.style.borderColor = '#ff8a8a'; return; }
      const label = kind === 'place' ? PLACES[v].name : kind === 'date' ? v.split('-').reverse().join('/') : kind === 'time' ? `${v}` : v;
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
async function streamChat(phase, onText) {
  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase, profile: S.profile, messages: S.messages }) });
  if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Không kết nối được tới My.'); }
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
async function aiTurn(phase) {
  stage.setMood('think');
  const b = new Bubble(); let first = true, full = '';
  try {
    await streamChat(phase, (t) => { if (first) { first = false; stage.setMood('idle'); } full += t; b.push(t); });
  } catch (e) {
    if (!full) b.push(e.message || 'Đường truyền chập chờn, bạn thử lại giúp My nhé.');
    else b.push('\n\n*(đường truyền bị ngắt giữa chừng)*');
    stage.setMood('idle');
    await b.end();
    if (!full) { S.messages.pop(); save(); } // bỏ tin nhắn chưa được trả lời để người dùng gửi lại
    return false;
  }
  await b.end();
  S.messages.push({ role: 'assistant', content: full }); save();
  return true;
}

// ---------------- hành trình ----------------
const INTRO = [
  'Chào bạn — người lữ khách đã tìm đến đây.',
  'Tôi là Huyền My. Tôi giữ lại những gì còn sót của một dòng truyền thừa xưa: thần số, tinh tượng, âm dương ngũ hành.',
  'My không nói trước điều chưa đến, cũng không nói điều bạn chỉ muốn nghe. My chỉ soi lại tấm bản đồ mà trời đất khẽ đặt vào ngày bạn sinh ra, để bạn nhìn mình rõ hơn.',
];

async function collect() {
  S.phase = 'collect'; save(); stage.setMood('listen');
  await say('Trước hết, xin cho My biết họ và tên khai sinh của bạn. Mỗi con chữ mang một rung động riêng, nên My cần đúng cái tên cha mẹ đã đặt.');
  const fullName = await ask({ placeholder: 'Họ và tên khai sinh', validate: (v) => v.length >= 2 && /\p{L}/u.test(v) });
  await say(`Cảm ơn bạn. Còn khi trò chuyện, bạn muốn My gọi bạn là gì cho thân tình?`);
  const last = fullName.trim().split(/\s+/).pop();
  const nickname = await ask({ placeholder: 'Tên gọi thân mật', chips: [last] });
  await say(`${nickname} nhé. Truyền thống Bát Trạch tính cung mệnh khác nhau theo giới tính khi sinh. Bạn cho My biết, hoặc bỏ qua cũng không sao.`);
  const gender = await ask({ kind: 'choice', chips: [{ label: 'Nữ', value: 'nu' }, { label: 'Nam', value: 'nam' }, { label: 'Không muốn nói', value: 'khac' }] });
  let profile;
  for (;;) {
    await say('Ngày tháng năm sinh dương lịch của bạn? Bạn không cần quy ra âm lịch — My sẽ tự đối chiếu theo tiết khí thật của trời đất.');
    const date = await ask({ kind: 'date' });
    const [y, m, d] = date.split('-').map(Number);
    await say('Bạn chào đời lúc mấy giờ? Nếu không nhớ cũng không sao — My sẽ nói rõ phần nào vì thế mà kém chắc chắn, chứ không nói liều.');
    const time = await ask({ kind: 'time', chips: [{ label: 'Không rõ giờ sinh', value: '' }] });
    let hour = null, minute = null; if (time) [hour, minute] = time.split(':').map(Number);
    let place = null;
    if (time) {
      await say('Và nơi bạn chào đời? Giờ sinh chỉ có nghĩa khi gắn với một vùng trời.');
      place = (await ask({ kind: 'place', chips: [{ label: 'Không rõ / sinh ở nước ngoài', value: '' }] })) || null;
    }
    try { profile = normalizeProfile({ fullName, nickname, gender, birth: { y, m, d, hour, minute }, place }); break; }
    catch (e) { await say(`Hình như có điều gì chưa khớp (${e.message}). Mình thử nhập lại ngày giờ sinh nhé.`); }
  }
  S.profile = profile; save();
  await ritual();
}

async function ritual() {
  const p = S.profile;
  clearComposer(); stage.setMood('think'); stage.cast(5.5);
  await say('*My khép mắt, đặt hai lòng bàn tay lại gần nhau. Giữa lòng tay, một đốm sáng nhỏ bừng lên…*', 2200);
  chart = buildChart(p);
  stage.setElement(chart.bazi.dayMaster.hanh); $('#btn-chart').hidden = false;
  stage.setMood('idle');
  const y = chart.bazi.pillars.year;
  await say(`Xong rồi, ${p.nickname}. Bạn mang tuổi ${y.name}, nạp âm ${chart.bazi.napAmYear.name} — ${chart.bazi.napAmYear.image}. Nhật chủ của bạn là hành ${chart.bazi.dayMaster.hanh}. Bạn có thể mở lá số bất cứ lúc nào bằng nút ☯ ở góc phải để xem My đã tính ra sao.`);
  await say('Nhưng My chưa vội luận. Một tấm bản đồ chỉ có nghĩa khi ta biết người cầm nó đang đi đâu.');
  const opener = `Hãy kể cho My nghe: điều gì đã khiến bạn tìm đến đây hôm nay, ${p.nickname}? Cứ kể như đang nói với một người bạn tin, không cần sắp xếp. My ở đây, và My nghe.`;
  await say(opener, 200);
  S.messages = [{ role: 'assistant', content: opener }]; S.phase = 'listen'; save();
  await converse();
}

const READ_CHIP = { label: 'Mời My luận giải', value: 'Mình đã kể xong rồi. Mời My luận giải giúp mình.', action: 'read' };
const FOLLOW_CHIPS = ['Về con đường sự nghiệp của mình', 'Về chuyện tình cảm', 'Năm nay của mình có gì đáng lưu tâm?', 'Điều đang làm mình rối nhất'];

async function converse() {
  let userTurns = S.messages.filter((m) => m.role === 'user').length;
  for (;;) {
    stage.setMood('listen');
    const chips = S.phase === 'listen' ? (userTurns >= 1 ? [READ_CHIP] : []) : S.phase === 'companion' && userTurns <= 2 ? FOLLOW_CHIPS : [];
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
function renderSheet() {
  const p = S.profile, c = chart ?? (chart = buildChart(p)), b = c.bazi, n = c.numerology, a = c.astro;
  const pill = (label, pl, dm) => pl
    ? `<div class="pillar ${dm ? 'dm' : ''}"><div class="lbl">${label}</div><div class="nm">${pl.name}</div><div class="el">${el(pl.hanhCan)} · ${el(pl.hanhChi)}</div></div>`
    : `<div class="pillar"><div class="lbl">${label}</div><div class="nm">—</div><div class="el">không rõ giờ</div></div>`;
  const max = Math.max(...Object.values(b.elements.counts), 1);
  const bars = HANH.map((k) => `<div class="bar"><span class="${k}">${k}</span><i><b style="width:${(b.elements.counts[k] / max) * 100}%;background:${ELC[k]}"></b></i><span>${b.elements.counts[k]}</span></div>`).join('');
  const cell = (k, v, d = '') => `<div class="cell"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
  const sign = (s, unsure) => `${s.name}${unsure ? ' ?' : ''}`;
  $('#sheet-body').innerHTML = `
    <h2>Lá số của ${esc(p.nickname)}</h2>
    <p class="sub">${esc(p.fullName)} · ${p.birth.d}/${p.birth.m}/${p.birth.y}${p.birth.hour !== null ? ` · ${String(p.birth.hour).padStart(2, '0')}:${String(p.birth.minute).padStart(2, '0')}` : ' · không rõ giờ'}${a.place ? ' · ' + esc(a.place) : ''}</p>

    <h3>Tứ Trụ <small>tính theo tiết khí thật · tầng Tính toán</small></h3>
    <div class="pillars">${pill('Giờ', b.pillars.hour)}${pill('Ngày', b.pillars.day, true)}${pill('Tháng', b.pillars.month)}${pill('Năm', b.pillars.year)}</div>
    <p class="sub" style="margin-top:10px">Nhật chủ <b>${b.dayMaster.can}</b> (${el(b.dayMaster.hanh)}, ${b.dayMaster.yang ? 'dương' : 'âm'}) · sinh tháng ${b.pillars.month.chi}, ${b.elements.inSeason ? 'đắc lệnh' : 'không đắc lệnh'} · thân ${b.elements.strength} <i>(tham khảo)</i><br>Nạp âm năm: <b>${b.napAmYear.name}</b> — ${b.napAmYear.image}${c.cungMenh ? ` · Cung mệnh: <b>${c.cungMenh.name}</b> (${el(c.cungMenh.hanh)}, ${c.cungMenh.nhom})` : ''}</p>

    <h3>Ngũ hành <small>can + chi chính khí</small></h3>
    <div class="bars">${bars}</div>
    <p class="sub" style="margin-top:8px">${b.elements.missing.length ? 'Vắng: ' + b.elements.missing.map(el).join(', ') + '. ' : 'Đủ cả năm hành. '}Trội: ${el(b.elements.dominant)}.${b.elements.balancing.length ? ' Hướng cân bằng gợi ý: ' + b.elements.balancing.map(el).join(' / ') + '.' : ''}</p>

    <h3>Thần số học <small>Pythagoras · tên bỏ dấu</small></h3>
    <div class="grid">
      ${cell('Chủ đạo', n.lifePath, NUMBER_KEYWORDS[n.lifePath])}${cell('Biểu đạt', n.expression, NUMBER_KEYWORDS[n.expression])}
      ${cell('Linh hồn', n.soul, NUMBER_KEYWORDS[n.soul])}${cell('Nhân cách', n.personality, NUMBER_KEYWORDS[n.personality])}
      ${cell('Năm cá nhân ' + c.thisYear.year, n.personalYear, PERSONAL_YEAR_THEME[n.personalYear])}
    </div>

    <h3>Chiêm tinh <small>tropical · Meeus</small></h3>
    <div class="grid">
      ${cell('Mặt Trời', sign(a.sun, a.sunUncertain), `${a.sun.element} · ${a.sun.degree}°`)}
      ${cell('Mặt Trăng', sign(a.moon, a.moonUncertain), a.moonUncertain ? 'thiếu giờ sinh nên chưa chắc' : `${a.moon.element} · ${a.moon.degree}°`)}
      ${cell('Cung mọc', a.asc ? a.asc.name : '—', a.asc ? `${a.asc.element} · ${a.asc.degree}°` : 'cần giờ và nơi sinh')}
    </div>

    <div class="src"><b>Minh chứng & giới hạn.</b> Các con số trên được <b>tính</b> từ thuật toán thiên văn, không do AI đoán, và My nhận chúng làm dữ kiện. Ý nghĩa gán cho chúng thuộc tầng <b>truyền thống</b> — một lăng kính biểu tượng. Hiện chưa có bằng chứng khoa học cho thấy ngày giờ sinh quyết định số phận hay dự báo được sự kiện; giá trị của lá số là gợi những câu hỏi đáng hỏi, rồi My đối chiếu với câu chuyện thật của bạn và những khung <b>tâm lý học đã được kiểm chứng</b>.
    <ul>${c.caveats.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
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
fetch('/api/status').then((r) => r.json()).then((s) => { $('#demo-badge').hidden = s.ai; }).catch(() => {});

async function enter(resume) {
  $('#veil').classList.add('gone'); $('#dialog').hidden = false;
  speechSynthesis?.getVoices?.();
  await sleep(900);
  if (resume) {
    chart = buildChart(S.profile); stage.setElement(chart.bazi.dayMaster.hanh); $('#btn-chart').hidden = false;
    for (const m of S.messages) { if (m.role === 'assistant') { const b = new Bubble(true); b.push(m.content); b.end(); } else showUser(m.content); }
    note('— My vẫn ở đây —');
    await say(`Chào mừng ${S.profile.nickname} trở lại. Ta tiếp tục từ chỗ đang dở nhé.`, 300);
    return converse();
  }
  S.phase = 'intro'; stage.setMood('idle');
  for (const line of INTRO) await say(line, 900);
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
