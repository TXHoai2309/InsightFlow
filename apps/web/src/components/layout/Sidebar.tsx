"use client";

/**
 * Sidebar Component
 * Điều hướng chính của ứng dụng — hỗ trợ mobile drawer + Dark Mode.
 */

import React, { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/contexts/ThemeContext";
import { canAccessPath } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  fallback: string;
  icon: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/admin/create-brand-manager", label: "nav.admin_create_brand", fallback: "Tạo tài khoản Brand", icon: "ti-user-plus" },
  { href: "/admin/brand-managers", label: "nav.admin_brand_list", fallback: "Danh sách Brand", icon: "ti-building-store" },
  { href: "/admin/consultations", label: "nav.admin_consultations", fallback: "Yêu cầu tư vấn", icon: "ti-headset" },
  { href: "/labeling_tool", label: "nav.labeling_tool", fallback: "Gắn nhãn dữ liệu", icon: "ti-tags" },

  { href: "/dashboard", label: "nav.dashboard", fallback: "Tổng quan", icon: "ti-layout-dashboard" },
  { href: "/operations", label: "nav.operations", fallback: "Vận hành", icon: "ti-layout-dashboard" },
  { href: "/team", label: "nav.team", fallback: "Quản lý đội ngũ", icon: "ti-users" },
  { href: "/mentions", label: "nav.mentions", fallback: "Đề cập", icon: "ti-message-circle" },
  { href: "/alerts", label: "nav.alerts", fallback: "Cảnh báo", icon: "ti-bell" },
  { href: "/leads", label: "nav.leads", fallback: "Khách hàng", icon: "ti-chart-bar" },
  { href: "/reports", label: "nav.reports", fallback: "Báo cáo", icon: "ti-file-analytics" },
];

const demoNavRoutes: Record<string, string> = {
  "/dashboard": "/demo",
  "/mentions": "/demo/mentions",
  "/alerts": "/demo/alerts",
  "/leads": "/demo/leads",
  "/reports": "/demo/reports",
};


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { profile, role } = useAuth();
  const isDark = theme === "dark";
  const isDemoMode = pathname.startsWith("/demo");
  const accessibleNavItems = navItems.filter(
    (item) =>
      canAccessPath(role, item.href, profile?.permissions) &&
      (!isDemoMode || Boolean(demoNavRoutes[item.href])),
  );

  // Đóng sidebar khi chuyển trang trên mobile
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Khoá scroll khi sidebar mở trên mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = async () => {
    if (isDemoMode) {
      router.push("/");
      return;
    }
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`
          w-[240px] flex flex-col py-6 shrink-0
          fixed h-screen left-0 top-0 z-40
          transition-[width,transform] duration-200 ease-in-out
          md:translate-x-0
          ${isCollapsed ? "md:w-[76px] md:pr-2" : "md:w-[240px] md:pr-4"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* Logo + Close button (mobile) */}
        <div className="relative mb-4 flex min-h-[80px] items-center justify-center">
          <Link href="/" className="flex items-center transition-transform duration-300 hover:scale-105" title="InsightFlow">
            {/* Container crop giống nhau cho cả 2 chế độ */}
            <div className={`relative h-[80px] w-[300px] items-center justify-center overflow-hidden ${isCollapsed ? "flex md:hidden" : "flex"}`}>
              <img
                src={isDark ? "/logo.png" : "/logo-dark.png"}
                alt="InsightFlow Logo"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] max-w-none -translate-x-1/2 -translate-y-1/2"
                style={isDark ? undefined : { mixBlendMode: "multiply" }}
              />
            </div>
            {isCollapsed && (
              <div className="relative hidden h-14 w-14 overflow-hidden rounded-2xl md:block" aria-label="InsightFlow">
                <img
                  src={isDark ? "/logo.png" : "/logo-dark.png"}
                  alt=""
                  className="pointer-events-none absolute left-[-4px] top-1/2 h-[160px] w-[160px] max-w-none -translate-y-1/2"
                  style={isDark ? undefined : { mixBlendMode: "multiply" }}
                />
              </div>
            )}
          </Link>

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`fixed top-1/2 z-50 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] shadow-md transition-[left,background-color,border-color,color] duration-200 hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)] md:flex ${isCollapsed ? "left-[76px]" : "left-[240px]"}`}
              aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
              title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            >
              <i className={`ti ${isCollapsed ? "ti-chevron-right" : "ti-chevron-left"} text-base`} aria-hidden="true" />
            </button>
          )}

          {/* Nút đóng — mobile only */}
          <button
            className="md:hidden absolute right-4 top-2 p-2 rounded-full transition-colors duration-200"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onClose}
            aria-label="Đóng menu"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-brand-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <i className="ti ti-x text-xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {accessibleNavItems.map((item) => {
            const navigationHref = isDemoMode ? demoNavRoutes[item.href] : item.href;
            const isActive =
              pathname === navigationHref ||
              (navigationHref !== "/demo" && pathname?.startsWith(`${navigationHref}/`));
            return (
              <Link
                key={item.href}
                href={navigationHref}
                data-tour={`nav-${item.href.replace(/^\//, "").replace(/\//g, "-") || "home"}`}
                className={`flex w-full items-center rounded-r-[10px] px-4 py-[14px] text-left text-[14px] transition-colors duration-200 ${isCollapsed ? "md:justify-center md:rounded-[10px] md:px-2" : ""}`}
                title={isCollapsed ? t(item.label, item.fallback) : undefined}
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
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-brand-subtle)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }
                }}
              >
                <i className={`ti ${item.icon} mr-[10px] text-[18px] ${isCollapsed ? "md:mr-0" : ""}`}></i>
                <span className={`flex-1 ${isCollapsed ? "md:hidden" : ""}`}>{t(item.label, item.fallback)}</span>
                {item.badge && item.badge > 0 && !isCollapsed && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full text-white font-bold ml-2"
                    style={{ backgroundColor: "var(--color-brand)" }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div
          className={`mt-auto space-y-3 pl-4 pt-4 ${isCollapsed ? "md:pl-0" : ""}`}
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-r-[10px] border-l-[3px] border-transparent px-4 py-[14px] text-left text-[14px] font-medium transition-colors duration-200 ${isCollapsed ? "md:justify-center md:rounded-[10px] md:border-l-0 md:px-2" : ""}`}
            title={isCollapsed ? t("nav.logout", "Đăng xuất") : undefined}
            style={{ color: "var(--color-error)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-error-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <i className={`ti ti-logout mr-[10px] text-[18px] ${isCollapsed ? "md:mr-0" : ""}`}></i>
            <span className={`flex-1 text-left font-medium ${isCollapsed ? "md:hidden" : ""}`}>{t("nav.logout", "Đăng xuất")}</span>
          </button>


          {/* System Status */}
          <div
            className={`flex items-center gap-2 px-3 py-2 ${isCollapsed ? "md:justify-center" : ""}`}
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span className={`text-[12px] font-medium ${isCollapsed ? "md:hidden" : ""}`}>{t("sidebar.systemActive", "Hệ thống Hoạt động 24/7")}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
