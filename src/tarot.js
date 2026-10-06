// Trang Tarot Huyền My: rút một lá mỗi ngày hoặc trải ba lá, đọc theo hướng soi mình, tải ảnh hoặc chia sẻ kèm liên kết giới thiệu.
// Không gửi lên máy chủ điều bạn nghĩ hay lá bạn rút; chỉ ghi nhận tên sự kiện ẩn danh (rút lá, chia sẻ).
import './style.css';
import './explore.css';
import './tarot.css';
import { mountLogo } from './logo.js';
import { track } from './track.js';
import { CARDS, cardById, drawCards, dailyCard, vnDay, TOPICS, topicLabel } from './tarot/cards.js';
import { nextStreak, liveStreak, msUntilNextVnDay, fmtCountdown } from './tarot/ritual.js';
import { icon } from './icons.js';
import { SUITS } from './tarot/minor.js';
import { cardArtSvg, cardBackSvg } from './tarot/art.js';
import { shareTarot } from './share.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
mountLogo($('#brand'), 'compact');

// liên kết giới thiệu: ghi nhận nguồn người vào và lấy mã của chính người này để chia sẻ
const urlRef = (new URLSearchParams(location.search).get('ref') ?? '').replace(/[^\w-]/g, '').slice(0, 20);
const meReady = fetch('/api/me' + (urlRef ? `?ref=${urlRef}` : '')).then((r) => r.json()).catch(() => ({}));
track('tarot_view', { ref: urlRef });

const SEED_KEY = 'huyenmy.tarotseed', DAILY_KEY = 'huyenmy.tarotdaily';
const rid = () => (crypto.randomUUID?.() ?? String(Math.random()).slice(2)).replace(/-/g, '').slice(0, 20);
let seed = ''; try { seed = localStorage.getItem(SEED_KEY) || ''; if (!seed) { seed = rid(); localStorage.setItem(SEED_KEY, seed); } } catch { seed = rid(); }
const getDaily = () => { try { const d = JSON.parse(localStorage.getItem(DAILY_KEY)); return d?.day === vnDay() ? d.id : null; } catch { return null; } };
const STREAK_KEY = 'huyenmy.tarotstreak';
const getStreak = () => { try { return JSON.parse(localStorage.getItem(STREAK_KEY)); } catch { return null; } };
const setDaily = (id) => { try { localStorage.setItem(DAILY_KEY, JSON.stringify({ day: vnDay(), id })); localStorage.setItem('huyenmy.tarotnudge', JSON.stringify({ last: vnDay(), skips: 0 })); localStorage.setItem(STREAK_KEY, JSON.stringify(nextStreak(getStreak(), vnDay()))); } catch {} };

const HIST_KEY = 'huyenmy.tarothist';
const addHist = (mode, ids) => { try { const h = JSON.parse(localStorage.getItem(HIST_KEY)) ?? []; h.unshift({ d: vnDay(), m: mode, ids }); localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 200))); } catch {} };
const POS = [['Điều đang diễn ra', 'gist'], ['Điều nên để ý', 'mirror'], ['Bước nhỏ nên thử', 'step']];
const HINT = { daily: 'Mỗi ngày một lá. Bạn chọn điều mình đang nghĩ tới, nhìn vào bộ bài và chạm vào lá đang gọi mình.', three: 'Trải ba lá cho một điều bạn đang băn khoăn: chọn ba lá từ bộ bài úp, bạn không cần nói điều đó với ai.' };
let mode = 'daily', shown = [], uidN = 0;

function cardHtml(c, { back = false } = {}) {
  const uid = `u${uidN++}`;
  return `<figure class="tcard${back ? ' back' : ''}" data-id="${c.id}" aria-label="Lá ${esc(c.name)}"><div class="tc-inner">
    <div class="tc-face"><div class="tc-top">${c.roman}</div><div class="tc-art">${cardArtSvg(c, uid)}</div><div class="tc-name"><b>${esc(c.name)}</b><i>${esc(c.en)}</i></div></div>
    <div class="tc-back">${cardBackSvg()}</div></div></figure>`;
}
const keysHtml = (c) => `<div class="tr-keys">${c.keys.map((k) => `<span>${esc(k)}</span>`).join('')}</div>`;

function readingHtml(cards, topicKey = null) {
  const tag = topicLabel(topicKey) ? `<p class="tr-topic">Chủ đề hôm nay: <b>${esc(topicLabel(topicKey))}</b></p>` : '';
  if (cards.length === 1) {
    const c = cards[0];
    return `${tag}<h2>${esc(c.name)} <small>${esc(c.en)}</small></h2>${keysHtml(c)}<p>${esc(c.gist)}</p>
      <div class="tr-q"><b>Câu hỏi để soi mình</b>${esc(c.mirror)}</div><div class="tr-s"><b>Một bước nhỏ</b>${esc(c.step)}</div>${actions()}`;
  }
  return `${tag}<h2>Ba lá của bạn</h2><div class="tr-row3">${cards.map((c, i) => `<div class="one"><h3><small>${POS[i][0]}</small>${esc(c.name)}</h3>${keysHtml(c)}<p>${esc(c[POS[i][1]])}</p></div>`).join('')}</div>${actions()}`;
}
const actions = () => `<div class="tr-acts"><a class="btn primary" id="tr-ask" href="#">Hỏi My về ${shown.length > 1 ? 'ba lá này' : 'lá bài này'}</a><button type="button" class="btn" id="tr-dl">⬇ Tải ảnh</button><button type="button" class="btn" id="tr-share">⤴ Chia sẻ</button></div>
  <p class="sub tr-note" id="tr-note" role="status" aria-live="polite" style="margin:0" hidden></p>
  <p class="sub" style="margin:0">Lá bài chỉ là một lăng kính để suy ngẫm, không dự báo điều gì sẽ xảy ra.</p>`;

function show(ids, { flipDelay = 450, via = 'draw', topicKey = null, next = false } = {}) {
  shown = ids.map(cardById).filter(Boolean);
  const stage = $('#tr-stage'), read = $('#tr-read');
  stage.hidden = false; read.hidden = true; stage.className = 'tr-stage' + (shown.length > 1 ? ' three' : '');
  stage.innerHTML = shown.map((c, i) => `<div class="tr-slot">${cardHtml(c, { back: true })}${shown.length > 1 ? `<span class="pos">${POS[i][0]}</span>` : ''}</div>`).join('');
  stage.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  shown.forEach((c, i) => setTimeout(() => stage.querySelectorAll('.tcard')[i]?.classList.remove('back'), flipDelay + i * 420));
  setTimeout(() => {
    read.innerHTML = readingHtml(shown, topicKey) + (next ? nextBlock() : ''); read.hidden = false; tickCountdown();
    const ids = shown.map((c) => c.id);
    $('#tr-ask').href = `/?tarot=${ids.join(',')}${topicKey ? `&chu=${topicKey}` : ''}`; $('#tr-ask').onclick = () => track('tarot_ask', { n: ids.length });
    const note = $('#tr-note'), say = (t) => { note.hidden = !t; note.textContent = t || ''; };
    const share = async (m) => {
      say(m === 'download' ? 'Đang tạo ảnh…' : 'Đang chuẩn bị ảnh để chia sẻ…');
      try {
        const me = await meReady; const url = me.refCode ? `${location.origin}/?ref=${me.refCode}` : location.origin;
        const r = await shareTarot({ cards: shown, positions: shown.length > 1 ? POS.map((p) => p[0]) : null, url }, m);
        track('tarot_share', { action: r, mode: m, n: ids.length });
        say(r === 'saved' ? 'Đã tải ảnh về máy bạn. Bạn mở thư viện ảnh hoặc mục Tải xuống để xem.' : r === 'shared' ? 'Đã mở chia sẻ.' : '');
      } catch (e) { track('tarot_share', { action: 'error', mode: m, n: ids.length }); say('Chưa tạo được ảnh lúc này, bạn thử lại sau ít giây nhé.'); }
    };
    $('#tr-dl').onclick = () => share('download'); $('#tr-share').onclick = () => share('share');
  }, flipDelay + shown.length * 420 + 700);
}


// ---------- nghi thức trước khi bốc bài ----------
const R = $('#tr-ritual'), REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let topic = null, picks = [], ritualTimer = 0;
const FAN_DESKTOP = 9, FAN_PHONE = 9, TODAY_DONE = () => getDaily() != null;
const streakNow = () => liveStreak(getStreak(), vnDay());

function nextBlock() {
  const n = getStreak()?.last === vnDay() ? getStreak().n : 0;
  return `<div class="tr-next"><div class="tn-main"><span class="tn-ic">${icon('tarot')}</span><div><b>Lá bài của ngày mai đang chờ bạn</b><small>Mở sau <time data-cd>${fmtCountdown(msUntilNextVnDay())}</time> nữa. Quay lại để biết bộ bài sẽ nói gì.</small></div></div>${n ? `<div class="tn-streak">${icon('flame')}<b>${n}</b> ngày liên tiếp${n >= 2 ? '. Giữ chuỗi bằng cách quay lại ngày mai.' : '. Quay lại ngày mai để nối chuỗi.'}</div>` : ''}</div>`;
}
let cdTimer = 0;
function tickCountdown() {
  clearInterval(cdTimer);
  const upd = () => { const t = fmtCountdown(msUntilNextVnDay()); for (const e of document.querySelectorAll('[data-cd]')) e.textContent = t; };
  upd(); cdTimer = setInterval(() => { upd(); if (msUntilNextVnDay() > 86_399_000) { clearInterval(cdTimer); refreshIdle(); } }, 1000); // qua 0 giờ: ngày mới, bộ bài có lá mới
}
function refreshIdle() {
  const done = mode === 'daily' && TODAY_DONE(), n = streakNow(), el = $('#tr-streak'), w = $('#tr-wait');
  $('#tr-hint').textContent = HINT[mode]; $('#tr-go').textContent = done ? 'Xem lại lá hôm nay' : 'Bắt đầu bốc bài';
  el.hidden = !n; el.innerHTML = n ? `${icon('flame')} Bạn đã bốc bài <b>${n}</b> ngày liên tiếp. ${TODAY_DONE() ? 'Hôm nay bạn đã bốc rồi.' : 'Bốc hôm nay để nối chuỗi nhé.'}` : '';
  w.hidden = !done; w.innerHTML = done ? `Lá bài của ngày mai mở sau <time data-cd>${fmtCountdown(msUntilNextVnDay())}</time>` : '';
  tickCountdown();
}

function startRitual() {
  track('tarot_start', { mode });
  if (mode === 'daily' && TODAY_DONE()) return reveal(true); // đã bốc hôm nay: xem lại ngay, không bắt chọn lại
  topic = null; picks = []; clearTimeout(ritualTimer);
  $('#tr-stage').hidden = true; $('#tr-read').hidden = true; R.hidden = false;
  phaseTopic(); R.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
}
function phaseTopic() {
  R.innerHTML = `<div class="rit"><p class="rit-step">Bước 1 trên 2</p><h2>Hôm nay bạn đang nghĩ về điều gì?</h2>
    <p class="rit-sub">Chọn một chủ đề để lá bài chạm đúng chuyện của bạn. Bạn không cần viết gì cả, và không ai đọc điều bạn nghĩ.</p>
    <div class="rit-topics" role="group" aria-label="Chủ đề">${TOPICS.map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>
    <div class="rit-acts"><button type="button" class="btn primary" id="rit-next" disabled>Tiếp tục, nhìn vào bộ bài</button><button type="button" class="rit-link" id="rit-skip">Bỏ qua, mình để trống</button></div></div>`;
  for (const b of R.querySelectorAll('.rit-topics button')) b.onclick = () => {
    topic = b.dataset.k; for (const x of R.querySelectorAll('.rit-topics button')) x.setAttribute('aria-pressed', String(x === b));
    $('#rit-next').disabled = false; track('tarot_topic', { topic });
  };
  $('#rit-next').onclick = phasePick; $('#rit-skip').onclick = () => { topic = null; phasePick(); };
}
function phasePick() {
  picks = [];
  const three = mode === 'three', phone = matchMedia('(max-width: 640px)').matches, n = phone ? FAN_PHONE : FAN_DESKTOP;
  // điện thoại: lưới 3 x 3 lá to, không chồng nhau để chạm trúng; máy tính: xòe quạt
  const cards = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1) - 0.5, a = phone ? (i % 2 ? 2.2 : -2.2) : t * 64, x = Math.sin((a * Math.PI) / 180), y = 1 - Math.cos((a * Math.PI) / 180);
    return `<button type="button" class="fan-card" style="--a:${a.toFixed(1)}deg;--x:${x.toFixed(3)};--y:${y.toFixed(3)};--d:${(i * 0.14).toFixed(2)}s" data-i="${i}" aria-label="Lá bài úp số ${i + 1}">${cardBackSvg()}<span class="fan-n"></span></button>`;
  }).join('');
  R.innerHTML = `<div class="rit"><p class="rit-step">Bước 2 trên 2${topic ? ` · <b>${esc(topicLabel(topic))}</b>` : ''}</p><h2>Hãy nhìn vào bộ bài</h2>
    <p class="rit-sub" id="rit-sub">Hít một hơi thật chậm, giữ điều bạn muốn hỏi trong lòng. ${three ? 'Khi sẵn sàng, chạm vào <b>ba lá</b> đang gọi bạn, lần lượt từng lá.' : 'Khi sẵn sàng, chạm vào <b>một lá</b> đang gọi bạn.'}</p>
    <div class="fan${phone ? ' grid' : ''}" id="fan">${cards}</div>
    <p class="rit-count" id="rit-count" aria-live="polite">${three ? `Đã chọn 0/3 · ${POS[0][0]}` : 'Chưa chọn lá nào'}</p>
    <div class="rit-acts"><button type="button" class="rit-link" id="rit-back">‹ Đổi chủ đề</button></div></div>`;
  $('#rit-back').onclick = phaseTopic;
  for (const b of R.querySelectorAll('.fan-card')) b.onclick = () => {
    if (b.classList.contains('picked')) return;
    picks.push(+b.dataset.i); b.classList.add('picked'); b.querySelector('.fan-n').textContent = three ? picks.length : '';
    if (picks.length >= (three ? 3 : 1)) { for (const x of R.querySelectorAll('.fan-card')) x.disabled = true; return setTimeout(phaseCharge, REDUCED ? 100 : 600); }
    $('#rit-count').textContent = `Đã chọn ${picks.length}/3 · ${POS[picks.length][0]}`;
  };
}
function phaseCharge() {
  const three = mode === 'three', lines = ['Hít một hơi thật chậm…', 'Giữ điều bạn muốn hỏi trong lòng…', 'Lá bài đang đến với bạn…'], gap = REDUCED ? 300 : 1100;
  R.innerHTML = `<div class="rit charge"><div class="aura" aria-hidden="true"></div><div class="ch-cards">${Array.from({ length: three ? 3 : 1 }, (_, i) => `<div class="ch-card" style="--i:${i}">${cardBackSvg()}</div>`).join('')}</div>
    <p class="ch-line" id="ch-line" aria-live="polite">${lines[0]}</p><div class="ch-bar" aria-hidden="true"><i style="animation-duration:${gap * 3}ms"></i></div></div>`;
  let k = 0; const iv = setInterval(() => { k++; if (k < lines.length) $('#ch-line').textContent = lines[k]; }, gap);
  ritualTimer = setTimeout(() => { clearInterval(iv); reveal(false); }, gap * 3 + 200);
}
function reveal(again) {
  R.hidden = true; clearTimeout(ritualTimer);
  if (mode === 'daily') {
    let id = getDaily(); const was = id != null;
    if (id == null) { id = dailyCard(seed, vnDay()); setDaily(id); }
    track('tarot_draw', { mode: 'daily', id, again: was }); if (!was) addHist('daily', [id]);
    show([id], { topicKey: again ? null : topic, next: true });
  } else {
    const ids = drawCards(3); addHist('three', ids); track('tarot_draw', { mode: 'three', id: ids[0] }); show(ids, { topicKey: topic });
  }
  refreshIdle();
}
for (const b of document.querySelectorAll('.tr-modes button')) b.onclick = () => {
  mode = b.dataset.mode; R.hidden = true;
  for (const x of document.querySelectorAll('.tr-modes button')) { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); }
  refreshIdle();
};
$('#tr-go').onclick = startRitual;
refreshIdle();

// cả bộ: tranh chỉ được vẽ khi lá cuộn tới gần màn hình (mỗi lá có nhân vật nên khá nặng)
const grid = $('#tr-grid');
const SECTIONS = [['Ẩn Chính', 'hành trình lớn của đời người', (c) => !c.minor], ...Object.entries(SUITS).map(([k, s]) => [`Bộ ${s.vi}`, `${s.element}: ${s.theme}`, (c) => c.suit === k])];
const tile = (c) => `<figure class="tcard" data-id="${c.id}" tabindex="0" role="button" aria-label="Đọc lá ${esc(c.name)}"><div class="tc-inner"><div class="tc-face"><div class="tc-top">${c.roman}</div><div class="tc-art"></div><div class="tc-name"><b>${esc(c.name)}</b><i>${esc(c.en)}</i></div></div><div class="tc-back"></div></div></figure>`;
grid.innerHTML = SECTIONS.map(([h, sub, pick]) => `<h3 class="tr-sec">${esc(h)} <small>${esc(sub)}</small></h3><div class="tr-sgrid">${CARDS.filter(pick).map(tile).join('')}</div>`).join('');
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { const el = e.target, c = cardById(el.dataset.id); el.querySelector('.tc-art').innerHTML = cardArtSvg(c, `g${c.id}`); io.unobserve(el); } }, { rootMargin: '300px' });
for (const el of grid.querySelectorAll('.tcard')) {
  io.observe(el);
  const open = () => { track('tarot_browse', { id: +el.dataset.id }); show([+el.dataset.id], { flipDelay: 150, via: 'browse' }); };
  el.onclick = open; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
}
const deep = new URLSearchParams(location.search).get('c'); if (deep != null && cardById(deep)) show([+deep], { flipDelay: 150, via: 'link' });
