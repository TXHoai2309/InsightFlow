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
    <header className="h-16 bg-white border-b border-[#E2E4F0] flex justify-between items-center px-4 md:px-8 fixed top-0 left-0 right-0 md:left-[240px] z-30 font-sans">
      {/* Left: Hamburger (mobile) + Search (desktop) */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Hamburger — chỉ hiện trên mobile */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-[#F3F4FF] transition-colors duration-200 text-[#4A4A6A]"
          onClick={onMenuToggle}
          aria-label="Mở menu"
        >
          <i className="ti ti-menu-2 text-2xl"></i>
        </button>

        {/* Search bar — desktop */}
        <div className="hidden md:flex items-center bg-[#F7F8FC] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-4 h-[44px] w-96 focus-within:border-[#6C63FF] focus-within:ring-[3px] focus-within:ring-[#6C63FF]/12 transition-all">
          <i className="ti ti-search text-[#9898B0] text-[18px]"></i>
          <input
            type="text"
            placeholder="Tìm kiếm mention, bài viết..."
            className="bg-transparent border-none focus:ring-0 w-full ml-3 placeholder:text-[#9898B0] outline-none text-[14px] text-[#4A4A6A]"
          />
        </div>

        {/* Search icon — mobile */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-[#F3F4FF] transition-colors duration-200 text-[#4A4A6A] ml-auto"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Tìm kiếm"
        >
          <i className="ti ti-search text-xl"></i>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-6">
        {/* Simulation Controls — chỉ hiện trên desktop */}
        <div className="hidden md:flex items-center gap-2 bg-[#F7F8FC] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-3 h-[44px]">
          <span className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em] mr-1">
            Giả lập:
          </span>
          <button
            onClick={() => alert("Triggered Hot Lead simulation")}
            className="px-3 py-1 bg-[#6C63FF] text-white text-[12px] font-semibold rounded-[6px] hover:bg-[#5A52D5] transition-colors shadow-sm"
          >
            + Lead
          </button>
          <button
            onClick={() => alert("Triggered Crisis Alert simulation")}
            className="px-3 py-1 bg-[#EF4444] text-white text-[12px] font-semibold rounded-[6px] hover:bg-red-600 transition-colors shadow-sm"
          >
            + Alert
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-[#4A4A6A] hover:bg-[#F3F4FF] p-2 rounded-full transition-colors duration-200 relative"
          >
            <i className="ti ti-bell text-[22px]"></i>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full hidden"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 md:w-80 bg-white border border-[#E2E4F0] rounded-[16px] shadow-[0_2px_12px_rgba(108,99,255,0.07)] z-50 overflow-hidden">
              <div className="p-4 border-b border-[#E2E4F0]">
                <h4 className="font-semibold text-[14px] text-[#1A1A2E]">Thông báo mới (5)</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-[#E2E4F0] hover:bg-[#F3F4FF] cursor-pointer transition-colors">
                  <p className="text-[13px] font-semibold text-[#1A1A2E]">🔴 Hot Lead mới</p>
                  <p className="text-[12px] text-[#4A4A6A] mt-0.5">
                    từ Highlands Coffee
                  </p>
                </div>
                <div className="p-3 border-b border-[#E2E4F0] hover:bg-[#F3F4FF] cursor-pointer transition-colors">
                  <p className="text-[13px] font-semibold text-[#1A1A2E]">🚨 Cảnh báo khủng hoảng</p>
                  <p className="text-[12px] text-[#4A4A6A] mt-0.5">
                    Spike detected: 3.2x
                  </p>
                </div>
              </div>
              <div className="p-3 text-center border-t border-[#E2E4F0] bg-[#F7F8FC]">
                <button className="text-[13px] text-[#6C63FF] font-semibold hover:underline">
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3 md:pl-6 md:border-l md:border-[#E2E4F0]">
          {/* Tên — chỉ hiện trên desktop */}
          <div className="hidden md:block text-right">
            <p className="font-semibold text-[14px] text-[#1A1A2E]">{userName}</p>
            <p className="text-[12px] text-[#9898B0]">
              {user ? "Quản trị viên" : "Guest"}
            </p>
          </div>
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center font-bold text-white text-[13px] cursor-pointer hover:scale-105 transition-transform shadow-sm">
            {initials}
          </div>
        </div>
      </div>

      {/* Mobile search bar — slide down khi mở */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#E2E4F0] p-3 md:hidden shadow-sm z-20">
          <div className="flex items-center bg-[#F7F8FC] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-4 h-[44px] focus-within:border-[#6C63FF] focus-within:ring-[3px] focus-within:ring-[#6C63FF]/12 transition-all">
            <i className="ti ti-search text-[#9898B0] text-[18px]"></i>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none focus:ring-0 w-full ml-3 placeholder:text-[#9898B0] outline-none text-[14px] text-[#4A4A6A]"
              autoFocus
            />
            <button onClick={() => setShowSearch(false)} className="text-[#9898B0] hover:text-[#4A4A6A]">
              <i className="ti ti-x text-[18px]"></i>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
