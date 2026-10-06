// Hình lá số dùng chung cho ứng dụng (bảng ☯) và trang Khám phá mẫu: các tab Tóm tắt, 12 cung, Thời vận, Tử Vi, Tứ Trụ, Chiêm tinh, Thần số.
// "Mức chú ý" (nhẹ/vừa/nhiều) chỉ đếm số yếu tố đang kích hoạt một lĩnh vực theo quy tắc cổ truyền, không phải điểm tốt xấu (xem src/engine/thoivan.js).
import { HANH, CHI } from './engine/bazi.js';
import { conventionsFor, compareTuVi, CUC_OPTIONS, LEAP_RULES } from './engine/doichieu.js';
import { CUNG_TEN } from './engine/tuvi.js';
import { NUMBER_KEYWORDS, PERSONAL_YEAR_THEME } from './engine/numerology.js';
import { tuViForYou, HOW_TUTRU, HOW_ASTRO, HOW_THANSO } from './chart-explain.js';
import { natalAttention, lifeStages, timeCycle, timeline, LEVELS, CUNG_DOI_THUONG } from './engine/thoivan.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ELC = { Kim: '#f1ead2', Mộc: '#7fe3a0', Thủy: '#6fb7ff', Hỏa: '#ff8a5c', Thổ: '#e0b86a' };
const el = (hanh) => `<span class="${hanh}">${hanh}</span>`;
const cell = (k, v, d = '') => `<div class="cell"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;

function tabTuTru(c) {
  const b = c.bazi;
  const pill = (label, pl, dm) => pl
    ? `<div class="pillar ${dm ? 'dm' : ''}"><div class="lbl">${label}</div><div class="nm">${pl.name}</div><div class="el">${el(pl.hanhCan)} · ${el(pl.hanhChi)}</div></div>`
    : `<div class="pillar"><div class="lbl">${label}</div><div class="nm"> - </div><div class="el">không rõ giờ</div></div>`;
  const max = Math.max(...Object.values(b.elements.counts), 1);
  const bars = HANH.map((k) => `<div class="bar"><span class="${k}">${k}</span><i><b style="width:${(b.elements.counts[k] / max) * 100}%;background:${ELC[k]}"></b></i><span>${b.elements.counts[k]}</span></div>`).join('');
  return `<h3>Tứ Trụ <small>theo tiết khí thật · tầng Tính toán</small></h3>${HOW_TUTRU(b)}
    <div class="pillars">${pill('Giờ', b.pillars.hour)}${pill('Ngày', b.pillars.day, true)}${pill('Tháng', b.pillars.month)}${pill('Năm', b.pillars.year)}</div>
    <p class="sub" style="margin-top:10px">Nhật chủ <b>${b.dayMaster.can}</b> (${el(b.dayMaster.hanh)}, ${b.dayMaster.yang ? 'dương' : 'âm'}) · sinh tháng ${b.pillars.month.chi}, ${b.elements.inSeason ? 'đắc lệnh' : 'không đắc lệnh'} · thân ${b.elements.strength} <i>(tham khảo)</i><br>Nạp âm năm: <b>${b.napAmYear.name}</b> - ${b.napAmYear.image}${c.cungMenh ? ` · Cung mệnh: <b>${c.cungMenh.name}</b> (${el(c.cungMenh.hanh)}, ${c.cungMenh.nhom})` : ''}</p>
    <h3>Ngũ hành <small>can + chi chính khí</small></h3><div class="bars">${bars}</div>
    <p class="sub" style="margin-top:8px">${b.elements.missing.length ? 'Vắng: ' + b.elements.missing.map(el).join(', ') + '. ' : 'Đủ cả năm hành. '}Trội: ${el(b.elements.dominant)}.${b.elements.balancing.length ? ' Hướng cân bằng gợi ý: ' + b.elements.balancing.map(el).join(' / ') + '.' : ''}</p>`;
}

function tabTuVi(c, profile) {
  const t = c.tuvi;
  if (!t) return `<h3>Tử Vi Đẩu Số</h3><p class="sub">Chưa lập được: cần giờ sinh và giới tính nam/nữ (để xác định chiều đại hạn). Ngày sinh âm lịch của bạn: ${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? ' nhuận' : ''}/${c.lunar.year}.</p>`;
  // Bố cục 4×4 truyền thống: Tỵ Ngọ Mùi Thân / Thìn … Dậu / Mão … Tuất / Dần Sửu Tý Hợi
  const order = [5, 6, 7, 8, 4, null, null, 9, 3, null, null, 10, 2, 1, 0, 11];
  const cellHtml = (pos) => {
    const p = t.palaces[pos];
    const stars = p.chinh.map((s) => `<b class="chinh">${s}</b>`).join('');
    const rest = [...p.phu].map((s) => `<span>${s}</span>`).join('') + p.sat.map((s) => `<span class="sat">${s}</span>`).join('');
    return `<div class="tv ${pos === t.menh ? 'menh' : ''}"><div class="tv-h"><i>${p.can} ${p.chi}</i><em>${p.name}${p.isThan ? ' · Thân' : ''}</em></div>
      <div class="tv-s">${stars || '<span class="dim">vô chính diệu</span>'}</div><div class="tv-o">${rest}</div>
      <div class="tv-f">${p.hoa.map((h) => `<u class="${h.slice(5)}">${h}</u>`).join('')}<span>${p.truongSinh}</span>${p.daiHan ? `<span>${p.daiHan[0]}-${p.daiHan[1]}</span>` : ''}</div></div>`;
  };
  const center = `<div class="tv-c"><h4>${esc(profile.nickname)}</h4><p>Âm lịch ${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? ' nhuận' : ''}/${t.lunar.year}<br>${t.lunar.canChiYear}</p><p><b>${t.cuc.ten}</b><br>${t.amDuong}</p><p>Thân cư ${t.thanCu}</p></div>`;
  const grid = order.map((pos, i) => pos === null ? (i === 5 ? center : '') : cellHtml(pos)).join('');
  return `<h3>Tử Vi Đẩu Số <small>âm lịch Việt Nam · tầng Tính toán</small></h3>${tuViForYou(t)}<div class="tv-grid">${grid}</div>
    <p class="sub" style="margin-top:10px">Tứ Hóa năm ${t.lunar.canChiYear.split(' ')[0]}: ${Object.entries(t.hoaAt).map(([h, v]) => `${h} → <b>${v.star}</b> (${t.palaces[v.pos].name})`).join(' · ')}.${t.menhVoChinhDieu ? ' Cung Mệnh vô chính diệu: xem sao cung Thiên Di.' : ''}</p>`;
}

const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
/** Bánh xe hoàng đạo: 12 cung quanh vòng ngoài, hành tinh là các chấm. Cung mọc đặt bên trái nếu biết giờ và nơi sinh. */
function zodiacWheel(a) {
  const S0 = 320, cx = S0 / 2, cy = S0 / 2, R = 148, r2 = 118, r3 = 100;
  const ascLon = a.asc ? a.asc.index * 30 + a.asc.degree : 0;
  const pt = (lon, r) => { const th = Math.PI + ((lon - ascLon) * Math.PI) / 180; return [cx + r * Math.cos(th), cy - r * Math.sin(th)]; };
  const seg = Array.from({ length: 12 }, (_, i) => {
    const [x1, y1] = pt(i * 30, r2), [x2, y2] = pt(i * 30, R), [gx, gy] = pt(i * 30 + 15, (R + r2) / 2);
    const warm = ['Lửa', 'Khí'].includes(['Lửa', 'Đất', 'Khí', 'Nước'][i % 4]);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" opacity=".3"/><text x="${gx}" y="${gy + 5}" text-anchor="middle" font-size="15" fill="currentColor" opacity="${warm ? '.9' : '.7'}">${SIGN_GLYPH[i]}︎</text>`;
  }).join('');
  const dots = a.planets.map((p) => {
    const [x, y] = pt(p.lon, r3 - (['Sun', 'Moon'].includes(p.key) ? 0 : 6)), big = ['Sun', 'Moon'].includes(p.key);
    return `<g><circle cx="${x}" cy="${y}" r="${big ? 7 : 4.5}" fill="${p.key === 'Sun' ? '#f1c65b' : p.key === 'Moon' ? '#cfd8ff' : '#8ab4ff'}" stroke="#0007"><title>${p.name}: ${p.sign} ${p.degree}°${p.house ? `, nhà ${p.house}` : ''}</title></circle></g>`;
  }).join('');
  const ascMark = a.asc ? `<line x1="${cx - R - 8}" y1="${cy}" x2="${cx - r2 + 6}" y2="${cy}" stroke="#f1c65b" stroke-width="2.5"/><text x="${cx - R - 8}" y="${cy - 8}" font-size="10.5" fill="#f1c65b">ASC</text>` : '';
  return `<svg class="wheel" viewBox="0 0 ${S0} ${S0}" role="img" aria-label="Bánh xe lá số chiêm tinh"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" opacity=".45"/><circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="currentColor" opacity=".3"/>${seg}${ascMark}${dots}</svg><p class="wlegend"><span><i style="background:#f1c65b"></i>Mặt Trời</span><span><i style="background:#cfd8ff"></i>Mặt Trăng</span><span><i style="background:#8ab4ff"></i>Hành tinh khác</span>${a.asc ? '<span><i class="ln"></i>Cung mọc (ASC)</span>' : ''}</p>`;
}

/** Tóm tắt trực quan, nói bằng lời thường: ai chỉ quen một hệ vẫn theo dõi được, và biết nên nhìn vào đâu. */
function tabOverview(c) {
  const b = c.bazi, a = c.astro, n = c.numerology, t = c.tuvi;
  const pil = (label, pl) => pl ? `<div class="pillar"><div class="lbl">${label}</div><div class="nm">${pl.name}</div><div class="el">${el(pl.hanhCan)} · ${el(pl.hanhChi)}</div></div>` : `<div class="pillar"><div class="lbl">${label}</div><div class="nm"> - </div><div class="el">không rõ giờ</div></div>`;
  const max = Math.max(...Object.values(b.elements.counts), 1);
  const bars = HANH.map((k) => `<div class="bar"><span class="${k}">${k}</span><i><b style="width:${(b.elements.counts[k] / max) * 100}%;background:${ELC[k]}"></b></i><span>${b.elements.counts[k]}</span></div>`).join('');
  const menh = t ? t.palaces[t.menh] : null;
  const card = (title, hint, body, tab) => `<section class="ov"><div class="ovh"><h4>${title}</h4><button class="btn sm" data-goto="${tab}">Xem chi tiết</button></div><p class="hint">${hint}</p>${body}</section>`;
  return `<p class="sub">Bốn cách nhìn, mỗi cách một khung. My khuyên chọn <b>một</b> cách bạn thấy gần nhất để theo dõi, đừng cố đọc hết cùng lúc.</p><div class="ovgrid">
    ${card('Tứ Trụ', `Nhật chủ là hành đại diện cho chính bạn: <b>${b.dayMaster.can} (${b.dayMaster.hanh}, ${b.dayMaster.yang ? 'dương' : 'âm'})</b>. Năm hành bên dưới cho thấy hành nào nhiều, hành nào ít.`, `<div class="pillars">${pil('Giờ', b.pillars.hour)}${pil('Ngày', b.pillars.day)}${pil('Tháng', b.pillars.month)}${pil('Năm', b.pillars.year)}</div><div class="bars" style="margin-top:8px">${bars}</div>`, 'tutru')}
    ${card('Chiêm tinh', `Mặt Trời <b>${a.sun.name}</b> (con người bên ngoài), Mặt Trăng <b>${a.moon.name}${a.moonUncertain ? ' ?' : ''}</b> (cảm xúc bên trong)${a.asc ? `, cung mọc <b>${a.asc.name}</b> (ấn tượng đầu tiên)` : ''}.`, zodiacWheel(a), 'astro')}
    ${card('Tử Vi', menh ? `Cung Mệnh (góc nhìn về con người bạn) có ${menh.chinh.length ? `sao <b>${menh.chinh.join(', ')}</b>` : 'chưa có sao chính (vô chính diệu)'}. Trong hình, ô Mệnh có viền sáng.` : 'Cần giờ sinh và giới tính nam/nữ để lập lá số Tử Vi.', menh ? `<div class="tvmini"><b>${menh.can} ${menh.chi}</b> · ${esc(t.cuc.ten)} · ${esc(t.amDuong)}</div>` : '', 'tuvi')}
    ${card('Thần số học', `Số chủ đạo <b>${n.lifePath}</b>: ${NUMBER_KEYWORDS[n.lifePath]}.`, `<div class="bignum">${n.lifePath}</div>`, 'thanso')}
  </div>`;
}

function tabAstro(c) {
  const a = c.astro;
  const rows = a.planets.map((p) => `<tr><td>${p.name}</td><td>${p.sign}${p.uncertain ? ' ?' : ''}</td><td>${p.degree}°${p.retrograde ? ' ℞' : ''}</td><td>${p.house ? 'Nhà ' + p.house : '-'}</td></tr>`).join('');
  return `<h3>Chiêm tinh <small>tropical · astronomy-engine · nhà cung nguyên</small></h3>${HOW_ASTRO(a)}${zodiacWheel(a)}
    <div class="grid">
      ${cell('Mặt Trời', a.sun.name + (a.sunUncertain ? ' ?' : ''), `${a.sun.element} · ${a.sun.degree}°`)}
      ${cell('Mặt Trăng', a.moon.name + (a.moonUncertain ? ' ?' : ''), a.moonUncertain ? 'thiếu giờ sinh nên chưa chắc' : `${a.moon.element} · ${a.moon.degree}°`)}
      ${cell('Cung mọc', a.asc ? a.asc.name : '-', a.asc ? `${a.asc.element} · ${a.asc.degree}°` : 'cần giờ và nơi sinh')}
    </div>
    <table class="tbl"><thead><tr><th>Thiên thể</th><th>Cung</th><th>Độ</th><th>Nhà</th></tr></thead><tbody>${rows}</tbody></table>
    ${a.aspects.length ? `<p class="sub" style="margin-top:10px">Góc chiếu chặt: ${a.aspects.slice(0, 6).map((x) => `${x.a} ${x.type.toLowerCase()} ${x.b}`).join(' · ')}.</p>` : ''}`;
}

function tabThanSo(c) {
  const n = c.numerology;
  return `<h3>Thần số học <small>Pythagoras · tên bỏ dấu</small></h3>${HOW_THANSO(n, NUMBER_KEYWORDS)}<div class="grid">
    ${cell('Chủ đạo', n.lifePath, NUMBER_KEYWORDS[n.lifePath])}${cell('Biểu đạt', n.expression, NUMBER_KEYWORDS[n.expression])}
    ${cell('Linh hồn', n.soul, NUMBER_KEYWORDS[n.soul])}${cell('Nhân cách', n.personality, NUMBER_KEYWORDS[n.personality])}
    ${cell('Năm cá nhân ' + c.thisYear.year, n.personalYear, PERSONAL_YEAR_THEME[n.personalYear])}</div>`;
}


// ---------------- radar 12 cung ----------------
const lvName = (i) => LEVELS[i];
const pill = (i) => `<span class="lvl lv${i}">mức chú ý ${lvName(i)}</span>`;
const byCung = (arr) => CUNG_TEN.map((n) => arr.find((x) => x.name === n));
const fmtD = (x) => `${x.d}/${x.m}`;
const tagList = (tags) => (tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="sub">Không có yếu tố nổi bật nào rơi vào cung này.</p>');

/** items: 12 cung theo thứ tự Mệnh…Huynh Đệ, mỗi mục {name, level}. overlay: lớp nền mờ (ví dụ lá số gốc khi xem một năm). */
function radar(items, { overlay = null, sel = 0, mark = null, label = 'Biểu đồ radar 12 cung theo mức chú ý' } = {}) {
  const W = 380, cx = W / 2, cy = W / 2, R = 118, rad = (lv) => R * (0.34 + 0.33 * lv), ang = (i) => ((-90 + i * 30) * Math.PI) / 180;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = (arr) => arr.map((c, i) => pt(i, rad(c.level)).map((n) => n.toFixed(1)).join(',')).join(' ');
  const rings = [0, 1, 2].map((l) => `<circle class="rd-ring" cx="${cx}" cy="${cy}" r="${rad(l).toFixed(1)}"/><text class="rd-lv" x="${(pt(0.5, rad(l))[0]).toFixed(1)}" y="${(pt(0.5, rad(l))[1] + 3).toFixed(1)}" text-anchor="middle">${lvName(l)}</text>`).join('');
  const axes = items.map((_, i) => { const [x, y] = pt(i, R); return `<line class="rd-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('');
  const hits = items.map((c, i) => {
    const [x, y] = pt(i, rad(c.level)), [lx, ly] = pt(i, R + 17), co = Math.cos(ang(i)), anchor = co > 0.3 ? 'start' : co < -0.3 ? 'end' : 'middle';
    return `<g class="rd-hit${i === sel ? ' sel' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="${esc(c.name)}: mức chú ý ${lvName(c.level)}${mark === i ? ', cung đại hạn hiện tại' : ''}">
      <circle class="rd-touch" cx="${((x + lx) / 2).toFixed(1)}" cy="${((y + ly) / 2).toFixed(1)}" r="26"/>
      <circle class="rd-pt lv${c.level}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === sel ? 8 : 5.5}"/>
      <text class="rd-lbl" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}">${esc(c.name)}${mark === i ? ' ◆' : ''}</text></g>`;
  }).join('');
  return `<svg class="radar" viewBox="0 0 ${W} ${W}" role="group" aria-label="${esc(label)}">${rings}${axes}
    ${overlay ? `<polygon class="rd-area base" points="${poly(overlay)}"/>` : ''}<polygon class="rd-area" points="${poly(items)}"/>${hits}</svg>`;
}

// ---------------- tab 12 cung (bẩm sinh) ----------------
function tab12(c, profile, st, ctx) {
  const t = c.tuvi;
  if (!t) return `<h3>12 cung <small>mức chú ý</small></h3><p class="sub">Cần giờ sinh và giới tính nam/nữ để lập 12 cung Tử Vi. Bạn vẫn xem được thời vận theo Tứ Trụ và thần số ở tab Thời vận.</p>`;
  const items = byCung(natalAttention(t)), now = ctx.now.getFullYear(), age = now - t.lunar.year + 1;
  const dai = t.palaces.find((p) => p.daiHan && age >= p.daiHan[0] && age <= p.daiHan[1]);
  const mark = dai ? CUNG_TEN.indexOf(dai.name) : null;
  if (st.cung == null) st.cung = items.reduce((b, x, i) => (x.score > items[b].score ? i : b), 0);
  const sel = items[st.cung], ranked = [...items].sort((a, b) => b.score - a.score || CUNG_TEN.indexOf(a.name) - CUNG_TEN.indexOf(b.name));
  const askText = `My nói giúp mình về cung ${sel.name} (${CUNG_DOI_THUONG[sel.name]}) trong lá số của mình nhé.`;
  return `<h3>12 cung <small>mức chú ý bẩm sinh · tầng Tính toán và Truyền thống</small></h3>
    <p class="sub">Mỗi cung là một lĩnh vực của đời sống. Radar cho thấy lĩnh vực nào có nhiều yếu tố nổi bật theo Tử Vi. <b>Đây không phải điểm tốt xấu</b>: mức "nhiều" nghĩa là đáng dành thêm sự chú tâm, mức "nhẹ" nghĩa là ít điểm nhấn, không có nghĩa là suôn sẻ. Chạm vào một điểm để xem.</p>
    <div class="rd-wrap">${radar(items, { sel: st.cung, mark })}</div>
    ${mark != null ? `<p class="sub rd-legend">◆ là cung đại hạn bạn đang đi (${dai.daiHan[0]}-${dai.daiHan[1]} tuổi), nền chung của khoảng mười năm này.</p>` : ''}
    <div class="rd-detail"><div class="rd-dh"><h4>${esc(sel.name)}</h4>${pill(sel.level)}</div><p class="sub">${esc(CUNG_DOI_THUONG[sel.name])}</p>${tagList(sel.tags)}${askBox(askText, `Hỏi My về cung ${sel.name}`, ctx)}</div>
    <h3>Xếp theo mức chú ý</h3><div class="rd-rank">${ranked.map((x) => `<button type="button" class="rd-row" data-i="${CUNG_TEN.indexOf(x.name)}"><b>${esc(x.name)}</b><span>${esc(CUNG_DOI_THUONG[x.name])}</span>${pill(x.level)}</button>`).join('')}</div>
    <h3>Các giai đoạn đời <small>đại hạn, mười năm một cung</small></h3>
    <div class="stages">${lifeStages(t, ctx.now).map((s) => `<div class="stage${s.current ? ' cur' : ''}"><i>${s.from}-${s.to} tuổi</i><b>${esc(s.name)}</b><span class="dot lv${s.level}" title="mức chú ý nền ${lvName(s.level)}"></span></div>`).join('')}</div>`;
}

function askBox(text, label, ctx) {
  if (ctx.ask) return `<button type="button" class="btn sm primary ask" data-ask="${esc(text)}">${esc(label)}</button>`;
  return ctx.cta ? `<p class="sub cta">${ctx.cta}</p>` : '';
}

// ---------------- tab Thời vận ----------------
function tabTime(c, profile, st, ctx) {
  const cy = ctx.now.getFullYear(), years = [cy - 1, cy, cy + 1, cy + 2, cy + 3];
  if (!years.includes(st.year)) st.year = cy;
  const t = timeCycle(profile, c, st.year), tl = timeline(profile, c, cy - 1, 5);
  const chips = tl.map((y) => `<button type="button" role="tab" class="ycp lv${y.level}${y.year === st.year ? ' on' : ''}" data-year="${y.year}"><b>${y.year}</b><i>${esc(y.pillar)}</i></button>`).join('');
  const tv = t.tuvi;
  let top = '';
  if (tv) {
    const items = byCung(tv.cungs), nat = byCung(natalAttention(c.tuvi));
    if (st.tcung == null || st.cungYear !== st.year) { st.tcung = items.reduce((b, x, i) => (x.score > items[b].score ? i : b), 0); st.cungYear = st.year; }
    const sel = items[st.tcung], askText = `My nói giúp mình về cung ${sel.name} (${CUNG_DOI_THUONG[sel.name]}) trong năm ${t.year} nhé.`;
    const mark = tv.dai ? CUNG_TEN.indexOf(tv.dai.name) : null;
    top = `<div class="rd-wrap">${radar(items, { overlay: nat, sel: st.tcung, mark, label: `Radar 12 cung năm ${t.year}` })}</div>
      <p class="sub rd-legend">Đường nét liền là năm ${t.year}; vùng mờ là nền bẩm sinh của bạn.${mark != null ? ` ◆ là cung đại hạn (${tv.dai.daiHan[0]}-${tv.dai.daiHan[1]} tuổi).` : ''}</p>
      <div class="rd-detail"><div class="rd-dh"><h4>${esc(sel.name)} <small>năm ${t.year}</small></h4>${pill(sel.level)}</div><p class="sub">${esc(CUNG_DOI_THUONG[sel.name])}</p>${tagList(sel.tags)}${askBox(askText, `Hỏi My về cung ${sel.name} năm ${t.year}`, ctx)}</div>`;
  } else top = `<p class="sub">Chưa lập được Tử Vi (cần giờ sinh và giới tính nam/nữ) nên chưa có radar 12 cung. Phần Tứ Trụ và thần số bên dưới vẫn tính được.</p>`;

  if (st.month == null || st.monthYear !== st.year) {
    const today = ctx.now.getTime(), k = t.months.findIndex((m) => today >= Date.UTC(m.start.y, m.start.m - 1, m.start.d) && today < Date.UTC(m.end.y, m.end.m - 1, m.end.d) + 86400000);
    st.month = k >= 0 ? k : Math.max(0, t.months.findIndex((m) => m.level === 2)); st.monthYear = st.year;
  }
  const mo = t.months[st.month] ?? t.months[0];
  const bars = t.months.map((m, i) => `<button type="button" class="mb lv${m.level}${i === st.month ? ' on' : ''}" data-month="${i}" aria-label="Tháng ${m.month} âm lịch, ${fmtD(m.start)} đến ${fmtD(m.end)}, mức chú ý ${lvName(m.level)}"><span class="bar-v" style="height:${24 + m.level * 22}px"></span><b>${m.month}</b><i>${fmtD(m.start)}</i></button>`).join('');
  const monthAsk = `My nói giúp mình về tháng ${mo.month} âm lịch năm ${t.year} nhé, tháng đó mình nên để ý điều gì?`;
  const retro = t.year < cy ? retroBox(t, ctx.rated?.[t.year]) : '';
  return `<h3>Thời vận <small>giai đoạn nên chú ý điều gì · năm âm lịch</small></h3>
    <p class="sub">Chỉ là cách nhìn theo truyền thống để bạn tự chuẩn bị và tự soi, không dự báo sự kiện. Lá số không thay thế quyết định của bạn.</p>
    <div class="ycps" role="tablist" aria-label="Chọn năm">${chips}</div>
    <div class="ysum"><b>Năm ${t.year} · ${esc(t.yearPillar)}</b> · tuổi âm ${t.age} ${pill(t.level)}</div>
    ${top}
    <h3>Tứ Trụ và thần số <small>năm ${t.year}</small></h3>
    <ul class="tags">${t.bazi.notes.map((n) => `<li>${esc(n)}</li>`).join('')}<li>Năm cá nhân ${t.numerology.personalYear}: ${esc(t.numerology.theme)}</li></ul>
    <h3>Từng tháng âm lịch <small>chạm một tháng để xem</small></h3>
    <div class="mbars" role="group" aria-label="Mức chú ý theo tháng">${bars}</div>
    <div class="rd-detail"><div class="rd-dh"><h4>Tháng ${mo.month} <small>${fmtD(mo.start)} đến ${fmtD(mo.end)} · tháng ${esc(mo.pillar)}</small></h4>${pill(mo.level)}</div>
      <ul class="tags">${mo.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>${askBox(monthAsk, `Hỏi My về tháng ${mo.month}`, ctx)}</div>
    ${t.monthsNeedHour ? '<p class="sub">Chưa rõ giờ sinh nên phần Tử Vi theo tháng chưa có; mức chú ý các tháng chỉ dựa trên Tứ Trụ.</p>' : ''}
    ${t.leapMonth ? `<p class="sub">Năm này có tháng ${t.leapMonth} nhuận, dùng chung nhận định với tháng ${t.leapMonth}.</p>` : ''}
    ${retro}
    <div class="src"><b>Cách đọc.</b><ul>${t.caveats.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}

/** Năm đã qua: hỏi người dùng thấy lá số có khớp không. Đây là dữ liệu quan trọng để biết lớp thời vận có đáng tin hay không. */
function retroBox(t, rated) {
  const tops = t.top.length ? t.top.map((x) => x.name).join(', ') : null;
  const what = tops ? `Lá số nói năm ${t.year} đáng để ý ở cung ${tops}.` : `Lá số nói năm ${t.year} không có cung nào nổi bật, mức chung ${lvName(t.level)}.`;
  if (rated) return `<div class="retro done"><p>Cảm ơn bạn đã cho My biết. Câu trả lời của bạn giúp My biết phần nào đáng tin.</p></div>`;
  return `<div class="retro"><p><b>Nhìn lại năm ${t.year}.</b> ${esc(what)} Điều đó có khớp với năm ấy của bạn không? Bạn cứ nói thật.</p>
    <div class="retro-btns">${[['3', 'Khớp'], ['2', 'Một phần'], ['1', 'Không khớp'], ['', 'Bỏ qua']].map(([v, l]) => `<button type="button" class="btn sm" data-rate="${v}" data-ryear="${t.year}">${l}</button>`).join('')}</div></div>`;
}


// ---------------- quy ước đang dùng, đối chiếu lá số từ ứng dụng khác ----------------
const CHINH_TINH = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân'];
function conventionsBox(c, profile, ctx = {}) {
  const list = conventionsFor(profile, c), hit = list.filter((x) => x.affects);
  return `<details class="conv"${hit.length ? ' open' : ''}><summary><b>Quy ước đang dùng</b>${hit.length ? ` <span class="lvl lv2">${hit.length} điều chạm vào ngày sinh của bạn</span>` : ''}</summary>
    <p class="sub">Hai ứng dụng Tử Vi có thể ra hai lá số khác nhau cho cùng một người mà không ai sai, vì khác quy ước. Đây là ba quy ước My đang dùng.</p>
    <ul class="conv-list">${list.map((x) => `<li><b>${esc(x.title)}.</b> ${esc(x.text)}${x.affects ? `<em class="you">${esc(x.you)}</em>` : ''}${x.key === 'leap' && x.affects && ctx.onLeapRule ? `<label class="conv-rule">Cách tính cho lá số của bạn <select data-leaprule>${Object.entries(LEAP_RULES).map(([k, l]) => `<option value="${k}"${k === x.rule ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : ''}</li>`).join('')}</ul></details>`;
}
function tabCompare(c, profile, st) {
  const f = (st.cmp ??= { cuc: '', menh: '', stars: [], result: null });
  if (!c.tuvi) return `<h3>Đối chiếu lá số bạn đã có</h3><p class="sub">Cần giờ sinh và giới tính nam/nữ để lập Tử Vi rồi mới đối chiếu được.</p>`;
  const opt = (v, l, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${esc(l)}</option>`;
  const r = f.result;
  const diffs = r?.diffs?.length ? `<ul class="tags">${r.diffs.map((d) => `<li><b>${esc(d.field)}:</b> lá số này ra <b>${esc(d.mine)}</b>, ứng dụng kia ra <b>${esc(d.theirs)}</b>.</li>`).join('')}</ul>` : '';
  const out = !r ? '' : r.verdict === 'thieu_nhap' ? `<div class="cmp-res unk">${esc(r.tips[0])}</div>` : r.verdict === 'khop' ? `<div class="cmp-res ok"><b>Khớp.</b> Cục, cung Mệnh${f.stars.length ? ' và chính tinh ở Mệnh' : ''} giống hệt ứng dụng kia. Hai lá số cùng quy ước với nhau ở phần này.</div>`
    : r.verdict === 'lech_giai_thich_duoc' ? `<div class="cmp-res why"><b>Lệch, nhưng giải thích được.</b>${diffs}<ul class="tags">${r.explain.map((e) => `<li>${esc(e.text)}</li>`).join('')}</ul><p class="sub">${esc(r.tips[0])}</p></div>`
    : `<div class="cmp-res unk"><b>Lệch và My chưa giải thích được.</b>${diffs}<ul class="tags">${r.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
  return `<h3>Đối chiếu lá số bạn đã có <small>so với ứng dụng hoặc thầy khác</small></h3>
    <p class="sub">Nếu bạn đã có lá số Tử Vi từ nơi khác, nhập Cục và cung Mệnh của lá số đó. My báo khớp hay lệch và, nếu lệch, thử ba quy ước ở dưới xem quy ước nào giải thích được. Thông tin nhập ở đây không gửi đi đâu.</p>
    <div class="cmp-form">
      <label>Cục <select data-cmp="cuc"><option value="">Chọn</option>${CUC_OPTIONS.map(([n, l]) => opt(n, l, f.cuc)).join('')}</select></label>
      <label>Cung Mệnh (địa chi) <select data-cmp="menh"><option value="">Chọn</option>${CHI.map((x, i) => opt(i, x, f.menh)).join('')}</select></label>
    </div>
    <details class="cmp-stars"${f.stars.length ? ' open' : ''}><summary>Thêm chính tinh ở cung Mệnh (không bắt buộc, giúp so chắc hơn)</summary>
      <div class="cmp-checks">${CHINH_TINH.map((n) => `<label><input type="checkbox" data-cmp-star="${esc(n)}"${f.stars.includes(n) ? ' checked' : ''}> ${esc(n)}</label>`).join('')}</div></details>
    <button type="button" class="btn primary" data-cmp-run>Đối chiếu</button>
    <div aria-live="polite">${out}</div>`;
}

// ---------------- khung chung ----------------
const TABS = [['tomtat', 'Tóm tắt'], ['cung12', '12 cung'], ['thoivan', 'Thời vận'], ['tuvi', 'Tử Vi'], ['tutru', 'Tứ Trụ'], ['astro', 'Chiêm tinh'], ['thanso', 'Thần số'], ['doichieu', 'Đối chiếu']];

/**
 * Vẽ hình lá số vào host. state do bên gọi giữ (tab, year, cung, month) để mở lại đúng chỗ.
 * ask(text): có thì hiện nút "Hỏi My", gọi khi người dùng bấm. cta: HTML thay cho nút hỏi (trang mẫu không có My).
 * onRate({year, value}): người dùng nói năm đã qua có khớp không. track(name, props): ghi nhận hành vi (có thể bỏ trống).
 */
export function renderChart(host, { profile, chart, state, ask = null, cta = '', onRate = null, onLeapRule = null, track = () => {}, now = new Date(), title = true }) {
  const st = state, a = chart.astro, c = chart;
  st.tab ||= 'tomtat'; st.rated ??= {};
  const ctx = { ask, cta, now, rated: st.rated, onLeapRule };
  const body = { tomtat: () => tabOverview(c) + newBanner(), cung12: () => tab12(c, profile, st, ctx), thoivan: () => tabTime(c, profile, st, ctx), tuvi: () => tabTuVi(c, profile), tutru: () => tabTuTru(c), astro: () => tabAstro(c), thanso: () => tabThanSo(c), doichieu: () => tabCompare(c, profile, st) }[st.tab]();
  const sp = host.closest('.sheet-card:not(.flat)'), top = sp ? sp.scrollTop : (globalThis.scrollY ?? 0);
  host.innerHTML = `${title ? `<h2>Lá số của ${esc(profile.nickname)}</h2>
    <p class="sub">${esc(profile.fullName)} · ${profile.birth.d}/${profile.birth.m}/${profile.birth.y}${profile.birth.hour !== null ? ` · ${String(profile.birth.hour).padStart(2, '0')}:${String(profile.birth.minute).padStart(2, '0')}` : ' · không rõ giờ'}${a.place ? ' · ' + esc(a.place) : ''}</p>` : ''}
    <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${k === st.tab ? 'on' : ''}" aria-selected="${k === st.tab}">${l}</button>`).join('')}</div>
    ${body}
    ${conventionsBox(c, profile, ctx)}
    <div class="src"><b>Minh chứng và giới hạn.</b> Các con số được <b>tính</b> bằng thuật toán thiên văn (astronomy-engine) và quy tắc cổ truyền, không do AI đoán. Ý nghĩa gán cho chúng thuộc tầng <b>truyền thống</b>, là một lăng kính biểu tượng; chưa có bằng chứng khoa học cho thấy ngày giờ sinh quyết định số phận. Đừng quyết định chuyện lớn chỉ dựa vào lá số.
    <ul>${c.caveats.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  const again = () => renderChart(host, { profile, chart, state, ask, cta, onRate, onLeapRule, track, now, title });
  const go = (tab) => { st.tab = tab; track('chart_tab', { tab }); again(); };
  for (const b of host.querySelectorAll('[data-tab],[data-goto]')) b.onclick = () => go(b.dataset.tab ?? b.dataset.goto);
  for (const b of host.querySelectorAll('[data-year]')) b.onclick = () => { st.year = +b.dataset.year; track('time_year', { offset: st.year - now.getFullYear() }); again(); };
  for (const b of host.querySelectorAll('[data-month]')) b.onclick = () => { st.month = +b.dataset.month; track('time_month', { month: st.month + 1 }); again(); };
  const pick = (el) => { st[st.tab === 'thoivan' ? 'tcung' : 'cung'] = +el.dataset.i; track('cung_pick', { tab: st.tab, cung: CUNG_TEN[+el.dataset.i] }); again(); };
  for (const g of host.querySelectorAll('[data-i]')) { g.onclick = () => pick(g); g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g); } }; }
  for (const b of host.querySelectorAll('[data-ask]')) b.onclick = () => { track('chart_ask', { tab: st.tab }); ask?.(b.dataset.ask); };
  for (const b of host.querySelectorAll('[data-rate]')) b.onclick = () => {
    const y = +b.dataset.ryear, v = b.dataset.rate; st.rated[y] = v || 'skip';
    if (v) onRate?.({ year: y, value: +v });
    again();
  };
  for (const sel of host.querySelectorAll('[data-leaprule]')) sel.onchange = () => { track('leap_rule', { rule: sel.value }); onLeapRule?.(sel.value); };
  for (const sel of host.querySelectorAll('[data-cmp]')) sel.onchange = () => { (st.cmp ??= {})[sel.dataset.cmp] = sel.value; };
  for (const cb of host.querySelectorAll('[data-cmp-star]')) cb.onchange = () => { const f = (st.cmp ??= { stars: [] }); f.stars = cb.checked ? [...new Set([...(f.stars ?? []), cb.dataset.cmpStar])] : (f.stars ?? []).filter((x) => x !== cb.dataset.cmpStar); };
  for (const b of host.querySelectorAll('[data-cmp-run]')) b.onclick = () => {
    const f = (st.cmp ??= { stars: [] });
    if (f.cuc === '' || f.cuc == null || f.menh === '' || f.menh == null) { f.result = { verdict: 'thieu_nhap', diffs: [], explain: [], tips: ['Bạn chọn giúp My cả Cục và cung Mệnh của lá số kia nhé.'] }; return again(); }
    f.result = compareTuVi(profile, chart, { cucSo: +f.cuc, menhPos: +f.menh, stars: f.stars ?? [] });
    track('compare_run', { result: f.result.verdict, reason: (f.result.explain ?? []).map((e) => e.key).join('+') }); again();
  };
  if (sp) sp.scrollTop = top; else globalThis.scrollTo?.(0, top);
}
const newBanner = () => `<div class="newbar"><p><b>Mới:</b> xem 12 cung như một biểu đồ radar, và thời vận theo từng năm, từng tháng.</p><div><button type="button" class="btn sm" data-goto="cung12">Xem 12 cung</button> <button type="button" class="btn sm" data-goto="thoivan">Xem thời vận</button></div></div>`;
