"use client";

import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, RefreshCw, X } from "lucide-react";
import type { TourStep } from "./tourConfigs";

export interface TourTooltipProps {
  step: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  style: React.CSSProperties;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onSkipStep: () => void;
  onRetryTarget: () => void;
  onSizeChange: (width: number, height: number) => void;
  targetMissing?: boolean;
  waitingForAction?: boolean;
  nextRouteLabel?: string;
}

export function TourTooltip({
  step,
  currentStepIndex,
  totalSteps,
  style,
  onNext,
  onPrev,
  onSkip,
  onSkipStep,
  onRetryTarget,
  onSizeChange,
  targetMissing = false,
  waitingForAction = false,
  nextRouteLabel,
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const tooltip = tooltipRef.current;
    tooltip?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSkip();
        return;
      }
      if (event.key !== "Tab" || !tooltip) return;

      const focusable = Array.from(
        tooltip.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [onSkip]);

  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    const reportSize = () => {
      const rect = tooltip.getBoundingClientRect();
      onSizeChange(rect.width, rect.height);
    };
    reportSize();
    const observer = new ResizeObserver(reportSize);
    observer.observe(tooltip);
    return () => observer.disconnect();
  }, [onSizeChange, step.id, targetMissing]);

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      style={style}
      className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-brand-border)]/60 bg-[var(--color-bg-surface)] p-4 shadow-2xl transition-all duration-300 animate-fade-in dark:bg-slate-900"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-0.5 text-[11px] font-black text-[var(--color-brand)]">
            Bước {currentStepIndex + 1} / {totalSteps}
          </span>
          {waitingForAction && !targetMissing && (
            <span className="animate-pulse rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Cần thao tác
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)]"
          title="Thoát hướng dẫn (ESC)"
          aria-label="Thoát hướng dẫn"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <h3 className="text-sm font-black text-[var(--color-text-primary)]">{step.title}</h3>
        <p className="mt-1.5 text-xs font-medium leading-relaxed text-[var(--color-text-secondary)]">
          {step.body}
        </p>

        {targetMissing ? (
          <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Chức năng này chưa xuất hiện hoặc dữ liệu trang chưa tải xong. Bạn có thể thử lại hoặc bỏ riêng bước này.
          </div>
        ) : waitingForAction ? (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand-subtle)]/50 p-2.5 text-[11px] font-medium text-[var(--color-brand)]">
            <Lightbulb size={14} className="mt-0.5 shrink-0" />
            <span>Hãy thao tác trực tiếp trên phần được đánh dấu. Nút Tiếp không tự bấm hoặc thay đổi dữ liệu.</span>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          {step.skipLabel || "Bỏ qua hướng dẫn"}
        </button>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
            >
              <ChevronLeft size={14} />
              <span>{step.previousLabel || "Trước"}</span>
            </button>
          )}

          {targetMissing ? (
            <>
              <button
                type="button"
                onClick={onSkipStep}
                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-text-primary)]"
              >
                Bỏ bước
              </button>
              <button
                type="button"
                onClick={onRetryTarget}
                className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[var(--color-brand)] px-3.5 text-xs font-bold text-white"
              >
                <RefreshCw size={13} /> Thử lại
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={waitingForAction}
              className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[var(--color-brand)] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {waitingForAction
                  ? "Hãy thao tác"
                  : isLastStep
                    ? nextRouteLabel || step.completeLabel || "Hoàn tất"
                    : step.nextLabel || "Tiếp"}
              </span>
              {!isLastStep && !waitingForAction && <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
