// Âm thanh tổng hợp bằng WebAudio (không cần tệp âm thanh): tiếng chuông ngân khẽ, tiếng thở nhẹ và nhạc nền (music.js).
// Mặc định TẮT. Trình duyệt chỉ cho phát sau khi người dùng chạm, nên âm thanh chỉ vang lên khi đã bật và đã chạm.
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
import { createMusic } from './music.js';
const KEY = 'huyenmy.sound';
let on = false; try { on = localStorage.getItem(KEY) === 'on'; } catch {}
let ctx = null;
const ensure = () => {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};
const music = createMusic(() => ctx);
document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else if (on) ctx.resume().catch(() => {}); });
const ready = () => { const a = ensure(); return a && a.state === 'running' ? a : null; };

function note(a, freq, at, dur, vol) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.value = freq; o.detune.value = (Math.random() - 0.5) * 6;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(a.destination); o.start(at); o.stop(at + dur + 0.05);
}
export const sound = {
  get on() { return on; },
  /** Gọi trong một cú chạm của người dùng để mở khóa âm thanh. */
  unlock() { ensure(); if (on && !music.playing) music.start(); },
  set(v) { on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {} if (on) { ensure(); music.start(); setTimeout(() => this.chime(), 60); } else music.stop(); },
  /** Tiếng chuông ngân khi quả cầu sáng lên. */
  chime() {
    if (!on) return; const a = ready(); if (!a) return; const t = a.currentTime + 0.02;
    [[659.25, 0, 2.6, 0.05], [987.77, 0.14, 2.4, 0.04], [1318.5, 0.3, 2.2, 0.03], [1975.5, 0.46, 2, 0.015], [220, 0, 3, 0.03]].forEach(([f, d, dur, v]) => note(a, f, t + d, dur, v));
  },
  /** Một nốt ngắn khi chạm. */
  tap() { if (!on) return; const a = ready(); if (!a) return; const t = a.currentTime + 0.01; note(a, 1174.7, t, 0.9, 0.04); note(a, 1760, t + 0.07, 0.8, 0.02); },
  /** Tiếng thở nhẹ khi mắt mở. */
  breath() {
    if (!on) return; const a = ready(); if (!a) return;
    const len = a.sampleRate * 1.8, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.7;
    const g = a.createGain(), t = a.currentTime + 0.02;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + 1.8);
  },
};
