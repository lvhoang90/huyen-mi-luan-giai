// Thời vận: lớp "giai đoạn nên chú ý điều gì" theo năm và tháng.
// "Mức chú ý" (nhẹ / vừa / nhiều) chỉ đếm xem có bao nhiêu yếu tố đang kích hoạt một lĩnh vực theo quy tắc cổ truyền.
// Nó KHÔNG phải điểm tốt xấu và không dự báo sự kiện. Lời kể luôn nói bằng ngôn ngữ của xu hướng và việc có thể làm.
//
// Quy tắc dùng (đều là cách làm phổ biến, các phái có thể khác nhau):
// - Tử Vi: Đại hạn (đã có ở tuvi.js), Lưu Thái Tuế (cung đóng chi của năm xem), Lưu Tứ Hóa theo can năm,
//   Lưu nguyệt theo cách "Đẩu Quân" (từ cung Thái Tuế đếm nghịch đến tháng sinh, rồi đếm thuận đến giờ sinh = tháng Giêng).
// - Tứ Trụ: hành của can năm/tháng so với Nhật chủ (sinh, khắc, đồng), lục xung / lục hợp / tam hợp của chi với chi ngày và chi năm sinh.
// - Thần số học: năm cá nhân và tháng cá nhân.
// Chưa có: tiểu hạn, sao lưu (Lưu Lộc Tồn, Lưu Kình Đà...), Tuần/Triệt. Chưa đối chiếu với thư viện độc lập nào (không có thư viện nào làm phần này).
import { CAN, CHI, CAN_HANH, CHI_HANH, SINH, KHAC, computeBazi, yearPillarOfYear } from './bazi.js';
import { CUNG_TEN, TU_HOA, HOUR_BRANCH } from './tuvi.js';
import { lunarMonthsOfYear } from './lunar.js';
import { reduce, PERSONAL_YEAR_THEME } from './numerology.js';

const mod = (n) => ((n % 12) + 12) % 12;
export const LEVELS = ['nhẹ', 'vừa', 'nhiều'];
const levelOf = (score, cuts) => (score >= cuts[1] ? 2 : score >= cuts[0] ? 1 : 0);
const SAT = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Kiếp', 'Địa Không'];

/** Cách hiểu mỗi cung theo đời thường: dùng khi dẫn người dùng vào cuộc trò chuyện. */
export const CUNG_DOI_THUONG = {
  'Mệnh': 'con người và hướng đi của bạn', 'Phụ Mẫu': 'cha mẹ, người lớn, thầy cô', 'Phúc Đức': 'nền tinh thần, nếp nhà, sự an yên bên trong',
  'Điền Trạch': 'nhà cửa, nơi ở, tài sản gốc', 'Quan Lộc': 'công việc, sự nghiệp', 'Nô Bộc': 'bạn bè, đồng nghiệp, người dưới quyền',
  'Thiên Di': 'đi xa, môi trường bên ngoài, cách người ngoài nhìn bạn', 'Tật Ách': 'sức khỏe và nhịp sống (không dùng để chẩn đoán)',
  'Tài Bạch': 'tiền bạc, cách kiếm và giữ', 'Tử Tức': 'con cái, học trò, sản phẩm mình tạo ra', 'Phu Thê': 'tình cảm, hôn nhân, bạn đời', 'Huynh Đệ': 'anh chị em, bạn thân',
};

const HOA_NATAL = {
  'Hóa Lộc': 'Hóa Lộc: nơi cơ hội hay tìm đến, nên chọn lọc đừng ôm hết',
  'Hóa Quyền': 'Hóa Quyền: nơi bạn muốn chủ động và nắm quyết định',
  'Hóa Khoa': 'Hóa Khoa: nơi hợp học hỏi, dễ được ghi nhận nhẹ nhàng',
  'Hóa Kỵ': 'Hóa Kỵ: nơi hay bận lòng, nên đi chậm và nói rõ với nhau',
};
const HOA_YEAR = {
  'Hóa Lộc': 'Lưu Hóa Lộc: có dòng chảy mới, cơ hội tìm đến, nhớ chọn lọc',
  'Hóa Quyền': 'Lưu Hóa Quyền: cần chủ động, có thể gánh thêm trách nhiệm hoặc quyền quyết định',
  'Hóa Khoa': 'Lưu Hóa Khoa: dịp học hỏi, được ghi nhận, giữ tiếng tốt',
  'Hóa Kỵ': 'Lưu Hóa Kỵ: dễ vướng hoặc bận lòng, nên đi chậm, kiểm tra kỹ, nói rõ ràng',
};
const HOA_ORDER = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];

// ---------- Tử Vi: nền tảng của từng cung ----------
/** Mức chú ý bẩm sinh của 12 cung: có bao nhiêu yếu tố nổi bật rơi vào mỗi cung (không phải tốt/xấu). */
export function natalAttention(tuvi) {
  if (!tuvi) return null;
  return tuvi.palaces.map((p) => {
    let score = 0; const tags = [];
    for (const h of p.hoa) { score += h === 'Hóa Kỵ' ? 2 : 1; tags.push(HOA_NATAL[h]); }
    const sat = p.sat.filter((s) => SAT.includes(s));
    if (sat.length) { score += Math.min(sat.length, 2); tags.push(`có sao mạnh gắt (${sat.join(', ')}): nơi cần giữ nhịp, tránh hấp tấp`); }
    if (!p.chinh.length) { score += 1; tags.push('vô chính diệu: cung để ngỏ, đổi theo hoàn cảnh'); }
    else if (p.chinh.length >= 2) { score += 1; tags.push(`đông chính tinh (${p.chinh.join(', ')}): nhiều tầng ý nghĩa`); }
    if (p.isThan) { score += 1; tags.push('Thân cư: nơi bạn dồn tâm sức về sau'); }
    return { pos: p.pos, name: p.name, score, level: levelOf(score, [2, 3]), tags };
  });
}

/** Các giai đoạn đời theo Đại hạn (10 năm một cung), kèm mức chú ý bẩm sinh của cung đó. */
export function lifeStages(tuvi, now = new Date()) {
  if (!tuvi) return [];
  const nat = natalAttention(tuvi), age = now.getFullYear() - tuvi.lunar.year + 1;
  return tuvi.palaces.filter((p) => p.daiHan).sort((a, b) => a.daiHan[0] - b.daiHan[0]).map((p) => ({
    from: p.daiHan[0], to: p.daiHan[1], name: p.name, level: nat[p.pos].level, tags: nat[p.pos].tags,
    current: age >= p.daiHan[0] && age <= p.daiHan[1],
  }));
}

// ---------- Tử Vi: một năm ----------
function tuviYear(tuvi, year) {
  const tt = mod(year - 4); // chi của năm xem = vị trí Lưu Thái Tuế
  const age = year - tuvi.lunar.year + 1; // tuổi âm (tuổi mụ)
  const can = CAN[(((year - 4) % 10) + 10) % 10];
  const dai = tuvi.palaces.find((p) => p.daiHan && age >= p.daiHan[0] && age <= p.daiHan[1]) ?? null;
  const luuHoa = TU_HOA[can].map((star, k) => {
    const p = tuvi.palaces.find((q) => q.chinh.includes(star) || q.phu.includes(star));
    return p ? { hoa: HOA_ORDER[k], star, pos: p.pos, cung: p.name } : null;
  }).filter(Boolean);
  const cungs = tuvi.palaces.map((p) => {
    let score = 0; const tags = [];
    if (dai && dai.pos === p.pos) { score += 1; tags.push(`đại hạn ${dai.daiHan[0]}-${dai.daiHan[1]} tuổi đang đi qua cung này (nền 10 năm)`); }
    if (p.pos === tt) { score += 2; tags.push('Lưu Thái Tuế đóng ở đây: tâm điểm của năm'); }
    if (p.pos === mod(tt + 6)) { score += 1; tags.push('đối diện cung Thái Tuế: tác động gián tiếp, hay thấy qua các mối quan hệ'); }
    for (const h of luuHoa.filter((x) => x.pos === p.pos)) { score += h.hoa === 'Hóa Kỵ' ? 2 : 1; tags.push(`${HOA_YEAR[h.hoa]} (${h.star})`); }
    return { pos: p.pos, name: p.name, luuName: CUNG_TEN[mod(p.pos - tt)], score, level: levelOf(score, [1, 2]), tags };
  });
  return { age, can, tt, ttChi: CHI[tt], dai, luuHoa, cungs };
}

// ---------- Tứ Trụ ----------
const REL_TEXT = {
  dong: 'cùng hành với Nhật chủ: có thêm bạn đồng hành, cũng có thể là người ngang vai để so sánh hoặc cạnh tranh',
  sinh_ta: 'hành sinh cho Nhật chủ: có nguồn nâng đỡ, hợp học hỏi và nghỉ lấy sức',
  ta_sinh: 'Nhật chủ sinh ra hành này: dịp thể hiện, sáng tạo, nhưng dễ tiêu hao sức',
  ta_khac: 'Nhật chủ chế ngự hành này: có việc cụ thể và tiền bạc để nắm, cần sức và kế hoạch',
  khac_ta: 'hành này tạo sức ép lên Nhật chủ: có kỷ luật, trách nhiệm, người quản lý; nên đi chắc và giữ nhịp nghỉ',
};
/** Quan hệ của một hành đối với hành Nhật chủ (cùng, sinh ra mình, mình sinh ra, mình chế ngự, chế ngự mình). */
export function relation(dm, e) {
  if (e === dm) return 'dong';
  if (SINH[e] === dm) return 'sinh_ta';
  if (SINH[dm] === e) return 'ta_sinh';
  if (KHAC[dm] === e) return 'ta_khac';
  return 'khac_ta';
}
/** Quan hệ giữa hai địa chi: lục xung, lục hợp, tam hợp. */
export function chiRelation(a, b) {
  if (a === b) return null;
  if (mod(a - b) === 6) return 'xung';
  if ((a + b) % 12 === 1) return 'hop';
  if (a % 4 === b % 4) return 'tamhop';
  return null;
}
const CHI_TEXT = {
  xung: (w) => `xung với ${w}: nhịp sống dễ xáo trộn, nên sắp xếp và chuẩn bị trước thay vì để mọi thứ đến cùng lúc`,
  hop: (w) => `hợp với ${w}: dễ gặp người và việc ăn ý`,
  tamhop: (w) => `tam hợp với ${w}: có người đồng điệu, dễ cùng nhau làm việc`,
};

function baziLayer(bazi, pillar, { cuts = [1, 3] } = {}) {
  const dm = bazi.dayMaster.hanh, rel = relation(dm, pillar.hanhCan);
  const dayChi = bazi.pillars.day.branch, yearChi = bazi.pillars.year.branch;
  const rd = chiRelation(pillar.branch, dayChi), ry = chiRelation(pillar.branch, yearChi);
  let score = 0; const notes = [`${pillar.name}: ${REL_TEXT[rel]}`];
  if (rel === 'khac_ta') score += 1;
  if (rd) { notes.push(`chi ${pillar.chi} ${CHI_TEXT[rd]('chi ngày sinh')}`); if (rd === 'xung') score += 2; }
  if (ry) { notes.push(`chi ${pillar.chi} ${CHI_TEXT[ry]('chi năm sinh (tuổi)')}`); if (ry === 'xung') score += 1; }
  return { pillar: pillar.name, relation: rel, dayChi: rd, yearChi: ry, notes, score, level: levelOf(score, cuts) };
}

// ---------- tổng hợp một năm ----------
/** Thời vận của một năm âm lịch: Tử Vi (nếu có), Tứ Trụ, thần số, và 12 tháng. */
export function timeCycle(profile, chart, year, { withMonths = true } = {}) {
  const { bazi, tuvi, numerology } = chart;
  const yp = yearPillarOfYear(year);
  const by = baziLayer(bazi, yp, { cuts: [1, 3] });
  const { d, m } = profile.birth;
  const personalYear = reduce(reduce(d) + reduce(m) + reduce(year));
  const ty = tuvi ? tuviYear(tuvi, year) : null;
  const top = ty ? [...ty.cungs].sort((a, b) => b.score - a.score || a.pos - b.pos).filter((c) => c.score >= 2).slice(0, 3) : [];
  const maxScore = ty ? Math.max(...ty.cungs.map((c) => c.score)) : by.score;
  const level = ty ? levelOf(maxScore, [3, 4]) : by.level;

  // Các tháng âm lịch (bỏ tháng nhuận khỏi danh sách chính; tháng nhuận dùng chung nhận định với tháng thường trước nó)
  const lunarMonths = withMonths ? lunarMonthsOfYear(year) : [];
  const hasHour = profile.birth.hour !== null && profile.birth.hour !== undefined;
  const dq = ty && hasHour ? mod(ty.tt - (tuvi.lunar.month - 1) + HOUR_BRANCH(profile.birth.hour)) : null;
  const months = lunarMonths.filter((lm) => !lm.leap).map((lm) => {
    const midJdn = lm.startJdn + 14, mid = new Date((midJdn - 2440588) * 86400000);
    const mp = computeBazi({ y: mid.getUTCFullYear(), m: mid.getUTCMonth() + 1, d: mid.getUTCDate(), hour: 12, minute: 0 }).pillars.month;
    const bm = baziLayer(bazi, mp, { cuts: [1, 3] });
    const solarMonth = mid.getUTCMonth() + 1;
    const pm = reduce(personalYear + reduce(solarMonth));
    let score = bm.score; const notes = [...bm.notes]; let cung = null;
    if (dq !== null) {
      const pos = mod(dq + (lm.month - 1)), yc = ty.cungs[pos], nat = tuvi.palaces[pos];
      cung = { pos, name: nat.name, doiThuong: CUNG_DOI_THUONG[nat.name] };
      notes.unshift(`lưu nguyệt rơi vào cung ${nat.name} (${CUNG_DOI_THUONG[nat.name]})`);
      if (yc.score >= 3) { score += 2; notes.push(`cung ${nat.name} cũng đang được kích hoạt nhiều trong năm này`); }
      else if (yc.score === 2) score += 1;
      if (nat.hoa.includes('Hóa Kỵ') || ty.luuHoa.some((h) => h.hoa === 'Hóa Kỵ' && h.pos === pos)) { score += 1; notes.push('cung này có Hóa Kỵ: nên đi chậm, nói rõ'); }
    }
    notes.push(`tháng cá nhân ${pm}: ${PERSONAL_YEAR_THEME[pm].replace(/^năm/, 'tháng')}`);
    return {
      month: lm.month, start: lm.start, end: lm.end, pillar: mp.name, relation: bm.relation, cung, personalMonth: pm,
      score, level: levelOf(score, dq !== null ? [1, 2] : [1, 3]), notes,
    };
  });
  const leapMonth = lunarMonths.find((lm) => lm.leap)?.month ?? null;

  return {
    year, yearPillar: yp.name, age: ty?.age ?? year - chart.lunar.year + 1, level, top,
    tuvi: ty, bazi: by, numerology: { personalYear, theme: PERSONAL_YEAR_THEME[personalYear] },
    months, leapMonth, monthsNeedHour: !!ty && !hasHour,
    caveats: [
      '"Mức chú ý" chỉ đếm số yếu tố đang kích hoạt một lĩnh vực theo quy tắc cổ truyền, không phải điểm tốt xấu và không dự báo sự kiện.',
      'Lưu niên theo Lưu Thái Tuế và Lưu Tứ Hóa; chưa có tiểu hạn và các sao lưu khác. Lưu nguyệt theo cách Đẩu Quân, một trong các cách được dùng. Các phái có thể khác nhau.',
      'Phần thời vận chưa được đối chiếu với thư viện độc lập (hiện không có thư viện nào cùng làm phần này); các con số lịch âm, tiết khí, đại hạn thì đã kiểm.',
      ...(leapMonth ? [`Năm âm này có tháng ${leapMonth} nhuận; tháng nhuận dùng chung nhận định với tháng ${leapMonth} thường.`] : []),
    ],
  };
}

/** Dải nhiều năm liền nhau: mỗi năm một mức chú ý và tối đa 3 cung nổi nhất. */
export function timeline(profile, chart, fromYear, count = 5) {
  const out = [];
  for (let y = fromYear; y < fromYear + count; y++) {
    const t = timeCycle(profile, chart, y, { withMonths: false });
    out.push({ year: y, pillar: t.yearPillar, level: t.level, top: t.top.map((c) => c.name), personalYear: t.numerology.personalYear });
  }
  return out;
}

const lv = (i) => LEVELS[i];
const dmy = (x) => `${x.d}/${x.m}`;
/** Văn bản cho AI: chỉ là dữ kiện đã tính, AI không được sửa, và phải nói bằng giọng "giai đoạn nên chú ý". */
export function describeTimeCycle(profile, chart, now = new Date()) {
  const y = now.getFullYear(), L = [];
  L.push('THỜI VẬN (đã tính; "mức chú ý" nhẹ/vừa/nhiều chỉ cho biết có bao nhiêu yếu tố cùng kích hoạt một lĩnh vực, KHÔNG phải tốt hay xấu):');
  for (const yr of [y - 1, y, y + 1, y + 2, y + 3]) {
    const t = timeCycle(profile, chart, yr, { withMonths: false });
    const parts = [`Năm ${yr} (${t.yearPillar}${yr === y ? ', năm nay' : ''}): mức chú ý chung ${lv(t.level)}`];
    if (t.tuvi) {
      parts.push(`tuổi âm ${t.age}; Lưu Thái Tuế ở cung ${chart.tuvi.palaces[t.tuvi.tt].name}`);
      if (t.tuvi.dai) parts.push(`đại hạn ${t.tuvi.dai.daiHan[0]}-${t.tuvi.dai.daiHan[1]} tuổi tại cung ${t.tuvi.dai.name}`);
      if (t.top.length) parts.push(`cung nên chú ý: ${t.top.map((c) => `${c.name} (${lv(c.level)})`).join(', ')}`);
      if (t.tuvi.luuHoa.length) parts.push(`Lưu Tứ Hóa: ${t.tuvi.luuHoa.map((h) => `${h.hoa} → ${h.star} (${h.cung})`).join('; ')}`);
    }
    parts.push(`Tứ Trụ: ${t.bazi.notes.join('; ')}`);
    parts.push(`năm cá nhân ${t.numerology.personalYear} (${t.numerology.theme})`);
    L.push('- ' + parts.join(' | '));
  }
  const cur = timeCycle(profile, chart, y);
  L.push(`Các tháng âm lịch năm ${y}${cur.monthsNeedHour ? ' (thiếu giờ sinh nên chưa có phần Tử Vi theo tháng)' : ''}:`);
  for (const m of cur.months) L.push(`- Tháng ${m.month} (${dmy(m.start)} đến ${dmy(m.end)}): mức chú ý ${lv(m.level)}; ${m.notes.slice(0, 3).join('; ')}`);
  if (chart.tuvi) {
    const st = lifeStages(chart.tuvi, now).map((s) => `${s.from}-${s.to} tuổi: cung ${s.name} (mức chú ý nền ${lv(s.level)})${s.current ? ' [đang đi]' : ''}`);
    L.push('Các giai đoạn đời theo đại hạn: ' + st.join('; '));
  }
  L.push('Chỉ nói về những năm và tháng có trong khối này. Năm khác: nói thật là My chưa tính phần đó.');
  for (const c of cur.caveats) L.push(`- Giới hạn: ${c}`);
  return L.join('\n');
}
