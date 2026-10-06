// Service worker của Huyền My Luận Giải: chỉ giữ trang ngoại tuyến và các tệp tĩnh (phông, hình, mã); không bao giờ lưu hay can thiệp /api.
const VERSION = 'hm-v1', SHELL = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/art/huyenmy-avatar.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return;
  if (req.mode === 'navigate') { // trang: ưu tiên mạng, mất mạng thì hiện trang ngoại tuyến
    e.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }
  if (/^\/(assets|fonts|icons|art)\//.test(url.pathname)) { // tệp tĩnh có hash trong tên: lấy từ bộ nhớ trước, thiếu thì tải và nhớ lại
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
  }
});
