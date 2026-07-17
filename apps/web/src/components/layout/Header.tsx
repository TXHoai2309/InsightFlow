"use client";

/**
 * Header Component
 * Thanh header chính với search, simulation, notifications, user profile.
 * Thêm Dark Mode Toggle Button (Sun/Moon) với animation mượt mà.
 */

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  canPerformAction,
  getProfileRoleLabel,
} from "@/lib/rbac";
import {
  BRAND_MANAGER_TOUR_EVENT,
  CRISIS_EMPLOYEE_TOUR_EVENT,
  LEAD_EMPLOYEE_TOUR_EVENT,
} from "@/components/onboarding/events";
import { dbSecond } from "@/lib/firebase";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { collection, doc, limit, onSnapshot, query, updateDoc } from "firebase/firestore";

interface HeaderProps {
  onMenuToggle: () => void;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  alert_id?: string;
  brand?: string;
  created_at?: string;
  read?: boolean;
  recipient_role?: string;
  recipient_email?: string | null;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user, role, profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const brandManagerName = profile?.brandName
    ? `${profile.brandName} Brand Manager`
    : (user?.displayName || user?.email?.split("@")[0] || t("header.guest"));
  const userName = role === "brand_manager" ? brandManagerName : (user?.displayName || user?.email?.split("@")[0] || t("header.guest"));
  const roleLabel = role
    ? getProfileRoleLabel({ role, permissions: profile?.permissions })
    : t("header.guest");
  const initials = getInitials(role === "brand_manager" ? brandManagerName : (user?.displayName || userName));
  const isDark = theme === "dark";
  const handleOpenGuide = () => {
    const canViewLeads = canPerformAction(profile, "view_leads");
    const canViewAlerts = canPerformAction(profile, "view_crisis_queue");
    const prefersLeadGuide =
      pathname?.startsWith("/leads") ||
      (!pathname?.startsWith("/alerts") && profile?.defaultRoute?.startsWith("/leads"));
    const eventName = role === "brand_manager"
      ? BRAND_MANAGER_TOUR_EVENT
      : canViewLeads && canViewAlerts
        ? prefersLeadGuide
          ? LEAD_EMPLOYEE_TOUR_EVENT
          : CRISIS_EMPLOYEE_TOUR_EVENT
        : canViewLeads
          ? LEAD_EMPLOYEE_TOUR_EVENT
          : CRISIS_EMPLOYEE_TOUR_EVENT;
    window.dispatchEvent(new Event(eventName));
  };

  const scopedBrandKey = profile?.role === "admin" ? null : normalizeBrandName(profile?.brandName || profile?.brandId || "");

    useEffect(() => {
      if (!dbSecond || !profile) {
        setNotifications([]);
        return;
      }

      const notificationsQuery = query(collection(dbSecond, "notifications"), limit(100));
      return onSnapshot(notificationsQuery, (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<AppNotification, "id">;
          return { id: docSnap.id, ...data };
        });

        const filtered = rows
          .filter((item) => {
            const recipientRole = item.recipient_role === "crisis_staff"
              ? "crisis_employee"
              : item.recipient_role === "lead_staff"
                ? "lead_employee"
                : item.recipient_role;
            const roleMatches =
              !recipientRole ||
              recipientRole === profile.role ||
              (recipientRole === "crisis_employee" &&
                canPerformAction(profile, "view_crisis_queue")) ||
              (recipientRole === "lead_employee" &&
                canPerformAction(profile, "view_leads"));
            const emailMatches = !item.recipient_email || item.recipient_email === profile.email;
            const brandMatches =
              !scopedBrandKey ||
              !item.brand ||
              normalizeBrandName(item.brand) === scopedBrandKey;
            return roleMatches && emailMatches && brandMatches;
          })
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 20);

        setNotifications(filtered);
      }, (error) => {
        console.error("[Header] notifications snapshot error:", error);
        setNotifications([]);
      });
    }, [profile, scopedBrandKey]);

    const unreadCount = useMemo(() => {
      return notifications.filter((notification) => !notification.read).length;
    }, [notifications]);

    const handleNotificationClick = async (notification: AppNotification) => {
      try {
        if (!notification.read && dbSecond) {
          await updateDoc(doc(dbSecond, "notifications", notification.id), { read: true });
        }
      } catch (error) {
        console.warn("[Header] failed to mark notification read:", error);
      }

      setShowNotifications(false);
      if (notification.alert_id) {
        if (notification.type === "lead_assignment") {
          router.push(`/leads?leadId=${encodeURIComponent(notification.alert_id)}`);
        } else {
          router.push(`/alerts/${encodeURIComponent(notification.alert_id)}`);
        }
      }
    };

    return (
      <header
        className="h-[72px] flex justify-between items-center px-4 md:px-8 fixed top-0 left-0 right-0 md:left-[240px] z-30 font-sans bg-white dark:bg-[#1a1b1e]"
        style={{
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* Left: Hamburger (mobile) + Search (desktop) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 rounded-full transition-colors duration-200"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onMenuToggle}
            aria-label="Mở menu"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-brand-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <i className="ti ti-menu-2 text-2xl"></i>
          </button>

          {/* Search bar — desktop */}
          <div
            className="hidden md:flex items-center rounded-lg px-4 h-[44px] w-[400px] transition-all bg-[#F8F9FA] dark:bg-[#2A2B2F]"
          >
            <i className="ti ti-search text-[18px]" style={{ color: "var(--color-text-muted)" }}></i>
            <input
              type="text"
              placeholder="Tìm kiếm mention, bài viết..."
              className="bg-transparent border-none focus:ring-0 w-full ml-3 outline-none text-[14px]"
              style={{
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {/* Search icon — mobile */}
          <button
            className="md:hidden p-2 rounded-full transition-colors duration-200 ml-auto"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Tìm kiếm"
          >
            <i className="ti ti-search text-xl"></i>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 md:gap-6">
          {(role === "brand_manager" || role === "crisis_employee" || role === "lead_employee") && (
            <button
              type="button"
              onClick={handleOpenGuide}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-2 py-2 text-[13px] font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-border)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)] md:px-3"
              title="Mở hướng dẫn thao tác"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span className="hidden md:inline">Hướng dẫn</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full transition-colors duration-200 relative text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Thông báo"
            >
              <i className="ti ti-bell text-[22px]"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white dark:border-[#1a1b1e]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 top-12 w-72 md:w-80 rounded-[16px] z-50 overflow-hidden"
                style={{
                  backgroundColor: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-dropdown)",
                }}
              >
                <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <h4
                    className="font-semibold text-[14px]"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {t("header.notifications")} ({unreadCount})
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left p-3 cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-surface-raised)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <p className="text-[13px] font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                        <span>{n.title}</span>
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {n.message}
                      </p>
                    </button>
                  ))}
                  {[
                    { icon: "🔴", title: t("header.newLead") || "Lead mới", sub: t("header.fromHighlands") },
                    { icon: "🚨", title: t("header.crisisAlert"), sub: t("header.spikeDetected") },
                  ].slice(0, 0).map((n, i) => (
                    <div
                      key={i}
                      className="p-3 cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-surface-raised)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {n.icon} {n.title}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {n.sub}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="p-3 text-center"
                  style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-surface-raised)" }}
                >
                  <button
                    className="text-[13px] font-semibold hover:underline"
                    style={{ color: "var(--color-brand)" }}
                  >
                    {t("header.viewAll")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Dark Mode Toggle ─────────────────────────────────── */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isDark ? "Chế độ sáng" : "Chế độ tối"}
          >
            {isDark ? (
              <i className="ti ti-moon text-[22px]"></i>
            ) : (
              <i className="ti ti-sun text-[22px]"></i>
            )}
          </button>

          {/* ── Language Toggle ────────────────────────────────── */}
          <div className="flex gap-1 shrink-0 bg-[#F0F2F5] dark:bg-[#2A2B2F] p-1 rounded-full">
            <button
              onClick={() => setLanguage("vi")}
              className="px-4 py-1.5 text-[12px] font-bold rounded-full transition-all"
              style={language === "vi" ? {
                backgroundColor: "#6D5FFD",
                color: "white",
              } : {
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
              }}
            >
              VI
            </button>
            <button
              onClick={() => setLanguage("en")}
              className="px-4 py-1.5 text-[12px] font-bold rounded-full transition-all"
              style={language === "en" ? {
                backgroundColor: "#6D5FFD",
                color: "white",
              } : {
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
              }}
            >
              EN
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {/* Tên — desktop only */}
            <div className="hidden max-w-[280px] flex-col items-end md:flex">
              <span className="font-bold text-[14px] leading-tight" style={{ color: "var(--color-text-primary)" }}>
                {userName}
              </span>
              <span
                className="max-w-full truncate text-[12px] leading-tight text-gray-500"
                title={roleLabel}
              >
                {roleLabel}
              </span>
            </div>
            <div className="w-[40px] h-[40px] rounded-full bg-[#6D5FFD] flex items-center justify-center font-bold text-white text-[14px] cursor-pointer shadow-sm">
              {initials}
            </div>
          </div>
        </div>

        {/* Mobile search bar slide-down */}
        {showSearch && (
          <div
            className="absolute top-16 left-0 right-0 p-3 md:hidden shadow-sm z-20 bg-white dark:bg-[#1a1b1e]"
            style={{
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              className="flex items-center rounded-[10px] px-4 h-[44px] transition-all bg-[#F8F9FA] dark:bg-[#2A2B2F]"
            >
              <i className="ti ti-search text-[18px]" style={{ color: "var(--color-text-muted)" }}></i>
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                className="bg-transparent border-none focus:ring-0 w-full ml-3 outline-none text-[14px]"
                style={{ color: "var(--color-text-primary)" }}
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                style={{ color: "var(--color-text-muted)" }}
              >
                <i className="ti ti-x text-[18px]"></i>
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }
