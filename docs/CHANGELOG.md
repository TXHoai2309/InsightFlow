# Changelog

Tất cả các thay đổi đáng chú ý đối với dự án này sẽ được ghi lại trong file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
## Unreleased - 2026-06-22
## Added / Updated / Fixed
Trang chủ (/):

Tái thiết kế Hero Section: thêm dashboard mini hiển thị trực quan (SVG/HTML) tích hợp glassmorphism và góc nghiêng 3D thay vì ảnh tĩnh.
Tích hợp hiệu ứng số nhảy đếm ngược KPI và Animation trượt/nổi bật mượt mà.
Nâng cấp phần Social Proof (TrustedBySection) sử dụng hiệu ứng Marquee tự động cuộn ngang mượt mà cho logo thương hiệu.
Cải thiện Navbar: Áp dụng hiệu ứng backdrop-filter: blur(12px).
Sửa lỗi 2 Footer bị đè lên nhau (xóa <Footer /> thừa ở page.tsx).
Sửa lỗi Hydration Mismatch ở SSR: Chuyển toàn bộ @keyframes animation vào globals.css.
Xác thực / Authentication (/login, /register):

Phóng to kích thước Logo chuyên nghiệp hơn (chiều cao ảnh lên 220px).
Khắc phục triệt để lỗi viền trắng quanh ảnh Logo bằng kĩ thuật CSS mix-blend-multiply trực tiếp trên thẻ <img>, loại bỏ cản trở từ overflow-hidden.
Căn chỉnh thẩm mỹ, giảm khoảng trống (margin) giữa Logo và Form.
Thay thế link ảnh preview bị hỏng ở cột trái trang đăng ký bằng ảnh Unsplash Dashboard mẫu nét và đẹp hơn.
Trang Ngành (/nganh):

Giao diện Landing độc lập (ẩn Dashboard Shell).
Các component: Hero Section, Feature Grid, Bento Box, CTA Section.
Trang Về chúng tôi (/ve-chung-toi):

Giao diện Landing độc lập với hiệu ứng Smooth Scroll.
Tích hợp anchor links (#mission-vision, #team).
Các component: AboutHeroSection, MissionVisionSection, CoreValuesSection, TeamSection (kèm ảnh thực tế sinh bằng AI), PartnersSection, AboutCTASection.
Trang Thông tin cá nhân / Cài đặt tài khoản (/profile):

Cập nhật Navbar: avatar + tên người dùng có thể click để điều hướng đến profile.
Giao diện 3 tab chuyên biệt:
Thông tin cá nhân: Xem và chỉnh sửa thông tin (tên, số điện thoại, công ty, vai trò). Đồng bộ hai chiều với Firebase Firestore (users/{uid}) và Firebase Auth (displayName).
Bảo mật: Form đổi mật khẩu hoàn chỉnh sử dụng reauthenticateWithCredential và updatePassword của Firebase Auth, hiển thị độ mạnh mật khẩu và checklist thời gian thực.
Thông báo: Quản lý tùy chọn nhận thông báo (Email, Push, Khủng hoảng, Báo cáo ngày). Lưu trạng thái người dùng lên Firestore (users/{uid}/notifications).
Toàn bộ 3 tab đều hỗ trợ tính năng Hủy (trả về trạng thái cũ) và Lưu (có hiệu ứng loading và thông báo thành công).

## Added / Updated
Trang Quản lý khách hàng tiềm năng (/leads):
Tích hợp Firestore real-time listener / query cho danh sách Lead.
Thiết kế và phát triển bộ ba components chuyên biệt cho trang Leads:
LeadStats (Thống kê Lead): Hiển thị 4 chỉ số quan trọng theo thời gian thực bao gồm: Tổng Lead mới (cần tiếp cận ngay), Tỉ lệ chuyển đổi (đã phản hồi thành công / tổng số lead), Sắp hết hạn (độ ưu tiên cao), và Đã xử lý (chốt). Hỗ trợ hiệu ứng skeleton loading khi đang tải dữ liệu.
LeadFilters (Bộ lọc Lead): Hỗ trợ lọc theo Thương hiệu (Workspace), Nền tảng (Platform: Facebook, TikTok, YouTube, Threads, Be/BeFood, Google Maps, Báo điện tử) và Độ khẩn cấp (Urgency: Đang chờ xử lý, Cần xử lý gấp, Đã quá hạn, Đã xử lý / Bỏ qua, Tất cả trạng thái).
LeadCard (Thẻ Lead chi tiết):
Hiển thị thông tin khách hàng, avatar phối màu tự động dựa trên tên, icon nền tảng cào dữ liệu, nội dung tương tác và các tag ý định mua hàng (intent: Hot, Warm, Cold) cùng từ khóa tín hiệu.
Tích hợp Đồng hồ đếm ngược thời gian xử lý (Lead Expiry Countdown): tự động tính thời hạn xử lý dựa trên Intent (Hot: 30 phút, Warm: 24 giờ, Cold: 7 ngày), đếm ngược thời gian thực, đổi màu và rung nháy cảnh báo đỏ khi sắp quá hạn hoặc chuyển sang trạng thái "Quá hạn" khi hết thời gian xử lý.
Hỗ trợ cập nhật nhanh trạng thái Lead (Mới, Đang xử lý, Đã xử lý, Bỏ qua) đồng bộ trực tiếp lên Firestore.
Tích hợp CRM mini: ô nhập ghi chú nhanh (notes) tự động lưu trên Firestore khi nhấn Enter hoặc bấm icon check, hiển thị nhật ký thời gian liên hệ cuối.
Tích hợp phím tắt tiếp cận trực tiếp qua Zalo chat (zalo.me), Facebook Messenger (m.me), gọi điện (tel:) và link xem bài viết gốc trên nền tảng nguồn. Khi click tiếp cận, hệ thống tự động chuyển trạng thái lead sang "Đang xử lý" và tăng số lần tiếp cận chăm sóc (contact_attempts).
Nâng cấp Zustand store (dashboard.store.ts):
Quản lý trạng thái leads, bộ lọc, và tích hợp các hàm client-side filtering: lọc theo thương hiệu, nền tảng, khoảng thời gian.
Xây dựng thuật toán Sắp xếp theo thứ tự ưu tiên xử lý (Priority Sorting) cho Leads: ưu tiên hiển thị Lead còn hạn xử lý gần nhất trước (tính theo thời gian đếm ngược), tiếp đến là Lead đã quá hạn (thời gian cào mới nhất xếp trên), và cuối cùng là các Lead đã xử lý/bỏ qua (thời gian tạo mới nhất).
Thêm hàm getFilteredLeadsWithoutUrgency để tính toán chính xác chỉ số Hot Leads hiển thị trên Dashboard tổng quan mà không bị ảnh hưởng bởi bộ lọc Độ khẩn cấp (Urgency) của trang Leads.
Tài liệu đặc tả (docs/SPEC.md):
Bổ sung quy tắc nghiệp vụ cho US-10: Phân tích Intent (Lead Generation):
Quy tắc phát hiện Lead Candidate.
Công thức tính điểm ý định mua hàng dựa trên nhóm từ khóa Hot (trọng số +3), Warm (+1), Cold (+0.3) kết hợp phạt cảm xúc tiêu cực (Negative Sentiment Penalty nhân hệ số 0.6).
Quy định cụ thể thời gian hết hạn xử lý (SLA) cho từng phân nhóm: Hot Lead (30 phút), Warm Lead (24 giờ), Cold Lead (7 ngày).

Trang Báo cáo (/reports):
Triển khai US: "Là PO, tôi muốn hệ thống tạo sẵn dữ liệu báo cáo tổng hợp để trang Reports có thể hiển thị nhanh các chỉ số quan trọng mà không phải query toàn bộ dữ liệu liên tục."
Xây dựng Scheduled Job (Cloud Function) tự động tính toán và tạo sẵn report summary từ collection mentions theo định kỳ, loại bỏ nhu cầu query toàn bộ dữ liệu mỗi lần người dùng truy cập trang Reports.
Tính toán Overview Stats: tổng số mentions, số lượng theo từng thương hiệu (by_brand), số lượng theo từng nguồn (by_source), và số lượng risk mentions.
Tính toán Sentiment & Topic Distribution: phân phối sentiment tổng thể, danh sách top topics phổ biến nhất, và thống kê chi tiết theo từng brand (by_brand_breakdown) khi dữ liệu đủ lớn.
Lưu kết quả report summary vào Firestore (collection reports_demo), kèm field generated_at để theo dõi thời điểm tạo báo cáo, đảm bảo dữ liệu có cấu trúc rõ ràng, dễ đọc cho API SP1-02.
Thêm bộ lọc theo Nhãn hàng/Thương hiệu (Brand Filter) trên trang Reports: cho phép người dùng xem nhanh chỉ số tổng hợp và phân phối sentiment/topic riêng theo từng brand, sử dụng dữ liệu by_brand_breakdown đã tính sẵn (không gọi lại API khi đổi bộ lọc).
## [Unreleased] - 2026-06-19

### Added / Updated

- **Trang Ngành (`/nganh`)**:
  - Giao diện Landing độc lập (ẩn Dashboard Shell).
  - Các component: Hero Section, Feature Grid, Bento Box, CTA Section.
- **Trang Về chúng tôi (`/ve-chung-toi`)**:
  - Giao diện Landing độc lập với hiệu ứng Smooth Scroll.
  - Tích hợp anchor links (`#mission-vision`, `#team`).
  - Các component: AboutHeroSection, MissionVisionSection, CoreValuesSection, TeamSection (kèm ảnh thực tế sinh bằng AI), PartnersSection, AboutCTASection.
- **Trang Thông tin cá nhân / Cài đặt tài khoản (`/profile`)**:
  - Cập nhật Navbar: avatar + tên người dùng có thể click để điều hướng đến profile.
  - Giao diện 3 tab chuyên biệt:
    1. **Thông tin cá nhân:** Xem và chỉnh sửa thông tin (tên, số điện thoại, công ty, vai trò). Đồng bộ hai chiều với Firebase Firestore (`users/{uid}`) và Firebase Auth (`displayName`).
    2. **Bảo mật:** Form đổi mật khẩu hoàn chỉnh sử dụng `reauthenticateWithCredential` và `updatePassword` của Firebase Auth, hiển thị độ mạnh mật khẩu và checklist thời gian thực.
    3. **Thông báo:** Quản lý tùy chọn nhận thông báo (Email, Push, Khủng hoảng, Báo cáo ngày). Lưu trạng thái người dùng lên Firestore (`users/{uid}/notifications`).
  - Toàn bộ 3 tab đều hỗ trợ tính năng Hủy (trả về trạng thái cũ) và Lưu (có hiệu ứng loading và thông báo thành công).

---

## [Unreleased] - 2026-06-16

> Dự án đang ở giai đoạn khởi tạo. Chưa có thay đổi nào được ghi nhận.
> Các tính năng dưới đây là kế hoạch phát triển dự kiến cho các phiên bản tiếp theo.

## [1.2.0] - 2026-06-17

### Added
- Thiết kế giao diện màn hình **Dashboard**.
- Thiết kế giao diện màn hình **Brands**: cấu hình từ khóa theo dõi cho từng thương hiệu.
- Thiết kế giao diện màn hình **Mentions**: hiển thị chi tiết từng bài đăng, hỗ trợ lọc theo Sentiment, Topic, Platform.
- Thiết kế giao diện màn hình **Leads**: danh sách Lead được chia theo Tab (Hot, Warm, Cold).
- Thiết kế giao diện màn hình **Alerts**: hiển thị cảnh báo khủng hoảng.
- Thiết kế giao diện màn hình **Reports**: danh sách báo cáo.
- Bổ sung giao diện **Responsive** cho toàn bộ các màn hình trên (Dashboard, Brands, Mentions, Leads, Alerts, Reports), đảm bảo hiển thị tốt trên các kích thước màn hình (desktop, tablet, mobile).

## [1.1.0] - 2026-06-16
- Phiên bản khởi tạo đầu tiên của ứng dụng InsightFlow.
- Tích hợp Firebase Authentication và Firestore.
- Giao diện Landing Page cơ bản.
- Chức năng Đăng nhập/Đăng ký cơ bản.
### Thêm (Added)
- Triển khai duy trì phiên đăng nhập (`setPersistence`) với `browserLocalPersistence` trong Firebase, giúp giữ trạng thái đăng nhập lên đến 1 tháng.
- Thêm lời chào cá nhân hóa "Chào mừng, [Tên người dùng]" và nút Đăng xuất trên thanh điều hướng (`TopNavBar`) khi đã đăng nhập.
- Thêm logic chuyển hướng động cho các nút "Bắt đầu" trên trang chủ: Chuyển thành "Vào Dashboard" nếu đã đăng nhập.

### Thay đổi (Changed)
- Cấu trúc lại luồng chuyển hướng:
    - Đăng ký thành công -> Chuyển hướng sang trang Đăng nhập (`/login`).
    - Đăng nhập thành công -> Chuyển hướng về Trang chủ (`/`).
- Chuyển đổi `HeroSection` và `FinalCTASection` sang Client Components để hỗ trợ xử lý trạng thái đăng nhập thời gian thực.
- Cập nhật các nút hành động từ `<button>` sang `<Link>` để tối ưu hóa điều hướng trong Next.js.

### Sửa lỗi (Fixed)
- Khắc phục lỗi runtime `useAuth is not a function` do sử dụng React Hooks trong Server Components.
- Sửa lỗi các nút trên trang chủ không nhận diện được trạng thái phiên đăng nhập hiện tại.




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