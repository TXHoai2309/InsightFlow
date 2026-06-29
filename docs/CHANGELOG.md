# InsightFlow — Changelog

> Changelog này được viết lại theo **thứ tự commit từ cũ đến mới** trên nhánh `main`.
> Mục tiêu của file là ghi nhận quá trình phát triển thực tế của repo, tránh mô tả vượt quá những gì đã được commit.
>
> Quy ước:
>
> - Các commit có message rõ ràng sẽ được diễn giải theo đúng nội dung commit.
> - Các commit message ngắn như `fix`, `done`, `oke`, `a`, `update` được ghi nhận là cập nhật/hoàn thiện chung, không suy diễn quá sâu.
> - Các commit merge vẫn được giữ lại để phản ánh đúng dòng phát triển giữa các nhánh.
>   Tất cả các thay đổi đáng chú ý đối với dự án này sẽ được ghi lại trong file này.
>   Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
## [Unreleased] - 2026-06-29

### Added
- **Trang đăng ký (/register)**: 
  - Thêm tính năng xác thực tài khoản bằng mã OTP (gửi qua EmailJS).
  - Thêm chức năng gửi lại mã OTP sau 30 giây (có bộ đếm ngược).
  - Vô hiệu hóa các trường mật khẩu cho đến khi OTP được xác thực thành công.
- **Trang báo cáo (/reports)**: 
  - Mở rộng chức năng xuất báo cáo, hỗ trợ xuất báo cáo ra nhiều nền tảng thay vì chỉ TikTok.

### Fixed
- **Trang quên mật khẩu (/forgot-password)**:
  - Thêm thông báo lỗi khi nhập sai mã OTP.
  - Thêm tính năng gửi lại mã OTP sau 30 giây.
- **Trang đăng ký (/register)**:
  - Khắc phục lỗi hydration ở thành phần `AtmosphereDots`.
  - Khắc phục lỗi thiếu import `useEffect` và `emailjs`.

  ### Fixed
  - **Giao diện sáng/tối (Theme-aware UI)**:
    - Khôi phục cơ chế tự động chuyển đổi logo cho các trang Auth (Đăng nhập, Đăng ký, Quên mật khẩu).
    - Logo sẽ hiển thị `logo.png` khi bật chế độ tối (`dark theme`) và `logo-dark.png` khi bật chế độ sáng (`light theme`), đảm bảo độ tương phản tối ưu.
    - Đồng bộ màu nền (`background`), màu chữ và các thành phần UI trong form Đăng nhập/Đăng ký để đồng nhất với theme của ứng dụng.
  - **Tùy chỉnh Logo**:
    - Tăng kích thước logo ở trang "Quên mật khẩu" từ `52px` lên `80px` để dễ nhìn hơn.
     - Sửa lỗi `ReferenceError: handleGoogleLogin is not defined` trên trang Đăng nhập phát sinh sau quá trình refactor.
   - **Sửa lỗi Code & Build**:
     - Khắc phục lỗi cú pháp (Syntax Error) tại `RegisterForm.tsx` và `forgot-password/page.tsx` do quá trình thay thế mã không hoàn chỉnh.
     - Giải quyết các xung đột merge (`merge conflicts`) phát sinh trong `TopNavBar.tsx` và `LoginForm.tsx` giúp ứng dụng biên dịch bình thường.
     - Sửa lỗi khai báo trùng lặp biến `theme` tại `AboutLogoSection.tsx`.

## Unreleased - 2026-06-22

## Added / Updated / Fixed

### 2026-06-25

- Cập nhật trang Quản lý khách hàng tiềm năng (`/leads`): nút `Xem bài viết gốc` hiển thị cho mọi lead có `lead.url`, chỉ trỏ đến bài đăng/comment gốc, không dùng `social_profile_url` làm link liên hệ.
- Chỉnh sửa `LeadCard`: tách riêng hành động `Liên hệ` và `Xem bài viết gốc`, đảm bảo `Liên hệ` chỉ xử lý tương tác khách hàng (Zalo, Messenger, Email, Phone) còn `Xem bài viết gốc` chỉ mở bài đăng.
- Cập nhật dữ liệu Firestore cho Lead: mở rộng schema lead với `phone`, `email`, `zalo_id`, `messenger_id`, `social_profile_url`, `contact_attempts`, `last_contact_at`, `notes`, và thêm hàm `DashboardService.updateLeadDetails` / `updateLeadStatus` để đồng bộ tương tác chăm sóc trực tiếp lên Firebase.- Cập nhật dữ liệu cho các trang Dashboard, Mentions, Alerts, Reports và Leads: cải thiện truy vấn Firebase, đồng bộ lại nguồn dữ liệu, sửa lỗi fetch và render bảng, và bổ sung tính năng báo cáo lưu trữ, preview, download PDF.
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

### 2026-06-26

- Xây dựng và thiết kế trang chi tiết đề cập (`/mentions/[id]`): tạo layout chi tiết cho bài viết và section bình luận, bổ sung thông tin sentiment, độ tin cậy và metadata đề cập.
- Cập nhật trang chi tiết đề cập (`/mentions/[id]`): xóa hai nhãn `Đúng bài viết gốc` và `Theo luồng reply` trên phần comment, đồng thời loại bỏ hành vi nhấp chuyển trang khi bấm vào comment.
- Chỉnh sửa logic hiển thị thread comment để giữ comment tĩnh trên trang đề cập chi tiết, tránh chuyển hướng không mong muốn khi xem hội thoại.
- Các thay đổi khác: điều chỉnh hiển thị comment, sửa lỗi render comment thread và tăng tính ổn định cho trang đề cập.

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

## [Unreleased] - 2026-06-22

### Added / Updated

- **Trang Quản lý khách hàng tiềm năng (`/leads`)**:
  - Tích hợp Firestore real-time listener / query cho danh sách Lead.
  - Thiết kế và phát triển bộ ba components chuyên biệt cho trang Leads:
    1. **`LeadStats` (Thống kê Lead)**: Hiển thị 4 chỉ số quan trọng theo thời gian thực bao gồm: _Tổng Lead mới_ (cần tiếp cận ngay), _Tỉ lệ chuyển đổi_ (đã phản hồi thành công / tổng số lead), _Sắp hết hạn_ (độ ưu tiên cao), và _Đã xử lý (chốt)_. Hỗ trợ hiệu ứng skeleton loading khi đang tải dữ liệu.
    2. **`LeadFilters` (Bộ lọc Lead)**: Hỗ trợ lọc theo Thương hiệu (Workspace), Nền tảng (Platform: Facebook, TikTok, YouTube, Threads, Be/BeFood, Google Maps, Báo điện tử) và Độ khẩn cấp (Urgency: Đang chờ xử lý, Cần xử lý gấp, Đã quá hạn, Đã xử lý / Bỏ qua, Tất cả trạng thái).
    3. **`LeadCard` (Thẻ Lead chi tiết)**:
       - Hiển thị thông tin khách hàng, avatar phối màu tự động dựa trên tên, icon nền tảng cào dữ liệu, nội dung tương tác và các tag ý định mua hàng (intent: Hot, Warm, Cold) cùng từ khóa tín hiệu.
       - Tích hợp **Đồng hồ đếm ngược thời gian xử lý (Lead Expiry Countdown)**: tự động tính thời hạn xử lý dựa trên Intent (Hot: 30 phút, Warm: 24 giờ, Cold: 7 ngày), đếm ngược thời gian thực, đổi màu và rung nháy cảnh báo đỏ khi sắp quá hạn hoặc chuyển sang trạng thái "Quá hạn" khi hết thời gian xử lý.
       - Hỗ trợ cập nhật nhanh trạng thái Lead (Mới, Đang xử lý, Đã xử lý, Bỏ qua) đồng bộ trực tiếp lên Firestore.
       - Tích hợp CRM mini: ô nhập ghi chú nhanh (`notes`) tự động lưu trên Firestore khi nhấn Enter hoặc bấm icon check, hiển thị nhật ký thời gian liên hệ cuối.
       - Tích hợp phím tắt tiếp cận trực tiếp qua Zalo chat (`zalo.me`), Facebook Messenger (`m.me`), gọi điện (`tel:`) và link xem bài viết gốc trên nền tảng nguồn. Khi click tiếp cận, hệ thống tự động chuyển trạng thái lead sang "Đang xử lý" và tăng số lần tiếp cận chăm sóc (`contact_attempts`).
  - Nâng cấp **Zustand store (`dashboard.store.ts`)**:
    - Quản lý trạng thái leads, bộ lọc, và tích hợp các hàm client-side filtering: lọc theo thương hiệu, nền tảng, khoảng thời gian.
    - Xây dựng thuật toán **Sắp xếp theo thứ tự ưu tiên xử lý (Priority Sorting)** cho Leads: ưu tiên hiển thị Lead còn hạn xử lý gần nhất trước (tính theo thời gian đếm ngược), tiếp đến là Lead đã quá hạn (thời gian cào mới nhất xếp trên), và cuối cùng là các Lead đã xử lý/bỏ qua (thời gian tạo mới nhất).
    - Thêm hàm `getFilteredLeadsWithoutUrgency` để tính toán chính xác chỉ số Hot Leads hiển thị trên Dashboard tổng quan mà không bị ảnh hưởng bởi bộ lọc Độ khẩn cấp (Urgency) của trang Leads.
- **Tài liệu đặc tả (`docs/SPEC.md`)**:
  - Bổ sung quy tắc nghiệp vụ cho **US-10: Phân tích Intent (Lead Generation)**:
    - Quy tắc phát hiện Lead Candidate.
    - Công thức tính điểm ý định mua hàng dựa trên nhóm từ khóa Hot (trọng số +3), Warm (+1), Cold (+0.3) kết hợp phạt cảm xúc tiêu cực (Negative Sentiment Penalty nhân hệ số 0.6).
    - Quy định cụ thể thời gian hết hạn xử lý (SLA) cho từng phân nhóm: Hot Lead (30 phút), Warm Lead (24 giờ), Cold Lead (7 ngày).

---

## [Unreleased] - 2026-06-19

### Added / Updated / Fixed

- **Trang chủ (`/`)**:
  - Tái thiết kế Hero Section: thêm dashboard mini hiển thị trực quan (SVG/HTML) tích hợp glassmorphism và góc nghiêng 3D thay vì ảnh tĩnh.
  - Tích hợp hiệu ứng số nhảy đếm ngược KPI và Animation trượt/nổi bật mượt mà.
  - Nâng cấp phần Social Proof (`TrustedBySection`) sử dụng hiệu ứng Marquee tự động cuộn ngang mượt mà cho logo thương hiệu.
  - Cải thiện Navbar: Áp dụng hiệu ứng `backdrop-filter: blur(12px)`.
  - Sửa lỗi 2 Footer bị đè lên nhau (xóa `<Footer />` thừa ở `page.tsx`).
  - Sửa lỗi Hydration Mismatch ở SSR: Chuyển toàn bộ `@keyframes` animation vào `globals.css`.

- **Xác thực / Authentication (`/login`, `/register`)**:
  - Phóng to kích thước Logo chuyên nghiệp hơn (chiều cao ảnh lên 220px).
  - Khắc phục triệt để lỗi viền trắng quanh ảnh Logo bằng kĩ thuật CSS `mix-blend-multiply` trực tiếp trên thẻ `<img>`, loại bỏ cản trở từ `overflow-hidden`.
  - Căn chỉnh thẩm mỹ, giảm khoảng trống (margin) giữa Logo và Form.
  - Thay thế link ảnh preview bị hỏng ở cột trái trang đăng ký bằng ảnh Unsplash Dashboard mẫu nét và đẹp hơn.

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
- **Dashboard tổng quan (`/dashboard`)**:
  - Hoàn thiện trang Dashboard tổng quan với dashboard shell, bộ lọc theo thương hiệu, thời gian và nền tảng.
  - Thống kê số lượng mention, chỉ số Net Sentiment, số Hot Lead và số Alerts.
  - Biểu đồ xu hướng cảm xúc theo posted_at và biểu đồ tròn phân bố sentiment.
  - Top Sources theo nền tảng và Top Topics theo chủ đề, cập nhật dựa trên dữ liệu Firestore.
  - Tự động fetch/refresh dữ liệu Dashboard mỗi 60 giây từ Firestore.

---

## Tổng quan lịch sử phát triển

Dự án InsightFlow được phát triển theo hướng web app phục vụ bài toán **AI Media Monitoring / Brand Intelligence**. Lịch sử commit thể hiện quá trình đi từ khởi tạo repo, dựng cấu trúc thư mục, xây dựng giao diện Home/Auth/Dashboard, mở rộng sang các màn hình nghiệp vụ như Mentions, Alerts, Reports, sau đó bổ sung dữ liệu hiển thị, chỉnh phần phân tích AI và sửa lỗi build/deploy.

Các giai đoạn chính:

1. **Khởi tạo nền tảng dự án**: tạo repo, cấu trúc thư mục, tài liệu ban đầu và file cấu hình.
2. **Xây dựng giao diện cơ bản**: Home, Login/Logout, Dashboard.
3. **Mở rộng màn hình nghiệp vụ**: Mentions, Alerts, Reports và các phần điều hướng liên quan.
4. **Hoàn thiện responsive và xử lý merge**: hợp nhất code từ các nhánh thành viên, sửa xung đột, chỉnh layout.
5. **Đưa dữ liệu lên giao diện**: hiển thị dữ liệu ở Mentions và Dashboard.
6. **Hiệu chỉnh phân tích AI và sửa lỗi deploy**: cập nhật logic/hiển thị AI, sửa lỗi TypeScript, union type, field dữ liệu và lỗi Vercel.
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

## 2026-06-16 — Khởi tạo dự án, tài liệu, Home, Auth và Dashboard nền tảng

### Nhóm 1 — Khởi tạo repo và cấu trúc tài liệu

| Thứ tự | Commit    | Nội dung commit                                                      | Diễn giải chi tiết                                                                                                                                              | Phạm vi ảnh hưởng |
| -----: | --------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
|     01 | `da6fe71` | `first commit`                                                       | Tạo commit đầu tiên cho repo InsightFlow. Đây là mốc bắt đầu lịch sử phát triển của dự án trên GitHub.                                                          | Repository        |
|     02 | `9b59a81` | `feat: initialize project directory structure and placeholder files` | Khởi tạo cấu trúc thư mục ban đầu và các file placeholder. Commit này giúp repo có bộ khung để tách tài liệu, source code app web và các phần cấu hình sau này. | Project structure |
|     03 | `9d846cd` | `Xóa các file thừa`                                                  | Dọn bớt file không cần thiết sau giai đoạn khởi tạo, giúp repo gọn hơn và tránh giữ lại các file mẫu không phục vụ sản phẩm.                                    | Cleanup           |
|     04 | `ca021e0` | `add CHANGELOG.md`                                                   | Thêm file changelog để bắt đầu ghi nhận lịch sử thay đổi của dự án.                                                                                             | Documentation     |
|     05 | `8d7ecec` | `add CHANGELOG.md`                                                   | Tiếp tục cập nhật/bổ sung changelog. Có thể là chỉnh sửa nội dung hoặc đưa file changelog vào đúng vị trí tài liệu.                                             | Documentation     |

#### Kết quả đạt được

- Repo đã có điểm khởi đầu rõ ràng.
- Cấu trúc thư mục cơ bản được tạo để phục vụ phát triển tiếp theo.
- Bắt đầu có tài liệu changelog trong thư mục docs.
- Dự án chuyển từ trạng thái rỗng sang có bộ khung phát triển.

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

### Nhóm 2 — Xây dựng trang Home

| Thứ tự | Commit    | Nội dung commit         | Diễn giải chi tiết                                                                                                                                    | Phạm vi ảnh hưởng |
| -----: | --------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
|     06 | `28c7339` | `build layout "home"`   | Xây dựng layout trang chủ. Đây là màn hình đầu tiên giúp người dùng hiểu sản phẩm InsightFlow, đóng vai trò landing page hoặc entry page của web app. | Home UI           |
|     07 | `8d1cf63` | `fix bug layout "home"` | Sửa lỗi layout Home sau khi dựng bản đầu tiên. Commit này giúp giao diện Home ổn định hơn về bố cục, khoảng cách hoặc hiển thị.                       | Home UI / Fix     |

#### Kết quả đạt được

- Có trang Home làm điểm vào cho sản phẩm.
- Layout Home được chỉnh lỗi sau bản dựng đầu tiên.
- Giai đoạn này tập trung vào phần nhìn và trải nghiệm đầu tiên của người dùng.

---

### Nhóm 3 — Login, Logout và session

| Thứ tự | Commit    | Nội dung commit                                    | Diễn giải chi tiết                                                                                                                      | Phạm vi ảnh hưởng   |
| -----: | --------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
|     08 | `ce7cd89` | `login, log out`                                   | Bổ sung luồng đăng nhập và đăng xuất. Đây là nền tảng để phân biệt người dùng đã xác thực và người dùng chưa xác thực.                  | Auth                |
|     09 | `30196a8` | `gitignore`                                        | Cập nhật `.gitignore` để loại trừ file không nên đưa lên repo, ví dụ file môi trường, build output hoặc dependency local.               | Repo config         |
|     10 | `c677e96` | `đẩy code lên`                                     | Đẩy thêm phần code đang phát triển lên repo. Message không mô tả chi tiết nên chỉ ghi nhận là cập nhật chung trong giai đoạn Auth/Home. | General update      |
|     11 | `6872c0f` | `Merge branch 'Tan-home' into minh-login`          | Gộp nhánh Home vào nhánh Login. Điều này cho thấy phần giao diện trang chủ và phần đăng nhập được tích hợp để chuẩn bị merge vào main.  | Merge / Home + Auth |
|     12 | `0a1d56c` | `Merge pull request #1 from TXHoai2309/minh-login` | Merge pull request từ nhánh `minh-login` vào main. Đây là mốc đưa phần login/logout vào nhánh chính.                                    | Merge / Auth        |
|     13 | `80f347f` | `fix xung dot`                                     | Sửa xung đột sau quá trình merge. Commit này giúp code từ các nhánh không ghi đè hoặc phá vỡ nhau.                                      | Merge conflict fix  |
|     14 | `7929856` | `đăng suất session`                                | Hoàn thiện/sửa phần session khi đăng xuất. Nội dung commit cho thấy có xử lý trạng thái phiên đăng nhập sau khi user logout.            | Auth session        |

#### Kết quả đạt được

- Web app bắt đầu có luồng đăng nhập/đăng xuất.
- Code Home và Auth được hợp nhất.
- Có xử lý session logout, giảm khả năng người dùng vẫn giữ trạng thái đăng nhập sai sau khi thoát.
- Xung đột merge được xử lý để main ổn định hơn.

---

### Nhóm 4 — Dashboard bản đầu

| Thứ tự | Commit    | Nội dung commit             | Diễn giải chi tiết                                                                                                                                                      | Phạm vi ảnh hưởng |
| -----: | --------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
|     15 | `7f2050e` | `build giao dien Dashboard` | Xây dựng giao diện Dashboard. Đây là màn hình trung tâm để hiển thị số liệu tổng quan của InsightFlow như mentions, sentiment, alert hoặc chỉ số phân tích thương hiệu. | Dashboard UI      |

#### Kết quả đạt được

- Dashboard được tạo ở mức giao diện.
- Dự án bắt đầu có màn hình nghiệp vụ chính thay vì chỉ có Home/Auth.
- Đây là nền tảng để các commit sau đưa dữ liệu thật/mock data lên Dashboard.

---

## 2026-06-17 đến 2026-06-18 — Mở rộng UI nghiệp vụ, Mentions, Alerts, Reports, responsive và deploy

### Nhóm 5 — Merge Dashboard và cập nhật tài liệu

| Thứ tự | Commit    | Nội dung commit                                       | Diễn giải chi tiết                                                                                                                                                     | Phạm vi ảnh hưởng |
| -----: | --------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
|     16 | `f30c3ee` | `Merge pull request #2 from TXHoai2309/Tan-dashboard` | Merge pull request đưa phần Dashboard từ nhánh `Tan-dashboard` vào main. Đây là mốc xác nhận Dashboard trở thành một phần chính thức của nhánh chính.                  | Merge / Dashboard |
|     17 | `052225c` | `update Changelog`                                    | Cập nhật changelog sau khi có thêm các thay đổi về Dashboard hoặc tài liệu.                                                                                            | Documentation     |
|     18 | `a0e9122` | `update`                                              | Commit cập nhật chung. Message không mô tả chi tiết nên chỉ ghi nhận là thay đổi nhỏ/bổ sung trong giai đoạn Dashboard.                                                | General update    |
|     19 | `64ae830` | `Merge branch 'Tan-dashboard'`                        | Tiếp tục merge nhánh Dashboard. Commit này phản ánh việc đồng bộ code Dashboard giữa các nhánh.                                                                        | Merge / Dashboard |
|     20 | `0cc17f9` | `Initial commit`                                      | Commit có message “Initial commit” trong nhánh đang merge. Vì không phải commit đầu tiên của toàn repo, ghi nhận đây là mốc khởi tạo/phần nền của một nhánh chức năng. | Branch update     |
|     21 | `f3bfc83` | `oke`                                                 | Commit cập nhật chung, message không đủ chi tiết để xác định thay đổi cụ thể.                                                                                          | General update    |

#### Kết quả đạt được

- Dashboard được đưa vào main qua PR/merge.
- Tài liệu changelog tiếp tục được cập nhật.
- Một số commit trung gian giúp đồng bộ code giữa các nhánh thành viên.

---

### Nhóm 6 — Mentions: tạo layout và hoàn thiện giao diện

| Thứ tự | Commit    | Nội dung commit                      | Diễn giải chi tiết                                                                                                                                     | Phạm vi ảnh hưởng  |
| -----: | --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
|     22 | `0df2eff` | `build layout Mentions`              | Xây dựng layout trang Mentions. Đây là màn hình dùng để xem danh sách bài viết/đề cập liên quan đến thương hiệu.                                       | Mentions UI        |
|     23 | `7c57634` | `hoàn thiện`                         | Hoàn thiện thêm phần đang phát triển sau layout Mentions. Message không nêu rõ chi tiết nên ghi nhận là hoàn thiện giao diện/chức năng liên quan.      | Mentions / General |
|     24 | `6471528` | `a`                                  | Commit cập nhật rất ngắn, không đủ dữ liệu để diễn giải cụ thể. Ghi nhận là cập nhật nhỏ trong luồng phát triển Mentions/Auth.                         | General update     |
|     25 | `b1b3f06` | `Merge branch 'TXH' into minh-login` | Merge nhánh `TXH` vào `minh-login`, đồng bộ code giữa phần chức năng của TXH và luồng login.                                                           | Merge              |
|     26 | `87cef3e` | `Merge branch 'TXH' into ThuHaTest`  | Merge nhánh `TXH` vào `ThuHaTest`, tiếp tục đồng bộ code giữa các nhánh phát triển.                                                                    | Merge              |
|     27 | `820fade` | `fix`                                | Commit sửa lỗi. Message không nêu rõ lỗi nên chỉ ghi nhận là fix chung trong giai đoạn merge/phát triển Mentions.                                      | Fix                |
|     28 | `7ad391a` | `update layout Mentions`             | Cập nhật layout Mentions sau bản dựng đầu tiên. Có thể liên quan đến bố cục, spacing, card, bảng, filter hoặc cách hiển thị danh sách.                 | Mentions UI        |
|     29 | `7b37080` | `fix`                                | Sửa lỗi sau khi cập nhật Mentions. Message không đủ chi tiết để xác định lỗi cụ thể.                                                                   | Fix                |
|     30 | `0d4a0dd` | `add layout function button`         | Thêm layout cho các nút chức năng. Nhiều khả năng liên quan đến các action trên giao diện như lọc, xem chi tiết, thao tác với dữ liệu hoặc điều hướng. | UI actions         |

#### Kết quả đạt được

- Trang Mentions được tạo layout.
- Layout Mentions được cập nhật sau vòng đầu.
- Có thêm bố cục cho các nút chức năng, giúp màn hình có hành động rõ hơn thay vì chỉ hiển thị tĩnh.
- Các nhánh thành viên được merge nhiều lần để đồng bộ code.

---

### Nhóm 7 — Alerts và Reports

| Thứ tự | Commit    | Nội dung commit       | Diễn giải chi tiết                                                                                                             | Phạm vi ảnh hưởng  |
| -----: | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
|     31 | `26f4bc8` | `build layout Alerts` | Xây dựng layout trang Alerts. Đây là màn hình phục vụ việc hiển thị cảnh báo/rủi ro truyền thông hoặc các tín hiệu cần chú ý.  | Alerts UI          |
|     32 | `a6eda63` | `report`              | Bổ sung hoặc cập nhật phần Reports. Đây là bước mở rộng sản phẩm từ theo dõi dữ liệu sang tổng hợp báo cáo.                    | Reports UI         |
|     33 | `93fdd0c` | `done`                | Commit hoàn thiện chung sau khi làm Alerts/Reports. Message không đủ chi tiết nên ghi nhận là hoàn thiện phần đang phát triển. | General completion |

#### Kết quả đạt được

- Có thêm màn hình Alerts để phục vụ cảnh báo.
- Có thêm phần Reports để phục vụ báo cáo/tổng hợp.
- Sản phẩm bắt đầu đủ bộ màn hình nghiệp vụ cơ bản: Dashboard, Mentions, Alerts, Reports.

---

### Nhóm 8 — Merge, fix và responsive

| Thứ tự | Commit    | Nội dung commit                                    | Diễn giải chi tiết                                                                                                                                       | Phạm vi ảnh hưởng  |
| -----: | --------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
|     34 | `12786e9` | `merge code cuar Tan`                              | Merge code của thành viên Tân vào nhánh đang phát triển. Message cho thấy đây là bước hợp nhất phần Dashboard/UI do Tân phụ trách.                       | Merge              |
|     35 | `863ddb2` | `fix`                                              | Sửa lỗi chung sau quá trình merge/cập nhật giao diện. Không đủ dữ liệu để kết luận lỗi cụ thể.                                                           | Fix                |
|     36 | `679d2be` | `responsive`                                       | Cập nhật responsive để giao diện hiển thị tốt hơn trên nhiều kích thước màn hình. Đây là bước quan trọng để app dùng được trên desktop và mobile/tablet. | Responsive UI      |
|     37 | `8617b75` | `Merge branch 'minh-login' into ThuHaTest`         | Merge nhánh login vào `ThuHaTest`, đồng bộ phần auth/session với các màn hình giao diện khác.                                                            | Merge / Auth       |
|     38 | `6f514ac` | `Merge pull request #3 from TXHoai2309/minh-login` | Merge PR từ nhánh `minh-login` vào main. Đây là mốc đưa các cập nhật login/session mới nhất vào nhánh chính.                                             | Merge / Auth       |
|     39 | `59a5dfb` | `Hoài sửa lỗi vercel`                              | Sửa lỗi build/deploy trên Vercel. Commit này giúp dự án có khả năng build/deploy ổn định hơn sau khi tích hợp nhiều màn hình và TypeScript.              | Deploy / Build fix |

#### Kết quả đạt được

- Code từ các nhánh thành viên được hợp nhất.
- Giao diện được chỉnh responsive.
- Login/session được merge lại vào main.
- Lỗi Vercel được xử lý để phục vụ deploy/demo.

---

## 2026-06-19 — Đưa dữ liệu lên giao diện, hiệu chỉnh AI, sửa type/data và merge hoàn thiện

### Nhóm 9 — Dọn file mẫu và đưa dữ liệu lên Mentions

| Thứ tự | Commit    | Nội dung commit                  | Diễn giải chi tiết                                                                                                               | Phạm vi ảnh hưởng   |
| -----: | --------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
|     40 | `91ebd85` | `Delete file html giao diện mẫu` | Xóa file HTML giao diện mẫu không còn dùng. Điều này giúp repo tránh lẫn giữa prototype tĩnh và code app chính thức.             | Cleanup             |
|     41 | `f0ca5f3` | `đẩy dữ liệu lên mention`        | Đưa dữ liệu lên trang Mentions. Đây là bước chuyển Mentions từ layout tĩnh sang màn hình có dữ liệu hiển thị.                    | Mentions data       |
|     42 | `99095b2` | `update information`             | Cập nhật phần thông tin/information. Có thể liên quan đến nội dung giới thiệu, trang thông tin hoặc metadata hiển thị trong app. | Information content |

#### Kết quả đạt được

- Loại bỏ file mẫu không còn cần thiết.
- Mentions bắt đầu có dữ liệu hiển thị thay vì chỉ có layout.
- Nội dung information được cập nhật để sản phẩm đầy đủ hơn.

---

### Nhóm 10 — Hiệu chỉnh phân tích AI và dữ liệu Dashboard

| Thứ tự | Commit    | Nội dung commit                              | Diễn giải chi tiết                                                                                                                                                                                   | Phạm vi ảnh hưởng            |
| -----: | --------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
|     43 | `d829027` | `Hiệu chỉnh phân tích AI`                    | Cập nhật phần phân tích AI. Trong phạm vi repo hiện tại, ghi nhận đây là hiệu chỉnh logic/hiển thị AI ở frontend hoặc dữ liệu phân tích, chưa kết luận là đã có backend/model production hoàn chỉnh. | AI analysis                  |
|     44 | `a3c1cfa` | `add data tren trang dashboard`              | Đưa dữ liệu lên Dashboard. Đây là bước giúp Dashboard hiển thị chỉ số cụ thể thay vì chỉ là giao diện tĩnh.                                                                                          | Dashboard data               |
|     45 | `73b9030` | `Merge branch 'minh-mention' into dashboard` | Merge nhánh Mentions vào Dashboard, đồng bộ phần dữ liệu/logic Mentions với màn hình Dashboard.                                                                                                      | Merge / Dashboard + Mentions |
|     46 | `ed6c744` | `Merge branch 'dashboard'`                   | Merge nhánh Dashboard, đưa các cập nhật dữ liệu/giao diện Dashboard vào nhánh chính hoặc nhánh tích hợp.                                                                                             | Merge / Dashboard            |

#### Kết quả đạt được

- Phần phân tích AI được hiệu chỉnh ở mức app hiện tại.
- Dashboard bắt đầu hiển thị dữ liệu.
- Mentions và Dashboard được đồng bộ thông qua merge.
- Sản phẩm tiến gần hơn tới bản demo có dữ liệu thật/mock-data thay vì chỉ UI tĩnh.

---

### Nhóm 11 — Sửa lỗi type, field dữ liệu và merge các nhánh cuối

| Thứ tự | Commit    | Nội dung commit                                                                              | Diễn giải chi tiết                                                                                                                                                                                                                                                       | Phạm vi ảnh hưởng               |
| -----: | --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
|     47 | `1259ca0` | `Sửa lỗi marketting không có trong union type topic, poster_at bị thiếu trong 8 mack object` | Sửa lỗi TypeScript liên quan đến topic `marketting` không có trong union type `topic`. Đồng thời bổ sung field thời gian `poster_at`/`posted_at` bị thiếu trong 8 mock object. Đây là lỗi quan trọng vì có thể làm build thất bại hoặc dữ liệu hiển thị thiếu thông tin. | TypeScript / Data model / Build |
|     48 | `624edd0` | `Merge branch 'main' into ha-information`                                                    | Merge main vào nhánh `ha-information` để cập nhật nhánh information theo trạng thái mới nhất của main.                                                                                                                                                                   | Merge                           |
|     49 | `94f27fa` | `Merge branch 'ThuHaTest'`                                                                   | Merge nhánh `ThuHaTest`, đưa các cập nhật đã test hoặc giao diện liên quan vào nhánh tích hợp.                                                                                                                                                                           | Merge                           |
|     50 | `b577dbc` | `Merge branch 'ha-information'`                                                              | Merge nhánh `ha-information`, hoàn tất việc đưa phần information vào main. Đây là commit mới nhất trong chuỗi changelog hiện tại.                                                                                                                                        | Merge / Information             |

#### Kết quả đạt được

- Sửa lỗi type `topic`, tránh sai lệch giữa dữ liệu và kiểu dữ liệu trong code.
- Bổ sung field thời gian bị thiếu trong mock object, giúp dữ liệu mention/dashboard nhất quán hơn.
- Các nhánh `ha-information`, `ThuHaTest`, `dashboard`, `minh-mention` được hợp nhất dần về main.
- Main đạt trạng thái mới nhất với các phần Home, Auth, Dashboard, Mentions, Alerts, Reports, Information và dữ liệu hiển thị.

---

## Tổng hợp thay đổi theo module

### 1. Documentation

**Added**

- Thêm `CHANGELOG.md`.
- Bổ sung bộ tài liệu trong thư mục `docs`.
- Ghi nhận lịch sử thay đổi theo từng commit.

**Changed**

- Cập nhật changelog nhiều lần trong quá trình phát triển.
- Điều chỉnh tài liệu để phản ánh đúng tiến độ thực tế của repo.

---

### 2. Project Structure

**Added**

- Khởi tạo cấu trúc thư mục dự án.
- Tạo các file placeholder phục vụ phát triển ban đầu.
- Tách app web và tài liệu thành các khu vực riêng.

**Changed**

- Dọn file thừa sau giai đoạn khởi tạo.
- Cập nhật `.gitignore` để tránh commit các file không cần thiết.

---

### 3. Home / Landing Page

**Added**

- Xây dựng layout Home.
- Tạo điểm vào ban đầu cho người dùng khi truy cập web app.

**Fixed**

- Sửa bug layout Home sau bản dựng đầu.

---

### 4. Auth / Login / Logout

**Added**

- Bổ sung luồng login/logout.
- Có xử lý đăng xuất theo session.

**Changed**

- Merge Auth với Home và các nhánh giao diện khác.
- Đồng bộ luồng login vào main qua pull request.

**Fixed**

- Sửa xung đột merge liên quan đến Auth/Home.
- Sửa/hoàn thiện session logout.

---

### 5. Dashboard

**Added**

- Xây dựng giao diện Dashboard.
- Đưa dữ liệu lên Dashboard ở giai đoạn sau.

**Changed**

- Dashboard được merge nhiều lần từ nhánh chức năng vào main.
- Dashboard được đồng bộ với dữ liệu/logic từ Mentions.

**Result**

- Dashboard chuyển từ layout tĩnh sang màn hình có dữ liệu hiển thị.

---

### 6. Mentions

**Added**

- Xây dựng layout Mentions.
- Thêm dữ liệu hiển thị trên Mentions.
- Bổ sung layout cho các nút chức năng.

**Changed**

- Cập nhật layout Mentions sau bản đầu.
- Merge Mentions vào Dashboard để đồng bộ dữ liệu/luồng hiển thị.

**Fixed**

- Có các commit fix sau khi cập nhật layout Mentions, tuy nhiên message không mô tả chi tiết lỗi.

---

### 7. Alerts

**Added**

- Xây dựng layout Alerts.
- Mở rộng sản phẩm sang phần cảnh báo/rủi ro truyền thông.

**Result**

- InsightFlow có thêm màn hình phục vụ phát hiện và theo dõi cảnh báo.

---

### 8. Reports

**Added**

- Bổ sung/cập nhật phần Reports.
- Mở rộng sản phẩm từ theo dõi mention sang tổng hợp báo cáo.

**Result**

- Sản phẩm có thêm màn hình phục vụ báo cáo, phù hợp với bài toán media monitoring.

---

### 9. Information / Static Content

**Added / Changed**

- Cập nhật phần information.
- Merge nhánh `ha-information` vào main ở cuối lịch sử commit.

**Result**

- Nội dung giới thiệu/thông tin sản phẩm được bổ sung vào app.

---

### 10. AI Analysis

**Changed**

- Hiệu chỉnh phần phân tích AI.

**Note**

- Changelog chỉ ghi nhận đây là hiệu chỉnh AI trong phạm vi repo hiện tại. Không mô tả như hệ thống AI production hoàn chỉnh nếu chưa có commit/code thể hiện rõ backend/model training/deployment.

---

### 11. Responsive UI

**Changed**

- Cập nhật responsive cho giao diện.

**Result**

- App có khả năng hiển thị tốt hơn trên nhiều kích thước màn hình, hỗ trợ demo và trải nghiệm thực tế tốt hơn.

---

### 12. Build / Deploy / TypeScript

**Fixed**

- Sửa lỗi Vercel/build.
- Sửa lỗi union type `topic` khi dữ liệu có topic `marketting` nhưng type chưa khai báo.
- Sửa lỗi thiếu field thời gian trong 8 mock object.

**Result**

- Giảm lỗi khi build/deploy.
- Dữ liệu hiển thị nhất quán hơn với type trong code.
- Hạn chế lỗi runtime/build do thiếu field hoặc sai type.

---

## Tổng hợp theo loại thay đổi

### Added

- Cấu trúc repo InsightFlow.
- File changelog và tài liệu dự án.
- Layout Home.
- Login/logout.
- Dashboard UI.
- Mentions UI.
- Layout nút chức năng trên giao diện.
- Alerts UI.
- Reports UI.
- Dữ liệu hiển thị trên Mentions.
- Dữ liệu hiển thị trên Dashboard.
- Phần information/static content.

### Changed

- Cập nhật layout Home.
- Cập nhật layout Mentions.
- Cập nhật responsive.
- Cập nhật changelog.
- Hiệu chỉnh phần phân tích AI.
- Đồng bộ code giữa nhiều nhánh: `Tan-home`, `minh-login`, `Tan-dashboard`, `TXH`, `ThuHaTest`, `minh-mention`, `dashboard`, `ha-information`.

### Fixed

- Sửa bug layout Home.
- Sửa xung đột merge.
- Sửa session logout.
- Sửa lỗi sau các lần merge/cập nhật layout.
- Sửa lỗi Vercel/build.
- Sửa lỗi topic `marketting` không nằm trong union type.
- Sửa lỗi thiếu field thời gian trong mock object.
- Xóa file HTML giao diện mẫu không còn dùng.

---

## Trạng thái hiện tại sau commit mới nhất

Sau commit `b577dbc`, repo đã có nền tảng web app với các phần chính:

- Home / Landing page.
- Auth route cho đăng nhập/đăng xuất.
- Dashboard hiển thị dữ liệu.
- Mentions hiển thị dữ liệu đề cập.
- Alerts phục vụ cảnh báo.
- Reports phục vụ báo cáo.
- Các route phụ như Leads, Profile, Settings Brand, Ngành, Về chúng tôi ở mức app hiện tại.
- Tài liệu dự án trong thư mục `docs`.
- Cấu hình frontend sử dụng Next.js, React, Firebase, Chart.js/Recharts, Zustand và TailwindCSS.

---

## Ghi chú cho báo cáo/demo

Khi đưa vào báo cáo sprint hoặc demo, có thể gom các commit thành 5 mốc dễ trình bày hơn:

1. **Mốc 1 — Khởi tạo dự án**: tạo repo, cấu trúc thư mục, docs, changelog.
2. **Mốc 2 — Xây dựng UI nền tảng**: Home, Login/Logout, Dashboard.
3. **Mốc 3 — Mở rộng nghiệp vụ**: Mentions, Alerts, Reports, function buttons, responsive.
4. **Mốc 4 — Gắn dữ liệu và AI**: đưa dữ liệu lên Mentions/Dashboard, hiệu chỉnh phân tích AI.
5. **Mốc 5 — Ổn định demo/deploy**: sửa Vercel, sửa TypeScript, sửa field dữ liệu, merge các nhánh cuối.

File changelog trong repo nên giữ chi tiết commit như trên để truy vết; còn khi thuyết trình có thể dùng bản gom nhóm để dễ hiểu hơn.
