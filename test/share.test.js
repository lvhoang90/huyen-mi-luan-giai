import test from 'node:test';
import assert from 'node:assert/strict';
import { uniqueName, shareMessage, shareState } from '../src/share.js';

test('tên tệp tải về có mã ngẫu nhiên 3 ký tự trước phần mở rộng, không trùng giữa các lần', () => {
  const names = new Set(Array.from({ length: 40 }, () => uniqueName('tarot-huyen-my.png')));
  for (const n of names) assert.match(n, /^tarot-huyen-my-[a-hj-km-np-z2-9]{3}\.png$/, n);
  assert.ok(names.size > 30, 'phần lớn các lần đều ra tên khác nhau');
  assert.match(uniqueName('khong-duoi'), /^khong-duoi-[a-hj-km-np-z2-9]{3}$/);
  assert.match(uniqueName('a.b.png'), /^a\.b-[a-hj-km-np-z2-9]{3}\.png$/);
});

test('lời báo sau khi chia sẻ nói đúng điều đã xảy ra', () => {
  Object.assign(shareState, { copied: true, mode: 'share' });
  assert.match(shareMessage('shared'), /sao chép sẵn/);
  assert.match(shareMessage('saved'), /tải ảnh về/); assert.match(shareMessage('saved'), /sao chép sẵn/);
  assert.match(shareMessage('cancelled'), /vẫn được sao chép sẵn/);
  Object.assign(shareState, { copied: false, mode: 'share' });
  assert.equal(shareMessage('shared'), 'Đã mở chia sẻ.');
  assert.doesNotMatch(shareMessage('saved'), /sao chép/);
  assert.equal(shareMessage('cancelled'), '');
  Object.assign(shareState, { copied: false, mode: 'download' });
  assert.match(shareMessage('saved'), /Đã tải ảnh về máy bạn/);
});
