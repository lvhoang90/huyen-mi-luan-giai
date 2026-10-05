// Ước lượng sắc thái cảm xúc của một tin nhắn tiếng Việt bằng từ điển, chạy trên máy chủ và KHÔNG lưu nội dung.
// Chỉ các con số (hiệu giá, cường độ, nhóm cảm xúc, độ mở lòng) được ghi vào bảng turns để phân tích hành trình.
// Đây là công cụ ước lượng thô để nhìn xu hướng theo nhóm, không phải chẩn đoán cá nhân và chưa được kiểm định với dữ liệu gán nhãn thật.

const strip = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');

export const EMO = {
  buon: { label: 'Buồn, thất vọng', val: -1.2 },
  lo_au: { label: 'Lo lắng, áp lực', val: -1.0 },
  gian: { label: 'Bực, giận', val: -1.2 },
  co_don: { label: 'Cô đơn, lạc lõng', val: -1.4 },
  met_moi: { label: 'Mệt mỏi, kiệt sức', val: -0.8 },
  boi_roi: { label: 'Bối rối, phân vân', val: -0.4 },
  trung_tinh: { label: 'Trung tính', val: 0 },
  hy_vong: { label: 'Hy vọng, muốn thử', val: 0.8 },
  nhe_long: { label: 'Nhẹ lòng, bình yên', val: 1.2 },
  vui: { label: 'Vui, hứng khởi', val: 1.5 },
  biet_on: { label: 'Biết ơn, xúc động', val: 1.4 },
};

// Cụm từ viết không dấu để khớp cả khi người dùng gõ không dấu.
const CUES = {
  buon: 'buon|chan nan|that vong|tui than|khoc|nuoc mat|mat mat|dau long|tiec nuoi|trong rong|chan qua|nho nhung|tan vo|tuyet vong|khong con gi|dau kho|ton thuong',
  lo_au: 'lo|lo lang|lo au|lo so|so hai|so qua|hoang so|bat an|cang thang|ap luc|stress|hoi hop|khong biet lam sao|sap vo|soc|run|tim dap nhanh',
  gian: 'gian|tuc|buc minh|buc boi|uc che|kho chiu|ghet|bat cong|phan no|cao gat|dien tiet|cau gat|thu han|chan ghet|cay dang',
  co_don: 'co don|mot minh|co doc|khong ai hieu|chang ai hieu|bi bo roi|lac long|xa cach|khong co ai|chang co ai',
  met_moi: 'met|met moi|kiet suc|kiet que|chan doi|no lung|burnout|het nang luong|mat ngu|khong ngu duoc|ngu khong duoc|kham|tho phi',
  boi_roi: 'boi roi|lung tung|khong biet|phan van|do du|mo ho|ngo ngac|mong lung|chua ro|khong chac|chua hieu|ngan ngam',
  nhe_long: 'nhe long|nhe nhom|thanh than|binh yen|yen tam|thoai mai|thu gian|nhe di|bot nang|bot lo|do hon|nhe tenh|tho phao|thay do|on hon',
  vui: 'vui|hanh phuc|thich|tuyet voi|hao hung|phan khoi|cuoi|hai long|dang yeu|may man|thu vi|hay qua|da qua|tuyet|sung suong|vui ve|ngot ngao',
  biet_on: 'cam on|biet on|tran trong|cam dong|xuc dong|am ap|tri an|thuong qua|duoc lang nghe|duoc hieu',
  hy_vong: 'hy vong|hi vong|mong|tin tuong|co gang|muon thu|se thu|y dinh|tuong lai|dong luc|can bang|thu xem|bat dau lai|cai thien|tot len|se on',
};
const POSITIVE = new Set(['nhe_long', 'vui', 'biet_on', 'hy_vong']);
const NEGATIVE = new Set(['buon', 'lo_au', 'gian', 'co_don', 'met_moi']);

const LEX = new Map();
for (const [cat, list] of Object.entries(CUES)) for (const ph of list.split('|')) { const k = ph.trim(); if (k && !LEX.has(k)) LEX.set(k, cat); }
const MAX_N = Math.max(...[...LEX.keys()].map((k) => k.split(' ').length));

const NEG = new Set(['khong', 'chua', 'chang', 'cha', 'het', 'dau', 'dung', 'dau co', 'dau phai']);
const BOOST = new Set(['rat', 'qua', 'cuc', 'cuc ky', 'vo cung', 'het suc', 'that', 'lam', 'sieu', 'kinh khung', 'tham']);
const FILL = new Set(['he', 'bao', 'gio']);
const SOFT = new Set(['hoi', 'chut', 'phan nao', 'ti', 'hoi hoi']);

const EMOJI = [
  [/[😢😭😞😔☹🥺💔😿]|:\(|=\(|:'\(/gu, 'buon'], [/[😡😠🤬]/gu, 'gian'], [/[😰😨😱😟]/gu, 'lo_au'],
  [/[😊😄😁😆🥰😍❤💖💕🤗🙂]|:\)|=\)|\^\^|:d\b/gu, 'vui'], [/[🙏]/gu, 'biet_on'], [/[😴🥱]/gu, 'met_moi'],
];

const SELF = new Set(['toi', 'minh', 'tui', 'em', 'con']);
const LIFE = new Set(['gia dinh', 'bo', 'me', 'ba', 'chong', 'vo', 'nguoi yeu', 'ban be', 'cong viec', 'sep', 'dong nghiep', 'tien', 'con cai', 'benh', 'hoc', 'thi', 'cong ty', 'cha', 'anh chi', 'chia tay', 'ly hon', 'bo me', 'nha', 'su nghiep', 'tinh yeu']);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;

/** @returns {{val:number, aro:number, emo:string, disc:number, words:number, hits:number}} */
export function analyzeAffect(text) {
  const raw = String(text ?? '');
  const caps = (raw.match(/\b[A-ZÀ-Ỵ]{3,}\b/gu) ?? []).length;
  const bangs = Math.min(3, (raw.match(/!/g) ?? []).length);
  const tokens = strip(raw).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const words = tokens.length;
  const score = Object.fromEntries(Object.keys(EMO).map((k) => [k, 0]));
  let valSum = 0, wSum = 0, hits = 0, i = 0, selfN = 0, lifeN = 0;
  const phrase = (a, n) => tokens.slice(a, a + n).join(' ');
  const near = (set, a) => (a >= 1 && set.has(tokens[a - 1])) || (a >= 2 && (set.has(tokens[a - 2]) || set.has(`${tokens[a - 2]} ${tokens[a - 1]}`)));

  while (i < tokens.length) {
    let found = null;
    for (let n = Math.min(MAX_N, tokens.length - i); n >= 1; n--) { const p = phrase(i, n); if (LEX.has(p)) { found = { cat: LEX.get(p), n }; break; } }
    if (SELF.has(tokens[i])) selfN++;
    if (LIFE.has(tokens[i]) || LIFE.has(phrase(i, 2))) lifeN++;
    if (!found) { i++; continue; }
    let { cat } = found, w = 1, v = EMO[cat].val;
    let j = i - 1; while (j >= 0 && (FILL.has(tokens[j]) || BOOST.has(tokens[j]) || SOFT.has(tokens[j]))) j--;
    const negated = j >= 0 && i - j <= 3 && NEG.has(tokens[j]); // phủ định chỉ tính khi đứng sát từ khoá (cho phép chen "hề", "bao giờ", "rất"…)
    if (near(BOOST, i) || (i + found.n < tokens.length && BOOST.has(tokens[i + found.n]))) w = 1.4;
    else if (near(SOFT, i)) w = 0.6;
    if (negated && cat !== 'boi_roi') {
      if (POSITIVE.has(cat)) { cat = cat === 'vui' || cat === 'nhe_long' ? 'buon' : 'trung_tinh'; v = cat === 'buon' ? -0.6 : -0.3; }
      else if (NEGATIVE.has(cat)) { cat = 'nhe_long'; v = 0.5; }
    }
    score[cat] += w; valSum += v * w; wSum += w; hits++;
    i += found.n;
  }
  for (const [re, cat] of EMOJI) { const n = (raw.toLowerCase().match(re) ?? []).length; if (n) { score[cat] += n; valSum += EMO[cat].val * n; wSum += n; hits += n; } }

  let emo = 'trung_tinh', best = 0;
  for (const [k, s] of Object.entries(score)) if (s > best) { best = s; emo = k; }
  const val = hits ? clamp((valSum / Math.max(1, wSum)) * Math.min(1.5, 1 + 0.25 * (hits - 1)), -2, 2) : 0;
  const aro = clamp(0.6 * wSum + 0.4 * bangs + (caps ? 0.5 : 0), 0, 3);
  const disc = words < 4 ? 0 : clamp((selfN > 0 ? 1 : 0) + (hits > 0 ? 1 : 0) + (lifeN > 0 ? 1 : 0) + (words >= 35 ? 1 : 0), 0, 3);
  return { val: r1(val), aro: r1(aro), emo, disc, words, hits };
}

/** Thẻ cảm xúc đầu tiên trong lời My (không tính thẻ gợi ý), hoặc null. */
export const firstTag = (reply) => /\[\[([a-z_]+)\]\]/.exec(String(reply ?? ''))?.[1] ?? null;
