// Lời mời đăng ký sau khi người chưa đăng nhập rút bài Tarot hoặc xem lá số. Có nhiều kiểu để đo kiểu nào hiệu quả hơn.
// Mỗi người được gán một kiểu cố định (lưu trên máy), một kiểu là nhóm đối chứng không hiện gì. Nội dung chỉ nói điều có thật trong sản phẩm.
import './cta.css';
import { track, setAttr } from './track.js';

export const CTA_VARIANTS = ['none', 'gift', 'corner', 'voice', 'remind'];
const WEIGHTS = { none: 1, gift: 2, corner: 2, voice: 2, remind: 2 };
const VKEY = 'huyenmy.ctav', DKEY = 'huyenmy.ctadone';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function pickVariant(rand = Math.random()) {
  const total = CTA_VARIANTS.reduce((a, k) => a + WEIGHTS[k], 0); let x = rand * total;
  for (const k of CTA_VARIANTS) { x -= WEIGHTS[k]; if (x < 0) return k; }
  return 'none';
}
export function variantOf() {
  let v = ''; try { v = localStorage.getItem(VKEY) || ''; } catch {}
  if (!CTA_VARIANTS.includes(v)) { v = pickVariant(); try { localStorage.setItem(VKEY, v); } catch {} }
  return v;
}

const COPY = {
  gift: { t: 'Thêm thời gian trò chuyện với My', s: 'Đăng ký bằng email (không cần mật khẩu) để có 30 phút trò chuyện mỗi ngày. Mời thêm bạn bè, My tặng thêm 30 phút cho mỗi bạn.', b: 'Đăng ký để trò chuyện', login: true },
  corner: { t: 'Mở Góc của tôi', s: 'Nơi giữ bộ sưu tập lá bài bạn đã gặp, lá số của bạn và liên kết mời bạn bè. Đăng ký chỉ cần một địa chỉ email.', b: 'Mở Góc của tôi', login: true },
  remind: { t: 'Mai My nhắc bạn rút lá mới nhé?', s: 'Đăng ký bằng email, rồi bật ô nhắc nhẹ (mặc định đang tắt): tối đa một thư mỗi 7 ngày, hủy bằng một chạm.', b: 'Đăng ký để nhận nhắc', login: true },
  voice: { t: '', s: '', b: 'Trò chuyện với My', login: false },
};
const QUOTE = { tarot: 'Lá này còn một điều My muốn hỏi riêng bạn. Mình trò chuyện một chút nhé?', chart: 'Có chỗ trong lá số này My muốn nghe bạn kể thêm. Mình trò chuyện một chút nhé?' };

/**
 * Gắn lời mời vào `host`. src: 'tarot' hoặc 'chart'. onChat(): chuyển sang trò chuyện với My (kiểu "voice");
 * onLogin(): mở đăng ký (mặc định về trang chủ với ?login=1). Trả về kiểu đã gán.
 */
export function mountCta(host, { src, onChat, onLogin } = {}) {
  const v = variantOf();
  host.replaceChildren(); host.hidden = true;
  setAttr(v, src); // cả nhóm đối chứng: mọi đăng ký về sau được tính cho kiểu đã gán
  track('cta_shown', { v, src });
  if (v === 'none') return v;
  const c = COPY[v];
  host.hidden = false;
  host.innerHTML = `<div class="cta-box cta-${v}"><img class="cta-av" src="/art/huyenmy-avatar.svg" width="52" height="52" alt="" loading="lazy">
    <div class="cta-tx">${v === 'voice' ? `<p class="cta-quote">“${esc(QUOTE[src] ?? QUOTE.tarot)}”</p><small>Huyền My</small>` : `<b>${esc(c.t)}</b><p>${esc(c.s)}</p>`}
      <div class="cta-acts"><button type="button" class="btn primary" data-cta="go">${esc(c.b)}</button><button type="button" class="cta-later" data-cta="no">Để sau</button></div></div></div>`;
  host.querySelector('[data-cta=go]').onclick = () => {
    track('cta_click', { v, src });
    if (c.login) (onLogin ?? (() => { location.href = '/?login=1'; }))(); else (onChat ?? (() => { location.href = '/'; }))();
  };
  host.querySelector('[data-cta=no]').onclick = () => { track('cta_dismiss', { v, src }); host.hidden = true; try { sessionStorage.setItem(DKEY, '1'); } catch {} };
  return v;
}
