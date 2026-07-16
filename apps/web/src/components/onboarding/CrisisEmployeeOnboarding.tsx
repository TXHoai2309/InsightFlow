"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { CRISIS_EMPLOYEE_TOUR_EVENT } from "@/components/onboarding/events";
import { completeRoleOnboarding } from "@/lib/onboarding";

const CRISIS_EMPLOYEE_ONBOARDING_VERSION = "2026-07-crisis-employee-tour-v1";

type TourMode = "intro" | "tour";

interface TourStep {
  route: string;
  selector: string;
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
    route: "/alerts",
    selector: '[data-tour="alerts-queue-header"]',
    title: "Bắt đầu từ hàng chờ khủng hoảng",
    body:
      "Đây là màn hình chính của nhân viên xử lý khủng hoảng. Bạn dùng khu vực này để tìm sự vụ, giới hạn theo brand được phân công và nắm nhanh số lượng tình huống khẩn cấp.",
    actionHint: "Kiểm tra brand trước, sau đó ưu tiên các sự vụ có SLA gấp hoặc rủi ro cao.",
  },
  {
    route: "/alerts",
    selector: '[data-tour="alerts-filters"]',
    title: "Lọc theo mức độ và nguồn",
    body:
      "Bộ lọc giúp thu hẹp danh sách theo mức độ nghiêm trọng, nguồn phát sinh và các sự vụ đang thuộc về bạn.",
    actionHint: "Khi trực ca, hãy bắt đầu với Khẩn cấp hoặc Cao, rồi bật Của tôi để theo dõi các việc bạn đã nhận.",
  },
  {
    route: "/alerts",
    selector: '[data-tour="alerts-queue-list"]',
    title: "Đọc queue theo mức rủi ro",
    body:
      "Mỗi thẻ sự vụ hiển thị điểm rủi ro, tác giả, nền tảng, chủ đề, sắc thái và nội dung cần xử lý. Các thẻ được sắp xếp để bạn nhìn thấy việc quan trọng trước.",
    actionHint: "Đọc nội dung, kiểm tra nền tảng và chủ đề trước khi nhận xử lý hoặc escalate.",
  },
  {
    route: "/alerts",
    selector: '[data-tour="alerts-card-actions"]',
    title: "Nhận xử lý hoặc escalate",
    body:
      "Cụm nút này là nơi bạn nhận sự vụ, mở chi tiết hoặc escalate ngay nếu tình huống vượt ngưỡng xử lý thông thường.",
    actionHint: "Bấm Nhận xử lý để khóa sự vụ theo ca của bạn. Dùng Escalate ngay khi có nguy cơ pháp lý, viral mạnh hoặc ảnh hưởng an toàn.",
  },
  {
    route: "/mentions",
    selector: '[data-tour="mentions-filters"]',
    title: "Kiểm tra nguồn trên Mentions",
    body:
      "Mentions là nơi rà lại bài viết hoặc bình luận gốc theo brand, nền tảng, sắc thái, chủ đề và thời gian.",
    actionHint: "Khi cần xác minh bằng chứng, lọc về cùng brand và chủ đề rồi mở mention liên quan.",
  },
  {
    route: "/mentions",
    selector: '[data-tour="mentions-table"]',
    title: "Đọc ngữ cảnh trước khi phản hồi",
    body:
      "Bảng mentions chứa nội dung gốc, nguồn, tác giả và nhãn hiện tại. Đây là điểm kiểm chứng trước khi xử lý công khai hoặc ghi nhận kết quả.",
    actionHint: "Đọc đủ ngữ cảnh trước khi quyết định phản hồi hoặc escalate.",
  },
  {
    route: "/reports",
    selector: '[data-tour="reports-center"]',
    title: "Xem lại kết quả xử lý",
    body:
      "Reports giúp theo dõi bức tranh tổng hợp sau ca trực: số lượng đề cập, sắc thái, chủ đề nổi bật và dữ liệu dùng cho báo cáo.",
    actionHint: "Dùng Reports để tổng kết sau xử lý, không thay thế ghi chú xử lý trên từng sự vụ.",
  },
];

const introCards = [
  {
    title: "Tập trung vào khủng hoảng",
    icon: "emergency_home",
    text: "Tour chỉ mở các chức năng phục vụ phát hiện, nhận xử lý và ghi nhận sự vụ rủi ro.",
  },
  {
    title: "Ưu tiên theo mức độ",
    icon: "priority_high",
    text: "Bạn sẽ đi từ lọc mức độ, đọc queue, nhận xử lý, escalate và kiểm tra nguồn gốc.",
  },
  {
    title: "Có thể xem lại",
    icon: "help",
    text: "Sau khi hoàn tất, bạn vẫn có thể mở lại bằng nút Hướng dẫn trên thanh trên cùng.",
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

  const width = Math.min(430, window.innerWidth - 32);
  const belowTop = targetRect.top + targetRect.height + 16;
  const aboveTop = targetRect.top - 280;
  const hasRoomBelow = belowTop + 260 < window.innerHeight;
  const top = hasRoomBelow ? belowTop : Math.max(16, aboveTop);
  const left = clamp(
    targetRect.left + targetRect.width / 2 - width / 2,
    16,
    window.innerWidth - width - 16,
  );

  return { top, left, width };
}

export function CrisisEmployeeOnboarding() {
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
    profile?.onboarding?.crisis_employee?.version === CRISIS_EMPLOYEE_ONBOARDING_VERSION;

  const shouldShow = useMemo(() => {
    if (loading || dismissed) return false;
    if (!profile || profile.role !== "crisis_employee") return false;
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

    window.addEventListener(CRISIS_EMPLOYEE_TOUR_EVENT, openTour);
    return () => window.removeEventListener(CRISIS_EMPLOYEE_TOUR_EVENT, openTour);
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

    const updateTarget = () => {
      attempts += 1;
      const target = findVisibleTarget(step.selector);

      if (!target && attempts < 18) {
        timer = window.setTimeout(updateTarget, 120);
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

    const handleResize = () => updateTarget();
    window.addEventListener("resize", handleResize);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [mode, pathname, shouldShow, step.route, step.selector]);

  const completeOnboarding = async () => {
    if (!profile) return false;

    setIsCompleting(true);
    setError("");

    try {
      const onboardingState = await completeRoleOnboarding(
        "crisis_employee",
        CRISIS_EMPLOYEE_ONBOARDING_VERSION,
      );
      const nextOnboarding = {
        ...(profile.onboarding || {}),
        crisis_employee: onboardingState,
      };

      setProfile({ ...profile, onboarding: nextOnboarding });
      setManualOpen(false);
      setDismissed(true);
      return true;
    } catch (err) {
      console.error("[CrisisEmployeeOnboarding] complete error:", err);
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
        <section className="w-full max-w-[760px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-2xl md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand)]">
                Onboarding vai trò
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                Hướng dẫn thao tác cho Nhân viên xử lý khủng hoảng
              </h2>
              <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--color-text-secondary)]">
                Tour này tập trung vào quy trình đọc queue khủng hoảng, nhận xử lý, escalate, kiểm tra nguồn và xem báo cáo theo đúng quyền của bạn.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] px-3 py-2 text-sm font-bold text-[var(--color-error)]">
              <span className="material-symbols-outlined text-base">emergency</span>
              {profile.brandName || profile.brandId || "Crisis team"}
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
              Bắt đầu tour thao tác
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
        className="fixed rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-2xl md:p-5"
        style={tooltipStyle}
        aria-labelledby="crisis-employee-tour-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand)]">
              Bước {currentStep + 1}/{tourSteps.length}
            </p>
            <h2
              id="crisis-employee-tour-title"
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
            Đang mở trang {step.route}. Tour sẽ giữ nguyên bước hiện tại nếu trang tải chậm.
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
