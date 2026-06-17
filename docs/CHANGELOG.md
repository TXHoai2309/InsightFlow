# Changelog

Tất cả các thay đổi đáng chú ý đối với dự án này sẽ được ghi lại trong file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Ghi chú: phần sau đây phản ánh các thay đổi đã được thực hiện trong workspace tính đến thời điểm hiện tại (triển khai Dashboard, thành phần giao diện, cấu hình build và sửa lỗi Chart.js). Các mục bên dưới mô tả các file và thay đổi kỹ thuật đã thêm/sửa.

### Added / Updated (Unreleased)

- Thêm **Trang Dashboard (US-13)** hoàn chỉnh dưới đường dẫn `apps/web/src/app/dashboard/page.tsx` và các component liên quan:
  - `apps/web/src/components/dashboard/Dashboard.tsx` (thành phần chính)
  - `StatCard.tsx`, `SentimentTrend.tsx`, `SentimentDonut.tsx`, `TopSources.tsx`, `TopTopics.tsx`, `DashboardFilters.tsx`, `index.ts`
- Thêm `apps/web/src/types/dashboard.ts` (định nghĩa TypeScript cho Mention, DashboardStats, Filters, v.v.)
- Thêm `apps/web/src/stores/dashboard.store.ts` (Zustand store với logic filter và computed getters)
- Thêm `apps/web/src/hooks/useDashboardData.ts` (hook lấy dữ liệu với mock generators và refetch định kỳ)
- Thêm layout và điều hướng chính:
  - `apps/web/src/components/layout/Sidebar.tsx`
  - `apps/web/src/components/layout/Header.tsx`
  - Cập nhật `apps/web/src/app/layout.tsx` để tích hợp Sidebar + Header
- Cập nhật `apps/web/src/app/page.tsx` để redirect root → `/dashboard`
- Cập nhật CSS hệ thống và design tokens:
  - `apps/web/src/app/globals.css` (glass-card, tokens, scrollbar)
  - `apps/web/tailwind.config.ts` (màu chủ đạo: `#4648d4`, spacing, font sizes)
- Thêm dependencies charting và tích hợp Chart.js:
  - Cài `chart.js` và `react-chartjs-2`
  - Sửa lỗi runtime Chart.js bằng cách đăng ký rõ ràng các component/controller (ví dụ `CategoryScale`, `LinearScale`, `LineController`, `ArcElement`/`DoughnutController`, `Tooltip`, `Legend`) trong các file `SentimentTrend.tsx` và `SentimentDonut.tsx` để tránh lỗi: "linear is not a registered scale" và "doughnut is not a registered controller".
- Sửa lỗi canvas reuse: đảm bảo `chart.destroy()` trước khi khởi tạo lại chart để tránh lỗi "Canvas is already in use".
- Build production kiểm tra: `npm run build` thành công (tuyến build đã verified trên môi trường dev local của tác giả).

### Notes / Next steps

- Các biểu đồ hiện dùng mock data trong `useDashboardData.ts` — cần thay bằng API thật khi backend có endpoint `/api/dashboard/stats`.
- Tiếp tục thực hiện: US-14 (Mentions page, phân trang + relabel), US-15 (Leads), US-16 (Alerts), US-17 (Reports), Settings, và tích hợp WebSocket/Realtime.

---

Những thay đổi chi tiết cho từng file đã được commit trong workspace; vui lòng xem mã nguồn tại các đường dẫn nêu trên để kiểm tra chi tiết implement và tích hợp tiếp theo.

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
