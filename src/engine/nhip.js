// Nhịp sinh học: hai phần có mức tin cậy rất khác nhau, luôn nói rõ điều đó.
//
// 1) Nhịp thức-ngủ (nhịp sinh học ngày đêm, circadian): mô hình toán đã công bố, đây là phần có cơ sở khoa học.
//    Dùng mô hình ba biến của Forger, Jewett và Kronauer (1999, "A simpler model of the human circadian pacemaker"),
//    chạy với lịch ánh sáng đơn giản: tỉnh = ánh sáng trong nhà 250 lux, ngủ = 0 lux. Kết quả là ước tính TRUNG BÌNH QUẦN THỂ
//    cho giờ cực tiểu thân nhiệt lõi (CBTmin) và giờ melatonin bắt đầu tăng (DLMO = CBTmin trừ 7 giờ), không phải đo cá nhân,
//    không thay lời bác sĩ. Người đi ca, bay xuyên múi giờ hoặc ngủ rất thất thường sẽ lệch nhiều.
// 2) Biorhythm 23/28/33 ngày (thể chất, cảm xúc, trí tuệ): đường sin tính từ ngày sinh. Các nghiên cứu kiểm định không tìm thấy
//    khả năng dự đoán; nó chỉ là một cách ghi nhận vui để tự quan sát. Phần này luôn kèm nhãn "chưa được nghiên cứu xác nhận".
const TAU = Math.PI * 2;
const pad = (n) => String(n).padStart(2, '0');
export const fmtHour = (h) => { const m = Math.round((((h % 24) + 24) % 24) * 60) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };

// ---------- 1) Nhịp thức-ngủ ----------
const F99 = { taux: 24.2, mu: 0.23, G: 33.75, alpha0: 0.05, beta: 0.0075, p: 0.5, I0: 9500, k: 0.55 };
const IC = [-0.0843259, -1.09607546, 0.45584306]; // điều kiện lúc nửa đêm của lịch 16 giờ sáng, 8 giờ tối
const deriv = (s, light) => {
  const [x, xc, n] = s, a = F99.alpha0 * Math.pow(light / F99.I0, F99.p);
  const Bhat = F99.G * (1 - n) * a * (1 - 0.4 * x) * (1 - 0.4 * xc);
  const mu = F99.mu * (xc - (4 / 3) * xc ** 3), tx = (24 / (0.99669 * F99.taux)) ** 2 + F99.k * Bhat;
  return [Math.PI / 12 * (xc + Bhat), Math.PI / 12 * (mu - x * tx), 60 * (a * (1 - n) - F99.beta * n)];
};
const rk4 = (s, light, dt) => {
  const add = (a, b, c) => a.map((v, i) => v + b[i] * c);
  const k1 = deriv(s, light), k2 = deriv(add(s, k1, dt / 2), light), k3 = deriv(add(s, k2, dt / 2), light), k4 = deriv(add(s, k3, dt), light);
  return s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
};
/** Giờ (0-24) hiện đang thức theo lịch dậy/ngủ đều đặn hằng ngày. */
const awakeAt = (h, wake, bed) => { const t = ((h % 24) + 24) % 24; return wake < bed ? t >= wake && t < bed : t >= wake || t < bed; };

/** Ước tính giờ CBTmin và DLMO (giờ trong ngày, 0-24) cho lịch thức dậy `wake` và đi ngủ `bed` (giờ thập phân). */
export function circadian(wake, bed, { lux = 250, days = 30, dt = 0.05 } = {}) {
  if (![wake, bed].every((v) => Number.isFinite(v) && v >= 0 && v < 24) || wake === bed) return null;
  let s = IC.slice(), t = 0, best = null;
  const steps = Math.round(24 / dt);
  for (let d = 0; d < days; d++) {
    let minX = Infinity, minT = 0;
    for (let i = 0; i < steps; i++) {
      s = rk4(s, awakeAt(t, wake, bed) ? lux : 0, dt); t += dt;
      if (d === days - 1 && s[0] < minX) { minX = s[0]; minT = t; }
    }
    if (d === days - 1) best = minT;
  }
  const cbt = ((best % 24) + 24) % 24, dlmo = (((cbt - 7) % 24) + 24) % 24;
  const sleepNat = (dlmo + 2.5) % 24; // giấc ngủ thường dễ vào khoảng 2 đến 3 giờ sau DLMO
  const off = ((bed - sleepNat + 36) % 24) - 12; // lệch của giờ ngủ hiện tại so với "cửa sổ ngủ thuận", giờ; dương = ngủ muộn hơn
  const wakeAfterCbt = ((wake - cbt + 36) % 24) - 12;
  return { cbt, dlmo, sleepNat, off, wakeAfterCbt, wake, bed };
}

/** Tìm giờ dậy và giờ ngủ người dùng đã tự nói trong các tin nhắn (mới nhất thắng). Trả null nếu thiếu giờ dậy. */
export function parseSleepTimes(texts) {
  const num = '(\\d{1,2})\\s*(?:h|giờ|:)\\s*(\\d{1,2})?';
  const reWake = new RegExp(`(?:thức dậy|thức giấc|dậy|thức)\\s*(?:dậy\\s*)?(?:thường\\s*)?(?:lúc|vào|khoảng|tầm|là)?\\s*${num}`, 'i');
  const reBed = new RegExp(`(?:đi ngủ|đi nằm|lên giường|ngủ|đắp chăn)\\s*(?:thường\\s*)?(?:lúc|vào|khoảng|tầm|là)?\\s*${num}`, 'i');
  const pick = (re, list) => { for (const x of list) { const m = re.exec(x); if (m) { const h = +m[1], mi = m[2] ? +m[2] : 0; if (h < 24 && mi < 60) return { h: h + mi / 60, txt: x }; } } return null; };
  const list = [...(texts ?? [])].reverse().map(String);
  const w = pick(reWake, list), b = pick(reBed, list);
  if (!w) return null;
  let bed = b?.h; let assumed = false;
  if (b && /(?:pm|tối|đêm|khuya)/i.test(b.txt) && bed < 12) bed += 12;
  if (bed === undefined) { bed = (w.h - 8 + 24) % 24; assumed = true; }
  return { wake: w.h, bed: bed % 24, bedAssumed: assumed };
}

// ---------- 2) Biorhythm 23/28/33 ----------
export const BIO_CYCLES = [['thể chất', 23], ['cảm xúc', 28], ['trí tuệ', 33]];
const dayNo = (d) => Math.floor(Date.UTC(d.y, d.m - 1, d.d) / 86400000);
/** Giá trị -100 đến 100 của ba chu kỳ tại ngày `date`, tính từ ngày sinh dương lịch. */
export function biorhythm(birth, date) {
  const t = dayNo(date) - dayNo(birth);
  return BIO_CYCLES.map(([name, P]) => {
    const ph = TAU * (((t % P) + P) % P) / P, v = Math.round(Math.sin(ph) * 100);
    const trend = Math.abs(v) < 12 ? 'sát điểm 0 (ngày chuyển pha)' : Math.cos(ph) > 0 ? 'nửa lên' : 'nửa xuống';
    return { name, period: P, value: v, trend, day: ((t % P) + P) % P };
  });
}
export const BIO_NOTE = 'Biorhythm 23/28/33 ngày là lý thuyết cũ, chưa được nghiên cứu xác nhận là dự đoán được trạng thái; chỉ nên coi là cách ghi nhận để tự quan sát, không dùng để quyết định việc gì.';
export const bioLine = (birth, date) => 'biorhythm (chưa được nghiên cứu xác nhận): ' + biorhythm(birth, date).map((c) => `${c.name} ${c.value >= 0 ? '+' : ''}${c.value}% (${c.trend})`).join(', ');

const vnToday = (now) => { const t = new Date(now.getTime() + 7 * 3600_000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const TRIGGER = /nhịp sinh học|biorhythm|đồng hồ sinh học|chu kỳ (thể chất|cảm xúc|trí tuệ)|năng lượng|mệt|kiệt sức|uể oải|buồn ngủ|mất ngủ|khó ngủ|thức khuya|giờ ngủ|ngủ|tỉnh táo|thức dậy|dậy (sớm|muộn)|lệch múi giờ|jet ?lag|làm ca/i;

/**
 * Khối "nhịp sinh học" cho lượt này: chỉ có khi người dùng nhắc đến giấc ngủ, năng lượng, nhịp sinh học.
 * Giờ dậy và giờ ngủ lấy từ chính lời người dùng trong vài tin gần nhất; chưa có thì dặn My hỏi, không bịa mốc giờ.
 */
export function describeNhipExtra(profile, userTexts, now = new Date()) {
  const texts = (userTexts ?? []).slice(-8), last = String(texts.at(-1) ?? '');
  if (!TRIGGER.test(last) || !profile?.birth) return '';
  const L = ['NHỊP SINH HỌC (đã tính, theo điều người dùng vừa nhắc; nếu lượt này có lệnh "NGƯỜI DÙNG ĐANG NẶNG LÒNG" thì bỏ qua cả khối này, chỉ vỗ về):'];
  const st = parseSleepTimes(texts);
  if (st) {
    const c = circadian(st.wake, st.bed);
    if (c) {
      L.push(`- Nhịp thức-ngủ (mô hình toán đã công bố, ước tính trung bình quần thể, không phải đo cá nhân): giờ dậy ${fmtHour(st.wake)}, giờ ngủ ${fmtHour(st.bed)}${st.bedAssumed ? ' (người dùng chưa nói giờ ngủ, tạm giả định ngủ 8 giờ)' : ''}.`);
      L.push(`  Thân nhiệt lõi thấp nhất (CBTmin) khoảng ${fmtHour(c.cbt)}, tức ${Math.abs(c.wakeAfterCbt).toFixed(1)} giờ ${c.wakeAfterCbt >= 0 ? 'trước' : 'sau'} giờ dậy; melatonin bắt đầu tăng (DLMO) khoảng ${fmtHour(c.dlmo)}.`);
      L.push('  Ý dùng được: ánh sáng ngoài trời buổi sáng sau khi dậy giúp nhịp đều; giảm ánh sáng mạnh và màn hình sáng khoảng 1-2 giờ trước giờ ngủ; quanh CBTmin là lúc cơ thể "trũng" nhất nên tránh việc cần tỉnh táo cao.');
    }
  } else L.push('- Chưa biết giờ thức dậy và giờ đi ngủ thường ngày của người dùng. Nếu câu chuyện đang về giấc ngủ hay năng lượng, hỏi một câu nhẹ để họ cho biết hai giờ này; chưa nói mốc giờ cụ thể.');
  L.push(`- ${bioLine(profile.birth, vnToday(now))}.`);
  L.push(`- Giới hạn: ${BIO_NOTE} Nhịp thức-ngủ chỉ là ước tính chung, người đi ca, bay xuyên múi giờ hoặc ngủ thất thường sẽ lệch nhiều. Không chẩn đoán; mất ngủ kéo dài hay mệt mỏi bất thường thì nên gặp nhân viên y tế. Nói như gợi ý nhẹ nhàng, không hù dọa.`);
  return L.join('\n');
}
