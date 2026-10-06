// 50 cấu hình kiểm thử: thiết bị, màn hình, mạng, ứng dụng nhúng (Zalo, Facebook), múi giờ, tùy chọn trợ năng.
// Chạy bằng Chromium (Playwright): màn hình, cảm ứng, chuỗi nhận diện và điều kiện mạng được giả lập, còn lõi Safari (WebKit) và Firefox thì KHÔNG được kiểm tra.
const ZALO = (base) => `${base} Zalo/24.9.1 ZaloTheme/light ZaloLanguage/vi`;
const FB_IOS = (base) => `${base} [FBAN/FBIOS;FBAV/450.0.0.38.108;FBBV/561000000;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/vi_VN;FBOP/5]`;
const FB_ANDROID = (base) => `${base} [FB_IAB/MESSENGER;FBAV/445.0.0.30.109;]`;
export const NET = { '3g': { latency: 150, down: 1.6e6 / 8, up: 0.75e6 / 8 }, slow3g: { latency: 400, down: 0.5e6 / 8, up: 0.5e6 / 8 } };

const dev = (group, device, extra = {}) => ({ group, device, ...extra });
const custom = (group, label, viewport, extra = {}) => ({ group, label, custom: { viewport, deviceScaleFactor: extra.dpr ?? 1, isMobile: !!extra.mobile, hasTouch: !!extra.mobile, userAgent: extra.ua }, ...extra });

export const PROFILES = [
  // Android (15)
  ...['Pixel 7', 'Pixel 5', 'Pixel 4', 'Pixel 2', 'Galaxy S24', 'Galaxy S9+', 'Galaxy S8', 'Galaxy S III', 'Galaxy A55', 'Galaxy Note II', 'Moto G4', 'Nexus 5', 'Nexus 5X', 'Nexus 6P', 'LG Optimus L70'].map((d) => dev('Android', d)),
  // iPhone (12, giả lập bằng Chromium)
  ...['iPhone SE', 'iPhone 8', 'iPhone X', 'iPhone 11', 'iPhone 12 Mini', 'iPhone 13', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Pro Max', 'iPhone 6', 'iPhone 12 Pro', 'iPhone SE (3rd gen)'].map((d) => dev('iPhone', d)),
  // Máy tính bảng (5)
  ...['iPad Mini', 'iPad Pro 11', 'Galaxy Tab S9', 'Nexus 10', 'Kindle Fire HDX'].map((d) => dev('Tablet', d)),
  // Máy tính (6)
  dev('Desktop', 'Desktop Chrome'), dev('Desktop', 'Desktop Chrome HiDPI'), dev('Desktop', 'Desktop Edge'),
  custom('Desktop', 'Laptop 1366x768', { width: 1366, height: 768 }), custom('Desktop', 'Màn hình 1920x1080', { width: 1920, height: 1080 }), custom('Desktop', 'Siêu rộng 2560x1080', { width: 2560, height: 1080 }),
  // Điều kiện đặc biệt (12)
  dev('Đặc biệt', 'Moto G4', { label: 'Moto G4, mạng 3G chậm, CPU chậm 6 lần', net: 'slow3g', cpu: 6 }),
  dev('Đặc biệt', 'Pixel 2', { label: 'Pixel 2, mạng 3G, CPU chậm 4 lần', net: '3g', cpu: 4 }),
  dev('Đặc biệt', 'Pixel 7', { label: 'Pixel 7 trong Zalo', inapp: 'zalo', ua: (b) => ZALO(b), noShare: true }),
  dev('Đặc biệt', 'Galaxy S8', { label: 'Galaxy S8 trong Zalo, mạng 3G chậm', inapp: 'zalo', ua: (b) => ZALO(b), noShare: true, net: 'slow3g' }),
  dev('Đặc biệt', 'iPhone 12', { label: 'iPhone 12 trong Facebook', inapp: 'facebook', ua: (b) => FB_IOS(b), noShare: true }),
  dev('Đặc biệt', 'Galaxy A55', { label: 'Galaxy A55 trong Messenger', inapp: 'messenger', ua: (b) => FB_ANDROID(b), noShare: true }),
  dev('Đặc biệt', 'Pixel 5', { label: 'Pixel 5, giảm chuyển động', reducedMotion: 'reduce' }),
  custom('Đặc biệt', 'Điện thoại cỡ hiển thị lớn nhất (288x576)', { width: 288, height: 576 }, { dpr: 3, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 14; SM-A146B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }),
  dev('Đặc biệt', 'Desktop Chrome', { label: 'Máy tính, múi giờ Los Angeles, tiếng Anh', tz: 'America/Los_Angeles', locale: 'en-US' }),
  dev('Đặc biệt', 'iPhone 13', { label: 'iPhone 13, múi giờ London, tiếng Anh', tz: 'Europe/London', locale: 'en-GB' }),
  dev('Đặc biệt', 'Pixel 7 landscape', { label: 'Pixel 7 nằm ngang' }),
  custom('Đặc biệt', 'Điện thoại gập, đang gập (344x882)', { width: 344, height: 882 }, { dpr: 2.6, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }),
].map((p, i) => ({ id: `p${String(i + 1).padStart(2, '0')}`, label: p.label ?? p.device, ...p }));
if (PROFILES.length !== 50) throw new Error(`Cần đúng 50 cấu hình, đang có ${PROFILES.length}`);
