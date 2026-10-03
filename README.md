# Huyền My Luận Giải

Nền tảng luận giải huyền học Đông–Tây với nhân vật 3D **Huyền My** và trí tuệ nhân tạo. Đây không phải máy bói: đây là một người đồng hành biết lắng nghe, dùng lá số như một **tấm gương biểu tượng** để soi mình, rồi cùng người dùng gỡ rối bằng cả truyền thống lẫn tâm lý học.

## Điều làm sản phẩm khác biệt

| | Sản phẩm thường thấy | Huyền My |
|---|---|---|
| **Nguồn con số** | AI "đoán" hoặc bịa Can Chi, cung hoàng đạo | **Tính bằng thuật toán** (tiết khí thật từ kinh độ Mặt Trời, Meeus, Pythagoras). AI chỉ nhận số đã tính và không được sửa. Có test đối chiếu mốc đã biết |
| **Minh chứng** | Nói chắc nịch, không nêu nguồn | Mỗi nhận định thuộc **một trong ba tầng**: *Tính toán* · *Truyền thống* · *Tâm lý học*. My luôn nói đang ở tầng nào, và nói thật rằng chưa có bằng chứng ngày giờ sinh quyết định số phận |
| **Giới hạn dữ liệu** | Ẩn đi | Bảng **Lá số** (☯) hiển thị cách tính và các giới hạn (thiếu giờ sinh, sát ranh tiết khí, múi giờ lịch sử…); My nói rõ điều chưa chắc |
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
  astro.js      Kinh độ Mặt Trời/Mặt Trăng, cung mọc, cung hoàng đạo
  bazi.js       Tứ Trụ, nạp âm, cân bằng ngũ hành, cung mệnh Bát Trạch
  numerology.js Thần số học Pythagoras cho họ tên tiếng Việt
  index.js      Chuẩn hóa hồ sơ, dựng lá số, mô tả lá số cho AI
src/stage.js  Cảnh three.js: nhân vật procedural, bầu trời shader, vòng bát quái/ngũ hành, hạt
src/main.js   Hành trình hội thoại, gõ chữ dần, streaming SSE, bảng lá số
server/       Máy chủ Node: /api/chat (SSE → Claude), persona.js (nhân cách & nguyên tắc), demo.js
```

Máy chủ **tự tính lại lá số** từ hồ sơ (không tin dữ liệu lá số do trình duyệt gửi), chuẩn hóa tên để chống chèn chỉ dẫn, giới hạn kích thước và tần suất, và không lưu gì. Lịch sử trò chuyện chỉ nằm trong `localStorage` của thiết bị người dùng.

## Giới hạn hiện tại và hướng phát triển

- Chưa có lá số Tử Vi Đẩu Số 12 cung (cần chuyển đổi âm lịch chính xác). Đây là bước kế tiếp tự nhiên; kiến trúc `engine/` đã sẵn chỗ.
- Tứ Trụ chỉ xét can chi chính khí, chưa xét tàng can, hợp xung, đại vận. Nhận định "thân vượng/nhược" chỉ mang tính tham khảo.
- Mặt Trăng/cung mọc dùng thuật toán xấp xỉ (sai số cỡ 0,3°); đủ cho cung hoàng đạo trừ khi sát ranh (đã cảnh báo).
- Nhân vật dựng bằng hình khối procedural để giữ gói nhẹ; có thể thay bằng mô hình glTF mà không đổi phần còn lại (`makeHuyenMy()` trong `stage.js`).
- Giọng nói dùng Web Speech API của trình duyệt; có thể thay bằng TTS tiếng Việt chất lượng cao để nhép môi theo âm thanh.
