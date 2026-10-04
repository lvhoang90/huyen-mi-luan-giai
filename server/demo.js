// Chế độ demo khi chưa có ANTHROPIC_API_KEY: trả lời có cấu trúc từ chính dữ liệu lá số,
// không giả làm AI. Giao diện hiển thị rõ "chế độ demo".
import { NUMBER_KEYWORDS } from '../src/engine/numerology.js';

export function demoReply({ phase, profile, chart, messages }) {
  const name = profile.nickname;
  const last = messages[messages.length - 1]?.content ?? '';
  const { bazi, numerology: n, astro } = chart;

  // Mỗi lượt chọn một cách vào chuyện và một câu hỏi khác nhau, không nhắc lại nguyên văn lời người dùng quá một lần.
  const turn = messages.filter((m) => m.role === 'assistant').length;
  const pick = (arr, shift = 0) => arr[(turn + shift) % arr.length];
  const short = last.length > 70 ? last.slice(0, 67).trim() + '…' : last;
  if (phase === 'listen') {
    const opens = [
      `[[dong_cam]]My nghe rồi, ${name}. Bạn nói: “${short}”. Những lời ấy không nhẹ.`,
      `[[lang_nghe]]Cảm ơn ${name} đã kể thêm. Có vẻ chuyện này đã ở với bạn khá lâu rồi.`,
      `[[dong_cam]]Nghe bạn kể, My hình dung được sức nặng của nó. Bạn không cần vội gỡ gì ngay đâu.`,
      `[[suy_nghi]]Điều bạn vừa nói làm My dừng lại một chút. Có nhiều lớp trong đó.`,
      `[[lang_nghe]]My vẫn ở đây, ${name}. Cứ nói theo nhịp của bạn.`,
    ];
    const asks = [
      'Điều gì ở chuyện này khiến bạn thấy nặng lòng nhất?',
      'Nếu chuyện này nhẹ đi một chút, ngày thường của bạn sẽ khác thế nào?',
      'Trong chuyện ấy, có phần nào bạn muốn giữ lại, và phần nào bạn muốn buông?',
      'Lúc nào trong ngày bạn nghĩ đến nó nhiều nhất?',
      'Ai là người hiểu chuyện này nhất, hay bạn đang mang nó một mình?',
    ];
    return `${pick(opens)}\n\n[[lang_nghe]]${pick(asks, 2)}${turn >= 2 ? ' Khi nào thấy đủ, bạn có thể mời My luận giải theo lăng kính bạn chọn.' : ''}`;
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
  const echo = [
    `[[chia_se]]Cảm ơn ${name}. Từ lá số, My thấy nhật chủ ${bazi.dayMaster.can} (${bazi.dayMaster.hanh}) thường cần thời gian để thấy rõ mình. Đó là lăng kính để soi, không phải lời phán.`,
    `[[khich_le]]Một bước nhỏ thôi cũng được, ${name}: chọn một việc chỉ mất mười phút và làm nó hôm nay.`,
    `[[chiem_nghiem]]Về phía tâm lý: gọi tên cảm xúc ra thành lời thường làm nó nhẹ bớt. Bạn thử gọi tên cảm xúc lúc này xem.`,
    `[[dong_cam]]My nghe ra điều bạn chưa nói hết. Bạn cứ nói tiếp, My không đánh giá.`,
  ];
  const nexts = ['Bạn muốn đi tiếp theo hướng nào?', 'Phần nào trong đó chạm bạn nhất?', 'Bạn thấy điều gì là bước nhỏ nhất có thể làm?', 'Bạn muốn My soi thêm khía cạnh nào?'];
  return `${pick(echo)}\n\n[[binh_thuong]]${pick(nexts, 1)} (Chế độ demo chưa kết nối AI nên lời My là mẫu, khi có ANTHROPIC_API_KEY My sẽ trò chuyện trọn vẹn.)`;
}
