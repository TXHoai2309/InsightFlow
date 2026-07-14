"use client";

import React from "react";
import { LeadReportTrendPoint } from "@/lib/lead-report";

interface ReportPerformanceChartsProps {
  trendData: LeadReportTrendPoint[];
}

export function ReportPerformanceCharts({ trendData }: ReportPerformanceChartsProps) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 h-full shadow-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Chưa có dữ liệu xu hướng.</p>
      </div>
    );
  }

  // To make it look like the requested "Tuần 1, Tuần 2...", if data is grouped by day, we just use the 'day' label.
  // The user asked for "Biểu đồ hiệu suất theo thời gian" showing 4 metrics.
  
  const renderBars = (title: string, dataKey: keyof LeadReportTrendPoint, suffix: string, colorClass: string, isLowerBetter = false) => {
    // Find max value to scale the bars if it's not a percentage
    let maxVal = 100;
    if (suffix !== "%") {
      maxVal = Math.max(1, ...trendData.map(d => Number(d[dataKey]) || 0));
    }

    return (
      <div className="bg-gray-50 dark:bg-[#1a1826] rounded-xl p-5 border border-black/5 dark:border-white/5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="space-y-3">
          {trendData.slice(-4).map((point, idx) => {
            const val = Number(point[dataKey]) || 0;
            // For time (isLowerBetter), the progress bar is reversed visually or just scaled.
            let width = suffix === "%" ? val : (val / maxVal) * 100;
            if (isLowerBetter) width = 100 - width; // Just visual trick for speed

            return (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400 w-16 truncate text-xs font-semibold">{point.day}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-[#262338] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${colorClass} transition-all`} 
                    style={{ width: `${Math.max(2, width)}%` }}
                  ></div>
                </div>
                <span className="text-gray-900 dark:text-white font-bold w-12 text-right">
                  {val}{suffix}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 h-full shadow-lg">
      <div className="mb-6">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Biểu đồ hiệu suất theo thời gian</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Đánh giá độ ổn định của bạn qua từng kỳ báo cáo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBars("Lead xử lý", "contacted", "", "bg-indigo-500")}
        {renderBars("Tỷ lệ đúng SLA", "slaOnTimeRate", "%", "bg-emerald-500")}
        {renderBars("Tỷ lệ chuyển đổi", "converted", "%", "bg-purple-500")}
        {renderBars("Tốc độ phản hồi", "avgResponseMinutes", "p", "bg-teal-500", true)}
      </div>
    </div>
  );
}
