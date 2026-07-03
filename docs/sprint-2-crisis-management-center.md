# Tài liệu tính năng: Trung tâm Xử lý Khẩn cấp & Đồng bộ Realtime (Sprint 2)

Tài liệu này mô tả chi tiết chức năng cải tiến dành riêng cho **Nhân viên xử lý khủng hoảng (Crisis Staff)** và **Quản lý thương hiệu (Brand Manager)** tại trang quản lý Cảnh báo `/alerts`.

---

## 1. Mục tiêu Nghiệp vụ
*   **Nhận diện & Ưu tiên nhanh**: Giúp nhân viên ngay lập tức nhận diện các sự vụ/bình luận tiêu cực có rủi ro cao (`critical` / `high`) của nhãn hàng mình quản lý.
*   **Liên hệ lập tức**: Gộp trực tiếp thông tin liên hệ của tác giả từ tệp khách hàng tiềm năng (`leads`) để nhân viên có thể gọi điện hoặc nhắn tin nhanh.
*   **Tránh xử lý trùng lặp**: Đồng bộ realtime 100% trạng thái để khi một nhân viên bấm tiếp nhận sự vụ, nó tự động biến mất trên màn hình các nhân viên khác.
*   **Sửa lỗi nhãn AI**: Cung cấp luồng gửi yêu cầu điều chỉnh các nhãn phân loại (sắc thái, độ nghiêm trọng, chủ đề) khi AI gán nhãn sai và cho phép cấp quản lý phê duyệt cập nhật tự động.

---

## 2. Các Tính năng Mới đã triển khai

### A. Phân tách Chế độ Xem (Split View Toggle)
*   **Trung tâm khẩn cấp (Emergency Feed)**:
    *   Chỉ hiển thị các sự vụ mức rủi ro cao chưa xử lý dưới dạng **Lưới thẻ (Grid card)**.
    *   Ẩn toàn bộ bảng biểu, bộ lọc và các phần cấu hình để tránh làm loãng thông tin và tăng sự tập trung.
*   **Xem tất cả (Detailed Queue)**:
    *   Hiển thị bảng dữ liệu đầy đủ, các tab phân loại trạng thái (Chưa giải quyết, Đang giải quyết, Đã giải quyết), bộ lọc phức tạp (Brand, Severity, Signal) và bảng cấu hình ngưỡng cảnh báo/từ khóa.
*   **Tự động chuyển đổi thông minh (Auto-switching)**:
    *   Khi trang tải xong, nếu phát hiện không có sự vụ rủi ro cao nào cần xử lý khẩn cấp, hệ thống tự động chuyển sang chế độ **Xem tất cả** để tối ưu hóa luồng công việc.
    *   Hiển thị badge nhấp nháy đỏ báo hiệu số lượng sự vụ khẩn cấp trực tiếp trên nút chuyển đổi.

### B. Tích hợp Thông tin Liên hệ trực tiếp trên Thẻ Sự vụ
*   **Dò tìm liên lạc**: Hệ thống tự động truy vấn chéo dữ liệu tác giả bình luận với cơ sở dữ liệu `leads` để lấy Số điện thoại và Email.
*   **Hộp liên lạc nhanh**: Hiển thị Số điện thoại và Email kèm nút sao chép (copy) nhanh.
*   **Các phím liên hệ khẩn cấp**:
    *   **Gọi điện**: Link `tel:` gọi điện trực tiếp (đã chuẩn hóa/loại bỏ ký tự lạ).
    *   **Zalo**: Link chat Zalo trực tiếp qua số điện thoại (`https://zalo.me/[sdt]`).
    *   **Xem bình luận gốc**: Link dẫn trực tiếp tới bài viết/bình luận xảy ra khủng hoảng ngoài đời thực (Facebook, TikTok...).
    *   **Gửi Email**: Link `mailto:` gửi thư điện tử nhanh.

### C. Luồng Yêu cầu Sửa nhãn AI (Label Correction Flow)
*   **Gửi yêu cầu chỉnh sửa (Nhân viên khủng hoảng)**:
    *   Click nút **Sửa nhãn** trên bất kỳ thẻ sự cố nào để mở form đề xuất điều chỉnh sắc thái (Sentiment), độ nghiêm trọng (Severity) hoặc chủ đề (Topic) kèm lý do chi tiết.
    *   Yêu cầu được lưu vào Firestore collection `insightflow_correction_requests` ở trạng thái `"pending"`.
*   **Quản lý & Phê duyệt (Quản lý thương hiệu)**:
    *   Truy cập tab thứ tư **Yêu cầu sửa nhãn** trên thanh tab bar.
    *   Xem danh sách các đề xuất chờ duyệt trong phạm vi thương hiệu quản lý, đối chiếu sự thay đổi các nhãn và lý do đề xuất.
    *   Bấm **Phê duyệt (Approve)**: Tự động cập nhật các trường nhãn tương ứng trên tài liệu `insightflow_labels` của Firestore và chuyển trạng thái yêu cầu thành `"approved"`.
    *   Bấm **Từ chối (Reject)**: Chuyển trạng thái yêu cầu thành `"rejected"`.

### D. Cơ chế Đồng bộ Thời gian thực (Firestore Real-time Sync)
*   Hàm `fetchAlerts` và `fetchCorrectionRequests` trong `alert.store.ts` được nâng cấp sang cơ chế lắng nghe thay đổi liên tục của Firebase thông qua **`onSnapshot`**.
*   Khi **Nhân viên A** bấm **Tiếp nhận** một sự vụ, Firestore cập nhật trạng thái `status: "acknowledged"`.
*   Tín hiệu thay đổi lập tức được truyền về máy tính của các **Nhân viên B, C...** khiến thẻ sự cố đó tự động biến mất khỏi hàng đợi "Chưa giải quyết" trong vòng dưới 1 giây mà không cần F5 hay bấm Sync, loại bỏ hoàn toàn nguy cơ tranh chấp/trùng lặp tác vụ.
*   Khi quản lý bấm **Phê duyệt** yêu cầu sửa nhãn, nhãn của sự vụ được cập nhật trong Firestore và tự động phản ánh trực tiếp trên toàn bộ các máy trạm đang mở màn hình.

### E. Xây dựng Báo cáo sự vụ nhanh (Incident Report generation)
*   Cho phép nhân viên bấm **Báo cáo** trên từng thẻ rủi ro cao để mở hộp thoại đánh giá mức độ ảnh hưởng và các bước ứng phó đề xuất (SOP).
*   Hỗ trợ xuất báo cáo hoàn chỉnh ra file định dạng JSON tải về máy.
