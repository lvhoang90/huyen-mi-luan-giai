// Nền 2D nhẹ: sao nhấp nháy, đom đóm, cánh sen rơi (canvas) và vòng bát quái/ngũ hành xoay chậm (SVG).
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((c) => c + '\uFE0E');
const ZNAMES = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Thiên Yết', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];

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
  let W = 0, H = 0, dpr = 1, tint = '#ffdf9a', castUntil = 0, sprites = { gold: glowSprite('#ffdf9a'), tint: glowSprite('#ffdf9a') };
  const stars = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random() * 0.9, r: rand(0.3, 1.5), p: rand(0, 6.28), s: rand(0.5, 2.2) }));
  const mkFly = (init) => ({ x: Math.random(), y: init ? Math.random() : 1.05, v: rand(0.012, 0.04), p: rand(0, 6.28), s: rand(5, 16), tinted: Math.random() < 0.45 });
  const mkPetal = (init) => ({ x: Math.random(), y: init ? Math.random() : -0.05, v: rand(0.02, 0.05), p: rand(0, 6.28), s: rand(5, 11), rot: rand(0, 6.28) });
  const flies = Array.from({ length: REDUCED ? 14 : 44 }, () => mkFly(true)), petals = Array.from({ length: REDUCED ? 6 : 20 }, () => mkPetal(true));
  // Đom đóm thật: bay lượn không theo đường thẳng, tự phát sáng theo nhịp riêng, kéo đuôi sáng mờ.
  const fireSprite = glowSprite('#d4ff6a');
  const mkWander = () => ({ cx: Math.random(), cy: 0.12 + Math.random() * 0.82, ax: rand(0.03, 0.1), ay: rand(0.02, 0.06), fx: rand(0.12, 0.32), fy: rand(0.1, 0.26), p: rand(0, 6.28), q: rand(0, 6.28), blink: rand(0.35, 0.9), s: rand(11, 22), trail: [] });
  const wanderers = Array.from({ length: REDUCED ? 6 : 22 }, mkWander);
  const glyphs = buildWheel(wheelSvg);
  // mỗi chòm sao trôi ngang với tốc độ riêng, vòng lại khi ra khỏi màn hình; thỉnh thoảng một vệt sáng chạy dọc các nét nối
  const cons = CONSTELLATIONS.map((c, i) => ({ ...c, x: Math.random(), y: 0.08 + (i % 3) * 0.17 + Math.random() * 0.06, v: rand(5, 11) * (i % 2 ? 1 : -1) * 0.6, size: rand(0.8, 1.1), p: rand(0, 6.28), shimmer: rand(0, 8) }));
  const zodiac = { rot: rand(0, 6.28) };
  function resize() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  addEventListener('resize', resize); resize();
  let last = performance.now(), t = 0, raf = 0;
  function drawSky() {
    const base = Math.min(W, H), k = REDUCED ? 0.25 : 1;
    // vành 12 cung hoàng đạo quay rất chậm quanh màn hình
    const rx = W * 0.47, ry = H * 0.44, cx = W / 2, cy = H / 2; zodiac.rot += 0.012 * k * dt0();
    ctx.save(); ctx.strokeStyle = 'rgba(214,194,255,.10)'; ctx.lineWidth = 1; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(Math.max(18, base * 0.045))}px "Segoe UI Symbol","Noto Sans Symbols","Noto Sans Symbols 2","DejaVu Sans",serif`;
    for (let i = 0; i < 12; i++) {
      const a = zodiac.rot + (i / 12) * 6.283, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, tw = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.7);
      ctx.globalAlpha = 0.16 + 0.22 * tw; ctx.drawImage(sprites.gold, x - 26, y - 26, 52, 52);
      ctx.globalAlpha = 0.34 + 0.34 * tw; ctx.fillStyle = '#f3dca0'; ctx.fillText(ZODIAC[i], x, y);
    }
    ctx.restore();
    // chòm sao
    for (const c of cons) {
      c.x += (c.v * dt0()) / W * k; if (c.x > 1.15) c.x = -0.25; else if (c.x < -0.25) c.x = 1.15;
      const sz = base * 0.34 * c.size, ox = c.x * W, oy = c.y * H, fade = Math.min(1, Math.max(0, Math.min(c.x + 0.1, 1.1 - c.x) * 4));
      const sh = (t * 0.35 + c.shimmer) % 6; // vệt sáng chạy 0..1 qua các nét rồi nghỉ
      ctx.lineWidth = 1; ctx.strokeStyle = '#cdbbff';
      c.edges.forEach(([a, b], ei) => {
        const A = c.pts[a], B = c.pts[b], lit = Math.max(0, 1 - Math.abs(sh * 1.2 - ei) * 1.3);
        ctx.globalAlpha = (0.13 + 0.5 * lit) * fade; ctx.beginPath(); ctx.moveTo(ox + A[0] * sz, oy + A[1] * sz * 0.8); ctx.lineTo(ox + B[0] * sz, oy + B[1] * sz * 0.8); ctx.stroke();
      });
      c.pts.forEach((P, pi) => { const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + c.p + pi * 2.1); ctx.globalAlpha = (0.45 + 0.5 * tw) * fade; const r = 5 + (pi % 3) * 2 + tw * 3; ctx.drawImage(sprites.gold, ox + P[0] * sz - r, oy + P[1] * sz * 0.8 - r, r * 2, r * 2); ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(ox + P[0] * sz, oy + P[1] * sz * 0.8, 1.3 + tw * 0.6, 0, 6.283); ctx.fill(); });
      ctx.globalAlpha = 0.34 * fade; ctx.fillStyle = '#d9cffa'; ctx.font = `italic ${Math.round(Math.max(10, base * 0.017))}px serif`; ctx.textAlign = 'center'; ctx.fillText(c.name, ox + sz * 0.5, oy + sz * 0.8 + 16);
    }
    ctx.globalAlpha = 1;
  }
  let dtLast = 0; const dt0 = () => dtLast;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt; dtLast = dt;
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
      if (!REDUCED) { w.trail.push(x, y, lit); if (w.trail.length > 18) w.trail.splice(0, 3); }
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
