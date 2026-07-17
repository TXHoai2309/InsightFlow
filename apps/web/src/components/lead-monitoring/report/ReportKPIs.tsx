"use client";

import React from "react";
import { LeadReportData } from "@/lib/lead-report";

interface ReportKPIsProps {
  report: LeadReportData;
}

export function ReportKPIs({ report }: ReportKPIsProps) {
  const kpis = report.kpis;
  
  // Try to find "processing" and "skipped" from pipeline if available, otherwise mock or default
  const processingCount = report.pipeline.find(p => p.key === "processing")?.count || 0;
  const skippedCount = report.pipeline.find(p => p.key === "skipped")?.count || 0;

  const cards = [
    { label: "Tổng lead được giao", value: kpis.total, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Đã liên hệ", value: kpis.contacted, color: "text-blue-600 dark:text-blue-400" },
    { label: "Đang xử lý", value: processingCount, color: "text-amber-600 dark:text-amber-400" },
    { label: "Chuyển đổi thành công", value: kpis.converted, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Lead quá SLA", value: kpis.slaBreached, color: "text-rose-600 dark:text-rose-400" },
    { label: "Lead bị bỏ qua", value: skippedCount, color: "text-gray-500 dark:text-gray-400" },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Kết quả công việc</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 line-clamp-1" title={card.label}>
              {card.label}
            </p>
            <h3 className={`text-2xl font-black ${card.color}`}>
              {card.value}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
