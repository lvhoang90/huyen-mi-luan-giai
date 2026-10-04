// Tìm nơi sinh theo chữ người dùng tự gõ, đối chiếu với PLACES (tên chính + tên khác/tỉnh).
import { PLACES } from './astro.js';

const PREFIX = /^(thanh pho|tp|tinh|thi xa|thi tran|huyen|quan|xa|phuong)\s+/;
export function norm(s) {
  let t = String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ').trim();
  for (let i = 0; i < 2; i++) t = t.replace(PREFIX, '');
  return t;
}

const INDEX = Object.entries(PLACES).map(([key, p]) => ({
  key, names: [p.name, ...(p.alias ?? [])].map(norm).filter(Boolean),
}));

/**
 * Trả về các nơi khớp, xếp theo độ chắc.
 * Khớp chính xác tên/tên khác → 1 kết quả. Chữ gõ chứa tên một nơi (vd "Củ Chi, TP.HCM") → nơi dài tên nhất.
 * Chữ gõ dở là đầu/đoạn của tên ("bình") → mọi nơi khớp.
 */
export function findPlaces(query, limit = 6) {
  const q = norm(query);
  if (q.length < 2) return [];
  const exact = INDEX.filter((e) => e.names.includes(q));
  if (exact.length) return exact.map((e) => e.key).slice(0, limit);
  const contained = INDEX.map((e) => ({ key: e.key, len: Math.max(0, ...e.names.filter((n) => (' ' + q + ' ').includes(' ' + n + ' ')).map((n) => n.length)) }))
    .filter((e) => e.len > 0).sort((a, b) => b.len - a.len);
  if (contained.length) {
    const best = contained[0].len;
    return contained.filter((e) => e.len === best).map((e) => e.key).slice(0, limit);
  }
  return INDEX.filter((e) => e.names.some((n) => n.startsWith(q) || (' ' + n).includes(' ' + q))).map((e) => e.key).slice(0, limit);
}
