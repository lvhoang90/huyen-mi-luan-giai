// Dựng src/engine/famous-wikidata.js từ kết quả của fetch-famous.mjs, hoặc đối chiếu bộ tự soạn.
// Dùng:  node tools/merge-famous.mjs data/wikidata-raw.json [--per-day 8] [--per-field 3]
//        node tools/merge-famous.mjs data/wikidata-raw.json --out /đường/dẫn/famous-wikidata.js   (ghi ra nơi khác)
//        node tools/merge-famous.mjs data/wikidata-raw.json --audit      (không ghi tệp, chỉ in chỗ lệch)
import fs from 'node:fs';
import { normalizeRow, selectPerDay, dedupe, audit, renderModule } from './famous-lib.mjs';
import { allEntries } from '../src/engine/famous.js';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const file = process.argv[2]; if (!file || file.startsWith('--')) { console.error('Thiếu đường dẫn tệp JSON thô.'); process.exit(1); }
const raws = JSON.parse(fs.readFileSync(file, 'utf8'));
const own = allEntries().filter((e) => !e.wd); // chỉ bộ tự soạn

if (process.argv.includes('--audit')) {
  const r = audit(own, raws);
  console.log(`Đối chiếu ${own.length} mục tự soạn: ${r.confirmed} khớp ngày sinh, ${r.mismatches.length} LỆCH, ${r.missing.length} không tìm thấy trong dữ liệu (có thể do tên viết khác hoặc dưới ngưỡng nổi tiếng).`);
  for (const m of r.mismatches) console.log(`  LỆCH  ${m.name}: bộ tự soạn ${m.ours}, Wikidata ${m.wikidata} (${m.qid}) -> kiểm tra rồi sửa tay`);
  process.exit(r.mismatches.length ? 2 : 0);
}
const rows = raws.map(normalizeRow).filter(Boolean);
const picked = dedupe(selectPerDay(rows, +arg('per-day', 8), +arg('per-field', 3)), own.map((e) => e.name));
const outFile = arg('out', null);
fs.writeFileSync(outFile ?? new URL('../src/engine/famous-wikidata.js', import.meta.url), renderModule(picked, { date: new Date().toISOString().slice(0, 10) }));
console.log(`Đọc ${raws.length} dòng, hợp lệ ${rows.length}, ghi ${picked.length} người mới vào ${outFile ?? 'src/engine/famous-wikidata.js'}`);
