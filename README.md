# Huyền My Luận Giải

Nền tảng luận giải huyền học Đông-Tây với nhân vật 2D **Huyền My** và trí tuệ nhân tạo. Đây không phải máy bói: đây là một người đồng hành biết lắng nghe, dùng lá số như một **tấm gương biểu tượng** để soi mình, rồi cùng người dùng gỡ rối bằng cả truyền thống lẫn tâm lý học.

## Điều làm sản phẩm khác biệt

| | Sản phẩm thường thấy | Huyền My |
|---|---|---|
| **Nguồn con số** | AI "đoán" hoặc bịa Can Chi, cung hoàng đạo | **Tính bằng thuật toán** (tiết khí thật từ kinh độ Mặt Trời, Meeus, Pythagoras). AI chỉ nhận số đã tính và không được sửa. Có test đối chiếu mốc đã biết |
| **Minh chứng** | Nói chắc nịch, không nêu nguồn | Mỗi nhận định thuộc **một trong ba tầng**: *Tính toán* · *Truyền thống* · *Tâm lý học*. My luôn nói đang ở tầng nào, và nói thật rằng chưa có bằng chứng ngày giờ sinh quyết định số phận |
| **Giới hạn dữ liệu** | Ẩn đi | Bảng **Lá số** (☯) hiển thị cách tính và các giới hạn (thiếu giờ sinh, sát ranh tiết khí, múi giờ lịch sử…); My nói rõ điều chưa chắc |
| **Phương pháp** | Một kiểu xem cố định | **Chiều theo người dùng**: Tử Vi Đẩu Số (12 cung), Tứ Trụ, chiêm tinh (10 thiên thể, nhà, góc chiếu), thần số học, Bát Trạch. Người dùng chọn lăng kính, My nói đúng ngôn ngữ của nó. Phương pháp chưa có dữ liệu (Kỳ Môn, Mai Hoa, chỉ tay…) thì My nói thật là chưa có, không giả vờ |
| **Cá nhân hóa** | Cùng một khuôn cho mọi người | Mỗi lá số có danh sách **"nét riêng"** xếp theo độ hiếm; My neo vào chi tiết trong lời kể của người dùng, thử "câu này nói với ai cũng được không?", đổi cách vào chuyện theo từng lượt và không lặp lại lời mở đầu cũ |
| **Thứ tự** | Hỏi ngày sinh rồi phun kết quả | Tự giới thiệu → xin thông tin → **lắng nghe trước** → mời luận giải → đồng hành. My chỉ luận khi người dùng mời |
| **Đạo đức** | Dọa "hạn", bán giải hạn | Không nói lời tổn thương, không nói sai sự thật, không nịnh (chống hiệu ứng Barnum), không bán cúng bái, không tiên đoán bệnh/chết/đầu tư, có quy trình khi gặp khủng hoảng |
| **Cảm xúc** | Giao diện chat phẳng | Nhân vật chibi **Huyền My** 2D (áo dài tím thêu sen, nón lá viền lông có ngôi sao ngũ hành, voan phủ) với **18 trạng thái cảm xúc**: vui, cười tít mắt, hào hứng, buồn, đồng cảm, xúc động (rơm rớm nước mắt), chia sẻ, trăn trở, chiêm nghiệm, suy nghĩ, ngạc nhiên, e thẹn, an ủi, khích lệ, tinh nghịch, nghiêm túc, lắng nghe, bình thường. Mỗi trạng thái chỉnh mắt (chớp, nháy, tròn xoe, cong tít, ướt), mày, miệng, má, tư thế tay, hướng nhìn và dáng đầu. Miệng nhép theo từng chữ My gõ ra. AI tự chọn cảm xúc cho từng đoạn bằng thẻ `[[ten]]` ẩn. Xem tất cả tại `/emotions.html` |

## Mở đầu và nhịp buổi trò chuyện

- **Hook mở đầu:** sau khi tính xong lá số, My kể những người nổi tiếng cùng ngày sinh (hoặc sát ngày), một người cùng lĩnh vực làm việc của bạn và người cùng năm sinh, chọn theo tuổi: người trẻ nhận ngôi sao trẻ, người lớn tuổi nhận danh nhân, nhà khoa học, nhà văn. Dữ liệu ở `src/engine/famous.js` và `famous-more.js` (khoảng 470 người, tự soạn, chưa đối chiếu nguồn mở; `tools/fetch-famous.mjs` + `tools/merge-famous.mjs` dựng thêm bộ từ Wikidata (CC0) và đối chiếu bộ tự soạn khi chạy ở nơi có mạng; xem đầu tệp). My luôn nói rõ đó chỉ là điểm chung, không phải số phận.
- **Mỗi buổi tối đa 30 phút:** còn 5 phút thì hiện đồng hồ, hết giờ My tạm biệt, nói điều thật sự chưa kể từ lá số, rồi nghỉ 3 giờ. Chỉnh `SESSION_MIN`, `WARN_MIN`, `COOLDOWN_MIN` trong `src/main.js`.

## Tài khoản, theo dõi hành trình và trang quản trị

- **Gắn email sớm:** ngay sau khi My kể điều thú vị đầu tiên (người nổi tiếng cùng ngày sinh và nét hiếm trong lá số), My đề nghị gửi chính những điều đó vào email. Không bắt buộc, có nút "Để sau". Nhập email xong, máy chủ gửi thư tóm tắt (`/api/account/hook`).
- **Tài khoản chỉ bằng email:** sau buổi đầu 30 phút, người dùng nhập email, nhận mã 6 số (không mật khẩu). Máy chủ chặn `/api/chat` của người chưa đăng ký sau 32 phút. Có một ô đồng ý "cho My nhớ cuộc trò chuyện" (mặc định không chọn); chỉ khi đồng ý mới lưu cuộc trò chuyện lên máy chủ, mã hóa nếu đặt `HUYENMY_DATA_KEY`. Người dùng tự xóa tài khoản và dữ liệu trong hộp "Tài khoản" (☺).
- **Gửi email:** đặt `RESEND_API_KEY` và `MAIL_FROM`. Khi chạy thử không có khóa, mã được in ra console máy chủ (không bao giờ trả về trình duyệt); ở `NODE_ENV=production` thiếu khóa thì báo lỗi rõ ràng.
- **Theo dõi:** `src/track.js` chỉ gửi tên bước và vài giá trị ngắn, không gửi nội dung trò chuyện, tên hay ngày sinh. Máy chủ chấm chất lượng từng lượt trả lời bằng quy tắc (`server/quality.js`: hỏi dồn, lặp, nói chắc nịch, dọa hạn, thiếu hỗ trợ khi khủng hoảng, độ bám lời người dùng) và chỉ lưu chỉ số, không lưu nội dung.
- **Trang quản trị `/admin`:** đăng nhập bằng email trong `ADMIN_EMAILS`. Có phễu hành trình, giữ chân theo cohort (D1/D3/D7), độ đúng và NPS, chất lượng tư vấn, phân khúc tuổi và lĩnh vực, giới thiệu, bảng AARRR và HEART, cùng danh sách khuyến nghị xếp theo ưu tiên (tác động × độ tin cậy dữ liệu ÷ công sức). Mọi tỉ lệ kèm khoảng tin cậy Wilson 95%; khi mẫu nhỏ, hệ thống nói "chưa đủ dữ liệu".
- **Xem thử với dữ liệu giả lập:** `DATABASE_FILE=./data/demo.db node tools/seed-demo-data.mjs 600`, rồi chạy máy chủ với cùng biến đó. Đây không phải số liệu thật.
- **Lưu ý triển khai:** SQLite nằm ở `DATA_DIR` (mặc định `./data`), trên host cần gắn ổ đĩa bền vững. Đây là dữ liệu cá nhân (email, và cuộc trò chuyện nếu được đồng ý): cần chính sách quyền riêng tư và căn cứ pháp lý phù hợp, ví dụ Nghị định 13/2023/NĐ-CP, trước khi mở công khai.

## 12 cung, thời vận và trang Khám phá

- **Thời vận** (`src/engine/thoivan.js`): lưu niên theo Lưu Thái Tuế và Lưu Tứ Hóa, lưu nguyệt theo cách Đẩu Quân, Tứ Trụ (hành và địa chi của năm, tháng so với Nhật chủ), năm và tháng cá nhân của thần số học, các giai đoạn đời theo đại hạn. Kết quả là **"mức chú ý" nhẹ, vừa, nhiều**: chỉ đếm số yếu tố đang kích hoạt một lĩnh vực, không phải điểm tốt xấu và không dự báo sự kiện. My nhận khối này làm dữ kiện và chỉ nói theo kiểu "giai đoạn nên chú ý điều gì". Chưa có tiểu hạn và sao lưu khác; đã đối chiếu với thư viện iztro: Lưu Thái Tuế, tên cung lưu niên, Lưu Tứ Hóa và lưu nguyệt Đẩu Quân khớp 100% trên 379 lá số có gốc trùng (1.137 lượt năm, 13.644 lượt tháng) bằng `tools/compare-iztro.mjs`. iztro cùng trường phái Trung Hoa phổ biến, nên vẫn nên có một người xem Tử Vi duyệt quy tắc trước khi thu phí.
- **Radar 12 cung và tab Thời vận** trong bảng lá số ☯ (`src/chart-view.js`, dùng chung với trang Khám phá). Bấm một cung hoặc một tháng rồi "Hỏi My" thì câu hỏi đi thẳng vào cuộc trò chuyện. Với năm đã qua, người dùng được hỏi lá số có khớp không; số liệu này hiện ở trang quản trị.
- **Trang `/kham-pha`**: xem lá số, 12 cung, thời vận không cần đăng nhập, mọi phép tính chạy trên trình duyệt. Có ba hồ sơ mẫu hư cấu và phép tính từ ngày sinh công khai của người nổi tiếng (chỉ từ năm 1800, không diễn giải). Nút "Trò chuyện với My" chuyển hồ sơ sang ứng dụng.
- **Quy ước đang dùng và đối chiếu lá số** (`src/engine/doichieu.js`): mỗi bảng lá số có khung nêu ba quy ước (lịch âm UTC+7, tháng nhuận theo số tháng gốc, giờ Tý muộn) và đánh dấu điều nào chạm vào ngày sinh của người xem. Tab "Đối chiếu" cho người dùng nhập Cục và cung Mệnh của lá số từ ứng dụng khác; My báo khớp hay lệch và thử các tổ hợp quy ước để giải thích chỗ lệch (đã kiểm với các ca thật của lịch Trung Quốc và tháng nhuận). Không bên nào bị coi là sai.
- **Zalo**: đặt `ZALO_URL` (chỉ nhận https tới tên miền Zalo) để hiện lối vào nhóm ở cuối buổi, màn nghỉ, trang Khám phá và email nhắc.
- **Góp ý có xin phép trích dẫn**: lý do điểm giới thiệu, người dùng chọn ẩn danh, ghi tên hay không cho trích. Xem tab "Góp ý và trích dẫn" ở `/admin`.
- **Thử giá trước khi thu phí**: đặt `UPGRADE_TEST=on` (và tùy chọn `UPGRADE_PRICES`) để hiện nút "gói Đồng hành (sắp mở)" ở màn nghỉ và cuối buổi. Không có thanh toán, giao diện nói rõ gói chưa mở bán và chưa thu tiền. Mỗi người được gán một mức giá cố định; trang quản trị đếm số người thấy, mở, bấm quan tâm và cảm nhận giá. Đây là ý định chứ chưa phải việc trả tiền.
- Trước khi thu phí: xem `docs/THU-PHI-VA-PHAP-LY.md` và bản nháp `docs/legal/nhap-thu-phi.md` (chưa áp dụng).

## Chạy

```bash
npm install
cp .env.example .env     # điền ANTHROPIC_API_KEY
npm run dev              # http://localhost:5173
npm test                 # kiểm tra lõi tính toán
npm run build && npm start   # chạy bản production
```

Chưa có khóa API thì ứng dụng chạy **chế độ demo** (có huy hiệu trên giao diện): toàn bộ hành trình, lá số và nhân vật cảm xúc hoạt động, chỉ phần trả lời của My là mẫu có cấu trúc, không phải AI. Biến môi trường: `ANTHROPIC_API_KEY`, `HUYENMY_MODEL` (mặc định `claude-sonnet-5-5`), `PORT`, `HUYENMY_ACCESS_CODE`.

**Mã truy cập (khi đưa lên mạng):** đặt `HUYENMY_ACCESS_CODE=<mã bạn chọn>` thì màn chào sẽ hỏi mã trước khi vào, và máy chủ từ chối `/api/chat` nếu thiếu hoặc sai mã, nên người lạ không dùng hết lượt gọi AI của bạn. Mã được so sánh hằng thời gian, nhập sai 8 lần trong 10 phút thì khóa tạm theo IP, và mã đúng được nhớ trên thiết bị. Để trống thì ai cũng vào được. Lưu ý: nếu chạy sau reverse proxy thì mọi người cùng một IP nên bộ đếm khóa tính chung.

## Kiến trúc

```
src/engine/   Lõi tính toán thuần JS, dùng chung cho trình duyệt và máy chủ
  astro.js      Thiên văn (astronomy-engine), cung mọc, 10 thiên thể, nhà, góc chiếu
  lunar.js      Lịch âm Việt Nam từ trăng non + trung khí (UTC+8 trước 1968, UTC+7 từ 1968)
  tuvi.js       Tử Vi Đẩu Số: Mệnh/Thân, Cục, 14 chính tinh, Tứ Hóa, phụ/sát tinh, Trường Sinh, đại hạn
  bazi.js       Tứ Trụ, nạp âm, cân bằng ngũ hành, cung mệnh Bát Trạch
  numerology.js Thần số học Pythagoras cho họ tên tiếng Việt
  index.js      Chuẩn hóa hồ sơ, dựng lá số, mô tả cho AI, "nét riêng" của lá số
src/character.js  Điều khiển nhân vật 2D: 18 cảm xúc, ánh nhìn, quay đầu, nghiêng, nảy, chớp mắt, miệng theo chữ
src/assets/huyenmy-rig.svg  Nhân vật dạng rig: mỗi bộ phận là một nhóm điều khiển được (sinh bởi tools/rig.py)
src/backdrop.js   Nền 2D nhẹ: sao, đom đóm, cánh sen, vòng bát quái xoay chậm
src/emotion-tags.js  Đọc thẻ cảm xúc [[ten]] trong lời My nói, chuẩn hóa dấu gạch
emotions.html     Trang xem tất cả cảm xúc
art/              Ảnh gốc 2D (SVG + PNG); public/art/ chỉ giữ tệp ứng dụng dùng
tools/chibi.py    Bản vẽ nhân vật đã chốt; tools/rig.py dựng rig từ đó
src/main.js       Hành trình hội thoại, streaming SSE, bảng lá số theo thẻ
server/           Máy chủ Node: /api/chat (SSE → Claude), persona.js, demo.js
```

Máy chủ **tự tính lại lá số** từ hồ sơ (không tin dữ liệu lá số do trình duyệt gửi), chuẩn hóa tên để chống chèn chỉ dẫn, giới hạn kích thước và tần suất, và không lưu gì. Lịch sử trò chuyện chỉ nằm trong `localStorage` của thiết bị người dùng.

## Mức độ kiểm chứng (nói rõ cái gì đã kiểm, cái gì chưa)

- **Lịch âm**: đối chiếu 6.660 ngày (1930-2040) với `lunar-javascript`. **Trước 1968: 0 sai lệch.** Từ 1968 có lệch đúng 1 ngày ở khoảng 4% số tháng, đúng như dự kiến vì lịch âm Việt Nam dùng UTC+7 còn lịch Trung Hoa dùng UTC+8. Các mốc Tết, tháng nhuận 2020/2023/2025 khớp lịch thực.
- **Tử Vi**: đối chiếu 4.000 lá số ngẫu nhiên với thư viện độc lập `tuvi-neo`: **0 sai lệch** về Cục, tên 12 cung, vị trí cả 14 chính tinh, 16 phụ/sát tinh, Trường Sinh. Lưu ý: cả hai theo trường phái phổ biến ở Việt Nam; thư viện đối chứng tự ghi là phần lớn do AI sinh, nên đây là bằng chứng nhất quán chứ chưa phải thẩm định của thầy Tử Vi.
- **Tứ Trụ, thần số, cung hoàng đạo**: có test theo các mốc đã biết (`npm test`, 14 test).
- **Giao diện**: đã chạy trọn hành trình trên trình duyệt headless (desktop và điện thoại) ở chế độ demo, không lỗi console.
- **Chưa kiểm**: phần trả lời bằng AI thật (môi trường dựng không có khóa API), chất lượng cá nhân hóa của prompt qua nhiều hội thoại thật, và hiệu năng trên GPU thật.

## Giới hạn hiện tại

- Tử Vi chưa có độ sáng của sao (miếu/hãm), Tuần/Triệt, tiểu hạn và các sao lưu (đã có Lưu Thái Tuế, Lưu Tứ Hóa và lưu nguyệt Đẩu Quân, xem `src/engine/thoivan.js`; phần này đã đối chiếu với iztro, xem mục thời vận bên dưới); các phái khác nhau (ví dụ Tứ Hóa năm Canh) có thể cho kết quả khác.
- Tứ Trụ chỉ xét can chi chính khí, chưa xét tàng can, hợp xung, đại vận. "Thân vượng/nhược" chỉ tham khảo.
- **Nhân vật 2D** vẽ bằng mã nên nét gọn, kiểu sticker, chưa có độ tinh xảo của tranh họa sĩ vẽ tay. Quay đầu chỉ mô phỏng bằng cách dịch chuyển nét mặt so với tóc và da, không phải góc nhìn 3/4 thật. Muốn nhân vật đẹp hơn, nên nhờ họa sĩ vẽ lại theo cùng cấu trúc bộ phận (xem `tools/rig.py`).
- Không dùng giọng nói: My chỉ trò chuyện bằng chữ. Không còn thư viện 3D nên ứng dụng gọn nhẹ.

## Bản quyền

© 2026 **Lương Việt Hoàng**. Bảo lưu mọi quyền. Đây là phần mềm độc quyền, không phải nguồn mở: **mọi sử dụng (sao chép, chạy bản công khai, chỉnh sửa, phân phối, thương mại, huấn luyện mô hình) cần có sự cho phép bằng văn bản của tác giả**. Xem [LICENSE](LICENSE) (song ngữ) và [NOTICE](NOTICE) (thành phần bên thứ ba). **Cách xin phép:** gửi email tới luongviethoang.hcm@gmail.com, nêu bạn là ai, định làm gì, ở đâu và trong bao lâu; khi đồng ý, tác giả trả lời theo [mẫu cấp phép](docs/MAU-GIAY-CAP-PHEP.md). Bản quyền tự phát sinh khi sáng tác (Việt Nam là thành viên Công ước Berne); đăng ký tại Cục Bản quyền tác giả là tùy chọn nhưng giúp chứng minh khi có tranh chấp. Đây không phải tư vấn pháp lý.

## Chất liệu mở và giấy phép

- `astronomy-engine` (MIT), `@anthropic-ai/sdk` (MIT).
- Nhân vật 2D do dự án tự vẽ bằng mã (`tools/chibi.py`, `tools/rig.py`); không dùng mô hình hay hình ảnh của bên thứ ba.
- `tuvi-neo`, `lunar-javascript` và `iztro` (MIT) chỉ dùng để đối chiếu khi kiểm thử, không nằm trong sản phẩm.

Hướng dẫn đưa lên web: [docs/TRIEN-KHAI.md](docs/TRIEN-KHAI.md).

Trang pháp lý (Điều khoản, Quyền riêng tư, Bản quyền) soạn ở `docs/legal/*.md` và `LICENSE`, dựng thành `public/*.html` bằng `node tools/build-legal.mjs`.
