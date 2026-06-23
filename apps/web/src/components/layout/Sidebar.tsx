"use client";

/**
 * Sidebar Component
 * Điều hướng chính của ứng dụng — hỗ trợ mobile drawer
 */

import React, { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: "ti-layout-dashboard" },
  { href: "/mentions", label: "nav.mentions", icon: "ti-message-circle" },
  { href: "/alerts", label: "nav.alerts", icon: "ti-bell" },
  { href: "/leads", label: "nav.leads", icon: "ti-chart-bar" },
  { href: "/reports", label: "nav.reports", icon: "ti-file-analytics" },
  { href: "/settings/brand", label: "nav.brands", icon: "ti-settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

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
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Backdrop overlay — chỉ hiện trên mobile khi sidebar mở */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`
          w-[240px] bg-white border-r border-[#E2E4F0] flex flex-col py-6 pr-4 shrink-0
          fixed h-screen left-0 top-0 z-40
          transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo + Close button (mobile) */}
        <div className="flex items-center justify-center mb-4 relative">
          <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-300">
            <div className="relative w-[300px] h-[80px] overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                alt="InsightFlow Logo"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220px] max-w-none mix-blend-multiply pointer-events-none"
              />
            </div>
          </Link>

          {/* Nút đóng — chỉ hiện trên mobile */}
          <button
            className="md:hidden absolute right-4 top-2 p-2 rounded-full hover:bg-[#F3F4FF] transition-colors duration-200 text-[#4A4A6A]"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            <i className="ti ti-x text-xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full px-4 py-[14px] text-left text-[14px] transition-colors duration-200 flex items-center rounded-r-[10px] ${isActive
                  ? "bg-[#EEF0FF] border-l-[3px] border-[#6C63FF] text-[#6C63FF] font-semibold"
                  : "text-[#4A4A6A] font-medium border-l-[3px] border-transparent hover:bg-[#F3F4FF]"
                  }`}
              >
                <i className={`ti ${item.icon} text-[18px] mr-[10px]`}></i>
                <span className="flex-1">{t(item.label)}</span>
                {item.badge && item.badge > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#6C63FF] text-white font-bold ml-2">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-3 pt-4 border-t border-[#E2E4F0] pl-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-[14px] text-left text-[14px] transition-colors duration-200 flex items-center rounded-r-[10px] text-[#EF4444] font-medium border-l-[3px] border-transparent hover:bg-[#FEF2F2]"
          >
            <i className="ti ti-logout text-[18px] mr-[10px]"></i>
            <span className="flex-1 text-left font-medium">{t("nav.logout")}</span>
          </button>

          <div className="bg-gradient-to-br from-[#6C63FF] to-[#9B8FF8] p-4 rounded-[12px] text-white text-sm shadow-[0_4px_14px_rgba(108,99,255,0.35)]">
            <p className="font-bold mb-2 flex items-center gap-2"><i className="ti ti-bulb text-lg"></i> {t("sidebar.reportReadyTitle")}</p>
            <p className="text-[12px] mb-3 opacity-90">
              {t("sidebar.reportReadyDesc")}
            </p>
            <Link
              href="/reports"
              className="w-full inline-block py-2 bg-white text-[#6C63FF] font-semibold rounded-[8px] hover:bg-opacity-95 text-[12px] transition-colors duration-200 text-center"
            >
              {t("sidebar.viewReport")}
            </Link>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 text-[#9898B0]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span className="text-[12px] font-medium">{t("sidebar.systemActive")}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
