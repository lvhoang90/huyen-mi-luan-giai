// Logo "Huyền My Luận Giải 1.0": chữ vàng phát sáng, quả cầu pha lê có Thái Cực và ngũ hành xoay ở giữa.
// Bản quyền © 2026 Lương Việt Hoàng. Xem LICENSE.
let n = 0;
function orb(id) {
  const o = [[50, 20, '#f1ead2'], [74, 37, '#7fe3a0'], [65, 64, '#6fb7ff'], [35, 64, '#ff8a5c'], [26, 37, '#e0b86a']] // Kim, Mộc, Thủy, Hỏa, Thổ
    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.7" fill="${c}"/><circle cx="${x}" cy="${y}" r="5" fill="${c}" opacity=".25"/>`).join('');
  return `<svg class="orb" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="gl${id}" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#f3eaff"/><stop offset=".22" stop-color="#b9a2ff"/><stop offset=".62" stop-color="#5a3fd1"/><stop offset="1" stop-color="#1b0f52"/></radialGradient>
      <radialGradient id="ig${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffdf9a" stop-opacity=".6"/><stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/></radialGradient>
      <linearGradient id="au${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c2"/><stop offset=".5" stop-color="#e2c27d"/><stop offset="1" stop-color="#8a6a2a"/></linearGradient>
      <clipPath id="cp${id}"><circle cx="50" cy="44" r="33"/></clipPath>
    </defs>
    <ellipse cx="50" cy="95" rx="24" ry="3.6" fill="#000" opacity=".35"/>
    <path d="M27 81 Q50 92 73 81 L69 91 Q50 98 31 91 Z" fill="url(#au${id})"/>
    <path d="M32 74 Q50 83 68 74 L73 81 Q50 91 27 81 Z" fill="url(#au${id})" opacity=".92"/>
    <circle cx="50" cy="44" r="33" fill="url(#gl${id})"/>
    <g clip-path="url(#cp${id})">
      <circle cx="50" cy="44" r="33" fill="url(#ig${id})"/>
      <g class="orb-b">${o}</g>
      <g class="orb-a" transform="translate(50 44)"><g class="orb-a-in">
        <circle r="14" fill="#f6f0ff"/><path d="M0 -14 A14 14 0 0 1 0 14 A7 7 0 0 1 0 0 A7 7 0 0 0 0 -14 Z" fill="#2b1b73"/><circle cy="-7" r="2.1" fill="#2b1b73"/><circle cy="7" r="2.1" fill="#f6f0ff"/>
      </g></g>
      <g class="orb-s"><circle cx="40" cy="30" r="1" fill="#fff"/><circle cx="62" cy="54" r="1.2" fill="#fff"/><circle cx="58" cy="26" r=".8" fill="#fff"/><circle cx="38" cy="58" r=".9" fill="#fff"/></g>
    </g>
    <circle cx="50" cy="44" r="33" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
    <ellipse cx="38" cy="29" rx="11" ry="5.5" transform="rotate(-32 38 29)" fill="#fff" opacity=".5"/>
    <circle cx="64" cy="63" r="3.2" fill="#fff" opacity=".16"/>
  </svg>`;
}

/** variant: 'hero' (màn chào: HUYỀN MY / quả cầu / LUẬN GIẢI) hoặc 'compact' (thanh trên: quả cầu bên trái, chữ bên phải). */
export function mountLogo(el, variant = 'hero') {
  const id = ++n;
  const spark = variant === 'hero' ? '<i class="sp s1"></i><i class="sp s2"></i><i class="sp s3"></i><i class="sp s4"></i>' : '';
  el.classList.add('logo', variant);
  el.setAttribute('aria-label', 'Huyền My Luận Giải 1.0');
  el.innerHTML = variant === 'hero'
    ? `${spark}<span class="lg-name" aria-hidden="true">Huyền My</span><span class="lg-orb">${orb(id)}</span>
       <span class="lg-sub" aria-hidden="true"><b>Luận Giải</b><em>1.0</em></span>`
    : `<span class="lg-orb">${orb(id)}</span><span class="lg-text" aria-hidden="true"><span class="lg-name">Huyền My</span><span class="lg-sub"><b>Luận Giải</b><em>1.0</em></span></span>`;
}
