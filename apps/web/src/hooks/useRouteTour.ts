"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { calculateTooltipPosition } from "@/lib/tooltip-positioning";
import {
  getOnboardingState,
  setOnboardingState,
} from "@/lib/onboarding-storage";
import {
  ROUTE_TOUR_CONFIGS,
  type RouteTourConfig,
  type TourStep,
} from "@/components/onboarding/tourConfigs";

export const TOUR_ACTION_EVENT = "insightflow_tour_action";
export const ROUTE_TOUR_START_EVENT = "insightflow_start_route_tour";

export function dispatchTourAction(actionName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(TOUR_ACTION_EVENT, { detail: { action: actionName } }),
    );
  }
}

export function useRouteTour() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid || "guest";

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [activeConfig, setActiveConfig] = useState<RouteTourConfig | null>(null);

  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize pathname to base route key
  const getNormalizedRouteKey = useCallback((path: string | null): string => {
    if (!path) return "/dashboard";
    if (path.startsWith("/alerts") || path.startsWith("/demo/alerts")) return "/alerts";
    if (path.startsWith("/team")) return "/team";
    if (path.startsWith("/customers") || path.startsWith("/leads") || path.startsWith("/demo/leads")) return "/leads";
    if (path.startsWith("/reports")) return "/reports";
    if (path.startsWith("/admin/consultations")) return "/admin/consultations";
    if (path.startsWith("/admin/crawl-operations")) return "/admin/crawl-operations";
    if (path.startsWith("/labeling_tool")) return "/labeling_tool";
    if (path.startsWith("/admin/create-brand-manager")) return "/admin/brand-accounts";
    if (path.startsWith("/admin/brand-managers")) return "/admin/brand-accounts";
    if (path.startsWith("/admin/brand-accounts")) return "/admin/brand-accounts";
    if (path.startsWith("/admin/brands")) return "/admin/brands";
    if (path.startsWith("/admin")) return "/admin/brand-accounts";
    if (path === "/dashboard/lead-monitoring" || path.startsWith("/demo/lead-monitoring")) return "/dashboard/lead-monitoring";
    if (path === "/dashboard/insights" || path.startsWith("/demo/insights")) return "/dashboard/insights";
    if (path === "/demo" || path.startsWith("/demo/")) return "/demo";
    return "/dashboard";
  }, []);

  const currentRouteKey = getNormalizedRouteKey(pathname);

  // Locate target selector with smooth scroll and retry
  const locateTarget = useCallback((targetSelector: string) => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    setTargetRect(null);

    let attempts = 0;
    const maxAttempts = 60; // 60 * 150ms = 9.0s (Wait for heavy page / slow data loads)

    const checkElement = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          setTimeout(() => {
            const updatedRect = el.getBoundingClientRect();
            if (updatedRect.width > 0 && updatedRect.height > 0) {
              setTargetRect(updatedRect);
            }
          }, 100);
          if (retryTimerRef.current) {
            clearInterval(retryTimerRef.current);
            retryTimerRef.current = null;
          }
          return;
        }
      }

      attempts++;
      if (attempts >= maxAttempts) {
        if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        setTargetRect(null);
      }
    };

    checkElement();
    if (!retryTimerRef.current) {
      retryTimerRef.current = setInterval(checkElement, 150);
    }
  }, []);

  const startTour = useCallback((config: RouteTourConfig) => {
    setActiveConfig(config);
    setCurrentStepIndex(0);
    setIsOpen(true);
    if (config.steps.length > 0) {
      locateTarget(config.steps[0].target);
    }
  }, [locateTarget]);

  // Handle re-triggering from Header Guide button
  useEffect(() => {
    const handleStartEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ route?: string; force?: boolean }>;
      const targetRouteKey = customEvent.detail?.route ? getNormalizedRouteKey(customEvent.detail.route) : currentRouteKey;
      const config = ROUTE_TOUR_CONFIGS[targetRouteKey];

      if (config) {
        startTour(config);
      }
    };

    window.addEventListener(ROUTE_TOUR_START_EVENT, handleStartEvent);
    return () => window.removeEventListener(ROUTE_TOUR_START_EVENT, handleStartEvent);
  }, [currentRouteKey, getNormalizedRouteKey, startTour]);

  // Auto-start check on route change (only if not completed/skipped for this version)
  useEffect(() => {
    const config = ROUTE_TOUR_CONFIGS[currentRouteKey];
    if (!config) {
      setIsOpen(false);
      return;
    }

    const state = getOnboardingState(userId, config.routeKey, config.version);
    if (!state?.completed && !state?.skipped) {
      const timer = setTimeout(() => {
        startTour(config);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentRouteKey, userId, startTour]);

  // Target rect update on resize & scroll
  useEffect(() => {
    if (!isOpen || !activeConfig) return;

    const updateRect = () => {
      const step = activeConfig.steps[currentStepIndex];
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
  }, [isOpen, activeConfig, currentStepIndex]);

  const handleComplete = useCallback(() => {
    if (activeConfig) {
      setOnboardingState(userId, activeConfig.routeKey, activeConfig.version, {
        completed: true,
        completedAt: new Date().toISOString(),
      });

      // Handle nextRoute navigation if configured
      if (activeConfig.nextRoute) {
        router.push(activeConfig.nextRoute.href);
      }
    }
    setIsOpen(false);
    setActiveConfig(null);
  }, [activeConfig, userId, router]);

  const handleSkip = useCallback(() => {
    if (activeConfig) {
      setOnboardingState(userId, activeConfig.routeKey, activeConfig.version, {
        skipped: true,
        skippedAt: new Date().toISOString(),
      });
    }
    setIsOpen(false);
    setActiveConfig(null);
  }, [activeConfig, userId]);

  const lastAdvanceTimeRef = useRef<number>(0);

  const advanceStep = useCallback((nextIdx: number) => {
    const now = Date.now();
    if (now - lastAdvanceTimeRef.current < 450) {
      return; // Ignore rapid duplicate step advances within 450ms
    }
    lastAdvanceTimeRef.current = now;

    if (activeConfig && nextIdx < activeConfig.steps.length) {
      setCurrentStepIndex(nextIdx);
      locateTarget(activeConfig.steps[nextIdx].target);
    } else {
      handleComplete();
    }
  }, [activeConfig, locateTarget, handleComplete]);

  // Listen to interactive user actions
  useEffect(() => {
    if (!isOpen || !activeConfig) return;

    const currentStep = activeConfig.steps[currentStepIndex];
    if (!currentStep?.action) return;

    const handleTourAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string }>;
      const actionName = customEvent.detail?.action;

      if (
        actionName === currentStep.id ||
        actionName === currentStep.action?.type
      ) {
        advanceStep(currentStepIndex + 1);
      }
    };

    window.addEventListener(TOUR_ACTION_EVENT, handleTourAction);
    return () => window.removeEventListener(TOUR_ACTION_EVENT, handleTourAction);
  }, [isOpen, activeConfig, currentStepIndex, advanceStep]);

  const isInteractiveRoute =
    currentRouteKey === "/alerts" || currentRouteKey === "/leads" || currentRouteKey === "/customers";

  // Listen to direct clicks on target elements on screen to auto-advance step
  useEffect(() => {
    if (!isOpen || !activeConfig || !isInteractiveRoute) return;
    const currentStep = activeConfig.steps[currentStepIndex];
    if (!currentStep?.target) return;

    const targetEl = document.querySelector<HTMLElement>(currentStep.target);
    if (!targetEl) return;

    const handleDirectClick = (e: MouseEvent) => {
      const tooltip = document.querySelector('[role="dialog"]');
      if (tooltip && tooltip.contains(e.target as Node)) return;

      setTimeout(() => {
        advanceStep(currentStepIndex + 1);
      }, 180);
    };

    targetEl.addEventListener("click", handleDirectClick);
    return () => targetEl.removeEventListener("click", handleDirectClick);
  }, [isOpen, activeConfig, currentStepIndex, isInteractiveRoute, advanceStep]);

  // Helper to trigger the target element's click/input action
  const triggerStepAction = useCallback((step: TourStep) => {
    if (!step?.target) return;
    try {
      const el = document.querySelector<HTMLElement>(step.target);
      if (el) {
        // Skip calling .click() on navigation links in triggerStepAction to prevent duplicate page reloads;
        // client-side routing is handled smoothly by router.push in handleComplete.
        if (
          el.getAttribute("data-tour")?.startsWith("nav-") ||
          step.id.includes("nav") ||
          el.tagName === "A"
        ) {
          return;
        }

        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
          inputEl.focus();
          if (!inputEl.value) {
            const demoNote = "Đã liên hệ hỗ trợ khách hàng qua điện thoại, đã giải đáp thắc mắc.";
            const nativeSetter =
              Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value"
              )?.set ||
              Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              )?.set;
            if (nativeSetter) {
              nativeSetter.call(inputEl, demoNote);
            } else {
              inputEl.value = demoNote;
            }
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
        } else if (el.tagName === "SELECT") {
          const selectEl = el as HTMLSelectElement;
          if (selectEl.options.length > 1 && (!selectEl.value || selectEl.value === "all")) {
            selectEl.selectedIndex = 1;
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
          selectEl.focus();
        } else {
          const isExplicitClickable =
            el.tagName === "BUTTON" ||
            el.tagName === "A" ||
            el.getAttribute("role") === "button";
          if (isExplicitClickable) {
            el.click();
          }
        }
      }

      if (step.action?.type) {
        dispatchTourAction(step.action.type);
      }
    } catch (err) {
      console.warn("[RouteTour] Could not trigger step action:", err);
    }
  }, []);

  // Controls
  const handleNext = useCallback(() => {
    if (!activeConfig) return;
    const currentStep = activeConfig.steps[currentStepIndex];
    if (currentStep && isInteractiveRoute) {
      triggerStepAction(currentStep);
    }

    advanceStep(currentStepIndex + 1);
  }, [activeConfig, currentStepIndex, isInteractiveRoute, triggerStepAction, advanceStep]);

  const handlePrev = useCallback(() => {
    if (!activeConfig) return;
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      locateTarget(activeConfig.steps[prevIdx].target);
    }
  }, [activeConfig, currentStepIndex, locateTarget]);

  const currentStep = activeConfig?.steps[currentStepIndex] || null;

  const tooltipPosition = (currentStep && targetRect)
    ? calculateTooltipPosition({
        targetRect,
        preferredPlacement: currentStep.placement || "auto",
      })
    : null;

  return {
    isOpen,
    currentStep,
    currentStepIndex,
    totalSteps: activeConfig?.steps.length || 0,
    targetRect,
    tooltipPosition,
    activeConfig,
    handleNext,
    handlePrev,
    handleSkip,
    handleComplete,
  };
}
