// Thành phần dùng chung cho trang quản trị: định dạng số, nhãn tiếng Việt, biểu đồ SVG, tải tệp.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const nf = new Intl.NumberFormat('vi-VN');
export const pct = (w, d = 0) => (w?.p == null ? '–' : `${(w.p * 100).toFixed(d)}%`);
export const ci = (w) => (w?.p == null ? '' : `KTC 95%: ${Math.round(w.lo * 100)}–${Math.round(w.hi * 100)}%, n=${nf.format(w.n)}`);
export const fx = (v, d = 1) => (v == null || !Number.isFinite(+v) ? '–' : (+v).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: d }));
export const sgn = (v, d = 2) => (v == null ? '–' : `${v > 0 ? '+' : ''}${fx(v, d)}`);
export const ciText = (c) => (c?.mean == null ? 'chưa đủ dữ liệu' : `${sgn(c.mean)}${c.lo != null ? ` (KTC 95%: ${sgn(c.lo)} đến ${sgn(c.hi)})` : ''}, n=${c.n}`);

export const FIELD = { biz: 'Kinh doanh, tài chính', tech: 'Công nghệ', edu: 'Giáo dục, nghiên cứu', health: 'Y tế, chăm sóc', art: 'Sáng tạo, truyền thông', gov: 'Nhà nước, luật', sport: 'Thể thao', student: 'Học sinh, sinh viên' };
export const GENDER = { nam: 'Nam', nu: 'Nữ', khac: 'Không nói' };
export const DEVICE = { mobile: 'Điện thoại', tablet: 'Máy tính bảng', desktop: 'Máy tính' };
export const TONE = {
  binh_thuong: 'Dịu dàng', lang_nghe: 'Chăm chú lắng nghe', vui: 'Rạng rỡ', cuoi_tit: 'Cười tít', hao_hung: 'Hào hứng', buon: 'Buồn cùng bạn', dong_cam: 'Đồng cảm', xuc_dong: 'Xúc động',
  chia_se: 'Mở lòng chia sẻ', tran_tro: 'Trăn trở', chiem_nghiem: 'Trầm tư', suy_nghi: 'Cân nhắc', ngac_nhien: 'Ngạc nhiên', e_then: 'E thẹn', an_ui: 'Dỗ dành', khich_le: 'Cổ vũ', tinh_nghich: 'Tinh nghịch', nghiem_tuc: 'Nghiêm túc',
};
export const MOOD = ['', 'Nặng nề', 'Hơi chùng', 'Bình thường', 'Khá nhẹ', 'Nhẹ nhõm'];
export const EMO_COLOR = { buon: '#4a6fb5', lo_au: '#c9803a', gian: '#c0463f', co_don: '#6c5aa8', met_moi: '#8a8680', boi_roi: '#a79a6a', trung_tinh: '#b9b8ae', hy_vong: '#4fa4c9', nhe_long: '#43a98a', vui: '#e0a82e', biet_on: '#d77aa5' };

export function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export const csvCell = (v) => { const s = v == null ? '' : typeof v === 'boolean' ? (v ? 'có' : 'không') : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCsv = (cols, rows) => '﻿' + cols.map((c) => csvCell(c.label)).join(',') + '\n' + rows.map((r) => cols.map((c) => csvCell(r[c.key])).join(',')).join('\n');

/** Đường trung bình kèm dải khoảng tin cậy qua các mốc. pts: [{x, mean, lo, hi, n}] */
export function bandChart(pts, { min = -2, max = 2, label = 'Sắc thái', zero = true, color = 'var(--s1)' } = {}) {
  const W = 720, H = 220, L = 44, R = 16, T = 12, B = 30, n = pts.length;
  const x = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R)), y = (v) => T + (1 - (Math.max(min, Math.min(max, v)) - min) / (max - min)) * (H - T - B);
  const ticks = [min, (min + max) / 2, max].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" fill="var(--muted)" font-size="11">${fx(v, 1)}</text>`).join('');
  const zeroLine = zero && min < 0 && max > 0 ? `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--axis)" stroke-dasharray="4 3"/>` : '';
  const ok = pts.map((p, i) => ({ ...p, i })).filter((p) => p.mean != null && p.n > 0);
  const band = ok.filter((p) => p.lo != null);
  const area = band.length > 1 ? `<path d="M${band.map((p) => `${x(p.i)},${y(p.hi)}`).join(' L')} L${[...band].reverse().map((p) => `${x(p.i)},${y(p.lo)}`).join(' L')} Z" fill="${color}" opacity=".16"/>` : '';
  const line = ok.length > 1 ? `<polyline fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" points="${ok.map((p) => `${x(p.i)},${y(p.mean)}`).join(' ')}"/>` : '';
  const dots = ok.map((p) => `<circle cx="${x(p.i)}" cy="${y(p.mean)}" r="${Math.min(7, 3 + Math.sqrt(p.n) / 3)}" fill="${color}" stroke="var(--surface)" stroke-width="2"><title>${esc(p.x)}: ${label} ${sgn(p.mean)}${p.lo != null ? ` (KTC ${sgn(p.lo)} đến ${sgn(p.hi)})` : ''}, n=${p.n}</title></circle>`).join('');
  const xt = pts.map((p, i) => `<text x="${x(i)}" y="${H - 9}" text-anchor="middle" fill="var(--muted)" font-size="11">${esc(p.x)}</text>`).join('');
  const table = pts.map((p) => `<tr><td>${esc(p.x)}</td><td class="num">${p.n}</td><td class="num">${sgn(p.mean)}</td><td class="muted">${p.lo != null ? `${sgn(p.lo)} đến ${sgn(p.hi)}` : '–'}</td></tr>`).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)} theo mốc">${ticks}${zeroLine}${area}${line}${dots}${xt}</svg></div>
    <details><summary>Xem dạng bảng</summary><div class="scroll"><table><thead><tr><th>Mốc</th><th class="num">Số lượt</th><th class="num">${esc(label)}</th><th>Khoảng tin cậy 95%</th></tr></thead><tbody>${table}</tbody></table></div></details>`;
}

/** Thanh phân kỳ quanh số 0 cho độ chênh, kèm khoảng tin cậy. rows: [{name, mean, lo, hi, n}] */
export function divergeBars(rows, { span = 1.5, unit = '' } = {}) {
  if (!rows.length) return '<p class="muted">Chưa đủ dữ liệu (cần tối thiểu 5 lượt mỗi mục).</p>';
  const pos = (v) => 50 + (Math.max(-span, Math.min(span, v)) / span) * 50;
  return `<div class="dv">${rows.map((r) => {
    const a = pos(Math.min(0, r.mean)), b = pos(Math.max(0, r.mean)), good = r.mean >= 0;
    const w = r.lo != null ? `<i class="whisk" style="left:${pos(r.lo)}%;width:${pos(r.hi) - pos(r.lo)}%"></i>` : '';
    return `<div class="dvr"><div class="dvn">${esc(r.name)}</div><div class="dvb"><i class="mid"></i><i class="bar ${good ? 'up' : 'dn'}" style="left:${a}%;width:${Math.max(0.6, b - a)}%"></i>${w}</div><div class="dvv">${sgn(r.mean)}${unit}<span class="muted"> n=${r.n}</span></div></div>`;
  }).join('')}</div>`;
}

/** Thanh xếp chồng cho phân bố nhóm. items: [{label, n, color}] */
export function stackBar(items, total = items.reduce((s, i) => s + i.n, 0)) {
  const t = total || 1;
  return `<div class="stack" role="img" aria-label="Phân bố">${items.map((i) => `<span style="flex:${i.n};background:${i.color}" title="${esc(i.label)}: ${i.n}"></span>`).join('')}</div>
    <div class="stackkey">${items.map((i) => `<span><i style="background:${i.color}"></i>${esc(i.label)} ${Math.round((i.n / t) * 100)}% (${i.n})</span>`).join('')}</div>`;
}

export const GREET = { goc: 'Gốc: người lữ khách', an_tam: 'An tâm: không cần vội', am_ap: 'Ấm áp: chào theo giờ', minh_bach: 'Minh bạch: My là AI' };
