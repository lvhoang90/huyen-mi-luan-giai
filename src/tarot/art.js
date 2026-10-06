// Tranh cho bộ Tarot Huyền My: mỗi lá là một cảnh vẽ bằng hình học (SVG) với nhân vật Huyền My đứng giữa tranh, mỗi lá một biểu cảm riêng.
// Hệ toạ độ cảnh: 260 x 364 (cửa sổ tranh). Nhân vật dùng lại bộ khung của Huyền My, không có hoạt ảnh. Không dùng hình từ bộ bài nào khác.
import rigSvg from '../assets/huyenmy-rig.svg?raw';
import { EMOTIONS } from '../character.js';

export const ART_W = 260, ART_H = 364;
const GOLD = '#e2c27d', CREAM = '#fbeecb', INK = '#141428';
const f = (n) => Math.round(n * 10) / 10;

// ---------- hình dựng sẵn ----------
const star = (cx, cy, R, r, n = 5, fill = CREAM, rot = -90) => {
  const pts = []; for (let i = 0; i < n * 2; i++) { const a = ((rot + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? r : R; pts.push(`${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`); }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
};
const spark = (cx, cy, R, fill = CREAM) => star(cx, cy, R, R * 0.26, 4, fill);
const rays = (cx, cy, r1, r2, n, stroke, w = 2, off = 0) => Array.from({ length: n }, (_, i) => { const a = ((360 / n) * i + off) * Math.PI / 180; return `<line x1="${f(cx + r1 * Math.cos(a))}" y1="${f(cy + r1 * Math.sin(a))}" x2="${f(cx + r2 * Math.cos(a))}" y2="${f(cy + r2 * Math.sin(a))}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`; }).join('');
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const cloud = (x, y, s = 1, fill = '#fff', op = 0.9) => `<g fill="${fill}" opacity="${op}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="26" ry="10"/><ellipse cx="-12" cy="-8" rx="14" ry="11"/><ellipse cx="9" cy="-11" rx="17" ry="13"/></g>`;
const crescent = (cx, cy, r, fill) => `<path d="M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx} ${cy + r} A${f(r * 0.72)} ${r} 0 1 1 ${cx} ${cy - r}Z" fill="${fill}"/>`;
const dots = (pts, fill = CREAM) => pts.map(([x, y, r = 1.4, o = 0.9]) => circle(x, y, r, fill, `opacity="${o}"`)).join('');
const STARS = [[24, 30, 1.6], [70, 18, 1.2], [112, 40, 1.4], [168, 22, 1.7], [214, 44, 1.3], [236, 90, 1.5], [18, 96, 1.2], [46, 130, 1.4], [226, 140, 1.2], [120, 120, 1]];
const lemn = (cx, cy, w, h, stroke = GOLD, sw = 3) => `<path d="M${cx} ${cy} C${cx + w * 0.4} ${cy - h} ${cx + w} ${cy - h} ${cx + w} ${cy} C${cx + w} ${cy + h} ${cx + w * 0.4} ${cy + h} ${cx} ${cy} C${cx - w * 0.4} ${cy - h} ${cx - w} ${cy - h} ${cx - w} ${cy} C${cx - w} ${cy + h} ${cx - w * 0.4} ${cy + h} ${cx} ${cy}Z" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const pillar = (x, w, top, fill, hi) => `<g><rect x="${x}" y="${top}" width="${w}" height="${ART_H - top}" fill="${fill}"/><rect x="${x + 3}" y="${top}" width="${f(w * 0.22)}" height="${ART_H - top}" fill="${hi}" opacity=".5"/><rect x="${x - 4}" y="${top}" width="${w + 8}" height="9" rx="2" fill="${fill}"/></g>`;
const chain = (x0, y0, x1, y1, sag, links, fill = '#c9c2de') => { let s = ''; for (let i = 0; i <= links; i++) { const t = i / links, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${i % 2 ? 3 : 5}" ry="${i % 2 ? 5 : 3}" fill="none" stroke="${fill}" stroke-width="1.8" transform="rotate(${i % 2 ? 40 : -20} ${f(x)} ${f(y)})"/>`; } return s; };
const flower = (x, y, r, petal, center) => `<g>${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${x}" cy="${y - r}" rx="${f(r * 0.34)}" ry="${f(r * 0.62)}" fill="${petal}" transform="rotate(${i * 45} ${x} ${y})"/>`).join('')}${circle(x, y, f(r * 0.45), center)}</g>`;
const heart = (cx, cy, s, fill, stroke = 'none', sw = 0) => `<path d="M${cx} ${cy + 26 * s} C${cx - 60 * s} ${cy - 6 * s} ${cx - 34 * s} ${cy - 44 * s} ${cx} ${cy - 18 * s} C${cx + 34 * s} ${cy - 44 * s} ${cx + 60 * s} ${cy - 6 * s} ${cx} ${cy + 26 * s}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const cup = (x, y, s, fill = GOLD) => `<path d="M${x - 11 * s} ${y - 10 * s} H${x + 11 * s} Q${x + 11 * s} ${y + 8 * s} ${x} ${y + 10 * s} Q${x - 11 * s} ${y + 8 * s} ${x - 11 * s} ${y - 10 * s}Z M${x} ${y + 10 * s} V${y + 18 * s} M${x - 7 * s} ${y + 18 * s} H${x + 7 * s}" fill="${fill}" stroke="${fill}" stroke-width="${2 * s}" stroke-linecap="round"/>`;

// ---------- 22 cảnh ----------
// Mỗi cảnh: bg = hai màu nền (trên, dưới); back = lớp sau nhân vật; front = lớp trước nhân vật; flip = lật ngược nhân vật.
const SCENES = {
  0: () => ({ bg: ['#79bcff', '#ffe8bd'],
    back: `${circle(200, 58, 36, '#fff2b0', 'opacity=".35"')}${circle(200, 58, 22, '#fff6c6')}${rays(200, 58, 28, 38, 12, '#fff2b0', 2)}${cloud(52, 52, 1.1)}${cloud(34, 112, 0.8, '#fff', 0.7)}${cloud(222, 130, 0.7, '#fff', 0.7)}<path d="M120 304 L172 246 L214 304Z" fill="#b6a6ec" opacity=".8"/><path d="M0 296 L74 296 Q92 300 94 326 L94 364 L0 364Z" fill="#ead2a8"/><path d="M0 296 L74 296 Q86 298 92 312 L0 312Z" fill="#9ed08a"/>`,
    front: `${spark(40, 160, 6)}${spark(226, 196, 5)}<path d="M186 110 q6 -8 12 0 q6 -8 12 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` }),
  1: () => ({ bg: ['#33165e', '#9b55d9'],
    back: `${dots(STARS)}${lemn(130, 62, 38, 24)}${rays(130, 62, 50, 60, 16, GOLD, 1.4)}<path d="M20 330 H240" stroke="${GOLD}" stroke-width="1" opacity=".4"/>`,
    front: `<rect x="6" y="326" width="248" height="38" rx="4" fill="#5a3320"/><rect x="6" y="326" width="248" height="6" fill="#7a4a2c"/>${cup(40, 316, 0.9)}${circle(98, 316, 11, GOLD)}${star(98, 316, 7, 3, 5, '#5a3320')}<path d="M150 296 V328 M142 304 H158" stroke="#e8e6ff" stroke-width="3" stroke-linecap="round"/><path d="M212 298 L222 326" stroke="#e7b55a" stroke-width="3" stroke-linecap="round"/>${spark(210, 294, 7, GOLD)}` }),
  2: () => ({ bg: ['#0d1546', '#2d46a0'],
    back: `${dots(STARS)}${pillar(8, 30, 30, INK, '#4a4a78')}${pillar(222, 30, 30, '#f1ecff', '#ffffff')}${crescent(130, 70, 32, '#e8ecff')}${circle(130, 70, 38, '#9fb4ff', 'opacity=".12"')}<path d="M38 60 Q130 0 222 60" fill="none" stroke="#9fb4ff" stroke-width="1" opacity=".5"/>`,
    front: `${crescent(26, 330, 12, '#e8ecff')}${spark(232, 318, 6, '#9fb4ff')}` }),
  3: () => ({ bg: ['#2f9a6a', '#ffe3a2'],
    back: `<g opacity=".95">${Array.from({ length: 12 }, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180; return star(f(130 + 62 * Math.cos(a)), f(112 + 62 * Math.sin(a)), 7, 3, 5, CREAM); }).join('')}</g><circle cx="130" cy="112" r="62" fill="none" stroke="${CREAM}" stroke-width="1" stroke-dasharray="2 5" opacity=".6"/>${circle(228, 52, 12, 'none', `stroke="${CREAM}" stroke-width="2.5"`)}<path d="M228 64 V86 M219 76 H237" stroke="${CREAM}" stroke-width="2.5" stroke-linecap="round"/>`,
    front: `${[18, 36, 224, 242].map((x, i) => `<path d="M${x} 364 V${300 - (i % 2) * 14}" stroke="#d8b24a" stroke-width="2"/><g fill="#e8c35a">${Array.from({ length: 5 }, (_, k) => `<ellipse cx="${x + (k % 2 ? 4 : -4)}" cy="${300 - (i % 2) * 14 + k * 8}" rx="2.6" ry="5"/>`).join('')}</g>`).join('')}${flower(54, 346, 11, '#ff9fb9', '#ffe27a')}${flower(206, 344, 10, '#ffffff', '#ffb35a')}` }),
  4: () => ({ bg: ['#7a1b2b', '#f4a65c'],
    back: `<path d="M0 260 L56 176 L104 260Z" fill="#5a1220" opacity=".7"/><path d="M160 260 L210 190 L260 260Z" fill="#5a1220" opacity=".7"/><rect x="64" y="36" width="132" height="328" rx="6" fill="#4a0f1d"/><rect x="74" y="46" width="112" height="318" rx="4" fill="#6b1a2b"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${64 + i * 28}" y="26" width="16" height="14" fill="#4a0f1d"/>`).join('')}${circle(130, 80, 20, '#ffd37a', 'opacity=".9"')}${rays(130, 80, 24, 31, 12, '#ffd37a', 2)}`,
    front: `<path d="M44 190 q-14 0 -14 14 q0 12 12 12 q8 0 8 -8 q0 -6 -6 -6" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/><path d="M216 190 q14 0 14 14 q0 12 -12 12 q-8 0 -8 -8 q0 -6 6 -6" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` }),
  5: () => ({ bg: ['#47287f', '#d4b8ff'],
    back: `${pillar(8, 28, 20, '#2a1a50', '#7a5ac0')}${pillar(224, 28, 20, '#2a1a50', '#7a5ac0')}${[40, 54, 68].map((r, i) => `<path d="M${130 - r} 108 A${r} ${r} 0 0 1 ${130 + r} 108" fill="none" stroke="${GOLD}" stroke-width="${3 - i * 0.6}" opacity="${1 - i * 0.2}"/>`).join('')}${circle(130, 52, 5, GOLD)}<path d="M130 20 V60 M112 38 H148" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>`,
    front: `${[[1, 0], [-1, 0]].map(([d]) => `<g transform="translate(130 332) scale(${d} 1) rotate(-24)"><circle cx="-38" cy="0" r="7" fill="none" stroke="${GOLD}" stroke-width="3.5"/><path d="M-31 0 H40" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/><path d="M28 0 v9 M36 0 v6" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/></g>`).join('')}` }),
  6: () => ({ bg: ['#ff9bb6', '#ffe1b3'],
    back: `${[100, 90, 80].map((r, i) => `<path d="M${130 - r} 170 A${r} ${r} 0 0 1 ${130 + r} 170" fill="none" stroke="${['#ff7aa2', '#ffc15a', '#8fd6ff'][i]}" stroke-width="6" opacity=".7"/>`).join('')}${heart(130, 96, 1.5, '#ffffff', '#ff6f9c', 3).replace('fill="#ffffff"', 'fill="#fff" fill-opacity=".35"')}`,
    front: `${circle(28, 214, 18, '#fff', 'opacity=".35"')}${circle(28, 214, 8, '#fff7c4')}${circle(232, 214, 18, '#fff', 'opacity=".35"')}${circle(232, 214, 8, '#fff7c4')}${spark(54, 110, 6, '#fff')}${spark(210, 124, 5, '#fff')}${heart(210, 60, 0.35, '#ff6f9c')}${heart(48, 66, 0.28, '#fff')}` }),
  7: () => ({ bg: ['#16275c', '#5f92ea'],
    back: `${dots(STARS)}<path d="M36 124 Q130 20 224 124" fill="none" stroke="${GOLD}" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => { const t = (i + 0.5) / 7, x = 36 + (224 - 36) * t, y = 124 - Math.sin(Math.PI * t) * 78; return star(f(x), f(y - 12), 6, 2.6, 5, CREAM); }).join('')}`,
    front: `<rect x="26" y="322" width="208" height="14" rx="3" fill="${GOLD}"/>${[40, 220].map((x) => `<g>${circle(x, 336, 30, 'none', `stroke="${GOLD}" stroke-width="4"`)}${rays(x, 336, 6, 30, 8, GOLD, 2, 22)}${circle(x, 336, 5, GOLD)}</g>`).join('')}${circle(18, 300, 14, INK, `stroke="${GOLD}" stroke-width="2"`)}${circle(242, 300, 14, '#f1ecff', `stroke="${GOLD}" stroke-width="2"`)}` }),
  8: () => ({ bg: ['#f1a73a', '#ffe9bf'],
    back: `${rays(130, 118, 66, 92, 20, '#f08a24', 9)}${circle(130, 118, 68, '#f6c453')}${lemn(130, 24, 18, 11, '#fff', 2.5)}`,
    front: `${[18, 36, 54, 206, 224, 242].map((x, i) => flower(x, 346 - (i % 2) * 8, 8, i % 2 ? '#ff9fb9' : '#fff', '#ffd54a')).join('')}` }),
  9: () => ({ bg: ['#0c142e', '#394a86'],
    back: `${dots(STARS)}<path d="M0 300 L66 196 L124 290 L190 204 L260 300 V364 H0Z" fill="#8fa0d8" opacity=".5"/><path d="M66 196 L84 224 L66 218 L50 226Z M190 204 L206 230 L190 224 L174 232Z" fill="#fff" opacity=".7"/>`,
    front: `<g transform="translate(212 246)"><circle r="46" fill="#ffe9a0" opacity=".25"/><circle r="28" fill="#ffe9a0" opacity=".35"/><path d="M-12 -22 H12 L16 20 H-16Z" fill="#3a2a1a"/><rect x="-10" y="-16" width="20" height="32" rx="3" fill="#ffe27a"/>${star(0, 0, 9, 3.4, 6, '#fff', -90)}<path d="M-8 -22 Q0 -34 8 -22" fill="none" stroke="#3a2a1a" stroke-width="2.5"/></g>` }),
  10: () => ({ bg: ['#2a1b5e', '#7a3fb4'],
    back: `${circle(130, 130, 108, 'none', `stroke="${GOLD}" stroke-width="5"`)}${circle(130, 130, 76, 'none', `stroke="${GOLD}" stroke-width="2.5"`)}${rays(130, 130, 76, 108, 12, GOLD, 2.5, 15)}${rays(130, 130, 18, 76, 8, GOLD, 1.6)}${dots(STARS)}${[[24, 24], [236, 24]].map(([x, y]) => `${circle(x, y, 16, '#ffffff22', `stroke="${GOLD}" stroke-width="1.5"`)}${spark(x, y, 8, GOLD)}`).join('')}${[[24, 250], [236, 250]].map(([x, y]) => `${circle(x, y, 16, '#ffffff22', `stroke="${GOLD}" stroke-width="1.5"`)}${star(x, y, 8, 3.4, 5, GOLD)}`).join('')}`,
    front: '' }),
  11: () => ({ bg: ['#173a5e', '#a6c9ec'],
    back: `${pillar(8, 26, 20, '#2b4468', '#a9c4e8')}${pillar(226, 26, 20, '#2b4468', '#a9c4e8')}<path d="M62 52 H198" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>${circle(130, 52, 7, GOLD)}<path d="M130 52 V30" stroke="${GOLD}" stroke-width="3"/>${[[70, 104], [190, 104]].map(([x, y]) => `<path d="M${x - 10} ${y - 4} L${x} 52 L${x + 10} ${y - 4}" fill="none" stroke="${GOLD}" stroke-width="1.4"/><path d="M${x - 16} ${y - 4} Q${x} ${y + 12} ${x + 16} ${y - 4}Z" fill="${GOLD}"/>`).join('')}`,
    front: `<g transform="translate(214 262)"><path d="M0 -92 V78" stroke="#e9ecf8" stroke-width="5" stroke-linecap="round"/><path d="M0 -92 l-4 -10 l4 -8 l4 8z" fill="#e9ecf8"/><rect x="-16" y="-20" width="32" height="6" rx="3" fill="${GOLD}"/><rect x="-3" y="58" width="6" height="20" fill="${GOLD}"/></g>` }),
  12: () => ({ bg: ['#2a1c5e', '#6c62d4'], flip: true,
    back: `<path d="M12 28 H248" stroke="#7a5a3a" stroke-width="9" stroke-linecap="round"/><path d="M130 28 V158" stroke="#d8c8a0" stroke-width="3"/>${[[30, 40], [60, 38], [190, 40], [226, 38]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#7fd08a" transform="rotate(${i % 2 ? 25 : -25} ${x} ${y})"/>`).join('')}${circle(130, 316, 52, GOLD, 'opacity=".2"')}${circle(130, 316, 40, 'none', `stroke="${GOLD}" stroke-width="2" opacity=".8"`)}${dots(STARS)}`,
    front: '' }),
  13: () => ({ bg: ['#16122e', '#ff9f5a'],
    back: `${circle(130, 168, 54, '#ffd37a')}${rays(130, 168, 62, 90, 18, '#ffd37a', 3, -4)}<rect x="0" y="232" width="260" height="132" fill="#241838"/>${[[8, 168], [214, 168]].map(([x, y]) => `<rect x="${x}" y="${y}" width="38" height="196" fill="#1a1230"/><rect x="${x - 4}" y="${y - 8}" width="46" height="10" fill="#1a1230"/>`).join('')}${dots(STARS.slice(0, 6))}`,
    front: `<g transform="translate(206 112)"><path d="M0 0 C-22 -20 -30 8 -8 14 C-24 24 -6 40 0 14Z" fill="#8fd0ff" opacity=".9"/><path d="M0 0 C22 -20 30 8 8 14 C24 24 6 40 0 14Z" fill="#c9a8ff" opacity=".9"/><rect x="-1.5" y="-4" width="3" height="26" rx="1.5" fill="#241838"/></g>${flower(50, 108, 10, '#fff', '#ffd54a')}${spark(34, 176, 5, '#fff')}` }),
  14: () => ({ bg: ['#66c5cc', '#fdebcb'],
    back: `${circle(130, 62, 22, '#fff6c6', 'opacity=".8"')}${rays(130, 62, 28, 38, 12, '#fff6c6', 2)}<path d="M52 104 Q130 -4 208 104" fill="none" stroke="#7fd6ff" stroke-width="6" stroke-linecap="round" opacity=".9"/><path d="M52 104 Q130 -4 208 104" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 7" opacity=".9"/>${cup(40, 112, 1.3, '#f1b04a')}${cup(220, 112, 1.3, '#f1b04a')}${cloud(40, 40, 0.7)}${cloud(224, 46, 0.7)}`,
    front: `${[24, 44, 216, 236].map((x, i) => `<path d="M${x} 364 V${320 - (i % 2) * 8}" stroke="#4a9a5a" stroke-width="2"/>${flower(x, 320 - (i % 2) * 8, 7, '#a98cff', '#ffe27a')}`).join('')}` }),
  15: () => ({ bg: ['#2b1030', '#8b2558'],
    back: `${dots(STARS.slice(0, 8), '#ffd1e6')}${crescent(130, 70, 34, '#1a0a22')}${circle(130, 70, 44, '#ff7aa8', 'opacity=".12"')}`,
    front: `${chain(10, 0, 66, 276, 24, 16)}${chain(250, 0, 196, 276, 24, 16)}<g transform="translate(66 276)">${circle(0, 0, 9, 'none', 'stroke="#c9c2de" stroke-width="2"')}</g><g transform="translate(196 276)">${circle(0, 0, 9, 'none', 'stroke="#c9c2de" stroke-width="2"')}</g>${spark(38, 150, 5, '#ffd1e6')}${spark(224, 190, 5, '#ffd1e6')}` }),
  16: () => ({ bg: ['#190e2e', '#c8453a'],
    back: `${dots(STARS.slice(0, 7))}<path d="M206 -4 L168 96 L196 98 L150 196" fill="none" stroke="#ffe27a" stroke-width="6" stroke-linejoin="round"/><path d="M206 -4 L168 96 L196 98 L150 196" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><rect x="88" y="76" width="84" height="288" fill="#5b4a78"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${88 + i * 17}" y="66" width="12" height="12" fill="#5b4a78"/>`).join('')}${[[104, 120], [138, 120], [104, 170], [138, 170]].map(([x, y]) => `<rect x="${x}" y="${y}" width="18" height="24" rx="2" fill="#ffb347"/>`).join('')}<path d="M100 40 l8 -16 l8 12 l8 -12 l8 16z" fill="${GOLD}" transform="rotate(-20 116 40)"/>${[[60, 90], [200, 130], [52, 180], [214, 52]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="7" fill="#7a6a98" transform="rotate(${x % 50} ${x} ${y})"/>`).join('')}`,
    front: `${[[24, 310], [236, 318]].map(([x, y]) => `<path d="M${x - 10} ${y + 24} Q${x - 14} ${y - 6} ${x} ${y - 20} Q${x + 12} ${y - 6} ${x + 10} ${y + 24}Z" fill="#ff7a3a" opacity=".9"/><path d="M${x - 5} ${y + 24} Q${x - 6} ${y} ${x} ${y - 8} Q${x + 6} ${y} ${x + 5} ${y + 24}Z" fill="#ffe27a"/>`).join('')}` }),
  17: () => ({ bg: ['#0e2160', '#6a8cff'],
    back: `${star(130, 62, 42, 15, 8, GOLD)}${star(130, 62, 24, 9, 8, '#fff6c6')}${[[40, 40], [76, 22], [190, 28], [222, 56], [36, 100], [224, 112], [60, 136]].map(([x, y]) => star(x, y, 7, 2.8, 5, CREAM)).join('')}${dots(STARS.slice(0, 6))}`,
    front: `<ellipse cx="130" cy="344" rx="150" ry="26" fill="#7ec8ff" opacity=".55"/>${[[130, 344, 40, 8], [130, 344, 76, 14], [130, 344, 112, 20]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"/>`).join('')}${spark(36, 300, 6, '#fff')}${spark(228, 312, 5, '#fff')}` }),
  18: () => ({ bg: ['#0a1030', '#38428f'],
    back: `${dots(STARS)}${circle(96, 78, 52, '#f4f1ff')}${circle(114, 68, 45, '#1b2266')}${circle(96, 78, 62, '#f4f1ff', 'opacity=".1"')}${[[10, 236], [226, 236]].map(([x, y]) => `<rect x="${x}" y="${y}" width="24" height="90" fill="#10143a"/><rect x="${x - 3}" y="${y - 6}" width="30" height="8" fill="#10143a"/>`).join('')}${[[56, 128], [70, 148], [196, 132], [182, 152]].map(([x, y]) => `<path d="M${x} ${y} q3 6 0 10 q-3 -4 0 -10z" fill="#ffe9a0" opacity=".85"/>`).join('')}`,
    front: `<path d="M30 364 L40 322 L50 332 L62 316 L66 364Z" fill="#0a0e26"/><path d="M200 364 L208 330 L222 324 L234 340 L240 364Z" fill="#0a0e26"/>${circle(246, 296, 2, '#ffe9a0')}${circle(18, 300, 2, '#ffe9a0')}` }),
  19: () => ({ bg: ['#ffd45c', '#ff9b3d'],
    back: `${rays(130, 94, 56, 96, 24, '#fff0a0', 6)}${circle(130, 94, 54, '#fff6c8')}${circle(130, 94, 44, '#ffe27a', 'opacity=".6"')}`,
    front: `${[16, 52, 96, 164, 208, 244].map((x, i) => `<path d="M${x} 364 V${322 - (i % 3) * 8}" stroke="#4f9a3a" stroke-width="3"/>${flower(x, 314 - (i % 3) * 8, 13, '#ffcf3a', '#7a4a1c')}`).join('')}` }),
  20: () => ({ bg: ['#79b6ea', '#fff1cf'],
    back: `<path d="M130 56 L8 364 H252Z" fill="#fff7d0" opacity=".35"/><path d="M130 56 L52 364 H208Z" fill="#fff7d0" opacity=".3"/>${rays(130, 70, 20, 340, 15, '#fff3c0', 1.4, 62).replace(/stroke-width="1.4"/g, 'stroke-width="1.4" opacity=".6"')}${cloud(40, 70, 1.3)}${cloud(226, 90, 1.1)}${cloud(60, 140, 0.9, '#fff', 0.7)}<path d="M176 16 L128 54" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>${circle(178, 14, 6, GOLD)}<path d="M130 44 L102 36 L110 80 L138 66Z" fill="#f1c24f" stroke="#c99a2e" stroke-width="2" stroke-linejoin="round"/><ellipse cx="106" cy="58" rx="6" ry="22" fill="#fff3b0" transform="rotate(-6 106 58)"/>`,
    front: `${[[40, 250, 8], [220, 270, 7], [54, 310, 6], [210, 318, 8]].map(([x, y, r]) => `${circle(x, y, r + 8, '#fff', 'opacity=".3"')}${circle(x, y, r, '#fff')}`).join('')}${spark(28, 190, 6, '#fff')}${spark(234, 200, 6, '#fff')}` }),
  21: () => ({ bg: ['#592b9e', '#ffd9a2'],
    back: `<ellipse cx="130" cy="196" rx="108" ry="164" fill="#ffffff" fill-opacity=".12"/><ellipse cx="130" cy="196" rx="108" ry="164" fill="none" stroke="#5fbf72" stroke-width="7"/>${Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * 2 * Math.PI, x = 130 + 108 * Math.cos(a), y = 196 + 164 * Math.sin(a); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="4.5" fill="#7fd68a" transform="rotate(${f((a * 180) / Math.PI + 90 + (i % 2 ? 40 : -40))} ${f(x)} ${f(y)})"/>`; }).join('')}<path d="M104 20 Q130 36 156 20" fill="none" stroke="#e8564a" stroke-width="4"/><path d="M104 352 Q130 336 156 352" fill="none" stroke="#e8564a" stroke-width="4"/>`,
    front: `${[[24, 26], [236, 26], [24, 338], [236, 338]].map(([x, y], i) => `${circle(x, y, 20, '#ffffff22', `stroke="${GOLD}" stroke-width="1.6"`)}<path d="${['M24 14 L36 36 H12Z', 'M236 38 L248 16 H224Z', 'M24 326 L36 348 H12Z M16 340 H32', 'M236 350 L248 328 H224Z M228 340 H244'][i].replace(/^M(\d+) (\d+)/, (m) => m)}" fill="none" stroke="${GOLD}" stroke-width="2"/>`).join('')}${spark(40, 190, 6, '#fff')}${spark(222, 232, 6, '#fff')}` }),
};

/** Tệp rig của Huyền My, cắt sát khung hình toàn thân và gắn biểu cảm bằng thuộc tính (không cần mã chạy). */
function rig(emoKey, { x, y, w, h, flip = false }) {
  const e = EMOTIONS[emoKey] ?? EMOTIONS.binh_thuong;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" class="hm" viewBox="20 120 560 680" x="${x}" y="${y}" width="${w}" height="${h}" data-eyes="${e.eyes}" data-brows="${e.brows}" data-mouth="${e.mouth}" data-pose="${e.pose}" data-blush="${e.blush}" data-fx="${e.fx.join(' ')}">`;
  const svg = rigSvg.replace(/<svg[^>]*>/, open);
  return flip ? `<g transform="rotate(180 ${x + w / 2} ${y + h / 2})">${svg}</g>` : svg;
}

/** SVG của phần tranh (260 x 364) cho lá có số thứ tự id. `uid` để tên gradient không trùng khi nhiều lá cùng một trang. */
export function cardArtSvg(card, uid = 'a') {
  const s = SCENES[card.id](), W = 210, H = 255;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}" role="img" aria-label="Tranh lá ${card.name}" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="bg-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.bg[0]}"/><stop offset="1" stop-color="${s.bg[1]}"/></linearGradient></defs>
<rect width="${ART_W}" height="${ART_H}" fill="url(#bg-${uid})"/>${s.back}${rig(card.emo, { x: (ART_W - W) / 2, y: ART_H - H + 10, w: W, h: H, flip: !!s.flip })}${s.front}</svg>`;
}

/** Mặt sau lá bài: nền tím, sao vàng, quả cầu của Huyền My. */
export function cardBackSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
<defs><radialGradient id="bk" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#4a2aa6"/><stop offset="1" stop-color="#150d3a"/></radialGradient></defs>
<rect width="${ART_W}" height="${ART_H}" fill="url(#bk)"/>${dots(STARS.concat([[90, 300, 1.4], [170, 330, 1.2], [30, 250, 1.3], [230, 270, 1.3]]), '#e8e0ff')}
<g fill="none" stroke="${GOLD}" stroke-width="1.6" opacity=".9"><circle cx="130" cy="182" r="62"/><circle cx="130" cy="182" r="48" stroke-dasharray="2 5"/></g>${rays(130, 182, 66, 84, 16, GOLD, 1.6)}${star(130, 182, 34, 12, 8, GOLD)}${star(130, 182, 18, 7, 8, '#fff3c9')}${crescent(130, 46, 16, GOLD)}${crescent(130, 318, 16, GOLD).replace(`M130 ${318 - 16}`, `M130 ${318 - 16}`)}</svg>`;
}
export const sceneIds = () => Object.keys(SCENES).map(Number);
