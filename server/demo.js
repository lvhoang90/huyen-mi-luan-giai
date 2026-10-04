// Chế độ demo khi chưa có ANTHROPIC_API_KEY: trả lời có cấu trúc từ chính dữ liệu lá số,
// không giả làm AI. Giao diện hiển thị rõ "chế độ demo".
import { NUMBER_KEYWORDS } from '../src/engine/numerology.js';

export function demoReply({ phase, profile, chart, messages }) {
  const name = profile.nickname;
  const last = messages[messages.length - 1]?.content ?? '';
  const { bazi, numerology: n, astro } = chart;

  if (phase === 'listen') {
    const quote = last.length > 140 ? last.slice(0, 137).trim() + '…' : last;
    return [
      `[[dong_cam]]My nghe rồi, ${name}. Bạn nói: “${quote}”. Những lời ấy không nhẹ, và My cảm được bạn đã mang chúng một thời gian.`,
      `[[lang_nghe]]Nếu bạn muốn, hãy kể thêm: điều gì ở chuyện này khiến bạn thấy nặng lòng nhất?`,
    ].join('\n\n');
  }
  if (phase === 'reading') {
    return [
      `[[chia_se]]${name}, My đã nghe câu chuyện của bạn, và My muốn đặt nó cạnh bản đồ ngày sinh để soi.`,
      `Về phần tính toán: Nhật chủ của bạn là ${bazi.dayMaster.can} (${bazi.dayMaster.hanh}), Mặt Trời ở cung ${astro.sun.name}, số chủ đạo là ${n.lifePath} - ${NUMBER_KEYWORDS[n.lifePath]}. Theo truyền thống, đó là những nét gợi một người có khuynh hướng như vậy; đây là lăng kính biểu tượng để soi mình, chứ không phải lời phán về số phận.`,
      `[[chiem_nghiem]]Về phần tâm lý học: khi một chuyện đè nặng, việc viết ra điều mình lo và tách nó thành những phần nhỏ thường giúp cảm xúc bớt mơ hồ.`,
      `[[khich_le]]Một việc nhỏ trong 7 ngày tới: mỗi tối, viết ba dòng - điều đã xảy ra, bạn cảm thấy gì, bạn có thể làm gì nhỏ nhất vào ngày mai.`,
      `[[binh_thuong]](Đây là chế độ demo, chưa kết nối AI nên My chưa thể luận giải sâu. Khi cấu hình khóa API, My sẽ nói chuyện trọn vẹn với bạn.) Điều bạn muốn gỡ trước nhất là gì?`,
    ].join('\n\n');
  }
  return `[[tran_tro]]Chế độ demo chưa kết nối AI nên My chưa thể trò chuyện sâu, ${name} ạ. Khi bạn cấu hình ANTHROPIC_API_KEY cho máy chủ, My sẽ lắng nghe và cùng bạn gỡ rối trọn vẹn.`;
}
