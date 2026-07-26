"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { calculateTooltipPosition } from "@/lib/tooltip-positioning";
import {
  getSyncedOnboardingState,
  setSyncedOnboardingState,
} from "@/lib/onboarding-storage";
import {
  ROUTE_TOUR_CONFIGS,
  type RouteTourConfig,
} from "@/components/onboarding/tourConfigs";
import { isDemoPath, isPublicDemoExit, toDemoHref } from "@/lib/demo-navigation";

export const TOUR_ACTION_EVENT = "insightflow_tour_action";
export const ROUTE_TOUR_START_EVENT = "insightflow_start_route_tour";

type TargetStatus = "idle" | "searching" | "found" | "missing";

const ROUTE_ALIASES: Array<[RegExp, string]> = [
  [/^\/(?:demo\/)?alerts(?:\/|$)/, "/alerts"],
  [/^\/(?:demo\/)?team(?:\/|$)/, "/team"],
  [/^\/(?:demo\/)?(?:customers|leads)(?:\/|$)/, "/leads"],
  [/^\/(?:demo\/)?reports(?:\/|$)/, "/reports"],
  [/^\/(?:demo\/)?dashboard\/lead-monitoring(?:\/|$)/, "/dashboard/lead-monitoring"],
  [/^\/demo\/lead-monitoring(?:\/|$)/, "/dashboard/lead-monitoring"],
  [/^\/(?:demo\/)?dashboard\/insights(?:\/|$)/, "/dashboard/insights"],
  [/^\/demo\/insights(?:\/|$)/, "/dashboard/insights"],
  [/^\/admin\/consultations(?:\/|$)/, "/admin/consultations"],
  [/^\/admin\/crawl-operations(?:\/|$)/, "/admin/crawl-operations"],
  [/^\/labeling_tool(?:\/|$)/, "/labeling_tool"],
  [/^\/admin\/(?:create-brand-manager|brand-managers|brand-accounts)(?:\/|$)/, "/admin/brand-accounts"],
  [/^\/admin\/brands(?:\/|$)/, "/admin/brands"],
  [/^\/demo(?:\/|$)/, "/demo"],
  [/^\/dashboard(?:\/|$)/, "/dashboard"],
];

export function getNormalizedTourRoute(path: string | null): string | null {
  if (!path) return null;
  return ROUTE_ALIASES.find(([pattern]) => pattern.test(path))?.[1] || null;
}

export function dispatchTourAction(actionName: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOUR_ACTION_EVENT, { detail: { action: actionName } }),
  );
}

export function useRouteTour() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid || "guest";
  const currentRouteKey = getNormalizedTourRoute(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetStatus, setTargetStatus] = useState<TargetStatus>("idle");
  const [activeConfig, setActiveConfig] = useState<RouteTourConfig | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 380, height: 240 });

  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeLoadIdRef = useRef(0);

  const clearTargetTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const locateTarget = useCallback((targetSelector: string) => {
    clearTargetTimer();

    let attempts = 0;
    const maxAttempts = 60;
    const revealElement = (element: HTMLElement) => {
      // `auto` can still inherit `scroll-behavior: smooth` from the app shell.
      // `instant` keeps consecutive dashboard steps visually continuous.
      element.scrollIntoView({
        behavior: "instant" as ScrollBehavior,
        block: "center",
        inline: "nearest",
      });

      const updatedRect = element.getBoundingClientRect();
      setTargetRect(updatedRect);
      setTargetStatus("found");

      // Re-measure once more after React/CSS has settled without hiding the
      // tooltip in between the two steps.
      window.requestAnimationFrame(() => {
        const settledRect = element.getBoundingClientRect();
        if (settledRect.width > 0 && settledRect.height > 0) {
          setTargetRect(settledRect);
        }
      });
    };

    const findVisibleElement = () => {
      const selectors = targetSelector.split(",").map((s) => s.trim());
      for (const sel of selectors) {
        if (!sel) continue;
        const element = document.querySelector<HTMLElement>(sel);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return element;
          }
        }
      }
      return null;
    };

    // Most transitions happen between elements that are already mounted.
    // Resolve those synchronously so the overlay never disappears.
    const immediateElement = findVisibleElement();
    if (immediateElement) {
      revealElement(immediateElement);
      return;
    }

    setTargetRect(null);
    setTargetStatus("searching");

    const checkElement = () => {
      const element = findVisibleElement();
      if (element) {
        clearTargetTimer();
        revealElement(element);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        clearTargetTimer();
        setTargetStatus("missing");
      }
    };

    checkElement();
    retryTimerRef.current = setInterval(checkElement, 150);
  }, [clearTargetTimer]);

  const saveProgress = useCallback((
    config: RouteTourConfig,
    stepIndex: number,
    extra: Record<string, unknown> = {},
  ) => {
    void setSyncedOnboardingState(userId, config.routeKey, config.version, {
      completed: false,
      skipped: false,
      currentStepIndex: stepIndex,
      ...extra,
    });
  }, [userId]);

  const startTour = useCallback((
    config: RouteTourConfig,
    initialStep = 0,
    persist = true,
  ) => {
    const safeIndex = Math.min(Math.max(initialStep, 0), Math.max(config.steps.length - 1, 0));
    setActiveConfig(config);
    setCurrentStepIndex(safeIndex);
    setIsOpen(true);
    if (persist) saveProgress(config, safeIndex);
    if (config.steps[safeIndex]) locateTarget(config.steps[safeIndex].target);
  }, [locateTarget, saveProgress]);

  useEffect(() => {
    const handleStartEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ route?: string }>).detail;
      const routeKey = detail?.route
        ? getNormalizedTourRoute(detail.route)
        : currentRouteKey;
      const config = routeKey ? ROUTE_TOUR_CONFIGS[routeKey] : null;
      if (config) startTour(config, 0);
    };
    window.addEventListener(ROUTE_TOUR_START_EVENT, handleStartEvent);
    return () => window.removeEventListener(ROUTE_TOUR_START_EVENT, handleStartEvent);
  }, [currentRouteKey, startTour]);

  useEffect(() => {
    const config = currentRouteKey ? ROUTE_TOUR_CONFIGS[currentRouteKey] : null;
    const loadId = ++routeLoadIdRef.current;
    clearTargetTimer();

    if (!config) {
      setIsOpen(false);
      setActiveConfig(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      const state = await getSyncedOnboardingState(userId, config.routeKey, config.version);
      if (loadId !== routeLoadIdRef.current) return;
      if (!state?.completed && !state?.skipped) {
        startTour(config, state?.currentStepIndex || 0, false);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [clearTargetTimer, currentRouteKey, startTour, userId]);

  useEffect(() => {
    if (!isOpen || !activeConfig || targetStatus !== "found") return;
    const updateRect = () => {
      const step = activeConfig.steps[currentStepIndex];
      const element = step ? document.querySelector(step.target) : null;
      if (element) setTargetRect(element.getBoundingClientRect());
    };
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeConfig, currentStepIndex, isOpen, targetStatus]);

  const handleComplete = useCallback(() => {
    if (!activeConfig) return;
    void setSyncedOnboardingState(userId, activeConfig.routeKey, activeConfig.version, {
      completed: true,
      skipped: false,
      currentStepIndex: activeConfig.steps.length - 1,
      completedAt: new Date().toISOString(),
    });
    setIsOpen(false);
    setActiveConfig(null);
    clearTargetTimer();
    if (activeConfig.nextRoute) {
      const nextHref = isDemoPath(pathname)
        ? toDemoHref(activeConfig.nextRoute.href) ||
          (isPublicDemoExit(
            activeConfig.nextRoute.href.split(/[?#]/, 1)[0],
          )
            ? activeConfig.nextRoute.href
            : null)
        : activeConfig.nextRoute.href;

      // Shared Brand Manager tours can point to authenticated-only pages
      // (for example Team). Never let a public Demo tour fall through to
      // ProtectedRoute and unexpectedly display the Login screen.
      if (nextHref) router.push(nextHref);
    }
  }, [activeConfig, clearTargetTimer, pathname, router, userId]);

  const handleSkip = useCallback(() => {
    if (activeConfig) {
      void setSyncedOnboardingState(userId, activeConfig.routeKey, activeConfig.version, {
        skipped: true,
        completed: false,
        currentStepIndex,
        skippedAt: new Date().toISOString(),
      });
    }
    setIsOpen(false);
    setActiveConfig(null);
    clearTargetTimer();
  }, [activeConfig, clearTargetTimer, currentStepIndex, userId]);

  const advanceStep = useCallback((nextIndex: number) => {
    if (!activeConfig) return;
    if (nextIndex >= activeConfig.steps.length) {
      handleComplete();
      return;
    }
    setCurrentStepIndex(nextIndex);
    saveProgress(activeConfig, nextIndex);
    locateTarget(activeConfig.steps[nextIndex].target);
  }, [activeConfig, handleComplete, locateTarget, saveProgress]);

  const currentStep = activeConfig?.steps[currentStepIndex] || null;
  const currentActionSelector =
    currentStep?.action && "selector" in currentStep.action
      ? currentStep.action.selector
      : currentStep?.target;
  const waitingForAction = Boolean(
    currentStep?.action &&
    (currentStep.allowInteraction ?? true) &&
    currentActionSelector &&
    targetStatus === "found" &&
    typeof document !== "undefined" &&
    document.querySelector(currentActionSelector),
  );

  useEffect(() => {
    if (!isOpen || !currentStep || !waitingForAction || targetStatus !== "found") return;
    const element = currentActionSelector
      ? document.querySelector<HTMLElement>(currentActionSelector)
      : null;
    if (!element) return;

    let advanced = false;
    const finishAction = () => {
      if (advanced) return;
      advanced = true;
      window.setTimeout(() => advanceStep(currentStepIndex + 1), 180);
    };
    const eventNames: Array<keyof HTMLElementEventMap> =
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
        ? ["change", "input"]
        : ["click"];
    eventNames.forEach((name) => element.addEventListener(name, finishAction));

    const handleCustomAction = (event: Event) => {
      const actionName = (event as CustomEvent<{ action: string }>).detail?.action;
      if (actionName === currentStep.id || actionName === currentStep.action?.type) {
        finishAction();
      }
    };
    window.addEventListener(TOUR_ACTION_EVENT, handleCustomAction);
    return () => {
      eventNames.forEach((name) => element.removeEventListener(name, finishAction));
      window.removeEventListener(TOUR_ACTION_EVENT, handleCustomAction);
    };
  }, [advanceStep, currentActionSelector, currentStep, currentStepIndex, isOpen, targetStatus, waitingForAction]);

  const handleNext = useCallback(() => {
    if (!waitingForAction) advanceStep(currentStepIndex + 1);
  }, [advanceStep, currentStepIndex, waitingForAction]);

  const handlePrev = useCallback(() => {
    if (!activeConfig || currentStepIndex <= 0) return;
    const previousIndex = currentStepIndex - 1;
    setCurrentStepIndex(previousIndex);
    saveProgress(activeConfig, previousIndex);
    locateTarget(activeConfig.steps[previousIndex].target);
  }, [activeConfig, currentStepIndex, locateTarget, saveProgress]);

  const handleSkipStep = useCallback(() => {
    advanceStep(currentStepIndex + 1);
  }, [advanceStep, currentStepIndex]);

  const handleRetryTarget = useCallback(() => {
    if (currentStep) locateTarget(currentStep.target);
  }, [currentStep, locateTarget]);

  const handleTooltipSizeChange = useCallback((width: number, height: number) => {
    setTooltipSize((current) =>
      Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
        ? current
        : { width, height },
    );
  }, []);

  const tooltipPosition = currentStep
    ? targetStatus === "missing"
      ? {
          placement: "center" as const,
          style: {
            position: "fixed" as const,
            top: "50%",
            left: "50%",
            width: `${Math.min(380, Math.max(280, (typeof window !== "undefined" ? window.innerWidth : 420) - 32))}px`,
            maxHeight: "min(420px, calc(100vh - 32px))",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          },
        }
      : targetRect
        ? calculateTooltipPosition({
            targetRect,
            tooltipWidth: tooltipSize.width,
            tooltipHeight: tooltipSize.height,
            preferredPlacement: currentStep.placement || "auto",
          })
        : null
    : null;

  useEffect(() => () => clearTargetTimer(), [clearTargetTimer]);

  return {
    isOpen,
    currentStep,
    currentStepIndex,
    totalSteps: activeConfig?.steps.length || 0,
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
  };
}
