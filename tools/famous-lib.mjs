// Logic thuần cho việc dựng bộ người nổi tiếng từ Wikidata (dữ liệu CC0): chuẩn hoá, gán lĩnh vực, chọn mỗi ngày, đối chiếu bộ tự soạn.
// Tách riêng khỏi phần gọi mạng để có thể kiểm thử. Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.

// Nhãn nghề (tiếng Anh, từ Wikidata) -> [lĩnh vực, cách gọi tiếng Việt]. Khớp theo thứ tự, cụm cụ thể đặt trước.
export const OCC_RULES = [
  [/entrepreneur|businessp|industrialist|investor|banker|executive/i, 'b', 'doanh nhân'],
  [/computer scientist|programmer|software|engineer|inventor/i, 't', 'nhà phát minh, kỹ sư'],
  [/physicist|mathematician|chemist|biologist|astronom|scientist|geneticist|naturalist|geologist|neuroscientist|astronaut/i, 's', 'nhà khoa học'],
  [/psycholog|psychiatr|psychoanalyst/i, 'y', 'nhà tâm lý học'],
  [/physician|surgeon|nurse|medical|doctor/i, 'h', 'bác sĩ'],
  [/teacher|educator|professor|pedagog|academic/i, 'e', 'nhà giáo dục'],
  [/football|soccer|basketball|tennis|athlet|swimmer|boxer|golfer|sprinter|gymnast|cyclist|racing|skier|martial|chess|baseball|volleyball|badminton|table tennis/i, 'p', 'vận động viên'],
  [/singer|rapper|musician|composer|guitarist|pianist|violinist|conductor|songwriter|dj\b|record producer|drummer|cellist/i, 'm', 'nghệ sĩ âm nhạc'],
  [/actor|actress|film director|film producer|screenwriter|filmmaker|comedian|voice actor|television/i, 'f', 'diễn viên, đạo diễn'],
  [/youtuber|streamer|influencer|blogger|podcaster|journalist|presenter|broadcaster/i, 'c', 'người làm nội dung, truyền thông'],
  [/politician|statesperson|president|prime minister|monarch|king\b|queen\b|emperor|diplomat|revolutionary|military|general\b|jurist|judge|lawyer|activist/i, 'g', 'chính khách, nhà lãnh đạo'],
  [/writer|poet|novelist|playwright|author|essayist|painter|sculptor|architect|photographer|philosopher|artist|designer|illustrator|dancer|model\b|fashion/i, 'a', 'nhà văn, nghệ sĩ'],
];
const VIET = /vietnam/i;

const strip = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const normName = strip;

/** occLabels: mảng nhãn nghề tiếng Anh. Trả về { f, desc } hoặc null nếu không khớp nghề nào. */
export function classify(occLabels) {
  const hits = [];
  for (const [re, f, vi] of OCC_RULES) if (occLabels.some((o) => re.test(o)) && !hits.some((h) => h.vi === vi)) hits.push({ f, vi });
  if (!hits.length) return null;
  // chuyên môn cụ thể trước (ví dụ ca sĩ + diễn viên); tối đa 2 cách gọi
  return { f: hits[0].f, desc: hits.slice(0, 2).map((h) => h.vi).join(', ') };
}

/**
 * raw: { qid, name, nameVi, born, links, occ: 'a|b', country: 'x|y' } từ truy vấn Wikidata.
 * Trả về [m, d, y, name, desc, field, vn(0|1), pop] hoặc null nếu dữ liệu không đạt (ngày không hợp lệ, không rõ nghề…).
 */
export function normalizeRow(raw) {
  const mt = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw?.born ?? ''); if (!mt) return null;
  const y = +mt[1], m = +mt[2], d = +mt[3];
  if (y < 1400 || y > 2012 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  if (new Date(Date.UTC(2000, m - 1, d)).getUTCDate() !== d) return null; // ngày không tồn tại (kể cả 29/2 thì vẫn hợp lệ ở năm 2000)
  const name = (raw.nameVi || raw.name || '').trim(); if (!name || /^Q\d+$/.test(name)) return null;
  const cls = classify(String(raw.occ ?? '').split('|').filter(Boolean)); if (!cls) return null;
  const vn = VIET.test(String(raw.country ?? '')) ? 1 : 0;
  return [m, d, y, name, cls.desc, cls.f, vn, Math.round(+raw.links || 0)];
}

/** Chọn tối đa perDay người mỗi ngày, ưu tiên nổi tiếng (nhiều trang Wikipedia) nhưng không quá perField người một lĩnh vực. */
export function selectPerDay(rows, perDay = 8, perField = 3) {
  const byDay = new Map();
  for (const r of rows) { const k = r[0] * 100 + r[1]; (byDay.get(k) ?? byDay.set(k, []).get(k)).push(r); }
  const out = [];
  for (const list of byDay.values()) {
    list.sort((a, b) => (b[6] - a[6]) || (b[7] - a[7])); // người Việt trước, rồi theo độ nổi tiếng
    const cnt = {}; let n = 0;
    for (const r of list) { if (n >= perDay) break; if ((cnt[r[5]] ?? 0) >= perField && !r[6]) continue; cnt[r[5]] = (cnt[r[5]] ?? 0) + 1; out.push(r); n++; }
  }
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1] || b[7] - a[7]);
}

/** Bỏ những người đã có trong bộ tự soạn (so tên không dấu). */
export function dedupe(rows, existingNames) {
  const have = new Set(existingNames.map(normName)), seen = new Set(), out = [];
  for (const r of rows) { const k = normName(r[3]); if (have.has(k) || seen.has(k)) continue; seen.add(k); out.push(r); }
  return out;
}

/**
 * Đối chiếu bộ tự soạn với Wikidata: existing = [{name,m,d,y}], raws = hàng thô từ Wikidata.
 * Trả về { mismatches, confirmed, missing } để người soạn sửa tay những chỗ lệch.
 */
export function audit(existing, raws) {
  const idx = new Map();
  for (const r of raws) for (const n of [r.name, r.nameVi]) if (n) idx.set(normName(n), r);
  const mismatches = [], missing = []; let confirmed = 0;
  for (const e of existing) {
    const r = idx.get(normName(e.name)); if (!r) { missing.push(e.name); continue; }
    const mt = /^(\d{4})-(\d{2})-(\d{2})/.exec(r.born ?? ''); if (!mt) continue;
    if (+mt[1] === e.y && +mt[2] === e.m && +mt[3] === e.d) confirmed++;
    else mismatches.push({ name: e.name, ours: `${e.d}/${e.m}/${e.y}`, wikidata: `${+mt[3]}/${+mt[2]}/${+mt[1]}`, qid: r.qid });
  }
  return { mismatches, confirmed, missing };
}

/** Nội dung tệp src/engine/famous-wikidata.js. */
export function renderModule(rows, meta = {}) {
  const lines = rows.map((r) => JSON.stringify(r));
  return `// TỆP SINH TỰ ĐỘNG bởi tools/merge-famous.mjs. Đừng sửa tay.
// Nguồn: Wikidata (CC0), lấy ngày ${meta.date ?? ''}. ${rows.length} người. Mục: [tháng, ngày, năm, tên, mô tả, lĩnh vực, vn, độ nổi tiếng (số trang Wikipedia)]
export const WD = [
${lines.join(',\n')}
];
`;
}
