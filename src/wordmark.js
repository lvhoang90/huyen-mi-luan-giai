// Chữ riêng của logo "HUYỀN MY LUẬN GIẢI": nét đơn đều, chân hairline và hạt kim cương, vẽ bằng đường dẫn nên không phụ thuộc phông.
// Mỗi chữ cái cao 100 đơn vị (đỉnh y=0, chân y=100); dấu thanh vẽ riêng ở trên (y âm) hoặc dưới (y > 100).
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
const T = 12, H = 3.6; // nét chính, nét chân (hairline)
const S = (d, w = T) => ({ d, w });
const serif = (x1, x2, y) => S(`M${x1} ${y}H${x2}`, H);
const diamond = (x, y, r = 6) => ({ fill: `M${x} ${y - r}L${x + r * 0.85} ${y}L${x} ${y + r}L${x - r * 0.85} ${y}Z` });

export const GLYPHS = {
  H: { adv: 80, parts: [S('M10 0V100'), S('M66 0V100'), S('M10 50H66', H), serif(1, 19, 0), serif(57, 75, 0), serif(1, 19, 100), serif(57, 75, 100), diamond(38, 50, 6.5)] },
  U: { adv: 76, parts: [S('M10 0V62Q10 100 38 100Q66 100 66 62V0'), serif(1, 19, 0), serif(57, 75, 0)] },
  Y: { adv: 76, parts: [S('M6 0L38 52L70 0'), S('M38 52V98'), serif(-1, 15, 0), serif(61, 77, 0), serif(28, 48, 100), diamond(38, 52, 4.5)] },
  E: { adv: 60, parts: [S('M50 0H12V100H50'), S('M12 50H42', H), S('M50 -1V13', H), S('M50 101V87', H), serif(2, 14, 0), serif(2, 14, 100)] },
  N: { adv: 80, parts: [S('M10 100V0L66 100V0'), serif(1, 19, 0), serif(57, 75, 0), serif(1, 19, 100), serif(57, 75, 100)] },
  M: { adv: 104, parts: [S('M10 100V0L52 66L94 0V100'), serif(1, 19, 0), serif(85, 103, 0), serif(1, 19, 100), serif(85, 103, 100), diamond(52, 80, 5)] },
  L: { adv: 58, parts: [S('M10 0V100H50'), S('M50 100V86', H), serif(1, 19, 0), serif(1, 19, 100)] },
  A: { adv: 84, parts: [S('M6 100L42 0L78 100'), S('M23 74H61', H), serif(-2, 16, 100), serif(68, 86, 100), diamond(42, 74, 5.5)] },
  G: { adv: 78, parts: [S('M66 22Q58 0 38 0Q10 0 10 50Q10 100 38 100Q66 100 66 62H42'), S('M66 62V76', H), diamond(42, 62, 4.5)] },
  I: { adv: 28, parts: [S('M14 0V100'), serif(4, 24, 0), serif(4, 24, 100)] },
};
// Dấu thanh và dấu mũ, đặt theo tâm chữ cx.
const mark = {
  circ: (cx) => [S(`M${cx - 15} -13L${cx} -30L${cx + 15} -13`, 5.6)],
  grave: (cx) => [S(`M${cx - 38} -34L${cx - 23} -20`, 5.6)],
  hook: (cx) => [S(`M${cx - 8} -34Q${cx + 9} -45 ${cx + 10} -31Q${cx + 11} -22 ${cx + 1} -20`, 5.4)],
  dotbelow: (cx) => [{ fill: `M${cx - 8.4} 123a8.4 8.4 0 1 0 16.8 0a8.4 8.4 0 1 0 -16.8 0Z` }], // chấm to bằng nửa nét chữ trở lên để nhìn rõ ở cỡ nhỏ
};
// Chữ có dấu trong hai cụm từ của logo: ký tự -> [chữ gốc, các dấu]
const ACCENT = { 'Ề': ['E', ['circ', 'grave']], 'Ậ': ['A', ['circ', 'dotbelow']], 'Ả': ['A', ['hook']] };
const GAP = 12, SPACE = 44;

export function glyphOf(ch) {
  const [base, marks] = ACCENT[ch] ?? [ch, []];
  const g = GLYPHS[base]; if (!g) return null;
  const cx = base === 'E' ? 30 : g.adv / 2;
  return { adv: g.adv, parts: [...g.parts, ...marks.flatMap((m) => mark[m](cx))] };
}
const partSvg = (p, tint, boost = 1) => (p.fill ? `<path d="${p.fill}" fill="${tint}"/>` : `<path d="${p.d}" fill="none" stroke="${tint}" stroke-width="${(p.w * boost).toFixed(2)}" stroke-linejoin="miter" stroke-miterlimit="6"/>`);
export function glyphSvg(ch, tint, boost = 1) { const g = glyphOf(ch); return g ? g.parts.map((p) => partSvg(p, tint, boost)).join('') : ''; }

/** Vị trí từng chữ: [{ch, x, adv}] và tổng bề rộng. */
export function layout(text) {
  let x = 0; const out = [];
  for (const ch of [...text]) {
    if (ch === ' ') { x += SPACE; continue; }
    const g = glyphOf(ch); if (!g) continue;
    out.push({ ch, x, adv: g.adv }); x += g.adv + GAP;
  }
  return { items: out, width: x - GAP };
}

/** Dòng chữ thẳng, trả về { body, w, vb }. boost làm nét đậm hơn khi hiển thị nhỏ. viewBox chỉ chừa chỗ cho dấu khi chữ có dấu. */
export function straight(text, tint, boost = 1) {
  const { items, width } = layout(text);
  const body = items.map((i) => `<g transform="translate(${i.x} 0)">${glyphSvg(i.ch, tint, boost)}</g>`).join('');
  const above = /[ỀẬẢ]/.test(text), below = /Ậ/.test(text), top = above ? -48 : -6, bot = below ? 136 : 106;
  return { body, w: width, vb: `-8 ${top} ${width + 16} ${bot - top}` };
}

/** Chữ uốn theo cung. dir 'top': đỉnh chữ hướng ra ngoài, chân chữ ở bán kính R. 'bottom': chữ đứng thẳng, chân ở bán kính R, đỉnh hướng vào tâm. */
export function arc(text, { R, k, dir, tint }) {
  const { items, width } = layout(text), mid = (R + (dir === 'top' ? 50 * k : -50 * k));
  const span = (width * k) / mid; // rad
  return items.map((i) => {
    const c = (i.x + i.adv / 2) * k, a = ((c / mid) - span / 2) * (180 / Math.PI) * (dir === 'top' ? 1 : -1);
    const t = dir === 'top' ? `rotate(${a.toFixed(2)}) translate(0 ${-R}) scale(${k}) translate(${-i.adv / 2} -100)` : `rotate(${a.toFixed(2)}) translate(0 ${R}) scale(${k}) translate(${-i.adv / 2} -100)`;
    return `<g transform="${t}">${glyphSvg(i.ch, tint)}</g>`;
  }).join('');
}
export const arcSpanDeg = (text, R, k, dir) => { const { width } = layout(text); const mid = R + (dir === 'top' ? 50 * k : -50 * k); return ((width * k) / mid) * (180 / Math.PI); };
