"use client";

import React from "react";
import { LeadReportBucket } from "@/lib/lead-report";

interface ReportSourceAnalysisProps {
  sources: LeadReportBucket[];
}

export function ReportSourceAnalysis({ sources }: ReportSourceAnalysisProps) {
  const sortedSources = [...sources].sort((a, b) => b.count - a.count).filter(s => s.count > 0);
  const maxCount = Math.max(1, ...sortedSources.map((s) => s.count));

  return (
    <div className="bg-[#13111c] border border-[#262338] rounded-2xl p-6 h-full shadow-lg">
      <div className="mb-6">
        <h2 className="text-lg font-black text-white">Nguồn khách hàng</h2>
        <p className="text-sm text-gray-400 mt-1">Phân bổ lead theo kênh tiếp cận.</p>
      </div>

      <div className="space-y-5">
        {sortedSources.length > 0 ? (
          sortedSources.map((source) => (
            <div key={source.key} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }}></span>
                  <span className="text-sm font-bold text-gray-200">{source.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white">{source.count}</span>
                  <span className="text-xs text-gray-500 ml-2 font-medium">({source.percentage}%)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-[#1a1826] rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                  style={{
                    width: `${Math.max(2, (source.count / maxCount) * 100)}%`,
                    backgroundColor: source.color,
                    boxShadow: `0 0 10px ${source.color}80`
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            Chưa có dữ liệu nguồn khách hàng.
          </div>
        )}
      </div>
    </div>
  );
}
