# Trước khi thu phí: pháp lý, niềm tin và cách quyết định giá

Tài liệu nội bộ cho tác giả. Đây **không phải tư vấn pháp lý hay thuế**. Quy định về dữ liệu cá nhân, thương mại điện tử, hóa đơn điện tử và thuế thay đổi nhanh trong những năm gần đây, nên mọi mục dưới đây cần được kế toán hoặc luật sư kiểm tra lại với quy định đang có hiệu lực vào ngày bạn mở thu phí.

## 1. Việc phải xong trước ngày thu đồng đầu tiên

| # | Việc | Ai làm | Ghi chú |
|---|---|---|---|
| 1 | Chọn chủ thể thu tiền: hộ kinh doanh hay công ty (và ngành nghề đăng ký phù hợp với dịch vụ nội dung số, tư vấn giải trí) | Tác giả + kế toán | Hiện chủ thể là cá nhân (xem `docs/legal/dieu-khoan.md`). Tên chủ thể phải xuất hiện đúng trên điều khoản, hóa đơn và trang thanh toán. HumanView ghi rõ công ty chủ quản; đây là điểm tạo niềm tin nên làm tương tự. |
| 2 | Mở tài khoản ngân hàng đứng tên chủ thể và chọn cổng thanh toán (VietQR, payOS, MoMo, ZaloPay, VNPay hoặc tương đương) | Tác giả | Ưu tiên cổng có hóa đơn đối soát rõ và hoàn tiền được. |
| 3 | Hóa đơn điện tử, kê khai và nộp thuế theo loại hình đã chọn | Kế toán | Hỏi rõ mức doanh thu bắt buộc dùng hóa đơn điện tử và cách tính thuế cho hộ kinh doanh hiện hành. |
| 4 | Website bán hàng: kiểm tra có phải thông báo hoặc đăng ký website thương mại điện tử với cơ quan quản lý hay không | Luật sư | Nội dung thông báo thường gồm thông tin chủ thể, giá, điều kiện giao dịch, chính sách đổi trả và bảo mật. |
| 5 | Quyền người tiêu dùng: công bố giá rõ ràng, điều kiện hoàn tiền, cách hủy, thời hạn truy cập | Luật sư rà soát bản nháp ở mục 2 | Luật Bảo vệ quyền lợi người tiêu dùng hiện hành. |
| 6 | Dữ liệu cá nhân: cập nhật chính sách quyền riêng tư cho dữ liệu thanh toán, căn cứ xử lý, nơi lưu, thời gian lưu | Luật sư | Nghị định 13/2023/NĐ-CP và luật về bảo vệ dữ liệu cá nhân mới hơn (kiểm tra bản có hiệu lực). Ngày giờ sinh và nội dung trò chuyện có thể được coi là dữ liệu nhạy cảm, nên cần cân nhắc kỹ. |
| 7 | Cập nhật `docs/legal/dieu-khoan.md` mục 3 (hiện ghi "Dịch vụ miễn phí") và dựng lại trang bằng `node tools/build-legal.mjs` | Tác giả | Chỉ làm vào ngày bắt đầu thu phí; mục 2 dưới đây là bản nháp, chưa áp dụng. |
| 8 | Lời hứa với người đã dùng thử: người thử trong giai đoạn demo được giá tri ân (xem mục 3) | Tác giả | Ghi lại danh sách bằng email đã xác thực. |

## 2. Bản nháp điều khoản thu phí, hoàn tiền và thời hạn truy cập

Bản nháp ở `docs/legal/nhap-thu-phi.md`. Cố tình để ngoài thư mục xây trang tĩnh, nên **chưa xuất hiện trên web**. Khi luật sư duyệt xong, gộp vào `dieu-khoan.md` và dựng lại.

Ba điều HumanView chưa nói rõ (không có chính sách hoàn tiền, không nêu thời hạn truy cập hai gói đầu, không có đánh giá) là chỗ Huyền My nên nói rõ ngay từ đầu.

## 3. Giá tri ân cho người thử demo

- Mọi người đã đăng ký email trước ngày thu phí: giảm 50% vĩnh viễn gói Đồng hành, hoặc 3 tháng đầu miễn phí (chọn một, ghi trong thư thông báo).
- Điều kiện duy nhất: góp ý một lần (đã có sẵn trong ứng dụng ở cuối buổi). Không ép viết đánh giá tốt.
- Chỉ trích lời khi người đó đã chọn "Được, ẩn danh" hoặc "Được, ghi tên". Xem tab "Góp ý và trích dẫn" ở trang quản trị.

## 4. Quyết định giá bằng dữ liệu, không bằng cảm tính

Trang quản trị hiện có sẵn các số cần cho quyết định:

| Câu hỏi | Chỉ số ở trang quản trị | Ngưỡng gợi ý để đi tiếp |
|---|---|---|
| Người ta có thấy My nói đúng không? | "Cho rằng My nói đúng" và NPS (tab Tăng trưởng) | Đúng ≥ gần đúng trên 70%, NPS trên 30, mỗi chỉ số có ít nhất 30 người trả lời |
| Lớp thời vận có đáng thu tiền không? | "Lớp thời vận khớp với năm đã qua" | Trên 50% trả lời "một phần trở lên", đồng thời ít nhất 30 câu trả lời. Dưới ngưỡng này thì để thời vận miễn phí và chưa tính vào gói trả phí |
| Phễu Khám phá có kéo người vào không? | "Trang Khám phá" và "Đã đến ứng dụng với hồ sơ" | So tỉ lệ người đến từ Khám phá với người vào thẳng màn chào |
| Giá nào chấp nhận được? | Hỏi bốn câu giá (Van Westendorp) trong hộp góp ý | Thử với ít nhất 30 người trước khi chốt |

Lưu ý: độ đúng do người dùng tự nhận chịu hiệu ứng Barnum (lời chung chung vẫn thấy đúng). Hãy đọc cùng tỉ lệ "bám lời người dùng" ở tab Chất lượng. Câu hỏi nhìn lại năm đã qua tốt hơn câu hỏi chung vì người trả lời đối chiếu với chuyện có thật.

## 5. Những điều chưa được kiểm chứng

- Phần thời vận (lưu niên, lưu nguyệt) **chưa đối chiếu với thư viện độc lập** vì chưa có thư viện nào làm cùng phần này. Lịch âm, tiết khí, đại hạn thì đã kiểm (xem `README.md`). Nên nhờ một người xem Tử Vi có kinh nghiệm duyệt quy tắc ở đầu `src/engine/thoivan.js` trước khi thu phí.
- "Mức chú ý" là cách đếm yếu tố kích hoạt, không phải mô hình dự báo, và không có bằng chứng khoa học rằng nó dự báo được sự kiện. Mọi nơi hiển thị đều đã ghi rõ điều đó; giữ nguyên khi làm trang bán hàng.
