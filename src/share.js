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
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

/** Chia sẻ qua hộp thoại của thiết bị nếu có, không thì tải ảnh về. Trả về 'shared' | 'saved' | 'cancelled'. */
export async function shareCard(info) {
  const blob = await makeCard(info), file = new File([blob], 'huyen-my.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Huyền My Luận Giải', text: 'Mình vừa được Huyền My soi lá số, bạn thử xem sao', url: info.url }); return 'shared'; }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'huyen-my.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'saved';
}
