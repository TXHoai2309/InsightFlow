"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboardData";
import { isPublicDemoExit, toDemoHref } from "@/lib/demo-navigation";
import { useAlertStore } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [navigationNotice, setNavigationNotice] = useState("");

  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  useEffect(() => {
    return () => {
      // Demo and the authenticated application share Zustand stores. Clear the
      // sample snapshot when the /demo layout is left so a previously signed-in
      // account can never render Demo records from a still-fresh client cache.
      useDashboardStore.setState({
        workspaces: [],
        mentions: [],
        alerts: [],
        leads: [],
        labelChangeRequests: [],
        isLoading: false,
        error: null,
      });
      useAlertStore.setState({
        rawAlerts: [],
        alerts: [],
        brands: [],
        lastFetchedAt: 0,
        isLoading: false,
        error: null,
      });
    };
  }, []);

  const handleDemoNavigation = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;

    const target = event.target as HTMLElement;
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.hasAttribute("download")) return;

    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    const currentHref = `${url.pathname}${url.search}${url.hash}`;
    const demoHref = toDemoHref(currentHref);
    if (demoHref) {
      if (demoHref === currentHref) return;
      // Rewrite the actual href before allowing modified clicks, middle clicks
      // or the browser context menu. This keeps "open in new tab" inside Demo.
      anchor.setAttribute("href", demoHref);
      const shouldHandleInRouter =
        event.type === "click" &&
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        anchor.target !== "_blank";
      if (!shouldHandleInRouter) return;
      event.preventDefault();
      event.stopPropagation();
      router.push(demoHref);
      return;
    }

    if (isPublicDemoExit(url.pathname)) return;

    // Unsupported authenticated routes are replaced with the Demo home even
    // for context-menu/new-tab navigation, so they cannot reveal a live
    // account that happens to be signed in in the same browser.
    anchor.setAttribute("href", "/demo");
    if (event.type !== "click" || event.button !== 0) return;

    // Shared manager widgets sometimes link to admin-only pages that do not
    // have a meaningful public demo. Keep visitors inside the demo instead of
    // unexpectedly sending them to the login screen.
    event.preventDefault();
    event.stopPropagation();
    setNavigationNotice("Tính năng quản trị này chỉ khả dụng sau khi đăng nhập. Bạn vẫn đang ở chế độ demo.");
    window.setTimeout(() => setNavigationNotice(""), 3500);
  };

  return (
    <div
      onAuxClickCapture={handleDemoNavigation}
      onClickCapture={handleDemoNavigation}
      onContextMenuCapture={handleDemoNavigation}
    >
      {navigationNotice ? (
        <div
          role="status"
          className="fixed right-4 top-20 z-[100] max-w-sm rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xl"
        >
          {navigationNotice}
        </div>
      ) : null}
      {children}
    </div>
  );
}
