// Đăng ký service worker để ứng dụng có trang ngoại tuyến và cài được lên màn hình chính. Chỉ chạy ở bản đã dựng (không chạy khi phát triển).
if (import.meta.env?.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}); });
}
