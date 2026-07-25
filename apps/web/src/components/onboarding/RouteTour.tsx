"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { calculateTooltipPosition } from "@/lib/tooltip-positioning";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  actionHint?: string;
  requiredAction?: "select_alert" | "claim_alert" | "open_source" | "type_note" | "select_result" | "complete_alert" | string;
  preferredPlacement?: "top" | "bottom" | "left" | "right" | "auto";
  onBeforeStep?: () => void;
  onValidate?: () => boolean;
}

export interface RouteTourConfig {
  id: string;
  name: string;
  steps: TourStep[];
}

export const TOUR_ACTION_EVENT = "insightflow_tour_action";
export const ROUTE_TOUR_START_EVENT = "insightflow_start_route_tour";

export function dispatchTourAction(actionName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(TOUR_ACTION_EVENT, { detail: { action: actionName } }),
    );
  }
}

export const ROUTE_TOURS: Record<string, RouteTourConfig> = {
  "/dashboard": {
    id: "dashboard_overview_v2",
    name: "Hướng dẫn trang Tổng quan",
    steps: [
      {
        id: "overview_filters",
        target: '[data-tour="dashboard-filters"]',
        title: "1. Bộ lọc dữ liệu",
        description: "Chọn phạm vi thời gian và nền tảng để theo dõi tình hình thương hiệu theo từng thời kỳ.",
        actionHint: "Bạn có thể chuyển đổi nhanh giữa các khoảng 24h, 7 ngày, 30 ngày hoặc tự chọn ngày tùy chỉnh.",
      },
      {
        id: "overview_brand_health",
        target: '[data-tour="dashboard-brand-health"]',
        title: "2. Chỉ số sức khỏe thương hiệu",
        description: "Điểm số tổng hợp (Brand Health Score) được tính từ cảm xúc, mức độ tiêu cực và các tín hiệu rủi ro trong kỳ.",
        actionHint: "Điểm càng cao chứng tỏ chỉ số thảo luận tích cực của thương hiệu đang tốt và ổn định.",
      },
      {
        id: "overview_sentiment",
        target: '[data-tour="dashboard-sentiment"]',
        title: "3. Tỷ lệ cảm xúc",
        description: "Nhìn nhanh tỷ lệ Tích cực, Trung lập và Tiêu cực để nắm bắt xu hướng dư luận.",
        actionHint: "Bấm 'Xem phân tích chi tiết' để theo dõi chi tiết từng kênh thảo luận.",
      },
      {
        id: "overview_actionable",
        target: '[data-tour="dashboard-actionable"]',
        title: "4. Việc cần xử lý",
        description: "Số lượng công việc còn tồn đọng cần đội ngũ xử lý ngay.",
        actionHint: "Nhấp trực tiếp vào card KPI để mở danh sách chi tiết các công việc cần xử lý.",
      },
      {
        id: "overview_crisis_tab",
        target: '[data-tour="dashboard-tab-crisis"]',
        title: "5. Chuyển sang Crisis Monitoring",
        description: "Tab phân tích sâu các rủi ro, chủ đề tiêu cực và nhóm cảnh báo cần ưu tiên.",
        actionHint: "Bấm vào tab Crisis Monitoring để chuyển sang khu vực đánh giá rủi ro khủng hoảng.",
      },
    ],
  },
  "/dashboard/insights": {
    id: "dashboard_crisis_monitoring_v2",
    name: "Hướng dẫn Crisis Monitoring",
    steps: [
      {
        id: "crisis_summary",
        target: '[data-tour="crisis-summary"]',
        title: "1. Tổng quan rủi ro",
        description: "Xem nhanh số lượng cảnh báo tiêu cực, mức độ rủi ro và tình trạng xử lý hiện tại.",
        actionHint: "Bấm trực tiếp vào từng khối chỉ số để xem danh sách lọc tương ứng.",
      },
      {
        id: "crisis_topics",
        target: '[data-tour="crisis-topics"]',
        title: "2. Chủ đề tiêu cực nổi bật",
        description: "Phân rã các rủi ro theo kênh truyền thông và nhóm chủ đề đang tác động lớn nhất đến thương hiệu.",
        actionHint: "Giúp bạn xác định nguyên nhân cốt lõi gây ra rủi ro khủng hoảng.",
      },
      {
        id: "crisis_trend",
        target: '[data-tour="crisis-trend"]',
        title: "3. Xu hướng rủi ro",
        description: "Biểu đồ xu hướng theo dõi diễn biến rủi ro tăng, giảm hay ổn định qua từng mốc thời gian.",
        actionHint: "Đường màu đỏ thể hiện các cảnh báo ưu tiên cao cần phản hồi gấp.",
      },
      {
        id: "crisis_action_link",
        target: '[data-tour="crisis-action-link"]',
        title: "4. Chuyển sang xử lý cảnh báo",
        description: "Khi cần thao tác trực tiếp, chuyển sang trang Cảnh báo để tự nhận xử lý hoặc giao việc cho nhân viên.",
        actionHint: "Nhấp vào các liên kết mở nguồn/xử lý hoặc chuyển đến trang Cảnh báo ở menu bên trái.",
      },
      {
        id: "crisis_lead_tab",
        target: '[data-tour="dashboard-tab-lead"]',
        title: "5. Chuyển sang Lead Monitoring",
        description: "Sau khi nắm rủi ro, bạn có thể chuyển sang Lead Monitoring để xem các cơ hội khách hàng tiềm năng.",
        actionHint: "Bấm vào tab Lead Monitoring để chuyển sang khu vực phân tích cơ hội bán hàng.",
      },
    ],
  },
  "/dashboard/lead-monitoring": {
    id: "dashboard_lead_monitoring_v2",
    name: "Hướng dẫn Lead Monitoring",
    steps: [
      {
        id: "lead_summary",
        target: '[data-tour="lead-summary"]',
        title: "1. Tổng quan lead",
        description: "Xem nhanh tổng số lead, hot lead, lead đang xử lý và tỷ lệ chuyển đổi.",
        actionHint: "Bấm vào từng khối KPI để lọc danh sách khách hàng tương ứng.",
      },
      {
        id: "lead_priority",
        target: '[data-tour="lead-priority-list"]',
        title: "2. Lead ưu tiên",
        description: "AI xếp hạng lead theo ý định mua, độ nóng và mức độ cần phản hồi gấp.",
        actionHint: "Ưu tiên các lead có điểm số mua hàng cao để tối ưu tỷ lệ chốt đơn.",
      },
      {
        id: "lead_analytics",
        target: '[data-tour="lead-analytics"]',
        title: "3. Phân tích nguồn lead",
        description: "Biểu đồ phân bổ giúp bạn biết nền tảng nào đang tạo ra nhiều cơ hội khách hàng tiềm năng nhất.",
        actionHint: "Theo dõi kênh hiệu quả để tập trung nguồn lực bán hàng.",
      },
      {
        id: "lead_action_link",
        target: '[data-tour="lead-action-link"]',
        title: "4. Chuyển sang trang Khách hàng",
        description: "Khi cần chăm sóc cụ thể từng khách hàng, chuyển sang trang Khách hàng để ghi chú và cập nhật trạng thái.",
        actionHint: "Bấm vào các dòng thông tin khách hàng hoặc mục Khách hàng ở menu bên trái.",
      },
      {
        id: "lead_nav_team",
        target: '[data-tour="nav-team"]',
        title: "5. Chuyển sang trang Nhân viên",
        description: "Sau khi xem workload lead, bạn có thể sang trang Nhân viên để kiểm tra đội phụ trách và phân quyền xử lý.",
        actionHint: "Bấm vào mục Quản lý đội ngũ ở menu bên trái để chuyển sang trang Nhân viên.",
      },
    ],
  },
  "/team": {
    id: "team_staff_v2",
    name: "Hướng dẫn Quản lý nhân viên",
    steps: [
      {
        id: "team_list",
        target: '[data-tour="team-list"]',
        title: "1. Danh sách nhân viên",
        description: "Xem toàn bộ thành viên đang tham gia và hoạt động trong workspace.",
        actionHint: "Bao gồm họ tên, email, vai trò và trạng thái hoạt động của nhân viên.",
      },
      {
        id: "team_roles",
        target: '[data-tour="team-roles"]',
        title: "2. Vai trò và quyền hạn",
        description: "Mỗi nhân viên được phân công quyền hạn cụ thể như xử lý cảnh báo, xử lý lead hoặc xem báo cáo.",
        actionHint: "Đảm bảo phân quyền chính xác cho từng vị trí nhân sự.",
      },
      {
        id: "team_add_staff",
        target: '[data-tour="team-add-staff"]',
        title: "3. Thêm nhân viên",
        description: "Mời nhân viên mới tham gia hệ thống và chọn vai trò phù hợp với công việc.",
        actionHint: "Bấm vào nút 'Thêm nhân viên' để tạo tài khoản mới.",
      },
      {
        id: "team_actions",
        target: '[data-tour="team-actions"]',
        title: "4. Quản lý nhân viên",
        description: "Cập nhật vai trò, đặt lại mật khẩu tạm thời hoặc vô hiệu hóa tài khoản khi cần.",
        actionHint: "Nhấp vào nút thao tác hoặc biểu tượng sửa ở từng dòng nhân viên.",
      },
      {
        id: "team_nav_alerts",
        target: '[data-tour="nav-alerts"]',
        title: "5. Chuyển sang trang Cảnh báo",
        description: "Sau khi nắm đội phụ trách, bạn có thể sang trang Cảnh báo để xử lý các phản hồi tiêu cực hoặc rủi ro cần ưu tiên.",
        actionHint: "Bấm vào mục Cảnh báo ở menu bên trái để chuyển sang trang xử lý sự vụ.",
      },
    ],
  },
  "/alerts": {
    id: "alerts_page_interactive_v1",
    name: "Hướng dẫn tương tác xử lý Cảnh báo",
    steps: [
      {
        id: "alerts_select",
        target: '[data-tour="alert-item-first"]',
        title: "1. Chọn một cảnh báo trong danh sách",
        description: "Danh sách các phản hồi tiêu cực/rủi ro đang chờ xử lý. Bấm chọn cảnh báo đầu tiên để bắt đầu.",
        requiredAction: "select_alert",
        actionHint: "Hãy nhấp trực tiếp vào một thẻ cảnh báo trong danh sách (hoặc bấm 'Tiếp' để xem bước sau).",
        preferredPlacement: "right",
      },
      {
        id: "alerts_read_detail",
        target: '[data-tour="alert-detail-panel"]',
        title: "2. Đọc nội dung cần xử lý và lý do ưu tiên",
        description: "Đọc nội dung gốc, nguồn bài viết, điểm tiêu cực và lý do AI gắn nhãn ưu tiên.",
        actionHint: "Xem lại tiến trình xử lý và lịch sử tương tác trước khi phản hồi.",
        preferredPlacement: "left",
      },
      {
        id: "alerts_claim",
        target: '[data-tour="alert-claim-btn"]',
        title: "3. Bấm 'Nhận xử lý'",
        description: "Nhấp nút 'Nhận xử lý' để khóa cảnh báo cho tài khoản của bạn, tránh xử lý trùng lặp.",
        requiredAction: "claim_alert",
        actionHint: "Hãy bấm nút 'Nhận xử lý' trên bảng chi tiết.",
        preferredPlacement: "bottom",
      },
      {
        id: "alerts_open_source",
        target: '[data-tour="alert-open-source-btn"]',
        title: "4. Bấm 'Mở nguồn'",
        description: "Bấm 'Mở nguồn' để xem bài viết gốc ngay trong khung xem nguồn nội bộ mà không đứt luồng.",
        requiredAction: "open_source",
        actionHint: "Hãy bấm nút 'Mở nguồn'.",
        preferredPlacement: "bottom",
      },
      {
        id: "alerts_type_note",
        target: '[data-tour="alert-note-input"]',
        title: "5. Nhập ghi chú xử lý",
        description: "Nhập nội dung trao đổi, minh chứng hoặc cách phản hồi vào ô ghi chú.",
        requiredAction: "type_note",
        actionHint: "Hãy nhập văn bản vào ô 'Minh chứng liên hệ'.",
        preferredPlacement: "left",
      },
      {
        id: "alerts_select_result",
        target: '[data-tour="alert-result-options"]',
        title: "6. Chọn kết quả phản hồi của khách hàng",
        description: "Chọn kết quả tương tác thực tế (Khách hàng tích cực, Chưa phản hồi, Vẫn bức xúc...).",
        requiredAction: "select_result",
        actionHint: "Hãy bấm chọn một tùy chọn kết quả phản hồi.",
        preferredPlacement: "left",
      },
      {
        id: "alerts_complete",
        target: '[data-tour="alert-submit-btn"]',
        title: "7. Hoàn tất xử lý cảnh báo",
        description: "Bấm nút hoàn tất để ghi nhận kết quả và cập nhật trạng thái cảnh báo.",
        requiredAction: "complete_alert",
        actionHint: "Hãy bấm nút 'Hoàn tất' hoặc 'Ghi nhận kết quả'.",
        preferredPlacement: "top",
      },
    ],
  },
};

function getStorageKey(tourId: string): string {
  return `insightflow_tour_${tourId}`;
}

export function RouteTour() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [activeTourConfig, setActiveTourConfig] = useState<RouteTourConfig | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize pathname to map demo paths or subpaths to base route
  const getNormalizedRoute = useCallback((path: string | null): string => {
    if (!path) return "/dashboard";
    if (path.startsWith("/alerts") || path.startsWith("/demo/alerts")) {
      return "/alerts";
    }
    if (path.startsWith("/team")) {
      return "/team";
    }
    if (path.startsWith("/demo/lead-monitoring") || path === "/dashboard/lead-monitoring") {
      return "/dashboard/lead-monitoring";
    }
    if (path.startsWith("/demo/insights") || path === "/dashboard/insights") {
      return "/dashboard/insights";
    }
    if (path.startsWith("/demo") || path.startsWith("/dashboard")) {
      return "/dashboard";
    }
    return path;
  }, []);

  const currentRoute = getNormalizedRoute(pathname);

  // Locate target element & scroll smoothly
  const locateTarget = useCallback((targetSelector: string) => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    let attempts = 0;
    const maxAttempts = 25; // 2.5 seconds (100ms * 25)

    const checkElement = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          if (retryTimerRef.current) {
            clearInterval(retryTimerRef.current);
            retryTimerRef.current = null;
          }
          setTargetRect(null);
        }
      }
    };

    checkElement();
    if (!document.querySelector(targetSelector)) {
      retryTimerRef.current = setInterval(checkElement, 100);
    }
  }, []);

  const startTour = useCallback((config: RouteTourConfig) => {
    setActiveTourConfig(config);
    setCurrentStepIndex(0);
    setActionWarning(null);
    setIsOpen(true);
    if (config.steps.length > 0) {
      locateTarget(config.steps[0].target);
    }
  }, [locateTarget]);

  // Handle custom event from Header (Guide button)
  useEffect(() => {
    const handleStartEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ route?: string; force?: boolean }>;
      const targetRoute = customEvent.detail?.route ? getNormalizedRoute(customEvent.detail.route) : currentRoute;
      const config = ROUTE_TOURS[targetRoute];

      if (config) {
        startTour(config);
      }
    };

    window.addEventListener(ROUTE_TOUR_START_EVENT, handleStartEvent);
    return () => {
      window.removeEventListener(ROUTE_TOUR_START_EVENT, handleStartEvent);
    };
  }, [currentRoute, getNormalizedRoute, startTour]);

  // Auto-start check on route change (only if not seen)
  useEffect(() => {
    const config = ROUTE_TOURS[currentRoute];
    if (!config) {
      setIsOpen(false);
      return;
    }

    const hasSeen = localStorage.getItem(getStorageKey(config.id)) === "true";
    if (!hasSeen) {
      const timer = setTimeout(() => {
        startTour(config);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentRoute, startTour]);

  // Update target rectangle on resize or scroll
  useEffect(() => {
    if (!isOpen || !activeTourConfig) return;

    const updateRect = () => {
      const step = activeTourConfig.steps[currentStepIndex];
      if (step) {
        const el = document.querySelector(step.target);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        }
      }
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isOpen, activeTourConfig, currentStepIndex]);

  // Listen to interactive user actions
  useEffect(() => {
    if (!isOpen || !activeTourConfig) return;

    const currentStep = activeTourConfig.steps[currentStepIndex];
    if (!currentStep?.requiredAction) return;

    const handleTourAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string }>;
      if (customEvent.detail?.action === currentStep.requiredAction) {
        setActionWarning(null);
        // Advance step automatically
        if (currentStepIndex < activeTourConfig.steps.length - 1) {
          const nextIndex = currentStepIndex + 1;
          setCurrentStepIndex(nextIndex);
          locateTarget(activeTourConfig.steps[nextIndex].target);
        } else {
          handleComplete();
        }
      }
    };

    window.addEventListener(TOUR_ACTION_EVENT, handleTourAction);
    return () => {
      window.removeEventListener(TOUR_ACTION_EVENT, handleTourAction);
    };
  }, [isOpen, activeTourConfig, currentStepIndex, locateTarget]);

  // Move to next step manually
  const handleNext = () => {
    if (!activeTourConfig) return;
    setActionWarning(null);
    if (currentStepIndex < activeTourConfig.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      locateTarget(activeTourConfig.steps[nextIndex].target);
    } else {
      handleComplete();
    }
  };

  // Move to previous step
  const handlePrev = () => {
    if (!activeTourConfig) return;
    setActionWarning(null);
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      locateTarget(activeTourConfig.steps[prevIndex].target);
    }
  };

  // Complete & mark as seen in storage
  const handleComplete = () => {
    if (activeTourConfig) {
      localStorage.setItem(getStorageKey(activeTourConfig.id), "true");
    }
    setIsOpen(false);
    setActiveTourConfig(null);
    setActionWarning(null);
  };

  // Skip tour
  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen || !activeTourConfig) return null;

  const currentStep = activeTourConfig.steps[currentStepIndex];
  if (!currentStep) return null;

  // Viewport-aware position calculation
  const positionResult = calculateTooltipPosition({
    targetRect: targetRect || new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0),
    tooltipWidth: 370,
    tooltipHeight: 250,
    preferredPlacement: currentStep.preferredPlacement || "auto",
  });

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeTourConfig.steps.length - 1;

  return (
    <>
      {/* Target Highlight Spotlight Mask (pointer-events-none so clicks pass to target) */}
      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none transition-all duration-300 ease-out"
          style={{
            zIndex: 9990,
            boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.45)`,
            borderRadius: 14,
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            position: "fixed",
          }}
        />
      )}

      {/* Non-blocking overlay layer */}
      <div className="fixed inset-0 pointer-events-none z-[9985]" />

      {/* Tooltip Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={currentStep.title}
        style={positionResult.style}
        className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-brand-border)]/60 bg-[var(--color-bg-surface)] p-4 shadow-2xl transition-all duration-300 animate-fade-in dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-0.5 text-[11px] font-black text-[var(--color-brand)]">
              Bước {currentStepIndex + 1} / {activeTourConfig.steps.length}
            </span>
            {currentStep.requiredAction && (
              <span className="animate-pulse rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Thao tác thật
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]"
            title="Thoát hướng dẫn"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <h3 className="text-sm font-black text-[var(--color-text-primary)]">
            {currentStep.title}
          </h3>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-[var(--color-text-secondary)]">
            {currentStep.description}
          </p>

          {currentStep.actionHint && (
            <div className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand-subtle)]/50 p-2.5 text-[11px] font-medium text-[var(--color-brand)]">
              <span className="material-symbols-outlined shrink-0 text-sm">lightbulb</span>
              <span>{currentStep.actionHint}</span>
            </div>
          )}

          {actionWarning && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{actionWarning}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            Bỏ qua
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
              >
                Trước
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[var(--color-brand)] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)]"
            >
              <span>{isLastStep ? "Hoàn tất" : "Tiếp"}</span>
              {!isLastStep && <span className="material-symbols-outlined text-sm">chevron_right</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
