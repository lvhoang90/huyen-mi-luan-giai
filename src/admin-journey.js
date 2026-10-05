// Tab "Hành trình cảm xúc": đo lòng người nhẹ đi hay nặng thêm khi trò chuyện với My, và My làm gì tạo ra khác biệt.
import { esc, nf, pct, ci, fx, sgn, ciText, bandChart, divergeBars, stackBar, download, EMO_COLOR, MOOD, TONE, GREET } from './admin-ui.js';

const NOTE_ICON = { good: '✓', warn: '●', crit: '▲', info: '○' };
const kpi = (v, l, n = '') => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div><div class="n">${n}</div></div>`;

function moodPanel(s) {
  const col = ['#c0463f', '#d98a4a', '#b9b8ae', '#6fb59b', '#2f9a76'];
  const mk = (arr) => stackBar(arr.map((n, i) => ({ label: MOOD[i + 1], n, color: col[i] })));
  const d = s.delta;
  return `<div class="kpis">
      ${kpi(s.paired ? sgn(d.mean) : '–', 'Thay đổi tâm trạng (cuối so với đầu)', s.paired ? `thang 1-5 · ${ciText(d)}` : 'Chưa có cặp đánh giá')}
      ${kpi(pct(s.improved), 'Thấy nhẹ hơn', ci(s.improved))}${kpi(pct(s.same), 'Không đổi', ci(s.same))}${kpi(pct(s.worse), 'Thấy nặng hơn', ci(s.worse))}</div>
    <div class="grid2" style="margin-top:14px"><div><h3>Lúc bắt đầu (trung bình ${fx(s.startMean, 2)})</h3>${mk(s.startDist)}</div><div><h3>Lúc sau (trung bình ${fx(s.endMean, 2)})</h3>${mk(s.endDist)}</div></div>
    <p class="note">Đây là số đo trực tiếp: người dùng tự chạm một ô ở đầu buổi, giữa buổi (lượt thứ 8) và cuối buổi. Không bắt buộc, nên có thể lệch về phía người sẵn lòng trả lời. "Lúc sau" lấy lần đánh giá cuối cùng (cuối buổi nếu có, không thì giữa buổi).</p>`;
}

function trendPanel(t) {
  return `<div class="kpis">${kpi(pct(t.up), 'Nhẹ lòng dần', ci(t.up))}${kpi(pct(t.flat), 'Giữ nguyên', ci(t.flat))}${kpi(pct(t.down), 'Nặng dần', ci(t.down))}${kpi(sgn(t.delta.mean), 'Chênh sắc thái nửa sau so với nửa đầu', ciText(t.delta))}</div>
    <p class="note">Mỗi người có từ 4 lượt nói trở lên được chia hai nửa theo thứ tự. "Sắc thái" là điểm từ -2 (rất nặng nề) đến +2 (rất nhẹ nhàng) ước lượng từ lời người dùng bằng từ điển; chênh từ 0,3 trở lên mới tính là thay đổi. Đủ ${t.eligible} người.</p>`;
}

const POS = new Set(['hy_vong', 'nhe_long', 'vui', 'biet_on']), NEGE = new Set(['buon', 'lo_au', 'gian', 'co_don', 'met_moi']);
function emoTable(rows, overall) {
  const sh = (v) => (v == null ? '–' : `${(v * 100).toFixed(0)}%`);
  const body = rows.map((r) => `<tr><td><i class="dot" style="background:${EMO_COLOR[r.emo]}"></i>${esc(r.label)}</td><td class="num">${sh(r.first)}</td><td class="num">${sh(r.last)}</td>
    <td class="num ${(POS.has(r.emo) && r.delta > 0.02) || (NEGE.has(r.emo) && r.delta < -0.02) ? 'good' : (POS.has(r.emo) && r.delta < -0.02) || (NEGE.has(r.emo) && r.delta > 0.02) ? 'bad' : ''}">${r.delta == null ? '–' : `${r.delta > 0 ? '+' : ''}${(r.delta * 100).toFixed(0)} điểm %`}</td><td class="num muted">${overall.find((o) => o.emo === r.emo)?.n ?? 0}</td></tr>`).join('');
  return `<div class="scroll"><table><thead><tr><th>Cảm xúc người dùng nói ra</th><th class="num">Đầu cuộc trò chuyện</th><th class="num">Cuối cuộc trò chuyện</th><th class="num">Thay đổi</th><th class="num">Tổng lượt</th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="note">So một phần ba đầu với một phần ba cuối của mỗi người (từ 3 lượt trở lên). Với cảm xúc nặng (buồn, lo, cô đơn…), giảm là tín hiệu tốt; với cảm xúc nhẹ (nhẹ lòng, hy vọng…), tăng là tín hiệu tốt.</p>`;
}

function transTable(tr, rec) {
  const rows = tr.map((t) => `<tr><td><i class="dot" style="background:${EMO_COLOR[t.from]}"></i>${esc(t.fromLabel)}</td><td class="mid">→</td><td><i class="dot" style="background:${EMO_COLOR[t.to]}"></i>${esc(t.toLabel)}</td><td class="num">${t.n}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Chưa đủ dữ liệu.</td></tr>';
  return `<div class="kpis" style="margin-bottom:10px">${kpi(pct(rec), 'Hồi phục sau lúc nặng lòng', rec.n ? `trong 5 lượt kế tiếp có lúc nhẹ hơn · ${ci(rec)}` : 'Chưa có ai nặng lòng')}</div>
    <div class="scroll"><table><thead><tr><th>Từ</th><th></th><th>Sang</th><th class="num">Số lần</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function greetPanel(j) {
  const rows = j.greetTest.map((g) => `<tr><td><b>${esc(GREET[g.variant] ?? g.variant)}</b></td><td class="num">${g.n}</td><td class="num" title="${esc(ci(g.skip))}">${pct(g.skip)}</td><td class="num" title="${esc(ci(g.enter))}">${pct(g.enter)}</td><td class="num" title="${esc(ci(g.intake))}">${pct(g.intake)}</td><td class="num" title="${esc(ci(g.chat))}"><b>${pct(g.chat)}</b></td><td class="num">${g.moodDelta.n ? sgn(g.moodDelta.mean) : '–'} <span class="muted">n=${g.moodDelta.n}</span></td><td class="num">${g.nps == null ? '–' : fx(g.nps, 1)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Chưa có người nào được gán lời chào (sau bản cập nhật này mới có).</td></tr>';
  return `<section class="panel"><h2>Thử nghiệm lời chào mở đầu</h2><p class="sub">Mỗi người mới được gán ngẫu nhiên một trong bốn lời chào (cả dòng chữ trên màn mở đầu lẫn lời My nói đầu tiên) và giữ nguyên ở các lần sau. So sánh theo cùng một thước: bỏ qua màn mở đầu, bước vào, điền xong hồ sơ, bắt đầu trò chuyện, tâm trạng nhẹ đi, điểm giới thiệu.</p>
    <p class="jn ${j.greetVerdict.startsWith('"') ? 'good' : 'info'}" style="margin:6px 0 10px"><span aria-hidden="true">${j.greetVerdict.startsWith('"') ? '✓' : '○'}</span>${esc(j.greetVerdict)}</p>
    <div class="scroll"><table><thead><tr><th>Lời chào</th><th class="num">Người</th><th class="num">Bỏ qua mở đầu</th><th class="num">Bước vào</th><th class="num">Điền xong hồ sơ</th><th class="num">Bắt đầu trò chuyện</th><th class="num">Tâm trạng nhẹ đi</th><th class="num">Giới thiệu (TB)</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="note">Rê chuột vào tỉ lệ để xem khoảng tin cậy 95%. "Bắt đầu trò chuyện" là thước chính vì đến sớm và ít chịu nhiễu nhất; "Tâm trạng nhẹ đi" cần người đi hết buổi nên mẫu nhỏ hơn nhiều. Mẫu nhỏ thì khác biệt vài điểm phần trăm chỉ là ngẫu nhiên. Xem nhanh một biến thể bằng cách thêm <code>?gv=an_tam</code>, <code>?gv=am_ap</code>, <code>?gv=minh_bach</code> hoặc <code>?gv=goc</code> vào địa chỉ trang.</p></section>`;
}

export function renderJourney(j) {
  const c = j.coverage, notes = j.notes.map((n) => `<li class="jn ${n.level}"><span aria-hidden="true">${NOTE_ICON[n.level]}</span>${esc(n.text)}</li>`).join('');
  const turnPts = j.byTurn.map((b) => ({ x: b.turn, ...b.val, n: b.n }));
  const minPts = j.byMinute.map((b) => ({ x: b.range, ...b.val, n: b.n }));
  const discPts = j.byTurn.filter((b) => b.n).map((b) => `<tr><td>${b.turn}</td><td class="num">${b.n}</td><td class="num">${fx(b.disc, 2)}</td><td class="num">${fx(b.aro, 2)}</td><td class="num">${fx(b.words, 0)}</td></tr>`).join('');
  const tone = divergeBars(j.toneEffect.map((t) => ({ name: TONE[t.tone] ?? t.tone, mean: t.mean, lo: t.lo, hi: t.hi, n: t.n })), { span: 1.2 });
  return `<section class="panel"><h2>Điều nổi bật</h2><ul class="jlist">${notes || '<li class="muted">Chưa có nhận xét.</li>'}</ul>
      <div class="kpis" style="margin-top:12px">${kpi(nf.format(c.people), 'Người tham gia trong kỳ')}${kpi(nf.format(c.withTurns), 'Người có dữ liệu cảm xúc', 'đã nói ít nhất một lượt')}${kpi(nf.format(c.turns), 'Lượt nói đã phân tích')}${kpi(nf.format(c.selfReportPairs), 'Người có đủ 2 lần tự đánh giá')}</div></section>

    ${greetPanel(j)}
    <section class="panel"><h2>1. Tâm trạng tự báo: nhẹ đi hay nặng thêm?</h2><p class="sub">Câu trả lời thẳng nhất, vì do chính người dùng chọn.</p>${moodPanel(j.selfReport)}</section>

    <div class="grid2"><section class="panel"><h2>2. Sắc thái theo lượt nói</h2><p class="sub">Lượt thứ mấy trong cuộc trò chuyện. Đường lên nghĩa là lời người dùng nhẹ dần.</p>${bandChart(turnPts, { label: 'Sắc thái' })}</section>
      <section class="panel"><h2>Sắc thái theo phút của buổi</h2><p class="sub">Cùng số liệu, tính theo thời gian trôi qua trong buổi 30 phút.</p>${bandChart(minPts, { label: 'Sắc thái', color: 'var(--s3)' })}</section></div>

    <section class="panel"><h2>3. Xu hướng từng người</h2><p class="sub">Mỗi người được xếp vào nhẹ lòng dần, giữ nguyên hay nặng dần.</p>${trendPanel(j.trend)}</section>

    <div class="grid2"><section class="panel"><h2>4. Cảm xúc đầu và cuối cuộc trò chuyện</h2>${emoTable(j.emoShare, j.overall)}</section>
      <section class="panel"><h2>5. Chuyển trạng thái cảm xúc</h2><p class="sub">Từ lượt nói này sang lượt nói kế tiếp (bỏ qua trung tính liên tiếp).</p>${transTable(j.transitions, j.recovery)}</section></div>

    <div class="grid2"><section class="panel"><h2>6. Mở lòng và cường độ theo lượt</h2><p class="sub">Mức mở lòng (0-3) tăng dần là dấu hiệu tin cậy được xây lên.</p>
        <div class="scroll"><table><thead><tr><th>Lượt</th><th class="num">Số lượt</th><th class="num">Mở lòng</th><th class="num">Cường độ</th><th class="num">Số từ</th></tr></thead><tbody>${discPts || '<tr><td colspan="5" class="muted">Chưa có dữ liệu.</td></tr>'}</tbody></table></div></section>
      <section class="panel"><h2>7. Sau khi My luận giải lá số</h2><p class="sub">So ba lượt trước và ba lượt sau lượt luận giải, trong cùng một người.</p>
        <div class="kpis">${kpi(j.readingEffect.n ? sgn(j.readingEffect.delta.mean) : '–', 'Thay đổi sắc thái', j.readingEffect.n ? ciText(j.readingEffect.delta) : 'Chưa có người đủ lượt trước và sau')}${kpi(pct(j.readingEffect.improved), 'Nhẹ hơn rõ rệt', ci(j.readingEffect.improved))}</div></section></div>

    <section class="panel"><h2>8. Giọng của My và phản ứng ở lượt kế tiếp</h2><p class="sub">Với mỗi giọng My dùng (thẻ cảm xúc), lời người dùng ở lượt sau nhẹ hơn hay nặng hơn lượt trước? Thanh sang phải là nhẹ hơn.</p>${tone}
      <p class="note">Chỉ để tìm gợi ý cần kiểm tra thêm, không chứng minh giọng nào gây ra thay đổi: My thường chọn giọng theo tâm trạng của người dùng, nên có thể là nhân quả ngược. Cần đủ 5 lượt mỗi giọng.</p></section>

    <section class="panel"><h2>Độ tin cậy của phép đo và xuất dữ liệu</h2>
      <p class="note">Sắc thái, nhóm cảm xúc và mức mở lòng được ước lượng bằng từ điển tiếng Việt chạy trên máy chủ ngay khi người dùng gửi tin; nội dung không được lưu, chỉ giữ các con số. Đây là công cụ thô: không hiểu châm biếm, nói giảm hay ẩn ý, và chưa được kiểm định với dữ liệu người thật gán nhãn. ${j.validity.r == null ? `Chưa đủ cặp (mới ${j.validity.n}) để so sánh với tự đánh giá.` : `So với tự đánh giá tâm trạng: hệ số tương quan r = ${j.validity.r} (n=${j.validity.n}); r càng gần 1 càng đáng tin.`} Số đo tự báo luôn được ưu tiên hơn số ước lượng. Người dùng không bị chẩn đoán hay gắn nhãn; mọi kết luận ở đây là theo nhóm.</p>
      <div class="toolbar"><button class="btn" id="jx-csv">Tải CSV từng lượt (đã ẩn danh)</button><button class="btn" id="jx-json">Tải JSON phân tích</button></div></section>`;
}

export function wireJourney(j, days) {
  document.getElementById('jx-csv')?.addEventListener('click', async () => {
    const r = await fetch(`/api/admin/export/turns.csv?days=${days}`); download('huyenmy-luot-tro-chuyen.csv', await r.text());
  });
  document.getElementById('jx-json')?.addEventListener('click', () => download('huyenmy-hanh-trinh-cam-xuc.json', JSON.stringify(j, null, 2), 'application/json'));
}
