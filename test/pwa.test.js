import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url));
const png = (f) => { const b = read(f); assert.equal(b.subarray(1, 4).toString(), 'PNG', f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('manifest hợp lệ và các biểu tượng tồn tại đúng kích thước', () => {
  const m = JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(m.display, 'standalone'); assert.equal(m.lang, 'vi'); assert.ok(m.name && m.short_name && m.start_url && m.scope);
  for (const sz of ['192x192', '512x512']) assert.ok(m.icons.some((i) => i.sizes === sz && i.purpose === 'any'), `thiếu biểu tượng ${sz}`);
  assert.ok(m.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'), 'thiếu biểu tượng maskable 512');
  for (const i of m.icons) { const [w, h] = png(`public${i.src}`); assert.equal(`${w}x${h}`, i.sizes, i.src); }
  assert.deepEqual(png('public/icons/apple-touch-icon.png'), [180, 180]);
  for (const s of m.shortcuts) assert.ok(s.url.startsWith('/') && s.name);
});

test('service worker đọc được và không đụng tới /api', () => {
  const src = read('public/sw.js').toString();
  new vm.Script(src); // cú pháp đúng
  assert.match(src, /url\.pathname\.startsWith\('\/api\/'\)/, 'phải bỏ qua /api');
  assert.match(src, /offline\.html/);
  assert.ok(fs.existsSync(new URL('../public/offline.html', import.meta.url)));
});

test('các trang chính khai báo manifest và biểu tượng', () => {
  for (const f of ['index.html', 'tarot.html', 'kham-pha.html', 'goc-cua-toi.html']) {
    const h = read(f).toString();
    assert.match(h, /rel="manifest" href="\/manifest\.webmanifest"/, f);
    assert.match(h, /rel="apple-touch-icon"/, f);
  }
});
