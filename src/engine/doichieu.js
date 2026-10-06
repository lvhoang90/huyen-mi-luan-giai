// Quy ước đang dùng và đối chiếu lá số với ứng dụng khác.
// Hai ứng dụng Tử Vi có thể ra hai lá số khác nhau cho cùng một người mà không ai sai: khác nhau ở quy ước (lịch âm theo múi giờ nào,
// tháng nhuận tính thế nào, giờ Tý muộn thuộc ngày nào). compareTuVi thử các tổ hợp quy ước đó để giải thích chỗ lệch.
import { solarToLunar } from './lunar.js';
import { computeTuViLunar, CUNG_TEN, DEFAULT_LEAP_RULE } from './tuvi.js';
import { CHI } from './bazi.js';

export const LEAP_RULES = { 'chia-doi': 'Chia đôi: nửa sau tháng nhuận (từ ngày 16) lấy tháng kế', goc: 'Số tháng gốc cho cả tháng nhuận' };
export const CUC_OPTIONS = [[2, 'Thủy nhị cục'], [3, 'Mộc tam cục'], [4, 'Kim tứ cục'], [5, 'Thổ ngũ cục'], [6, 'Hỏa lục cục']];
const nextDate = ({ y, m, d }) => { const t = new Date(Date.UTC(y, m - 1, d) + 86400000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const sameLunar = (a, b) => a.day === b.day && a.month === b.month && a.year === b.year && a.leap === b.leap;
const fmtL = (l) => `${l.day}/${l.month}${l.leap ? ' nhuận' : ''}/${l.year}`;

/** Ba quy ước đang dùng, kèm việc ngày sinh của người này có chạm vào quy ước nào không. */
export function conventionsFor(profile, chart) {
  const { y, m, d, hour } = profile.birth, vn = chart.lunar, cn = solarToLunar(y, m, d, { tz: 8 }), rule = profile.leapRule ?? DEFAULT_LEAP_RULE;
  const cnDiff = !sameLunar(vn, cn);
  return [
    { key: 'cn', title: 'Múi giờ UTC+7 (lịch âm Việt Nam)',
      text: 'Lịch âm tính theo giờ Việt Nam (UTC+7), đúng lịch chính thức của Việt Nam. Ứng dụng dùng lịch Trung Quốc (UTC+8) đôi khi ra ngày âm khác, vài năm khác cả tháng (ví dụ Tết Ất Sửu 1985 ở Việt Nam là 21/1 còn ở Trung Quốc là 20/2).',
      affects: cnDiff, you: cnDiff ? `Ngày sinh của bạn nằm đúng khoảng hai lịch khác nhau: lịch Việt Nam ra ${fmtL(vn)}, lịch Trung Quốc ra ${fmtL(cn)}. Nếu lá số từ ứng dụng kia khác lá số này, rất có thể do đây.` : '' },
    { key: 'leap', title: 'Tháng nhuận khi lập Tử Vi',
      text: 'Tháng nhuận là một tháng âm lịch hoàn chỉnh (có ngày Sóc riêng, dài 29 hoặc 30 ngày), mang tên tháng chính đứng ngay trước nó; ngày sinh trong đó được ghi rõ là "tháng X nhuận". Khi lập Tử Vi, My ' + (rule === 'goc' ? 'lấy số tháng gốc X cho cả tháng nhuận (nhuận tháng 6 dùng như tháng 6). Nhiều ứng dụng và thầy chia đôi tháng nhuận: nửa sau (từ ngày 16) lấy tháng kế.' : 'chia đôi tháng nhuận theo cách phổ biến: nửa đầu (ngày 1 đến 15) lấy số tháng gốc X, nửa sau (từ ngày 16) lấy tháng X+1. Một số nơi lấy số tháng gốc cho cả tháng nhuận.') + ' Hai cách đều có người dùng; không bên nào sai.',
      affects: !!vn.leap, rule,
      you: vn.leap ? (vn.day > 15 ? `Bạn sinh ngày ${vn.day} tháng ${vn.month} nhuận, nửa sau tháng, nên hai cách ra hai lá số khác nhau: chia đôi lập như tháng ${vn.month % 12 + 1}, số tháng gốc lập như tháng ${vn.month}. Hiện My dùng: ${rule === 'goc' ? 'số tháng gốc' : 'chia đôi'}.` : `Bạn sinh ngày ${vn.day} tháng ${vn.month} nhuận, nửa đầu tháng, nên hai cách ra cùng một lá số (tháng ${vn.month}).`) : '' },
    { key: 'ty', title: 'Giờ Tý muộn (23h đến 24h)',
      text: 'Tử Vi giữ nguyên ngày sinh dương bạn nhập khi sinh trong giờ Tý muộn; Tứ Trụ thì tính Trụ Ngày sang ngày kế. Một số ứng dụng Tử Vi cũng chuyển sang ngày kế.',
      affects: hour != null && hour >= 23, you: hour != null && hour >= 23 ? 'Bạn sinh trong giờ Tý muộn nên chỗ này có thể làm lá số của ứng dụng khác lệch.' : '' },
  ];
}

const summary = (tv) => ({ cucSo: tv.cuc.so, menh: tv.menh, stars: tv.palaces[tv.menh].chinh });
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const matches = (tv, inp) => tv.cuc.so === inp.cucSo && tv.menh === inp.menhPos && (!inp.stars?.length || sameSet(tv.palaces[tv.menh].chinh, inp.stars));
const REASON = {
  cn: (c) => `Ứng dụng kia có thể dùng lịch âm Trung Quốc (UTC+8): với ngày sinh của bạn lịch Trung Quốc ra ${fmtL(c.cn)}, lịch Việt Nam ra ${fmtL(c.vn)}.`,
  leap: (c) => c.rule === 'goc' ? 'Ứng dụng kia có thể chia đôi tháng nhuận (nửa sau, từ ngày 16, lấy tháng kế), còn lá số này đang dùng số tháng gốc.' : 'Ứng dụng kia có thể lấy số tháng gốc cho cả tháng nhuận, còn lá số này chia đôi (nửa sau, từ ngày 16, lấy tháng kế).',
  ty: () => 'Ứng dụng kia có thể tính giờ Tý muộn (23h đến 24h) sang ngày kế, còn Tử Vi ở đây giữ nguyên ngày sinh.',
};

/**
 * So lá số của người dùng với dữ kiện họ nhập từ ứng dụng khác: input = { cucSo (2..6), menhPos (0..11, 0 = Tý), stars? (tên chính tinh cung Mệnh) }.
 * Trả về verdict: 'khop' | 'lech_giai_thich_duoc' | 'lech_khong_ro' | 'thieu_du_lieu', cùng các chỗ lệch và (nếu có) quy ước giải thích được.
 */
export function compareTuVi(profile, chart, input) {
  const tv = chart.tuvi;
  if (!tv) return { verdict: 'thieu_du_lieu', diffs: [], explain: [], tips: ['Cần giờ sinh và giới tính nam/nữ để lập Tử Vi rồi mới đối chiếu được.'] };
  const mine = summary(tv), diffs = [];
  if (mine.cucSo !== input.cucSo) diffs.push({ field: 'Cục', mine: tv.cuc.ten, theirs: CUC_OPTIONS.find(([n]) => n === input.cucSo)?.[1] ?? '?' });
  if (mine.menh !== input.menhPos) diffs.push({ field: 'Cung Mệnh', mine: `cung ${CHI[mine.menh]}`, theirs: `cung ${CHI[input.menhPos]}` });
  if (input.stars?.length && !sameSet(mine.stars, input.stars)) diffs.push({ field: 'Chính tinh ở Mệnh', mine: mine.stars.join(', ') || 'vô chính diệu', theirs: input.stars.join(', ') });
  if (!diffs.length) return { verdict: 'khop', diffs, explain: [], tips: [] };

  // Thử các tổ hợp quy ước (ít quy ước nhất trước) xem tổ hợp nào tái tạo đúng lá số của ứng dụng kia.
  const { y, m, d, hour } = profile.birth, date = { y, m, d };
  const rule = profile.leapRule ?? DEFAULT_LEAP_RULE, other = rule === 'goc' ? 'chia-doi' : 'goc';
  const ctx = { vn: chart.lunar, cn: solarToLunar(y, m, d, { tz: 8 }), rule };
  const combos = [];
  for (let mask = 1; mask < 8; mask++) {
    const keys = ['cn', 'leap', 'ty'].filter((_, i) => mask & (1 << i));
    if (keys.includes('ty') && !(hour != null && hour >= 23)) continue;
    const dt = keys.includes('ty') ? nextDate(date) : date;
    let l = solarToLunar(dt.y, dt.m, dt.d, keys.includes('cn') ? { tz: 8 } : {});
    if (keys.includes('leap') && !(l.leap && l.day > 15)) continue; // hai quy ước chỉ khác nhau ở nửa sau tháng nhuận
    if (keys.includes('cn') && sameLunar(ctx.vn, ctx.cn) && keys.length === 1) continue; // lịch hai nước trùng nhau nên không phải nguyên nhân
    let alt; try { alt = computeTuViLunar(l, hour, profile.gender, { leapRule: keys.includes('leap') ? other : rule }); } catch { continue; }
    if (matches(alt, input)) combos.push(keys);
  }
  combos.sort((a, b) => a.length - b.length);
  if (combos.length) {
    const keys = combos[0];
    return { verdict: 'lech_giai_thich_duoc', diffs, explain: keys.map((k) => ({ key: k, text: REASON[k](ctx) })), tips: ['Không bên nào "sai": đây là hai quy ước khác nhau. Bạn quen với thầy hoặc ứng dụng nào thì dùng quy ước ấy cho nhất quán.'] };
  }
  return { verdict: 'lech_khong_ro', diffs, explain: [], tips: ['Không có quy ước nào trong ba quy ước trên tái tạo được lá số kia. Hãy kiểm tra lại: giờ sinh (và ứng dụng kia dùng giờ sinh nào), ngày dương hay ngày âm đã nhập, giới tính, và bạn có chọn đúng cung Mệnh/Cục chưa.', 'Nếu ứng dụng kia dùng một trường phái khác (ví dụ khác cách an Cục hay Mệnh), My chưa so được.'] };
}
export { CUNG_TEN };
