// Dây đèn lồng treo đung đưa, ánh sáng nhấp nháy như lửa nến. Chỉ là trang trí: không nhận chuột, ẩn với aria.
const NS = 'http://www.w3.org/2000/svg';
const PALETTES = {
  ruby: { a: '#ff7a6b', b: '#b3203f', glow: '255, 120, 90' },
  amber: { a: '#ffd37a', b: '#d9822b', glow: '255, 190, 90' },
  violet: { a: '#c9a8ff', b: '#6a45d6', glow: '170, 130, 255' },
};
let uid = 0;
function lanternSvg(p) {
  const id = ++uid;
  return `<svg viewBox="0 0 60 100" aria-hidden="true">
    <defs>
      <radialGradient id="lb${id}" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#fff6d0"/><stop offset=".45" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></radialGradient>
    </defs>
    <rect x="21" y="3" width="18" height="6" rx="2" fill="#d8b25a"/><rect x="27" y="0" width="6" height="4" rx="1.5" fill="#b8903c"/>
    <path d="M12 14 Q2 40 12 66 L48 66 Q58 40 48 14 Z" fill="url(#lb${id})" stroke="#e8c978" stroke-width=".8"/>
    <path d="M22 14 Q15 40 22 66 M30 14 V66 M38 14 Q45 40 38 66" fill="none" stroke="#7a1830" stroke-opacity=".35" stroke-width=".9"/>
    <rect x="19" y="66" width="22" height="5" rx="2" fill="#d8b25a"/>
    <path d="M30 71 V92 M24 92 L30 80 L36 92 Z M27 92 L30 98 L33 92" fill="#e8c978" stroke="#e8c978" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;
}

export function createLanterns(host) {
  host.setAttribute('aria-hidden', 'true');
  // Dây chùng giữ các đèn: đường cong bậc hai trong hộp 380 x 300; điểm t trên đường cong cho chỗ treo.
  const P0 = [-10, 112], P1 = [190, 205], P2 = [390, 76];
  const at = (t) => [0, 1].map((i) => (1 - t) ** 2 * P0[i] + 2 * (1 - t) * t * P1[i] + t ** 2 * P2[i]);
  const rope = `<svg class="rope" viewBox="0 0 380 300" aria-hidden="true"><path d="M${P0} Q${P1} ${P2}" fill="none" stroke="#c9a85c" stroke-opacity=".55" stroke-width="1.6"/></svg>`;
  const items = [
    { t: 0.14, len: 22, size: 50, pal: 'ruby', dur: 5.6, delay: -1.2 },
    { t: 0.38, len: 46, size: 60, pal: 'amber', dur: 6.8, delay: -3.1 },
    { t: 0.63, len: 18, size: 46, pal: 'violet', dur: 5.1, delay: -0.4 },
    { t: 0.86, len: 40, size: 54, pal: 'ruby', dur: 6.2, delay: -2.4 },
  ];
  host.innerHTML = rope + items.map((it) => {
    const [x, y] = at(it.t), p = PALETTES[it.pal];
    return `<div class="lantern" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;--len:${it.len}px;--w:${it.size}px;--dur:${it.dur}s;--delay:${it.delay}s;--glow:${p.glow}">
      <i class="cord"></i><div class="lamp"><b class="halo"></b>${lanternSvg(p)}</div></div>`;
  }).join('');
}
