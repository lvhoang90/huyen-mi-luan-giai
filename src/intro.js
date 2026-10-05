// Mở màn: Huyền My xuất hiện ở tâm huy hiệu (ngay quả cầu), rồi dời lên (màn dọc) hoặc sang trái (màn ngang).
// Lần đầu tiên: cận mặt nhắm mắt, mở mắt, lùi ra toàn thân, huy hiệu hiện lên, rồi dời về chỗ. Các lần sau: bản ngắn.
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
const SEEN = 'huyenmy.seen';
const flag = { get: () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } }, set: () => { try { localStorage.setItem(SEEN, '1'); } catch {} } };

export function createIntro({ veil, area, setEmo }) {
  const body = document.body, skipBtn = veil.querySelector('.skip-intro');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [], running = false, finished = false;
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
  const place = ({ cx, cy, h, zoom = 1, fy = 36 }) => {
    area.style.left = cx + 'px'; area.style.top = cy + 'px'; area.style.height = h + 'px';
    area.style.setProperty('--zoom', zoom); area.style.setProperty('--fy', fy + '%');
  };
  const instant = (fn) => { body.classList.add('no-trans'); fn(); void area.offsetWidth; body.classList.remove('no-trans'); };
  const atSlot = () => { const r = rect('.hero-slot'); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: r.height }; };
  const atMedal = () => { const r = rect('.medal-svg'); return { cx: r.left + r.width / 2, cy: r.top + r.height * (232 / 478), h: r.width * 0.42 }; };
  const atFace = () => { const h = Math.min(innerHeight * 0.72, innerWidth * 1.05); return { cx: innerWidth / 2, cy: innerHeight / 2 + 0.14 * h, h }; }; // mắt ở khoảng 36% chiều cao: đặt mắt vào giữa màn hình
  const phase = (p) => { veil.dataset.intro = p; };

  function finish() {
    timers.forEach(clearTimeout); timers = []; running = false; finished = true;
    phase('done'); body.classList.add('veil-on', 'intro-done'); flag.set(); if (skipBtn) skipBtn.hidden = true;
  }
  function skip() {
    if (!running) return;
    timers.forEach(clearTimeout); timers = [];
    instant(() => { place(atSlot()); area.style.opacity = 1; }); setEmo('vui'); finish();
  }
  function full() {
    running = true; body.classList.add('veil-on'); phase('0'); if (skipBtn) skipBtn.hidden = false;
    instant(() => { place({ ...atFace(), zoom: 2.3 }); area.style.opacity = 0; });
    setEmo('tinh_tam');
    later(80, () => { area.style.opacity = 1; });
    later(2600, () => { setEmo('binh_thuong'); phase('1'); });
    later(3300, () => setEmo('vui'));
    later(4200, () => { phase('2'); place({ ...atMedal(), zoom: 1 }); });
    later(6700, () => { phase('3'); place(atSlot()); if (skipBtn) skipBtn.hidden = true; });
    later(8400, finish);
  }
  function short() {
    running = true; body.classList.add('veil-on'); phase('2');
    instant(() => { place({ ...atMedal(), zoom: 0.7 }); area.style.opacity = 0; });
    setEmo('binh_thuong');
    later(80, () => { area.style.opacity = 1; place({ ...atMedal(), zoom: 1 }); setEmo('vui'); });
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
  veil.addEventListener('pointerdown', (e) => { if (running && !e.target.closest('#veil-actions')) skip(); });
  skipBtn?.addEventListener('click', skip);
  addEventListener('resize', () => { if (finished && !veil.classList.contains('gone') && body.classList.contains('veil-on')) showStatic(); });
  return { start, release, showStatic, get running() { return running; } };
}
