"use client";

/**
 * Header Component
 * Thanh header chính với search, simulation, notifications, user profile
 */

import React, { useState } from "react";

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-outline-variant flex justify-between items-center px-8 shadow-sm fixed top-0 left-64 right-0 z-30">
      {/* Search */}
      <div className="flex items-center bg-surface-container-low border border-outline-variant/60 rounded-full px-4 py-2.5 w-96">
        <span className="material-symbols-outlined text-outline">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm mention, bài viết..."
          className="bg-transparent border-none focus:ring-0 w-full ml-3 placeholder:text-outline/70 outline-none text-sm"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
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
            <div className="absolute right-0 top-12 w-80 bg-white border border-outline-variant rounded-lg shadow-lg z-50">
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
        <div className="flex items-center gap-3 pl-6 border-l border-outline-variant">
          <div className="text-right">
            <p className="font-bold text-sm text-on-surface">Minh Trần</p>
            <p className="text-xs text-on-surface-variant">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary-fixed-dim flex items-center justify-center font-bold text-primary">
            MT
          </div>
        </div>
      </div>
    </header>
  );
}
