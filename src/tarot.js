// Trang Tarot Huyền My: rút một lá mỗi ngày hoặc trải ba lá, đọc theo hướng soi mình, tải ảnh hoặc chia sẻ kèm liên kết giới thiệu.
// Không gửi lên máy chủ điều bạn nghĩ hay lá bạn rút; chỉ ghi nhận tên sự kiện ẩn danh (rút lá, chia sẻ).
import './style.css';
import './explore.css';
import './tarot.css';
import { mountLogo } from './logo.js';
import { track } from './track.js';
import { CARDS, cardById, drawCards, dailyCard, vnDay } from './tarot/cards.js';
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
const setDaily = (id) => { try { localStorage.setItem(DAILY_KEY, JSON.stringify({ day: vnDay(), id })); } catch {} };

const POS = [['Điều đang diễn ra', 'gist'], ['Điều nên để ý', 'mirror'], ['Bước nhỏ nên thử', 'step']];
const HINT = { daily: 'Mỗi ngày một lá, cùng một lá cho cả ngày. Sáng mai bạn sẽ được lá mới.', three: 'Hãy nghĩ tới một điều bạn đang băn khoăn, rồi rút ba lá. Bạn không cần nói điều đó với ai.' };
let mode = 'daily', shown = [], uidN = 0;

function cardHtml(c, { back = false } = {}) {
  const uid = `u${uidN++}`;
  return `<figure class="tcard${back ? ' back' : ''}" data-id="${c.id}" aria-label="Lá ${esc(c.name)}"><div class="tc-inner">
    <div class="tc-face"><div class="tc-top">${c.roman}</div><div class="tc-art">${cardArtSvg(c, uid)}</div><div class="tc-name"><b>${esc(c.name)}</b><i>${esc(c.en)}</i></div></div>
    <div class="tc-back">${cardBackSvg()}</div></div></figure>`;
}
const keysHtml = (c) => `<div class="tr-keys">${c.keys.map((k) => `<span>${esc(k)}</span>`).join('')}</div>`;

function readingHtml(cards) {
  if (cards.length === 1) {
    const c = cards[0];
    return `<h2>${esc(c.name)} <small>${esc(c.en)}</small></h2>${keysHtml(c)}<p>${esc(c.gist)}</p>
      <div class="tr-q"><b>Câu hỏi để soi mình</b>${esc(c.mirror)}</div><div class="tr-s"><b>Một bước nhỏ</b>${esc(c.step)}</div>${actions()}`;
  }
  return `<h2>Ba lá của bạn</h2><div class="tr-row3">${cards.map((c, i) => `<div class="one"><h3><small>${POS[i][0]}</small>${esc(c.name)}</h3>${keysHtml(c)}<p>${esc(c[POS[i][1]])}</p></div>`).join('')}</div>${actions()}`;
}
const actions = () => `<div class="tr-acts"><a class="btn primary" id="tr-ask" href="#">Hỏi My về ${shown.length > 1 ? 'ba lá này' : 'lá bài này'}</a><button type="button" class="btn" id="tr-dl">⬇ Tải ảnh</button><button type="button" class="btn" id="tr-share">⤴ Chia sẻ</button></div>
  <p class="sub" style="margin:0">Lá bài chỉ là một lăng kính để suy ngẫm, không dự báo điều gì sẽ xảy ra.</p>`;

function show(ids, { flipDelay = 450, via = 'draw' } = {}) {
  shown = ids.map(cardById).filter(Boolean);
  const stage = $('#tr-stage'), read = $('#tr-read');
  stage.hidden = false; read.hidden = true; stage.className = 'tr-stage' + (shown.length > 1 ? ' three' : '');
  stage.innerHTML = shown.map((c, i) => `<div class="tr-slot">${cardHtml(c, { back: true })}${shown.length > 1 ? `<span class="pos">${POS[i][0]}</span>` : ''}</div>`).join('');
  stage.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  shown.forEach((c, i) => setTimeout(() => stage.querySelectorAll('.tcard')[i]?.classList.remove('back'), flipDelay + i * 420));
  setTimeout(() => {
    read.innerHTML = readingHtml(shown); read.hidden = false;
    const ids = shown.map((c) => c.id);
    $('#tr-ask').href = `/?tarot=${ids.join(',')}`; $('#tr-ask').onclick = () => track('tarot_ask', { n: ids.length });
    const share = async (m) => { const me = await meReady; const url = me.refCode ? `${location.origin}/?ref=${me.refCode}` : location.origin; const r = await shareTarot({ cards: shown, positions: shown.length > 1 ? POS.map((p) => p[0]) : null, url }, m); track('tarot_share', { action: r, mode: m, n: ids.length }); };
    $('#tr-dl').onclick = () => share('download'); $('#tr-share').onclick = () => share('share');
  }, flipDelay + shown.length * 420 + 700);
}

function go() {
  if (mode === 'daily') {
    let id = getDaily(); const again = id != null;
    if (id == null) { id = dailyCard(seed, vnDay()); setDaily(id); }
    track('tarot_draw', { mode: 'daily', id, again });
    show([id]);
  } else {
    const ids = drawCards(3); track('tarot_draw', { mode: 'three', id: ids[0] }); show(ids);
  }
}
for (const b of document.querySelectorAll('.tr-modes button')) b.onclick = () => {
  mode = b.dataset.mode;
  for (const x of document.querySelectorAll('.tr-modes button')) { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); }
  $('#tr-hint').textContent = HINT[mode]; $('#tr-go').textContent = mode === 'daily' && getDaily() != null ? 'Xem lại lá hôm nay' : 'Rút bài';
};
$('#tr-go').onclick = go;
$('#tr-hint').textContent = HINT.daily; if (getDaily() != null) $('#tr-go').textContent = 'Xem lại lá hôm nay';

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
