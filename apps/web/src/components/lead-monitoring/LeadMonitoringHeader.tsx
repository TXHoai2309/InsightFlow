"use client";

import React, { useState } from "react";
import { Search, Bell, UserCircle } from "lucide-react";

export function LeadMonitoringHeader() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#C8C4D6] bg-[#FFFFFF] px-10 transition-all">
      <h1 className="font-sans text-[24px] font-bold text-[#1A1B20] leading-8">
        Brand Manager Workspace
      </h1>

      <div className="flex items-center gap-6">
        <div 
          className={`relative flex items-center h-10 transition-all duration-300 ${
            isFocused ? "w-80 scale-105" : "w-64"
          }`}
        >
          <div className="absolute left-3 text-[#787585]">
            <Search className="h-[18px] w-[18px]" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm leads..."
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="h-full w-full rounded-full bg-[#EEEDF4] pl-10 pr-4 text-[14px] text-[#1A1B20] placeholder-[#787585] outline-none transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-[#4234B6]"
          />
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#474554] hover:bg-[#F4F3FA] hover:text-[#4234B6] transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#BA1A1A]"></span>
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9E7EE] text-[#4234B6] hover:bg-[#D9DCE8] transition-colors">
          <UserCircle className="h-8 w-8" />
        </button>
      </div>
    </header>
  );
}
