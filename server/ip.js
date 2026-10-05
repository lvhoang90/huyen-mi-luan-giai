// Địa chỉ người dùng. Sau nginx/Cloudflare mọi yêu cầu đều tới từ 127.0.0.1, nên chỉ khi đặt TRUST_PROXY=1 mới tin tiêu đề X-Forwarded-For.
// Chỉ bật khi máy chủ Node không mở ra Internet trực tiếp (chỉ nhận từ proxy), nếu không người lạ có thể giả địa chỉ.
export const clientIp = (req) => {
  if (process.env.TRUST_PROXY === '1') {
    const xf = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
    if (xf) return xf;
  }
  return req.socket.remoteAddress ?? '?';
};
