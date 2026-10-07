# Bộ ảnh "Huyền My nói" (8 ảnh) và ảnh ghép góp ý thật

## 1. Bộ ảnh lời My (hài, tự nhận, không gắn cho người dùng)

Ảnh: `anh/huyenmy-loi-my-1.png` đến `-8.png` (dọc 4:5, 1080x1350, có mã QR). Mỗi ảnh ghi rõ "Huyền My nói · Lời của nhân vật", nên không bị hiểu là lời người dùng.
Nội dung gốc ở `loi-my-meme.json`. Sửa chữ rồi dựng lại: `node tools/social-cards.mjs meme`.

### Caption đăng cả bộ
Tám câu My tự nhận về mình 😄
Kiểu này, bạn thấy câu nào trúng nhất? Kể mình nghe ở bình luận nhé.

My không đoán số xổ số, không phán, không dọa. Chỉ có trăng, trà và một lá bài nhẹ nhàng để bạn soi lại mình.

Thử một lá miễn phí, không cần đăng nhập: https://huyenmy.isavietnam.app/tarot

### Caption từng ảnh (ngắn)
1. Số xổ số thì chịu, nhưng đang cần người nghe thì My có mặt 🌙 https://huyenmy.isavietnam.app/tarot
2. Hỏi "người ấy có nhắn lại không", My bảo bốc lá bài đã 🫠 https://huyenmy.isavietnam.app/tarot
3. Lá bài và My đều giỏi ở một việc: làm bạn im lặng ba giây. https://huyenmy.isavietnam.app/tarot
4. Bốc bài xong đừng đổi cả đời, đổi nhẹ cách nói chuyện với chính mình thôi. https://huyenmy.isavietnam.app/tarot
5. AI nhập vai, không phải thầy bói. "Ngủ sớm đi" là lời khuyên thật lòng 😴 https://huyenmy.isavietnam.app/tarot
6. 78 lá, 1 câu hỏi, 0 áp lực. Không có lá sai. https://huyenmy.isavietnam.app/tarot
7. Sếp, người yêu, deadline My không xử giúp được, nhưng nghe bạn kể hết thì được. https://huyenmy.isavietnam.app/tarot
8. Không dọa, không phán, không hứa chắc. Chỉ trăng, trà và một lá bài 🌙 https://huyenmy.isavietnam.app/tarot

### Gợi ý Threads
Đăng 1 ảnh mỗi ngày, mỗi ảnh một câu hỏi ở cuối: "Bạn thấy câu này giống ai?". Câu 2 và 5 thường được bình luận nhiều nhất.

## 2. Ảnh ghép góp ý thật

Dùng góp ý THẬT của người dùng đã tích "cho phép trích dẫn" trong ứng dụng.

1. Vào trang quản trị, mục "Góp ý và lời được phép trích dẫn", bấm "Tải CSV".
2. Chạy: `node tools/social-cards.mjs feedback đường-dẫn/huyenmy-gop-y.csv --out docs/social/anh` (mặc định 3 góp ý mỗi ảnh, đổi bằng `--per 4`).
3. Công cụ chỉ lấy dòng có "Được trích dẫn = true". Người nào không đặt tên hiển thị được ghi "Một người dùng thử". Không thêm, không sửa lời.

Ngoài ứng dụng (tester gửi qua Zalo, bình luận mạng xã hội): xin phép bằng tin nhắn, lưu lại, rồi chép nguyên văn vào một tệp `.json` dạng `[{"text":"...","name":"Tên hiển thị","rating":5,"ok":true}]` và truyền tệp đó thay cho CSV.

### Caption cho ảnh ghép
Họ nói thế này khi thử Huyền My, mình giữ nguyên văn, không chỉnh 🙏
Cảm ơn những người đã cho mình trích lời. Bạn thử một lá Tarot rồi kể mình nghe nhé: https://huyenmy.isavietnam.app/tarot
