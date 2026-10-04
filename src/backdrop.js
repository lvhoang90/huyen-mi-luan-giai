// Nền 2D nhẹ: sao nhấp nháy, đom đóm, cánh sen rơi (canvas) và vòng bát quái/ngũ hành xoay chậm (SVG).
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

function glowSprite(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, color + 'ff'); r.addColorStop(0.4, color + '66'); r.addColorStop(1, color + '00');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c;
}

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
  const glyphs = buildWheel(wheelSvg);
  function resize() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  addEventListener('resize', resize); resize();
  let last = performance.now(), t = 0, raf = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) { const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)); ctx.fillStyle = `rgba(235,232,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.283); ctx.fill(); }
    const boost = castUntil > now ? 1.8 : 1;
    for (const f of flies) {
      f.y -= f.v * dt * boost; f.x += Math.sin(t * 0.6 + f.p) * 0.02 * dt; if (f.y < -0.05) Object.assign(f, mkFly(false));
      ctx.globalAlpha = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + f.p))) * Math.min(1, f.y * 4, (1.05 - f.y) * 4 + 0.2);
      ctx.drawImage(f.tinted ? sprites.tint : sprites.gold, f.x * W - f.s, f.y * H - f.s, f.s * 2, f.s * 2);
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
