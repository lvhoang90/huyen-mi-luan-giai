// Trang phục và phụ kiện của Huyền My trong từng lá bài: bỏ nón lá, đổi màu áo dài, thêm vương miện, vòng hoa, quầng sáng, mũ trùm...
// Tọa độ phụ kiện theo hệ của bộ khung Huyền My (huyenmy-rig.svg, 600 x 800): đầu quanh (300, 330), đỉnh tóc y ≈ 212, mặt rộng x từ 180 đến 420.
const GOLD = '#f2c75c', INK = '#2a1a4d';
// [ba màu áo dài, hai màu tay áo, màu tay áo đậm, màu tay áo nhạt]
const OUTFITS = {
  orange: [['#ffb36a', '#f0792e', '#b04a12'], ['#ffc58a', '#e8742a'], '#f0792e', '#ffc58a'],
  red: [['#ff7a7a', '#d8344a', '#8e1030'], ['#ff9a9a', '#c43048'], '#d8344a', '#ff9a9a'],
  teal: [['#6fe0d8', '#2fa5b0', '#16667a'], ['#8feae0', '#2a9aa8'], '#2fa5b0', '#8feae0'],
  navy: [['#6b7fe0', '#3a4bb8', '#1d2878'], ['#8a9cf0', '#3447a8'], '#3a4bb8', '#8a9cf0'],
  sky: [['#bfe2ff', '#7ab6f0', '#4a82c8'], ['#d6edff', '#6aa8e8'], '#7ab6f0', '#d6edff'],
  silver: [['#f4f6ff', '#c6cce6', '#8b94b8'], ['#ffffff', '#b4bcdc'], '#c6cce6', '#ffffff'],
  green: [['#9be6a8', '#4fb06a', '#2a7a46'], ['#b4efbf', '#44a860'], '#4fb06a', '#b4efbf'],
  gold: [['#ffeaa8', '#f0c050', '#b8841c'], ['#fff0c0', '#e8b640'], '#f0c050', '#fff0c0'],
  pink: [['#ffc4dc', '#ff86b2', '#c8497e'], ['#ffd6e8', '#f0709c'], '#ff86b2', '#ffd6e8'],
  black: [['#6a6a88', '#33334d', '#14141f'], ['#80809c', '#2a2a40'], '#33334d', '#80809c'],
  grey: [['#c4c4d4', '#8a8aa2', '#55556a'], ['#d6d6e4', '#7a7a92'], '#8a8aa2', '#d6d6e4'],
  white: [['#ffffff', '#ece9ff', '#c3bcee'], ['#ffffff', '#d8d3f6'], '#ece9ff', '#ffffff'],
  cream: [['#fff6d8', '#f2dca0', '#c9a860'], ['#fff9e6', '#ecd28c'], '#f2dca0', '#fff9e6'],
};

const star = (cx, cy, R, r, n = 5, fill = GOLD) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = ((-90 + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? r : R; pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`); } return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`; };
const gem = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2.4"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.32}" fill="#fff" opacity=".85"/>`;
const arc = (n, a0, a1, f) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1), a = ((a0 + (a1 - a0) * t) * Math.PI) / 180; return f(300 + 116 * Math.cos(a), 318 + 98 * Math.sin(a), a, i); }).join('');

const ACC = {
  crown: (c = GOLD, j = ['#e8344a', '#3a7be0']) => `<path d="M 236 252 L 232 186 L 262 212 L 282 170 L 300 206 L 318 170 L 338 212 L 368 186 L 364 252 C 330 242 270 242 236 252 Z" fill="${c}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/><path d="M 238 240 C 270 232 330 232 362 240" fill="none" stroke="#fff6c8" stroke-width="3" opacity=".75"/>${gem(232, 186, 6, j[0])}${gem(282, 170, 6, j[1])}${gem(318, 170, 6, j[1])}${gem(368, 186, 6, j[0])}${gem(300, 238, 7, j[0])}`,
  tiara: (c = '#f4f6ff') => `<path d="M 232 254 C 262 232 338 232 368 254 C 340 244 260 244 232 254 Z" fill="${GOLD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>${[[250, 240], [272, 228], [300, 222], [328, 228], [350, 240]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 9 : 6.5}" fill="${c}" stroke="${INK}" stroke-width="2.4"/>`).join('')}`,
  laurel: () => arc(9, 200, 340, (x, y, a, i) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="6.5" fill="${i % 2 ? '#5dbb6e' : '#7ad48a'}" stroke="${INK}" stroke-width="2.2" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`) + gem(300, 214, 7, '#ff6a4d'),
  flowers: (cols = ['#ff9fb9', '#ffffff', '#ffd54a']) => arc(8, 205, 335, (x, y, a, i) => `<g>${Array.from({ length: 5 }, (_, k) => `<ellipse cx="${(x + 8 * Math.cos(k * 1.2566)).toFixed(1)}" cy="${(y + 8 * Math.sin(k * 1.2566)).toFixed(1)}" rx="8" ry="8" fill="${cols[i % 2]}" stroke="${INK}" stroke-width="1.8"/>`).join('')}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${cols[2]}" stroke="${INK}" stroke-width="1.8"/></g>`),
  halo: () => `<ellipse cx="300" cy="184" rx="86" ry="20" fill="none" stroke="#fff6c8" stroke-width="16" opacity=".35"/><ellipse cx="300" cy="184" rx="86" ry="20" fill="none" stroke="${GOLD}" stroke-width="7"/><ellipse cx="300" cy="184" rx="86" ry="20" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`,
  infinity: () => `<path d="M300 168 C 328 136 384 140 384 168 C 384 198 328 202 300 168 C 272 136 216 140 216 168 C 216 198 272 202 300 168 Z" fill="none" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/><path d="M300 168 C 328 136 384 140 384 168 C 384 198 328 202 300 168 C 272 136 216 140 216 168 C 216 198 272 202 300 168 Z" fill="none" stroke="${GOLD}" stroke-width="6" stroke-linejoin="round"/>`,
  starband: () => `<path d="M 200 292 C 212 236 252 216 300 216 C 348 216 388 236 400 292" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M 200 292 C 212 236 252 216 300 216 C 348 216 388 236 400 292" fill="none" stroke="#9fd0ff" stroke-width="6" stroke-linecap="round"/>${star(300, 208, 26, 10, 8)}${star(246, 228, 9, 3.6, 4, '#fff')}${star(354, 228, 9, 3.6, 4, '#fff')}`,
  moon: () => `<path d="M 232 254 C 262 232 338 232 368 254 C 340 244 260 244 232 254 Z" fill="#dfe6ff" stroke="${INK}" stroke-width="3"/><circle cx="300" cy="206" r="15" fill="#f4f6ff" stroke="${INK}" stroke-width="2.6"/><path d="M 262 214 A 24 24 0 0 0 262 192 A 17 17 0 0 1 262 214Z M 338 214 A 24 24 0 0 1 338 192 A 17 17 0 0 0 338 214Z" fill="#dfe6ff" stroke="${INK}" stroke-width="2.4"/>`,
  band: (c = '#e8344a') => `<path d="M 200 296 C 210 238 252 218 300 218 C 348 218 390 238 400 296" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M 200 296 C 210 238 252 218 300 218 C 348 218 390 238 400 296" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M 372 222 C 392 186 428 176 440 150 C 424 176 410 178 392 196 C 400 188 408 170 416 154 C 402 172 390 180 372 222 Z" fill="${c}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`,
  wings: (c = '#fff6c8') => `<path d="M 200 296 C 210 238 252 218 300 218 C 348 218 390 238 400 296" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M 200 296 C 210 238 252 218 300 218 C 348 218 390 238 400 296" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>${[1, -1].map((d) => `<g transform="translate(${300 + d * 100} 262) scale(${d} 1)"><path d="M 0 0 C 14 -34 50 -52 84 -56 C 66 -40 62 -32 50 -22 C 62 -26 70 -26 80 -30 C 62 -14 44 -4 24 6 C 30 4 38 4 44 2 C 28 14 12 16 0 12 Z" fill="${c}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/></g>`).join('')}`,
  hood: (c1 = '#4a4a66', c2 = '#2a2a40') => `<path fill-rule="evenodd" d="M 118 600 C 100 380 150 168 300 140 C 450 168 500 380 482 600 L 420 560 C 440 400 430 330 420 300 C 410 240 360 190 300 190 C 240 190 190 240 180 300 C 170 330 160 400 180 560 Z" fill="${c1}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="M 150 520 C 140 400 170 250 300 176 C 240 220 196 300 186 400" fill="none" stroke="${c2}" stroke-width="10" opacity=".55" stroke-linecap="round"/><path d="M 450 520 C 460 400 430 250 300 176" fill="none" stroke="${c2}" stroke-width="10" opacity=".35" stroke-linecap="round"/>`,
  sun: () => `<g>${Array.from({ length: 14 }, (_, i) => { const a = ((-170 + i * (160 / 13)) * Math.PI) / 180; return `<path d="M ${(300 + 108 * Math.cos(a)).toFixed(1)} ${(250 + 100 * Math.sin(a)).toFixed(1)} L ${(300 + 148 * Math.cos(a)).toFixed(1)} ${(250 + 136 * Math.sin(a)).toFixed(1)}" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M ${(300 + 108 * Math.cos(a)).toFixed(1)} ${(250 + 100 * Math.sin(a)).toFixed(1)} L ${(300 + 148 * Math.cos(a)).toFixed(1)} ${(250 + 136 * Math.sin(a)).toFixed(1)}" stroke="#ffd54a" stroke-width="6" stroke-linecap="round"/>`; }).join('')}</g>`,
};
// phần tóc che dải da lộ ra trên đỉnh đầu khi không đội nón
// hai lọn tóc mai phủ thái dương và tai (vẽ sau tai, trước phụ kiện), để bỏ nón rồi hai bên đầu không trống; hoa tai vẫn lộ ra bên dưới
const SIDE = (d) => { const X = (x) => 300 - d * (300 - x); return `<path d="M ${X(190)} 276 C ${X(174)} 298 ${X(164)} 338 ${X(167)} 372 C ${X(172)} 392 ${X(190)} 394 ${X(200)} 386 C ${X(214)} 370 ${X(220)} 334 ${X(222)} 302 L ${X(222)} 280 Z" fill="url(#hairg)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M ${X(196)} 300 C ${X(186)} 326 ${X(184)} 352 ${X(188)} 374" fill="none" stroke="#6a6a78" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`; };
const HAIR_CAP = `<path d="M 184 300 C 182 236 238 206 300 206 C 362 206 418 236 416 300 C 408 262 356 244 300 244 C 244 244 192 262 184 300 Z" fill="url(#hairg)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M 236 224 C 262 214 292 212 316 214" fill="none" stroke="#6a6a78" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;

const MAJOR = {
  0: { outfit: 'cream', acc: 'flowers' }, 1: { hat: false, outfit: 'red', acc: 'infinity' }, 2: { hat: false, outfit: 'navy', acc: 'moon' }, 3: { hat: false, outfit: 'green', acc: 'flowers' },
  4: { hat: false, outfit: 'red', acc: 'crown' }, 5: { hat: false, outfit: 'white', acc: 'tiara' }, 6: { hat: false, outfit: 'pink', acc: 'flowers' }, 7: { hat: false, outfit: 'navy', acc: 'starband' },
  8: { hat: false, outfit: 'gold', acc: 'infinity' }, 9: { hat: false, outfit: 'grey', acc: 'hood' }, 10: { acc: null }, 11: { hat: false, outfit: 'red', acc: 'tiara' },
  12: { hat: false, outfit: 'teal', acc: 'halo' }, 13: { hat: false, outfit: 'black', acc: 'hood' }, 14: { hat: false, outfit: 'white', acc: 'halo' }, 15: { hat: false, outfit: 'black', acc: null },
  16: { hat: false, outfit: 'orange', acc: null }, 17: { outfit: 'sky', acc: null }, 18: { hat: false, outfit: 'silver', acc: 'moon' }, 19: { hat: false, outfit: 'gold', acc: 'sun' },
  20: { hat: false, outfit: 'white', acc: 'halo' }, 21: { hat: false, outfit: 'gold', acc: 'laurel' },
};
const SUIT_OUTFIT = { gay: 'orange', coc: 'teal', kiem: 'sky', tien: 'green' }, ROYAL = { gay: 'red', coc: 'navy', kiem: 'silver', tien: 'gold' };
const SUIT_ACC = { gay: 'band', coc: 'flowers', kiem: 'starband', tien: 'laurel' };
function minorLook({ suit, rank }) {
  if (rank >= 11) return { hat: false, outfit: ROYAL[suit], acc: { 11: 'band', 12: 'wings', 13: 'tiara', 14: 'crown' }[rank], accArg: suit === 'kiem' ? 'silver' : null };
  if (rank === 1) return { hat: false, outfit: SUIT_OUTFIT[suit], acc: 'halo' };
  if (suit === 'tien' && [2, 3, 4, 7, 8, 10].includes(rank)) return { outfit: 'green', acc: null }; // việc làm ăn, tay nghề: giữ nón lá
  return { hat: false, outfit: SUIT_OUTFIT[suit], acc: SUIT_ACC[suit] };
}
export const lookFor = (card) => (card.minor ? minorLook(card) : MAJOR[card.id]) ?? {};

// tìm và cắt nhóm <g id="..."> (đếm lồng nhau)
function groupRange(svg, id) {
  const i = svg.indexOf(`<g id="${id}"`); if (i < 0) return null;
  let d = 0; const re = /<g\b|<\/g>/g; re.lastIndex = i; let m;
  while ((m = re.exec(svg))) { d += m[0] === '<g' ? 1 : -1; if (d === 0) return [i, m.index + 4]; }
  return null;
}
const recolor = (svg, gradId, colors) => svg.replace(new RegExp(`(<linearGradient id="${gradId}"[^>]*>)([\\s\\S]*?)(</linearGradient>)`), (_, a, body, z) => { let k = 0; return a + body.replace(/stop-color="#[0-9a-fA-F]+"/g, () => `stop-color="${colors[k++] ?? colors.at(-1)}"`) + z; });

/** Áp trang phục lên bộ khung Huyền My. `uid` làm tên gradient không trùng khi nhiều nhân vật cùng nằm trong một trang. */
export function dress(rigSvg, look = {}, uid = 'x') {
  let s = rigSvg;
  const hatless = look.hat === false;
  if (hatless) { // bỏ nón cùng quai nón và nơ dưới cằm
    const r = groupRange(s, 'hat'), knot = s.indexOf('<circle cx="300" cy="466" r="7"');
    if (r && knot > r[0]) { // nón nằm trong một nhóm bọc ngoài: giữ thẻ đóng của nhóm đó, chỉ bỏ nón, quai nón và nơ dưới cằm
      const wrapEnd = s.indexOf('</g>', r[1]) + 4;
      s = s.slice(0, r[0]) + HAIR_CAP + s.slice(r[1], wrapEnd) + s.slice(s.indexOf('/>', knot) + 2);
    }
  }
  if (hatless) { // không còn chóp nón để voan buông xuống: hạ đỉnh voan thành vòm mềm ôm tóc
    s = s.replaceAll('M 300 76 C 372 78 480 156 546 246', 'M 300 150 C 400 150 500 190 546 246')
      .replaceAll('56 246 C 120 156 228 78 300 76 Z', '56 246 C 100 190 200 150 300 150 Z')
      .replaceAll('M 300 82 ', 'M 300 156 ');
  }
  const o = OUTFITS[look.outfit];
  if (o) { s = recolor(s, 'adg', o[0]); s = recolor(s, 'adg2', o[1]); s = s.replaceAll('#8b5fe0', o[2]).replaceAll('#b49cf3', o[3]); }
  const art = look.acc && ACC[look.acc] ? ACC[look.acc](look.accArg === 'silver' ? '#dfe6ff' : look.accArg ?? undefined) : '';
  if (hatless || art) {
    const orb = s.indexOf('<g id="orb"');
    s = s.slice(0, orb) + `<g class="acc">${hatless && look.acc !== 'hood' ? SIDE(1) + SIDE(-1) : ''}${art}</g>` + s.slice(orb);
  }
  // tên gradient riêng cho từng nhân vật
  const ids = [...s.matchAll(/<(?:linearGradient|radialGradient|filter|clipPath)\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) s = s.replaceAll(`id="${id}"`, `id="${id}-${uid}"`).replaceAll(`url(#${id})`, `url(#${id}-${uid})`);
  return s;
}
