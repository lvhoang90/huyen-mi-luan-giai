# Huyền My Luận Giải

Nền tảng luận giải huyền học Đông–Tây với nhân vật 3D **Huyền My** và trí tuệ nhân tạo. Đây không phải máy bói: đây là một người đồng hành biết lắng nghe, dùng lá số như một **tấm gương biểu tượng** để soi mình, rồi cùng người dùng gỡ rối bằng cả truyền thống lẫn tâm lý học.

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
| **Cảm xúc** | Giao diện chat phẳng | Không gian 3D sống: nhân vật thở, chớp mắt, nhép môi, nhìn theo con trỏ; quả cầu sáng giữa hai tay bừng lên khi "gieo quẻ"; bầu trời và đom đóm đổi màu theo **hành chủ** của người dùng |

## Chạy

```bash
npm install
cp .env.example .env     # điền ANTHROPIC_API_KEY
npm run dev              # http://localhost:5173
npm test                 # kiểm tra lõi tính toán
npm run build && npm start   # chạy bản production
```

Chưa có khóa API thì ứng dụng chạy **chế độ demo** (có huy hiệu trên giao diện): toàn bộ hành trình, lá số và cảnh 3D hoạt động, chỉ phần trả lời của My là mẫu có cấu trúc, không phải AI. Biến môi trường: `ANTHROPIC_API_KEY`, `HUYENMY_MODEL` (mặc định `claude-sonnet-5-5`), `PORT`.

## Kiến trúc

```
src/engine/   Lõi tính toán thuần JS, dùng chung cho trình duyệt và máy chủ
  astro.js      Thiên văn (astronomy-engine), cung mọc, 10 thiên thể, nhà, góc chiếu
  lunar.js      Lịch âm Việt Nam từ trăng non + trung khí (UTC+8 trước 1968, UTC+7 từ 1968)
  tuvi.js       Tử Vi Đẩu Số: Mệnh/Thân, Cục, 14 chính tinh, Tứ Hóa, phụ/sát tinh, Trường Sinh, đại hạn
  bazi.js       Tứ Trụ, nạp âm, cân bằng ngũ hành, cung mệnh Bát Trạch
  numerology.js Thần số học Pythagoras cho họ tên tiếng Việt
  index.js      Chuẩn hóa hồ sơ, dựng lá số, mô tả cho AI, "nét riêng" của lá số
src/stage.js      Cảnh three.js: bầu trời shader, vòng bát quái/ngũ hành, hạt, nhân vật dự phòng
src/vrmAvatar.js  Nhân vật VRM 1.0: biểu cảm, nhép môi theo âm vị, nhìn theo con trỏ, spring bone, áo dài/tóc dài
src/main.js       Hành trình hội thoại, streaming SSE, bảng lá số theo thẻ
server/           Máy chủ Node: /api/chat (SSE → Claude), persona.js, demo.js
```

Máy chủ **tự tính lại lá số** từ hồ sơ (không tin dữ liệu lá số do trình duyệt gửi), chuẩn hóa tên để chống chèn chỉ dẫn, giới hạn kích thước và tần suất, và không lưu gì. Lịch sử trò chuyện chỉ nằm trong `localStorage` của thiết bị người dùng.

## Mức độ kiểm chứng (nói rõ cái gì đã kiểm, cái gì chưa)

- **Lịch âm**: đối chiếu 6.660 ngày (1930–2040) với `lunar-javascript`. **Trước 1968: 0 sai lệch.** Từ 1968 có lệch đúng 1 ngày ở khoảng 4% số tháng, đúng như dự kiến vì lịch âm Việt Nam dùng UTC+7 còn lịch Trung Hoa dùng UTC+8. Các mốc Tết, tháng nhuận 2020/2023/2025 khớp lịch thực.
- **Tử Vi**: đối chiếu 4.000 lá số ngẫu nhiên với thư viện độc lập `tuvi-neo`: **0 sai lệch** về Cục, tên 12 cung, vị trí cả 14 chính tinh, 16 phụ/sát tinh, Trường Sinh. Lưu ý: cả hai theo trường phái phổ biến ở Việt Nam; thư viện đối chứng tự ghi là phần lớn do AI sinh, nên đây là bằng chứng nhất quán chứ chưa phải thẩm định của thầy Tử Vi.
- **Tứ Trụ, thần số, cung hoàng đạo**: có test theo các mốc đã biết (`npm test`, 14 test).
- **Giao diện**: đã chạy trọn hành trình trên trình duyệt headless (desktop và điện thoại) ở chế độ demo, không lỗi console.
- **Chưa kiểm**: phần trả lời bằng AI thật (môi trường dựng không có khóa API), chất lượng cá nhân hóa của prompt qua nhiều hội thoại thật, và hiệu năng trên GPU thật.

## Giới hạn hiện tại

- Tử Vi chưa có độ sáng của sao (miếu/hãm), Tuần/Triệt, tiểu hạn, lưu niên; các phái khác nhau (ví dụ Tứ Hóa năm Canh) có thể cho kết quả khác.
- Tứ Trụ chỉ xét can chi chính khí, chưa xét tàng can, hợp xung, đại vận. "Thân vượng/nhược" chỉ tham khảo.
- **Nhân vật**: là bản lai giữa mô hình VRM mẫu (mặt, da, biểu cảm, tóc mái) và áo dài + tóc dài dựng bằng mã. Nhìn ổn nhưng chưa phải nghệ thuật chuyên nghiệp: tóc sau là khối đơn giản, áo không có hoa văn. Để đẹp hơn rõ rệt, nên thay `public/models/huyenmy.vrm` bằng một nhân vật áo dài dựng bằng VRoid Studio (không cần sửa mã; nếu mô hình đã có áo dài thì xóa `buildOutfit`). Nếu không tải được mô hình, ứng dụng dùng nhân vật dựng bằng mã.
- Gói JS khoảng 235 KB (gzip) và mô hình 10,8 MB; lần tải đầu trên mạng chậm sẽ thấy nhân vật dự phòng trước.
- Giọng nói dùng Web Speech API của trình duyệt; có thể thay bằng TTS tiếng Việt chất lượng cao để nhép môi theo âm thanh thật.

## Chất liệu mở và giấy phép

- Mô hình `public/models/huyenmy.vrm`: mẫu của pixiv Inc. (xem `public/models/CREDITS.md`), giấy phép VRM 1.0 cho phép dùng, sửa và phát hành lại, không bắt buộc ghi công.
- `@pixiv/three-vrm` (MIT), `three` (MIT), `astronomy-engine` (MIT), `@anthropic-ai/sdk` (MIT).
- `tuvi-neo` và `lunar-javascript` chỉ dùng để đối chiếu khi kiểm thử, không nằm trong sản phẩm.
