// Theo dõi hành trình ẩn danh: chỉ gửi tên sự kiện và vài giá trị ngắn, không bao giờ gửi nội dung trò chuyện.
const SID_KEY = 'huyenmy.sid';
let sid = '';
try { sid = sessionStorage.getItem(SID_KEY) || ''; } catch {}
if (!sid) { sid = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)).replace(/-/g, '').slice(0, 20); try { sessionStorage.setItem(SID_KEY, sid); } catch {} }
export const sessionId = sid;

let queue = [], timer = 0;
function flush(useBeacon = false) {
  clearTimeout(timer); timer = 0;
  if (!queue.length) return;
  const body = JSON.stringify({ sid, events: queue.splice(0, 50) });
  try {
    if (useBeacon && navigator.sendBeacon) navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
    else fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {}
}
export function track(name, props = {}) {
  queue.push({ name, props, t: Date.now() });
  if (queue.length >= 20) flush(); else if (!timer) timer = setTimeout(flush, 4000);
}
addEventListener('pagehide', () => flush(true));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });
addEventListener('error', (e) => track('client_error', { code: String(e.message ?? '').slice(0, 30) }));

export const ageBand = (year, now = new Date()) => { const a = now.getFullYear() - year; return a <= 17 ? '<=17' : a <= 26 ? '18-26' : a <= 40 ? '27-40' : a <= 55 ? '41-55' : '56+'; };
