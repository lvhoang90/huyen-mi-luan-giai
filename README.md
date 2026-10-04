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

- Tử Vi chưa có độ sáng của sao (miếu/hãm), Tuần/Triệt, tiểu hạn, lưu niên; các phái khác nhau (ví dụ Tứ Hóa năm Canh) có thể cho kết quả khác.
- Tứ Trụ chỉ xét can chi chính khí, chưa xét tàng can, hợp xung, đại vận. "Thân vượng/nhược" chỉ tham khảo.
- **Nhân vật 2D** vẽ bằng mã nên nét gọn, kiểu sticker, chưa có độ tinh xảo của tranh họa sĩ vẽ tay. Quay đầu chỉ mô phỏng bằng cách dịch chuyển nét mặt so với tóc và da, không phải góc nhìn 3/4 thật. Muốn nhân vật đẹp hơn, nên nhờ họa sĩ vẽ lại theo cùng cấu trúc bộ phận (xem `tools/rig.py`).
- Không dùng giọng nói: My chỉ trò chuyện bằng chữ. Không còn thư viện 3D nên ứng dụng gọn nhẹ.

## Chất liệu mở và giấy phép

- `astronomy-engine` (MIT), `@anthropic-ai/sdk` (MIT).
- Nhân vật 2D do dự án tự vẽ bằng mã (`tools/chibi.py`, `tools/rig.py`); không dùng mô hình hay hình ảnh của bên thứ ba.
- `tuvi-neo` và `lunar-javascript` chỉ dùng để đối chiếu khi kiểm thử, không nằm trong sản phẩm.
