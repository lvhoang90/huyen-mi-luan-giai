// Các kiểu trải bài. Mỗi vị trí là một câu hỏi để soi mình, lấy lời từ ba trường của lá bài: gist (điều lá gợi), mirror (câu hỏi soi mình), step (bước nhỏ).
// Không có vị trí nào là "kết quả" hay "dự báo": lá bài chỉ là cớ để nhìn lại mình. Tự thiết kế cho Huyền My, không theo tài liệu của ai.
// label: dòng đầy đủ; short: nhãn ngắn in trên ảnh; ai: cụm gửi cho My.
export const SPREADS = {
  three: {
    n: 3, tag: 'Ba lá', name: 'Trải ba lá', share: 'Tarot · Ba lá của mình', text: 'ba lá', title: 'Ba lá của bạn',
    pos: [
      { label: 'Điều đang diễn ra', short: 'Đang diễn ra', field: 'gist', ai: 'điều đang diễn ra' },
      { label: 'Điều nên để ý', short: 'Nên để ý', field: 'mirror', ai: 'điều nên để ý' },
      { label: 'Bước nhỏ nên thử', short: 'Bước nhỏ', field: 'step', ai: 'bước nhỏ nên thử' },
    ],
  },
  choice: {
    n: 5, tag: 'Năm lá: lựa chọn', name: 'Trải năm lá: lựa chọn', share: 'Tarot · Năm lá cho một lựa chọn', text: 'năm lá về một lựa chọn', title: 'Năm lá cho một lựa chọn',
    intro: 'Lá bài không chọn thay bạn. Hai lối đi dưới đây chỉ là hai góc nhìn để bạn nghe rõ hơn điều mình thật sự muốn.',
    pos: [
      { label: 'Điều bạn đang đứng giữa', short: 'Đứng giữa', field: 'gist', ai: 'điều bạn đang đứng giữa' },
      { label: 'Lối thứ nhất mở ra điều gì', short: 'Lối thứ nhất', field: 'gist', ai: 'lối thứ nhất mở ra điều gì' },
      { label: 'Lối thứ hai mở ra điều gì', short: 'Lối thứ hai', field: 'gist', ai: 'lối thứ hai mở ra điều gì' },
      { label: 'Điều bạn cần nghe ở chính mình', short: 'Nghe chính mình', field: 'mirror', ai: 'điều bạn cần nghe ở chính mình' },
      { label: 'Một bước nhỏ để thử', short: 'Bước nhỏ', field: 'step', ai: 'một bước nhỏ để thử' },
    ],
  },
  love: {
    n: 7, tag: 'Bảy lá: tình cảm', name: 'Trải bảy lá: tình cảm', share: 'Tarot · Bảy lá về tình cảm', text: 'bảy lá về tình cảm', title: 'Bảy lá về tình cảm',
    intro: 'Đây không phải lời đoán về người kia hay về tương lai. Bảy lá chỉ giúp bạn soi lại lòng mình và cách bạn đang ở trong mối quan hệ.',
    pos: [
      { label: 'Điều bạn đang mang trong lòng', short: 'Trong lòng', field: 'gist', ai: 'điều bạn đang mang trong lòng' },
      { label: 'Điều mối quan hệ này đang gợi', short: 'Mối quan hệ', field: 'gist', ai: 'điều mối quan hệ này đang gợi' },
      { label: 'Điều đang nâng đỡ', short: 'Nâng đỡ', field: 'gist', ai: 'điều đang nâng đỡ' },
      { label: 'Điều đang làm khó', short: 'Làm khó', field: 'mirror', ai: 'điều đang làm khó' },
      { label: 'Điều bạn cần chăm sóc ở chính mình', short: 'Chăm sóc mình', field: 'mirror', ai: 'điều bạn cần chăm sóc ở chính mình' },
      { label: 'Điều nên nói ra hoặc lắng nghe', short: 'Nói và nghe', field: 'step', ai: 'điều nên nói ra hoặc lắng nghe' },
      { label: 'Bước nhỏ nên thử', short: 'Bước nhỏ', field: 'step', ai: 'bước nhỏ nên thử' },
    ],
  },
};
export const MAX_CARDS = 7;
/** Tên kiểu trải theo số lá (1 lá không phải kiểu trải). */
export const spreadOfCount = (n) => Object.entries(SPREADS).find(([, s]) => s.n === n)?.[0] ?? null;
export const spreadByMode = (mode) => SPREADS[mode] ?? null;
/** Cụm nói về kiểu trải theo số lá: "ba lá", "năm lá về một lựa chọn"... */
export const spreadText = (n) => SPREADS[spreadOfCount(n)]?.text ?? `${n} lá`;
