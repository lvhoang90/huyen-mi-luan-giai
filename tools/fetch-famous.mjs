// Lấy ứng viên "người nổi tiếng theo ngày sinh" từ Wikidata (dữ liệu CC0). Cần mạng ra được query.wikidata.org.
// Cách làm: duyệt theo từng khoảng NĂM sinh (truy vấn theo dải ngày sinh chạy nhanh, tránh quét toàn bộ cơ sở dữ liệu bị quá giờ),
// lấy mọi người có từ --min-links trang Wikipedia, rồi merge-famous.mjs mới chia theo ngày trong năm.
// Dùng:  node tools/fetch-famous.mjs --out data/wikidata-raw.json [--min-links 40] [--resume]
//        node tools/fetch-famous.mjs --only 1990-1995     (chạy thử một khoảng năm, in kết quả thô để tìm lỗi)
// Rồi:    node tools/merge-famous.mjs data/wikidata-raw.json          (dựng src/engine/famous-wikidata.js)
//         node tools/merge-famous.mjs data/wikidata-raw.json --audit  (đối chiếu bộ tự soạn, in chỗ lệch)
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] == null ? true : process.argv[i + 1]); };
const OUT = arg('out', 'data/wikidata-raw.json'), MIN = +arg('min-links', 40), RESUME = !!arg('resume', false), ONLY = arg('only', null);
const STATE = OUT + '.progress';
const UA = process.env.FAMOUS_UA || 'huyenmy-famous/1.0 (luongviethoang.hcm@gmail.com)'; // Wikimedia yêu cầu User-Agent có liên hệ

// Các khoảng năm: thưa thì rộng, dày thì hẹp (để mỗi truy vấn vừa sức).
const slices = [];
for (let y = 1400; y < 1700; y += 50) slices.push([y, y + 50]);
for (let y = 1700; y < 1850; y += 25) slices.push([y, y + 25]);
for (let y = 1850; y < 1950; y += 10) slices.push([y, y + 10]);
for (let y = 1950; y < 2013; y += 3) slices.push([y, Math.min(y + 3, 2013)]);

const query = (y1, y2) => `SELECT ?p ?pLabel ?viLabel ?born ?links (GROUP_CONCAT(DISTINCT ?occL; separator="|") AS ?occ) (GROUP_CONCAT(DISTINCT ?cnL; separator="|") AS ?country) WHERE {
  ?p wdt:P569 ?born. hint:Prior hint:rangeSafe true.
  FILTER(?born >= "${y1}-01-01T00:00:00Z"^^xsd:dateTime && ?born < "${y2}-01-01T00:00:00Z"^^xsd:dateTime)
  ?p wdt:P31 wd:Q5; wikibase:sitelinks ?links. FILTER(?links >= ${MIN})
  ?p p:P569/psv:P569/wikibase:timePrecision ?prec. FILTER(?prec = 11)
  OPTIONAL { ?p wdt:P106 ?o. ?o rdfs:label ?occL FILTER(LANG(?occL)="en") }
  OPTIONAL { ?p wdt:P27 ?c. ?c rdfs:label ?cnL FILTER(LANG(?cnL)="en") }
  OPTIONAL { ?p rdfs:label ?viLabel FILTER(LANG(?viLabel)="vi") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} GROUP BY ?p ?pLabel ?viLabel ?born ?links`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(y1, y2, raw = false) {
  for (let t = 0; t < 5; t++) {
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query(y1, y2)), { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
    if (raw) return r;
    if (r.ok) return (await r.json()).results.bindings;
    if (r.status === 429 || r.status >= 500) { const wait = (+r.headers.get('retry-after') || 8 * (t + 1)) * 1000; console.error(`\n${y1}-${y2}: HTTP ${r.status}, chờ ${wait / 1000}s`); await sleep(wait); continue; }
    throw new Error(`${y1}-${y2}: HTTP ${r.status}`);
  }
  throw new Error(`${y1}-${y2}: quá số lần thử (có thể khoảng này quá nặng)`);
}

if (ONLY) {
  const [y1, y2] = String(ONLY).split('-').map(Number);
  const r = await run(y1, y2, true), text = await r.text();
  console.log('HTTP', r.status, '| độ dài', text.length);
  try { const j = JSON.parse(text); console.log('Số dòng:', j.results.bindings.length); console.log(JSON.stringify(j.results.bindings.slice(0, 2), null, 1).slice(0, 1800)); } catch { console.log(text.slice(0, 1000)); }
  process.exit(0);
}

let out = RESUME && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
let start = RESUME && fs.existsSync(STATE) ? +fs.readFileSync(STATE, 'utf8') || 0 : 0;
fs.mkdirSync(OUT.split('/').slice(0, -1).join('/') || '.', { recursive: true });
for (let i = start; i < slices.length; i++) {
  const [y1, y2] = slices[i];
  const rows = await run(y1, y2);
  for (const b of rows) out.push({ qid: b.p.value.split('/').pop(), name: b.pLabel?.value ?? '', nameVi: b.viLabel?.value ?? '', born: b.born.value, links: +b.links.value, occ: b.occ?.value ?? '', country: b.country?.value ?? '' });
  fs.writeFileSync(OUT, JSON.stringify(out)); fs.writeFileSync(STATE, String(i + 1));
  process.stderr.write(`\r[${i + 1}/${slices.length}] năm ${y1}-${y2}: +${rows.length}, tổng ${out.length}      `);
  if (i >= 12 && out.length === 0) { console.error('\nĐã chạy nhiều khoảng mà vẫn 0 kết quả: truy vấn có vấn đề. Chạy thử: node tools/fetch-famous.mjs --only 1990-1995'); process.exit(1); }
  await sleep(1500);
}
console.error(`\nXong: ${out.length} dòng -> ${OUT}`);
