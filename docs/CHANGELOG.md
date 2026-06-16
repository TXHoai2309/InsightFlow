# Changelog

Tất cả các thay đổi đáng chú ý đối với dự án này sẽ được ghi lại trong file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Dự án đang ở giai đoạn khởi tạo. Chưa có thay đổi nào được ghi nhận.
> Các tính năng dưới đây là kế hoạch phát triển dự kiến cho các phiên bản tiếp theo.

### Added
- Xây dựng pipeline crawler thu thập dữ liệu công khai từ báo điện tử, Fanpage và Group MXH theo từ khóa tùy biến.
- Tích hợp Brand Mention Detection — tự động xác định nội dung đề cập đúng thương hiệu, loại bỏ trùng từ khóa ngẫu nhiên.
- Thiết lập Campaign Management — cấu hình chiến dịch theo dõi riêng biệt cho từng thương hiệu (từ khóa chính, từ đồng nghĩa, tên sản phẩm, chi nhánh).
- Tích hợp 9 thương hiệu F&B mục tiêu vào hệ thống theo dõi (XLIII Coffee, Maison Marou, Laha Cafe, KATINAT, Phê La, Pizza 4P's, Highlands Coffee, Phúc Long, Cộng Cà Phê).
- Phát triển AI NLP Engine (fine-tune PhoBERT / multilingual BERT) phân loại cảm xúc 3 trạng thái: Tích cực / Tiêu cực / Trung tính (mục tiêu độ chính xác > 90%).
- Áp dụng Context Window mở rộng để nhận diện sarcasm và ngôn ngữ lóng tiếng Việt (mục tiêu F1-score > 75%).
- Xây dựng Topic Tagging tự động — gắn nhãn chủ đề F&B: Chất lượng sản phẩm, Giá cả, Không gian/Vệ sinh, Thái độ phục vụ, Tốc độ giao hàng, Vấn đề vận hành.
- Triển khai Spam Filter nhị phân ở tầng đầu vào để loại bỏ tin rác, bot comment trước khi vào pipeline NLP.
- Áp dụng thuật toán MinHash LSH phát hiện và loại trừ nội dung gần trùng lặp (near-duplicate).
- Xây dựng Crisis Alert Engine — kích hoạt cảnh báo tức thì qua Telegram/Zalo khi mention tiêu cực tăng đột biến (mục tiêu Crisis Alert Latency < 3 phút).
- Phát triển Dashboard trực quan real-time: tổng lưu lượng mention, tỷ lệ sentiment, bảng xếp hạng nguồn tin, xu hướng biến động theo thời gian.
- Tự động xuất Báo cáo tóm tắt hàng ngày định dạng PDF/Excel gửi tới người quản lý.
- Triển khai kiến trúc Event-Driven với Message Queue (Apache Kafka / RabbitMQ) và Kubernetes HPA để xử lý tải đột biến.
- Phân tầng pipeline thành Fast-path (rule-based < 1 giây) và Deep-path (NLP chuyên sâu 5–10 giây).
- Thiết lập PII Anonymization Pipeline — tự động ẩn danh hóa thông tin định danh cá nhân trước khi lưu vào cơ sở dữ liệu.

### Security
- Giới hạn crawler chỉ thu thập dữ liệu công khai, tuân thủ Luật An ninh mạng và nghị định VNDP về bảo vệ dữ liệu cá nhân.
- Lưu trữ nội dung báo điện tử dưới dạng headline, đoạn tóm tắt ngắn và URL gốc — không sao chép toàn văn bài báo.

---

## [0.1.0-alpha] - YYYY-MM-DD

> _Phiên bản chưa phát hành. Ngày tháng sẽ được cập nhật khi hoàn thành Giai đoạn 1._

### Added
- Khởi tạo pipeline crawler cơ bản và bản end-to-end demo cho 9 thương hiệu F&B mục tiêu.
- Thiết lập Brand Mention Detection và Campaign Management ở mức cơ bản.

---

## [1.0.0] - YYYY-MM-DD

> _Phiên bản chưa phát hành. Ngày tháng sẽ được cập nhật khi hoàn thành MVP._

### Added
- Phát hành MVP chính thức với đầy đủ 5 tính năng cốt lõi: theo dõi từ khóa, tổng hợp mention, phân loại cảm xúc, cảnh báo Crisis qua Telegram/Zalo, và báo cáo tự động hàng ngày.
- Hoàn thiện Dashboard real-time và Crisis Alert Engine trên môi trường production.
- Áp dụng toàn bộ lớp bảo mật dữ liệu (PII Anonymization, tuân thủ VNDP) trên môi trường production.

---

## Liên kết phiên bản

[Unreleased]: https://github.com/insightflow/insightflow/commits/main
[1.0.0]: https://github.com/insightflow/insightflow/releases/tag/v1.0.0
[0.1.0-alpha]: https://github.com/insightflow/insightflow/releases/tag/v0.1.0-alpha
