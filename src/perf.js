// Chọn mức hiệu ứng theo sức máy, và tự hạ mức nếu thấy máy bị giật. Mức đã hạ được nhớ cho lần sau.
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
const KEY = 'huyenmy.perf';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Trình duyệt nhúng trong Zalo, Facebook, Instagram bị giới hạn bộ nhớ chặt: dùng mức hiệu ứng nhẹ để tránh bị hệ thống nạp lại trang.
const inApp = /Zalo|FBAN|FBAV|FB_IAB|Instagram|Line\//i.test(navigator.userAgent);
const weak = inApp || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
let saved = ''; try { saved = localStorage.getItem(KEY) || ''; } catch {}
const subs = new Set();
const mark = () => document.documentElement.classList.toggle('fx-low', perf.tier === 'low');
export const perf = {
  tier: reduced || weak || saved === 'low' ? 'low' : 'high',
  get low() { return this.tier === 'low'; },
  reduced,
  /** Hạ xuống mức nhẹ (một chiều), thông báo cho các thành phần đang chạy. */
  downgrade() { if (this.tier === 'low') return; this.tier = 'low'; try { localStorage.setItem(KEY, 'low'); } catch {} mark(); subs.forEach((f) => f()); },
  onChange(f) { subs.add(f); },
};
mark(); // máy yếu hoặc đã từng bị giật: bỏ các hiệu ứng làm mờ tốn sức (xem .fx-low trong style.css)
