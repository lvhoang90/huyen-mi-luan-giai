#!/usr/bin/env node
/**
 * Dựng ảnh đăng mạng xã hội 1080x1350 theo phong cách Huyền My.
 *   node tools/social-cards.mjs meme [--in docs/social/loi-my-meme.json] [--out DIR]
 *       Mỗi mục thành một ảnh "Huyền My nói" (lời nhân vật, ghi rõ là của My, không gắn cho người dùng).
 *   node tools/social-cards.mjs feedback FILE.csv|FILE.json [--out DIR] [--per 3]
 *       Ghép các góp ý THẬT được phép trích dẫn. CSV lấy từ trang quản trị (Tải CSV, cột "Được trích dẫn").
 *       Mục không được phép trích dẫn bị bỏ qua. Người không đặt tên hiển thị được ghi "Một người dùng thử".
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { qrMatrix } from '../src/qr.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const URL_TAROT = 'https://huyenmy.isavietnam.app/tarot';
const F = join(ROOT, 'public/fonts') + '/';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = (s) => esc(s).split('\n').join('<br>');

const args = process.argv.slice(2); const mode = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const outDir = resolve(opt('--out', join(ROOT, 'docs/social/anh')));

function qrSvg(size) {
  const m = qrMatrix(URL_TAROT), n = m.length, c = 8; let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x * c},${y * c}h${c}v${c}h-${c}z`;
  return `<svg viewBox="-16 -16 ${n * c + 32} ${n * c + 32}" width="${size}" height="${size}"><rect x="-16" y="-16" width="${n * c + 32}" height="${n * c + 32}" rx="22" fill="#fff"/><path d="${d}" fill="#120c3a"/></svg>`;
}
const avatar = readFileSync(join(ROOT, 'public/art/huyenmy-avatar.svg'), 'utf8');
const stars = Array.from({ length: 46 }, (_, i) => { const r = (i * 97 % 7) + 2; return `<div class="st" style="left:${(i * 163) % 1060}px;top:${(i * 289) % 1330}px;width:${r / 2}px;height:${r / 2}px;opacity:${.25 + (i % 5) * .12}"></div>`; }).join('');
const heart = '<svg width="26" height="26" viewBox="0 0 24 24"><path fill="#ff7a8a" d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg>';

const CSS = `
@font-face{font-family:'CG';font-weight:600;src:url(file://${F}cormorant-garamond-vietnamese-600-normal.woff2)}
@font-face{font-family:'CG';font-weight:600;src:url(file://${F}cormorant-garamond-latin-600-normal.woff2);unicode-range:U+0000-00FF}
@font-face{font-family:'CG';font-weight:500;font-style:italic;src:url(file://${F}cormorant-garamond-vietnamese-500-italic.woff2)}
@font-face{font-family:'CG';font-weight:500;font-style:italic;src:url(file://${F}cormorant-garamond-latin-500-italic.woff2);unicode-range:U+0000-00FF}
@font-face{font-family:'BVP';font-weight:400;src:url(file://${F}be-vietnam-pro-vietnamese-400-normal.woff2)}
@font-face{font-family:'BVP';font-weight:500;src:url(file://${F}be-vietnam-pro-vietnamese-500-normal.woff2)}
@font-face{font-family:'BVP';font-weight:400;src:url(file://${F}be-vietnam-pro-latin-400-normal.woff2);unicode-range:U+0000-00FF}
@font-face{font-family:'BVP';font-weight:500;src:url(file://${F}be-vietnam-pro-latin-500-normal.woff2);unicode-range:U+0000-00FF}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;font-family:'BVP',sans-serif;color:#f4efff;background:radial-gradient(900px 700px at 80% 5%,#3a2a8c 0,transparent 60%),radial-gradient(800px 700px at 5% 95%,#2a1c6e 0,transparent 60%),#0f0a33;position:relative;overflow:hidden}
.st{position:absolute;border-radius:50%;background:#f7e6b0}
.wrap{position:absolute;inset:0;padding:70px 76px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:20px}.top .a{width:84px;height:84px;border-radius:50%;overflow:hidden;border:2px solid #d9b866;background:#241a66}.top .a svg{width:100%;height:100%}
.top b{font-family:'CG';font-size:40px;font-weight:600;color:#e9cf88;letter-spacing:.04em}
.cta{margin-top:auto;display:flex;align-items:center;gap:30px;background:rgba(255,255,255,.07);border:1.5px solid rgba(233,207,136,.55);border-radius:30px;padding:24px 30px}
.cta h2{font-family:'CG';font-weight:600;font-size:44px;line-height:1.1;color:#fff}.cta p{font-size:23px;color:#d8d0f2;margin-top:8px;line-height:1.45}.cta u{color:#e9cf88;text-decoration:none;font-weight:500}`;
const cta = `<div class="cta"><div>${qrSvg(190)}</div><div><h2>Bạn cũng thử một lá Tarot nhé?</h2><p>Miễn phí, không cần đăng nhập.<br>Quét mã hoặc vào <u>huyenmy.isavietnam.app/tarot</u></p></div></div>`;
const top = `<div class="top"><div class="a">${avatar}</div><b>HUYỀN MY LUẬN GIẢI</b></div>`;
const page = (css, body) => `<!doctype html><meta charset="utf-8"><style>${CSS}${css}</style><body>${stars}<div class="wrap">${top}${body}${cta}</div></body>`;

function memeCard(m, i, n) {
  const css = `.q{margin:auto 0;padding:10px 0}.mark{font-family:'CG';font-size:200px;line-height:.55;height:90px;color:#e9cf88;opacity:.9}.t{font-family:'CG';font-weight:600;font-size:64px;line-height:1.2;color:#fff;margin-top:14px}.t i{font-style:italic;font-weight:500;color:#e9cf88}
  .by{margin-top:36px;display:flex;align-items:center;gap:16px;font-size:27px;color:#cfc6ee}.by b{font-weight:500;color:#e9cf88}.lb{border:1.5px solid rgba(233,207,136,.6);border-radius:99px;padding:4px 16px;font-size:21px}.no{margin-left:auto;font-size:22px;opacity:.7}`;
  const parts = String(m.text).split('\n');
  const body = `<div class="q"><div class="mark">“</div><div class="t">${esc(parts[0])}${parts[1] ? `<br><i>${esc(parts[1])}</i>` : ''}</div>
    <div class="by"><b>${esc(m.tag ?? 'Huyền My nói')}</b><span class="lb">Lời của nhân vật</span><span class="no">${i + 1}/${n}</span></div></div>`;
  return page(css, body);
}

const initials = (s) => (s === 'Một người dùng thử' ? 'M' : (String(s).trim().split(/\s+/).pop() || 'M')[0].toUpperCase());
function feedbackCard(items, idx, total) {
  const css = `h1{font-family:'CG';font-weight:600;font-size:76px;line-height:1.05;margin:40px 0 8px}h1 i{font-style:italic;font-weight:500;color:#e9cf88}.sub{font-size:25px;color:#cfc6ee;margin-bottom:30px}
  .list{display:grid;gap:18px;margin:auto 0}.c{background:#fff;color:#1c1c28;border-radius:30px;padding:26px 30px;display:flex;gap:20px;box-shadow:0 26px 70px rgba(0,0,0,.4)}
  .pf{width:66px;height:66px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:500;font-size:30px;color:#fff;background:linear-gradient(135deg,#8a6bff,#d36bd0)}
  .who{font-size:25px;font-weight:500}.who span{color:#7a7a8c;font-weight:400;font-size:21px;margin-left:8px}.tx{font-size:30px;line-height:1.38;margin-top:6px}.nps{display:inline-block;margin-top:10px;background:#efeaff;color:#4a2fb0;border-radius:99px;padding:4px 16px;font-size:22px;font-weight:500}.st5{color:#d9a826;font-size:24px;letter-spacing:2px;margin-top:6px}`;
  const body = `<h1>Họ nói gì về <i>Huyền My</i>?</h1><div class="sub">Góp ý thật của người dùng thử, đăng với sự đồng ý của họ${total > 1 ? ` · ${idx + 1}/${total}` : ''}</div>
   <div class="list">${items.map((x) => `<div class="c"><div class="pf">${esc(initials(x.name))}</div><div><div class="who">${esc(x.name)}<span>· người dùng thử</span></div><div class="tx">${esc(x.text)}</div>${x.rating ? (x.kind === 'nps' ? `<div class="nps">${esc(x.rating)}/10 điểm giới thiệu</div>` : `<div class="st5">${'★'.repeat(Math.round(x.rating))}</div>`) : ''}</div></div>`).join('')}</div>`;
  return page(css, body);
}

function parseCsv(txt) {
  const rows = []; let row = [], cur = '', q = false; txt = txt.replace(/^﻿/, '');
  for (let i = 0; i < txt.length; i++) { const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [h, ...r] = rows.filter((x) => x.length > 1); return r.map((c) => Object.fromEntries(h.map((k, i) => [k, c[i] ?? ''])));
}

async function render(htmls, names) {
  const { chromium } = await import(PW); mkdirSync(outDir, { recursive: true });
  const br = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await br.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = mkdtempSync(join(tmpdir(), 'hm-card-'));
  for (let i = 0; i < htmls.length; i++) { const t = join(tmp, `c${i}.html`); writeFileSync(t, htmls[i]); await pg.goto('file://' + t); await pg.waitForTimeout(500); const f = join(outDir, names[i]); await pg.screenshot({ path: f }); console.log(f); }
  await br.close();
}

if (mode === 'meme') {
  const list = JSON.parse(readFileSync(resolve(opt('--in', join(ROOT, 'docs/social/loi-my-meme.json'))), 'utf8'));
  await render(list.map((m, i) => memeCard(m, i, list.length)), list.map((_, i) => `huyenmy-loi-my-${i + 1}.png`));
} else if (mode === 'feedback' && args[1]) {
  const file = resolve(args[1]), raw = readFileSync(file, 'utf8');
  const all = file.endsWith('.json') ? JSON.parse(raw) : parseCsv(raw).map((r) => ({ text: r['Lời góp ý'], ok: /^(1|true|có|được)/i.test(r['Được trích dẫn'] ?? ''), name: r['Tên hiển thị'], rating: +r['Điểm'] || null, kind: r['Loại'] }));
  const items = all.filter((x) => (x.ok ?? x.quoteOk) && String(x.text ?? '').trim().length >= 8).map((x) => ({ text: String(x.text).trim(), name: String(x.name ?? '').trim() || 'Một người dùng thử', rating: x.rating, kind: x.kind }));
  if (!items.length) { console.error('Không có góp ý nào được phép trích dẫn trong tệp này.'); process.exit(1); }
  const per = +opt('--per', 3), groups = []; for (let i = 0; i < items.length; i += per) groups.push(items.slice(i, i + per));
  await render(groups.map((g, i) => feedbackCard(g, i, groups.length)), groups.map((_, i) => `huyenmy-gop-y-${i + 1}.png`));
} else { console.error('Cách dùng: social-cards.mjs meme | feedback FILE [--out DIR] [--per 3]'); process.exit(2); }
