// Biểu đồ và thẻ số liệu cho trang quản trị.
// Theo quy tắc của bảng màu đã kiểm: một hue cho một chuỗi, nét mảnh (đường 2px, thanh <= 24px, đầu thanh bo 4px), lưới mờ,
// khoảng hở 2px giữa các mảng, vòng bề mặt quanh chấm, nhãn chọn lọc, chữ luôn dùng màu chữ (không dùng màu dữ liệu), mỗi biểu đồ có bảng đi kèm.
// Mọi nhãn do người dùng nhập (mã giới thiệu, lĩnh vực...) đi qua esc() hoặc textContent.
import { esc, nf, pct, ci } from './admin-ui.js';

export const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)', 'var(--s8)'];
const tip = (...lines) => `data-tip="${esc(lines.filter((l) => l !== '' && l != null).join('\n'))}" tabindex="0"`;
const finite = (v) => Number.isFinite(+v) ? +v : 0;

// ---------- tooltip: một phần tử dùng chung, rê chuột, chạm hoặc focus bàn phím đều hiện ----------
let tipEl = null;
export function initViz() {
  if (tipEl) return;
  tipEl = Object.assign(document.createElement('div'), { className: 'vtip', hidden: true });
  tipEl.setAttribute('role', 'tooltip'); document.body.append(tipEl);
  const hideCross = () => document.querySelectorAll('.ac-cross').forEach((c) => c.setAttribute('visibility', 'hidden'));
  const show = (el, x, y) => {
    const t = el.getAttribute('data-tip'); if (!t) return;
    tipEl.replaceChildren(...t.split('\n').map((line, i) => Object.assign(document.createElement(i ? 'div' : 'b'), { textContent: line })));
    tipEl.hidden = false;
    const r = tipEl.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    tipEl.style.left = `${Math.max(8, Math.min(vw - r.width - 8, x - r.width / 2))}px`;
    tipEl.style.top = `${y - r.height - 14 < 8 ? y + 18 : y - r.height - 14}px`;
    const dx = el.getAttribute('data-x'), svg = el.ownerSVGElement;
    if (dx != null && svg) { const c = svg.querySelector('.ac-cross'); if (c) { c.setAttribute('x1', dx); c.setAttribute('x2', dx); c.setAttribute('visibility', 'visible'); } }
  };
  document.addEventListener('pointermove', (e) => { const el = e.target.closest?.('[data-tip]'); if (el) show(el, e.clientX, e.clientY); else { tipEl.hidden = true; hideCross(); } });
  document.addEventListener('pointerdown', (e) => { const el = e.target.closest?.('[data-tip]'); if (el) show(el, e.clientX, e.clientY); });
  document.addEventListener('focusin', (e) => { const el = e.target.closest?.('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', () => { tipEl.hidden = true; hideCross(); });
  addEventListener('scroll', () => { tipEl.hidden = true; }, { passive: true });
}

// ---------- thẻ số liệu: nhãn, con số, ghi chú, đường xu hướng ----------
/** Đường xu hướng nhỏ: 2px, chấm cuối có vòng bề mặt, vùng tô nhạt 10%. values: mảng số theo thứ tự thời gian. */
export function sparkline(values, { w = 120, h = 36 } = {}) {
  const v = values.map(finite), n = v.length;
  if (n < 2) return '';
  const max = Math.max(...v, 1), pad = 5, x = (i) => pad + (i / (n - 1)) * (w - 2 * pad), y = (a) => h - pad - (a / max) * (h - 2 * pad);
  const pts = v.map((a, i) => `${x(i).toFixed(1)},${y(a).toFixed(1)}`).join(' L');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path class="sp-a" d="M${x(0)},${h - pad} L${pts} L${x(n - 1)},${h - pad} Z"/><path class="sp-l" d="M${pts}" fill="none"/><circle class="sp-d" cx="${x(n - 1).toFixed(1)}" cy="${y(v[n - 1]).toFixed(1)}" r="4"/></svg>`;
}
/** tone: s1..s8. delta: {text, dir: 'up'|'down'|'flat'}; dir chỉ nói hướng, không phán tốt xấu. */
export function tile({ label, value, sub = '', spark = null, delta = null, tone = 's1', tipText = '' }) {
  const d = delta ? `<span class="dl ${delta.dir}"><i aria-hidden="true">${delta.dir === 'up' ? '▲' : delta.dir === 'down' ? '▼' : '■'}</i>${esc(delta.text)}</span>` : '';
  return `<div class="tile" style="--tc:var(--${tone})" ${tipText ? tip(label, tipText) : ''}><div class="tl">${esc(label)}</div><div class="tv">${value}</div>${d}${sub ? `<div class="ts">${sub}</div>` : ''}${spark ? sparkline(spark) : ''}</div>`;
}

// ---------- vòng tỉ lệ: một tỉ lệ so với 100% ----------
/** v: 0..1 hoặc null. w: khoảng tin cậy Wilson tùy chọn {lo, hi, n}. */
export function ring(v, { label, sub = '', tone = 's1', w = null } = {}) {
  const r = 34, C = 2 * Math.PI * r, p = v == null ? 0 : Math.max(0, Math.min(1, v)), txt = v == null ? '–' : `${Math.round(p * 100)}%`;
  const note = w?.n != null ? `KTC 95%: ${Math.round(w.lo * 100)}–${Math.round(w.hi * 100)}%, n=${nf.format(w.n)}` : '';
  return `<figure class="ring" style="--tc:var(--${tone})" ${tip(label, txt, note)}><svg viewBox="0 0 80 80" role="img" aria-label="${esc(label)}: ${esc(txt)}"><circle class="rg-t" cx="40" cy="40" r="${r}"/>${v == null ? '' : `<circle class="rg-a" cx="40" cy="40" r="${r}" stroke-dasharray="${(p * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 40 40)"/>`}<text class="rg-v" x="40" y="45" text-anchor="middle">${esc(txt)}</text></svg><figcaption><b>${esc(label)}</b><span>${sub}</span></figcaption></figure>`;
}

// ---------- thanh xếp hạng ----------
/** items: [{label, value, sub?, tip?}]. Một chuỗi một màu; giá trị ở đầu thanh nên không bao giờ bị cắt. */
export function barList(items, { tone = 's1', max = null, fmt = (v) => nf.format(v), empty = 'Chưa có dữ liệu.' } = {}) {
  if (!items.length) return `<p class="muted">${esc(empty)}</p>`;
  const top = max ?? Math.max(1, ...items.map((i) => finite(i.value)));
  return `<ul class="bl">${items.map((i) => `<li class="bl-i" ${tip(i.label, fmt(i.value), i.tip ?? '')}><div class="bl-h"><span class="bl-l">${esc(i.label)}</span><b class="bl-v">${esc(fmt(i.value))}</b></div><div class="bl-t"><i style="width:${Math.max(i.value > 0 ? 1.5 : 0, Math.min(100, (finite(i.value) / top) * 100)).toFixed(1)}%;background:var(--${tone})"></i></div>${i.sub ? `<div class="bl-s">${i.sub}</div>` : ''}</li>`).join('')}</ul>`;
}

// ---------- phễu: từng bước, tỉ lệ chuyển đổi, điểm rơi lớn nhất ----------
export function funnelChart(steps) {
  const top = steps[0]?.count || 1;
  let worst = -1, lost = 0;
  steps.forEach((s, i) => { if (i && s.fromPrev?.n >= 10) { const l = s.fromPrev.n * (1 - s.fromPrev.p); if (l > lost) { lost = l; worst = i; } } });
  const rows = steps.map((s, i) => {
    const conv = i && s.fromPrev?.p != null ? `<span class="fn-c"><i aria-hidden="true">↓</i> ${Math.round(s.fromPrev.p * 100)}% từ bước trước</span>` : '';
    const rest = i && s.fromTop?.p != null ? `<span class="fn-r">${(s.fromTop.p * 100).toFixed(1)}% so với đầu</span>` : '';
    const badge = i === worst ? `<span class="fn-w">điểm rơi lớn nhất</span>` : '';
    return `<li class="fn-i${i === worst ? ' worst' : ''}" ${tip(s.label, `${nf.format(s.count)} người`, i && s.fromPrev?.p != null ? `${ci(s.fromPrev)}` : '')}><div class="bl-h"><span class="fn-n">${i + 1}</span><span class="bl-l">${esc(s.label)}</span><b class="bl-v">${nf.format(s.count)}</b></div><div class="bl-t"><i style="width:${Math.max(s.count > 0 ? 1.5 : 0, (s.count / top) * 100).toFixed(1)}%;background:var(--s1)"></i></div><div class="fn-m">${conv}${rest}${badge}</div></li>`;
  }).join('');
  const table = steps.map((s, i) => `<tr><td>${esc(s.label)}</td><td class="num">${nf.format(s.count)}</td><td class="num">${i ? pct(s.fromPrev, 1) : '–'}</td><td class="muted">${i ? ci(s.fromPrev) : ''}</td><td class="num">${pct(s.fromTop, 1)}</td></tr>`).join('');
  return `<ol class="fn">${rows}</ol><details><summary>Xem dạng bảng, kèm khoảng tin cậy</summary><div class="scroll"><table><thead><tr><th>Bước</th><th class="num">Người</th><th class="num">Từ bước trước</th><th>Độ chắc chắn</th><th class="num">Từ đầu</th></tr></thead><tbody>${table}</tbody></table></div></details>`;
}

// ---------- biểu đồ đường theo ngày ----------
/** series: [{day, ...}]; keys: [[khóa, nhãn, màu]]. Vùng tô nhạt chỉ cho chuỗi đầu. Rộng theo màn hình. */
export function areaChart(series, keys, { label = 'Theo ngày' } = {}) {
  const vw = Math.max(280, Math.min(760, document.documentElement.clientWidth - 56)), narrow = vw < 520;
  const W = vw, H = narrow ? 190 : 240, L = narrow ? 30 : 40, R = 14, T = 12, B = 26, n = series.length;
  if (!n) return '<p class="muted">Chưa có dữ liệu theo ngày.</p>';
  const max = Math.max(5, ...series.flatMap((d) => keys.map(([k]) => finite(d[k])))), nice = Math.ceil(max / 5) * 5;
  const x = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R)), y = (v) => T + (1 - finite(v) / nice) * (H - T - B);
  const grid = [0, 0.5, 1].map((t) => { const v = Math.round(nice * t), yy = y(v); return `<line class="ac-g" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="ac-t" x="${L - 6}" y="${yy + 4}" text-anchor="end">${nf.format(v)}</text>`; }).join('');
  const step = Math.ceil(n / (narrow ? 4 : 7));
  const xt = series.map((d, i) => (i % step === 0 || i === n - 1 ? `<text class="ac-t" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(d.day.slice(5))}</text>` : '')).join('');
  const path = (k) => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' ');
  const area = `<path class="ac-a" style="fill:${keys[0][2]}" d="${path(keys[0][0])} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z"/>`;
  const lines = keys.map(([k, , c]) => `<path class="ac-l" style="stroke:${c}" d="${path(k)}" fill="none"/>`).join('');
  const ends = keys.map(([k, , c]) => `<circle class="ac-d" style="fill:${c}" cx="${x(n - 1).toFixed(1)}" cy="${y(series[n - 1][k]).toFixed(1)}" r="4"/>`).join('');
  const cw = n > 1 ? (W - L - R) / (n - 1) : W - L - R;
  const hits = series.map((d, i) => `<rect class="ac-h" x="${(x(i) - cw / 2).toFixed(1)}" y="${T}" width="${cw.toFixed(1)}" height="${H - T - B}" data-x="${x(i).toFixed(1)}" ${tip(d.day, ...keys.map(([k, l]) => `${l}: ${nf.format(finite(d[k]))}`))}/>`).join('');
  const legend = `<div class="legend">${keys.map(([, l, c]) => `<span><i style="background:${c}"></i>${esc(l)}</span>`).join('')}</div>`;
  const table = series.map((d) => `<tr><td>${esc(d.day)}</td>${keys.map(([k]) => `<td class="num">${nf.format(finite(d[k]))}</td>`).join('')}</tr>`).join('');
  return `${legend}<div class="chart"><svg class="ac" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><g>${grid}${xt}${area}${lines}${ends}</g><line class="ac-cross" y1="${T}" y2="${H - B}" visibility="hidden"/><g>${hits}</g></svg></div>
    <details><summary>Xem dạng bảng</summary><div class="scroll"><table><thead><tr><th>Ngày</th>${keys.map(([, l]) => `<th class="num">${esc(l)}</th>`).join('')}</tr></thead><tbody>${table}</tbody></table></div></details>`;
}

// ---------- giữ chân theo ngày: bản đồ nhiệt một hue ----------
export function cohortHeat(rows) {
  if (!rows.length) return '<p class="muted">Chưa có nhóm người mới nào đủ ngày để tính.</p>';
  const cell = (v, day, col, n) => v == null ? `<td class="ch-n">–</td>` : `<td class="ch-c" style="--a:${Math.round(Math.min(1, v / 0.5) * 62)}%" ${tip(`${day}: ${col}`, `${(v * 100).toFixed(0)}% của ${n} người`)}>${(v * 100).toFixed(0)}%</td>`;
  return `<div class="scroll"><table class="ch"><thead><tr><th>Ngày đầu</th><th class="num">Người</th><th>Sau 1 ngày</th><th>Sau 3 ngày</th><th>Sau 7 ngày</th></tr></thead><tbody>${rows.map((c) => `<tr><td>${esc(c.day)}</td><td class="num">${c.n}</td>${cell(c.d1, c.day, 'sau 1 ngày', c.n)}${cell(c.d3, c.day, 'sau 3 ngày', c.n)}${cell(c.d7, c.day, 'sau 7 ngày', c.n)}</tr>`).join('')}</tbody></table></div>
    <p class="note">Màu đậm dần theo tỉ lệ quay lại. Ô trống là chưa đủ ngày để biết.</p>`;
}

// ---------- NPS: thanh phân kỳ theo thang đã sắp xếp ----------
export function npsBar(n) {
  if (!n.n) return '<p class="muted">Chưa có ai chấm điểm giới thiệu.</p>';
  const segs = [['Chưa hài lòng (0-6)', n.detractors, 'var(--s8)'], ['Trung lập (7-8)', n.passives, 'var(--axis)'], ['Ủng hộ (9-10)', n.promoters, 'var(--s1)']];
  return `<div class="nps"><div class="nps-s"><b>${n.score ?? '–'}</b><span>NPS · ${nf.format(n.n)} người chấm</span></div>
    <div class="stack" role="img" aria-label="Phân bố điểm giới thiệu">${segs.map(([l, v, c]) => `<span style="flex:${Math.max(v, 0.0001)};background:${c}" ${tip(l, `${v} người (${Math.round((v / n.n) * 100)}%)`)}></span>`).join('')}</div>
    <div class="stackkey">${segs.map(([l, v, c]) => `<span><i style="background:${c}"></i>${esc(l)} ${Math.round((v / n.n) * 100)}%</span>`).join('')}</div></div>`;
}

/** Mức độ đúng: ba mức một hue (sáng đến đậm), có chú giải. dist: [chưa đúng, gần đúng, rất đúng]. */
export function agreeBar(dist) {
  const tot = dist.reduce((a, b) => a + b, 0);
  if (!tot) return '<p class="muted">Chưa có ai đánh giá độ đúng.</p>';
  const names = ['Chưa đúng lắm', 'Gần đúng', 'Rất đúng'], cols = ['var(--seq2)', 'var(--seq3)', 'var(--seq4)'];
  return `<div class="stack" role="img" aria-label="Phân bố đánh giá độ đúng">${dist.map((v, i) => `<span style="flex:${Math.max(v, 0.0001)};background:${cols[i]}" ${tip(names[i], `${v} người (${Math.round((v / tot) * 100)}%)`)}></span>`).join('')}</div>
    <div class="stackkey">${dist.map((v, i) => `<span><i style="background:${cols[i]}"></i>${names[i]} ${Math.round((v / tot) * 100)}% (${v})</span>`).join('')}</div>`;
}

/** Cảm nhận giá: bốn mức rẻ, hợp lý, hơi đắt, quá đắt. Hai cực khác hue, giữa là xám. */
export function feelBar(feel) {
  const tot = feel.reduce((a, b) => a + b, 0);
  if (!tot) return '<span class="muted">Chưa có ai trả lời</span>';
  const names = ['Rẻ', 'Hợp lý', 'Hơi đắt', 'Quá đắt'], cols = ['var(--s1)', 'var(--seq2)', 'var(--axis)', 'var(--s8)'];
  return `<div class="stack mini" role="img" aria-label="Cảm nhận giá">${feel.map((v, i) => `<span style="flex:${Math.max(v, 0.0001)};background:${cols[i]}" ${tip(names[i], `${v} người`)}></span>`).join('')}</div><div class="stackkey tiny">${feel.map((v, i) => `<span><i style="background:${cols[i]}"></i>${names[i]} ${v}</span>`).join('')}</div>`;
}
