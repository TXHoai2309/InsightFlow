export type TourAction =
  | { type: "click"; selector: string; waitFor?: string }
  | { type: "navigate"; href: string; waitFor?: string }
  | { type: "waitFor"; selector: string }
  | { type: "input"; selector: string; value?: string }
  | { type: "custom"; eventName: string };

export type TourStep = {
  id: string;
  target: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  allowInteraction?: boolean;
  action?: TourAction;
  nextLabel?: string;
  previousLabel?: string;
  skipLabel?: string;
  completeLabel?: string;
};

export type RouteTourConfig = {
  routeKey: string;
  version: number;
  title?: string;
  steps: TourStep[];
  nextRoute?: {
    label: string;
    href: string;
  };
};

export const ROUTE_TOUR_CONFIGS: Record<string, RouteTourConfig> = {
  "/dashboard": {
    routeKey: "/dashboard",
    version: 10,
    title: "Hướng dẫn trang Tổng quan",
    nextRoute: {
      label: "Chuyển sang Crisis Monitoring",
      href: "/dashboard/insights",
    },
    steps: [
      {
        id: "overview_health",
        target: '[data-tour="dashboard-health-score"]',
        title: "1. Sức khỏe thương hiệu",
        body: "Điểm số tóm tắt sức khỏe thương hiệu dựa trên thảo luận tích cực, tiêu cực và tín hiệu rủi ro trong kỳ.",
        placement: "bottom",
      },
      {
        id: "overview_sentiment",
        target: '[data-tour="dashboard-sentiment"]',
        title: "2. Tỷ lệ cảm xúc",
        body: "Xem nhanh tỷ lệ tích cực, trung lập và tiêu cực để nắm bắt xu hướng dư luận.",
        placement: "bottom",
      },
      {
        id: "overview_ai_insight",
        target: '[data-tour="dashboard-ai-insight"]',
        title: "3. Phân tích AI",
        body: "AI tóm tắt các rủi ro nổi bật và gợi ý hướng xử lý trong ngày cho thương hiệu.",
        placement: "top",
      },
      {
        id: "overview_crisis_tab",
        target: '[data-tour="dashboard-tab-crisis"]',
        title: "4. Chuyển sang Crisis Monitoring",
        body: "Bấm vào tab Crisis Monitoring để xem chi tiết các chủ đề rủi ro cần ưu tiên.",
        placement: "bottom",
      },
    ],
  },
  "/dashboard/insights": {
    routeKey: "/dashboard/insights",
    version: 2,
    title: "Hướng dẫn Crisis Monitoring",
    nextRoute: {
      label: "Chuyển sang Lead Monitoring",
      href: "/dashboard/lead-monitoring",
    },
    steps: [
      {
        id: "crisis_list",
        target: '[data-tour="crisis-summary"]',
        title: "1. Danh sách rủi ro",
        body: "Tổng hợp các thảo luận tiêu cực có nguy cơ bùng phát thành khủng hoảng.",
        placement: "bottom",
      },
      {
        id: "crisis_filter",
        target: '[data-tour="crisis-trend"]',
        title: "2. Phân tích xu hướng",
        body: "Theo dõi biểu đồ gia tăng thảo luận tiêu cực theo thời gian.",
        placement: "bottom",
      },
      {
        id: "crisis_selected",
        target: '[data-tour="crisis-topics"]',
        title: "3. Chủ đề rủi ro",
        body: "Nhóm nguyên nhân đang tác động nhiều nhất đến uy tín thương hiệu.",
        placement: "top",
      },
      {
        id: "crisis_detail",
        target: '[data-tour="crisis-action-link"]',
        title: "4. Danh sách sự vụ chi tiết",
        body: "Đọc nội dung bài viết gốc, lịch sử thảo luận và điểm rủi ro do AI tính toán.",
        placement: "top",
      },
      {
        id: "crisis_lead_tab",
        target: '[data-tour="dashboard-tab-lead"]',
        title: "5. Chuyển sang Lead Monitoring",
        body: "Bấm vào tab Lead Monitoring để theo dõi các cơ hội khách hàng tiềm năng.",
        placement: "bottom",
      },
    ],
  },
  "/dashboard/lead-monitoring": {
    routeKey: "/dashboard/lead-monitoring",
    version: 2,
    title: "Hướng dẫn Lead Monitoring",
    nextRoute: {
      label: "Chuyển sang Quản lý Nhân viên",
      href: "/team",
    },
    steps: [
      {
        id: "lead_list",
        target: '[data-tour="lead-list"]',
        title: "1. Danh sách Lead",
        body: "Tự động phát hiện các thảo luận có ý định mua hàng hoặc cần tư vấn sản phẩm.",
        placement: "right",
      },
      {
        id: "lead_score",
        target: '[data-tour="lead-score"]',
        title: "2. Điểm Lead & Intent",
        body: "Phân loại mức độ độ nóng: Hot (chốt ngay), Warm (cần tư vấn) và Cold (tìm hiểu).",
        placement: "top",
      },
      {
        id: "lead_detail",
        target: '[data-tour="lead-list"]',
        title: "3. Chọn một Lead",
        body: "Xem thông tin người đăng, số điện thoại/email (nếu có) và kênh tiếp cận.",
        placement: "top",
      },
      {
        id: "lead_open_source",
        target: '[data-tour="lead-open-source"]',
        title: "4. Mở nguồn & Sao chép mẫu",
        body: "Bấm mở bài viết gốc trong cửa sổ nhỏ và sao chép câu chào tư vấn mẫu.",
        placement: "bottom",
      },
      {
        id: "lead_nav_team",
        target: '[data-tour="nav-team"]',
        title: "5. Chuyển sang trang Nhân viên",
        body: "Chuyển sang trang Quản lý Đội ngũ để kiểm tra nhân sự phụ trách.",
        placement: "right",
      },
    ],
  },
  "/team": {
    routeKey: "/team",
    version: 2,
    title: "Hướng dẫn Quản lý Nhân viên",
    nextRoute: {
      label: "Chuyển sang Xử lý Cảnh báo",
      href: "/alerts",
    },
    steps: [
      {
        id: "team_list",
        target: '[data-tour="team-list"]',
        title: "1. Danh sách nhân viên",
        body: "Quản lý toàn bộ nhân viên tham gia workspace kèm vai trò và trạng thái.",
        placement: "top",
      },
      {
        id: "team_create",
        target: '[data-tour="team-create-button"]',
        title: "2. Thêm nhân viên mới",
        body: "Bấm nút này để mời thành viên mới và cấp quyền truy cập phù hợp.",
        placement: "bottom",
      },
      {
        id: "team_roles",
        target: '[data-tour="team-role-permissions"]',
        title: "3. Vai trò & Phân quyền",
        body: "Gán quyền xử lý Cảnh báo (Crisis), xử lý Lead hoặc Quản lý thương hiệu.",
        placement: "bottom",
      },
      {
        id: "team_status",
        target: '[data-tour="team-status"]',
        title: "4. Trạng thái tài khoản",
        body: "Theo dõi nhân viên đang hoạt động, tạm khóa hoặc chưa kích hoạt.",
        placement: "top",
      },
      {
        id: "team_nav_alerts",
        target: '[data-tour="nav-alerts"]',
        title: "5. Chuyển sang Cảnh báo",
        body: "Bấm vào mục Cảnh báo ở sidebar để bắt đầu quy trình xử lý rủi ro.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="nav-alerts"]' },
      },
    ],
  },
  "/alerts": {
    routeKey: "/alerts",
    version: 2,
    title: "Hướng dẫn tương tác xử lý Cảnh báo",
    nextRoute: {
      label: "Chuyển sang Quản lý Khách hàng",
      href: "/leads",
    },
    steps: [
      {
        id: "alerts_list",
        target: '[data-tour="alert-list"]',
        title: "1. Danh sách cảnh báo",
        body: "Tất cả đề cập tiêu cực và rủi ro được gom vào hàng đợi ưu tiên theo SLA.",
        placement: "right",
      },
      {
        id: "alerts_select",
        target: '[data-tour="alert-list-first-item"]',
        title: "2. Chọn một cảnh báo",
        body: "Bấm chọn cảnh báo đầu tiên để xem nội dung chi tiết.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="alert-list-first-item"]' },
      },
      {
        id: "alerts_claim",
        target: '[data-tour="alert-claim-btn"]',
        title: "3. Nhận xử lý",
        body: "Bấm nút 'Nhận xử lý' để khóa cảnh báo cho tài khoản của bạn.",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="alert-claim-btn"]' },
      },
      {
        id: "alerts_copy_template",
        target: '[data-tour="alert-copy-template-btn"]',
        title: "4. Mở nguồn & Sao chép mẫu",
        body: "Bấm nút 'Mở nguồn & sao chép' để mở nguồn bài viết gốc và tự động sao chép tin nhắn mẫu.",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="alert-copy-template-btn"]' },
      },
      {
        id: "alerts_note",
        target: '[data-tour="alert-note-input"]',
        title: "5. Ghi chú xử lý",
        body: "Nhập tóm tắt kết quả trao đổi với khách hàng vào ô ghi chú.",
        placement: "top",
        allowInteraction: true,
      },
      {
        id: "alerts_result",
        target: '[data-tour="alert-result-dropdown"]',
        title: "6. Kết quả phản hồi",
        body: "Chọn kết quả tương tác từ danh sách thả xuống.",
        placement: "top",
      },
      {
        id: "alerts_complete",
        target: '[data-tour="alert-complete-btn"]',
        title: "7. Hoàn tất xử lý",
        body: "Bấm nút hoàn tất để ghi nhận kết quả và đóng vụ việc.",
        placement: "top",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="alert-complete-btn"]' },
      },
      {
        id: "alerts_nav_customers",
        target: '[data-tour="nav-leads"]',
        title: "8. Chuyển sang Quản lý Khách hàng",
        body: "Bấm mục Khách hàng ở thanh điều hướng để quản lý hồ sơ và lịch sử tư vấn.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="nav-leads"]' },
      },
    ],
  },
  "/leads": {
    routeKey: "/leads",
    version: 2,
    title: "Hướng dẫn Quản lý Khách hàng",
    nextRoute: {
      label: "Chuyển sang Báo cáo",
      href: "/reports",
    },
    steps: [
      {
        id: "customers_list",
        target: '[data-tour="customer-list"]',
        title: "1. Danh sách khách hàng",
        body: "Quản lý tập trung thông tin khách hàng tiềm năng và tín hiệu cần tư vấn.",
        placement: "right",
      },
      {
        id: "customers_filter",
        target: '[data-tour="customer-filter"]',
        title: "2. Bộ lọc trạng thái",
        body: "Lọc khách hàng mới, đang tư vấn, đã chốt đơn hoặc cần chăm sóc lại.",
        placement: "bottom",
      },
      {
        id: "customers_select",
        target: '[data-tour="customer-list-first-item"]',
        title: "3. Chọn hồ sơ khách hàng",
        body: "Bấm chọn khách hàng đầu tiên để xem thông tin chi tiết và lịch sử tương tác.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="customer-list-first-item"]' },
      },
      {
        id: "customers_claim",
        target: '[data-tour="lead-claim-btn"], [data-tour="lead-claim-step-indicator"]',
        title: "4. Nhận xử lý",
        body: "Bấm nút 'Nhận xử lý' để phân công quản lý khách hàng cho tài khoản của bạn.",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="lead-claim-btn"]' },
      },
      {
        id: "customers_copy_template",
        target: '[data-tour="lead-copy-template-btn"], [data-tour="lead-detail-panel"]',
        title: "5. Mở nguồn & Sao chép mẫu",
        body: "Bấm nút 'Mở nguồn & sao chép' để xem bài viết gốc và tự động sao chép tin nhắn mẫu.",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="lead-copy-template-btn"]' },
      },
      {
        id: "customers_note",
        target: '[data-tour="lead-note-input"]',
        title: "6. Ghi chú tư vấn",
        body: "Nhập tóm tắt kết quả trao đổi với khách hàng vào ô ghi chú.",
        placement: "top",
        allowInteraction: true,
      },
      {
        id: "customers_result",
        target: '[data-tour="lead-result-dropdown"]',
        title: "7. Kết quả tư vấn",
        body: "Chọn kết quả tương tác (Ví dụ: Đã tư vấn, Đã chốt đơn).",
        placement: "top",
      },
      {
        id: "customers_complete",
        target: '[data-tour="lead-complete-btn"]',
        title: "8. Hoàn tất ghi nhận",
        body: "Bấm nút 'Lưu kết quả' để hoàn tất xử lý hồ sơ khách hàng.",
        placement: "top",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="lead-complete-btn"]' },
      },
      {
        id: "customers_nav_reports",
        target: '[data-tour="nav-reports"]',
        title: "9. Chuyển sang Báo cáo",
        body: "Bấm vào Báo cáo ở thanh điều hướng để xem hiệu suất chốt đơn và thống kê tổng quan.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="nav-reports"]' },
      },
    ],
  },
  "/customers": {
    routeKey: "/leads",
    version: 2,
    title: "Hướng dẫn Quản lý Khách hàng",
    nextRoute: {
      label: "Chuyển sang Báo cáo",
      href: "/reports",
    },
    steps: [
      {
        id: "customers_list",
        target: '[data-tour="customer-list"]',
        title: "1. Danh sách khách hàng",
        body: "Quản lý tập trung thông tin khách hàng tiềm năng và tín hiệu cần tư vấn.",
        placement: "right",
      },
      {
        id: "customers_filter",
        target: '[data-tour="customer-filter"]',
        title: "2. Bộ lọc trạng thái",
        body: "Lọc khách hàng mới, đang tư vấn, đã chốt đơn hoặc cần chăm sóc lại.",
        placement: "bottom",
      },
      {
        id: "customers_select",
        target: '[data-tour="customer-list-first-item"]',
        title: "3. Chọn hồ sơ khách hàng",
        body: "Bấm chọn khách hàng đầu tiên để xem thông tin chi tiết và lịch sử tương tác.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="customer-list-first-item"]' },
      },
      {
        id: "customers_claim",
        target: '[data-tour="lead-claim-btn"], [data-tour="lead-claim-step-indicator"]',
        title: "4. Nhận xử lý",
        body: "Bấm nút 'Nhận xử lý' để phân công quản lý khách hàng cho tài khoản của bạn.",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="lead-claim-btn"]' },
      },
      {
        id: "customers_copy_template",
        target: '[data-tour="lead-copy-template-btn"], [data-tour="lead-detail-panel"]',
        title: "5. Mở nguồn & Sao chép mẫu",
        body: "Bấm nút 'Mở nguồn & sao chép' để xem bài viết gốc và tự động sao chép tin nhắn mẫu.",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="lead-copy-template-btn"]' },
      },
      {
        id: "customers_note",
        target: '[data-tour="lead-note-input"]',
        title: "6. Ghi chú tư vấn",
        body: "Nhập tóm tắt kết quả trao đổi với khách hàng vào ô ghi chú.",
        placement: "top",
        allowInteraction: true,
      },
      {
        id: "customers_result",
        target: '[data-tour="lead-result-dropdown"]',
        title: "7. Kết quả tư vấn",
        body: "Chọn kết quả tương tác (Ví dụ: Đã tư vấn, Đã chốt đơn).",
        placement: "top",
      },
      {
        id: "customers_complete",
        target: '[data-tour="lead-complete-btn"]',
        title: "8. Hoàn tất ghi nhận",
        body: "Bấm nút 'Lưu kết quả' để hoàn tất xử lý hồ sơ khách hàng.",
        placement: "top",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="lead-complete-btn"]' },
      },
      {
        id: "customers_nav_reports",
        target: '[data-tour="nav-reports"]',
        title: "9. Chuyển sang Báo cáo",
        body: "Bấm vào Báo cáo ở thanh điều hướng để xem hiệu suất chốt đơn và thống kê tổng quan.",
        placement: "right",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="nav-reports"]' },
      },
    ],
  },
  "/reports": {
    routeKey: "/reports",
    version: 2,
    title: "Hướng dẫn Báo cáo & Phân tích",
    steps: [
      {
        id: "reports_center",
        target: '[data-tour="reports-header"]',
        title: "1. Trung tâm Báo cáo",
        body: "Quản lý và tổng hợp toàn bộ báo cáo truyền thông, hiệu suất tư vấn và chỉ số thương hiệu.",
        placement: "bottom",
      },
      {
        id: "reports_create_custom",
        target: '[data-tour="reports-create-custom"]',
        title: "2. Tạo báo cáo tùy chỉnh",
        body: "Bấm nút 'Tạo báo cáo thủ công' để khởi tạo báo cáo theo khoảng thời gian và tiêu chí tùy chọn.",
        placement: "bottom",
        allowInteraction: true,
      },
      {
        id: "reports_summary",
        target: '[data-tour="reports-header"]',
        title: "3. Thống kê & Xuất dữ liệu",
        body: "Theo dõi chỉ số cảm xúc thương hiệu (Sentiment Index) và xuất file PDF / Excel tải về.",
        placement: "bottom",
      },
    ],
  },
  "/demo": {
    routeKey: "/demo",
    version: 10,
    title: "Hướng dẫn Trải nghiệm Demo InsightFlow",
    nextRoute: {
      label: "Trải nghiệm ngay",
      href: "/#consultation",
    },
    steps: [
      {
        id: "demo_overview",
        target: '[data-tour="demo-overview"], [data-tour="dashboard-overview"]',
        title: "1. Tổng quan dữ liệu mẫu",
        body: "Đây là workspace minh họa với dữ liệu mẫu cố định, giúp bạn xem nhanh cách InsightFlow tổng hợp sức khỏe thương hiệu.",
        placement: "bottom",
      },
      {
        id: "demo_filters",
        target: '[data-tour="dashboard-filters"]',
        title: "2. Bộ lọc thời gian & nền tảng",
        body: "Bạn có thể đổi khoảng thời gian hoặc nền tảng để khám phá các lát cắt khác nhau của bộ dữ liệu demo.",
        placement: "bottom",
      },
      {
        id: "demo_health",
        target: '[data-tour="dashboard-health-score"], [data-tour="demo-health-score"]',
        title: "3. Điểm sức khỏe thương hiệu (BHS)",
        body: "Điểm sức khỏe tóm tắt mức độ tích cực, tiêu cực và tín hiệu rủi ro trong dữ liệu mẫu.",
        placement: "bottom",
      },
      {
        id: "demo_try_now",
        target: '[data-tour="demo-try-now-btn"]',
        title: "4. Đăng ký Trải nghiệm ngay",
        body: "Bấm 'Trải nghiệm ngay' để bắt đầu kết nối thương hiệu của chính bạn với InsightFlow!",
        placement: "bottom",
        allowInteraction: true,
        action: { type: "click", selector: '[data-tour="demo-try-now-btn"]' },
      },
    ],
  },
  "/admin/consultations": {
    routeKey: "/admin/consultations",
    version: 2,
    title: "Hướng dẫn Quản lý Yêu cầu tư vấn",
    steps: [
      {
        id: "consultation_list",
        target: '[data-tour="consultation-list"]',
        title: "1. Danh sách yêu cầu",
        body: "Quản lý khách hàng đăng ký trải nghiệm dùng thử InsightFlow.",
        placement: "right",
      },
      {
        id: "consultation_detail",
        target: '[data-tour="consultation-detail"]',
        title: "2. Chi tiết & Cấu hình",
        body: "Xem thông tin thương hiệu, từ khóa và người liên hệ.",
        placement: "left",
      },
      {
        id: "trial_run",
        target: '[data-tour="trial-run-button"]',
        title: "3. Tạo lượt cào Trial",
        body: "Kích hoạt phiên cào dữ liệu mẫu cho thương hiệu dùng thử.",
        placement: "bottom",
      },
      {
        id: "trial_publish",
        target: '[data-tour="trial-publish-button"]',
        title: "4. Xuất bản dữ liệu Trial",
        body: "Duyệt dữ liệu cào mẫu trước khi tạo tài khoản gửi khách hàng.",
        placement: "bottom",
      },
      {
        id: "trial_account",
        target: '[data-tour="trial-account-button"]',
        title: "5. Tạo tài khoản & Gửi link",
        body: "Sau khi xuất bản dữ liệu, bấm tạo tài khoản và gửi link kích hoạt cho khách.",
        placement: "bottom",
      },
    ],
  },
  "/admin/crawl-operations": {
    routeKey: "/admin/crawl-operations",
    version: 2,
    title: "Hướng dẫn Giám sát phiên cào",
    steps: [
      {
        id: "ops_tabs",
        target: '[data-tour="ops-production-tab"]',
        title: "1. Tab Production & Trial",
        body: "Phân loại giám sát phiên cào chính thức và phiên cào thử nghiệm.",
        placement: "bottom",
      },
      {
        id: "ops_filter",
        target: '[data-tour="ops-status-filter"]',
        title: "2. Bộ lọc trạng thái",
        body: "Theo dõi các task cào thành công, đang chạy hoặc gặp lỗi.",
        placement: "bottom",
      },
      {
        id: "ops_list",
        target: '[data-tour="ops-task-list"]',
        title: "3. Danh sách phiên cào",
        body: "Hiển thị danh sách nhiệm vụ cào theo từng nền tảng.",
        placement: "right",
      },
      {
        id: "ops_detail",
        target: '[data-tour="ops-task-detail"]',
        title: "4. Chi tiết Log",
        body: "Kiểm tra log lỗi và số lượng dữ liệu thu thập được.",
        placement: "left",
      },
      {
        id: "ops_rerun",
        target: '[data-tour="ops-rerun-platform"]',
        title: "5. Cào lại / Tạm dừng",
        body: "Thao tác chạy lại nền tảng lỗi hoặc tạm dừng phiên cào khi cần.",
        placement: "bottom",
      },
    ],
  },
  "/labeling_tool": {
    routeKey: "/labeling_tool",
    version: 2,
    title: "Hướng dẫn Công cụ Gán nhãn AI",
    steps: [
      {
        id: "labeling_platform",
        target: '[data-tour="labeling-platform-filter"]',
        title: "1. Chọn nền tảng",
        body: "Lọc thảo luận cần duyệt nhãn theo Facebook, TikTok, YouTube...",
        placement: "bottom",
      },
      {
        id: "labeling_brand",
        target: '[data-tour="labeling-brand-filter"]',
        title: "2. Chọn thương hiệu",
        body: "Chọn thương hiệu cụ thể hoặc chọn 'Tất cả thương hiệu' để xem toàn bộ.",
        placement: "bottom",
      },
      {
        id: "labeling_pending",
        target: '[data-tour="labeling-ai-pending-tab"]',
        title: "3. Thảo luận chờ duyệt",
        body: "Danh sách thảo luận đã được AI gán nhãn tự động chờ con người thẩm định.",
        placement: "right",
      },
      {
        id: "labeling_thread",
        target: '[data-tour="labeling-thread-card"]',
        title: "4. Duyệt nhãn trong Thread",
        body: "Đọc nội dung và điều chỉnh nhãn cảm xúc, chủ đề, độ khẩn cấp.",
        placement: "left",
      },
      {
        id: "labeling_export",
        target: '[data-tour="labeling-export-json"]',
        title: "5. Xuất dữ liệu JSON",
        body: "Tải file dataset JSON đã được gắn nhãn chuẩn để huấn luyện AI.",
        placement: "bottom",
      },
    ],
  },
  "/admin/brand-accounts": {
    routeKey: "/admin/brand-accounts",
    version: 2,
    title: "Hướng dẫn Quản lý Tài khoản Brand",
    steps: [
      {
        id: "brand_acc_create",
        target: '[data-tour="brand-account-create"]',
        title: "1. Biểu mẫu khởi tạo tài khoản",
        body: "Nhập họ tên và hệ thống sẽ tự động tạo email theo tên miền của thương hiệu.",
        placement: "bottom",
      },
      {
        id: "brand_acc_slug",
        target: '[data-tour="brand-account-workspace"]',
        title: "2. Chọn thương hiệu",
        body: "Gắn tài khoản quản trị mới với thương hiệu tương ứng trong dữ liệu.",
        placement: "bottom",
      },
      {
        id: "brand_acc_temp_password",
        target: '[data-tour="brand-account-temp-password"]',
        title: "3. Mật khẩu tạm thời",
        body: "Cấp mật khẩu tạm thời tự động hoặc tự tạo mật khẩu quản trị ban đầu.",
        placement: "bottom",
      },
      {
        id: "brand_acc_list",
        target: '[data-tour="brand-account-list"]',
        title: "4. Danh sách tài khoản",
        body: "Quản lý toàn bộ tài khoản Brand Manager, trạng thái hoạt động và cấp lại mật khẩu.",
        placement: "top",
      },
      {
        id: "brand_acc_search",
        target: '[data-tour="brand-account-search"]',
        title: "5. Tra cứu nhanh",
        body: "Tìm kiếm nhanh theo tên quản trị viên, email hoặc thương hiệu.",
        placement: "bottom",
      },
    ],
  },
  "/admin/brands": {
    routeKey: "/admin/brands",
    version: 3,
    title: "Hướng dẫn Quản lý Thương hiệu",
    steps: [
      {
        id: "brand_mgt_list",
        target: '[data-tour="brand-list"]',
        title: "1. Danh sách Thương hiệu",
        body: "Xem tất cả workspace thương hiệu đã được đăng ký trên hệ thống.",
        placement: "top",
      },
      {
        id: "brand_mgt_status",
        target: '[data-tour="brand-status"]',
        title: "2. Trạng thái hoạt động",
        body: "Theo dõi trạng thái Active, Trial hoặc Suspended.",
        placement: "bottom",
      },
      {
        id: "brand_mgt_open",
        target: '[data-tour="brand-open-workspace"]',
        title: "3. Mở Workspace",
        body: "Nhấp để truy cập trực tiếp vào giao diện quản trị thương hiệu đó.",
        placement: "bottom",
      },
    ],
  },
};

// Keep the automatic, page-level introduction short. Detailed task execution
// remains discoverable in the page UI instead of forcing 8-9 onboarding steps.
const COMPACT_ROUTE_STEPS: Record<string, string[]> = {
  "/alerts": [
    "alerts_list",
    "alerts_select",
    "alerts_claim",
    "alerts_note",
    "alerts_nav_customers",
  ],
  "/leads": [
    "customers_list",
    "customers_filter",
    "customers_select",
    "customers_claim",
    "customers_nav_reports",
  ],
};

Object.entries(COMPACT_ROUTE_STEPS).forEach(([routeKey, stepIds]) => {
  const config = ROUTE_TOUR_CONFIGS[routeKey];
  if (!config) return;
  config.version = 3;
  config.steps = stepIds
    .map((stepId) => config.steps.find((step) => step.id === stepId))
    .filter((step): step is TourStep => Boolean(step))
    .map((step, index) => ({
      ...step,
      title: step.title.replace(/^\d+\.\s*/, `${index + 1}. `),
    }));
});

// `/customers` is an alias of `/leads`; keeping two copies caused the two
// routes to drift and made one config unreachable.
delete ROUTE_TOUR_CONFIGS["/customers"];
