// Liên kết nhóm hoặc OA Zalo (ZALO_URL). Chỉ chấp nhận https tới tên miền của Zalo để biến môi trường sai không biến thành liên kết lạ trên giao diện.
const HOSTS = new Set(['zalo.me', 'www.zalo.me', 'chat.zalo.me', 'oa.zalo.me', 'zaloapp.com', 'www.zaloapp.com']);
export function safeZaloUrl(v) {
  try {
    const u = new URL(String(v ?? '').trim());
    return u.protocol === 'https:' && HOSTS.has(u.hostname) && !u.username && !u.password ? u.href : '';
  } catch { return ''; }
}
