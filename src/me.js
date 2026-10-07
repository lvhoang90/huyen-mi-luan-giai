// Góc của tôi: thời gian trò chuyện hôm nay, lượt giới thiệu bạn bè, bộ sưu tập Tarot và lá số của riêng bạn.
// Bài đã rút và lá số chỉ nằm trên máy này (localStorage), không gửi lên máy chủ. Máy chủ chỉ trả các con số về thời gian và lượt giới thiệu.
import './pwa.js';
import './style.css';
import './explore.css';
import './tarot.css';
import './me.css';
import { mountLogo } from './logo.js';
import { track } from './track.js';
import { icon } from './icons.js';
import { CARDS, cardById } from './tarot/cards.js';
import { cardArtSvg } from './tarot/art.js';
import { buildChart } from './engine/index.js';
import { CHINH_TINH } from './chart-explain.js';
import { NUMBER_KEYWORDS } from './engine/numerology.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const root = $('#me-root');
mountLogo($('#brand'), 'compact');
track('me_view');

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const fmtDay = (t) => new Date(t).toLocaleDateString('vi-VN');

async function main() {
  let data = null, status = 0;
  try { const r = await fetch('/api/panel'); status = r.status; data = r.ok ? await r.json() : null; } catch {}
  if (!data) return root.innerHTML = guest(status);
  root.innerHTML = [hero(data), timeCard(data), inviteCard(data), cardsCard(), chartCard(), shareCard(data), settings(data)].join('');
  wire(data); lazyArt();
}

const guest = (status) => `<section class="me-card me-guest"><img src="/art/huyenmy-avatar.svg" alt="" width="96" height="96">
  <h1>Góc riêng của bạn</h1>
  <p>${status === 401 ? 'Đăng nhập bằng email để mở góc riêng: xem thời gian trò chuyện mỗi ngày, mời bạn bè để được thêm giờ, và giữ bộ sưu tập lá bài của bạn.' : 'Chưa mở được góc của bạn lúc này, bạn thử lại sau ít phút nhé.'}</p>
  <a class="btn primary" href="/?login=1">Đăng nhập hoặc đăng ký</a></section>`;

function hero(d) {
  const p = read('huyenmy.v1')?.profile; const first = p?.fullName ? String(p.fullName).trim().split(/\s+/).pop() : '';
  return `<section class="me-hero"><img src="/art/huyenmy-avatar.svg" alt="" width="84" height="84"><div><h1>${first ? `Chào ${esc(first)}` : 'Chào bạn'}</h1>
    <p>Đây là góc riêng của bạn với My. ${d.user.since ? `Bạn đồng hành cùng My từ ${fmtDay(d.user.since)}.` : ''}</p></div></section>`;
}

function ring(used, total) {
  const R = 52, C = 2 * Math.PI * R, left = Math.max(0, total - used), frac = total ? Math.min(1, used / total) : 0;
  return `<svg class="me-ring" viewBox="0 0 130 130" role="img" aria-label="Còn ${left} phút hôm nay"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#c9a6ff"/></linearGradient></defs>
    <circle cx="65" cy="65" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="11"/>
    <circle cx="65" cy="65" r="${R}" fill="none" stroke="url(#rg)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${f(C * frac)}" transform="rotate(-90 65 65)"/>
    <text x="65" y="63" text-anchor="middle" class="rn">${left}</text><text x="65" y="82" text-anchor="middle" class="ru">phút còn lại</text></svg>`;
}
const f = (n) => Math.round(n * 10) / 10;

function timeCard(d) {
  const t = d.time;
  if (t.unlimited) return `<section class="me-card"><h2>Thời gian trò chuyện</h2><p>Hiện bạn được trò chuyện với My không giới hạn thời gian mỗi ngày.</p></section>`;
  return `<section class="me-card me-time"><h2>Thời gian trò chuyện hôm nay</h2>
    <div class="me-time-row">${ring(t.usedMin, t.totalMin)}<ul class="me-break">
      <li><span>Mỗi ngày</span><b>${t.baseMin} phút</b></li>
      <li><span>Quà từ bạn bè</span><b class="gold">+${t.bonusMin} phút</b></li>
      <li class="sum"><span>Tổng mỗi ngày</span><b>${t.totalMin} phút</b></li>
      <li><span>Đã dùng hôm nay</span><b>${t.usedMin} phút</b></li></ul></div>
    <p class="sub">Thời gian làm mới mỗi sáng. Phút từ bạn bè được tính mỗi ngày và cộng dồn, không mất đi.</p></section>`;
}

function inviteCard(d) {
  const r = d.referral, link = `${location.origin}/?ref=${d.refCode}`;
  const slots = Array.from({ length: r.maxRefs }, (_, i) => `<span class="slot${i < r.qualified ? ' on' : ''}" title="${i < r.qualified ? 'Đã nhận +' + r.perMin + ' phút mỗi ngày' : 'Chưa có'}">${icon('heart')}</span>`).join('');
  const rows = r.list.map((x) => `<li class="${x.qualified ? 'ok' : ''}"><span class="av">${x.n}</span><div><b>Bạn #${x.n}</b><small>${x.qualified ? `Đã đăng ký và trò chuyện đủ ${r.qualifyMin} phút, bạn được +${r.perMin} phút mỗi ngày` : `Đã đăng ký, đang trò chuyện ${x.chatMin}/${r.qualifyMin} phút`}</small>${x.qualified ? '' : `<i class="bar"><u style="width:${Math.round((x.chatMin / r.qualifyMin) * 100)}%"></u></i>`}</div></li>`).join('');
  return `<section class="me-card me-invite"><h2>Mời bạn bè, nhận thêm giờ với My</h2>
    <p>Mỗi người bạn đăng ký bằng email qua liên kết của bạn và trò chuyện với My trên <b>${r.qualifyMin} phút</b>, bạn được thêm <b>${r.perMin} phút mỗi ngày</b>. Cộng dồn, tối đa ${r.maxRefs} người bạn.</p>
    <div class="me-link"><input id="me-link" readonly value="${esc(link)}" aria-label="Liên kết giới thiệu của bạn"><button type="button" class="btn primary" id="me-copy">Sao chép</button><button type="button" class="btn" id="me-share">Chia sẻ</button></div>
    <div class="me-slots" aria-label="${r.qualified} trên ${r.maxRefs} người bạn đã đạt">${slots}</div>
    ${r.funnel ? `<ul class="me-funnel" aria-label="Liên kết của bạn đang đi tới đâu"><li><b>${r.funnel.visitors}</b><span>người đã mở liên kết</span></li><li><b>${r.funnel.chatted}</b><span>đã trò chuyện với My</span></li><li><b>${r.funnel.signups}</b><span>đã đăng ký</span></li><li><b>${r.qualified}</b><span>đã tặng bạn giờ</span></li></ul>` : ''}
    <p class="sub">${r.invited ? `${r.qualified} đã đạt, ${r.invited - r.qualified} đang trên đường.` : 'Chưa có người bạn nào đăng ký qua liên kết của bạn.'} Bạn chỉ thấy số thứ tự, không thấy email của họ.</p>
    ${rows ? `<ul class="me-friends">${rows}</ul>` : ''}</section>`;
}

function cardsCard() {
  const hist = read('huyenmy.tarothist') ?? [], seen = new Set(hist.flatMap((h) => h.ids)), total = CARDS.length;
  const recent = hist.slice(0, 6).map((h) => `<li><b>${fmtDay(h.d + 'T12:00:00')}</b> <span>${h.m === 'three' ? 'Ba lá' : 'Lá của ngày'}</span><div>${h.ids.map((id) => cardById(id)?.name).filter(Boolean).map(esc).join(', ')}</div></li>`).join('');
  const grid = CARDS.map((c) => seen.has(c.id) ? `<a class="mc on" href="/tarot?c=${c.id}" data-id="${c.id}" title="${esc(c.name)}"><span class="art"></span></a>` : `<span class="mc" title="Chưa gặp"><i>?</i></span>`).join('');
  return `<section class="me-card"><h2>Bộ bài của tôi</h2>
    <p>Bạn đã gặp <b>${seen.size}/${total}</b> lá. <i class="bar wide"><u style="width:${Math.round((seen.size / total) * 100)}%"></u></i></p>
    <div class="me-deck">${grid}</div>
    ${recent ? `<h3>Những lần rút gần đây</h3><ul class="me-hist">${recent}</ul>` : '<p class="sub">Bạn chưa rút lá nào. Mỗi lá bạn rút sẽ hiện ra ở đây.</p>'}
    <p class="sub">Danh sách này chỉ lưu trên máy này, không gửi đi đâu.</p><a class="btn" href="/tarot">Rút lá hôm nay</a></section>`;
}

function chartCard() {
  const p = read('huyenmy.v1')?.profile;
  if (!p?.birth) return `<section class="me-card"><h2>Lá số của tôi</h2><p>Bạn chưa lập lá số trên máy này. Kể với My ngày giờ sinh để bắt đầu.</p><a class="btn primary" href="/">Lập lá số cùng My</a></section>`;
  let c; try { c = buildChart(p); } catch { return ''; }
  const chips = [];
  const m = c.tuvi?.palaces.find((x) => x.name === 'Mệnh');
  if (m?.chinh?.length) chips.push(['Tử Vi', `Cung Mệnh có ${m.chinh.join(', ')}: ${CHINH_TINH[m.chinh[0]] ?? ''}`]);
  chips.push(['Tứ Trụ', `Nhật chủ ${c.bazi.dayMaster.can} (${c.bazi.dayMaster.hanh}), hành ${c.bazi.elements.dominant} đang trội`]);
  chips.push(['Chiêm tinh', `Mặt Trời ${c.astro.sun.name}, Mặt Trăng ${c.astro.moon.name}${c.astro.asc ? `, cung mọc ${c.astro.asc.name}` : ''}`]);
  chips.push(['Thần số', `Số chủ đạo ${c.numerology.lifePath}: ${NUMBER_KEYWORDS[c.numerology.lifePath] ?? ''}`]);
  return `<section class="me-card"><h2>Lá số của tôi</h2><p class="sub">${esc(p.fullName ?? '')} · ${p.birth.d}/${p.birth.m}/${p.birth.y}</p>
    <ul class="me-chart">${chips.map(([k, v]) => `<li><b>${k}</b><span>${esc(v)}</span></li>`).join('')}</ul>
    <p class="sub">Đây là cách gọi truyền thống để bạn tự soi, không phải kết luận về cuộc đời.</p><a class="btn primary" href="/">Xem lá số và hỏi My</a></section>`;
}

function shareCard(d) {
  return `<section class="me-card me-stats"><h2>Lượt chia sẻ của tôi</h2><div class="me-stat-row">
    <div><b>${d.shares.tarot}</b><span>lần chia sẻ lá bài</span></div><div><b>${d.shares.chart}</b><span>lần chia sẻ lá số</span></div>
    <div><b>${d.referral.invited}</b><span>bạn đã đăng ký</span></div><div><b>${d.referral.qualified}</b><span>bạn đã tặng giờ</span></div></div></section>`;
}

function settings(d) {
  const u = d.user;
  return `<details class="me-set"><summary>Cài đặt tài khoản</summary><div class="me-set-in"><p class="em">${esc(u.email)}</p>
    <p class="sm">${u.consentMemory ? 'My đang lưu cuộc trò chuyện của bạn trên máy chủ để bạn tiếp tục ở mọi thiết bị.' : 'My chỉ nhớ bạn trên thiết bị này.'}</p>
    <div class="links"><button type="button" id="st-mem">${u.consentMemory ? 'Tắt lưu và xóa bản đã lưu' : 'Bật lưu cuộc trò chuyện'}</button><button type="button" id="st-rem">${u.remind ? 'Tắt email nhắc quay lại' : 'Bật email nhắc quay lại'}</button>${u.role === 'admin' ? '<a href="/admin">Trang quản trị</a>' : ''}<button type="button" id="st-out">Đăng xuất</button></div>
    <button type="button" class="del" id="st-del">Xóa tài khoản và dữ liệu</button></div></details>`;
}
async function api(path, method = 'POST', body) {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, ...(await r.json().catch(() => ({}))) };
}
function wireSettings(d) {
  const u = d.user, again = () => location.reload();
  $('#st-mem').onclick = async () => { const want = !u.consentMemory; const state = read('huyenmy.v1'); const r = await api('/api/state', 'PUT', want ? { consentMemory: true, state } : { consentMemory: false }); if (r.ok || !want) again(); };
  $('#st-rem').onclick = async () => { const r = await api('/api/account/remind', 'POST', { on: !u.remind }); if (r.ok) again(); };
  $('#st-out').onclick = async () => { await api('/api/auth/logout'); location.href = '/'; };
  $('#st-del').onclick = (e) => { if (e.target.dataset.sure) api('/api/account/delete').then(() => { try { localStorage.removeItem('huyenmy.v1'); } catch {} location.href = '/'; }); else { e.target.dataset.sure = '1'; e.target.textContent = 'Bấm lần nữa để xác nhận xóa tài khoản và toàn bộ dữ liệu'; } };
}

function wire(d) {
  wireSettings(d);
  const link = `${location.origin}/?ref=${d.refCode}`;
  $('#me-copy').onclick = async (e) => { try { await navigator.clipboard.writeText(link); } catch { $('#me-link').select(); document.execCommand?.('copy'); } e.target.textContent = 'Đã chép'; setTimeout(() => (e.target.textContent = 'Sao chép'), 1800); track('me_copy'); };
  $('#me-share').onclick = async () => { track('me_share'); if (navigator.share) { try { await navigator.share({ title: 'Huyền My Luận Giải', text: 'Mình đang trò chuyện với My, một người bạn đồng hành xem lá số và Tarot. Bạn thử cùng mình nhé.', url: link }); } catch {} } else $('#me-copy').click(); };
}
function lazyArt() {
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { const el = e.target, c = cardById(el.dataset.id); el.querySelector('.art').innerHTML = cardArtSvg(c, `m${c.id}`); io.unobserve(el); } }, { rootMargin: '200px' });
  document.querySelectorAll('.mc.on').forEach((el) => io.observe(el));
}
main();
