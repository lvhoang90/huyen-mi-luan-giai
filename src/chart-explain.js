// Lời giải thích bằng tiếng thường cho các tab chuyên môn của lá số (Tử Vi, Tứ Trụ, Chiêm tinh, Thần số).
// Người xem không cần biết thuật ngữ: mỗi tab mở đầu bằng "Đọc nhanh cho bạn" (rút từ chính lá số) và "Cách đọc hình này".
// Các từ khóa là cách gọi truyền thống để tự soi, không phải kết luận về cuộc đời (tầng Truyền thống, không phải tầng Tính toán).

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const CHINH_TINH = {
  'Tử Vi': 'thích đứng ra dẫn dắt, tự trọng, cần được tôn trọng',
  'Thiên Cơ': 'nhanh trí, hay tính toán và thích suy nghĩ',
  'Thái Dương': 'cởi mở, nhiệt tình, thích được người khác ghi nhận',
  'Vũ Khúc': 'thực tế, quyết đoán, nhạy chuyện tiền bạc',
  'Thiên Đồng': 'hiền hòa, dễ gần, thích sống thoải mái',
  'Liêm Trinh': 'có nguyên tắc, cầu toàn, tình cảm sâu và mạnh',
  'Thiên Phủ': 'điềm đạm, biết giữ gìn, thích sự ổn định',
  'Thái Âm': 'tinh tế, kín đáo, giàu cảm xúc bên trong',
  'Tham Lang': 'đa tài, nhiều ham muốn, khéo giao tiếp',
  'Cự Môn': 'ăn nói sắc, hay suy xét, dễ nghi ngờ',
  'Thiên Tướng': 'chu đáo, thích giúp người, trọng khuôn phép',
  'Thiên Lương': 'nhân hậu, hay che chở, thích làm người đỡ đầu',
  'Thất Sát': 'mạnh mẽ, thích tự xông pha, không ngại đối đầu',
  'Phá Quân': 'thích đổi mới, dám phá cái cũ, không chịu khuôn',
};

const HOA_NGHIA = {
  'Hóa Lộc': 'thuận, dễ có cơ hội',
  'Hóa Quyền': 'chủ động, muốn nắm quyết định',
  'Hóa Khoa': 'được nể trọng, hay có người giúp',
  'Hóa Kỵ': 'dễ vướng bận, nên để ý nhiều hơn',
};

// lĩnh vực đời sống người dùng hay hỏi, ứng với cung Tử Vi
const AREAS = [
  ['Mệnh', 'Con người bạn'],
  ['Quan Lộc', 'Công danh, sự nghiệp'],
  ['Phu Thê', 'Tình cảm, hôn nhân'],
  ['Tài Bạch', 'Tiền bạc'],
  ['Phúc Đức', 'Nội tâm, phúc phần'],
];

const joinSao = (arr) => arr.map((s) => `<b>${esc(s)}</b>`).join(', ');
const traits = (arr) => arr.map((s) => CHINH_TINH[s]).filter(Boolean);

/** Một dòng cho mỗi lĩnh vực: sao chính ở cung đó nghĩa là gì, bằng lời thường. */
export function tuViForYou(t) {
  const find = (name) => t.palaces.find((p) => p.name === name);
  const rows = AREAS.map(([name, label]) => {
    const p = find(name); if (!p) return '';
    let sao = p.chinh, lead = '';
    if (!sao.length) { // vô chính diệu: truyền thống xem sao ở cung đối diện
      const opp = t.palaces[(t.palaces.indexOf(p) + 6) % 12];
      sao = opp.chinh; lead = sao.length ? `Cung này chưa có sao chính, nên người xưa xem sao ở cung đối (${esc(opp.name)}). ` : 'Cung này chưa có sao chính. ';
    }
    const hoa = p.hoa.length ? ` Có ${p.hoa.map((h) => `<b>${esc(h)}</b> (${HOA_NGHIA[h] ?? ''})`).join(', ')}.` : '';
    const tr = traits(sao);
    const body = sao.length
      ? `${lead}Sao ${joinSao(sao)}: ${tr.length ? esc(tr.join('; ')) : 'xem phần giải thích ở dưới'}.`
      : lead.trim();
    return `<li><b class="pa">${esc(label)}</b> <span class="pc">cung ${esc(name)}</span><br>${body}${hoa}</li>`;
  }).filter(Boolean);
  return `<section class="plain"><h4>Đọc nhanh cho bạn</h4>
    <p class="sub">Lá số có 12 ô, mỗi ô là một lĩnh vực của đời sống. Dưới đây là năm ô bạn hay quan tâm nhất, nói bằng lời thường.</p>
    <ul class="pl-list">${rows.join('')}</ul>
    <p class="sub">Đây là cách gọi truyền thống để bạn tự soi, <b>không phải kết luận</b> về đời bạn. Muốn nghe giải thích kỹ hơn cho một lĩnh vực, bạn hỏi My nhé.</p></section>
  <details class="howto"><summary>Cách đọc hình lá số này</summary><ul>
    <li><b>12 ô</b> là 12 cung. Tên cung (ví dụ Quan Lộc, Phu Thê) ghi ở góc trên mỗi ô, cho biết ô đó nói về lĩnh vực nào.</li>
    <li><b>Ô viền sáng là cung Mệnh</b>, nói về con người bạn. Bắt đầu đọc từ đây.</li>
    <li><b>Chữ đậm</b> là sao chính của ô, đóng vai tính cách chủ đạo của lĩnh vực đó. Các chữ nhỏ là sao phụ, chữ đỏ là sao cần để ý.</li>
    <li><b>Chữ xanh</b> (Lộc, Quyền, Khoa) là yếu tố thuận, <b>chữ đỏ</b> (Kỵ) là yếu tố dễ vướng bận.</li>
    <li><b>Hai số ở cuối ô</b> (ví dụ 24-33) là khoảng tuổi cung đó giữ vai trò nền, mười năm một cung (gọi là đại hạn).</li>
    <li>Không có ô tốt hay xấu tuyệt đối: mỗi ô là một lăng kính để bạn hiểu mình rõ hơn.</li></ul></details>`;
}

const how = (items) => `<details class="howto"><summary>Cách đọc hình này</summary><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></details>`;

export const HOW_TUTRU = (b) => `<section class="plain"><h4>Đọc nhanh cho bạn</h4>
  <p>Trong Tứ Trụ, bạn được đại diện bởi một hành gọi là <b>nhật chủ</b>: <b>${esc(b.dayMaster.can)}</b> (${esc(b.dayMaster.hanh)}). Bốn trụ giờ, ngày, tháng, năm giống bốn khung bối cảnh quanh bạn.
  ${b.elements.missing.length ? `Trong lá số, hành <b>${b.elements.missing.map(esc).join(', ')}</b> còn ít hoặc vắng; theo truyền thống đây là phần nên bồi thêm bằng thói quen, môi trường sống.` : 'Năm hành có đủ, nên không có hành nào vắng hẳn.'}
  Hành <b>${esc(b.elements.dominant)}</b> đang trội nhất.</p></section>` + how([
  '<b>Bốn cột</b> là giờ, ngày, tháng, năm sinh, mỗi cột có hai chữ (can và chi).',
  '<b>Nhật chủ</b> là chữ trên của cột Ngày, đại diện cho chính bạn.',
  '<b>Thanh Ngũ hành</b> cho thấy hành nào nhiều, hành nào ít trong lá số; thanh dài là hành trội.',
  'Việc "thân vượng hay nhược" chỉ để tham khảo, không phải điểm tốt xấu.']);

export const HOW_ASTRO = (a) => `<section class="plain"><h4>Đọc nhanh cho bạn</h4>
  <p>Mặt Trời ở <b>${esc(a.sun.name)}</b> nói về cách bạn thể hiện ra bên ngoài. Mặt Trăng ở <b>${esc(a.moon.name)}</b>${a.moonUncertain ? ' (chưa chắc vì thiếu giờ sinh)' : ''} nói về cảm xúc bên trong.
  ${a.asc ? `Cung mọc <b>${esc(a.asc.name)}</b> là ấn tượng đầu tiên người khác nhận ra ở bạn.` : 'Muốn biết cung mọc (ấn tượng đầu tiên), bạn cần giờ và nơi sinh.'}</p></section>` + how([
  '<b>Bánh xe tròn</b> là bầu trời lúc bạn sinh, chia thành 12 cung hoàng đạo.',
  '<b>Chấm vàng</b> là Mặt Trời, <b>chấm trắng xanh</b> là Mặt Trăng, các chấm nhỏ là hành tinh khác.',
  '<b>ASC</b> (vạch vàng bên trái) là cung mọc.',
  '<b>Nhà</b> là mười hai lĩnh vực đời sống, tính theo giờ và nơi sinh.',
  'Dấu <b>?</b> nghĩa là chưa chắc chắn vì thiếu giờ sinh.']);

export const HOW_THANSO = (n, keywords) => `<section class="plain"><h4>Đọc nhanh cho bạn</h4>
  <p>Số chủ đạo của bạn là <b>${n.lifePath}</b>: ${esc(keywords[n.lifePath] ?? '')}. Các số còn lại là những mặt khác của bạn, tính từ tên khai sinh.</p></section>` + how([
  '<b>Chủ đạo</b> tính từ ngày sinh, nói về hướng đi lớn của bạn.',
  '<b>Biểu đạt</b> tính từ tên, nói về cách bạn thể hiện và làm việc.',
  '<b>Linh hồn</b> tính từ các nguyên âm trong tên, nói về điều bạn thật sự muốn.',
  '<b>Nhân cách</b> tính từ các phụ âm, nói về hình ảnh người khác thấy.',
  '<b>Năm cá nhân</b> là chủ đề của năm nay với riêng bạn.']);
