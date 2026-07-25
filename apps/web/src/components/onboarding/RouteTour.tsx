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
    tooltipPosition,
    activeConfig,
    handleNext,
    handlePrev,
    handleSkip,
  } = useRouteTour();

  if (!isOpen || !currentStep || !targetRect || !tooltipPosition) return null;

  return (
    <>
      <TourOverlay
        targetRect={targetRect}
        allowInteraction={currentStep.allowInteraction ?? true}
      />
      <TourTooltip
        step={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        style={tooltipPosition.style}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        nextRouteLabel={activeConfig?.nextRoute?.label}
      />
    </>
  );
}
