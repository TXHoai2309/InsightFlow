# Labeling Tool - Công Nghệ Sử Dụng

Tài liệu này tóm tắt các công nghệ, cấu trúc dữ liệu, và cơ chế vận hành chính đang được dùng cho module `labeling_tool` trong InsightFlow.

## Frontend

- **Next.js 14 App Router**: Tích hợp tool vào InsightFlow qua route riêng `/labeling_tool` để cô lập quá trình phát triển và kiểm thử.
- **React + TypeScript**: Xây dựng UI gán nhãn, quản lý state (currentThread, labels, threadStates), filter, hotkeys và lưu nhãn.
- **Tailwind CSS + Custom CSS**: Sử dụng chung hệ thống style tokens của InsightFlow, hỗ trợ Light/Dark mode tự động và bổ sung các hiệu ứng glassmorphism, màu sắc động cho select box và badges thông qua file CSS cô lập [labeling-tool.css](file:///d:/Thuc_Tap/InsightFlow/apps/web/src/app/labeling_tool/labeling-tool.css).
- **Client-side rendering**: Tool chạy hoàn toàn trên client để tối ưu tốc độ phản hồi bàn phím, tương tác UI mượt mà và trực tiếp gọi các REST API của Supabase.

## Quản Lý Phím Tắt (Hotkeys System)

Hệ thống hotkey giúp tăng tốc độ gán nhãn tối đa mà không cần rê chuột:
* **Điều hướng**:
  * `ArrowRight` / `Space` $\rightarrow$ Next thread / Skip thread
  * `ArrowLeft` / `p` $\rightarrow$ Prev thread
  * `Enter` $\rightarrow$ Xong (Complete) $\rightarrow$ Next
  * `Tab` $\rightarrow$ Focus chuyển đổi giữa Post và các bình luận (Comment/Reply).
* **Gán nhãn cho phần tử đang focus**:
  * `1` | `2` | `3` $\rightarrow$ Cảm xúc: Tích cực | Tiêu cực | Trung tính
  * `q` | `w` | `e` | `r` | `t` | `y` | `u` $\rightarrow$ Chủ đề: Chất lượng | Giá | Dịch vụ | Địa điểm | Khuyến mãi | Tuyển dụng | Khác
  * `a` | `s` $\rightarrow$ Liên quan thương hiệu: Có | Không
  * `z` | `x` | `c` | `v` | `d` $\rightarrow$ Mức độ khẩn cấp: Thấp | Trung bình | Cao | Khẩn cấp | None (Không có)
  * `h` | `m` | `b` | `n` $\rightarrow$ Ý định (Intent): Hot | Warm | Cold | None
  * `0` $\rightarrow$ Gán nhãn nhanh bộ nhãn mặc định khi bài viết "Không liên quan".

## Data và Backend

- **Supabase Postgres**: Cơ sở dữ liệu đám mây trung tâm lưu trữ thông tin bài viết cào được, queue phân công, annotations và lịch sử chỉnh sửa revision.
- **Supabase REST API**: Frontend đọc/ghi dữ liệu trực tiếp qua REST endpoint với demo anon key, quản lý hủy request bằng `AbortSignal`.
- **IndexedDB**: Cơ sở dữ liệu local trên trình duyệt của người dùng (tên DB: `insightflow_labeling`), lưu trữ tạm thời các nhãn đã gán và trạng thái tiến trình (progress) của người gán nhãn, bảo toàn dữ liệu khi người dùng load lại trang hoặc gặp sự cố mạng.
- **SQLite local**: Database trung tâm tại máy cào dữ liệu (crawler) để xử lý thô và đồng bộ hóa lên Supabase.
- **Python pipeline**: Pipeline tự động import dữ liệu từ crawler vào SQLite, chuẩn hóa dữ liệu, cập nhật metrics, tạo phân công gán nhãn và đồng bộ hóa lên Supabase.

## Bảng Dữ Liệu Chính trên Supabase

- `posts`: Lưu bài viết gốc, metadata, metrics (likes, shares, views) và trạng thái cào.
- `comments`: Lưu comment/reply liên kết với `posts` qua `post_id`.
- `labeling_assignments`: Điều phối phân công hàng chờ gán nhãn theo thread/post/comment.
- `annotations`: Lưu thông tin nhãn gán hiện tại của từng post/comment (lưu dưới dạng đối tượng JSON của nhãn).
- `annotation_revisions`: Lưu lịch sử tất cả các lần chỉnh sửa nhãn của từng người gán nhãn.
- `metrics_history`: Lưu lịch sử biến động metrics theo thời gian của từng bài viết.

## Cơ Chế Gán Nhãn & Đồng Bộ

1. **Tải Queue**: Tool load danh sách phân công từ bảng `labeling_assignments` theo bộ lọc nền tảng và ngày.
2. **Gán Nhãn**: Khi người dùng thay đổi nhãn, dữ liệu được ghi đồng thời vào IndexedDB local và bảng `annotations` trên Supabase.
3. **Lưu Lịch Sử**: Mỗi lần ghi/sửa nhãn sẽ tự động chèn một dòng vào `annotation_revisions`.
4. **Hoàn Tất Thread**: Khi bấm "Xong" hoặc "Bỏ qua", trạng thái phân công của post/comment tương ứng trong `labeling_assignments` sẽ chuyển sang `'completed'` hoặc `'skipped'`.
5. **Khôi Phục (Unskip)**: Khi khôi phục một thread bị skip, trạng thái phân công được reset về `'unassigned'` trên Supabase và xóa record threadState trong IndexedDB để người dùng có thể gán nhãn lại.

## Lưu Ý Vận Hành Tránh Lỗi Giao Diện (z-index)

Do giao diện gán nhãn hiển thị danh sách các card xếp chồng nhau theo chiều dọc, việc mở dropdown menu chọn nhiều chủ đề (`TopicSelector`) có thể bị các select box của các card bên dưới đè lên do trình duyệt tự động tạo Stacking Context cho phần tử render sau.
* **Khắc phục**: 
  - Card Post hoặc Comment đang được focus sẽ nhận class `z-20 relative`.
  - Nút dropdown chủ đề khi mở sẽ nhận class `z-50 relative`.
  - Panel menu chủ đề nhận `z-100 absolute`.
  Cơ chế này đảm bảo dropdown menu luôn được hiển thị trên cùng lớp giao diện mà không cần dùng đến portal phức tạp.
