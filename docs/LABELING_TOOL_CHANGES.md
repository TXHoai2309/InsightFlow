# Labeling Tool - Các Sửa Đổi Đã Thực Hiện

Tài liệu này ghi lại các thay đổi chính của `labeling_tool` khi tích hợp vào InsightFlow và quá trình phát triển tính năng, cải tiến giao diện cũng như sửa lỗi.

## Tích Hợp Vào InsightFlow

- Thêm route riêng `/labeling_tool` để test và demo tool mà không ảnh hưởng các màn hình chính.
- Đồng bộ giao diện với layout InsightFlow: sidebar, header, light/dark mode và style control.
- Bỏ các nút/phần không cần thiết trong bản demo riêng như chọn person và load file local.
- Đổi nút `Supabase` thành `Tải data / Load data` để đúng nghĩa thao tác hơn.

## Quản Lý Tải Dữ Liệu & Hiệu Năng

- **Nút hủy tải dữ liệu (Hủy tải / Stop loading)**: Bổ sung nút bấm cho phép hủy ngay lập tức quá trình tải dữ liệu từ Supabase đang chạy thông qua cơ chế `AbortController`. Giải phóng trình duyệt ngay lập tức khi tải quá chậm hoặc khi load lại trang bị kẹt.
- **Tối ưu hóa tốc độ tải và bộ lọc**:
  - Giảm thiểu số lượng request song song lên Supabase.
  - Sử dụng cơ chế **tải song song lười biếng (lazy parallel loading)**: Chỉ truy vấn bình luận và nhãn của bài viết sau khi bài viết đó đã thỏa mãn các điều kiện lọc nâng cao (lọc theo khoảng ngày và lọc theo thương hiệu).
  - Tăng tốc độ load danh sách thread rõ rệt khi áp dụng các bộ lọc phân phối dữ liệu lớn.

## Định Dạng Thời Gian & Sửa Lỗi Ngày Giờ (BeFood)

- Cải tiến hàm format thời gian để hỗ trợ thêm định dạng thời gian phi chuẩn từ crawler BeFood: `HH:mm DD/MM/YYYY` (ví dụ: `15:46 12/05/2026`).
- Sửa triệt để lỗi đảo ngày tháng năm do JavaScript tự động nhận dạng sai định dạng ngày (ví dụ: ngày 12/05/2026 bị hiểu nhầm thành ngày 05/12/2026).

## Mở Rộng Nhãn Chủ Đề (Topic) & Phím Tắt

- **Chủ đề mới "Tuyển dụng" (Recruitment)**: Thêm chủ đề `'recruitment'` phục vụ cho việc gán nhãn các bài viết tuyển dụng nhân sự của thương hiệu.
- **Tái phân bổ hotkeys**:
  - Phím **`y`** $\rightarrow$ Gán cho chủ đề **Tuyển dụng** (mới).
  - Phím **`u`** $\rightarrow$ Gán cho chủ đề **Khác** (chuyển từ phím `y` sang phím `u`).
- Khắc phục lỗi chồng lấn giao diện của dropdown chọn chủ đề: Khi mở dropdown chọn chủ đề, container cha sẽ nhận class `z-20 relative` và dropdown panel nhận `z-100` giúp nổi lên trên tất cả các card select và văn bản của các bài viết phía dưới trong DOM.

## Cải Tiến Thang Đo Mức Độ (Urgency) & Mức None

- **Nâng cấp lên 4 mức độ theo thang điểm Risk Score và thêm mức None**:
  - `none` (Không áp dụng - phím tắt **`d`** - icon `⚪`): Dành cho các bài viết tích cực, vì mức độ khẩn cấp rủi ro chỉ áp dụng cho bài tiêu cực hoặc trung tính.
  - `low` (Thấp - phím tắt **`z`** - icon `🟢`)
  - `medium` (Trung bình - phím tắt **`x`** - icon `🟡`)
  - `high` (Cao - phím tắt **`c`** - icon `🟠`)
  - `urgent` (Khẩn cấp - phím tắt **`v`** - icon `🔴`)
- Đồng bộ lại nhãn gán nhanh `IRRELEVANT_PRESET_LABEL` (Không liên quan) sử dụng mặc định mức độ khẩn cấp là `none` thay vì `low`.

## Giao Diện Màu Sắc Động Trực Quan (Premium UI)

- **Màu nền động cho select boxes**: Từng select box (Cảm xúc, Liên quan, Mức độ, Ý định) và nút dropdown Chủ đề sẽ tự động thay đổi màu nền và màu viền tương ứng với giá trị được chọn (Ví dụ: Cảm xúc Tích cực đổi thành nền xanh lá nhạt, Tiêu cực đổi thành nền đỏ nhạt). Giúp người gán nhãn dễ dàng kiểm tra nhanh trạng thái gán nhãn bằng mắt mà không cần đọc chữ.
- **Emoji màu sắc**: Bổ sung emoji màu sắc trực quan (🟢, 🔴, 🟡, 🔵, ⚪, ✅, ❌) làm tiền tố hiển thị cho từng tùy chọn trong dropdown.

## Cải Tiến Cơ Chế Bỏ Qua (Skip) & Khôi Phục Thread

- **Luôn hiển thị bộ gán nhãn**: Thay vì ẩn đi khi post/comment bị skip, bộ gán nhãn `LabelSelector` và nút gán nhanh **Không liên quan (Phím 0)** vẫn hiển thị để bạn có thể sửa nhãn hoặc unskip trực tiếp.
- **Nút "Khôi phục thread" (Unskip thread)**:
  * Khi một thread bị bỏ qua hoàn toàn (hoặc toàn bộ các items trong thread đều có nhãn `skipped: true`), nút **`⏭ Bỏ qua thread`** ở Action Bar dưới cùng sẽ tự động chuyển thành **`↩️ Khôi phục thread`** (nổi bật màu xanh lá).
  * Khi nhấn, hệ thống sẽ khôi phục trạng thái gán nhãn của tất cả các item trong thread về bình thường, xóa trạng thái skipped trong IndexedDB và reset assignment trên Supabase để cho phép gán nhãn lại từ đầu.

## Thống Kê Trong Sidebar

- Bỏ phần hiển thị phím tắt trong sidebar để làm gọn UI.
- Thêm card `Hàng chờ toàn bộ` theo nền tảng đang chọn để theo dõi tiến độ tổng quát:
  - Post chưa gán / Comment chưa gán
  - Post đã gán / Comment đã gán
  - Tổng còn lại / Tổng đã gán / Thread hoàn tất
- Các số trong card là thống kê toàn bộ trên database, không phụ thuộc vào limit thread đang load.

## Import Và Sync Dữ Liệu

- Dữ liệu crawl được import vào SQLite trước.
- Pipeline upsert post/comment theo khóa ổn định, không dùng URL làm ID.
- Dữ liệu cũ được giữ lại, metric mới được cập nhật và ghi vào lịch sử.
- Queue gán nhãn chỉ tạo/cập nhật cho dữ liệu mới hoặc dữ liệu cần xem lại.
- Supabase sync đẩy các bảng cần thiết từ SQLite lên Supabase.
