// Dựng các trang pháp lý tĩnh (public/terms.html, privacy.html, license.html) từ docs/legal/*.md và LICENSE.
// Dùng: node tools/build-legal.mjs   (chạy lại mỗi khi sửa nội dung). Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.
import fs from 'node:fs';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
function md(src) {
  const out = []; let list = false;
  for (const line of src.split('\n')) {
    const close = () => { if (list) { out.push('</ul>'); list = false; } };
    if (/^# /.test(line)) { close(); out.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (/^## /.test(line)) { close(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^- /.test(line)) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (line.trim()) { close(); out.push(`<p>${inline(line)}</p>`); } else close();
  }
  if (list) out.push('</ul>'); return out.join('\n');
}
const NAV = '<nav><a href="/about.html">Giới thiệu</a> · <a href="/terms.html">Điều khoản</a> · <a href="/privacy.html">Quyền riêng tư</a> · <a href="/license.html">Bản quyền</a></nav>';
const page = (title, body) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Huyền My Luận Giải</title><meta name="color-scheme" content="dark">
<style>body{margin:0;background:#0b0912;color:#e9e1cf;font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:760px;margin:0 auto;padding:22px 18px 70px}a{color:#e8c46a}h1{font-size:1.7rem;margin:.8em 0 .4em}h2{font-size:1.1rem;margin:1.6em 0 .3em;color:#f3dca0}ul{padding-left:1.2em}li{margin:.35em 0}code{background:#1a1530;padding:1px 5px;border-radius:4px}nav{font-size:.9rem;color:#9a92bd}pre{white-space:pre-wrap;word-wrap:break-word;font:inherit}footer{margin-top:3em;font-size:.85rem;color:#8f87b8}</style></head>
<body><main><p><a href="/">← Về Huyền My</a></p>${body}<footer>${NAV}<br>© 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.</footer></main></body></html>
`;
const write = (f, t, b) => fs.writeFileSync(new URL(`../public/${f}`, import.meta.url), page(t, b));
write('terms.html', 'Điều khoản sử dụng', md(fs.readFileSync(new URL('../docs/legal/dieu-khoan.md', import.meta.url), 'utf8')));
write('privacy.html', 'Chính sách quyền riêng tư', md(fs.readFileSync(new URL('../docs/legal/quyen-rieng-tu.md', import.meta.url), 'utf8')));
write('about.html', 'Giới thiệu và liên hệ', md(fs.readFileSync(new URL('../docs/legal/gioi-thieu.md', import.meta.url), 'utf8')));
write('license.html', 'Bản quyền', `<h1>Bản quyền</h1><pre>${esc(fs.readFileSync(new URL('../LICENSE', import.meta.url), 'utf8'))}</pre>`);
console.log('Đã dựng public/terms.html, privacy.html, about.html, license.html');
