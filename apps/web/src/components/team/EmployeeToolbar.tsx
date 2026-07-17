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
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-[14px] text-gray-900 outline-none transition-all focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-[#6C5CE7] sm:w-auto"
        >
          <option value="all">Tất cả nghiệp vụ</option>
          <option value="crisis_employee">Xử lý khủng hoảng</option>
          <option value="lead_employee">Xử lý tiềm năng</option>
          <option value="dual_employee">Cả 2 nghiệp vụ</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-[#6C5CE7] sm:w-auto"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="disabled">Đã khóa</option>
        </select>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </button>
      </div>
    </div>
  );
}
