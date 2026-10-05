// Nền 2D nhẹ: sao nhấp nháy, đom đóm, cánh sen rơi (canvas) và vòng bát quái/ngũ hành xoay chậm (SVG).
import { perf } from './perf.js';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TIERS = { high: { stars: 150, flies: 44, wand: 22, petals: 20, cons: 6, trail: true, dpr: 2, fps: 60 }, low: { stars: 70, flies: 14, wand: 7, petals: 6, cons: 3, trail: false, dpr: 1, fps: 30 } };
const rand = (a, b) => a + Math.random() * (b - a);

function glowSprite(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, color + 'ff'); r.addColorStop(0.4, color + '66'); r.addColorStop(1, color + '00');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c;
}

// Chòm sao (toạ độ chuẩn hoá trong khung 0..1) và 12 cung hoàng đạo: trôi chậm trên nền trời.
const CONSTELLATIONS = [
  { name: 'Bắc Đẩu', pts: [[0, .5], [.18, .58], [.34, .5], [.5, .62], [.52, .95], [.84, .98], [.86, .66]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { name: 'Tinh Thần (Orion)', pts: [[.2, .1], [.8, .15], [.35, .5], [.5, .5], [.65, .5], [.25, .95], [.75, .9]], edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] },
  { name: 'Thiên Hậu (Cassiopeia)', pts: [[0, .3], [.25, .8], [.5, .4], [.75, .85], [1, .2]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { name: 'Nam Thập Tự', pts: [[.5, 0], [.5, 1], [0, .4], [1, .55]], edges: [[0, 1], [2, 3]] },
  { name: 'Thiên Yết (Scorpius)', pts: [[0, .1], [.12, .25], [.2, .4], [.3, .55], [.42, .7], [.6, .85], [.78, .82], [.9, .6], [.85, .4]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
  { name: 'Sư Tử (Leo)', pts: [[.1, .6], [.2, .35], [.35, .2], [.5, .15], [.55, .3], [.5, .5], [.85, .4], [.7, .7]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [4, 6], [6, 7], [7, 5]] },
];
// Biểu tượng 12 cung vẽ bằng nét vector trong khung 24x24 (không phụ thuộc phông chữ của thiết bị).
const ZODIAC = [
  'M12 21V10M12 10C12 4 5 3 5 8M12 10C12 4 19 3 19 8', // Bạch Dương
  'M6 3C6 9 18 9 18 3M12 11a5 5 0 1 0 .01 0', // Kim Ngưu
  'M6 4Q12 7 18 4M6 20Q12 17 18 20M9 6V18M15 6V18', // Song Tử
  'M20 9C18 4 8 4 5 9M7 9.5a2.2 2.2 0 1 0 .01 0M4 15C6 20 16 20 19 15M17 14.5a2.2 2.2 0 1 0 .01 0', // Cự Giải
  'M8 12a3 3 0 1 0 .01 0M11 15C11 5 18 3 18 9C18 14 15 17 15 20Q15 22 18 22', // Sư Tử
  'M4 6V16M4 8C4 5 9 5 9 8V16M9 8C9 5 14 5 14 8V15C14 19 19 19 19 15C19 12 15 12 14 16', // Xử Nữ
  'M4 19H20M5 15H9C4 15 5 8 12 8C19 8 20 15 15 15H19', // Thiên Bình
  'M4 6V16M4 8C4 5 9 5 9 8V16M9 8C9 5 14 5 14 8V17L19 20M19 20V16M19 20H15', // Thiên Yết
  'M5 19L19 5M11 5H19V13M7 11L13 17', // Nhân Mã
  'M3 6C6 4 8 10 8 14C8 8 11 6 13 9C15 13 12 19 12 19M17 14a3 3 0 1 0 .01 0', // Ma Kết
  'M3 9L7 6L11 9L15 6L19 9L21 8M3 17L7 14L11 17L15 14L19 17L21 16', // Bảo Bình
  'M7 4C14 8 14 16 7 20M17 4C10 8 10 16 17 20M5 12H19', // Song Ngư
];
function zodiacSprite(i, size, dpr) {
  const c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * dpr); const g = c.getContext('2d');
  g.scale((size * dpr) / 24, (size * dpr) / 24); g.lineWidth = 1.5; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#f3dca0'; g.stroke(new Path2D(ZODIAC[i])); return c;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function buildWheel(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const add = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.append(e); return e; };
  svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('aria-hidden', 'true');
  for (const r of [96, 90, 66]) add('circle', { r, fill: 'none', stroke: '#d6c2ff', 'stroke-width': r === 90 ? 0.4 : 0.8 });
  for (let i = 0; i < 72; i++) add('line', { x1: 0, y1: -96, x2: 0, y2: i % 3 ? -93 : -90, stroke: '#d6c2ff', 'stroke-width': 0.4, transform: `rotate(${i * 5})` });
  const tri = [[1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 0]];
  tri.forEach((t, i) => { const g = add('g', { transform: `rotate(${i * 45})` }); t.forEach((solid, j) => { const y = -84 + j * 3.4; if (solid) add('line', { x1: -8, y1: y, x2: 8, y2: y, stroke: '#d6c2ff', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g); else { add('line', { x1: -8, y1: y, x2: -1.6, y2: y, stroke: '#d6c2ff', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g); add('line', { x1: 1.6, y1: y, x2: 8, y2: y, stroke: '#d6c2ff', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g); } }); });
  const GL = [['金', 'Kim', '#f1ead2'], ['木', 'Mộc', '#7fe3a0'], ['水', 'Thủy', '#6fb7ff'], ['火', 'Hỏa', '#ff8a5c'], ['土', 'Thổ', '#e0b86a']];
  const glyphs = {};
  GL.forEach(([ch, name, col], i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const t = add('text', { x: Math.cos(a) * 52, y: Math.sin(a) * 52 + 4, 'text-anchor': 'middle', 'font-size': 12, fill: col, opacity: 0.45, 'font-family': '"Noto Serif CJK SC","Noto Serif SC","Songti SC",serif' });
    t.textContent = ch; glyphs[name] = t;
  });
  return glyphs;
}

export function createBackdrop(canvas, wheelSvg) {
  const ctx = canvas.getContext('2d');
  const Q = { ...TIERS[perf.tier] };
  let W = 0, H = 0, dpr = 1, tint = '#ffdf9a', castUntil = 0, sprites = { gold: glowSprite('#ffdf9a'), tint: glowSprite('#ffdf9a') };
  const stars = Array.from({ length: Q.stars }, () => ({ x: Math.random(), y: Math.random() * 0.9, r: rand(0.3, 1.5), p: rand(0, 6.28), s: rand(0.5, 2.2) }));
  const mkFly = (init) => ({ x: Math.random(), y: init ? Math.random() : 1.05, v: rand(0.012, 0.04), p: rand(0, 6.28), s: rand(5, 16), tinted: Math.random() < 0.45 });
  const mkPetal = (init) => ({ x: Math.random(), y: init ? Math.random() : -0.05, v: rand(0.02, 0.05), p: rand(0, 6.28), s: rand(5, 11), rot: rand(0, 6.28) });
  const flies = Array.from({ length: Q.flies }, () => mkFly(true)), petals = Array.from({ length: Q.petals }, () => mkPetal(true));
  // Đom đóm thật: bay lượn không theo đường thẳng, tự phát sáng theo nhịp riêng, kéo đuôi sáng mờ.
  const fireSprite = glowSprite('#d4ff6a');
  const mkWander = () => ({ cx: Math.random(), cy: 0.12 + Math.random() * 0.82, ax: rand(0.03, 0.1), ay: rand(0.02, 0.06), fx: rand(0.12, 0.32), fy: rand(0.1, 0.26), p: rand(0, 6.28), q: rand(0, 6.28), blink: rand(0.35, 0.9), s: rand(11, 22), trail: [] });
  const wanderers = Array.from({ length: Q.wand }, mkWander);
  const glyphs = buildWheel(wheelSvg);
  // mỗi chòm sao trôi ngang với tốc độ riêng, vòng lại khi ra khỏi màn hình; thỉnh thoảng một vệt sáng chạy dọc các nét nối
  const cons = CONSTELLATIONS.slice(0, Q.cons).map((c, i) => ({ ...c, x: Math.random(), y: 0.05 + (i % 3) * 0.13 + Math.random() * 0.05, v: rand(5, 11) * (i % 2 ? 1 : -1) * 0.6, size: rand(0.8, 1.1), p: rand(0, 6.28), shimmer: rand(0, 8) }));
  const zodiac = { rot: rand(0, 6.28) };
  let zsprites = [];
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, Q.dpr); W = innerWidth; H = innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const zs = Math.round(Math.max(16, Math.min(W, H) * 0.04)); zsprites = ZODIAC.map((_, i) => zodiacSprite(i, zs, dpr)); zsprites.size = zs;
  }
  addEventListener('resize', resize); resize();
  // Hạ mức khi máy yếu: bớt số lượng hạt, bỏ vệt sáng, giảm độ phân giải và số khung hình mỗi giây.
  perf.onChange(() => { Object.assign(Q, TIERS.low); stars.length = Math.min(stars.length, Q.stars); flies.length = Math.min(flies.length, Q.flies); wanderers.length = Math.min(wanderers.length, Q.wand); petals.length = Math.min(petals.length, Q.petals); cons.length = Math.min(cons.length, Q.cons); for (const w of wanderers) w.trail.length = 0; resize(); });
  let last = performance.now(), t = 0, raf = 0;
  // Độ sáng theo vị trí: giữa màn hình (nơi có chữ và nhân vật) mờ hơn, sát mép sáng hơn, nên không rối ở bất kỳ tỉ lệ màn hình nào.
  const edge = (x, y) => 0.28 + 0.72 * smooth(0.45, 0.95, Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2)) / 1.1);
  function drawSky() {
    const base = Math.min(W, H), k = perf.reduced ? 0.25 : 1;
    // vành 12 cung hoàng đạo quay rất chậm sát mép màn hình
    const rx = W * 0.46, ry = H * 0.45, cx = W / 2, cy = H / 2, zs = zsprites.size; zodiac.rot += 0.012 * k * dtLast;
    for (let i = 0; i < 12; i++) {
      const a = zodiac.rot + (i / 12) * 6.283, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, m = edge(x, y), tw = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.7);
      if (!perf.low) { ctx.globalAlpha = (0.12 + 0.14 * tw) * m; ctx.drawImage(sprites.gold, x - zs, y - zs, zs * 2, zs * 2); }
      ctx.globalAlpha = (0.3 + 0.3 * tw) * m; ctx.drawImage(zsprites[i], x - zs / 2, y - zs / 2, zs, zs);
    }
    // chòm sao: trôi ngang ở dải trên, chỉ nét mảnh và sao nhỏ
    ctx.lineWidth = 1; ctx.strokeStyle = '#cdbbff';
    for (const c of cons) {
      c.x += (c.v * dtLast) / W * k; if (c.x > 1.15) c.x = -0.25; else if (c.x < -0.25) c.x = 1.15;
      const sz = base * 0.3 * c.size, ox = c.x * W, oy = c.y * H, fade = Math.min(1, Math.max(0, Math.min(c.x + 0.1, 1.1 - c.x) * 4));
      const sh = (t * 0.35 + c.shimmer) % 6;
      c.edges.forEach(([a, b], ei) => {
        const A = c.pts[a], B = c.pts[b], x1 = ox + A[0] * sz, y1 = oy + A[1] * sz * 0.8, lit = perf.low ? 0 : Math.max(0, 1 - Math.abs(sh * 1.2 - ei) * 1.3);
        ctx.globalAlpha = (0.1 + 0.4 * lit) * fade * edge(x1, y1); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ox + B[0] * sz, oy + B[1] * sz * 0.8); ctx.stroke();
      });
      c.pts.forEach((P, pi) => {
        const px = ox + P[0] * sz, py = oy + P[1] * sz * 0.8, m = edge(px, py) * fade, tw = 0.55 + 0.45 * Math.sin(t * 1.6 + c.p + pi * 2.1);
        if (!perf.low) { const r = 4 + (pi % 3) * 1.5 + tw * 2.5; ctx.globalAlpha = (0.3 + 0.4 * tw) * m; ctx.drawImage(sprites.gold, px - r, py - r, r * 2, r * 2); }
        ctx.globalAlpha = (0.5 + 0.4 * tw) * m; ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(px, py, 1.2 + tw * 0.5, 0, 6.283); ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
  }
  let dtLast = 0; const dt0 = () => dtLast;
  let work = 0, slow = 0, frames = 0;
  function frame(now) {
    if (now - last < 1000 / Q.fps - 2) { raf = requestAnimationFrame(frame); return; } // giới hạn số khung hình để tiết kiệm pin
    const t0 = performance.now(), gap = now - last, dt = Math.min(gap / 1000, 0.05); last = now; t += dt; dtLast = dt;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) { const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)); ctx.fillStyle = `rgba(235,232,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.283); ctx.fill(); }
    drawSky(now);
    const boost = castUntil > now ? 1.8 : 1;
    for (const f of flies) {
      f.y -= f.v * dt * boost; f.x += Math.sin(t * 0.6 + f.p) * 0.02 * dt; if (f.y < -0.05) Object.assign(f, mkFly(false));
      ctx.globalAlpha = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + f.p))) * Math.min(1, f.y * 4, (1.05 - f.y) * 4 + 0.2);
      ctx.drawImage(f.tinted ? sprites.tint : sprites.gold, f.x * W - f.s, f.y * H - f.s, f.s * 2, f.s * 2);
    }
    for (const w of wanderers) {
      const x = (w.cx + Math.sin(t * w.fx + w.p) * w.ax + Math.sin(t * w.fx * 2.3 + w.q) * w.ax * 0.4) * W;
      const y = (w.cy + Math.cos(t * w.fy + w.q) * w.ay + Math.sin(t * w.fy * 1.7 + w.p) * w.ay * 0.5) * H;
      const wave = Math.sin(t * w.blink * 2.2 + w.p);
      const lit = Math.max(0, wave) ** 2.4 * 0.95 + 0.06; // sáng bừng rồi tắt dần như đom đóm
      if (Q.trail) { w.trail.push(x, y, lit); if (w.trail.length > 18) w.trail.splice(0, 3); }
      for (let i = 0; i < w.trail.length - 3; i += 3) { ctx.globalAlpha = (i / w.trail.length) * w.trail[i + 2] * 0.35; ctx.drawImage(fireSprite, w.trail[i] - w.s * 0.35, w.trail[i + 1] - w.s * 0.35, w.s * 0.7, w.s * 0.7); }
      ctx.globalAlpha = Math.min(1, lit); ctx.drawImage(fireSprite, x - w.s * 1.3, y - w.s * 1.3, w.s * 2.6, w.s * 2.6);
      ctx.globalAlpha = Math.min(1, lit * 1.1); ctx.fillStyle = '#fbffd0'; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 0.85;
    for (const p of petals) {
      p.y += p.v * dt; p.x += Math.sin(t * 0.8 + p.p) * 0.03 * dt; p.rot += dt * 0.8; if (p.y > 1.06) Object.assign(p, mkPetal(false));
      ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(p.rot); ctx.fillStyle = '#f9b2cf'; ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.5, p.s, 0, 0, 6.283); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1; raf = requestAnimationFrame(frame);
    // theo dõi: nếu trung bình mỗi khung vẽ tốn quá 9ms hoặc tụt dưới ~25 khung/giây liên tục thì hạ mức hiệu ứng
    if (!perf.low) { work += performance.now() - t0; if (gap > 40) slow++; if (++frames === 90) { if (work / frames > 9 || slow > 30) perf.downgrade(); work = slow = frames = 0; } }
  }
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } });
  return {
    cast(seconds = 3) { castUntil = performance.now() + seconds * 1000; document.documentElement.classList.add('casting'); setTimeout(() => document.documentElement.classList.remove('casting'), seconds * 1000); },
    setElement(name, color) {
      tint = color; sprites.tint = glowSprite(color); document.documentElement.style.setProperty('--tint', color);
      for (const [k, g] of Object.entries(glyphs)) { g.setAttribute('opacity', k === name ? 1 : 0.4); g.setAttribute('font-size', k === name ? 15 : 12); }
    },
  };
}
