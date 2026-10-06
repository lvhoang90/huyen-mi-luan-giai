# Đánh giá kiểm thử trên 50 cấu hình thiết bị

Ngày 06/10/2026, bản mã trên nhánh `claude/lucid-pasteur-9ytz4j`.

## Phạm vi và giới hạn (đọc trước)

"50 người kiểm thử" ở đây là **50 cấu hình thiết bị ảo**, mỗi cấu hình chạy cùng một bộ kịch bản tự động; không phải 50 người thật hay 50 thiết bị thật. Công cụ nằm ở `tools/qa` (cấu hình ở `profiles.mjs`, kịch bản ở `run.mjs`, báo cáo ở `report.mjs`), chạy lại được bất cứ lúc nào.

Những gì được giả lập bằng Chromium của Playwright: kích thước màn hình và mật độ điểm ảnh, cảm ứng, chuỗi nhận diện trình duyệt (kể cả Zalo, Facebook, Messenger), mạng 3G và CPU chậm, múi giờ và ngôn ngữ, giảm chuyển động, màn hình hẹp (cỡ hiển thị lớn nhất), điện thoại gập, nằm ngang.

**Không được kiểm tra:**
- Lõi Safari (WebKit) và Firefox: iPhone, iPad, Mac chỉ được giả lập kích thước và chuỗi nhận diện. Hành vi riêng của Safari (hộp thoại chia sẻ, bộ nhớ tạm, SVG, 100vh, ô nhập ngày) cần thử trên iPhone thật.
- Trình duyệt trong Zalo và Facebook thật: mới chỉ giả lập chuỗi nhận diện và việc thiếu `navigator.share`.
- Lời của My khi có khóa AI thật (máy chủ kiểm thử chạy chế độ demo), đăng nhập bằng mã email, Góc của tôi khi đã đăng nhập, trang quản trị.
- Máy chủ thật có nginx, CDN, TLS: kiểm thử chạy trên máy chủ Node cục bộ ở chế độ production.
- Chuyển ngoại tuyến thật (Playwright không giả lập mất mạng cho service worker): chỉ kiểm tra trang ngoại tuyến đã được lưu sẵn.

Mỗi cấu hình chạy khoảng 40 phép kiểm tra qua 5 kịch bản: màn chào và PWA, rút bài Tarot (chọn chủ đề, chọn lá, cảm xúc, lời mời đăng ký, chia sẻ, tải ảnh), Khám phá lá số (lập lá số, tab Thời vận, chia sẻ), trò chuyện với My (gửi tin, nhận trả lời, báo cáo, bảng lá số), các trang pháp lý. Kèm theo là đo tốc độ, lỗi console, yêu cầu mạng thất bại và kiểm tra trợ năng cơ bản.

## Kết quả

| | Vòng 1 (bản trước khi sửa) | Vòng cuối (sau khi sửa) |
|---|---|---|
| Cấu hình chạy | 50 (2 cấu hình lỗi do công cụ) | 50 |
| Phép kiểm tra | 1.931 | 2.021 |
| Đạt | 1.875 (97,1%) | 2.021 (100%) |
| Cấu hình có lỗi | 50 | 0 |

Chi tiết từng vòng: [ket-qua-vong-1.md](ket-qua-vong-1.md), [ket-qua-vong-cuoi.md](ket-qua-vong-cuoi.md). Ảnh tổng hợp màn chào và kết quả Tarot của 50 cấu hình: `tong-hop-man-chao.jpg`, `tong-hop-tarot.jpg`.

## Lỗi thật đã tìm thấy và đã sửa

| # | Lỗi | Ở đâu | Đã sửa |
|---|---|---|---|
| 1 | Bảng lá số lệch ngang 6px trên mọi thiết bị: thanh tab lấn ra ngoài khung, bảng có thể trượt ngang vài điểm ảnh | Mọi nhóm thiết bị | `.sheet-card { overflow-x: hidden }` |
| 2 | Trang Khám phá tràn 2px ở màn 320px (iPhone SE, Galaxy S9+): thanh trên rộng hơn khung | Màn 320px | Thu gọn nút ở thanh trên khi màn ≤ 360px |
| 3 | Ở "cỡ hiển thị lớn nhất" (khung 288px), hàng nút ở thanh trên nằm ngoài màn hình, nút **Lá số** không bấm được; trang Khám phá tràn 12px | Điện thoại cỡ hiển thị lớn nhất | Hàng nút tự xuống dòng khi màn ≤ 340px |
| 4 | Ô nhập của My không có nhãn trợ năng (trình đọc màn hình không biết ô đó là gì) | Mọi thiết bị | Thêm `aria-label` |
| 5 | Chia sẻ trễ: ở 4 cấu hình, hộp thoại chia sẻ mở sau 1,8 đến 5,6 giây. Trình duyệt chỉ cho mở trong khoảng 5 giây sau khi bấm, nên máy yếu có nguy cơ bị từ chối và rơi về tải ảnh | Máy bận hoặc CPU chậm | Vẽ ảnh Tarot ngay lúc bắt đầu lật bài; nếu sau 3,5 giây chưa xong thì báo "bấm Chia sẻ lần nữa" thay vì để lỗi; ảnh lá số chỉ vẽ một lần |
| 6 | Màn chào nạp chậm trên mạng yếu vì phải đợi cả bảng lá số, dữ liệu 78 lá và phần tạo ảnh | 3G chậm | Ba phần này nạp theo nhu cầu: giảm khoảng 0,7 giây ở mạng 3G chậm |

Đo thêm khi tìm lỗi 5: vẽ ảnh Tarot mất 160 đến 260 ms trên máy bình thường, nhưng 1,7 đến 2,1 giây khi CPU chậm 4 đến 6 lần (lần đầu có lúc tới 7 giây). Con số này cho thấy máy Android đời thấp thật sự có thể gặp tình huống đó.

## Điều còn lại cần biết

1. **Mạng yếu vẫn chậm:** Moto G4 trên 3G chậm mất khoảng 8 giây (trước đó 10 giây) để bấm được "Bước vào"; Galaxy S8 trong Zalo trên 3G chậm khoảng 7,6 giây. Còn có thể giảm bằng cách tách nốt gói tính toán lá số (khoảng 35 KB nén) và bớt số tệp phông (11 tệp, khoảng 190 KB). Mình chưa làm vì phải đổi nhiều chỗ trong `main.js`.
2. **Vùng chạm nhỏ:** kiểm tra tự động vẫn liệt kê liên kết cuối trang (cao 16px), "Để sau", "Nhạc nền" (cao 30px) và ô chọn giới tính (18px). Mình đã nới vùng chạm của liên kết cuối trang, "Để sau", "Báo cáo", nhạc nền bằng phần tử ẩn mà không đổi bố cục, nhưng công cụ đo kích thước phần tử nên không thấy phần nới. Ô chọn giới tính nằm trong nhãn bấm được nên chạm vào chữ là chọn được.
3. **Yêu cầu bị hủy:** `/api/event` bị báo hủy khoảng 250 lần: đó là các lần gửi thống kê bị cắt khi đóng trang, không phải lỗi. Không có lỗi console nào.
4. **Màn hình ngang (1280×720) và máy tính nhỏ:** phần cuối màn chào (bản quyền, liên kết) nằm dưới nếp gập và phải cuộn. Không gây lỗi, chỉ chật.

## Khuyến nghị trước khi mở rộng người dùng

1. Thử **trên điện thoại thật** ít nhất: một iPhone (Safari), một Android đời thấp (Chrome), một máy dùng Zalo thật, một Samsung Internet. Ưu tiên: chia sẻ ảnh Tarot, tải ảnh, nội dung chép sẵn, chữ hiển thị.
2. Chạy lại `tools/qa` sau mỗi lần sửa lớn (mất khoảng 6 phút với 4 tiến trình).
3. Khi có khóa AI thật, chạy lại kịch bản trò chuyện để đo thời gian trả lời thật.
