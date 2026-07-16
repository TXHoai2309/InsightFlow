"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { LEAD_EMPLOYEE_TOUR_EVENT } from "@/components/onboarding/events";
import { completeRoleOnboarding } from "@/lib/onboarding";

const LEAD_EMPLOYEE_ONBOARDING_VERSION = "2026-07-lead-employee-tour-v2";

type TourMode = "intro" | "tour";

interface TourStep {
  route: string;
  selector: string;
  title: string;
  body: string;
  actionHint: string;
  prepare?: "open-first-lead" | "open-action-tab";
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const tourSteps: TourStep[] = [
  {
    route: "/leads",
    selector: '[data-tour="lead-stats-priority"]',
    title: "Bắt đầu từ lead ưu tiên",
    body: "Card này cho biết số lead cần xử lý ngay trong phạm vi của bạn.",
    actionHint: "Bấm card để mở nhóm lead cần ưu tiên trước.",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-view-tabs"]',
    title: "Chọn đúng nhóm công việc",
    body: "Quick view chia lead theo trạng thái: chưa phân công, chờ xử lý, đang xử lý và đã đóng.",
    actionHint: "Ưu tiên Chưa phân công hoặc Chờ xử lý, rồi xử lý lần lượt từng lead.",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-row-first"]',
    title: "Mở một lead cụ thể",
    body: "Dòng lead hiển thị khách hàng, nguồn, intent, SLA và lý do ưu tiên.",
    actionHint: "Bấm vào dòng lead để mở panel thao tác ở bên phải.",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-row-primary-action"]',
    title: "Dùng nút hành động chính",
    body: "Nút này thay đổi theo trạng thái lead: nhận xử lý, liên hệ hoặc ghi nhận kết quả.",
    actionHint: "Nếu lead chưa ai nhận, hãy nhận xử lý trước khi liên hệ khách.",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-detail-panel"]',
    title: "Làm việc trong panel xử lý",
    body: "Panel là nơi xem người phụ trách, nội dung, nguồn, kênh liên hệ và kết quả cần lưu.",
    actionHint: "Làm việc chủ yếu ở tab Xử lý để không bỏ sót bước.",
    prepare: "open-first-lead",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-detail-owner"]',
    title: "Kiểm tra người phụ trách",
    body: "Lead chưa phân công cần được nhận trước khi chăm sóc.",
    actionHint: "Nếu thấy nút Nhận xử lý, hãy bấm để khóa lead về bạn.",
    prepare: "open-action-tab",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-detail-contact-actions"]',
    title: "Liên hệ khách",
    body: "Mở Messenger, Zalo, điện thoại, email hoặc profile nếu hệ thống có dữ liệu.",
    actionHint: "Sau khi mở kênh liên hệ, lead sẽ cần ghi nhận kết quả.",
    prepare: "open-action-tab",
  },
  {
    route: "/leads",
    selector: '[data-tour="lead-detail-result-actions"]',
    title: "Ghi nhận kết quả",
    body: "Chọn kết quả sau khi đã liên hệ để lead không bị treo trong hàng chờ.",
    actionHint: "Nếu khách hẹn lại, chọn Hẹn lại và nhập ngày giờ follow-up.",
    prepare: "open-action-tab",
  },
];

const introCards = [
  {
    title: "Đi theo từng lead",
    icon: "leaderboard",
    text: "Chọn nhóm, mở lead, nhận xử lý rồi liên hệ khách.",
  },
  {
    title: "Không bỏ sót kết quả",
    icon: "task_alt",
    text: "Sau khi liên hệ, quay lại panel để lưu kết quả hoặc follow-up.",
  },
  {
    title: "Chỉ hiện lần đầu",
    icon: "visibility_off",
    text: "Tour tự động chỉ bật một lần. Sau này có thể mở lại bằng nút Hướng dẫn.",
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

function clickIfPresent(selector: string) {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return false;
  target.click();
  return true;
}

function openDetailsIfPresent(selector: string) {
  const target = document.querySelector<HTMLDetailsElement>(selector);
  if (!target) return false;
  target.open = true;
  return true;
}

function prepareStepTarget(step: TourStep) {
  if (!step.prepare) return;

  if (!findVisibleTarget('[data-tour="lead-detail-panel"]')) {
    clickIfPresent('[data-tour="lead-row-first"]');
  }

  if (step.prepare === "open-action-tab") {
    window.setTimeout(() => {
      clickIfPresent('[data-tour="lead-detail-tab-action"]');
      openDetailsIfPresent('[data-tour="lead-detail-extra-actions"]');
    }, 120);
  }
}

function getTooltipStyle(targetRect: TargetRect | null): CSSProperties {
  if (typeof window === "undefined" || !targetRect) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "min(420px, calc(100vw - 32px))",
    };
  }

  const width = Math.min(390, window.innerWidth - 32);
  const belowTop = targetRect.top + targetRect.height + 18;
  const aboveTop = targetRect.top - 230;
  const hasRoomBelow = belowTop + 230 < window.innerHeight;
  const top = hasRoomBelow ? belowTop : Math.max(16, aboveTop);
  const left = clamp(
    targetRect.left + targetRect.width / 2 - width / 2,
    16,
    window.innerWidth - width - 16,
  );

  return { top, left, width };
}

export function LeadEmployeeOnboarding() {
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
    profile?.onboarding?.lead_employee?.version === LEAD_EMPLOYEE_ONBOARDING_VERSION;

  const shouldShow = useMemo(() => {
    if (loading || dismissed) return false;
    if (!profile || profile.role !== "lead_employee") return false;
    if (profile.temporaryPasswordIssued) return false;
    return manualOpen || !hasCompletedCurrentVersion;
  }, [dismissed, hasCompletedCurrentVersion, loading, manualOpen, profile]);

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

    window.addEventListener(LEAD_EMPLOYEE_TOUR_EVENT, openTour);
    return () => window.removeEventListener(LEAD_EMPLOYEE_TOUR_EVENT, openTour);
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
    let timer: number | undefined;
    let resizeTimer: number | undefined;

    const updateTarget = () => {
      attempts += 1;
      prepareStepTarget(step);
      const target = findVisibleTarget(step.selector);

      if (!target && attempts < 20) {
        timer = window.setTimeout(updateTarget, 140);
        return;
      }

      if (!target) {
        setTargetRect(null);
        return;
      }

      target.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => {
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

    const handleResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(updateTarget, 120);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (resizeTimer) window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [mode, pathname, shouldShow, step]);

  const completeOnboarding = async () => {
    if (!profile) return false;

    setIsCompleting(true);
    setError("");

    try {
      const onboardingState = await completeRoleOnboarding(
        "lead_employee",
        LEAD_EMPLOYEE_ONBOARDING_VERSION,
      );
      const nextOnboarding = {
        ...(profile.onboarding || {}),
        lead_employee: onboardingState,
      };

      setProfile({ ...profile, onboarding: nextOnboarding });
      setManualOpen(false);
      setDismissed(true);
      return true;
    } catch (err) {
      console.error("[LeadEmployeeOnboarding] complete error:", err);
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

  const closeAndRemember = async () => {
    if (!manualOpen && !hasCompletedCurrentVersion) {
      await completeOnboarding();
      return;
    }

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
        <section className="w-full max-w-[720px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-2xl md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                Hướng dẫn lần đầu
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                Làm quen quy trình xử lý lead
              </h2>
              <p className="mt-2 max-w-[600px] text-sm leading-6 text-[var(--color-text-secondary)]">
                Tour này chỉ đi trên trang Khách hàng và tập trung vào hành động cần làm trong một ca xử lý.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-bold text-[var(--color-brand)]">
              <span className="material-symbols-outlined text-base">support_agent</span>
              {profile.brandName || profile.brandId || "Lead team"}
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

          {error && (
            <p className="mt-4 rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-error)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeAndRemember}
              disabled={isCompleting}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bỏ qua và không hiện lại
            </button>
            <button
              type="button"
              onClick={startTour}
              disabled={isCompleting}
              className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Bắt đầu hướng dẫn
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
            top: targetRect.top - 10,
            left: targetRect.left - 10,
            width: targetRect.width + 20,
            height: targetRect.height + 20,
          }}
        />
      )}

      <section
        className="fixed rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-2xl md:p-5"
        style={tooltipStyle}
        aria-labelledby="lead-employee-tour-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand)]">
              Bước {currentStep + 1}/{tourSteps.length}
            </p>
            <h2
              id="lead-employee-tour-title"
              className="mt-1 text-lg font-bold text-[var(--color-text-primary)]"
            >
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeAndRemember}
            disabled={isCompleting}
            className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
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
            Cần làm
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-primary)]">
            {step.actionHint}
          </p>
        </div>

        {!targetRect && (
          <p className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            Chưa tìm thấy đối tượng để khoanh vùng. Nếu danh sách đang trống, hãy đổi bộ lọc hoặc quay lại khi có lead mới.
          </p>
        )}

        {pathname !== step.route && (
          <p className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            Đang mở trang {step.route}.
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-error)]">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            {tourSteps.map((item, index) => (
              <button
                key={`${item.route}-${item.selector}`}
                type="button"
                aria-label={`Đến bước ${index + 1}`}
                onClick={() => goToStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-7 bg-[var(--color-brand)]"
                    : "w-2 bg-[var(--color-border)]"
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
                  : "Tiếp tục"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
