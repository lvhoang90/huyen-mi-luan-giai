# Báo cáo kiểm thử 50 cấu hình thiết bị

Số cấu hình: 50. Số phép kiểm tra: 1931. Đạt: 1875 (97.1%). Chưa đạt: 56.

## Theo nhóm thiết bị

| Nhóm | Số cấu hình | Phép kiểm tra đạt | Cấu hình có lỗi |
|---|---|---|---|
| Android | 15 | 594/612 (97.1%) | 15 |
| iPhone | 12 | 474/489 (96.9%) | 12 |
| Tablet | 5 | 195/200 (97.5%) | 5 |
| Desktop | 6 | 234/240 (97.5%) | 6 |
| Đặc biệt | 12 | 378/390 (96.9%) | 12 |

## Phép kiểm tra chưa đạt, gom theo nội dung

- **Bảng lá số mở được, không tràn ngang**: 48/50 cấu hình
  - p01 Pixel 7 (lệch 6px)
  - p02 Pixel 5 (lệch 6px)
  - p03 Pixel 4 (lệch 6px)
  - p04 Pixel 2 (lệch 6px)
  - p05 Galaxy S24 (lệch 6px)
  - p06 Galaxy S9+ (lệch 6px)
  - p07 Galaxy S8 (lệch 6px)
  - p08 Galaxy S III (lệch 6px)
  - p09 Galaxy A55 (lệch 6px)
  - p10 Galaxy Note II (lệch 6px)
  - p11 Moto G4 (lệch 6px)
  - p12 Nexus 5 (lệch 6px)
  - … và 36 cấu hình khác
- **Bấm Chia sẻ thì hộp thoại chia sẻ mở ngay**: 2/50 cấu hình
  - p06 Galaxy S9+ (0 lần)
  - p18 iPhone X (0 lần)

- **Không tràn ngang: trang Khám phá**: 2/50 cấu hình
  - p06 Galaxy S9+ (rộng 322 > khung 320)
  - p16 iPhone SE (rộng 322 > khung 320)

- **Không tràn ngang: lá số Khám phá**: 2/50 cấu hình
  - p06 Galaxy S9+ (rộng 322 > khung 320)
  - p16 iPhone SE (rộng 322 > khung 320)

- **Cấu hình chạy được**: 2/50 cấu hình
  - p46 Điện thoại cỡ hiển thị lớn nhất (288x576) (P.ua is not a function)
  - p50 Điện thoại gập, đang gập (344x882) (P.ua is not a function)


## Tốc độ

| Chỉ số | Trung vị | Phân vị 90 | Chậm nhất |
|---|---|---|---|
| Tải xong HTML (DOMContentLoaded) | 242 ms | 619 ms | 6.850 ms |
| Nội dung lớn nhất hiện ra (LCP) | 188 ms | 444 ms | 7.112 ms |
| Từ lúc mở tới khi bấm được "Bước vào" | 2.405 ms | 3.276 ms | 10.032 ms |
| Từ bấm Chia sẻ tới khi hộp thoại mở | 340 ms | 718 ms | 1.021 ms |
| Từ gửi tin tới khi My bắt đầu trả lời | 160 ms | 439 ms | 1.306 ms |
| My trả lời xong | 5.990 ms | 6.765 ms | 10.019 ms |

Năm cấu hình chậm nhất tới lúc bấm được "Bước vào": p39 Moto G4, mạng 3G chậm, CPU chậm 6 lần (10.0s); p42 Galaxy S8 trong Zalo, mạng 3G chậm (8.3s); p40 Pixel 2, mạng 3G, CPU chậm 4 lần (6.1s); p04 Pixel 2 (3.5s); p38 Siêu rộng 2560x1080 (3.3s)

Dung lượng tải ở màn chào: trung vị 378 KB, lớn nhất 378 KB.

## Lỗi trong console và yêu cầu mạng thất bại

Không có lỗi console.

- net::ERR_ABORTED http://localhost:8830/api/event (257 lần)
- net::ERR_ABORTED http://localhost:8830/fonts/be-vietnam-pro-vietnamese-500-normal.woff2 (3 lần)
- net::ERR_ABORTED http://localhost:8830/fonts/be-vietnam-pro-latin-ext-500-normal.woff2 (3 lần)
- net::ERR_ABORTED http://localhost:8830/fonts/be-vietnam-pro-latin-ext-400-normal.woff2 (2 lần)

## Trợ năng (kiểm tra tự động cơ bản)

Nút hoặc liên kết không có tên:
  - Không có
Ảnh không có mô tả:
  - Không có
Ô nhập không có nhãn:
  - textarea[Kể với My…] (48 lượt)
Điểm chạm nhỏ hơn 32px (trên màn hình cảm ứng; trên máy tính không áp dụng):
  - gender 18x18 (144 lượt)
  - Trò chuyện với My 143x30 (96 lượt)
  - Quyền riêng tư 89x16 (94 lượt)
  - Điều khoản 69x16 (92 lượt)
  - Để sau 54x30 (88 lượt)
  - Trò chuyện với My 119x18 (54 lượt)
  - Đã có tài khoản? Đăng nhập đ 286x30 (48 lượt)
  - Nhạc nền: tắt 126x31 (48 lượt)
  - nohour 18x18 (48 lượt)
  - Giới thiệu 58x16 (34 lượt)

## Chi tiết từng cấu hình

| Mã | Cấu hình | Đạt | Chưa đạt | Thời gian | Ghi chú |
|---|---|---|---|---|---|
| p01 | Pixel 7 | 40 | 1 | 44s | Bảng lá số mở được, không tràn ngang |
| p02 | Pixel 5 | 40 | 1 | 41s | Bảng lá số mở được, không tràn ngang |
| p03 | Pixel 4 | 40 | 1 | 43s | Bảng lá số mở được, không tràn ngang |
| p04 | Pixel 2 | 40 | 1 | 43s | Bảng lá số mở được, không tràn ngang |
| p05 | Galaxy S24 | 40 | 1 | 40s | Bảng lá số mở được, không tràn ngang |
| p06 | Galaxy S9+ | 34 | 4 | 46s | Bấm Chia sẻ thì hộp thoại chia sẻ mở ngay; Không tràn ngang: trang Khám phá; Không tràn ngang: lá số Khám phá |
| p07 | Galaxy S8 | 40 | 1 | 41s | Bảng lá số mở được, không tràn ngang |
| p08 | Galaxy S III | 40 | 1 | 38s | Bảng lá số mở được, không tràn ngang |
| p09 | Galaxy A55 | 40 | 1 | 45s | Bảng lá số mở được, không tràn ngang |
| p10 | Galaxy Note II | 40 | 1 | 37s | Bảng lá số mở được, không tràn ngang |
| p11 | Moto G4 | 40 | 1 | 38s | Bảng lá số mở được, không tràn ngang |
| p12 | Nexus 5 | 40 | 1 | 37s | Bảng lá số mở được, không tràn ngang |
| p13 | Nexus 5X | 40 | 1 | 36s | Bảng lá số mở được, không tràn ngang |
| p14 | Nexus 6P | 40 | 1 | 40s | Bảng lá số mở được, không tràn ngang |
| p15 | LG Optimus L70 | 40 | 1 | 36s | Bảng lá số mở được, không tràn ngang |
| p16 | iPhone SE | 38 | 3 | 37s | Không tràn ngang: trang Khám phá; Không tràn ngang: lá số Khám phá; Bảng lá số mở được, không tràn ngang |
| p17 | iPhone 8 | 40 | 1 | 36s | Bảng lá số mở được, không tràn ngang |
| p18 | iPhone X | 36 | 2 | 42s | Bấm Chia sẻ thì hộp thoại chia sẻ mở ngay; Bảng lá số mở được, không tràn ngang |
| p19 | iPhone 11 | 40 | 1 | 38s | Bảng lá số mở được, không tràn ngang |
| p20 | iPhone 12 Mini | 40 | 1 | 38s | Bảng lá số mở được, không tràn ngang |
| p21 | iPhone 13 | 40 | 1 | 37s | Bảng lá số mở được, không tràn ngang |
| p22 | iPhone 14 Pro Max | 40 | 1 | 38s | Bảng lá số mở được, không tràn ngang |
| p23 | iPhone 15 | 40 | 1 | 38s | Bảng lá số mở được, không tràn ngang |
| p24 | iPhone 15 Pro Max | 40 | 1 | 40s | Bảng lá số mở được, không tràn ngang |
| p25 | iPhone 6 | 40 | 1 | 36s | Bảng lá số mở được, không tràn ngang |
| p26 | iPhone 12 Pro | 40 | 1 | 36s | Bảng lá số mở được, không tràn ngang |
| p27 | iPhone SE (3rd gen) | 40 | 1 | 35s | Bảng lá số mở được, không tràn ngang |
| p28 | iPad Mini | 39 | 1 | 49s | Bảng lá số mở được, không tràn ngang |
| p29 | iPad Pro 11 | 39 | 1 | 58s | Bảng lá số mở được, không tràn ngang |
| p30 | Galaxy Tab S9 | 39 | 1 | 52s | Bảng lá số mở được, không tràn ngang |
| p31 | Nexus 10 | 39 | 1 | 59s | Bảng lá số mở được, không tràn ngang |
| p32 | Kindle Fire HDX | 39 | 1 | 56s | Bảng lá số mở được, không tràn ngang |
| p33 | Desktop Chrome | 39 | 1 | 44s | Bảng lá số mở được, không tràn ngang |
| p34 | Desktop Chrome HiDPI | 39 | 1 | 54s | Bảng lá số mở được, không tràn ngang |
| p35 | Desktop Edge | 39 | 1 | 45s | Bảng lá số mở được, không tràn ngang |
| p36 | Laptop 1366x768 | 39 | 1 | 50s | Bảng lá số mở được, không tràn ngang |
| p37 | Màn hình 1920x1080 | 39 | 1 | 54s | Bảng lá số mở được, không tràn ngang |
| p38 | Siêu rộng 2560x1080 | 39 | 1 | 62s | Bảng lá số mở được, không tràn ngang |
| p39 | Moto G4, mạng 3G chậm, CPU chậm 6 lần | 39 | 1 | 70s | Bảng lá số mở được, không tràn ngang |
| p40 | Pixel 2, mạng 3G, CPU chậm 4 lần | 39 | 1 | 57s | Bảng lá số mở được, không tràn ngang |
| p41 | Pixel 7 trong Zalo | 36 | 1 | 39s | Bảng lá số mở được, không tràn ngang |
| p42 | Galaxy S8 trong Zalo, mạng 3G chậm | 36 | 1 | 44s | Bảng lá số mở được, không tràn ngang |
| p43 | iPhone 12 trong Facebook | 36 | 1 | 35s | Bảng lá số mở được, không tràn ngang |
| p44 | Galaxy A55 trong Messenger | 36 | 1 | 39s | Bảng lá số mở được, không tràn ngang |
| p45 | Pixel 5, giảm chuyển động | 39 | 1 | 26s | Bảng lá số mở được, không tràn ngang |
| p46 | Điện thoại cỡ hiển thị lớn nhất (288x576) | 0 | 1 | 0s | Cấu hình chạy được |
| p47 | Máy tính, múi giờ Los Angeles, tiếng Anh | 39 | 1 | 37s | Bảng lá số mở được, không tràn ngang |
| p48 | iPhone 13, múi giờ London, tiếng Anh | 39 | 1 | 34s | Bảng lá số mở được, không tràn ngang |
| p49 | Pixel 7 nằm ngang | 39 | 1 | 34s | Bảng lá số mở được, không tràn ngang |
| p50 | Điện thoại gập, đang gập (344x882) | 0 | 1 | 0s | Cấu hình chạy được |
