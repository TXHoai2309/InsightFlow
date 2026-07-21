"use client";
import React from "react";

interface TeamTabsProps {
  activeTab: "list" | "create";
  onChange: (tab: "list" | "create") => void;
}

export function TeamTabs({ activeTab, onChange }: TeamTabsProps) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-6 p-1.5 bg-gray-50/80 dark:bg-white/5 border border-[#E9E7EE] dark:border-white/10 rounded-2xl w-fit backdrop-blur-sm">
      <button
        onClick={() => onChange("list")}
        className={`px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-300 ${
          activeTab === "list"
            ? "bg-white dark:bg-[#1A1B20] text-[#6C5CE7] dark:text-[#9B8CFF] shadow-sm dark:shadow-none border border-[#E9E7EE] dark:border-white/10"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/10 border border-transparent"
        }`}
      >
        Danh sách nhân viên
      </button>
      <button
        onClick={() => onChange("create")}
        className={`px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-300 ${
          activeTab === "create"
            ? "bg-white dark:bg-[#1A1B20] text-[#6C5CE7] dark:text-[#9B8CFF] shadow-sm dark:shadow-none border border-[#E9E7EE] dark:border-white/10"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/10 border border-transparent"
        }`}
      >
        Thêm nhân viên
      </button>
    </div>
  );
}
