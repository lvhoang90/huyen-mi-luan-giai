# Đưa Huyền My Luận Giải lên Google Play: hướng dẫn từng bước (tài khoản cá nhân)

Cập nhật 06/10/2026. Quy định của Google đổi khá thường xuyên, nên chỗ nào có chữ **(kiểm tra lại)**, hãy đối chiếu với thông báo hiện ra trong Play Console. Văn bản để dán và đáp án khai báo nằm ở [ho-so-cua-hang.md](ho-so-cua-hang.md); ảnh cửa hàng ở `docs/ch-play/anh/`.

Thời gian dự kiến: khoảng 3 đến 4 tuần, trong đó 14 ngày là bắt buộc chạy thử nghiệm kín (xem Bước 6).

## Bước 0. Việc đã làm sẵn trong dự án

- PWA: `manifest.webmanifest`, biểu tượng thường và maskable, service worker (chỉ giữ tệp tĩnh và trang ngoại tuyến, không đụng tới `/api`), trang `offline.html`.
- Đường dẫn `/.well-known/assetlinks.json` do máy chủ tự trả theo hai biến môi trường `ANDROID_PACKAGE` và `ANDROID_SHA256` (bạn điền ở Bước 5).
- Nút **Báo cáo** dưới mỗi câu trả lời của My (Google yêu cầu với ứng dụng AI tạo nội dung), số liệu ở trang quản trị, tab Chất lượng.
- Trang công khai `https://huyenmy.isavietnam.app/xoa-du-lieu.html` (đường dẫn xóa tài khoản Google yêu cầu).
- Ảnh cửa hàng và toàn bộ văn bản dán.

Việc đầu tiên bạn làm: gộp PR rồi chạy `bash /opt/huyenmy/deploy/update.sh` để các thay đổi này lên trang thật. Kiểm tra: mở `https://huyenmy.isavietnam.app/manifest.webmanifest` thấy JSON, và `https://huyenmy.isavietnam.app/xoa-du-lieu.html` mở được.

## Bước 1. Chuẩn bị trước khi đăng ký

Chuẩn bị đủ để khỏi bị dừng giữa chừng:
1. **Một tài khoản Google (Gmail) dành riêng cho việc phát hành ứng dụng**, bật xác minh 2 bước. Đây là chìa khóa của ứng dụng, đừng dùng chung cho việc khác.
2. **Giấy tờ tùy thân** còn hạn đứng tên bạn (căn cước công dân hoặc hộ chiếu) và ảnh chụp rõ nét.
3. **Thẻ Visa hoặc Mastercard** đứng tên bạn, bật thanh toán quốc tế, để trả phí đăng ký khoảng 25 USD (một lần). Tên trên thẻ phải trùng tên trên giấy tờ.
4. **Một điện thoại Android thật** từ Android 10 trở lên, vì tài khoản cá nhân mới phải xác minh thiết bị qua ứng dụng Play Console. **(kiểm tra lại)**
5. Địa chỉ liên hệ thật. Với tài khoản cá nhân, Google có thể hiển thị một phần thông tin liên hệ công khai trên trang ứng dụng; xem phần "Địa chỉ" ở Bước 2.
6. Tên gói (Application ID) đã chốt: `app.isavietnam.huyenmy`. **Đặt một lần, không đổi được sau này.**

## Bước 2. Đăng ký tài khoản nhà phát triển cá nhân

1. Dùng tài khoản Google ở Bước 1, vào https://play.google.com/console/signup.
2. Chọn loại tài khoản **"Cá nhân" (Yourself/Personal)**.
3. Điền họ tên pháp lý (đúng như giấy tờ), địa chỉ, số điện thoại, email liên hệ cho người dùng. Điện thoại và email sẽ được xác minh bằng mã.
4. Đồng ý Thỏa thuận phân phối dành cho nhà phát triển, rồi **trả phí đăng ký** (khoảng 25 USD).
5. **Xác minh danh tính:** tải ảnh giấy tờ theo hướng dẫn, và (với tài khoản cá nhân) cài ứng dụng **Google Play Console** trên điện thoại Android, đăng nhập đúng tài khoản để xác minh thiết bị. Làm đúng thứ tự Google hiển thị trên màn hình.
6. Chờ Google duyệt. Thường từ vài giờ đến vài ngày, đôi khi lâu hơn. Mỗi lần Google hỏi thêm giấy tờ, trả lời đủ và rõ.

Địa chỉ: mục thông tin liên hệ của nhà phát triển có thể hiện công khai ở trang ứng dụng tùy khu vực (ví dụ yêu cầu về người bán ở Liên minh châu Âu). Nếu bạn không muốn lộ địa chỉ nhà, cân nhắc chỉ phát hành ở Việt Nam trong giai đoạn đầu, hoặc dùng địa chỉ văn phòng. **(kiểm tra lại câu hỏi "trader" trong Console)**

## Bước 3. Tạo ứng dụng trong Play Console

1. Vào Play Console, bấm **Tạo ứng dụng (Create app)**.
2. Tên ứng dụng: `Huyền My Luận Giải`. Ngôn ngữ mặc định: Tiếng Việt. Loại: **Ứng dụng**. Miễn phí.
3. Tick các khai báo (tuân thủ chính sách nhà phát triển, luật xuất khẩu của Hoa Kỳ).
4. Vào **Trang tổng quan (Dashboard)**, mục **Thiết lập ứng dụng của bạn**: đây là danh sách việc phải xong. Điền lần lượt theo bảng đáp án ở mục 7 của [ho-so-cua-hang.md](ho-so-cua-hang.md):
   - Chính sách quyền riêng tư
   - Quyền truy cập ứng dụng
   - Quảng cáo
   - Phân loại nội dung
   - Đối tượng mục tiêu (16–17 và 18 trở lên, không nhắm trẻ em)
   - An toàn dữ liệu (xem mục 9 của ho-so-cua-hang.md)
   - Các khai báo còn lại (ứng dụng tin tức, sức khỏe, tài chính, chính phủ)
5. Vào **Hiện diện trên cửa hàng, Trang thông tin cửa hàng chính (Store listing)**: dán tên, mô tả ngắn, mô tả đầy đủ; tải biểu tượng 512×512, ảnh bìa 1024×500 và 6 ảnh chụp màn hình (đều có sẵn trong `docs/ch-play/anh/`). Chọn danh mục **Phong cách sống**, nhập email liên hệ và trang web.
6. Vào **Mục tiêu và đối tượng, Xóa tài khoản** (hoặc phần "Data deletion" trong mục An toàn dữ liệu): dán `https://huyenmy.isavietnam.app/xoa-du-lieu.html`.

## Bước 4. Tạo tệp cài đặt Android (AAB)

Có hai đường. **Khuyến nghị đường A** vì không cần cài gì lên máy.

### Đường A: dùng PWABuilder (trên web)
1. Vào https://www.pwabuilder.com, nhập `https://huyenmy.isavietnam.app`, bấm bắt đầu. Trang sẽ chấm điểm PWA; manifest, biểu tượng và service worker đã có nên điểm sẽ ổn.
2. Chọn **Package for stores (Đóng gói cho cửa hàng)**, rồi **Android**.
3. Điền: Package ID `app.isavietnam.huyenmy`; App name `Huyền My Luận Giải`; Launcher name `Huyền My`; App version `1.0.0` (version code `1`); Display mode `standalone`; Status bar và nav bar color `#0a0a24`; Splash background `#0a0a24`; Signing key: chọn **Tạo khóa mới (New)** và nhập mật khẩu của riêng bạn.
4. Tắt các tùy chọn bạn chưa dùng: Play Billing (bật ở Giai đoạn 2 khi bán thuê bao), định vị.
5. Tải gói về. Gói gồm tệp `.aab` (để tải lên Google Play), `.apk` (để cài thử), **tệp khóa ký `.keystore`**, và tệp hướng dẫn kèm `assetlinks.json` mẫu.
6. **Sao lưu ngay tệp khóa ký và mật khẩu ở ít nhất hai nơi an toàn** (không đưa lên GitHub). Mất khóa thì không cập nhật ứng dụng được nữa trừ khi dùng Play App Signing và xin đặt lại khóa tải lên (xem Bước 5).

### Đường B: dùng Bubblewrap (dòng lệnh)
```
npm install -g @bubblewrap/cli
mkdir huyenmy-android && cd huyenmy-android
bubblewrap init --manifest=https://huyenmy.isavietnam.app/manifest.webmanifest
bubblewrap build
```
Lần đầu Bubblewrap hỏi cài JDK 17 và Android SDK, đồng ý để nó tự tải. Khi `init` hỏi, dùng các giá trị như đường A. Kết quả là `app-release-bundle.aab` và `app-release-signed.apk`, kèm khóa ký `android.keystore`. Cùng lưu ý sao lưu khóa.

### Kiểm tra bằng cài thử
Cài tệp `.apk` lên điện thoại Android của bạn và mở: ứng dụng phải mở **toàn màn hình, không có thanh địa chỉ**. Nếu còn thanh địa chỉ nghĩa là liên kết tài sản số chưa khớp: làm tiếp Bước 5.

## Bước 5. Liên kết tài sản số (để ứng dụng mở toàn màn hình)

Google kiểm tra rằng ứng dụng Android và trang web thuộc cùng một chủ. Khi dùng **Play App Signing** (mặc định và nên dùng), Google ký lại ứng dụng bằng khóa của Google nên dấu vân tay thật nằm trong Play Console.

1. Lần đầu tải AAB lên (Bước 6), Play Console sẽ hỏi bạn đăng ký **Play App Signing**: đồng ý.
2. Vào **Thiết lập, Tính toàn vẹn ứng dụng (App integrity), Ký ứng dụng (App signing)**, sao chép **SHA-256 certificate fingerprint** của "App signing key certificate" và của "Upload key certificate".
3. Trên máy chủ, đặt hai biến môi trường (nhập ẩn, không hiện trên màn hình):
   ```
   bash /opt/huyenmy/deploy/set-env.sh ANDROID_PACKAGE
   bash /opt/huyenmy/deploy/set-env.sh ANDROID_SHA256
   ```
   - `ANDROID_PACKAGE`: `app.isavietnam.huyenmy`
   - `ANDROID_SHA256`: dán cả hai dấu vân tay, **cách nhau bằng dấu phẩy**, dạng `AA:BB:CC:...`
4. Kiểm tra: mở `https://huyenmy.isavietnam.app/.well-known/assetlinks.json`, phải thấy JSON có tên gói và hai dấu vân tay.
5. Cài lại bản từ Play (thử nghiệm nội bộ, Bước 6) và xác nhận không còn thanh địa chỉ. Nếu vẫn còn, xóa ứng dụng, chờ vài phút (Google lưu đệm kết quả kiểm tra), cài lại.

## Bước 6. Thử nghiệm: nội bộ trước, kín sau

### 6a. Thử nghiệm nội bộ (nhanh, để tự kiểm tra)
1. Vào **Kiểm thử, Kiểm thử nội bộ (Internal testing)**, **Tạo bản phát hành mới**.
2. Tải tệp `.aab` lên. Chấp nhận Play App Signing.
3. Tên bản phát hành `1.0.0 (1)`, ghi chú phát hành dùng câu ở mục 5 của ho-so-cua-hang.md. Lưu rồi **Phát hành**.
4. Ở thẻ **Người kiểm thử**, tạo danh sách email gồm cả bạn, lấy **liên kết tham gia** và cài từ Play trên điện thoại của bạn. Bước này chưa cần Google duyệt lâu, dùng để thử liên kết tài sản số và toàn bộ luồng dùng.

### 6b. Thử nghiệm kín: bắt buộc với tài khoản cá nhân mới
Tài khoản cá nhân tạo sau ngày 13/11/2023 phải chạy thử nghiệm kín với **ít nhất 12 người thử, liên tục 14 ngày** rồi mới được xin phát hành chính thức; một trang hỗ trợ của Google ghi 20 người, nên **xem con số hiện trong Dashboard của bạn (kiểm tra lại)** và chuẩn bị dư, ví dụ 20 đến 25 người.

1. Vào **Kiểm thử, Kiểm thử kín (Closed testing)**, tạo bản phát hành (có thể dùng lại AAB), phát hành.
2. Tạo **danh sách người thử**: mỗi người cần một địa chỉ Gmail dùng trên điện thoại Android. Có thể dùng một Google Group để dễ thêm bớt.
3. Sao chép **liên kết tham gia (opt-in)** và gửi cho từng người. Mỗi người phải: bấm liên kết, bấm "Trở thành người thử", rồi **cài ứng dụng từ Play** và mở ít nhất vài lần trong 14 ngày.
4. **Giữ đủ số người suốt 14 ngày liên tiếp.** Nếu có người rút trong lúc đó, bộ đếm có thể bị đặt lại. Vì vậy mời dư và nhắc họ đừng gỡ ứng dụng.
5. Cách tìm người thử: nhóm Zalo, bạn bè, người thân, nhóm người dùng My. Mình đã chuẩn bị sẵn lời mời (bạn bảo mình viết caption mời thử nghiệm Beta).
6. Hết 14 ngày, ở Dashboard hiện nút **Đăng ký quyền truy cập bản chính thức (Apply for production)**. Bạn trả lời bảng câu hỏi (ứng dụng làm gì, cách thử nghiệm, phản hồi đã nhận, đã sửa gì). Hãy trả lời trung thực và cụ thể (ví dụ: "đã sửa lỗi chữ trên Zalo, thêm nút báo cáo câu trả lời").
7. Google xem xét yêu cầu (thường vài ngày).

## Bước 7. Phát hành chính thức

1. Vào **Sản xuất (Production)**, **Tạo bản phát hành mới**, chọn lại AAB đã dùng hoặc tải bản mới. Ghi chú phát hành.
2. Chọn quốc gia và khu vực phân phối. Gợi ý: bắt đầu với Việt Nam, mở thêm sau.
3. Mục **Chỉnh sửa**, nên bật chế độ **xuất bản có kiểm soát (Managed publishing)** để bạn tự bấm phát hành sau khi Google duyệt xong.
4. Gửi duyệt. Ứng dụng của tài khoản mới thường được xét lâu hơn (vài ngày, đôi khi một tuần hoặc hơn). Nếu bị từ chối, Google gửi email nêu lý do cụ thể: sửa theo đó rồi gửi lại.
5. Được duyệt thì bấm **Xuất bản**. Ứng dụng hiện trên cửa hàng sau vài giờ.

## Bước 8. Sau khi lên cửa hàng

- Xem **Android vitals** và đánh giá của người dùng; trả lời đánh giá.
- Cập nhật nội dung: vì ứng dụng mở chính trang web, **cập nhật web (`update.sh`) có hiệu lực ngay cho cả ứng dụng Android**, không cần gửi lại AAB. Chỉ gửi bản mới khi đổi biểu tượng, tên, màu, thông số TWA hoặc muốn tăng mức API mục tiêu.
- Mức API mục tiêu: từ 31/8/2026 bản mới phải nhắm Android 16 (API 36) trở lên; PWABuilder và Bubblewrap mới đã tính điều này. **(kiểm tra lại khi tạo gói)**

## Giai đoạn 2: thu tiền

Làm sau khi đã lên cửa hàng và có người dùng:
1. Vào **Kiếm tiền, Thuê bao**, tạo gói (ví dụ "Đồng hành"). Cần hồ sơ thanh toán (Merchant profile): địa chỉ, ngân hàng nhận tiền, thông tin thuế.
2. Dùng **Google Play Billing** (bắt buộc cho hàng hóa số bán trong ứng dụng). Với ứng dụng web đóng gói, thường dùng Digital Goods API qua TWA; cần bật Play Billing khi đóng gói lại và viết phần xác minh giao dịch trên máy chủ (Google Play Developer API và thông báo thời gian thực).
3. Phí của Google với thuê bao: 15%. **(kiểm tra lại mức và cách tính tại Việt Nam trong Console)**
4. Hỏi kế toán về hộ kinh doanh hoặc công ty, thuế GTGT, thuế thu nhập; xem `docs/THU-PHI-VA-PHAP-LY.md`.
5. Đồng thời nên làm: thông báo đẩy nhắc "lá bài hôm nay" (có người dùng đồng ý), chia sẻ trực tiếp.

## Những lỗi và từ chối thường gặp

| Vấn đề | Cách xử lý |
|---|---|
| Ứng dụng còn thanh địa chỉ | `assetlinks.json` thiếu dấu vân tay của khóa Google ký (Bước 5), hoặc chưa chờ đủ lâu |
| "Ứng dụng quá giống một trang web" | Nêu rõ trong ghi chú: ngoại tuyến cơ bản, chia sẻ, nhắc lá bài hằng ngày; sau đó thêm thông báo đẩy |
| Thiếu quyền riêng tư hoặc xóa dữ liệu | Dán đủ hai đường dẫn ở mục 1 ho-so-cua-hang.md; trang phải mở được không cần đăng nhập |
| Nội dung AI | Chỉ ra nút Báo cáo dưới câu trả lời của My và chính sách không dọa hạn |
| Khai sai Data safety | Khai đầy đủ theo mục 9 ho-so-cua-hang.md; khai thiếu bị từ chối còn khai thừa thì an toàn hơn |
| Phải chờ đủ 14 ngày kín | Không có lối tắt; tài khoản tổ chức được miễn bước này nếu sau này bạn lập pháp nhân |

## Danh sách kiểm tra

- [ ] Gộp PR, chạy `update.sh`, mở được manifest và trang xóa dữ liệu
- [ ] Tài khoản nhà phát triển cá nhân được duyệt, xác minh thiết bị xong
- [ ] Tạo ứng dụng, điền Thiết lập ứng dụng, Store listing, ảnh
- [ ] Tạo AAB, **sao lưu khóa ký**
- [ ] Phát hành nội bộ, đặt `ANDROID_PACKAGE` và `ANDROID_SHA256`, kiểm tra không còn thanh địa chỉ
- [ ] Mời đủ người thử, phát hành kín, giữ 14 ngày liên tiếp
- [ ] Đăng ký quyền truy cập bản chính thức, chờ duyệt
- [ ] Phát hành chính thức
