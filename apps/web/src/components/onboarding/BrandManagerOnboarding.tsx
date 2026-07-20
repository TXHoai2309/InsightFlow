"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { BRAND_MANAGER_TOUR_EVENT } from "@/components/onboarding/events";
import { completeRoleOnboarding } from "@/lib/onboarding";

const BRAND_MANAGER_ONBOARDING_VERSION = "2026-07-brand-manager-tour-v4";

type TourMode = "intro" | "tour";

interface TourStep {
  route: string;
  selector: string;
  moduleLabel: string;
  depth: "detail" | "skim";
  title: string;
  body: string;
  actionHint: string;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const tourSteps: TourStep[] = [
  {
    route: "/dashboard",
    selector: '[data-tour="dashboard-filters"]',
    moduleLabel: "Trang tổng quan",
    depth: "detail",
    title: "Đặt đúng phạm vi phân tích",
    body:
      "Đây là điểm bắt đầu mỗi phiên làm việc của Brand Manager. Bộ lọc thời gian, nền tảng và phạm vi thương hiệu quyết định toàn bộ KPI, biểu đồ và danh sách ưu tiên bên dưới.",
    actionHint:
      "Chọn khoảng thời gian cần kiểm tra, sau đó đối chiếu các kênh có biến động lớn trước khi đi sang module khác.",
  },
  {
    route: "/dashboard",
    selector: '[data-tour="dashboard-overview"]',
    moduleLabel: "Trang tổng quan",
    depth: "detail",
    title: "Đọc sức khỏe thương hiệu",
    body:
      "Khu vực tổng quan gom số lượng mention, sentiment, nguồn thảo luận, chủ đề nổi bật và tín hiệu rủi ro. Đây là nơi Brand Manager quyết định hôm nay cần ưu tiên điều gì.",
    actionHint:
      "Đọc theo thứ tự: tổng mention, sentiment, chủ đề tăng mạnh, rồi mới phân việc hoặc kiểm tra request.",
  },
  {
    route: "/dashboard/insights",
    selector: '[data-tour="dashboard-insights-risk"]',
    moduleLabel: "Dashboard Insights",
    depth: "detail",
    title: "Nhận diện rủi ro trong dashboard",
    body:
      "Tab Insights trong dashboard giúp Brand Manager đọc tín hiệu khủng hoảng ở mức chiến lược: risk score, tỷ lệ tiêu cực, nền tảng phát sinh và chủ đề đang nóng.",
    actionHint:
      "Bắt đầu từ risk score và tỷ lệ negative; nếu hai chỉ số tăng, chuyển sang chủ đề và nền tảng để hiểu nguyên nhân.",
  },
  {
    route: "/dashboard/insights",
    selector: '[data-tour="dashboard-insights-breakdown"]',
    moduleLabel: "Dashboard Insights",
    depth: "detail",
    title: "Biến insight thành hành động quản trị",
    body:
      "Khối đề xuất AI gom các hành động nên giao cho đội ngũ: ưu tiên chủ đề nào, kênh nào cần phản hồi và sự vụ nào cần owner rõ ràng.",
    actionHint:
      "Dùng phần này để quyết định giao việc hoặc yêu cầu nhân viên crisis cập nhật tình trạng xử lý, không cần tự xử lý từng alert tại đây.",
  },
  {
    route: "/dashboard/lead-monitoring",
    selector: '[data-tour="dashboard-lead-monitoring-priority"]',
    moduleLabel: "Lead Monitoring",
    depth: "detail",
    title: "Theo dõi sức khỏe hàng chờ lead",
    body:
      "Lead Monitoring trong dashboard cho Brand Manager biết tổng tải của đội lead: lead ưu tiên, lead quá hạn, lead cần ghi nhận kết quả và các điểm nghẽn trong chăm sóc.",
    actionHint:
      "Đọc phần ưu tiên để biết đội lead có đang quá tải không, rồi mới đi xuống biểu đồ nguồn và bảng chi tiết.",
  },
  {
    route: "/dashboard/lead-monitoring",
    selector: '[data-tour="dashboard-lead-monitoring-table"]',
    moduleLabel: "Lead Monitoring",
    depth: "detail",
    title: "Đối chiếu lead cần theo dõi",
    body:
      "Bảng lead trong dashboard giúp bạn kiểm tra danh sách cụ thể mà không cần bước vào nghiệp vụ chăm sóc từng khách. Đây là lớp giám sát dành cho Brand Manager.",
    actionHint:
      "Dùng bảng này để nhận diện lead đang kẹt, sau đó nhắc nhân viên lead xử lý hoặc cập nhật kết quả.",
  },
  {
    route: "/team/staff",
    selector: '[data-tour="team-management"]',
    moduleLabel: "Quản lý đội ngũ",
    depth: "detail",
    title: "Kiểm soát đội ngũ thuộc brand",
    body:
      "Trang này cho biết nhân viên nào đang thuộc thương hiệu, vai trò của từng người và trạng thái tài khoản. Đây là phần Brand Manager dùng để kiểm soát quyền truy cập vận hành.",
    actionHint:
      "Rà vai trò định kỳ: crisis_employee xử lý Cảnh báo, lead_employee xử lý Khách hàng tiềm năng.",
  },
  {
    route: "/team/staff",
    selector: '[data-tour="team-add-staff"]',
    moduleLabel: "Quản lý đội ngũ",
    depth: "detail",
    title: "Thêm nhân viên đúng vai trò",
    body:
      "Khi tạo tài khoản mới, vai trò quyết định người đó nhìn thấy chức năng nào. Gán đúng vai trò giúp tránh lẫn nghiệp vụ và giảm rủi ro thao tác nhầm dữ liệu.",
    actionHint:
      "Chỉ cấp đúng quyền cần dùng. Nhân viên lead không cần xử lý khủng hoảng, nhân viên khủng hoảng không cần queue lead.",
  },
  {
    route: "/mentions",
    selector: '[data-tour="mentions-filters"]',
    moduleLabel: "Đề cập",
    depth: "detail",
    title: "Lọc đúng tập đề cập cần kiểm tra",
    body:
      "Đề cập là nguồn dữ liệu gốc phía sau dashboard và báo cáo. Bộ lọc giúp bạn thu hẹp theo nền tảng, cảm xúc, chủ đề và loại nội dung trước khi đọc chi tiết.",
    actionHint:
      "Khi cần xác minh một chỉ số trên dashboard, hãy dùng cùng khoảng thời gian và cùng nền tảng ở đây.",
  },
  {
    route: "/mentions",
    selector: '[data-tour="mentions-table"]',
    moduleLabel: "Đề cập",
    depth: "detail",
    title: "Đọc nội dung và kiểm tra nhãn",
    body:
      "Bảng này hiển thị post, comment hoặc reply đã được hệ thống gắn nhãn. Đây là nơi phát hiện nhãn sai, nội dung nhạy cảm hoặc chủ đề cần yêu cầu nhân viên xử lý thêm.",
    actionHint:
      "Mở các đề cập tiêu cực, bất thường hoặc có reach cao để đọc ngữ cảnh trước khi ra quyết định.",
  },
  {
    route: "/label-requests",
    selector: '[data-tour="label-request-list"]',
    moduleLabel: "Duyệt yêu cầu",
    depth: "detail",
    title: "Kiểm soát chất lượng dữ liệu",
    body:
      "Danh sách này chứa các yêu cầu sửa nhãn do nhân viên gửi lên. Nhãn sau khi duyệt sẽ ảnh hưởng dashboard, báo cáo và luồng phân việc, nên Brand Manager cần kiểm tra kỹ.",
    actionHint:
      "Ưu tiên request đang chờ duyệt, đọc người gửi, lý do và nội dung mention trước khi chọn hành động.",
  },
  {
    route: "/label-requests",
    selector: '[data-tour="label-request-workbench"]',
    moduleLabel: "Duyệt yêu cầu",
    depth: "detail",
    title: "So sánh và chốt nhãn cuối cùng",
    body:
      "Khu vực làm việc giúp so sánh nhãn cũ, nhãn nhân viên đề xuất và nhãn cuối cùng. Đây là bước Brand Manager xác nhận dữ liệu đủ tin cậy để đưa vào hệ thống.",
    actionHint:
      "Duyệt nếu đề xuất đúng, sửa lại nếu cần tinh chỉnh, hoặc từ chối khi bằng chứng chưa đủ rõ.",
  },
  {
    route: "/reports",
    selector: '[data-tour="reports-center"]',
    moduleLabel: "Báo cáo",
    depth: "detail",
    title: "Đọc lại kết quả vận hành",
    body:
      "Trung tâm báo cáo tổng hợp dữ liệu thành các bản định kỳ, tùy chỉnh và lưu trữ. Đây là phần Brand Manager dùng để họp, đối soát hoặc gửi kết quả cho cấp trên.",
    actionHint:
      "Dùng báo cáo định kỳ để theo dõi nhịp vận hành, dùng báo cáo lưu trữ để xem lại các mốc đã chốt.",
  },
  {
    route: "/reports",
    selector: '[data-tour="reports-create-custom"]',
    moduleLabel: "Báo cáo",
    depth: "detail",
    title: "Tạo báo cáo theo nhu cầu",
    body:
      "Báo cáo thủ công phù hợp khi cần phân tích một chiến dịch, chi nhánh, nền tảng hoặc khoảng thời gian cụ thể thay vì xem toàn bộ dữ liệu.",
    actionHint:
      "Chọn brand, ngày, kênh, chủ đề và sentiment; sau đó xuất PDF hoặc Excel khi cần chia sẻ.",
  },
  {
    route: "/leads",
    selector: '[data-tour="leads-page"]',
    moduleLabel: "Khách hàng",
    depth: "skim",
    title: "Chỉ cần nắm nơi giám sát",
    body:
      "Khách hàng tiềm năng là nghiệp vụ chính của nhân viên lead. Với Brand Manager, trang này chủ yếu dùng để nhìn khối lượng, trạng thái và các lead cần chú ý.",
    actionHint:
      "Chỉ lướt qua số lượng và nhóm trạng thái. Việc liên hệ, chăm sóc và ghi nhận kết quả là trách nhiệm của nhân viên lead.",
  },
  {
    route: "/alerts",
    selector: '[data-tour="alerts-queue-header"]',
    moduleLabel: "Cảnh báo",
    depth: "skim",
    title: "Chỉ giám sát mức độ và SLA",
    body:
      "Cảnh báo là nghiệp vụ chính của nhân viên khủng hoảng. Brand Manager chỉ cần biết nơi theo dõi hàng chờ, mức độ nghiêm trọng và các vụ việc cần phê duyệt hoặc leo thang.",
    actionHint:
      "Không cần xử lý từng alert trong tour này. Hãy xem đội ngũ có quá tải hoặc có vụ việc nghiêm trọng cần can thiệp không.",
  },
];

const introCards = [
  {
    title: "Trọng tâm đúng vai trò",
    icon: "verified_user",
    text: "Tour đi sâu vào Tổng quan, Insights, Lead Monitoring, Đội ngũ, Đề cập, Duyệt yêu cầu và Báo cáo.",
  },
  {
    title: "Không lẫn nghiệp vụ nhân viên",
    icon: "switch_account",
    text: "Leads và Alerts chỉ được giới thiệu nhanh vì thao tác xử lý chính thuộc nhân viên chuyên trách.",
  },
  {
    title: "Có thể xem lại",
    icon: "help",
    text: "Sau khi hoàn tất, bạn vẫn có thể mở lại tour bằng nút Hướng dẫn ở thanh trên cùng.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function findVisibleTarget(selector: string) {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (targets.length === 0) return null;

  return (
    targets.find((target) => {
      const rect = target.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
      );
    }) || targets[0]
  );
}

function getTooltipStyle(targetRect: TargetRect | null): CSSProperties {
  if (typeof window === "undefined" || !targetRect) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const width = Math.min(440, window.innerWidth - 32);
  const belowTop = targetRect.top + targetRect.height + 16;
  const aboveTop = targetRect.top - 300;
  const hasRoomBelow = belowTop + 280 < window.innerHeight;
  const top = hasRoomBelow ? belowTop : Math.max(16, aboveTop);
  const left = clamp(
    targetRect.left + targetRect.width / 2 - width / 2,
    16,
    window.innerWidth - width - 16,
  );

  return { top, left, width };
}

function depthLabel(depth: TourStep["depth"]) {
  return depth === "detail" ? "Hướng dẫn chi tiết" : "Lướt qua";
}

export function BrandManagerOnboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const { setProfile } = useAuthStore();
  const [mode, setMode] = useState<TourMode>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");
  const pendingRouteRef = useRef<string | null>(null);

  const hasCompletedCurrentVersion =
    profile?.onboarding?.brand_manager?.version === BRAND_MANAGER_ONBOARDING_VERSION;

  const shouldShow = useMemo(() => {
    if (loading || dismissed) return false;
    if (pathname.startsWith("/demo")) return false;
    if (!profile || profile.role !== "brand_manager") return false;
    if (profile.temporaryPasswordIssued) return false;
    return manualOpen || !hasCompletedCurrentVersion;
  }, [dismissed, hasCompletedCurrentVersion, loading, manualOpen, pathname, profile]);

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const tooltipStyle = getTooltipStyle(targetRect);

  useEffect(() => {
    const openTour = () => {
      setDismissed(false);
      setManualOpen(true);
      setMode("intro");
      setCurrentStep(0);
      setTargetRect(null);
      setError("");
    };

    window.addEventListener(BRAND_MANAGER_TOUR_EVENT, openTour);
    return () => window.removeEventListener(BRAND_MANAGER_TOUR_EVENT, openTour);
  }, []);

  useEffect(() => {
    if (!shouldShow || mode !== "tour") return;
    if (pathname === step.route) {
      pendingRouteRef.current = null;
      return;
    }

    if (pendingRouteRef.current === step.route) return;

    pendingRouteRef.current = step.route;
    setTargetRect(null);
    router.replace(step.route);
  }, [mode, pathname, router, shouldShow, step.route]);

  useEffect(() => {
    if (!shouldShow || mode !== "tour" || pathname !== step.route) return;

    let attempts = 0;
    let retryTimer: number | undefined;
    let rectTimer: number | undefined;

    const updateTarget = () => {
      attempts += 1;
      const target = findVisibleTarget(step.selector);

      if (!target && attempts < 18) {
        retryTimer = window.setTimeout(updateTarget, 120);
        return;
      }

      if (!target) {
        setTargetRect(null);
        return;
      }

      target.scrollIntoView({ block: "center", behavior: "auto" });
      rectTimer = window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 220);
    };

    updateTarget();

    const handleResize = () => updateTarget();
    window.addEventListener("resize", handleResize);

    return () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      if (rectTimer) window.clearTimeout(rectTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [mode, pathname, shouldShow, step.route, step.selector]);

  const completeOnboarding = async () => {
    if (!profile) return false;

    setIsCompleting(true);
    setError("");

    try {
      const onboardingState = await completeRoleOnboarding(
        "brand_manager",
        BRAND_MANAGER_ONBOARDING_VERSION,
      );
      const nextOnboarding = {
        ...(profile.onboarding || {}),
        brand_manager: onboardingState,
      };

      setProfile({ ...profile, onboarding: nextOnboarding });
      setManualOpen(false);
      setDismissed(true);
      return true;
    } catch (err) {
      console.error("[BrandManagerOnboarding] complete error:", err);
      setError("Chưa thể lưu trạng thái hướng dẫn. Vui lòng thử lại.");
      return false;
    } finally {
      setIsCompleting(false);
    }
  };

  const startTour = () => {
    setError("");
    setTargetRect(null);
    pendingRouteRef.current = null;
    setCurrentStep(0);
    setMode("tour");
  };

  const closeForNow = () => {
    setDismissed(true);
    setManualOpen(false);
    setTargetRect(null);
    pendingRouteRef.current = null;
    setMode("intro");
  };

  const goToStep = (nextStep: number) => {
    setError("");
    setTargetRect(null);
    pendingRouteRef.current = null;
    setCurrentStep(clamp(nextStep, 0, tourSteps.length - 1));
  };

  const handleNext = async () => {
    if (isLastStep) {
      await completeOnboarding();
      return;
    }
    goToStep(currentStep + 1);
  };

  if (!shouldShow || !profile) return null;

  if (mode === "intro") {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
        <section className="w-full max-w-[780px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-modal)] p-5 shadow-2xl md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                Onboarding Brand Manager
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                Hướng dẫn quản lý thương hiệu
              </h2>
              <p className="mt-2 max-w-[640px] text-sm leading-6 text-[var(--color-text-secondary)]">
                Tour này đi sâu vào các trang Brand Manager cần dùng hằng ngày: Tổng quan, Insights, Lead Monitoring, Đội ngũ, Đề cập, Duyệt yêu cầu và Báo cáo. Khách hàng và Cảnh báo chỉ được giới thiệu nhanh vì thao tác xử lý thuộc nhân viên chuyên trách.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-bold text-[var(--color-brand)]">
              <span className="material-symbols-outlined text-base">business</span>
              {profile.brandName || profile.brandId || "Brand của bạn"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {introCards.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-brand)]">
                  {item.icon}
                </span>
                <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Lộ trình tour
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tourSteps.map((item, index) => (
                <span
                  key={`${item.route}-${item.selector}`}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    item.depth === "detail"
                      ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {index + 1}. {item.moduleLabel}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-error)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForNow}
              disabled={isCompleting}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={completeOnboarding}
              disabled={isCompleting}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Không hiện lại
            </button>
            <button
              type="button"
              onClick={startTour}
              disabled={isCompleting}
              className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Bắt đầu tour
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" />

      {targetRect && (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-[var(--color-brand)] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.46),0_0_0_6px_rgba(108,92,231,0.24)] transition-all"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      <section
        className="fixed rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-modal)] p-4 shadow-2xl md:p-5"
        style={tooltipStyle}
        aria-labelledby="brand-manager-tour-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                Bước {currentStep + 1}/{tourSteps.length}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                  step.depth === "detail"
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                    : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                }`}
              >
                {depthLabel(step.depth)}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {step.moduleLabel}
            </p>
            <h2
              id="brand-manager-tour-title"
              className="mt-1 text-lg font-bold text-[var(--color-text-primary)]"
            >
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeForNow}
            className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]"
            aria-label="Đóng hướng dẫn"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          {step.body}
        </p>

        <div className="mt-3 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/40 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Cách thao tác
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-primary)]">
            {step.actionHint}
          </p>
        </div>

        {pathname !== step.route && (
          <p className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            Đang mở trang {step.route}. Tour sẽ tiếp tục khi trang sẵn sàng.
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-error)]">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {tourSteps.map((item, index) => (
              <button
                key={`${item.route}-${item.selector}`}
                type="button"
                aria-label={`Đến bước ${index + 1}`}
                title={`${item.moduleLabel}: ${item.title}`}
                onClick={() => goToStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-7 bg-[var(--color-brand)]"
                    : item.depth === "detail"
                      ? "w-2 bg-[var(--color-border)]"
                      : "w-2 bg-[var(--color-text-muted)]/40"
                }`}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0 || isCompleting}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isCompleting}
              className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCompleting
                ? "Đang lưu..."
                : isLastStep
                  ? "Hoàn tất"
                  : pathname === step.route
                    ? "Tiếp tục"
                    : "Đang mở trang..."}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
