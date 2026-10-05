// Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền. Xem LICENSE.
// Lời chào mở đầu có nhiều biến thể để thử xem biến thể nào tạo cảm giác an tâm và tác động tốt nhất (đo ở trang quản trị).
// Mỗi người mới được gán ngẫu nhiên một biến thể và giữ nguyên ở các lần sau. Thêm ?gv=<mã> vào địa chỉ để xem một biến thể.
const PART = () => { const h = new Date().getHours(); return h >= 5 && h < 11 ? 'buổi sáng' : h < 13 ? 'buổi trưa' : h < 18 ? 'buổi chiều' : h < 22 ? 'buổi tối' : 'khuya'; };
const WHO = '[[chiem_nghiem]]Tôi là Huyền My. Tôi giữ lại những gì còn sót của một dòng truyền thừa xưa: thần số, tinh tượng, âm dương ngũ hành.';
const HONEST = '[[nghiem_tuc]]My không nói trước điều chưa đến, cũng không nói điều bạn chỉ muốn nghe. [[chia_se]]My chỉ soi lại tấm bản đồ mà trời đất khẽ đặt vào ngày bạn sinh ra, để bạn nhìn mình rõ hơn.';
export const GREETS = {
  goc: { label: 'Gốc: người lữ khách', veil: () => '', intro: () => ['[[vui]]Chào bạn, người lữ khách đã tìm đến đây.', WHO, HONEST] },
  an_tam: { label: 'An tâm: không cần vội, dừng lúc nào cũng được', veil: () => 'Không cần vội. Bạn muốn dừng lúc nào cũng được.', intro: () => ['[[vui]]Chào bạn. Không cần vội gì cả, và bạn muốn dừng lúc nào cũng được.', WHO, '[[nghiem_tuc]]My không nói trước điều chưa đến, cũng không nói điều bạn chỉ muốn nghe. [[chia_se]]Bạn chỉ kể điều bạn thấy thoải mái; phần còn lại My không hỏi.'] },
  am_ap: { label: 'Ấm áp: chào theo giờ, cảm ơn đã ghé', veil: () => (PART() === 'khuya' ? 'Khuya rồi mà bạn vẫn ghé. My ở đây cùng bạn.' : `Chào ${PART()}, rất vui vì bạn đã ghé.`), intro: () => [`[[vui]]${PART() === 'khuya' ? 'Khuya rồi, chào bạn' : `Chào ${PART()} bạn`}. Cảm ơn bạn đã dành chút thời gian cho My.`, WHO, HONEST] },
  minh_bach: { label: 'Minh bạch: nói thật My là AI', veil: () => 'My là AI, không phải người thật, nhưng sẽ nghe bạn thật lòng.', intro: () => ['[[vui]]Chào bạn. Trước hết My nói thật: My là một người bạn AI, không phải con người.', '[[chiem_nghiem]]Nhưng những gì My tính từ ngày sinh của bạn là tính thật theo thiên văn, và My sẽ lắng nghe bạn nghiêm túc.', HONEST] },
};
export const GV = (() => {
  const keys = Object.keys(GREETS); let v = new URLSearchParams(location.search).get('gv') || '';
  if (!keys.includes(v)) { try { v = localStorage.getItem('huyenmy.gv') || ''; } catch { v = ''; } }
  if (!keys.includes(v)) v = keys[Math.floor(Math.random() * keys.length)];
  try { localStorage.setItem('huyenmy.gv', v); } catch {}
  return v;
})();
