"use client";

import React from "react";
import { useRouteTour, dispatchTourAction, ROUTE_TOUR_START_EVENT } from "@/hooks/useRouteTour";
import { TourOverlay } from "./TourOverlay";
import { TourTooltip } from "./TourTooltip";

export { dispatchTourAction, ROUTE_TOUR_START_EVENT };

export function RouteTour() {
  const {
    isOpen,
    currentStep,
    currentStepIndex,
    totalSteps,
    targetRect,
    targetStatus,
    tooltipPosition,
    activeConfig,
    waitingForAction,
    handleNext,
    handlePrev,
    handleSkip,
    handleSkipStep,
    handleRetryTarget,
    handleTooltipSizeChange,
  } = useRouteTour();

  if (
    !isOpen ||
    !currentStep ||
    !tooltipPosition ||
    targetStatus === "idle" ||
    targetStatus === "searching"
  ) return null;

  return (
    <>
      {targetRect ? (
        <TourOverlay
          targetRect={targetRect}
          allowInteraction={currentStep.allowInteraction ?? true}
        />
      ) : (
        <div className="fixed inset-0 z-[9985] bg-slate-950/40" />
      )}
      <TourTooltip
        step={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        style={tooltipPosition.style}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onSkipStep={handleSkipStep}
        onRetryTarget={handleRetryTarget}
        onSizeChange={handleTooltipSizeChange}
        targetMissing={targetStatus === "missing"}
        waitingForAction={waitingForAction}
        nextRouteLabel={activeConfig?.nextRoute?.label}
      />
    </>
  );
}
