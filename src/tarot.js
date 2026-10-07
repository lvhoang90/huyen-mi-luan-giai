// Trang Tarot Huyền My: rút một lá mỗi ngày, trải ba lá, năm lá về một lựa chọn hoặc bảy lá về tình cảm, đọc theo hướng soi mình, tải ảnh hoặc chia sẻ kèm liên kết giới thiệu.
// Không gửi lên máy chủ điều bạn nghĩ hay lá bạn rút; chỉ ghi nhận tên sự kiện ẩn danh (rút lá, chia sẻ).
import './pwa.js';
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
import { mountCta } from './cta.js';
import { shareTarot, prepareTarot, shareMessage } from './share.js';
import { SPREADS, spreadOfCount } from './tarot/spreads.js';

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
const HINT = { daily: 'Mỗi ngày một lá. Bạn chọn điều mình đang nghĩ tới, nhìn vào bộ bài và chạm vào lá đang gọi mình.', three: 'Trải ba lá cho một điều bạn đang băn khoăn: chọn ba lá từ bộ bài úp, bạn không cần nói điều đó với ai.', choice: 'Khi bạn đang đứng giữa hai lối đi: chọn năm lá, mỗi lá là một góc nhìn để bạn nghe rõ điều mình muốn. Lá bài không chọn thay bạn.', love: 'Cho chuyện lòng đang nặng: chọn bảy lá để soi lại mình và cách bạn ở trong mối quan hệ. Không đoán tâm ý ai.' };
const NUM = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy'], needOf = () => SPREADS[mode]?.n ?? 1;
// nhãn vị trí: ba lá giữ câu đầy đủ, năm và bảy lá dùng nhãn ngắn cho vừa chỗ
const posLabel = (n, i) => { const p = SPREADS[spreadOfCount(n)]?.pos[i]; return p ? (n <= 3 ? p.label : p.short) : ''; };
let mode = 'daily', shown = [], uidN = 0;
// Ghi chú một dòng sau khi xem lá: chỉ lưu trên máy này, gắn vào lần rút trong lịch sử của "Góc của tôi"; không gửi đi đâu.
const sameIds = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
function noteOf(ids) { try { return (JSON.parse(localStorage.getItem(HIST_KEY)) ?? []).find((h) => h.d === vnDay() && sameIds(h.ids, ids))?.n ?? ''; } catch { return ''; } }
function saveNote(ids, text) {
  try {
    const h = JSON.parse(localStorage.getItem(HIST_KEY)) ?? []; let e = h.find((x) => x.d === vnDay() && sameIds(x.ids, ids));
    if (!e) { e = { d: vnDay(), m: spreadOfCount(ids.length) ?? 'daily', ids }; h.unshift(e); }
    if (text) e.n = text; else delete e.n; localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 200))); return true;
  } catch { return false; }
}

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
  const sp = SPREADS[spreadOfCount(cards.length)] ?? SPREADS.three;
  return `${tag}<h2>${esc(sp.title)}</h2>${sp.intro ? `<p class="tr-intro">${esc(sp.intro)}</p>` : ''}<div class="tr-row3 n${cards.length}">${cards.map((c, i) => `<div class="one"><h3><small>${esc(sp.pos[i]?.label ?? '')}</small>${esc(c.name)}</h3>${keysHtml(c)}<p>${esc(c[sp.pos[i]?.field ?? 'gist'])}</p></div>`).join('')}</div>${actions()}`;
}
const actions = () => `<div class="tr-acts"><a class="btn primary" id="tr-ask" href="#">Hỏi My về ${shown.length > 1 ? 'những lá này' : 'lá bài này'}</a><button type="button" class="btn" id="tr-dl">${icon('download')} Tải ảnh</button><button type="button" class="btn" id="tr-share">${icon('share')} Chia sẻ</button></div>
  <p class="sub tr-note" id="tr-note" role="status" aria-live="polite" style="margin:0" hidden></p>
  <p class="sub" style="margin:0">Lá bài chỉ là một lăng kính để suy ngẫm, không dự báo điều gì sẽ xảy ra.</p>`;

function show(ids, { flipDelay = 450, via = 'draw', topicKey = null, next = false } = {}) {
  shown = ids.map(cardById).filter(Boolean);
  const positions0 = shown.length > 1 ? shown.map((_, i) => posLabel(shown.length, i)) : null, cards0 = shown;
  // vẽ sẵn ảnh để chia sẻ ngay từ lúc bắt đầu lật bài, sớm hơn khi lời đọc hiện ra khoảng một đến hai giây
  const ready = meReady.then((me) => prepareTarot({ cards: cards0, positions: positions0, url: urlOf(me) })).catch(() => null);
  const stage = $('#tr-stage'), read = $('#tr-read');
  stage.hidden = false; read.hidden = true; stage.className = 'tr-stage' + (shown.length === 1 ? '' : shown.length <= 3 ? ' three' : ` many n${shown.length}`);
  stage.innerHTML = shown.map((c, i) => `<div class="tr-slot">${cardHtml(c, { back: true })}${shown.length > 1 ? `<span class="pos">${esc(posLabel(shown.length, i))}</span>` : ''}</div>`).join('');
  stage.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  shown.forEach((c, i) => setTimeout(() => stage.querySelectorAll('.tcard')[i]?.classList.remove('back'), flipDelay + i * 420));
  setTimeout(() => {
    read.innerHTML = readingHtml(shown, topicKey) + (next ? nextBlock() : ''); read.hidden = false; tickCountdown();
    const ids = shown.map((c) => c.id);
    $('#tr-ask').href = `/?tarot=${ids.join(',')}${topicKey ? `&chu=${topicKey}` : ''}`; $('#tr-ask').onclick = () => track('tarot_ask', { n: ids.length });
    const note = $('#tr-note'), say = (t) => { note.hidden = !t; note.textContent = t || ''; };
    // ảnh đã được vẽ sẵn từ lúc bắt đầu lật bài (xem biến `ready` ở trên): bấm "Chia sẻ" thì hộp thoại của điện thoại mở liền
    const positions = shown.length > 1 ? shown.map((_, i) => posLabel(shown.length, i)) : null, cards = shown;
    const share = async (m) => {
      say(m === 'download' ? 'Đang tạo ảnh…' : 'Đang chuẩn bị chia sẻ…');
      try {
        const me = await meReady;
        const r = await shareTarot({ cards, positions, url: urlOf(me), blob: ready }, m);
        track('tarot_share', { action: r, mode: m, n: ids.length });
        say(shareMessage(r));
        if (r === 'pending') ready.then((b) => { if (b) say('Ảnh đã sẵn sàng. Bạn bấm Chia sẻ nhé.'); });
      } catch (e) { track('tarot_share', { action: 'error', mode: m, n: ids.length }); say('Chưa tạo được ảnh lúc này, bạn thử lại sau ít giây nhé.'); }
    };
    $('#tr-dl').onclick = () => share('download'); $('#tr-share').onclick = () => share('share');
    afterReading(read, { ids, topicKey });
  }, flipDelay + shown.length * 420 + 700);
}


const urlOf = (me) => (me?.refCode ? `${location.origin}/tarot?ref=${me.refCode}` : `${location.origin}/tarot`);
// ---------- sau khi xem lá: hỏi cảm xúc (đo hiệu quả) và lời mời đăng ký cho người chưa có tài khoản ----------
const FEEL = [['Nhẹ nhõm', 4], ['Tò mò', 3], ['Bình thường', 2], ['Băn khoăn', 1]], FEEL_KEY = 'huyenmy.tarotfeel';
const feelDone = () => { try { return localStorage.getItem(FEEL_KEY) === String(vnDay()); } catch { return false; } };
function afterReading(read, { ids, topicKey }) {
  read.querySelector('.tr-after')?.remove();
  const box = document.createElement('div'); box.className = 'tr-after'; read.append(box);
  if (!feelDone()) {
    box.innerHTML = `<div class="tr-feel" role="group" aria-label="Cảm xúc sau khi xem lá"><p>Lá này làm bạn thấy thế nào?</p><div class="tf-chips">${FEEL.map(([l, v]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div></div>`;
    box.querySelector('.tr-feel').onclick = (e) => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      track('tarot_feel', { value: +b.dataset.v, mode: shown.length > 1 ? 'three' : 'daily', streak: streakNow() });
      try { localStorage.setItem(FEEL_KEY, String(vnDay())); } catch {}
      box.querySelector('.tr-feel').innerHTML = '<p class="tf-thanks">Cảm ơn bạn. My ghi lại để hiểu bộ bài này hợp với mọi người đến đâu.</p>';
    };
  }
  const note = document.createElement('div'); note.className = 'tr-journal'; const cur = noteOf(ids);
  note.innerHTML = `<label for="tj-t">Ghi một dòng cho chính bạn <small>(chỉ lưu trên máy này)</small></label><div class="tj-row"><textarea id="tj-t" rows="2" maxlength="200" placeholder="Lúc này bạn thấy gì trong lòng?">${esc(cur)}</textarea><button type="button" class="btn" id="tj-s">${cur ? 'Cập nhật' : 'Lưu'}</button></div><p class="sub tj-ok" id="tj-ok" role="status" aria-live="polite" hidden></p>`;
  box.append(note);
  note.querySelector('#tj-s').onclick = () => {
    const t = note.querySelector('#tj-t').value.replace(/\s+/g, ' ').trim(), ok = note.querySelector('#tj-ok'); ok.hidden = false;
    if (saveNote(ids, t)) { ok.textContent = t ? 'Đã lưu vào Bộ bài của tôi, trong Góc của tôi.' : 'Đã xóa ghi chú.'; track('tarot_note', { n: ids.length, has: t ? 1 : 0 }); note.querySelector('#tj-s').textContent = t ? 'Cập nhật' : 'Lưu'; }
    else ok.textContent = 'Máy này không cho lưu, bạn thử lại sau nhé.';
  };
  const host = document.createElement('div'); host.id = 'tr-cta'; box.append(host);
  meReady.then((me) => {
    if (!me || me.user || me.accounts === false) return; // đã đăng nhập hoặc chưa mở đăng ký: không mời
    mountCta(host, { src: 'tarot', onChat: () => { location.href = `/?tarot=${ids.join(',')}${topicKey ? `&chu=${topicKey}` : ''}`; } });
  });
}

// ---------- nghi thức trước khi bốc bài ----------
const R = $('#tr-ritual'), REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let topic = null, picks = [], ritualTimer = 0;
const FAN_DESKTOP = 9, FAN_PHONE = 9, FAN_MANY = 12, TODAY_DONE = () => getDaily() != null;
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
    <p class="rit-calm">Bốc khi lòng tương đối yên nhé. Đừng mong một câu trả lời chắc chắn: lá bài chỉ là một cớ để bạn nhìn lại mình.</p>
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
  const need = needOf(), multi = need > 1, phone = matchMedia('(max-width: 640px)').matches, many = need > 3, n = many ? FAN_MANY : phone ? FAN_PHONE : FAN_DESKTOP;
  // điện thoại hoặc nhiều lá: lưới lá to, không chồng nhau, cuộn được, để chạm trúng đúng lá; máy tính chọn một lá: xòe quạt
  const asGrid = phone || multi; // nhiều lá luôn dùng lưới (không chồng nhau) để không chạm nhầm lá bên cạnh; chỉ một lá trên máy tính mới xòe quạt
  const cards = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1) - 0.5, a = asGrid ? (many ? 0 : i % 2 ? 2.2 : -2.2) : t * 64, x = Math.sin((a * Math.PI) / 180), y = 1 - Math.cos((a * Math.PI) / 180);
    return `<button type="button" class="fan-card" style="--a:${a.toFixed(1)}deg;--x:${x.toFixed(3)};--y:${y.toFixed(3)};--d:${(i * 0.14).toFixed(2)}s" data-i="${i}" aria-pressed="false" aria-label="Lá bài úp số ${i + 1}">${cardBackSvg()}<span class="fan-n"></span></button>`;
  }).join('');
  R.innerHTML = `<div class="rit"><p class="rit-step">Bước 2 trên 2${topic ? ` · <b>${esc(topicLabel(topic))}</b>` : ''}</p><h2>Hãy nhìn vào bộ bài</h2>
    <p class="rit-sub" id="rit-sub">Hít một hơi thật chậm, giữ điều bạn muốn hỏi trong lòng. ${multi ? `Khi sẵn sàng, chạm vào <b>${NUM[need]} lá</b> đang gọi bạn, lần lượt từng lá. Chạm lại một lá để bỏ chọn, bạn chưa mở bài cho tới khi bấm xác nhận.` : 'Khi sẵn sàng, chạm vào <b>một lá</b> đang gọi bạn.'}</p>
    <div class="fan${asGrid ? ' grid' : ''}${many ? ' many' : ''}" id="fan">${cards}</div>
    <div class="rit-bar"><p class="rit-count" id="rit-count" aria-live="polite">${multi ? `Đã chọn 0/${need} · ${posLabel(need, 0)}` : 'Chưa chọn lá nào'}</p>
    ${multi ? `<button type="button" class="btn primary" id="rit-ok" disabled>Xác nhận, mở ${NUM[need]} lá</button><button type="button" class="rit-link" id="rit-reset" hidden>Chọn lại từ đầu</button>` : ''}</div>
    <div class="rit-acts"><button type="button" class="rit-link" id="rit-back">‹ Đổi chủ đề</button></div></div>`;
  $('#rit-back').onclick = phaseTopic;
  const btns = [...R.querySelectorAll('.fan-card')];
  if (!multi) {
    for (const b of btns) b.onclick = () => {
      if (b.classList.contains('picked')) return;
      picks.push(+b.dataset.i); b.classList.add('picked');
      for (const x of btns) x.disabled = true; setTimeout(phaseCharge, REDUCED ? 100 : 600);
    };
    return;
  }
  // nhiều lá: chạm để chọn hoặc bỏ chọn, đủ lá thì các lá còn lại khóa lại (tránh chạm nhầm), bấm xác nhận mới mở bài
  const ok = $('#rit-ok'), reset = $('#rit-reset'), count = $('#rit-count');
  const sync = () => {
    const full = picks.length >= need;
    btns.forEach((b) => {
      const k = picks.indexOf(+b.dataset.i);
      b.classList.toggle('picked', k >= 0); b.setAttribute('aria-pressed', String(k >= 0)); b.querySelector('.fan-n').textContent = k >= 0 ? k + 1 : ''; b.disabled = full && k < 0;
    });
    count.textContent = full ? `Đã đủ ${need} lá. Xem lại rồi bấm xác nhận nhé, hoặc chạm một lá để bỏ chọn.` : `Đã chọn ${picks.length}/${need} · ${posLabel(need, picks.length)}`;
    ok.disabled = !full; reset.hidden = !picks.length;
  };
  btns.forEach((b) => (b.onclick = () => {
    const i = +b.dataset.i, k = picks.indexOf(i);
    if (k >= 0) picks.splice(k, 1); else if (picks.length < need) picks.push(i);
    sync();
  }));
  reset.onclick = () => { picks = []; sync(); };
  ok.onclick = () => { ok.disabled = true; btns.forEach((b) => (b.disabled = true)); setTimeout(phaseCharge, REDUCED ? 100 : 400); };
}
function phaseCharge() {
  const shownBacks = Math.min(3, needOf()), lines = ['Hít một hơi thật chậm…', 'Giữ điều bạn muốn hỏi trong lòng…', 'Lá bài đang đến với bạn…'], gap = REDUCED ? 300 : 1100;
  R.innerHTML = `<div class="rit charge"><div class="aura" aria-hidden="true"></div><div class="ch-cards">${Array.from({ length: shownBacks }, (_, i) => `<div class="ch-card" style="--i:${i}">${cardBackSvg()}</div>`).join('')}</div>
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
    const ids = drawCards(needOf()); addHist(mode, ids); track('tarot_draw', { mode: 'three', spread: mode, id: ids[0] }); show(ids, { topicKey: topic }); // mọi kiểu nhiều lá vẫn tính chung là 'three' trong số liệu, kèm spread để tách riêng
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
