"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboardData";
import { isPublicDemoExit, toDemoHref } from "@/lib/demo-navigation";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [navigationNotice, setNavigationNotice] = useState("");

  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  const handleDemoNavigation = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target as HTMLElement;
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    const currentHref = `${url.pathname}${url.search}${url.hash}`;
    const demoHref = toDemoHref(currentHref);
    if (demoHref) {
      if (demoHref === currentHref) return;
      event.preventDefault();
      event.stopPropagation();
      router.push(demoHref);
      return;
    }

    if (isPublicDemoExit(url.pathname)) return;

    // Shared manager widgets sometimes link to admin-only pages that do not
    // have a meaningful public demo. Keep visitors inside the demo instead of
    // unexpectedly sending them to the login screen.
    event.preventDefault();
    event.stopPropagation();
    setNavigationNotice("Tính năng quản trị này chỉ khả dụng sau khi đăng nhập. Bạn vẫn đang ở chế độ demo.");
    window.setTimeout(() => setNavigationNotice(""), 3500);
  };

  return (
    <div onClickCapture={handleDemoNavigation}>
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
