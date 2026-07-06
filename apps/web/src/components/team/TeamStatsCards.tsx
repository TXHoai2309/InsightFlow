"use client";
import React from "react";
import type { StaffAccount } from "./types";

interface TeamStatsCardsProps {
  staff: StaffAccount[];
}

export function TeamStatsCards({ staff }: TeamStatsCardsProps) {
  const total = staff.length;
  const active = staff.filter(s => !s.disabled).length;
  const inactive = staff.filter(s => s.disabled).length;
  
  // Map internal roles to friendly names
  const roleSet = new Set(staff.map(s => {
    if (s.role === "crisis_employee" || s.role === "crisis_staff") return "Crisis";
    if (s.role === "lead_employee" || s.role === "lead_staff") return "Lead";
    return "Staff";
  }));
  const roleString = Array.from(roleSet).join(" • ") || "Chưa có";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {/* Total */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">👥</div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 truncate">Tổng nhân viên</p>
            <p className="text-[20px] font-bold text-gray-900 truncate">{total}</p>
          </div>
        </div>
      </div>
      
      {/* Active */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg shrink-0">🟢</div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 truncate">Đang hoạt động</p>
            <p className="text-[20px] font-bold text-gray-900 truncate">{active}</p>
          </div>
        </div>
      </div>

      {/* Inactive */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg shrink-0">🔴</div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 truncate">Đã khóa</p>
            <p className="text-[20px] font-bold text-gray-900 truncate">{inactive}</p>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-center min-h-[90px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">🛡️</div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-500 truncate">Vai trò hệ thống</p>
            <p className="text-[14px] font-bold text-gray-900 truncate" title={roleString}>{roleString}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
