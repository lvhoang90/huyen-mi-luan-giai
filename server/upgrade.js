// Thử mức giá trước khi làm thanh toán: bật bằng UPGRADE_TEST=on, mức giá (đồng mỗi tháng) đặt bằng UPGRADE_PRICES="49000,59000,79000".
// Không thu tiền, không có cổng thanh toán; giao diện nói rõ gói chưa mở bán.
const DEFAULT = [49000, 59000, 79000];
export function upgradePrices(env = process.env) {
  if (String(env.UPGRADE_TEST ?? '').toLowerCase() !== 'on') return null;
  const list = String(env.UPGRADE_PRICES ?? '').split(',').map((s) => Math.round(+s.trim())).filter((n) => Number.isFinite(n) && n >= 1000 && n <= 1_000_000);
  const uniq = [...new Set(list)].slice(0, 4);
  return uniq.length ? uniq : DEFAULT;
}
