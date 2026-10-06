import { CUNG_TEN } from './engine/tuvi.js';
import { natalAttention } from './engine/thoivan.js';
import { HANH } from './engine/bazi.js';
import { drawQr } from './qr.js';

// Thẻ chia sẻ: vẽ bằng canvas, không chứa ngày sinh hay họ tên đầy đủ, chỉ tên gọi và vài điểm chung.
function wrap(ctx, text, x, y, maxW, lineH, maxLines = 4) {
  const words = String(text).split(/\s+/); let line = '', n = 0;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y + n * lineH); line = w; if (++n >= maxLines) return y + n * lineH; } else line = test;
  }
  if (line) { ctx.fillText(line, x, y + n * lineH); n++; }
  return y + n * lineH;
}

export async function makeCard({ nickname, element, trait, famous, url }) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(W / 2, H * 0.3, 80, W / 2, H * 0.4, H);
  bg.addColorStop(0, '#3a2490'); bg.addColorStop(0.6, '#130c3a'); bg.addColorStop(1, '#070716');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(235,232,255,${0.15 + Math.random() * 0.6})`; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + 0.4, 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(226,194,125,.5)'; g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
  g.textAlign = 'center'; g.fillStyle = '#e2c27d';
  g.font = '600 76px "Cormorant Garamond", Georgia, serif'; g.fillText('Huyền My', W / 2, 190);
  g.font = 'italic 34px "Cormorant Garamond", Georgia, serif'; g.fillStyle = '#d9cdf7'; g.fillText('Luận Giải 1.0', W / 2, 245);
  g.fillStyle = '#ece7fb'; g.font = '300 38px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText('Hồ sơ biểu tượng của', W / 2, 420);
  g.fillStyle = '#fbeecb'; g.font = '600 120px "Cormorant Garamond", Georgia, serif'; g.fillText(nickname, W / 2, 545);
  let y = 680; g.font = '400 44px "Be Vietnam Pro", system-ui, sans-serif';
  if (element) { g.fillStyle = '#e2c27d'; g.fillText(`Nhật chủ hành ${element}`, W / 2, y); y += 100; }
  if (trait) { g.fillStyle = '#ece7fb'; g.font = '300 38px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText('Nét hiếm trong lá số', W / 2, y); y += 66; g.font = 'italic 52px "Cormorant Garamond", Georgia, serif'; g.fillStyle = '#fbeecb'; y = wrap(g, trait, W / 2, y, 860, 66, 3) + 54; }
  if (famous) { g.fillStyle = '#ece7fb'; g.font = '300 38px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText('Cùng ngày sinh với', W / 2, y); y += 66; g.fillStyle = '#e2c27d'; g.font = '600 56px "Cormorant Garamond", Georgia, serif'; wrap(g, famous, W / 2, y, 860, 66, 2); }
  g.fillStyle = 'rgba(236,231,251,.75)'; g.font = '300 30px "Be Vietnam Pro", system-ui, sans-serif';
  g.fillText('Lăng kính biểu tượng để soi mình, không phải lời tiên đoán', W / 2, H - 150);
  g.fillStyle = '#e2c27d'; g.font = '500 34px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(url.replace(/^https?:\/\//, ''), W / 2, H - 90);
  g.fillStyle = 'rgba(236,231,251,.55)'; g.font = '300 24px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText('© 2026 Lương Việt Hoàng', W / 2, H - 56);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}


const avatarImg = () => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = '/art/huyenmy-avatar.svg'; });
/** Dấu hiệu thương hiệu: ảnh Huyền My và tên ứng dụng, đặt giữa theo chiều ngang tại độ cao cy. */
async function drawBrand(g, W, cy, name = 'Huyền My Luận Giải') {
  const img = await avatarImg(), R = 40; g.font = '600 54px "Cormorant Garamond", Georgia, serif';
  const tw = g.measureText(name).width, total = (img ? R * 2 + 20 : 0) + tw; let x = (W - total) / 2;
  if (img) { g.save(); g.beginPath(); g.arc(x + R, cy, R, 0, 6.283); g.clip(); g.drawImage(img, x, cy - R, R * 2, R * 2); g.restore(); g.strokeStyle = '#e2c27d'; g.lineWidth = 3; g.beginPath(); g.arc(x + R, cy, R, 0, 6.283); g.stroke(); x += R * 2 + 20; }
  g.textAlign = 'left'; g.fillStyle = '#e2c27d'; g.fillText(name, x, cy + 18); g.textAlign = 'center';
}
/** Chân thẻ: mã QR dẫn tới liên kết giới thiệu, dòng chữ liên kết tự thu nhỏ cho vừa khung (không tràn ra ngoài viền). */
function drawFooter(g, W, H, url, label) {
  const y0 = H - 265, show = url.replace(/^https?:\/\//, '');
  drawQr(g, url, 80, y0, 200);
  const x = 312, maxW = W - 80 - x; g.textAlign = 'left';
  const fit = (text, weight, px, min, family = '"Be Vietnam Pro", system-ui, sans-serif') => { let f = px; do { g.font = `${weight} ${f}px ${family}`; f--; } while (g.measureText(text).width > maxW && f >= min); };
  g.fillStyle = '#e2c27d'; fit(label, 500, 34, 22); g.fillText(label, x, y0 + 58);
  g.fillStyle = '#fbeecb'; fit(show, 400, 32, 18); g.fillText(show, x, y0 + 112);
  g.fillStyle = 'rgba(236,231,251,.72)'; fit('Soi mình, không phải lời tiên đoán', 300, 26, 18); g.fillText('Soi mình, không phải lời tiên đoán', x, y0 + 162);
  g.textAlign = 'center';
}
const ELC = { Kim: '#f1ead2', Mộc: '#7fe3a0', Thủy: '#6fb7ff', Hỏa: '#ff8a5c', Thổ: '#e0b86a' };
const fonts = async () => { try { await Promise.all(['600 40px "Cormorant Garamond"', '400 30px "Be Vietnam Pro"', '300 30px "Be Vietnam Pro"', 'italic 500 30px "Cormorant Garamond"'].map((f) => document.fonts.load(f, 'ÀỀỆ'))); await document.fonts.ready; } catch {} };

/**
 * Thẻ lá số (1080x1350): radar 12 cung theo "mức chú ý" (hoặc ngũ hành nếu thiếu giờ sinh) và bốn điểm chính.
 * Không có ngày sinh, giờ sinh hay họ tên đầy đủ: chỉ tên gọi và các điểm chung của lá số.
 */
export async function makeChartCard({ nickname, chart, url }) {
  await fonts();
  const W = 1080, H = 1480, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(W / 2, H * 0.32, 80, W / 2, H * 0.42, H);
  bg.addColorStop(0, '#3a2490'); bg.addColorStop(0.6, '#130c3a'); bg.addColorStop(1, '#070716');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // sao cố định để ảnh giống nhau mỗi lần
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(235,232,255,${0.15 + rnd() * 0.6})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 2.2 + 0.4, 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(226,194,125,.5)'; g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
  g.textAlign = 'center'; g.fillStyle = '#e2c27d';
  await drawBrand(g, W, 118);
  g.fillStyle = '#d9cdf7'; g.font = '300 32px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText('Lá số biểu tượng của', W / 2, 200);
  g.fillStyle = '#fbeecb'; g.font = '600 104px "Cormorant Garamond", Georgia, serif'; g.fillText(nickname, W / 2, 304);

  const cx = W / 2, cy = 650, R = 225;
  const t = chart.tuvi;
  if (t) {
    const items = CUNG_TEN.map((n) => natalAttention(t).find((x) => x.name === n));
    const ang = (i) => ((-90 + i * 30) * Math.PI) / 180;
    g.lineWidth = 1.5;
    for (const k of [0.38, 0.69, 1]) { g.strokeStyle = `rgba(226,194,125,${k === 1 ? 0.45 : 0.22})`; g.beginPath(); g.arc(cx, cy, R * k, 0, 6.283); g.stroke(); }
    g.strokeStyle = 'rgba(226,194,125,.18)';
    for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * Math.cos(ang(i)), cy + R * Math.sin(ang(i))); g.stroke(); }
    const pts = items.map((it, i) => { const r = R * (0.38 + 0.31 * Math.min(2, it.level)); return [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i)), it]; });
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = 'rgba(226,194,125,.22)'; g.fill(); g.strokeStyle = '#e2c27d'; g.lineWidth = 3; g.stroke();
    for (const [x, y, it] of pts) { g.beginPath(); g.arc(x, y, it.level === 2 ? 10 : 7, 0, 6.283); g.fillStyle = it.level === 2 ? '#fbeecb' : '#a999ff'; g.fill(); }
    g.font = '400 27px "Be Vietnam Pro", system-ui, sans-serif'; g.fillStyle = '#ece7fb';
    items.forEach((it, i) => { const a = ang(i), x = cx + (R + 50) * Math.cos(a), y = cy + (R + 50) * Math.sin(a) + 9; g.textAlign = Math.cos(a) > 0.3 ? 'left' : Math.cos(a) < -0.3 ? 'right' : 'center'; g.fillText(it.name, Math.cos(a) > 0.3 ? x - 20 : Math.cos(a) < -0.3 ? x + 20 : x, y); });
    g.textAlign = 'center'; g.fillStyle = 'rgba(236,231,251,.7)'; g.font = '300 26px "Be Vietnam Pro", system-ui, sans-serif';
    g.fillText('12 cung theo mức chú ý (xa tâm là nhiều), không phải điểm tốt xấu', W / 2, 985);
  } else {
    const counts = chart.bazi.elements.counts, max = Math.max(...Object.values(counts), 1);
    g.textAlign = 'left'; g.font = '400 34px "Be Vietnam Pro", system-ui, sans-serif';
    HANH.forEach((k, i) => { const y = cy - 150 + i * 76; g.fillStyle = ELC[k]; g.fillText(k, 250, y + 12); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(380, y - 12, 450, 24); g.fillStyle = ELC[k]; g.fillRect(380, y - 12, 450 * (counts[k] / max), 24); g.fillStyle = '#ece7fb'; g.fillText(String(counts[k]), 860, y + 12); });
    g.textAlign = 'center'; g.fillStyle = 'rgba(236,231,251,.7)'; g.font = '300 26px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText('Ngũ hành trong lá số', W / 2, cy + 260);
  }

  const menh = t ? t.palaces[t.menh] : null;
  const facts = [
    ['Nhật chủ', `${chart.bazi.dayMaster.can} · hành ${chart.bazi.dayMaster.hanh}`],
    ['Mặt Trời', chart.astro.sun.name],
    ['Cung Mệnh', menh ? (menh.chinh.length ? menh.chinh.join(', ') : 'vô chính diệu') : 'cần giờ sinh'],
    ['Số chủ đạo', String(chart.numerology.lifePath)],
  ];
  const bx = [90, 560], by = [1020, 1108], bw = 430, bh = 74;
  facts.forEach(([k, v], i) => {
    const x = bx[i % 2], y = by[Math.floor(i / 2)];
    g.fillStyle = 'rgba(255,255,255,.06)'; g.strokeStyle = 'rgba(226,194,125,.35)'; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect(x, y, bw, bh, 20); g.fill(); g.stroke();
    g.textAlign = 'left'; g.fillStyle = '#d9cdf7'; g.font = '300 22px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(k, x + 22, y + 28);
    g.fillStyle = '#fbeecb'; g.font = '500 30px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(v.length > 24 ? v.slice(0, 23) + '…' : v, x + 22, y + 60);
  });
  drawFooter(g, W, H, url, 'Quét mã để xem lá số của bạn');
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
/** mode: 'share' mở hộp thoại chia sẻ của thiết bị (kèm ảnh và liên kết giới thiệu); 'download' luôn tải ảnh về. Trả về 'shared' | 'saved' | 'cancelled'. */
async function deliver(blob, name, { mode, url, text }) {
  if (mode === 'share') {
    const file = new File([blob], name, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Huyền My Luận Giải', text, url }); return 'shared'; }
      if (navigator.share) { await navigator.share({ title: 'Huyền My Luận Giải', text, url }); return 'shared'; }
    } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
    try { await navigator.clipboard?.writeText(`${text} ${url}`); } catch {} // máy không có hộp thoại chia sẻ: tải ảnh và chép sẵn lời kèm liên kết
  }
  download(blob, name); return 'saved';
}
const SHARE_TEXT = 'Mình vừa được Huyền My soi lá số, bạn thử xem sao';
export async function shareCard(info, mode = 'share') { return deliver(await makeCard(info), 'huyen-my.png', { mode, url: info.url, text: SHARE_TEXT }); }
export async function shareChart(info, mode = 'share') { return deliver(await makeChartCard(info), 'la-so-huyen-my.png', { mode, url: info.url, text: SHARE_TEXT }); }

// ---------- thẻ Tarot (một lá hoặc ba lá) ----------
const svgImage = async (svg, w, h) => { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" `)); await img.decode(); return img; };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
/** Vẽ một lá bài theo hệ toạ độ thiết kế 300 x 500, thu phóng theo chiều rộng w. */
function drawTarotCard(g, card, art, x, y, w) {
  const s = w / 300; g.save(); g.translate(x, y); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40 / s; g.shadowOffsetY = 14 / s;
  const bg = g.createLinearGradient(0, 0, 0, 500); bg.addColorStop(0, '#1d1650'); bg.addColorStop(1, '#0c0a28');
  rr(g, 0, 0, 300, 500, 16); g.fillStyle = bg; g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 3; g.strokeStyle = '#e2c27d'; rr(g, 1.5, 1.5, 297, 497, 16); g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#e2c27d'; g.font = '500 24px "Cormorant Garamond", Georgia, serif'; g.fillText(card.roman.split('').join(' '), 150, 40);
  g.save(); rr(g, 20, 56, 260, 364, 10); g.clip(); g.drawImage(art, 20, 56, 260, 364); g.restore();
  g.lineWidth = 1.2; g.strokeStyle = 'rgba(226,194,125,.6)'; rr(g, 20, 56, 260, 364, 10); g.stroke();
  g.fillStyle = '#fbeecb'; g.font = '600 26px "Cormorant Garamond", Georgia, serif'; g.fillText(card.name, 150, 454);
  g.fillStyle = '#b9b1dc'; g.font = '300 11px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(card.en.toUpperCase(), 150, 478);
  g.restore();
}
/** Thẻ Tarot 1080 x 1350: một lá lớn hoặc ba lá có nhãn vị trí. Không chứa điều người dùng nghĩ, chỉ tên lá bài. */
export async function makeTarotCard({ cards, positions = null, url }) {
  await fonts();
  const { cardArtSvg } = await import('./tarot/art.js');
  const W = 1080, H = 1480, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(W / 2, H * 0.32, 80, W / 2, H * 0.42, H);
  bg.addColorStop(0, '#3a2490'); bg.addColorStop(0.6, '#130c3a'); bg.addColorStop(1, '#070716');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(235,232,255,${0.15 + rnd() * 0.6})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 2.2 + 0.4, 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(226,194,125,.5)'; g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
  await drawBrand(g, W, 100);
  g.fillStyle = '#d9cdf7'; g.font = '300 28px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(cards.length > 1 ? 'Tarot · Ba lá của mình' : 'Tarot · Lá bài hôm nay của mình', W / 2, 168);
  const arts = await Promise.all(cards.map((card, i) => svgImage(cardArtSvg(card, `s${i}`), 520, 728)));
  if (cards.length === 1) drawTarotCard(g, cards[0], arts[0], 260, 205, 560);
  else cards.forEach((card, i) => {
    const x = 45 + i * 345; drawTarotCard(g, card, arts[i], x, 375, 300);
    g.textAlign = 'center'; g.fillStyle = '#e2c27d'; g.font = '400 24px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText((positions?.[i] ?? '').toUpperCase(), x + 150, 345);
    g.fillStyle = '#ece7fb'; g.font = '300 25px "Be Vietnam Pro", system-ui, sans-serif'; card.keys.forEach((k, j) => g.fillText(k, x + 150, 937 + j * 40));
  });
  drawFooter(g, W, H, url, 'Quét mã để rút bài cùng My');
  return new Promise((r) => c.toBlob(r, 'image/png'));
}
export async function shareTarot(info, mode = 'share') { return deliver(await makeTarotCard(info), 'tarot-huyen-my.png', { mode, url: info.url, text: 'Mình vừa rút một lá Tarot cùng Huyền My, bạn thử xem sao' }); }
