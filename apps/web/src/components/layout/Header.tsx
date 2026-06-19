"use client";

/**
 * Header Component
 * Thanh header chính với search, simulation, notifications, user profile
 * Hỗ trợ mobile: hamburger menu, search icon only, compact profile
 */

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();

  // Hàm lấy tên viết tắt (Initials) từ Full Name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userName = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const initials = getInitials(user?.displayName || userName);

  return (
    <header className="h-16 bg-white border-b border-outline-variant flex justify-between items-center px-4 md:px-8 shadow-sm fixed top-0 left-0 right-0 md:left-64 z-30">
      {/* Left: Hamburger (mobile) + Search (desktop) */}
      <div className="flex items-center gap-3">
        {/* Hamburger — chỉ hiện trên mobile */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-surface-container-low transition-all text-on-surface-variant"
          onClick={onMenuToggle}
          aria-label="Mở menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Search bar — desktop */}
        <div className="hidden md:flex items-center bg-surface-container-low border border-outline-variant/60 rounded-full px-4 py-2.5 w-96">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            placeholder="Tìm kiếm mention, bài viết..."
            className="bg-transparent border-none focus:ring-0 w-full ml-3 placeholder:text-outline/70 outline-none text-sm"
          />
        </div>

        {/* Search icon — mobile */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-surface-container-low transition-all text-on-surface-variant"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Tìm kiếm"
        >
          <span className="material-symbols-outlined text-xl">search</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-6">
        {/* Simulation Controls — chỉ hiện trên desktop */}
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low border border-outline-variant/80 rounded-lg px-3 py-1.5">
          <span className="text-xs font-bold text-on-surface-variant uppercase">
            Giả lập:
          </span>
          <button
            onClick={() => alert("Triggered Hot Lead simulation")}
            className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded hover:opacity-90 transition-all"
          >
            + Lead
          </button>
          <button
            onClick={() => alert("Triggered Crisis Alert simulation")}
            className="px-2.5 py-1 bg-error text-white text-xs font-bold rounded hover:opacity-90 transition-all"
          >
            + Alert
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all relative"
          >
            <span className="material-symbols-outlined text-2xl">
              notifications
            </span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full hidden"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 md:w-80 bg-white border border-outline-variant rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-outline-variant">
                <h4 className="font-bold text-sm">Thông báo mới (5)</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-outline-variant/50 hover:bg-surface-container-low cursor-pointer">
                  <p className="text-xs font-bold">🔴 Hot Lead mới</p>
                  <p className="text-xs text-on-surface-variant">
                    từ Highlands Coffee
                  </p>
                </div>
                <div className="p-3 border-b border-outline-variant/50 hover:bg-surface-container-low cursor-pointer">
                  <p className="text-xs font-bold">🚨 Cảnh báo khủng hoảng</p>
                  <p className="text-xs text-on-surface-variant">
                    Spike detected: 3.2x
                  </p>
                </div>
              </div>
              <div className="p-3 text-center border-t border-outline-variant">
                <button className="text-xs text-primary font-bold hover:underline">
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3 md:pl-6 md:border-l md:border-outline-variant">
          {/* Tên — chỉ hiện trên desktop */}
          <div className="hidden md:block text-right">
            <p className="font-bold text-sm text-on-surface">{userName}</p>
            <p className="text-xs text-on-surface-variant">
              {user ? "Administrator" : "Guest"}
            </p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-primary-container bg-primary-fixed-dim flex items-center justify-center font-bold text-primary uppercase text-sm cursor-pointer">
            {initials}
          </div>
        </div>
      </div>

      {/* Mobile search bar — slide down khi mở */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-outline-variant p-3 md:hidden shadow-md z-20">
          <div className="flex items-center bg-surface-container-low border border-outline-variant/60 rounded-full px-4 py-2.5">
            <span className="material-symbols-outlined text-outline text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm mention, bài viết..."
              className="bg-transparent border-none focus:ring-0 w-full ml-3 placeholder:text-outline/70 outline-none text-sm"
              autoFocus
            />
            <button onClick={() => setShowSearch(false)}>
              <span className="material-symbols-outlined text-outline text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
