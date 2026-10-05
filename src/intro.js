// Mở màn: Huyền My xuất hiện ở tâm huy hiệu (ngay quả cầu), rồi dời lên (màn dọc) hoặc sang trái (màn ngang).
// Lần đầu tiên: cận mặt nhắm mắt, mở mắt, lùi ra toàn thân, huy hiệu hiện lên, rồi dời về chỗ. Các lần sau: bản ngắn.
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
import { track } from './track.js';
import { sound } from './sound.js';
const SEEN = 'huyenmy.seen';
const flag = { get: () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } }, set: () => { try { localStorage.setItem(SEEN, '1'); } catch {} } };

export function createIntro({ veil, area, setEmo, poke, greeting, variant = '' }) {
  const body = document.body, skipBtn = veil.querySelector('.skip-intro');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t0 = 0, timers = [], running = false, finished = false, kind = '';
  const greet = veil.querySelector('.greet');
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
  const place = ({ cx, cy, h, zoom = 1, fy = 36 }) => {
    area.style.left = cx + 'px'; area.style.top = cy + 'px'; area.style.height = h + 'px';
    area.style.setProperty('--zoom', zoom); area.style.setProperty('--fy', fy + '%');
  };
  const instant = (fn) => { body.classList.add('no-trans'); fn(); void area.offsetWidth; body.classList.remove('no-trans'); };
  // Đo chỗ của nhân vật ở bố cục cuối (hai cột ở màn ngang), kể cả khi đang ở pha logo nằm giữa.
  const atSlot = () => {
    const prev = veil.dataset.intro; body.classList.add('no-trans'); veil.dataset.intro = 'done'; void veil.offsetWidth;
    const r = rect('.hero-slot'); veil.dataset.intro = prev; void veil.offsetWidth; body.classList.remove('no-trans');
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: r.height };
  };
  const atMedal = () => { const r = rect('.medal-svg'); return { cx: r.left + r.width / 2, cy: r.top + r.height * (232 / 478), h: r.width * 0.42 }; };
  const atFace = () => { const h = Math.min(innerHeight * 0.72, innerWidth * 1.05); return { cx: innerWidth / 2, cy: innerHeight / 2 + 0.14 * h, h }; }; // mắt ở khoảng 36% chiều cao: đặt mắt vào giữa màn hình
  const phase = (p) => { veil.dataset.intro = p; };

  function finish() {
    timers.forEach(clearTimeout); timers = []; running = false; finished = true;
    phase('done'); body.classList.add('veil-on', 'intro-done'); flag.set(); if (skipBtn) skipBtn.hidden = true;
  }
  function skip() {
    if (!running) return;
    track('intro_skip', { kind, at: Math.round(performance.now() - t0), gv: variant });
    timers.forEach(clearTimeout); timers = [];
    instant(() => { place(atSlot()); area.style.opacity = 1; }); setEmo('vui'); finish();
  }
  function full() {
    kind = 'full'; t0 = performance.now(); track('intro_view', { kind, gv: variant });
    const g = greeting?.(); if (greet && g) greet.textContent = g;
    running = true; body.classList.add('veil-on'); phase('0'); if (skipBtn) skipBtn.hidden = false;
    instant(() => { place({ ...atFace(), zoom: 2.3 }); area.style.opacity = 0; });
    setEmo('tinh_tam');
    // Rút từ 8,4 giây xuống 4,6 giây (53% người dùng lần đầu từng bỏ qua bản dài): mở mắt sớm hơn, lời chào hiện cùng lúc huy hiệu.
    later(80, () => { area.style.opacity = 1; });
    later(1200, () => { setEmo('binh_thuong'); phase('1'); sound.breath(); });
    later(1800, () => setEmo('vui'));
    later(2200, () => { phase('2'); place({ ...atMedal(), zoom: 1 }); sound.chime(); if (greet && g) greet.classList.add('on'); });
    later(3500, () => { phase('3'); place(atSlot()); if (skipBtn) skipBtn.hidden = true; });
    later(4600, finish);
  }
  function short() {
    kind = 'short'; t0 = performance.now(); track('intro_view', { kind, gv: variant });
    const g = greeting?.(); if (greet && g) { greet.textContent = g; greet.classList.add('on'); }
    running = true; body.classList.add('veil-on'); phase('2');
    instant(() => { place({ ...atMedal(), zoom: 0.7 }); area.style.opacity = 0; });
    setEmo('binh_thuong');
    later(80, () => { area.style.opacity = 1; place({ ...atMedal(), zoom: 1 }); setEmo('vui'); sound.chime(); });
    later(1700, () => { phase('3'); place(atSlot()); });
    later(3300, finish);
  }
  /** Màn chào ở trạng thái cuối, không hiệu ứng (giảm chuyển động, màn nghỉ, đổi kích thước). */
  function showStatic() {
    timers.forEach(clearTimeout); timers = []; running = false;
    body.classList.add('veil-on', 'intro-done'); phase('done');
    instant(() => { place(atSlot()); area.style.opacity = 1; }); setEmo('vui'); if (skipBtn) skipBtn.hidden = true;
  }
  function start() {
    if (reduced) return showStatic();
    flag.get() ? short() : full();
  }
  /** Khi bước vào cuộc trò chuyện: trả nhân vật về vị trí của khung trò chuyện (có chuyển động). */
  function release() {
    timers.forEach(clearTimeout); timers = []; running = false;
    body.classList.remove('veil-on', 'intro-done');
    ['left', 'top', 'height', 'opacity'].forEach((k) => area.style.removeProperty(k));
    area.style.removeProperty('--zoom'); area.style.removeProperty('--fy');
  }
  veil.addEventListener('pointerdown', (e) => {
    sound.unlock();
    if (running && !e.target.closest('#veil-actions')) return skip();
    if (!running && !e.target.closest('#veil-actions, button, a, .snd')) { poke?.(e.clientX, e.clientY); sound.tap(); }
  });
  skipBtn?.addEventListener('click', skip);
  addEventListener('resize', () => { if (finished && !veil.classList.contains('gone') && body.classList.contains('veil-on')) showStatic(); });
  return { start, release, showStatic, get running() { return running; } };
}
