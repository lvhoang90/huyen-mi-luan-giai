// Thần số học Pythagoras, áp dụng cho họ tên tiếng Việt (bỏ dấu, đ → d).
const MAP = { A:1,J:1,S:1, B:2,K:2,T:2, C:3,L:3,U:3, D:4,M:4,V:4, E:5,N:5,W:5, F:6,O:6,X:6, G:7,P:7,Y:7, H:8,Q:8,Z:8, I:9,R:9 };
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']); // Y là nguyên âm trong tên Việt (Thúy, Huy, Duy…)
const MASTER = new Set([11, 22, 33]);

export const stripVN = (s) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase().replace(/[^A-Z ]/g, '');

export function reduce(n, keepMaster = true) {
  while (n > 9 && !(keepMaster && MASTER.has(n))) n = String(n).split('').reduce((a, b) => a + +b, 0);
  return n;
}

const sumLetters = (s, pred) =>
  [...s].reduce((a, ch) => (ch !== ' ' && MAP[ch] && pred(ch) ? a + MAP[ch] : a), 0);

export function computeNumerology({ fullName, y, m, d }, now = new Date()) {
  const name = stripVN(fullName);
  const lifePath = reduce(reduce(d) + reduce(m) + reduce(y));
  const expression = reduce(sumLetters(name, () => true));
  const soul = reduce(sumLetters(name, (c) => VOWELS.has(c)));
  const personality = reduce(sumLetters(name, (c) => !VOWELS.has(c)));
  const birthDay = d <= 31 ? (MASTER.has(d) ? d : reduce(d)) : reduce(d);
  const maturity = reduce(lifePath + expression);
  const personalYear = reduce(reduce(d) + reduce(m) + reduce(now.getFullYear()));
  // Năng lực thiếu: chữ số 1-9 không xuất hiện trong tên.
  const present = new Set([...name].filter((c) => MAP[c]).map((c) => MAP[c]));
  const missingDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !present.has(n));
  return { lifePath, expression, soul, personality, birthDay, maturity, personalYear, missingDigits, normalizedName: name };
}

export const NUMBER_KEYWORDS = {
  1: 'khởi xướng, độc lập, tự mở đường',
  2: 'hòa hợp, nhạy cảm, hợp tác',
  3: 'biểu đạt, sáng tạo, kết nối',
  4: 'nền tảng, kỷ luật, bền bỉ',
  5: 'tự do, thích nghi, trải nghiệm',
  6: 'chăm sóc, trách nhiệm, hài hòa gia đình',
  7: 'chiêm nghiệm, phân tích, tìm chiều sâu',
  8: 'quyền lực thực tế, quản trị, thành tựu',
  9: 'nhân ái, bao dung, hoàn tất và buông',
  11: 'trực giác cao, truyền cảm hứng (số bậc thầy)',
  22: 'kiến tạo quy mô lớn, biến ý tưởng thành thực (số bậc thầy)',
  33: 'tận hiến, chữa lành, dẫn dắt bằng yêu thương (số bậc thầy)',
};
export const PERSONAL_YEAR_THEME = {
  1: 'năm gieo hạt, bắt đầu mới', 2: 'năm kiên nhẫn, vun quan hệ', 3: 'năm biểu đạt và mở rộng giao tiếp',
  4: 'năm xây nền, sắp xếp, làm chắc', 5: 'năm thay đổi, linh hoạt', 6: 'năm gia đình, trách nhiệm, chăm sóc',
  7: 'năm nhìn vào trong, học và nghỉ', 8: 'năm thu hoạch, quản trị nguồn lực', 9: 'năm khép lại, buông cái cũ',
  11: 'năm trực giác và cảm hứng', 22: 'năm kiến tạo lớn', 33: 'năm phụng sự và chữa lành',
};
