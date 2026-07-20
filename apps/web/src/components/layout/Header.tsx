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
  isSidebarCollapsed?: boolean;
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

export function Header({ onMenuToggle, isSidebarCollapsed = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const isDemoMode = pathname.startsWith("/demo");
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
  const roleLabel = role === "brand_manager"
    ? t("header.roles.brand_manager", "Quản lý thương hiệu")
    : role
      ? getProfileRoleLabel(profile)
      : t("header.guest", "Khách");
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
    if (isDemoMode) {
      setNotifications((current) => (current.length === 0 ? current : []));
      return;
    }
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
  }, [isDemoMode, profile, scopedBrandKey]);

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
      className={`fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between px-4 font-sans transition-[left] duration-200 md:px-8 ${isSidebarCollapsed ? "md:left-[76px]" : "md:left-[240px]"}`}
      style={{
        backgroundColor: isDark ? "#1a1b1e" : "#ffffff",
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
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 md:gap-6">
        {!isDemoMode && (role === "brand_manager" || role === "crisis_employee" || role === "lead_employee") && (
          <button
            type="button"
            onClick={handleOpenGuide}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-2 py-2 text-[13px] font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-border)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)] md:px-3"
            title="Mở hướng dẫn thao tác"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span className="hidden md:inline">{t("header.guide", "Hướng dẫn")}</span>
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
            <>
              {/* Backdrop for mobile */}
              <div
                className="fixed inset-0 z-40 md:hidden"
                onClick={() => setShowNotifications(false)}
              />

              <div
                className="absolute right-0 md:-right-2 top-14 w-[340px] md:w-[380px] rounded-2xl z-50 overflow-hidden glass-panel flex flex-col"
                style={{
                  boxShadow: "var(--shadow-dropdown)",
                  transformOrigin: "top right",
                  animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                {/* Header */}
                <div className="px-5 py-4 flex justify-between items-center bg-[var(--color-bg-surface)]/50" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <h4 className="font-bold text-[15px] flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                    {t("header.notifications", "Thông báo")}
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-xs font-extrabold">
                        {unreadCount} {t("header.new", "mới")}
                      </span>
                    )}
                  </h4>
                  {unreadCount > 0 && (
                    <button className="text-[12px] font-semibold text-[var(--color-brand)] hover:underline transition-all">
                      {t("header.markAllRead", "Đánh dấu đã đọc")}
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[380px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-[var(--color-bg-surface-raised)] flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-[var(--color-text-muted)] text-[28px]">notifications_off</span>
                      </div>
                      <p className="text-[14px] font-semibold text-[var(--color-text-secondary)]">{t("header.emptyNotifications", "Không có thông báo nào")}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)] mt-1">{t("header.emptyNotificationsDesc", "Bạn đã xem hết tất cả thông báo.")}</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      // Determine icon and color based on notification type or title
                      let icon = "notifications";
                      let iconColor = "var(--color-brand)";
                      let iconBg = "var(--color-brand-subtle)";

                      if (n.type === "lead_assignment" || n.title.toLowerCase().includes("lead")) {
                        icon = "person_add";
                        iconColor = "#10B981"; // Emerald
                        iconBg = "rgba(16, 185, 129, 0.15)";
                      } else if (n.title.toLowerCase().includes("cảnh báo") || n.title.toLowerCase().includes("khẩn cấp") || n.title.toLowerCase().includes("crisis")) {
                        icon = "warning";
                        iconColor = "#EF4444"; // Red
                        iconBg = "rgba(239, 68, 68, 0.15)";
                      } else if (n.title.toLowerCase().includes("phương án") || n.title.toLowerCase().includes("duyệt")) {
                        icon = "fact_check";
                        iconColor = "#F59E0B"; // Amber
                        iconBg = "rgba(245, 158, 11, 0.15)";
                      }

                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left p-4 flex gap-4 transition-all duration-200 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-surface-raised)] relative group ${!n.read ? 'bg-[var(--color-brand-subtle)]/40' : ''}`}
                        >
                          {!n.read && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-brand)] rounded-r-md" />
                          )}

                          {/* Icon */}
                          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: iconBg, color: iconColor }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold text-[var(--color-text-primary)] leading-tight mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {language === "en" ? n.title.replace("Yêu cầu duyệt phương án:", "Approval Request:").replace("Yêu cầu sửa nhãn:", "Label Edit Request:").replace("Vụ việc", "Case") : n.title}
                            </p>
                            <p className="text-[12px] font-medium text-[var(--color-text-secondary)] leading-[1.4] mb-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {language === "en" ? n.message.replace("đã gửi phương án phản hồi cho", "sent a response plan for").replace("đã gửi yêu cầu sửa nhãn cho", "sent a label edit request for") : n.message}
                            </p>
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1 uppercase tracking-wider">
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                              {n.created_at ? new Date(n.created_at).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : t("header.justNow", "Vừa xong")}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div
                    className="p-3 text-center bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] transition-colors"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <button className="text-[13px] font-bold text-[var(--color-brand)] flex items-center justify-center gap-1 w-full py-1">
                      {t("header.viewAll", "Xem tất cả")} <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                    </button>
                  </div>
                )}

                <style>{`
                    @keyframes scaleIn {
                      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                      to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }
                  `}</style>
              </div>
            </>
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
    </header>
  );
}
