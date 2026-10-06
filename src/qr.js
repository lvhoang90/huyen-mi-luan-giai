// Bộ tạo mã QR tự viết (chế độ byte, mức sửa lỗi M, phiên bản 1 đến 6, tối đa 106 ký tự). Dùng để gắn liên kết giới thiệu vào ảnh chia sẻ.
const EC = [null, [16, 10, 1], [28, 16, 1], [44, 26, 1], [64, 18, 2], [86, 24, 2], [108, 16, 4]]; // [số byte dữ liệu, byte sửa lỗi mỗi khối, số khối]
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
function rsEncode(data, n) {
  let g = [1]; for (let i = 0; i < n; i++) { const next = new Array(g.length + 1).fill(0); g.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, EXP[i]); }); g = next; }
  const res = new Array(n).fill(0);
  for (const b of data) { const f = b ^ res[0]; res.shift(); res.push(0); if (f) for (let j = 0; j < n; j++) res[j] ^= mul(g[j + 1], f); }
  return res;
}
const bchFormat = (d) => { let v = d << 10; for (let i = 14; i >= 10; i--) if ((v >> i) & 1) v ^= 0x537 << (i - 10); return ((d << 10) | v) ^ 0x5412; };

/** Trả về ma trận (mảng các hàng 0/1) của mã QR cho chuỗi `text` (UTF-8). */
export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let ver = 1; while (ver <= 6 && bytes.length > EC[ver][0] - 2) ver++;
  if (ver > 6) throw new Error('Liên kết quá dài cho mã QR');
  const [total, ecLen, blocks] = EC[ver], size = 17 + 4 * ver;
  // dòng bit: 0100 + độ dài 8 bit + dữ liệu + kết thúc + đệm
  const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8)); put(0, Math.min(4, total * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0; cw.length < total; pad++) cw.push(pad % 2 ? 0x11 : 0xec);
  const per = total / blocks, dataBlocks = [], ecBlocks = [];
  for (let b = 0; b < blocks; b++) { const d = cw.slice(b * per, (b + 1) * per); dataBlocks.push(d); ecBlocks.push(rsEncode(d, ecLen)); }
  const out = []; for (let i = 0; i < per; i++) dataBlocks.forEach((d) => out.push(d[i])); for (let i = 0; i < ecLen; i++) ecBlocks.forEach((e) => out.push(e[i]));
  const stream = []; out.forEach((b) => { for (let i = 7; i >= 0; i--) stream.push((b >> i) & 1); }); if (ver > 1) for (let i = 0; i < 7; i++) stream.push(0);

  const M = Array.from({ length: size }, () => new Array(size).fill(0)), fixed = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r, c, v, f = true) => { if (r >= 0 && c >= 0 && r < size && c < size) { M[r][c] = v; if (f) fixed[r][c] = true; } };
  const finder = (r0, c0) => { for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) { const on = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)); set(r0 + r, c0 + c, on ? 1 : 0); } };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 ? 0 : 1); set(i, 6, i % 2 ? 0 : 1); }
  for (const r of ALIGN[ver]) for (const c of ALIGN[ver]) { if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0); }
  set(size - 8, 8, 1); // ô tối cố định
  for (let i = 0; i < 9; i++) { fixed[8][i] = fixed[i][8] = true; } for (let i = 0; i < 8; i++) { fixed[8][size - 1 - i] = true; fixed[size - 1 - i][8] = true; }
  const placed = (mask) => {
    const R = M.map((r) => r.slice()); let i = 0, up = true;
    for (let c = size - 1; c > 0; c -= 2) { if (c === 6) c--; for (let k = 0; k < size; k++) { const r = up ? size - 1 - k : k; for (const cc of [c, c - 1]) { if (fixed[r][cc]) continue; let v = stream[i++] ?? 0; if (maskFn[mask](r, cc)) v ^= 1; R[r][cc] = v; } } up = !up; }
    const fmt = bchFormat((0 << 3) | mask); // mức M = 00
    const bit = (n) => (fmt >> n) & 1;
    for (let n = 0; n < 15; n++) {
      const v = bit(n);
      if (n < 6) R[n][8] = v; else if (n < 8) R[n + 1][8] = v; else R[size - 15 + n][8] = v;
      if (n < 8) R[8][size - 1 - n] = v; else if (n < 9) R[8][15 - n] = v; else R[8][14 - n] = v;
    }
    return R;
  };
  const maskFn = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0, (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0, (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
  const penalty = (R) => {
    let p = 0;
    for (let a = 0; a < size; a++) for (const get of [(i) => R[a][i], (i) => R[i][a]]) {
      let run = 1; for (let i = 1; i < size; i++) { if (get(i) === get(i - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
    }
    for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (R[r][c] === R[r][c + 1] && R[r][c] === R[r + 1][c] && R[r][c] === R[r + 1][c + 1]) p += 3;
    const pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], rev = [...pat].reverse();
    for (let a = 0; a < size; a++) for (let i = 0; i <= size - 11; i++) for (const q of [pat, rev]) { if (q.every((v, k) => R[a][i + k] === v)) p += 40; if (q.every((v, k) => R[i + k][a] === v)) p += 40; }
    const dark = R.flat().filter(Boolean).length; p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  };
  let best = null, bp = Infinity; for (let m = 0; m < 8; m++) { const R = placed(m), p = penalty(R); if (p < bp) { bp = p; best = R; } }
  return best;
}

/** Vẽ mã QR (nền trắng, viền yên tĩnh 4 ô) vào canvas 2D tại (x, y) với cạnh `size` px. */
export function drawQr(g, text, x, y, size, { dark = '#120c3a', light = '#ffffff', radius = 18 } = {}) {
  const m = qrMatrix(text), n = m.length, quiet = 4, cell = size / (n + quiet * 2);
  g.fillStyle = light; g.beginPath(); g.roundRect(x, y, size, size, radius); g.fill();
  g.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) g.fillRect(Math.round(x + (c + quiet) * cell), Math.round(y + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
}
