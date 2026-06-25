"use client";

/**
 * MobileNav Component
 * Bottom navigation bar cho mobile — hiển thị các nav chính ở cuối màn hình
 */

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { href: "/dashboard", label: "nav.dashboard", icon: "dashboard" },
  { href: "/mentions", label: "nav.mentions", icon: "forum" },
  { href: "/alerts", label: "nav.alerts", icon: "notifications_active" },
  { href: "/leads", label: "nav.leads", icon: "leaderboard" },
  { href: "/reports", label: "nav.reports", icon: "assessment" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] shadow-lg">
      <div className="flex items-center justify-around px-1 py-2">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-[52px] ${
                isActive
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-all ${
                  isActive ? "scale-110" : ""
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium leading-none ${isActive ? "font-bold" : ""}`}>
                {t(item.label)}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[var(--color-brand)] mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
