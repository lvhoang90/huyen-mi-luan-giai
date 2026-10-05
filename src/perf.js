// Chọn mức hiệu ứng theo sức máy, và tự hạ mức nếu thấy máy bị giật. Mức đã hạ được nhớ cho lần sau.
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
const KEY = 'huyenmy.perf';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
let saved = ''; try { saved = localStorage.getItem(KEY) || ''; } catch {}
const subs = new Set();
export const perf = {
  tier: reduced || weak || saved === 'low' ? 'low' : 'high',
  get low() { return this.tier === 'low'; },
  reduced,
  /** Hạ xuống mức nhẹ (một chiều), thông báo cho các thành phần đang chạy. */
  downgrade() { if (this.tier === 'low') return; this.tier = 'low'; try { localStorage.setItem(KEY, 'low'); } catch {} subs.forEach((f) => f()); },
  onChange(f) { subs.add(f); },
};
