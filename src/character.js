// Điều khiển nhân vật Huyền My 2D: cảm xúc (mắt, mày, miệng, má, tay, hiệu ứng), ánh nhìn, quay đầu, nghiêng, nảy, thở.
import rigSvg from './assets/huyenmy-rig.svg?raw';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));

/**
 * eyes/brows/mouth/pose/blush/fx chọn biến thể trong tệp rig.
 * gaze: hướng nhìn [-1..1] (x: trái-phải, y: lên-xuống). follow: mức nhìn theo con trỏ (0..1).
 * tilt: nghiêng đầu (độ). bounce: biên độ nảy (px). droop: rũ vai. lean: cúi về trước (px). orb: [dx, dy, scale].
 */
export const EMOTIONS = {
  binh_thuong: { label: 'Bình thường', note: 'dịu dàng, sẵn sàng', eyes: 'open', brows: 'neutral', mouth: 'smile-closed', pose: 'hold', blush: 'n', fx: [], gaze: [0, 0], follow: 0.6, tilt: 0, orb: [0, 0, 1] },
  lang_nghe: { label: 'Lắng nghe', note: 'chăm chú, nghiêng đầu', eyes: 'open', brows: 'soft', mouth: 'smile-closed', pose: 'hold', blush: 'n', fx: [], gaze: [0, 0.05], follow: 0.25, tilt: 4, lean: 4, orb: [0, 0, 1] },
  vui: { label: 'Vui', note: 'mắt sáng, cười rạng rỡ', eyes: 'open', brows: 'up', mouth: 'smile', pose: 'hold', blush: 's', fx: ['sparkle'], gaze: [0, 0], follow: 0.25, tilt: -3, bounce: 3, orb: [0, -4, 1.05] },
  cuoi_tit: { label: 'Cười tít mắt', note: 'cười rũ rượi, mắt cong tít lại', eyes: 'happy', brows: 'up', mouth: 'grin', pose: 'hold', blush: 'x', fx: ['sparkle'], gaze: [0, 0], follow: 0, tilt: -4, bounce: 4, shake: 1.6, orb: [0, -6, 1.05] },
  hao_hung: { label: 'Hào hứng', note: 'mắt sáng, giơ tay reo', eyes: 'wide', brows: 'up', mouth: 'grin', pose: 'cheer', blush: 's', fx: ['sparkle'], gaze: [0, -0.1], follow: 0.2, tilt: -2, bounce: 10, orb: [0, -10, 0.95] },
  xuc_dong: { label: 'Xúc động', note: 'rơm rớm nước mắt, mỉm cười', eyes: 'teary', brows: 'soft', mouth: 'smile-closed', pose: 'clasp', blush: 's', fx: ['glow'], gaze: [0, 0.1], follow: 0.1, tilt: 5, orb: [0, 6, 0.85] },
  buon: { label: 'Buồn', note: 'mắt ướt, nhìn xuống, rũ vai', eyes: 'sad', brows: 'sad', mouth: 'frown', pose: 'hold', blush: 'n', fx: ['tear'], gaze: [-0.15, 0.9], follow: 0, tilt: 7, droop: 1, orb: [0, 4, 0.9] },
  dong_cam: { label: 'Đồng cảm', note: 'tay đặt lên ngực, ánh nhìn ấm', eyes: 'tender', brows: 'soft', mouth: 'smile-closed', pose: 'heart', blush: 's', fx: ['glow'], gaze: [0, 0.15], follow: 0.1, tilt: 6, lean: 3, orb: [0, 6, 0.8] },
  chia_se: { label: 'Chia sẻ', note: 'mở lòng bàn tay, hơi nghiêng về trước', eyes: 'open', brows: 'soft', mouth: 'smile', pose: 'open', blush: 'n', fx: [], gaze: [0, 0], follow: 0.3, tilt: -3, lean: 6, orb: [0, -2, 1.05] },
  tran_tro: { label: 'Trăn trở', note: 'nhíu mày, mắt lảng đi, đổ mồ hôi', eyes: 'open', brows: 'worried', mouth: 'wavy', pose: 'hold', blush: 'n', fx: ['sweat'], gaze: [-0.8, 0.55], follow: 0, tilt: -5, droop: 0.3, orb: [0, 2, 0.95] },
  chiem_nghiem: { label: 'Chiêm nghiệm', note: 'mắt khép nửa, tay chống cằm, nhìn xa', eyes: 'half', brows: 'relaxed', mouth: 'smile-closed', pose: 'chin', blush: 'n', fx: [], gaze: [0.7, -0.55], follow: 0, tilt: -6, orb: [-6, 0, 1] },
  suy_nghi: { label: 'Suy nghĩ', note: 'nhướn một bên mày, nhìn lên', eyes: 'open', brows: 'raise', mouth: 'flat', pose: 'hold', blush: 'n', fx: ['think'], gaze: [0.85, -0.8], follow: 0, tilt: -4, orb: [0, -2, 1.1] },
  ngac_nhien: { label: 'Ngạc nhiên', note: 'mắt tròn, miệng chữ o', eyes: 'surprised', brows: 'up', mouth: 'o', pose: 'open', blush: 'n', fx: ['shock'], gaze: [0, 0], follow: 0, tilt: 0, bounce: 6, orb: [0, -8, 1] },
  e_then: { label: 'E thẹn', note: 'đỏ mặt, hai tay ôm má, né ánh nhìn', eyes: 'open', brows: 'soft', mouth: 'cat', pose: 'cheeks', blush: 'x', fx: ['shy'], gaze: [-0.7, 0.7], follow: 0, tilt: 6, orb: [0, 6, 0.85] },
  an_ui: { label: 'An ủi', note: 'nhắm mắt dịu, tay ôm tim, trái tim bay lên', eyes: 'closed', brows: 'soft', mouth: 'smile-closed', pose: 'heart', blush: 's', fx: ['hearts', 'glow'], gaze: [0, 0], follow: 0, tilt: 7, lean: 3, orb: [0, 6, 0.8] },
  tinh_tam: { label: 'Tĩnh tâm', note: 'nhắm mắt, mỉm cười, quầng sáng dịu', eyes: 'closed', brows: 'soft', mouth: 'smile-closed', pose: 'hold', blush: 's', fx: ['glow'], gaze: [0, 0], follow: 0, tilt: 0, orb: [0, 0, 1] },
  khich_le: { label: 'Khích lệ', note: 'nháy mắt, nắm tay cố lên', eyes: 'wink', brows: 'up', mouth: 'smirk', pose: 'fist', blush: 's', fx: ['sparkle'], gaze: [0, 0], follow: 0.2, tilt: -5, bounce: 3, orb: [0, 0, 1] },
  tinh_nghich: { label: 'Tinh nghịch', note: 'nháy mắt, lè lưỡi', eyes: 'wink', brows: 'raise', mouth: 'tongue', pose: 'hold', blush: 's', fx: ['sparkle'], gaze: [0, 0], follow: 0.3, tilt: -6, bounce: 3, orb: [0, -2, 1.05] },
  nghiem_tuc: { label: 'Nghiêm túc', note: 'tập trung khi nói điều quan trọng', eyes: 'open', brows: 'furrow', mouth: 'flat', pose: 'hold', blush: 'n', fx: [], gaze: [0, 0], follow: 0.1, tilt: 0, orb: [0, 0, 1.05] },
};
export const EMOTION_NAMES = Object.keys(EMOTIONS);
const MOOD_MAP = { idle: 'binh_thuong', listen: 'lang_nghe', think: 'suy_nghi' };

const pointer = { px: null, py: null, at: -1e9 };
const track = (x, y) => { pointer.px = x; pointer.py = y; pointer.at = performance.now(); };
addEventListener('pointermove', (e) => track(e.clientX, e.clientY), { passive: true });
addEventListener('pointerdown', (e) => track(e.clientX, e.clientY), { passive: true });
addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) track(t.clientX, t.clientY); }, { passive: true });

export function createCharacter(host, { follow = true, crop = false } = {}) {
  host.innerHTML = rigSvg;
  const svg = host.querySelector('svg.hm');
  if (crop) svg.setAttribute('viewBox', '110 150 380 470');
  const $ = (id) => svg.querySelector('#' + id);
  const all = $('all'), body = $('body'), head = $('head'), features = $('features'), brows = $('brows'), hairFront = $('hair-front'), arms = $('arms'), orb = $('orb'), shadow = $('shadow');
  let emo = 'binh_thuong', cfg = EMOTIONS[emo], speaking = false, castUntil = 0, tint = null;
  const cur = { tilt: 0, yaw: 0, gx: 0, gy: 0, droop: 0, lean: 0, ox: 0, oy: 0, os: 1, cast: 0 };
  const sac = { x: 0, y: 0, next: 1.5 };
  // Năm viên ngọc ngũ hành trên nón: ánh sáng chạy vòng theo chiều tương sinh Hỏa → Thổ → Kim → Thủy → Mộc.
  const NS = 'http://www.w3.org/2000/svg', mk = (tag, a, parent, before) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); parent.insertBefore(e, before ?? null); return e; };
  const gemEls = [...svg.querySelectorAll('#hat circle[r="8.5"][stroke="#6b4414"]')].slice(0, 5);
  const sectors = [...svg.querySelectorAll('#hat polygon[fill-opacity=".17"]')].slice(0, 5);
  const hatDash = svg.querySelector('#hat circle[stroke-dasharray="2 5"]');
  let defs = svg.querySelector('defs'); if (!defs) defs = mk('defs', {}, svg, svg.firstChild);
  const blurF = mk('filter', { id: 'hm-blur', x: '-80%', y: '-80%', width: '260%', height: '260%' }, defs); mk('feGaussianBlur', { stdDeviation: 4.5 }, blurF);
  const gems = gemEls.map((el) => {
    const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy');
    const glow = mk('circle', { cx, cy, r: 17, fill: el.getAttribute('fill'), opacity: 0, filter: 'url(#hm-blur)' }, el.parentNode, el);
    return { el, glow, cx, cy, spark: el.nextElementSibling };
  });
  const orbG = svg.querySelector('#orb'), orbCircles = orbG ? [...orbG.querySelectorAll('circle')] : [];
  const orbHalo = orbCircles[0], orbRing = orbG?.querySelector('circle[stroke-dasharray]');
  const orbGlow = orbG ? mk('circle', { cx: 300, cy: 552, r: 46, fill: '#c9b0ff', opacity: 0.3, filter: 'url(#hm-blur)' }, orbG, orbCircles[1]) : null;
  const orbSparks = orbG ? Array.from({ length: 6 }, (_, i) => ({ el: mk('circle', { r: 1.8, fill: '#fff6c8', opacity: 0 }, orbG), a: (i / 6) * 6.283, sp: 0.6 + (i % 3) * 0.25, rad: 44 + (i % 2) * 8 })) : [];
  const mouth = { o: 0.3, w: 1, to: 0.3, tw: 1, fedAt: -9 };
  let pokeUntil = 0, blinkAt = 2, blinkEnd = 0, raf = 0, last = performance.now(), t = 0;

  function setEmotion(name) {
    const e = EMOTIONS[name]; if (!e) return;
    emo = name; cfg = e;
    svg.setAttribute('data-eyes', e.eyes); svg.setAttribute('data-brows', e.brows); svg.setAttribute('data-mouth', e.mouth);
    svg.setAttribute('data-pose', e.pose); svg.setAttribute('data-blush', e.blush); svg.setAttribute('data-fx', e.fx.join(' '));
  }
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    const k = REDUCED ? 0.3 : 1, engaged = performance.now() - pointer.at < 4500 || t < pokeUntil;
    const f = follow ? (engaged ? Math.max(cfg.follow, 0.95) : cfg.follow) : 0;
    // hướng nhìn tính từ đầu nhân vật tới con trỏ (không phải từ giữa màn hình), nên nhân vật đứng bên trái vẫn nhìn đúng vào con trỏ
    const hb = host.getBoundingClientRect(), hx = hb.left + hb.width / 2, hy = hb.top + hb.height * 0.34;
    const pointerX = pointer.px == null ? 0 : clamp((pointer.px - hx) / Math.max(180, innerWidth * 0.32)), pointerY = pointer.py == null ? 0 : clamp((pointer.py - hy) / Math.max(160, innerHeight * 0.3));
    const pointerRef = { x: pointerX, y: pointerY };
    // ánh mắt thoáng đảo nhẹ cho có hồn
    sac.next -= dt; if (sac.next <= 0) { sac.x = (Math.random() - 0.5) * 0.5; sac.y = (Math.random() - 0.5) * 0.35; sac.next = 1.3 + Math.random() * 2.6; }
    const gx = clamp(cfg.gaze[0] + pointerRef.x * 0.95 * f + sac.x * (1 - f * 0.5)), gy = clamp(cfg.gaze[1] + pointerRef.y * 0.8 * f + sac.y * (1 - f * 0.5));
    // miệng mấp máy theo chữ đang hiện ra; nếu lâu không có chữ mới thì tự nhép nhẹ cho khỏi đứng hình
    if (speaking) { if (t - mouth.fedAt > 0.3) { mouth.to = 0.25 + 0.5 * Math.abs(Math.sin(t * 9)); mouth.tw = 1; }
      mouth.o = damp(mouth.o, mouth.to, 32, dt); mouth.w = damp(mouth.w, mouth.tw, 28, dt);
      svg.style.setProperty('--mo', mouth.o.toFixed(3)); svg.style.setProperty('--mw', mouth.w.toFixed(3)); }
    cur.gx = damp(cur.gx, gx, 9, dt); cur.gy = damp(cur.gy, gy, 9, dt);
    svg.style.setProperty('--gx', (cur.gx * 9).toFixed(2) + 'px'); svg.style.setProperty('--gy', (cur.gy * 9).toFixed(2) + 'px');
    // quay đầu: đầu hướng theo ánh nhìn, các nét mặt dịch chuyển nhiều hơn tóc/da để tạo chiều sâu
    cur.yaw = damp(cur.yaw, clamp(cfg.gaze[0] * 0.35 + pointerRef.x * 0.5 * f), 4, dt);
    cur.tilt = damp(cur.tilt, cfg.tilt + pointerRef.x * 3 * f + Math.sin(t * 0.5) * 0.8 * k, 4, dt);
    cur.droop = damp(cur.droop, cfg.droop || 0, 3, dt); cur.lean = damp(cur.lean, cfg.lean || 0, 3, dt);
    const bounce = (cfg.bounce ? Math.abs(Math.sin(t * 5)) * cfg.bounce : Math.sin(t * 2.2) * 1.2) * k;
    const breath = Math.sin(t * 1.6) * 1.6 * k, nod = speaking ? Math.sin(t * 6.2) * 2.2 + Math.sin(t * 3.1) * 1.2 : 0;
    const shake = cfg.shake ? Math.sin(t * 26) * cfg.shake * k : 0;
    all.setAttribute('transform', `translate(${shake.toFixed(2)} ${(-bounce).toFixed(2)})`);
    shadow.setAttribute('transform', `translate(300 768) scale(${(1 - bounce * 0.012).toFixed(3)} 1) translate(-300 -768)`);
    const by = breath + cur.droop * 5; body.setAttribute('transform', `translate(0 ${by.toFixed(2)})`); arms.setAttribute('transform', `translate(0 ${by.toFixed(2)})`);
    head.setAttribute('transform', `translate(0 ${(breath * 0.6 + cur.droop * 9 + cur.lean + nod).toFixed(2)}) rotate(${cur.tilt.toFixed(2)} 300 452)`);
    const fx = `translate(${(cur.yaw * 14).toFixed(2)} ${(cur.gy * 2).toFixed(2)})`; features.setAttribute('transform', fx); brows.setAttribute('transform', fx);
    hairFront.setAttribute('transform', `translate(${(cur.yaw * 4).toFixed(2)} 0)`);
    // quả cầu: bay nhẹ, bừng sáng khi gieo quẻ
    cur.cast = damp(cur.cast, castUntil > now ? 1 : 0, 3, dt);
    cur.ox = damp(cur.ox, cfg.orb[0], 4, dt); cur.oy = damp(cur.oy, cfg.orb[1], 4, dt); cur.os = damp(cur.os, cfg.orb[2], 4, dt);
    const os = cur.os * (1 + 0.04 * Math.sin(t * 2.2) + cur.cast * (0.35 + 0.1 * Math.sin(t * 7)));
    orb.setAttribute('transform', `translate(${300 + cur.ox} ${552 + cur.oy + by + Math.sin(t * 1.3) * 2}) scale(${os.toFixed(3)}) translate(-300 -552)`);
    // ngọc ngũ hành chạy vòng, quả cầu phát sáng và thở
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i], w = Math.max(0, Math.cos(t * 1.25 - i * 1.2566)) ** 3 * (REDUCED ? 0.5 : 1), sc = 1 + 0.2 * w;
      g.el.setAttribute('transform', `translate(${g.cx} ${g.cy}) scale(${sc.toFixed(3)}) translate(${-g.cx} ${-g.cy})`);
      g.glow.setAttribute('opacity', (0.12 + 0.75 * w).toFixed(3)); if (g.spark) g.spark.setAttribute('opacity', (0.5 + 0.5 * w).toFixed(3));
      sectors[(i + 1) % 5]?.setAttribute('fill-opacity', (0.15 + 0.3 * w).toFixed(3));
    }
    hatDash?.setAttribute('stroke-dashoffset', (-t * 5).toFixed(1));
    if (orbHalo) { const pulse = 0.5 + 0.5 * Math.sin(t * 2.1); orbHalo.setAttribute('opacity', (0.75 + 0.25 * pulse + cur.cast * 0.3).toFixed(3)); orbGlow.setAttribute('opacity', (0.22 + 0.3 * pulse + cur.cast * 0.45).toFixed(3)); orbGlow.setAttribute('r', (44 + 5 * pulse + cur.cast * 12).toFixed(1)); }
    orbRing?.setAttribute('transform', `rotate(${(t * 22).toFixed(1)} 300 552)`);
    for (const sp of orbSparks) { const a = sp.a + t * sp.sp, tw = 0.5 + 0.5 * Math.sin(t * 3 + sp.a * 5); sp.el.setAttribute('cx', (300 + Math.cos(a) * sp.rad).toFixed(1)); sp.el.setAttribute('cy', (552 + Math.sin(a) * sp.rad * 0.9).toFixed(1)); sp.el.setAttribute('opacity', (tw * 0.9).toFixed(2)); }
    // chớp mắt
    if (t > blinkAt && !blinkEnd) { svg.classList.add('blink'); blinkEnd = t + 0.13; }
    if (blinkEnd && t > blinkEnd) { svg.classList.remove('blink'); blinkEnd = 0; blinkAt = t + 2.2 + Math.random() * 3.4; }
    raf = requestAnimationFrame(frame);
  }
  setEmotion(emo); raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } });

  return {
    el: svg,
    setEmotion,
    get emotion() { return emo; },
    setMood(m) { setEmotion(MOOD_MAP[m] ?? m); },
    /** Cho nhân vật biết những chữ vừa hiện ra để miệng mở theo âm: nguyên âm há rộng, phụ âm khép, dấu câu mím. */
    feed(str) {
      if (!speaking || !str) return;
      const ch = str[str.length - 1].normalize('NFD')[0].toLowerCase();
      let o = 0.4, w = 1;
      if ('aăâ'.includes(ch) || ch === 'a') { o = 1; w = 1.1; } else if (ch === 'e') { o = 0.72; w = 1.18; } else if (ch === 'i' || ch === 'y') { o = 0.45; w = 1.22; }
      else if (ch === 'o') { o = 0.85; w = 0.78; } else if (ch === 'u') { o = 0.55; w = 0.7; }
      else if (ch === ' ' || ch === '\n') { o = 0.16; } else if (/[.,;:!?…]/.test(ch)) { o = 0.05; }
      mouth.to = o * (0.85 + Math.random() * 0.3); mouth.tw = w; mouth.fedAt = t;
    },
    /** Chạm vào nhân vật hoặc quả cầu: chớp mắt, nhìn theo ngón tay, quả cầu loé lên. */
    poke(cx, cy) {
      track(cx, cy);
      pokeUntil = t + 1.6; blinkAt = t + 0.05; castUntil = performance.now() + 900;
    },
    setSpeaking(v) { speaking = !!v; svg.classList.toggle('speaking', speaking); },
    cast(seconds = 3) { castUntil = performance.now() + seconds * 1000; },
    /** Nhuộm vầng sáng quả cầu theo hành chủ của người dùng. */
    setElement(color) { tint = color; $('halo-in')?.setAttribute('stop-color', color); $('halo-out')?.setAttribute('stop-color', color); },
  };
}
