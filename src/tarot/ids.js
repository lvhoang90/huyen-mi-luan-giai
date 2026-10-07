// Phần nhỏ, không kèm dữ liệu lá bài, để trang chính chỉ cần nạp phần này khi khởi động (bộ 78 lá chỉ nạp khi thật sự cần).
export const TOPICS = [['tinh-cam', 'Tình cảm'], ['cong-viec', 'Công việc'], ['tien-bac', 'Tiền bạc'], ['suc-khoe', 'Sức khỏe'], ['ban-than', 'Bản thân'], ['gia-dinh', 'Gia đình và bạn bè'], ['hoc-tap', 'Học tập'], ['khac', 'Điều khác']];
export const topicLabel = (k) => TOPICS.find(([s]) => s === k)?.[1] ?? null;
/** Đọc tham số ?tarot=3,17,40: chỉ nhận số nguyên trong bộ bài, không trùng lá; số lá được cắt về kiểu trải gần nhất (1 đến 3, 5 hoặc 7); chuỗi rỗng thì không có lá nào (không phải lá số 0). */
export const parseCardIds = (param) => {
  const ids = String(param ?? '').split(',').map((x) => x.trim()).filter((x) => /^\d+$/.test(x)).map(Number).filter((n) => n >= 0 && n < 78).filter((n, i, a) => a.indexOf(n) === i).slice(0, 7);
  return ids.slice(0, ids.length <= 3 ? ids.length : ids.length < 5 ? 3 : ids.length < 7 ? 5 : 7);
};
export const vnDay = (now = new Date()) => { const t = new Date(now.getTime() + 7 * 3600_000); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
