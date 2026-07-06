"use client";
import React from "react";

interface TeamPageHeaderProps {
  onAddClick: () => void;
  showAddButton?: boolean;
}

export function TeamPageHeader({ onAddClick, showAddButton = true }: TeamPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Quản lý đội ngũ</h1>
        <p className="mt-1 text-[14px] text-gray-500">
          Quản lý tài khoản và phân công nhân viên thuộc Brand.
        </p>
      </div>
      {showAddButton && (
        <button
          onClick={onAddClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6C5CE7] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#5a4cdb] active:scale-[0.98] shadow-sm"
        >
          <span>➕</span> Thêm nhân viên
        </button>
      )}
    </div>
  );
}
