// Mục Tarot ở trang quản trị: hành trình từ vào trang tới đăng ký, các kiểu lời mời đăng ký, cảm xúc sau lá bài, quay lại và nhịp bốc.
import { esc, nf, pct, ci } from './admin-ui.js';
import { ring, barList, funnelChart } from './admin-viz.js';

const VARIANT_NAME = { none: 'Đối chứng (không hiện gì)', gift: 'Quà thời gian trò chuyện', corner: 'Mở Góc của tôi', voice: 'My mời trò chuyện', remind: 'Nhắc nhẹ ngày mai' };
const MIN_N = 100; // dưới mức này, chênh lệch giữa các kiểu dễ chỉ là ngẫu nhiên
const sign = (x) => `${x > 0 ? '+' : ''}${(x * 100).toFixed(1)} điểm %`;

function ctaTable(rows, title) {
  const ctl = rows.find((r) => r.v === 'none');
  const seen = rows.reduce((a, r) => a + r.shown, 0);
  if (!seen) return `<h3>${esc(title)}</h3><p class="muted">Chưa có ai thấy lời mời ở đây.</p>`;
  const best = rows.filter((r) => r.v !== 'none' && r.shown >= MIN_N && ctl?.shown >= MIN_N && r.liftVerified != null && r.liftVerified > 0).sort((a, b) => b.liftVerified - a.liftVerified)[0];
  const body = rows.map((r) => {
    const enough = r.shown >= MIN_N;
    const lift = r.v === 'none' ? '<span class="muted">mốc so sánh</span>' : r.liftVerified == null ? '<span class="muted">chưa có đối chứng</span>' : `${sign(r.liftVerified)}${enough && ctl?.shown >= MIN_N ? '' : ' <span class="muted">(chưa đủ mẫu)</span>'}`;
    return `<tr${best?.v === r.v ? ' class="best"' : ''}><td>${esc(VARIANT_NAME[r.v] ?? r.v)}${best?.v === r.v ? ' <span class="fn-w">đang dẫn đầu</span>' : ''}</td><td class="num">${nf.format(r.shown)}</td><td class="num">${r.v === 'none' ? '–' : nf.format(r.click)} <small class="muted">${r.v === 'none' ? '' : pct(r.clickRate)}</small></td><td class="num">${nf.format(r.submit)}</td><td class="num">${nf.format(r.verified)}</td><td class="num"><b>${pct(r.verifiedRate, 1)}</b><br><small class="muted">${r.shown ? ci(r.verifiedRate) : ''}</small></td><td class="num">${nf.format(r.chat)}</td><td>${lift}</td></tr>`;
  }).join('');
  return `<h3>${esc(title)}</h3><div class="scroll"><table><thead><tr><th>Kiểu lời mời</th><th class="num">Người thấy</th><th class="num">Bấm</th><th class="num">Nhập email</th><th class="num">Đăng ký xong</th><th class="num">Tỉ lệ đăng ký</th><th class="num">Nói câu đầu</th><th>So với đối chứng</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

const feelRow = (label, f) => `<tr><td>${esc(label)}</td><td class="num">${nf.format(f.n)}</td>${f.dist.slice().reverse().map((n) => `<td class="num">${nf.format(n)}</td>`).join('')}<td class="num"><b>${pct(f.positive)}</b><br><small class="muted">${f.n ? ci(f.positive) : ''}</small></td></tr>`;
const retRow = (r) => `<tr><td>${esc(r.label)}</td><td class="num">${nf.format(r.n)}</td>${['d1', 'd3', 'd7'].map((k) => `<td class="num"><b>${pct(r[k])}</b><br><small class="muted">${r[k].n ? `n=${r[k].n}` : 'chưa đủ ngày'}</small></td>`).join('')}</tr>`;

export function tarotBlock(t) {
  const top = t.journey[0]?.count || 0;
  const steps = t.journey.map((s) => ({ ...s, fromTop: top ? { p: Math.min(1, s.count / top), lo: null, hi: null, n: top } : null }));
  const f = t.feel;
  return `<section class="panel"><h2>Tarot: hành trình người dùng</h2>
    <p class="sub">Số người không trùng, theo khoảng ngày đang chọn. Hai bước đăng ký tính cho người đã thấy lời mời ở trang Tarot, kể cả nhóm đối chứng.</p>
    ${funnelChart(steps)}</section>
  <section class="panel"><h2>Lời mời đăng ký: kiểu nào hiệu quả hơn</h2>
    <p class="sub">Mỗi người được gán ngẫu nhiên một kiểu và ở lại kiểu đó; một nhóm đối chứng không thấy gì. Tỉ lệ đăng ký tính trên số người đã thấy kiểu đó, kể cả người không bấm, trong 14 ngày sau lần thấy. Cần ít nhất ${MIN_N} người mỗi kiểu mới đáng tin; dưới mức đó chỉ để theo dõi.</p>
    ${ctaTable(t.cta.tarot, 'Sau khi rút bài Tarot')}${ctaTable(t.cta.chart, 'Sau khi xem lá số ở trang Khám phá')}</section>
  <section class="panel"><h2>Cảm xúc sau khi xem lá bài</h2>
    <p class="sub">Người dùng chọn một trong bốn cảm xúc sau lá bài (tối đa một lần mỗi ngày). "Tích cực" là nhẹ nhõm hoặc tò mò. Đây là đánh giá tự nguyện nên chỉ phản ánh người chịu trả lời.</p>
    <div class="rings">${ring(f.all.n ? f.all.positive.p : null, { label: 'Tích cực chung', sub: f.all.n ? `${f.all.n} lượt` : 'chưa có dữ liệu', tone: 's1', w: f.all.positive })}${ring(f.daily.n ? f.daily.positive.p : null, { label: 'Lá của ngày', sub: `${f.daily.n} lượt`, tone: 's2', w: f.daily.positive })}${ring(f.three.n ? f.three.positive.p : null, { label: 'Trải ba lá', sub: `${f.three.n} lượt`, tone: 's3', w: f.three.positive })}</div>
    <div class="scroll"><table><thead><tr><th>Nhóm</th><th class="num">Lượt</th><th class="num">Nhẹ nhõm</th><th class="num">Tò mò</th><th class="num">Bình thường</th><th class="num">Băn khoăn</th><th class="num">Tích cực</th></tr></thead><tbody>${feelRow('Tất cả', f.all)}${feelRow('Lá của ngày', f.daily)}${feelRow('Trải ba lá', f.three)}${f.byStreak.map((r) => feelRow(r.label, r)).join('')}</tbody></table></div></section>
  <section class="panel"><h2>Quay lại sau lần đầu chạm vào Tarot</h2>
    <p class="sub">Tính từ ngày đầu tiên người đó mở Tarot: quay lại đúng ngày thứ 1, 3, 7 (ở bất kỳ trang nào của My). Chỉ tính người đã đủ ngày. So nhóm rút bài với nhóm chỉ xem, và nhóm thấy nhẹ nhõm với nhóm còn băn khoăn, để biết bốc bài và cảm xúc ảnh hưởng thế nào tới việc quay lại.</p>
    <div class="scroll"><table><thead><tr><th>Nhóm (theo ngày đầu)</th><th class="num">Người</th><th class="num">Sau 1 ngày</th><th class="num">Sau 3 ngày</th><th class="num">Sau 7 ngày</th></tr></thead><tbody>${t.returnBy.map(retRow).join('')}</tbody></table></div>
    <h3>Nhịp bốc bài và cảm xúc</h3>
    <div class="scroll"><table><thead><tr><th>Nhịp bốc</th><th class="num">Người</th><th class="num">Lượt cảm xúc</th><th class="num">Tích cực</th></tr></thead><tbody>${t.habit.map((h) => `<tr><td>${esc(h.label)}</td><td class="num">${nf.format(h.n)}</td><td class="num">${nf.format(h.feelN)}</td><td class="num"><b>${pct(h.positive)}</b><br><small class="muted">${h.feelN ? ci(h.positive) : ''}</small></td></tr>`).join('')}</tbody></table></div>
    <p class="note">Người rút nhiều ngày là người tự chọn quay lại, nên bảng nhịp bốc chỉ để mô tả. Muốn kết luận "bốc hàng ngày làm họ thấy tốt hơn" cần so sánh người cùng điều kiện, nên đọc kèm cột quay lại ở bảng trên.</p></section>
  <section class="panel"><h2>Tarot: chi tiết khác</h2><p class="sub">Số người, không trùng. "Rút lại" là người quay lại xem lá của ngày.</p>${barList([{ label: 'Vào trang', value: t.visitors }, { label: 'Rút ít nhất một lần', value: t.drew }, { label: 'Rút lá của ngày', value: t.daily }, { label: 'Trải ba lá', value: t.three }, { label: 'Quay lại xem lá hôm nay', value: t.returned }, { label: 'Xem từng lá trong bộ', value: t.browsed }, { label: 'Tải ảnh hoặc chia sẻ', value: t.shared }, { label: 'Bấm hỏi My về lá bài', value: t.asked }, { label: 'Bắt đầu nghi thức bốc bài', value: t.started }, ...t.topics.map((x) => ({ label: `Chủ đề đã chọn: ${x.topic}`, value: x.n })), { label: 'Bấm nút Tarot ở màn chào', value: t.ctaVeil }, { label: 'Bấm nút Tarot ở thanh trên', value: t.ctaTop }, { label: 'Được nhắc xem Tarot khi quay lại', value: t.nudged }, { label: 'Bấm "Rút lá hôm nay" ở lời nhắc', value: t.nudgeAccepted }], { tone: 's5', empty: 'Chưa có dữ liệu.' })}</section>`;
}
