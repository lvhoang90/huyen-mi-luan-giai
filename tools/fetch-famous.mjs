// Lấy ứng viên "người nổi tiếng theo ngày sinh" từ Wikidata (dữ liệu CC0, https://www.wikidata.org). Cần mạng ra được query.wikidata.org.
// Dùng:  node tools/fetch-famous.mjs --out data/wikidata-raw.json [--min-links 40] [--limit 40] [--resume]
// Rồi:    node tools/merge-famous.mjs data/wikidata-raw.json          (dựng src/engine/famous-wikidata.js)
//         node tools/merge-famous.mjs data/wikidata-raw.json --audit  (đối chiếu bộ tự soạn, in chỗ lệch)
// Chạy khoảng 366 truy vấn, tốn vài phút; tự chờ và thử lại khi bị giới hạn tốc độ; --resume tiếp tục nếu bị ngắt.
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] == null ? true : process.argv[i + 1]); };
const OUT = arg('out', 'data/wikidata-raw.json'), MIN = +arg('min-links', 40), LIMIT = +arg('limit', 40), RESUME = !!arg('resume', false);
const UA = process.env.FAMOUS_UA || 'huyenmy-famous/1.0 (luongviethoang.hcm@gmail.com)'; // Wikimedia yêu cầu User-Agent có liên hệ
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const query = (m, d) => `SELECT ?p ?pLabel ?viLabel ?born ?links (GROUP_CONCAT(DISTINCT ?occL; separator="|") AS ?occ) (GROUP_CONCAT(DISTINCT ?cnL; separator="|") AS ?country) WHERE {
  ?p wdt:P31 wd:Q5; p:P569/psv:P569 ?bn; wikibase:sitelinks ?links. ?bn wikibase:timeValue ?born; wikibase:timePrecision 11.
  FILTER(MONTH(?born)=${m} && DAY(?born)=${d} && YEAR(?born)>1400 && ?links>=${MIN})
  OPTIONAL { ?p wdt:P106 ?o. ?o rdfs:label ?occL FILTER(LANG(?occL)="en") }
  OPTIONAL { ?p wdt:P27 ?c. ?c rdfs:label ?cnL FILTER(LANG(?cnL)="en") }
  OPTIONAL { ?p rdfs:label ?viLabel FILTER(LANG(?viLabel)="vi") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} GROUP BY ?p ?pLabel ?viLabel ?born ?links ORDER BY DESC(?links) LIMIT ${LIMIT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(m, d) {
  for (let t = 0; t < 5; t++) {
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query(m, d)), { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
    if (r.ok) return (await r.json()).results.bindings;
    if (r.status === 429 || r.status >= 500) { const wait = (+r.headers.get('retry-after') || 5 * (t + 1)) * 1000; console.error(`${d}/${m}: HTTP ${r.status}, chờ ${wait / 1000}s`); await sleep(wait); continue; }
    throw new Error(`${d}/${m}: HTTP ${r.status}`);
  }
  throw new Error(`${d}/${m}: quá số lần thử`);
}
let out = RESUME && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
const done = new Set(out.map((r) => +r.born.slice(5, 7) * 100 + +r.born.slice(8, 10)));
fs.mkdirSync(OUT.split('/').slice(0, -1).join('/') || '.', { recursive: true });
for (let m = 1; m <= 12; m++) for (let d = 1; d <= DAYS[m - 1]; d++) {
  if (RESUME && done.has(m * 100 + d)) continue;
  const rows = await run(m, d);
  for (const b of rows) out.push({ qid: b.p.value.split('/').pop(), name: b.pLabel?.value ?? '', nameVi: b.viLabel?.value ?? '', born: b.born.value, links: +b.links.value, occ: b.occ?.value ?? '', country: b.country?.value ?? '' });
  fs.writeFileSync(OUT, JSON.stringify(out));
  process.stderr.write(`\r${String(d).padStart(2)}/${String(m).padStart(2)}  tổng ${out.length}   `);
  await sleep(1200);
}
console.error(`\nXong: ${out.length} dòng -> ${OUT}`);
