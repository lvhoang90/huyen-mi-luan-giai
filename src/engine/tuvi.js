// Tử Vi Đẩu Số (trường phái phổ biến ở Việt Nam): an Mệnh/Thân, Cục, 14 chính tinh,
// Tứ Hóa, các phụ tinh chính, Trường Sinh, Đại hạn. Chưa có: miếu/hãm của sao, Tuần/Triệt, tiểu hạn.
import { solarToLunar } from './lunar.js';
import { CAN, CHI } from './bazi.js';

const mod = (n) => ((n % 12) + 12) % 12;
export const CUNG_TEN = ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'];
const CUC = { Thủy: 2, Mộc: 3, Kim: 4, Thổ: 5, Hỏa: 6 };
const CUC_TEN = { 2: 'Thủy nhị cục', 3: 'Mộc tam cục', 4: 'Kim tứ cục', 5: 'Thổ ngũ cục', 6: 'Hỏa lục cục' };
export const HOUR_BRANCH = (hour) => Math.floor((hour + 1) / 2) % 12;

export const TU_HOA = {
  Giáp: ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], Ất: ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
  Bính: ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], Đinh: ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
  Mậu: ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'], Kỷ: ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
  Canh: ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'], Tân: ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
  Nhâm: ['Thiên Lương', 'Tử Vi', 'Tả Phụ', 'Vũ Khúc'], Quý: ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],
};
const LOC_TON = { Giáp: 2, Ất: 3, Bính: 5, Mậu: 5, Đinh: 6, Kỷ: 6, Canh: 8, Tân: 9, Nhâm: 11, Quý: 0 };
const KHOI_VIET = { Giáp: [1, 7], Mậu: [1, 7], Ất: [0, 8], Kỷ: [0, 8], Canh: [6, 2], Tân: [6, 2], Bính: [11, 9], Đinh: [11, 9], Nhâm: [3, 5], Quý: [3, 5] };
const TRUONG_SINH = ['Trường Sinh', 'Mộc Dục', 'Quan Đới', 'Lâm Quan', 'Đế Vượng', 'Suy', 'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng'];
const TS_START = { Thủy: 8, Thổ: 8, Mộc: 11, Kim: 5, Hỏa: 2 };
const NAP_HANH_BY_SUM = { 1: 'Kim', 2: 'Thủy', 3: 'Hỏa', 4: 'Thổ', 5: 'Mộc' };

/** Hành của Cục từ can chi cung Mệnh. */
export function cucFromMenh(stem, branch) {
  const c = Math.floor(stem / 2) + 1; // Giáp Ất 1 … Nhâm Quý 5
  const bv = { 0: 0, 1: 0, 6: 0, 7: 0, 2: 1, 3: 1, 8: 1, 9: 1, 4: 2, 5: 2, 10: 2, 11: 2 }[branch];
  let s = c + bv; if (s > 5) s -= 5;
  return NAP_HANH_BY_SUM[s];
}

/**
 * @param {{y,m,d,hour,minute}} birth dương lịch, giờ VN
 * @param {'nam'|'nu'} gender
 */
/** Quy ước tháng nhuận khi lập Tử Vi: 'chia-doi' = nửa đầu (ngày 1-15) lấy số tháng gốc, nửa sau (từ ngày 16) lấy tháng kế; 'goc' = số tháng gốc cho cả tháng nhuận. */
export const DEFAULT_LEAP_RULE = 'chia-doi';
export function computeTuVi(birth, gender, opts = {}) {
  if (birth.hour === null || birth.hour === undefined) return null;
  if (gender !== 'nam' && gender !== 'nu') return null;
  return computeTuViLunar(solarToLunar(birth.y, birth.m, birth.d), birth.hour, gender, opts);
}

/** Lập lá số từ ngày âm lịch đã biết (dùng cho test đối chiếu và khi người dùng cho sẵn ngày âm). */
export function computeTuViLunar(lunar, hour, gender, { leapRule = DEFAULT_LEAP_RULE } = {}) {
  const birth = { hour };
  const ys = (((lunar.year - 4) % 10) + 10) % 10, yb = (((lunar.year - 4) % 12) + 12) % 12;
  const yearCan = CAN[ys], yearChi = CHI[yb];
  const h = HOUR_BRANCH(birth.hour);
  // Tháng nhuận là một tháng hoàn chỉnh mang tên tháng trước nó; riêng việc lập Tử Vi có hai cách được dùng (xem DEFAULT_LEAP_RULE).
  const month = lunar.leap && leapRule === 'chia-doi' && lunar.day > 15 ? (lunar.month % 12) + 1 : lunar.month;

  // Mệnh / Thân
  const menh = mod(2 + (month - 1) - h);
  const than = mod(2 + (month - 1) + h);

  // Can của từng cung (Ngũ Hổ Độn theo can năm âm lịch)
  const first = ((ys % 5) * 2 + 2) % 10;
  const stemAt = (c) => (first + mod(c - 2)) % 10;

  // Cục
  const hanhCuc = cucFromMenh(stemAt(menh), menh);
  const cuc = CUC[hanhCuc];

  // Tử Vi
  let x = 0; while ((lunar.day + x) % cuc !== 0) x++;
  const q = (lunar.day + x) / cuc;
  const base = mod(2 + (q - 1));
  const tuVi = x % 2 === 1 ? mod(base - x) : mod(base + x);
  const thienPhu = mod(4 - tuVi);

  const stars = Array.from({ length: 12 }, () => ({ chinh: [], phu: [], sat: [], hoa: [] }));
  const put = (list, pos, name) => stars[mod(pos)][list].push(name);
  // Tử Vi hệ (nghịch)
  put('chinh', tuVi, 'Tử Vi'); put('chinh', tuVi - 1, 'Thiên Cơ'); put('chinh', tuVi - 3, 'Thái Dương');
  put('chinh', tuVi - 4, 'Vũ Khúc'); put('chinh', tuVi - 5, 'Thiên Đồng'); put('chinh', tuVi - 8, 'Liêm Trinh');
  // Thiên Phủ hệ (thuận)
  ['Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát'].forEach((n, i) => put('chinh', thienPhu + i, n));
  put('chinh', thienPhu + 10, 'Phá Quân');

  // Phụ tinh chính
  const tuHoaList = TU_HOA[yearCan];
  put('phu', 4 + (month - 1), 'Tả Phụ'); put('phu', 10 - (month - 1), 'Hữu Bật');
  put('phu', 10 - h, 'Văn Xương'); put('phu', 4 + h, 'Văn Khúc');
  const [khoi, viet] = KHOI_VIET[yearCan]; put('phu', khoi, 'Thiên Khôi'); put('phu', viet, 'Thiên Việt');
  const lt = LOC_TON[yearCan]; put('phu', lt, 'Lộc Tồn');
  put('sat', lt + 1, 'Kình Dương'); put('sat', lt - 1, 'Đà La');
  put('sat', 11 + h, 'Địa Kiếp'); put('sat', 11 - h, 'Địa Không');
  const horse = { 2: 8, 6: 8, 10: 8, 8: 2, 0: 2, 4: 2, 5: 11, 9: 11, 1: 11, 11: 5, 3: 5, 7: 5 }[yb]; put('phu', horse, 'Thiên Mã');
  const hongLoan = mod(3 - yb); put('phu', hongLoan, 'Hồng Loan'); put('phu', hongLoan + 6, 'Thiên Hỷ');
  // Hỏa Tinh / Linh Tinh
  const grp = { 2: 0, 6: 0, 10: 0, 8: 1, 0: 1, 4: 1, 5: 2, 9: 2, 1: 2, 11: 3, 3: 3, 7: 3 }[yb];
  const hoaStart = [1, 2, 3, 9][grp], linhStart = [3, 10, 10, 10][grp];
  const duongNamAmNu = (gender === 'nam') === (ys % 2 === 0);
  put('sat', duongNamAmNu ? hoaStart + h : hoaStart - h, 'Hỏa Tinh');
  put('sat', duongNamAmNu ? linhStart - h : linhStart + h, 'Linh Tinh');

  // Tứ Hóa
  const hoaNames = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
  const hoaAt = {};
  stars.forEach((cell, pos) => {
    for (const n of [...cell.chinh, ...cell.phu]) {
      const k = tuHoaList.indexOf(n);
      if (k >= 0) { cell.hoa.push(hoaNames[k]); hoaAt[hoaNames[k]] = { star: n, pos }; }
    }
  });

  // Trường Sinh
  const dir = duongNamAmNu ? 1 : -1;
  const ts = Array(12);
  for (let i = 0; i < 12; i++) ts[mod(TS_START[hanhCuc] + dir * i)] = TRUONG_SINH[i];

  // 12 cung + Đại hạn
  const palaces = Array.from({ length: 12 }, (_, pos) => {
    const idx = mod(pos - menh); // 0 = Mệnh
    const dh = Math.floor(mod((dir === 1 ? pos - menh : menh - pos)) % 12);
    return {
      pos, chi: CHI[pos], can: CAN[stemAt(pos)], name: CUNG_TEN[idx],
      chinh: stars[pos].chinh, phu: stars[pos].phu, sat: stars[pos].sat, hoa: stars[pos].hoa,
      truongSinh: ts[pos], isThan: pos === than,
      daiHan: cuc + dh * 10 > 100 ? null : [cuc + dh * 10, cuc + dh * 10 + 9],
    };
  });
  const menhP = palaces[menh];
  return {
    lunar: { ...lunar, canChiYear: `${yearCan} ${yearChi}` }, monthUsed: month, leapRule,
    menh, than, thanCu: palaces[than].name,
    cuc: { hanh: hanhCuc, so: cuc, ten: CUC_TEN[cuc] },
    amDuong: `${ys % 2 === 0 ? 'Dương' : 'Âm'} ${gender === 'nam' ? 'nam' : 'nữ'} (đại hạn ${duongNamAmNu ? 'thuận' : 'nghịch'})`,
    tuVi: tuVi, thienPhu,
    menhVoChinhDieu: menhP.chinh.length === 0,
    palaces, hoaAt,
  };
}
