"use client";

import React, { useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Lightbulb } from "lucide-react";
import type { TourStep } from "./tourConfigs";

export interface TourTooltipProps {
  step: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  style: React.CSSProperties;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
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
  nextRouteLabel,
}: TourTooltipProps) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // ESC key to skip/close tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      style={style}
      className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-brand-border)]/60 bg-[var(--color-bg-surface)] p-4 shadow-2xl transition-all duration-300 animate-fade-in dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-0.5 text-[11px] font-black text-[var(--color-brand)]">
            Bước {currentStepIndex + 1} / {totalSteps}
          </span>
          {step.allowInteraction && (
            <span className="animate-pulse rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Thao tác thật
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)]"
          title="Thoát hướng dẫn (ESC)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Body with Internal Scroll */}
      <div className="flex-1 overflow-y-auto py-3">
        <h3 className="text-sm font-black text-[var(--color-text-primary)]">
          {step.title}
        </h3>
        <p className="mt-1.5 text-xs font-medium leading-relaxed text-[var(--color-text-secondary)]">
          {step.body}
        </p>

        {step.action && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand-subtle)]/50 p-2.5 text-[11px] font-medium text-[var(--color-brand)]">
            <Lightbulb size={14} className="shrink-0 mt-0.5" />
            <span>Hãy nhấp trực tiếp vào phần tử trên màn hình để tiếp tục.</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          {step.skipLabel || "Bỏ qua"}
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

          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[var(--color-brand)] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)]"
          >
            <span>
              {isLastStep
                ? nextRouteLabel || step.completeLabel || "Hoàn tất"
                : step.nextLabel || "Tiếp"}
            </span>
            {!isLastStep && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
