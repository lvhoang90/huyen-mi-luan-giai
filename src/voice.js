// Nói vào ô trò chuyện: dùng nhận dạng giọng nói có sẵn của trình duyệt, đổi lời nói thành chữ ngay trong ô nhập.
// Không có gì được gửi cho My cho tới khi người dùng đọc lại và bấm Gửi. Máy chủ không nhận âm thanh, chỉ nhận chữ như tin gõ.
// Trình duyệt không hỗ trợ thì không hiện nút micro.
const Rec = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const voiceSupported = () => !!Rec();
export const VOICE_ERRORS = {
  'not-allowed': 'Trình duyệt chưa cho phép dùng micro. Bạn bật quyền micro cho trang này rồi thử lại nhé.',
  'service-not-allowed': 'Trình duyệt này chưa hỗ trợ nói vào. Bạn mở bằng Safari hoặc Chrome, hoặc gõ giúp My nhé.',
  'no-speech': 'My chưa nghe thấy gì. Bạn thử nói lại, gần micro hơn một chút nhé.',
  'audio-capture': 'Không tìm thấy micro trên thiết bị này.',
  network: 'Máy chưa nhận dạng được giọng nói lúc này. Bạn gõ giúp My nhé.',
};
/** Nối nút micro vào ô nhập. Trả về { stop, active } hoặc null nếu không hỗ trợ. */
export function attachVoice(ta, btn, { status, lang = 'vi-VN', onChange = () => {}, onEvent = () => {} } = {}) {
  const R = Rec(); if (!R) return null;
  let rec = null, base = '', on = false;
  const say = (t) => { if (status) { status.textContent = t || ''; status.hidden = !t; } };
  const setOn = (v) => { on = v; btn.classList.toggle('on', v); btn.setAttribute('aria-pressed', String(v)); btn.setAttribute('aria-label', v ? 'Dừng nói' : 'Nói với My'); btn.title = v ? 'Chạm để dừng' : 'Nói với My, My sẽ đổi thành chữ cho bạn xem trước khi gửi'; };
  const stop = () => { try { rec?.stop(); } catch {} };
  const start = () => {
    rec = new R(); rec.lang = lang; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    base = ta.value.trim() ? ta.value.replace(/\s+$/, '') + ' ' : '';
    rec.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; ta.value = (base + t).slice(0, ta.maxLength > 0 ? ta.maxLength : 2000); onChange(); };
    rec.onerror = (e) => { onEvent('voice_error', { e: String(e.error ?? 'unknown').slice(0, 24) }); if (e.error !== 'aborted') say(VOICE_ERRORS[e.error] ?? 'Chưa nghe được, bạn thử lại hoặc gõ giúp My nhé.'); };
    rec.onend = () => { setOn(false); if (status && status.textContent.startsWith('Đang nghe')) say(ta.value.trim() ? 'Bạn đọc lại, sửa nếu cần rồi bấm Gửi nhé.' : ''); ta.focus?.(); };
    try {
      rec.start(); setOn(true); onEvent('voice_start', {});
      let first = false; try { first = !localStorage.getItem('huyenmy.voicenote'); localStorage.setItem('huyenmy.voicenote', '1'); } catch {}
      say(first ? 'Đang nghe, bạn cứ nói. Giọng nói do trình duyệt của bạn xử lý, My chỉ nhận phần chữ bạn gửi. Chạm micro để dừng.' : 'Đang nghe, bạn cứ nói. Chạm micro để dừng.');
    } catch { setOn(false); say(VOICE_ERRORS['service-not-allowed']); }
  };
  btn.onclick = () => (on ? stop() : start());
  return { stop, get active() { return on; } };
}
