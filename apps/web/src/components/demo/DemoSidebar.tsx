"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { resetDemoClientSession } from "@/lib/reset-demo-session";

interface NavItem {
  href: string;
  label: string;
  fallback: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/demo", label: "nav.dashboard", fallback: "Tổng quan", icon: "ti-layout-dashboard" },
  { href: "/demo/mentions", label: "nav.mentions", fallback: "Đề cập", icon: "ti-message-circle" },
  { href: "/demo/alerts", label: "nav.alerts", fallback: "Cảnh báo", icon: "ti-bell" },
  { href: "/demo/leads", label: "nav.leads", fallback: "Khách hàng", icon: "ti-chart-bar" },
  { href: "/demo/reports", label: "nav.reports", fallback: "Báo cáo", icon: "ti-file-analytics" },
];

export function DemoSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    onClose();
  }, [pathname]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`
          w-[240px] flex flex-col py-6 pr-4 shrink-0
          fixed h-screen left-0 top-0 z-40
          transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-center mb-4 relative">
          <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-300">
            <div className="relative w-[300px] h-[80px] overflow-hidden flex items-center justify-center">
              <img
                src={isDark ? "/logo.png" : "/logo-dark.png"}
                alt="InsightFlow Logo"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220px] max-w-none pointer-events-none"
                style={isDark ? undefined : { mixBlendMode: "multiply" }}
              />
            </div>
          </Link>
          <button
            className="md:hidden absolute right-4 top-2 p-2 rounded-full transition-colors duration-200"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onClose}
          >
            <i className="ti ti-x text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full px-4 py-[14px] text-left text-[14px] transition-colors duration-200 flex items-center rounded-r-[10px]"
                style={
                  isActive
                    ? {
                      backgroundColor: "var(--color-brand-subtle)",
                      borderLeft: "3px solid var(--color-brand)",
                      color: "var(--color-brand)",
                      fontWeight: "600",
                    }
                    : {
                      color: "var(--color-text-secondary)",
                      fontWeight: "500",
                      borderLeft: "3px solid transparent",
                    }
                }
              >
                <i className={`ti ${item.icon} text-[18px] mr-[10px]`}></i>
                <span className="flex-1">{t(item.label, item.fallback)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 px-4">
          <Link
            href="/#consultation"
            onClick={resetDemoClientSession}
            className="w-full py-2.5 rounded-lg border border-[#10B981] text-[#10B981] font-bold text-center block mb-4 hover:bg-[#10B981]/10 transition"
          >
            Thoát Demo
          </Link>
          <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-[12px] font-medium">Chế độ Demo (Dữ liệu mẫu)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
