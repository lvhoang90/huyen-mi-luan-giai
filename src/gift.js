// Màn hình chúc mừng khi quản trị tặng phút: pháo hoa nền, lời chúc, số phút nhận được, nút đóng sau khi xem.
// Người dùng bật "giảm chuyển động" thì không có pháo hoa, chỉ có thẻ chúc mừng. Đóng thẻ mới đánh dấu đã xem.
import './gift.css';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = ['#f7e6b0', '#e9cf88', '#ff8fa3', '#8fd3ff', '#b8a4ff', '#9df2c4', '#ffb86b'];

/** Pháo hoa trên canvas toàn màn hình. Trả về hàm dừng. Dừng khi tab ẩn để khỏi tốn pin. */
export function fireworks(canvas) {
  const ctx = canvas.getContext('2d'); let w = 0, h = 0, raf = 0, last = 0, nextBurst = 0, stopped = false; const parts = [];
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const burst = (x, y) => {
    const n = 46 + Math.floor(Math.random() * 24), base = COLORS[Math.floor(Math.random() * COLORS.length)], alt = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2, sp = 1.4 + Math.random() * 3.2;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: 0.008 + Math.random() * 0.01, c: i % 3 ? base : alt, r: 1.2 + Math.random() * 1.6 });
    }
  };
  const tick = (t) => {
    if (stopped) return; raf = requestAnimationFrame(tick);
    const dt = Math.min(2.5, (t - (last || t)) / 16.7); last = t;
    if (t > nextBurst) { burst(w * (0.15 + Math.random() * 0.7), h * (0.12 + Math.random() * 0.4)); nextBurst = t + 450 + Math.random() * 650; }
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.045 * dt; p.vx *= 0.992; p.life -= p.decay * dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); last = 0; } else if (!stopped) raf = requestAnimationFrame(tick); };
  document.addEventListener('visibilitychange', vis); raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); removeEventListener('resize', size); };
}

export const giftText = (g) => ({
  per: `+${g.minutes} phút`,
  span: g.days ? `mỗi ngày, trong ${g.days} ngày` : 'mỗi ngày, không giới hạn thời gian',
  rank: g.rank ? `Hạng ${g.rank} trong nhóm tester xuất sắc` : '',
  msg: g.message || 'Cảm ơn bạn đã đồng hành và góp ý cho Huyền My. Món quà nhỏ này là lời cảm ơn của Admin.',
  title: g.title || 'Chúc mừng bạn!',
});

/** Hiện một quà. Trả về lời hứa hoàn tất khi người dùng bấm đóng. */
export function celebrate(g, { animate = !matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  return new Promise((resolve) => {
    const t = giftText(g), prev = document.activeElement;
    const back = Object.assign(document.createElement('div'), { className: 'gift-back' });
    back.innerHTML = `${animate ? '<canvas class="gift-fx" aria-hidden="true"></canvas>' : ''}
      <div class="gift-card" role="dialog" aria-modal="true" aria-labelledby="gift-h" aria-describedby="gift-p">
        <div class="gift-ic" aria-hidden="true">🎁</div>
        <h2 id="gift-h">${esc(t.title)}</h2>
        ${t.rank ? `<div class="gift-rank">${esc(t.rank)}</div>` : ''}
        <p id="gift-p" class="gift-msg">${esc(t.msg)}</p>
        <div class="gift-big"><b>${esc(t.per)}</b><span>${esc(t.span)}</span></div>
        <p class="gift-from">Quà từ Admin Huyền My Luận Giải</p>
        <button type="button" class="gift-ok">Đã xem, đóng lại</button>
      </div>`;
    document.body.append(back); document.documentElement.classList.add('gift-open');
    const stop = animate ? fireworks(back.querySelector('.gift-fx')) : () => {};
    const btn = back.querySelector('.gift-ok'); btn.focus();
    const done = () => { stop(); removeEventListener('keydown', onKey); back.remove(); document.documentElement.classList.remove('gift-open'); prev?.focus?.(); resolve(); };
    const onKey = (e) => { if (e.key === 'Escape') done(); else if (e.key === 'Tab') { e.preventDefault(); btn.focus(); } };
    addEventListener('keydown', onKey); btn.onclick = done;
  });
}

/** Gọi sau khi biết người dùng đã đăng nhập: lấy các quà chưa xem, hiện lần lượt, mỗi quà đóng xong mới đánh dấu đã xem. */
export async function showGifts() {
  let list = [];
  try { list = (await (await fetch('/api/gift')).json()).gifts ?? []; } catch { return 0; }
  for (const g of list) {
    await celebrate(g);
    try { await fetch('/api/gift/seen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: g.id }) }); } catch {}
  }
  return list.length;
}
