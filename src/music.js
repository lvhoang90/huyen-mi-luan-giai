// Nhạc nền tự sáng tác, tạo ngay trong trình duyệt bằng WebAudio (không dùng bản ghi có sẵn, nên không dính bản quyền bài hát nào).
// Thang năm âm Á Đông (Rê, Mi, Fa#, La, Si): tiếng gảy dịu như đàn tranh, tiếng sáo trúc thoảng, nền ngân dài như tiếng thở.
// Tiết tấu rất chậm, có quãng nghỉ, không lặp đoạn nhạc cố định nên nghe nhiều lần vẫn không mỏi.
// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const SCALE = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74, 76, 78, 81].map(hz); // Rê3 .. La5, năm âm
const BASS = [38, 45, 43, 47].map(hz); // Rê2, La2, Sol2, Si2: các nền ngân luân phiên
const rnd = (a, b) => a + Math.random() * (b - a);

export function createMusic(getCtx) {
  let on = false, nodes = null, timer = 0, next = 0, idx = 7, bassAt = 0, bassI = 0, fluteAt = 0, vol = 0.5;

  function build(a) {
    const master = a.createGain(); master.gain.value = 0.0001;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3;
    const dry = a.createGain(); dry.gain.value = 0.6;
    const wet = a.createGain(); wet.gain.value = 0.55;
    const conv = a.createConvolver();
    const len = a.sampleRate * 3.4, ir = a.createBuffer(2, len, a.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
    conv.buffer = ir;
    const bus = a.createGain();
    bus.connect(dry).connect(comp); bus.connect(conv).connect(wet).connect(comp); comp.connect(master).connect(a.destination);
    return { master, bus };
  }
  /** Tiếng gảy như đàn tranh: vào nhanh, tắt dần, đầu nốt hơi "nhấn" từ thấp lên. */
  function pluck(a, bus, f, t, vel = 1) {
    const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.setValueAtTime(f * 0.985, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07); o2.frequency.value = f * 2.003;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 1.6);
    const g2 = a.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11 * vel, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(bus);
    o.start(t); o2.start(t); o.stop(t + 3.3); o2.stop(t + 3.3);
  }
  /** Tiếng sáo thoảng: nốt dài, rung nhẹ, kèm hơi thở. */
  function flute(a, bus, f, t, dur) {
    const o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 4.6; lg.gain.value = f * 0.004; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.5); g.gain.setValueAtTime(0.05, t + dur - 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const nlen = a.sampleRate * 1, nb = a.createBuffer(1, nlen, a.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
    const ns = a.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 4;
    const ng = a.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.012, t + 0.4); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); ns.connect(bp).connect(ng).connect(bus);
    o.start(t); lfo.start(t); ns.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1); ns.stop(t + dur + 0.1);
  }
  /** Nền ngân dài: hai nốt cách quãng năm, nở ra rồi tan đi như hơi thở. */
  function pad(a, bus, f, t, dur) {
    for (const [m, v] of [[1, 0.05], [1.5, 0.028]]) {
      const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f * m; o.detune.value = rnd(-5, 5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.1);
    }
  }

  function tick() {
    const a = getCtx(); if (!a || !nodes || a.state !== 'running') return;
    const now = a.currentTime, { bus } = nodes;
    if (bassAt < now + 1) { pad(a, bus, BASS[bassI++ % BASS.length], Math.max(bassAt, now), 15); bassAt = Math.max(bassAt, now) + 12; }
    if (fluteAt < now + 1) {
      const t = Math.max(fluteAt, now + 0.2); let j = Math.min(SCALE.length - 1, Math.max(4, idx + Math.round(rnd(-1, 3))));
      const k = Math.random() < 0.5 ? 2 : 3;
      for (let n = 0, tt = t; n < k; n++) { const d = rnd(2.4, 4); flute(a, bus, SCALE[j] * (j < 7 ? 2 : 1), tt, d); tt += d - 0.3; j = Math.min(SCALE.length - 1, Math.max(0, j + Math.round(rnd(-2, 2)))); }
      fluteAt = t + rnd(22, 34);
    }
    while (next < now + 1.2) {
      const t = Math.max(next, now + 0.05), r = Math.random();
      if (r < 0.14) { next = t + rnd(2, 4.2); continue; } // quãng nghỉ
      if (r < 0.3) { // rải ba nốt đi lên như lướt phím đàn
        let j = idx; for (let n = 0; n < 3; n++) { pluck(a, bus, SCALE[Math.min(j, SCALE.length - 1)], t + n * 0.23, 0.8 + n * 0.1); j += Math.random() < 0.7 ? 1 : 2; }
        idx = Math.max(2, Math.min(SCALE.length - 1, j - 3 + Math.round(rnd(-1, 1)))); next = t + 0.7 + rnd(1.6, 2.6); continue;
      }
      idx = Math.max(1, Math.min(SCALE.length - 1, idx + Math.round(rnd(-2, 2)) || 1));
      pluck(a, bus, SCALE[idx], t, rnd(0.7, 1)); next = t + [0.9, 1.4, 1.9, 2.6][Math.floor(Math.random() * 4)];
    }
  }
  const apply = () => { const a = getCtx(); if (a && nodes) { nodes.master.gain.cancelScheduledValues(a.currentTime); nodes.master.gain.setTargetAtTime(on ? Math.max(0.0001, vol) : 0.0001, a.currentTime, on ? 1.6 : 0.7); } };

  return {
    get playing() { return on; },
    /** Bắt đầu (cần ngữ cảnh âm thanh đã được người dùng mở bằng một cú chạm). */
    start() {
      on = true; const a = getCtx(); if (!a) return;
      const go = () => { if (!on) return; if (!nodes) { nodes = build(a); next = bassAt = fluteAt = a.currentTime + 1.2; fluteAt += 6; } if (!timer) timer = setInterval(tick, 300); tick(); apply(); };
      a.state === 'running' ? go() : a.resume().then(go, () => {});
    },
    stop() {
      on = false; apply();
      clearInterval(timer); timer = 0;
      const a = getCtx(), old = nodes; nodes = null;
      if (a && old) setTimeout(() => { try { old.master.disconnect(); } catch {} }, 4500);
    },
    setVolume(v) { vol = v; apply(); },
  };
}
