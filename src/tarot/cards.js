// Bộ Tarot Huyền My: 78 lá (22 Ẩn Chính và 56 Ẩn Phụ). Tranh vẽ riêng (src/tarot/art.js), lời viết riêng, không sao chép từ bộ bài hay sách nào.
// Cách đọc: lá bài là một câu hỏi để soi mình, rút ngẫu nhiên, không phải phép tính và không dự báo sự kiện.
// Các lá thường bị gọi là "xấu" (Chuyển Hóa, Tòa Tháp, Ràng Buộc) được đọc theo hướng thay đổi, bài học và việc có thể làm.
// Lời trong tệp này nên được người chơi Tarot lâu năm đọc lại.
import { MINOR } from './minor.js';
const MAJOR = [
  { id: 0, roman: '0', name: 'Kẻ Khờ', en: 'The Fool', keys: ['khởi đầu', 'liều một chút', 'tin vào bước đi'],
    gist: 'Một chặng mới đang mở ra, chưa có bản đồ đầy đủ. Lá bài nói về lòng can đảm của người dám bước đi khi chưa chắc mọi thứ.',
    mirror: 'Có việc nào bạn đã chuẩn bị đủ rồi mà vẫn đứng ở mép vực, chỉ vì sợ chưa hoàn hảo?',
    step: 'Chọn một việc nhỏ và bắt đầu nó trong hôm nay, dù chỉ mười phút.', emo: 'hao_hung' },
  { id: 1, roman: 'I', name: 'Pháp Sư', en: 'The Magician', keys: ['bắt tay vào làm', 'dùng điều đang có', 'tập trung'],
    gist: 'Bạn đang có sẵn nhiều thứ hơn mình tưởng: kỹ năng, ý tưởng, các mối quan hệ. Lá bài nhắc rằng ý định chỉ thành hình khi được đặt vào hành động.',
    mirror: 'Điều gì trong tay bạn lúc này vẫn chưa được dùng tới?',
    step: 'Liệt kê ba thứ bạn đang có và chọn một thứ để dùng ngay tuần này.', emo: 'khich_le' },
  { id: 2, roman: 'II', name: 'Nữ Tư Tế', en: 'The High Priestess', keys: ['lắng nghe trực giác', 'điều chưa nói ra', 'tĩnh lặng'],
    gist: 'Có điều bạn đã cảm thấy nhưng chưa gọi tên. Lá bài mời bạn chậm lại, nghe tiếng nói bên trong trước khi quyết định.',
    mirror: 'Nếu không ai nhìn và không ai đánh giá, bạn thật sự nghĩ gì về chuyện này?',
    step: 'Dành năm phút yên tĩnh, viết ra điều lòng bạn đang muốn nói.', emo: 'tinh_tam' },
  { id: 3, roman: 'III', name: 'Hoàng Hậu', en: 'The Empress', keys: ['nuôi dưỡng', 'đủ đầy', 'sáng tạo'],
    gist: 'Lá bài của sự chăm sóc và nở rộ. Có thể là lúc bạn chăm bản thân hoặc một việc đang lớn lên, thay vì ép nó đi nhanh.',
    mirror: 'Bạn đã chăm chính mình lần cuối là khi nào, theo cách bạn thật sự thích?',
    step: 'Làm một việc nhỏ chỉ để cơ thể và tâm trí bạn dễ chịu hơn.', emo: 'vui' },
  { id: 4, roman: 'IV', name: 'Hoàng Đế', en: 'The Emperor', keys: ['trật tự', 'ranh giới', 'trách nhiệm'],
    gist: 'Lá bài nói về cấu trúc: kế hoạch rõ ràng, ranh giới rõ ràng, khả năng đứng vững. Quá tay thì thành cứng nhắc, đủ thì thành chỗ dựa.',
    mirror: 'Chỗ nào trong cuộc sống đang cần một quy tắc hoặc một ranh giới rõ hơn?',
    step: 'Đặt một giới hạn nhỏ cho tuần này, ví dụ giờ làm hay giờ nghỉ, rồi giữ nó.', emo: 'nghiem_tuc' },
  { id: 5, roman: 'V', name: 'Người Dẫn Đường', en: 'The Hierophant', keys: ['truyền thống', 'học hỏi', 'lời khuyên'],
    gist: 'Lá bài gợi về những điều đã được đúc kết qua nhiều thế hệ: người thầy, nếp nhà, lẽ phải quen thuộc. Hỏi xem điều nào còn hợp với bạn.',
    mirror: 'Quy tắc nào bạn đang theo vì bạn tin nó, và quy tắc nào chỉ vì quen?',
    step: 'Hỏi một người bạn tin về cách họ từng đi qua chuyện tương tự.', emo: 'chia_se' },
  { id: 6, roman: 'VI', name: 'Đôi Lứa', en: 'The Lovers', keys: ['lựa chọn của trái tim', 'sự hòa hợp', 'giá trị thật'],
    gist: 'Không chỉ là chuyện tình cảm. Lá bài nhắc về việc chọn theo điều mình thật sự coi trọng, và về sự chân thành trong các mối quan hệ.',
    mirror: 'Nếu chọn theo giá trị của mình chứ không theo kỳ vọng của người khác, bạn sẽ chọn gì?',
    step: 'Viết ra ba điều bạn không muốn nhượng bộ, rồi đối chiếu với lựa chọn đang cân nhắc.', emo: 'e_then' },
  { id: 7, roman: 'VII', name: 'Cỗ Xe', en: 'The Chariot', keys: ['quyết tâm', 'giữ hướng', 'điều phối'],
    gist: 'Bạn đang kéo nhiều lực khác nhau về cùng một hướng. Lá bài nói về ý chí và sự tự chủ, thắng không phải bằng sức mạnh mà bằng giữ được phương hướng.',
    mirror: 'Điều gì trong bạn đang kéo hai hướng, và hướng nào bạn thật sự muốn đi?',
    step: 'Chọn một mục tiêu duy nhất cho tuần này và gác các việc còn lại sang một bên.', emo: 'khich_le' },
  { id: 8, roman: 'VIII', name: 'Sức Mạnh', en: 'Strength', keys: ['mạnh mẽ dịu dàng', 'kiên nhẫn', 'can đảm mềm'],
    gist: 'Sức mạnh ở đây là sự điềm tĩnh khi đối diện với phần dữ dội của chính mình. Lá bài nhắc rằng kiên nhẫn và dịu dàng thường đi xa hơn ép buộc.',
    mirror: 'Cảm xúc nào bạn đang cố nén lại, và nếu đón nhận nó bằng sự dịu dàng thì sao?',
    step: 'Khi bực hay lo, hít thở chậm ba lần trước khi trả lời.', emo: 'dong_cam' },
  { id: 9, roman: 'IX', name: 'Ẩn Sĩ', en: 'The Hermit', keys: ['tự soi mình', 'một mình có chủ đích', 'ngọn đèn nhỏ'],
    gist: 'Có lúc cần lui về một chỗ yên để tìm lại hướng đi. Lá bài nói về khoảng lặng có chủ đích, không phải sự cô lập.',
    mirror: 'Điều gì bạn cần nghĩ cho rõ mà chưa có chỗ yên để nghĩ?',
    step: 'Tắt thông báo một buổi tối và để mình ở một mình với điều đang nghĩ.', emo: 'chiem_nghiem' },
  { id: 10, roman: 'X', name: 'Bánh Xe Vận Mệnh', en: 'Wheel of Fortune', keys: ['chuyển động', 'chu kỳ', 'thay đổi nhịp'],
    gist: 'Mọi thứ đều có lúc lên lúc xuống. Lá bài nhắc rằng bạn đang ở một khúc của chu kỳ, và khúc này rồi sẽ qua.',
    mirror: 'Nếu coi giai đoạn này là một mùa, nó đang dạy bạn điều gì?',
    step: 'Ghi lại một việc bạn có thể làm tốt trong khúc hiện tại, thay vì chờ nó đổi.', emo: 'suy_nghi' },
  { id: 11, roman: 'XI', name: 'Công Lý', en: 'Justice', keys: ['cân nhắc', 'sự thật', 'chịu trách nhiệm'],
    gist: 'Lá bài mời nhìn mọi việc bằng chiếc cân: sự thật, hệ quả, và phần trách nhiệm của chính mình. Công bằng với người khác cũng là công bằng với bản thân.',
    mirror: 'Nếu nhìn thẳng vào sự thật của chuyện này, phần việc của bạn là gì?',
    step: 'Viết hai cột: điều bạn kiểm soát được và điều không, rồi chỉ lo cột thứ nhất.', emo: 'nghiem_tuc' },
  { id: 12, roman: 'XII', name: 'Người Treo Ngược', en: 'The Hanged Man', keys: ['nhìn từ góc khác', 'dừng lại', 'buông bớt'],
    gist: 'Khi mọi thứ đứng yên, có thể đó là lúc đổi góc nhìn chứ không phải đổi sức. Lá bài nói về sự chờ đợi có ý nghĩa.',
    mirror: 'Nếu nhìn chuyện này từ phía người kia, hoặc từ một năm sau, nó trông thế nào?',
    step: 'Kể chuyện đang vướng bằng ba câu, rồi thử kể lại từ góc nhìn của người khác.', emo: 'tinh_tam' },
  { id: 13, roman: 'XIII', name: 'Chuyển Hóa', en: 'Death', keys: ['khép lại để mở ra', 'buông cũ', 'đổi thay'],
    gist: 'Đây không phải điềm dữ. Lá bài nói về một chương đang khép lại để chương mới có chỗ. Buông điều đã hết vai trò thường nhẹ hơn mình sợ.',
    mirror: 'Điều gì đã hoàn thành xong nhiệm vụ của nó mà bạn vẫn ôm?',
    step: 'Chọn một thói quen, đồ vật hoặc việc không còn hợp và dọn nó đi.', emo: 'xuc_dong' },
  { id: 14, roman: 'XIV', name: 'Tiết Chế', en: 'Temperance', keys: ['cân bằng', 'hòa trộn', 'từ từ'],
    gist: 'Lá bài nói về nghệ thuật pha trộn vừa đủ: nghỉ và làm, cho và nhận, nhanh và chậm. Điều chỉnh nhỏ đều đặn tốt hơn thay đổi lớn đột ngột.',
    mirror: 'Phần nào trong ngày của bạn đang quá nhiều, phần nào quá ít?',
    step: 'Chuyển một chút thời gian từ chỗ thừa sang chỗ thiếu trong tuần này.', emo: 'binh_thuong' },
  { id: 15, roman: 'XV', name: 'Ràng Buộc', en: 'The Devil', keys: ['thói quen trói buộc', 'ham muốn', 'tự do chọn lại'],
    gist: 'Lá bài chỉ ra những sợi dây ta tự quấn: thói quen, nỗi sợ, sự phụ thuộc. Điều đáng chú ý là các sợi dây trong tranh khá lỏng, nghĩa là có thể gỡ.',
    mirror: 'Điều gì bạn nói là không thể bỏ, nhưng thật ra bạn có thể chọn lại?',
    step: 'Gọi tên một thói quen đang lấy nhiều hơn cho đi, và thử bớt nó đi một chút.', emo: 'tran_tro' },
  { id: 16, roman: 'XVI', name: 'Tòa Tháp', en: 'The Tower', keys: ['xáo trộn bất ngờ', 'sự thật lộ ra', 'dựng lại'],
    gist: 'Có điều gì đó dựng trên nền chưa vững đang lung lay. Dù khó chịu, lá bài cho thấy chỗ cần dựng lại chắc hơn, và người bước ra khỏi tháp vẫn an toàn.',
    mirror: 'Nếu cái đang lung lay bị bỏ đi, điều gì thật sự vững vẫn còn lại với bạn?',
    step: 'Kiểm tra một nền tảng đang làm bạn bất an, ví dụ tiền, việc hay một lời hứa, và củng cố một chỗ nhỏ.', emo: 'ngac_nhien' },
  { id: 17, roman: 'XVII', name: 'Ngôi Sao', en: 'The Star', keys: ['hy vọng', 'hồi phục', 'tin dịu dàng'],
    gist: 'Sau thời gian căng thẳng, lá bài nói về sự hồi phục và niềm tin nhỏ nhưng bền. Không cần rực rỡ, chỉ cần đủ sáng để đi tiếp.',
    mirror: 'Điều gì, dù nhỏ, vẫn khiến bạn thấy còn hy vọng?',
    step: 'Làm một việc chăm sóc bản thân đều đặn mỗi ngày trong ba ngày tới.', emo: 'an_ui' },
  { id: 18, roman: 'XVIII', name: 'Mặt Trăng', en: 'The Moon', keys: ['mơ hồ', 'cảm xúc dâng lên', 'chưa rõ đường'],
    gist: 'Mọi thứ nhìn dưới ánh trăng thường mờ và dễ bị cảm xúc tô màu. Lá bài nhắc không vội kết luận khi chưa đủ sáng.',
    mirror: 'Nỗi lo nào của bạn là sự thật, và nỗi lo nào là cái bóng của nó?',
    step: 'Hoãn một quyết định lớn đến sáng mai, rồi nhìn lại khi đầu óc đã nghỉ.', emo: 'suy_nghi' },
  { id: 19, roman: 'XIX', name: 'Mặt Trời', en: 'The Sun', keys: ['niềm vui', 'rõ ràng', 'sức sống'],
    gist: 'Lá bài của sự rõ ràng và niềm vui giản dị. Khi mọi thứ sáng lên, đó là lúc cho phép mình vui và chia sẻ niềm vui ấy.',
    mirror: 'Điều gì khiến bạn cười thật sự gần đây, và bạn có chia sẻ nó với ai chưa?',
    step: 'Nói lời cảm ơn hoặc một câu vui với một người hôm nay.', emo: 'cuoi_tit' },
  { id: 20, roman: 'XX', name: 'Thức Tỉnh', en: 'Judgement', keys: ['tiếng gọi bên trong', 'nhìn lại', 'bắt đầu mới'],
    gist: 'Một tiếng gọi rõ ràng đang vang lên: nhìn lại chặng đã qua, tha thứ cho phần chưa hoàn hảo và bước sang trang. Lá bài nói về sự thức dậy có ý thức.',
    mirror: 'Nếu tha thứ cho bản thân vì điều đã qua, bạn sẽ làm gì khác đi?',
    step: 'Viết một câu cho phiên bản của bạn một năm trước, rồi một câu cho phiên bản một năm sau.', emo: 'xuc_dong' },
  { id: 21, roman: 'XXI', name: 'Thế Giới', en: 'The World', keys: ['hoàn thành', 'trọn vẹn', 'mở chương mới'],
    gist: 'Một vòng đã khép lại. Lá bài mời bạn ghi nhận những gì đã làm được trước khi đi tiếp, vì mỗi chặng hoàn thành đều là nền cho chặng sau.',
    mirror: 'Điều gì bạn đã hoàn thành mà chưa tự công nhận?',
    step: 'Liệt kê ba điều bạn đã làm được trong năm nay và tự khen mình một câu.', emo: 'vui' },
];
export const CARDS = [...MAJOR, ...MINOR];
/** Chủ đề người dùng chọn trước khi bốc bài (chỉ là nhãn, không có nội dung tự do). */
export const TOPICS = [['tinh-cam', 'Tình cảm'], ['cong-viec', 'Công việc'], ['tien-bac', 'Tiền bạc'], ['suc-khoe', 'Sức khỏe'], ['ban-than', 'Bản thân'], ['gia-dinh', 'Gia đình và bạn bè'], ['hoc-tap', 'Học tập'], ['khac', 'Điều khác']];
export const topicLabel = (k) => TOPICS.find(([s]) => s === k)?.[1] ?? null;
/** Đọc tham số ?tarot=3,17,40: chỉ nhận số nguyên trong bộ bài, tối đa ba lá; chuỗi rỗng thì không có lá nào (không phải lá số 0). */
export const parseCardIds = (param) => String(param ?? '').split(',').filter((x) => /^\d+$/.test(x.trim())).map(Number).filter((n) => n >= 0 && n < 78).slice(0, 3);
export const cardById = (id) => CARDS.find((c) => c.id === +id) ?? null;

/** Rút ngẫu nhiên n lá khác nhau bằng bộ sinh số ngẫu nhiên của trình duyệt (hoặc của máy chủ), không thiên vị. */
export function drawCards(n, rand = (m) => (globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % m : Math.floor(Math.random() * m))) {
  const pool = CARDS.map((c) => c.id), out = [];
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(rand(pool.length), 1)[0]);
  return out;
}

/** Lá của ngày: cùng một người, cùng một ngày thì ra cùng một lá. `seed` là chuỗi riêng của người đó; `day` là ngày theo giờ Việt Nam. */
export function dailyCard(seed, day) {
  let h = 2166136261; for (const ch of `${seed}|${day}`) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return CARDS[h % CARDS.length].id;
}
export const vnDay = (now = new Date()) => { const t = new Date(now.getTime() + 7 * 3600_000); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
