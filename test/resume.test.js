import test from 'node:test';
import assert from 'node:assert/strict';
import { endedWithFarewell, clarifyResume, SHORT_ACK } from '../src/resume.js';

const hist = [{ role: 'user', content: 'Mình đi ngủ đây' }, { role: 'assistant', content: 'Ừ, vậy mình dừng ở đây nhé. Chúc bạn ngủ ngon, và hẹn nghe ba điều bạn ghi được.' }];

test('nhận ra lúc buổi trước kết thúc bằng lời tạm biệt', () => {
  assert.equal(endedWithFarewell(hist), true);
  assert.equal(endedWithFarewell([{ role: 'assistant', content: 'Bạn thấy điều gì chạm bạn nhất?' }]), false);
  assert.equal(endedWithFarewell([]), false); assert.equal(endedWithFarewell(null), false);
});

test('tin ngắn đầu tiên sau lời chào quay lại được nói rõ là muốn bắt đầu lại, chữ người dùng không bị đổi', () => {
  const msgs = [...hist, { role: 'user', content: 'ok' }];
  const out = clarifyResume(msgs, { at: hist.length });
  assert.match(out.at(-1).content, /^ok \(mình vừa quay lại và muốn nói chuyện tiếp/);
  assert.equal(msgs.at(-1).content, 'ok', 'bản gốc giữ nguyên để hiển thị và lưu');
  for (const w of ['Ok', 'ừ', 'Vâng.', 'được', 'ok nhé!']) assert.match(SHORT_ACK.source + w, /./) && assert.ok(SHORT_ACK.test(w), w);
});

test('không đổi gì khi tin dài, hay không phải tin đầu tiên sau lời chào', () => {
  const long = [...hist, { role: 'user', content: 'Mình muốn kể tiếp chuyện công việc' }];
  assert.equal(clarifyResume(long, { at: hist.length }), long);
  const later = [...hist, { role: 'user', content: 'ok' }, { role: 'assistant', content: 'Bạn kể đi' }, { role: 'user', content: 'ok' }];
  assert.equal(clarifyResume(later, { at: hist.length }), later);
  assert.equal(clarifyResume([...hist, { role: 'user', content: 'ok' }], null).at(-1).content, 'ok');
  assert.equal(SHORT_ACK.test('ok mình kể nhé'), false);
});
