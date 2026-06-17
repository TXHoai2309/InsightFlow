"use client";

/**
 * Sidebar Component
 * Điều hướng chính của ứng dụng
 */

import React from "react";
import Link from "next/link";
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
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/mentions", label: "Mentions", icon: "forum" },
  { href: "/alerts", label: "Alerts", icon: "notifications_active" },
  { href: "/leads", label: "Leads", icon: "leaderboard" },
  { href: "/reports", label: "Reports", icon: "assessment" },
  { href: "/settings/brand", label: "Brands", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-outline-variant flex flex-col py-6 px-4 fixed h-screen left-0 top-0 z-40">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 mb-8 px-2 hover:opacity-80 transition-all"
      >
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary text-2xl">
            query_stats
          </span>
        </div>
        <div>
          <h1 className="font-bold text-primary text-lg">InsightFlow</h1>
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
            AI Media Monitoring
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-r transition-all ${
                isActive
                  ? "text-primary font-bold border-r-4 border-primary bg-surface-container"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-3 pt-4 border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="flex-1 text-left font-medium">Đăng xuất</span>
        </button>

        <div className="bg-gradient-to-br from-primary-container to-secondary-container p-4 rounded-lg text-on-primary text-sm">
          <p className="font-bold mb-2">💡 Báo cáo sẵn sàng</p>
          <p className="text-xs mb-3 opacity-90">
            AI hoàn tất tổng hợp dữ liệu ngày hôm qua
          </p>
          <Link
            href="/reports"
            className="w-full inline-block py-2 bg-white text-primary font-bold rounded-lg hover:bg-opacity-95 text-xs transition-all text-center"
          >
            Xem báo cáo
          </Link>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs">System Active 24/7</span>
        </div>
      </div>
    </aside>
  );
}
