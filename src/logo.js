// Logo "Huyền My Luận Giải 1.0": huy hiệu tròn, HUYỀN MY uốn trên cung, LUẬN GIẢI uốn dưới cung, quả cầu pha lê xoay ở tâm.
// Chữ là nét vẽ riêng (wordmark.js), ánh vàng chạy và quầng sáng đập nhẹ. Bản quyền © 2026 Lương Việt Hoàng. Xem LICENSE.
import { arc, straight } from './wordmark.js';
let n = 0;

function orbInner(id) {
  const o = [[50, 20, '#f1ead2'], [74, 37, '#7fe3a0'], [65, 64, '#6fb7ff'], [35, 64, '#ff8a5c'], [26, 37, '#e0b86a']] // Kim, Mộc, Thủy, Hỏa, Thổ
    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.7" fill="${c}"/><circle cx="${x}" cy="${y}" r="5" fill="${c}" opacity=".25"/>`).join('');
  return `<defs>
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
    <circle cx="64" cy="63" r="3.2" fill="#fff" opacity=".16"/>`;
}
const orbSvg = (id) => `<svg class="orb" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${orbInner(id)}</svg>`;
const goldDefs = (id) => `<linearGradient id="gd${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-45" x2="0" y2="110"><stop offset="0" stop-color="#fffbe6"/><stop offset=".3" stop-color="#f6dc92"/><stop offset=".65" stop-color="#d7a64c"/><stop offset="1" stop-color="#8d6222"/></linearGradient>`;

function medallion(id) {
  const tint = `url(#gd${id})`, ticks = Array.from({ length: 72 }, (_, i) => ` <line x1="0" y1="-200" x2="0" y2="${i % 6 === 0 ? -193 : i % 2 ? -197 : -195}" transform="rotate(${i * 5})"/>`).join('');
  const stars = [[-150, -70, 1.6], [152, -40, 1.3], [-120, 110, 1.4], [135, 100, 1.7], [-60, -140, 1.1], [70, 140, 1.2], [-165, 20, 1.2], [168, -100, 1.1]].map(([x, y, r], i) => `<circle class="st" style="animation-delay:${-i * 0.4}s" cx="${x}" cy="${y}" r="${r}" fill="#fff6d2"/>`).join('');
  const side = (deg) => `<g transform="rotate(${deg}) translate(0 -145)"><path d="M0 -9L8 0L0 9L-8 0Z" fill="${tint}"/><path d="M-30 0H-14M14 0H30" stroke="${tint}" stroke-width="1.6" stroke-linecap="round"/><circle cx="-36" r="2.2" fill="${tint}"/><circle cx="36" r="2.2" fill="${tint}"/></g>`;
  return `<svg class="medal-svg" viewBox="0 0 440 478" role="img" aria-label="Huyền My Luận Giải 1.0">
    <defs>${goldDefs(id)}<filter id="bl${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter><radialGradient id="hg${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7a5cff" stop-opacity=".55"/><stop offset=".6" stop-color="#3a2490" stop-opacity=".22"/><stop offset="1" stop-color="#1b0f52" stop-opacity="0"/></radialGradient></defs>
    <g transform="translate(220 232)">
      <circle r="214" fill="url(#hg${id})"/>
      <g class="ring-spin" fill="none" stroke="${tint}"><circle r="208" stroke-width="1.6"/><circle r="201" stroke-width=".7" opacity=".7"/><g stroke-width="1" opacity=".75">${ticks}</g></g>
      <circle r="108" fill="#0d0830" fill-opacity=".55" stroke="${tint}" stroke-width="1.4"/><circle r="102" fill="none" stroke="${tint}" stroke-width=".6" opacity=".6"/>
      <g class="word-glow" filter="url(#bl${id})" opacity=".75">${arc('HUYỀN MY', { R: 118, k: 0.5, dir: 'top', tint: '#ffd978' })}${arc('LUẬN GIẢI', { R: 169, k: 0.5, dir: 'bottom', tint: '#ffd978' })}</g>
      <g class="word word-top">${arc('HUYỀN MY', { R: 118, k: 0.5, dir: 'top', tint })}</g>
      <g class="word word-bot">${arc('LUẬN GIẢI', { R: 169, k: 0.5, dir: 'bottom', tint })}</g>
      ${side(90)}${side(-90)}
      <g class="stars">${stars}</g>
      <svg x="-84" y="-80" width="168" height="168" viewBox="0 0 100 100" overflow="visible" class="orb-center">${orbInner(id)}</svg>
    </g>
    <g class="ver" transform="translate(220 452)"><rect x="-34" y="-16" width="68" height="32" rx="16" fill="#1a1040" stroke="${tint}" stroke-width="1.6"/><text y="7" text-anchor="middle" font-family="Be Vietnam Pro, system-ui, sans-serif" font-size="20" font-weight="600" letter-spacing="2" fill="#fff0c2">1.0</text></g>
  </svg>`;
}

function compact(id) {
  const tint = `url(#gd${id})`, a = straight('HUYỀN MY', tint, 1.5), b = straight('LUẬN GIẢI', tint, 1.9);
  return `<span class="lg-orb">${orbSvg(id)}</span><span class="lg-text" aria-hidden="true">
    <svg class="wm wm-1" viewBox="${a.vb}"><defs>${goldDefs(id)}</defs>${a.body}</svg>
    <span class="wm-row"><svg class="wm wm-2" viewBox="${b.vb}">${b.body}</svg><em>1.0</em></span></span>`;
}

/** variant: 'hero' (huy hiệu tròn ở màn chào) hoặc 'compact' (thanh trên: quả cầu bên trái, chữ riêng bên phải). */
export function mountLogo(el, variant = 'hero') {
  const id = ++n;
  el.classList.add('logo', variant === 'hero' ? 'medal' : 'compact');
  el.setAttribute('aria-label', 'Huyền My Luận Giải 1.0');
  el.innerHTML = variant === 'hero' ? medallion(id) : compact(id);
}
