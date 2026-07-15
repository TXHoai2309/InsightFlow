"use client";

import React from "react";
import { UserRoleProfile } from "@/lib/rbac";
import { LeadReportFilters } from "@/lib/lead-report-filters";
import { Calendar, Download, Share2, Star } from "lucide-react";

interface ReportHeroProps {
  profile: UserRoleProfile | null;
  filters: LeadReportFilters;
  updateFilter: (key: keyof LeadReportFilters, value: any) => void;
  onExport: (type: "excel" | "csv") => void;
  kpiScore: number;
}

export function ReportHero({ profile, filters, updateFilter, onExport, kpiScore }: ReportHeroProps) {
  const avatarUrl = profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || "User")}&background=random`;
  
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-[#1a1826] shadow-xl relative z-10 bg-white">
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-lg z-20 flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 fill-white" />
            {kpiScore}/100
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">
            Báo cáo hiệu suất xử lý khách hàng
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            {profile?.displayName || "Nhân viên Lead"}
            <span className="text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/5">
              {profile?.role === "admin" ? "Quản trị viên" : "Lead Processing Agent"}
            </span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xl">
            Theo dõi KPI cá nhân, tốc độ phản hồi, SLA và hiệu quả chuyển đổi khách hàng.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group">
          <select
            value={filters.timeRange}
            onChange={(e) => updateFilter("timeRange", e.target.value)}
            className="appearance-none bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] hover:border-indigo-500/50 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all cursor-pointer shadow-sm group-hover:bg-gray-50 dark:group-hover:bg-[#1a1826]"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="custom">Tùy chọn...</option>
          </select>
          <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <i className="ti ti-chevron-down text-[14px]"></i>
          </div>
        </div>

        <button
          onClick={() => onExport("csv")}
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1826] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Xuất CSV
        </button>

        <button
          onClick={() => onExport("excel")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-500/50"
        >
          <span className="material-symbols-outlined text-lg leading-none">table_view</span>
          Xuất Excel
        </button>
      </div>
    </div>
  );
}
