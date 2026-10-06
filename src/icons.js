// Bộ biểu tượng nét mảnh (viền 1.8, đầu tròn), vẽ tay, dùng chung cho thanh công cụ và các nút. Không phụ thuộc thư viện ngoài.
const P = {
  soundOn: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.2 9a4.2 4.2 0 0 1 0 6"/><path d="M18.2 6.2a8.2 8.2 0 0 1 0 11.6"/>',
  soundOff: '<path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="m16 9.5 4.5 5"/><path d="m20.5 9.5-4.5 5"/>',
  paceTap: '<path d="m9.5 6 6 6-6 6"/>',
  paceAuto: '<path d="m6 6 6 6-6 6"/><path d="m13 6 6 6-6 6"/>',
  admin: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
  account: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20c.8-3.6 3.5-5.7 7-5.7s6.2 2.1 7 5.7"/>',
  chart: '<path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8z"/><path d="m12 8.4 3.7 2.3v4.5L12 17.6l-3.7-2.4v-4.5z"/><path d="M12 3.5v4.9M19.5 8l-3.8 2.7M19.5 16l-3.8-1M12 20.5v-2.9M4.5 16l3.8-1M4.5 8l3.8 2.7"/>',
  reset: '<path d="M3.8 12a8.2 8.2 0 1 0 2.7-6.1"/><path d="M3.5 4v4.4h4.4"/>',
  download: '<path d="M12 4v11"/><path d="m7.5 11 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
  share: '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="m8.2 10.8 7.1-3.6M8.2 13.2l7.1 3.6"/>',
};
/** Chuỗi SVG của một biểu tượng; kích thước theo chữ xung quanh (1.15em) hoặc truyền `size` (px). */
export const icon = (name, size = 0) => `<svg class="ic" viewBox="0 0 24 24" ${size ? `width="${size}" height="${size}"` : ''} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? ''}</svg>`;
