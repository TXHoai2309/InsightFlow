"use client";

import React from "react";
import type { StaffAccount } from "./types";

interface TeamStatsCardsProps {
  staff: StaffAccount[];
}

export function TeamStatsCards({ staff }: TeamStatsCardsProps) {
  const total = staff.length;
  const active = staff.filter((s) => !s.disabled).length;
  const inactive = staff.filter((s) => s.disabled).length;
  const crisisStaff = staff.filter((s) => (s.permissions || []).includes("alerts")).length;
  const leadStaff = staff.filter((s) => (s.permissions || []).includes("leads")).length;
  const dualStaff = staff.filter(
    (s) => (s.permissions || []).includes("alerts") && (s.permissions || []).includes("leads"),
  ).length;
  const operationString = `Crisis ${crisisStaff} | Lead ${leadStaff} | Cả hai ${dualStaff}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1B20] p-5 shadow-sm dark:shadow-none flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shrink-0">
            <i className="ti ti-users" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">Tổng nhân viên</p>
            <p className="text-[20px] font-bold text-gray-900 dark:text-white truncate">{total}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1B20] p-5 shadow-sm dark:shadow-none flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center text-lg shrink-0">
            <i className="ti ti-circle-check" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">Đang hoạt động</p>
            <p className="text-[20px] font-bold text-gray-900 dark:text-white truncate">{active}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1B20] p-5 shadow-sm dark:shadow-none flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-lg shrink-0">
            <i className="ti ti-lock" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">Đã khóa</p>
            <p className="text-[20px] font-bold text-gray-900 dark:text-white truncate">{inactive}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1B20] p-5 shadow-sm dark:shadow-none flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
            <i className="ti ti-shield-check" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">Nghiệp vụ xử lý</p>
            <p className="text-[14px] font-bold text-gray-900 dark:text-white truncate" title={operationString}>
              {operationString}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
