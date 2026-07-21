"use client";

import React from "react";
import { Download, RefreshCw, Search, FileSpreadsheet } from "lucide-react";

interface EmployeeToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function EmployeeToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  onExport,
}: EmployeeToolbarProps) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
        <div className="relative w-full sm:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="staff-search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 py-3 pl-10 pr-4 text-[14px] text-gray-900 dark:text-white outline-none shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/30 dark:hover:border-white/20 focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-[#1A1B20] px-4 py-3 text-[14px] text-gray-700 dark:text-white outline-none shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/30 dark:hover:border-white/20 focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10 sm:w-auto"
        >
          <option value="all">Tất cả nghiệp vụ</option>
          <option value="crisis_employee">Xử lý khủng hoảng</option>
          <option value="lead_employee">Xử lý tiềm năng</option>
          <option value="dual_employee">Cả 2 nghiệp vụ</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-[#1A1B20] px-4 py-3 text-[14px] text-gray-700 dark:text-white outline-none shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/30 dark:hover:border-white/20 focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10 sm:w-auto"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="disabled">Đã khóa</option>
        </select>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-5 py-3 text-[14px] font-semibold text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-none transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-md active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-5 py-3 text-[14px] font-semibold text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-none transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-md active:scale-95"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </button>
      </div>
    </div>
  );
}
