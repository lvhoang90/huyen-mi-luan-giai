import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { qrMatrix } from '../src/qr.js';
import { dress, lookFor } from '../src/tarot/looks.js';
import { CARDS } from '../src/tarot/cards.js';

test('mã QR: kích thước theo phiên bản, ba hình định vị, chuỗi quá dài thì báo lỗi', () => {
  const m = qrMatrix('https://huyenmy.isavietnam.app/?ref=eda1a088');
  assert.equal(m.length, 33); assert.ok(m.every((r) => r.length === 33));
  for (const [r, c] of [[0, 0], [0, 26], [26, 0]]) { assert.equal(m[r][c], 1); assert.equal(m[r + 3][c + 3], 1); assert.equal(m[r + 1][c + 1], 0); }
  assert.deepEqual(qrMatrix('a').length, 21);
  assert.deepEqual(qrMatrix('https://huyenmy.isavietnam.app/?ref=eda1a088'), m, 'cùng nội dung thì cùng mã');
  assert.throws(() => qrMatrix('x'.repeat(200)));
});

// kiểm tra cân thẻ <g> (tính cả thẻ tự đóng) vì ảnh SVG được nạp vào canvas theo XML chặt, khác với SVG chèn thẳng vào trang HTML
const isBalanced = (svg) => { let d = 0; for (const m of svg.matchAll(/<g\b[^>]*?(\/?)>|<\/g>/g)) { if (m[0] === '</g>') d--; else if (!m[1]) d++; if (d < 0) return false; } return d === 0; };

test('trang phục Tarot: mọi lá có kiểu hợp lệ, bỏ nón thì không còn nón, gradient không trùng giữa các lá', () => {
  const rig = fs.readFileSync(new URL('../src/assets/huyenmy-rig.svg', import.meta.url), 'utf8');
  assert.ok(rig.includes('<g id="hat"'));
  let off = 0;
  for (const c of CARDS) {
    const look = lookFor(c); assert.ok(look && typeof look === 'object', `lá ${c.id}`);
    const s = dress(rig, look, `t${c.id}`);
    assert.ok(s.startsWith('<svg') && s.endsWith('</svg>\n') || s.trimEnd().endsWith('</svg>'));
    if (look.hat === false) { off++; assert.ok(!s.includes('<g id="hat"'), `lá ${c.id} còn nón`); } else assert.ok(s.includes('<g id="hat"'));
    assert.equal(isBalanced(s), true, `lá ${c.id}: SVG phải cân thẻ <g> để tải ảnh được (ảnh SVG đòi XML chặt)`);
    assert.ok(s.includes(`id="adg-t${c.id}"`) && !/id="adg"/.test(s), 'gradient có hậu tố riêng');
  }
  assert.ok(off >= 50 && off < CARDS.length, 'đa số lá bỏ nón nhưng vẫn giữ nón ở một số lá');
  assert.ok(dress(rig, { outfit: 'red' }, 'a').includes('#d8344a') && !dress(rig, { outfit: 'red' }, 'a').includes('#8b5fe0'));
});
