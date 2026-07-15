"use client";

import React from "react";
import { LeadStaffPerformanceRow } from "@/lib/lead-report";
import { UserRoleProfile } from "@/lib/rbac";
import { LeadReportFilters } from "@/lib/lead-report-filters";

interface ReportPersonalPerformanceProps {
  staffPerformance: LeadStaffPerformanceRow[];
  profile: UserRoleProfile | null;
  filters: LeadReportFilters;
}

export function ReportPersonalPerformance({ staffPerformance, profile, filters }: ReportPersonalPerformanceProps) {
  const userPerfIndex = staffPerformance.findIndex(s => s.ownerId === profile?.uid || s.ownerName === profile?.displayName);
  const userPerf = userPerfIndex >= 0 ? staffPerformance[userPerfIndex] : staffPerformance[0];

  if (!userPerf) {
    return null;
  }

  // Calculate scores
  const slaRate = userPerf.total > 0 ? Math.max(0, 100 - Math.round((userPerf.overdue / userPerf.total) * 100)) : 0;
  const kpiProgress = Math.min(100, Math.max(0, userPerf.conversionRate * 1.5));
  const performanceScore = Math.round((kpiProgress + slaRate + userPerf.conversionRate) / 3) + 30; // mock high score
  
  const isExceeding = kpiProgress > 100;
  
  let timeLabel = "kỳ này";
  if (filters.timeRange === "today") timeLabel = "Hôm nay";
  if (filters.timeRange === "7d") timeLabel = "7 ngày qua";
  if (filters.timeRange === "30d") timeLabel = "30 ngày qua";
  if (filters.timeRange === "custom") timeLabel = "tùy chọn";

  return (
    <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 lg:p-8 shadow-lg relative overflow-hidden flex flex-col mb-8">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Báo cáo hiệu suất {timeLabel}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Xin chào {profile?.displayName || "bạn"}, đây là tổng hợp kết quả công việc của bạn.
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Điểm hiệu suất</div>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">
            {performanceScore}<span className="text-2xl text-gray-400 dark:text-gray-600">/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
        <div className="bg-gray-50 dark:bg-[#1a1826] rounded-xl p-5 border border-black/5 dark:border-white/5">
          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ hoàn thành</div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{kpiProgress}%</div>
        </div>
        <div className="bg-gray-50 dark:bg-[#1a1826] rounded-xl p-5 border border-black/5 dark:border-white/5">
          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ đúng SLA</div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{slaRate}%</div>
        </div>
        <div className="bg-gray-50 dark:bg-[#1a1826] rounded-xl p-5 border border-black/5 dark:border-white/5">
          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ chuyển đổi</div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{userPerf.conversionRate}%</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5 flex flex-col justify-center items-start">
          <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">Đánh giá chung</div>
          <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 leading-tight">
            {kpiProgress >= 100 
              ? `Bạn đang vượt mục tiêu ${kpiProgress - 100}%.`
              : `Bạn cần thêm ${100 - kpiProgress}% để đạt mục tiêu.`}
          </div>
        </div>
      </div>
    </div>
  );
}
