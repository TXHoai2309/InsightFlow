"use client";
import React from "react";

interface TeamTabsProps {
  activeTab: "list" | "create";
  onChange: (tab: "list" | "create") => void;
}

export function TeamTabs({ activeTab, onChange }: TeamTabsProps) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-6 p-1 bg-gray-100/80 border border-gray-200/60 rounded-[14px] w-fit">
      <button
        onClick={() => onChange("list")}
        className={`px-5 py-2 rounded-xl text-[14px] font-semibold transition-all ${
          activeTab === "list"
            ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent"
        }`}
      >
        Danh sách nhân viên
      </button>
      <button
        onClick={() => onChange("create")}
        className={`px-5 py-2 rounded-xl text-[14px] font-semibold transition-all ${
          activeTab === "create"
            ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent"
        }`}
      >
        Thêm nhân viên
      </button>
    </div>
  );
}
