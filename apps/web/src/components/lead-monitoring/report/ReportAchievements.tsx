"use client";

import React from "react";
import { LeadReportData } from "@/lib/lead-report";
import { Trophy } from "lucide-react";

interface ReportAchievementsProps {
  report: LeadReportData;
}

export function ReportAchievements({ report }: ReportAchievementsProps) {
  // Mock data for achievements that aren't in the API yet (like streak and ranking)
  const tasksCompleted = report.kpis.total;
  const rank = 3; 
  const slaStreak = 14; 
  const convertedCount = report.kpis.converted;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-6 h-full shadow-lg relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
          <Trophy className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-black text-amber-900 dark:text-amber-400">Thành tích tháng này</h2>
      </div>

      <ul className="space-y-4 relative z-10">
        <li className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Hoàn thành <span className="text-amber-600 dark:text-amber-400">{tasksCompleted}</span> nhiệm vụ.</span>
        </li>
        <li className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Xếp hạng <span className="text-amber-600 dark:text-amber-400">#{rank}</span> trong nhóm.</span>
        </li>
        <li className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Chuỗi <span className="text-amber-600 dark:text-amber-400">{slaStreak} ngày</span> không trễ SLA.</span>
        </li>
        <li className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200"><span className="text-amber-600 dark:text-amber-400">{convertedCount}</span> khách hàng đã chuyển đổi.</span>
        </li>
      </ul>
    </div>
  );
}
