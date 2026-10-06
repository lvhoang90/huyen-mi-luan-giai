// Giữ giọng My giống người thật: phát hiện cụm từ bị lặp giữa các lượt, các khuôn "sáo" của máy, và gợi ý cách nối khác nhau mỗi lượt.
const tidy = (s) => String(s).toLowerCase().normalize('NFC').replace(/\[\[[^\]]*\]\]/g, ' ').replace(/[*_"“”‘’'()]/g, ' ');
export const wordsOf = (s) => tidy(s).match(/[\p{L}\p{N}]+/gu) ?? [];

// Cụm toàn từ phổ thông không đáng bị coi là "lặp".
const STOP = new Set('bạn của là và một những các cái này đó kia không có được để cho với thì mà như khi nên cũng đã đang sẽ rất lại vẫn còn từ ra vào trong trên dưới nhưng nếu hay hoặc vì nên tôi mình my ai gì sao nào đâu thế vậy ạ nhé nhỉ à ơi'.split(' '));
const meaningful = (g) => g.some((w) => !STOP.has(w));
const grams = (w, n) => { const out = new Set(); for (let i = 0; i + n <= w.length; i++) { const g = w.slice(i, i + n); if (meaningful(g) && g.filter((x) => !STOP.has(x)).length >= 2) out.add(g.join(' ')); } return out; };

/** Cụm 3-4 từ xuất hiện trong từ 2 lượt trả lời trở lên của My (xét `last` lượt gần nhất). */
// Cụm bắt buộc phải lặp (lời cảnh báo, tên lăng kính) hoặc là từ của chính người dùng thì không tính là lặp.
const ALLOW = /lăng kính|biểu tượng|theo tứ trụ|theo tử vi|theo truyền thống|không phải lời|tầng tính toán|thần số học|chiêm tinh|lá số của bạn|nhật chủ|trụ ngày|ngũ hành/;
export function repeatedPhrases(prevReplies, { last = 8, limit = 10, ignoreText = '' } = {}) {
  const ignore = ' ' + wordsOf(ignoreText).join(' ') + ' ';
  const docs = prevReplies.slice(-last).map(wordsOf);
  const count = new Map();
  for (const n of [4, 3]) for (const d of docs) for (const g of grams(d, n)) count.set(g, (count.get(g) ?? 0) + 1);
  const rep = [...count].filter(([g, c]) => c >= 2 && !ALLOW.test(g) && !ignore.includes(' ' + g + ' ')).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(([g]) => g);
  const out = [];
  for (const g of rep) if (!out.some((o) => o.includes(g) || g.includes(o))) out.push(g);
  return out.slice(0, limit);
}

/** Các khuôn câu và cụm từ nghe như máy viết sẵn. */
export const STOCK = [
  ['doi_lap', /không (chỉ )?phải\b[^.?!\n]{1,60}\b(mà|mà là|chứ)\b|\bchứ không phải\b|không chỉ\b[^.?!\n]{1,50}\bmà còn\b/i],
  ['hoi_thang', /(my|mình)? ?muốn hỏi thẳng|nói thật lòng|(my|mình) (muốn )?nói thật|nói thẳng với bạn|bằng sự tử tế|dội nước lạnh|tát nước/i],
  ['nghe_roi', /(my|mình) nghe rồi|cảm ơn bạn đã (chia sẻ|kể|tin tưởng|mở lòng)|cảm ơn vì đã (chia sẻ|kể|tin)/i],
  ['sao_rong', /hoàn toàn bình thường|bạn không (hề )?đơn độc|điều đó không (hề )?(nhẹ|dễ)|hãy nhớ rằng|thật (sự )?nặng nề|my hiểu cảm giác/i],
  ['ghep_la_so', /\b(mệnh|kim|mộc|thủy|thổ|hỏa)\b[^.?!\n,]{0,14}\bcho\b[^.?!\n]{0,60},\s*(mệnh|kim|mộc|thủy|thổ|hỏa)\b[^.?!\n,]{0,14}\bcho\b|\bchính là nền (để|cho)\b/i],
  ['vien_dan', /theo (tâm lý học|khoa học)|nghiên cứu (cho thấy|chỉ ra)|khoa học (cho thấy|tâm lý)|tâm lý học (cho|chỉ|nói)|tái khung|tư duy phát triển|ở tầng /i],
  ['an_du_thien_nhien', /như (một )?(cơn gió|dòng nước|làn gió|mặt hồ|ngọn gió|ánh trăng|cơn mưa)/i],
];
export const stockHits = (text) => STOCK.filter(([, re]) => re.test(String(text))).map(([id]) => id);

/** Kho cách nối ý; mỗi lượt gợi ý vài cách khác nhau, My tự nghĩ thêm cũng được. */
export const LINKERS = [
  'À', 'Mà này', 'Thế này nhé', 'Chuyện là', 'Khoan đã', 'Ừ', 'Còn chỗ này nữa', 'Quay lại điều bạn vừa kể', 'Nghe tới đây My chợt nghĩ',
  'Một chuyện nhỏ thôi', 'Hơi lạc đề một chút', 'Thú thật', 'Để My nói cho gọn', 'Hmm', 'Chờ chút, có một chi tiết', 'Nói đi thì cũng phải nói lại',
  'Nghĩ kỹ thì', 'Trộm nghĩ', 'Chỗ này thú vị đấy', 'Bỏ qua lá số một chút', 'Bạn để ý không', 'Ngẫm ra', 'Thật ra', 'À mà', 'Vậy thì', 'Tới đây My muốn dừng ở một chỗ',
  'Điều làm My để ý nhất là', 'Có một hình ảnh hiện ra', 'My thử đoán xem có đúng không', 'Nghe bạn kể My bật cười một chút vì', 'Phần này My thấy xót',
];
const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; };
export function pickLinkers(seed, k = 3) {
  const h = hash(seed), n = LINKERS.length, out = [];
  for (let i = 0; out.length < k && i < n * 2; i++) { const l = LINKERS[(h + i * 7 + out.length * 13) % n]; if (!out.includes(l)) out.push(l); }
  return out;
}
const LENGTHS = ['rất ngắn: 1-2 câu, thật tự nhiên', 'ngắn: 2-3 câu, mỗi câu dưới 15 từ', 'vừa: 3 câu ngắn', 'ngắn, đổi nhịp: một câu rất ngắn rồi một câu vừa', 'ngắn, không kết bằng câu hỏi'];
export const lengthHint = (seed) => LENGTHS[hash('len' + seed) % LENGTHS.length];
