"use client";

"use client";

/**
 * Header Component
 * Thanh header chính với search, simulation, notifications, user profile.
 * Thêm Dark Mode Toggle Button (Sun/Moon) với animation mượt mà.
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userName = user?.displayName || user?.email?.split("@")[0] || t("header.guest");
  const initials = getInitials(user?.displayName || userName);
  const isDark = theme === "dark";

  return (
    <header
      className="h-16 flex justify-between items-center px-4 md:px-8 fixed top-0 left-0 right-0 md:left-[240px] z-30 font-sans"
      style={{
        backgroundColor: "var(--color-bg-surface)",
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
          className="hidden md:flex items-center rounded-[10px] px-4 h-[44px] w-96 transition-all"
          style={{
            backgroundColor: "var(--color-bg-surface-raised)",
            border: "1.5px solid var(--color-border)",
          }}
          onFocus={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--color-brand)";
            el.style.boxShadow = "0 0 0 3px var(--color-brand-border)";
          }}
          onBlur={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--color-border)";
            el.style.boxShadow = "none";
          }}
        >
          <i className="ti ti-search text-[18px]" style={{ color: "var(--color-text-muted)" }}></i>
          <input
            type="text"
            placeholder={t("header.searchPlaceholder")}
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
      <div className="flex items-center gap-2 md:gap-4">
        {/* Simulation Controls — desktop only */}
        <div
          className="hidden md:flex items-center gap-2 rounded-[10px] px-3 h-[44px]"
          style={{
            backgroundColor: "var(--color-bg-surface-raised)",
            border: "1.5px solid var(--color-border)",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.08em] mr-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("header.simulation")}
          </span>
          <button
            onClick={() => alert("Triggered Hot Lead simulation")}
            className="px-3 py-1 text-white text-[12px] font-semibold rounded-[6px] transition-colors shadow-sm"
            style={{ backgroundColor: "var(--color-brand)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-brand-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-brand)")}
          >
            + Lead
          </button>
          <button
            onClick={() => alert("Triggered Crisis Alert simulation")}
            className="px-3 py-1 text-white text-[12px] font-semibold rounded-[6px] transition-colors shadow-sm"
            style={{ backgroundColor: "var(--color-error)" }}
          >
            + Alert
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full transition-colors duration-200 relative"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-brand-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            aria-label="Thông báo"
          >
            <i className="ti ti-bell text-[22px]"></i>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full hidden"></span>
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
                  {t("header.notifications")} (5)
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {[
                  { icon: "🔴", title: t("header.newLead") || "Lead mới", sub: t("header.fromHighlands") },
                  { icon: "🚨", title: t("header.crisisAlert"), sub: t("header.spikeDetected") },
                ].map((n, i) => (
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
          className="theme-toggle"
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          title={isDark ? "Chế độ sáng" : "Chế độ tối"}
        >
          <span className="theme-toggle-thumb">
            {isDark ? (
              /* Moon icon — dark mode active */
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            ) : (
              /* Sun icon — light mode active */
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM4.22 5.64a1 1 0 0 1 1.42-1.42l1.41 1.42a1 1 0 0 1-1.41 1.41L4.22 5.64zm12.72 12.72a1 1 0 0 1 1.41-1.41l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42zM3 11a1 1 0 0 1 0 2H1a1 1 0 0 1 0-2h2zm20 0a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2h2zM5.64 18.36a1 1 0 0 1-1.42 1.42L2.8 18.36a1 1 0 0 1 1.42-1.42l1.42 1.42zM18.36 5.64a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 1.42l-1.42 1.41z"/>
              </svg>
            )}
          </span>
        </button>

        {/* ── Language Toggle ────────────────────────────────── */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setLanguage("vi")}
            className="px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all"
            aria-pressed={language === "vi"}
            style={language === "vi" ? {
              backgroundColor: isDark ? "var(--color-brand)" : "#4648d4",
              color: "white",
            } : {
              backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#f0f3ff",
              color: isDark ? "var(--color-text-secondary)" : "#464554",
            }}
          >
            VI
          </button>
          <button
            onClick={() => setLanguage("en")}
            className="px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all"
            aria-pressed={language === "en"}
            style={language === "en" ? {
              backgroundColor: isDark ? "var(--color-brand)" : "#4648d4",
              color: "white",
            } : {
              backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#f0f3ff",
              color: isDark ? "var(--color-text-secondary)" : "#464554",
            }}
          >
            EN
          </button>
        </div>
        {false && (
        <button
          onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          title={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          aria-label={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          className="flex items-center gap-1.5 px-2.5 h-[34px] rounded-[8px] border font-bold text-[12px] transition-all duration-200 select-none"
          style={{
            backgroundColor: "var(--color-bg-surface-raised)",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-brand)";
            e.currentTarget.style.backgroundColor = "var(--color-brand-subtle)";
            e.currentTarget.style.color = "var(--color-brand)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.backgroundColor = "var(--color-bg-surface-raised)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>
            {language === "vi" ? "🇻🇳" : "🇬🇧"}
          </span>
          <span className="hidden sm:inline">
            {language === "vi" ? "VI" : "EN"}
          </span>
        </button>
        )}

        {/* User Profile */}
        <div
          className="flex items-center gap-2 md:gap-3 md:pl-4 md:border-l"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Tên — desktop only */}
          <div className="hidden md:block text-right">
            <p className="font-semibold text-[14px]" style={{ color: "var(--color-text-primary)" }}>
              {userName}
            </p>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              {user ? t("header.administrator") : t("header.guest")}
            </p>
          </div>
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center font-bold text-white text-[13px] cursor-pointer hover:scale-105 transition-transform shadow-sm">
            {initials}
          </div>
        </div>
      </div>

      {/* Mobile search bar slide-down */}
      {showSearch && (
        <div
          className="absolute top-16 left-0 right-0 p-3 md:hidden shadow-sm z-20"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            className="flex items-center rounded-[10px] px-4 h-[44px] transition-all"
            style={{
              backgroundColor: "var(--color-bg-surface-raised)",
              border: "1.5px solid var(--color-border)",
            }}
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
