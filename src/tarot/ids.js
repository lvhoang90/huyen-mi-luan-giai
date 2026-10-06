// Phần nhỏ, không kèm dữ liệu lá bài, để trang chính chỉ cần nạp phần này khi khởi động (bộ 78 lá chỉ nạp khi thật sự cần).
export const TOPICS = [['tinh-cam', 'Tình cảm'], ['cong-viec', 'Công việc'], ['tien-bac', 'Tiền bạc'], ['suc-khoe', 'Sức khỏe'], ['ban-than', 'Bản thân'], ['gia-dinh', 'Gia đình và bạn bè'], ['hoc-tap', 'Học tập'], ['khac', 'Điều khác']];
export const topicLabel = (k) => TOPICS.find(([s]) => s === k)?.[1] ?? null;
/** Đọc tham số ?tarot=3,17,40: chỉ nhận số nguyên trong bộ bài, tối đa ba lá; chuỗi rỗng thì không có lá nào (không phải lá số 0). */
export const parseCardIds = (param) => String(param ?? '').split(',').filter((x) => /^\d+$/.test(x.trim())).map(Number).filter((n) => n >= 0 && n < 78).slice(0, 3);
export const vnDay = (now = new Date()) => { const t = new Date(now.getTime() + 7 * 3600_000); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
