// Bộ biểu tượng nét mảnh (viền 1.8, đầu tròn), vẽ tay, dùng chung cho thanh công cụ và các nút. Không phụ thuộc thư viện ngoài.
const P = {
  soundOn: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.2 9a4.2 4.2 0 0 1 0 6"/><path d="M18.2 6.2a8.2 8.2 0 0 1 0 11.6"/>',
  soundOff: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="m16 9.5 4.5 5"/><path d="m20.5 9.5-4.5 5"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  paceTap: '<path d="m9.5 6 6 6-6 6"/>',
  paceAuto: '<path d="m6 6 6 6-6 6"/><path d="m13 6 6 6-6 6"/>',
  admin: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
  account: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20c.8-3.6 3.5-5.7 7-5.7s6.2 2.1 7 5.7"/>',
  chart: '<path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8z"/><path d="m12 8.4 3.7 2.3v4.5L12 17.6l-3.7-2.4v-4.5z"/><path d="M12 3.5v4.9M19.5 8l-3.8 2.7M19.5 16l-3.8-1M12 20.5v-2.9M4.5 16l3.8-1M4.5 8l3.8 2.7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  tarot: '<rect x="4.2" y="4.5" width="9.4" height="14.5" rx="1.8" transform="rotate(-9 9 12)"/><rect x="10.4" y="5.5" width="9.4" height="14.5" rx="1.8" transform="rotate(7 15 13)"/><path d="m15 9.6.95 2 2.15.3-1.6 1.5.4 2.15L15 14.5l-1.9 1.05.4-2.15-1.6-1.5 2.15-.3z"/>',
  flame: '<path d="M12 3c1 3.2 4.6 5 4.6 9.3A4.6 4.6 0 0 1 12 17a4.6 4.6 0 0 1-4.6-4.7c0-1.7.8-2.9 1.9-3.9.2 1.3.8 2 1.6 2.4C10.9 8.4 11 5.6 12 3Z"/>',
  send: '<path d="M4 12 20 4l-4.5 16-3.6-6.2z"/><path d="m11.9 13.8 3.4-3.6"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
  reset: '<path d="M3.8 12a8.2 8.2 0 1 0 2.7-6.1"/><path d="M3.5 4v4.4h4.4"/>',
  download: '<path d="M12 4v11"/><path d="m7.5 11 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
  share: '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="m8.2 10.8 7.1-3.6M8.2 13.2l7.1 3.6"/>',
};
/** Chuỗi SVG của một biểu tượng; kích thước theo chữ xung quanh (1.15em) hoặc truyền `size` (px). */
export const icon = (name, size = 0) => `<svg class="ic" viewBox="0 0 24 24" ${size ? `width="${size}" height="${size}"` : ''} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? ''}</svg>`;
