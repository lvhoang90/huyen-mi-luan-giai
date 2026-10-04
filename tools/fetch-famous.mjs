// Dựng bộ "người nổi tiếng theo ngày sinh" đầy đủ và có nguồn từ Wikidata (CHƯA chạy thử: môi trường soạn không ra được ngoài mạng).
// Dùng: node tools/fetch-famous.mjs > /tmp/famous.json   rồi đối chiếu, đổi sang dạng mảng trong src/engine/famous.js.
// Chọn người có nhiều bài Wikipedia nhất (độ nổi tiếng), tối đa 6 người mỗi ngày dương lịch.
const query = (m, d) => `SELECT ?p ?pLabel ?born ?desc ?links WHERE {
  ?p wdt:P31 wd:Q5; wdt:P569 ?born; wikibase:sitelinks ?links .
  FILTER(MONTH(?born)=${m} && DAY(?born)=${d} && YEAR(?born) > 1000) FILTER(?links > 60)
  OPTIONAL { ?p schema:description ?desc FILTER(LANG(?desc)="vi") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "vi,en". }
} ORDER BY DESC(?links) LIMIT 6`;
const out = [];
for (let m = 1; m <= 12; m++) for (let d = 1; d <= [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; d++) {
  const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query(m, d)), { headers: { 'User-Agent': 'huyenmy-famous/1.0' } });
  if (!r.ok) { console.error(m, d, r.status); continue; }
  for (const b of (await r.json()).results.bindings) out.push([m, d, +b.born.value.slice(0, 4), b.pLabel.value, b.desc?.value ?? '']);
  await new Promise((res) => setTimeout(res, 400));
}
console.log(JSON.stringify(out));
