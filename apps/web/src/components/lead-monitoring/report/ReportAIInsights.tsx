"use client";

import React from "react";
import { LeadReportData } from "@/lib/lead-report";
import { Check, AlertTriangle, Bot } from "lucide-react";

interface ReportAIInsightsProps {
  report: LeadReportData;
}

export function ReportAIInsights({ report }: ReportAIInsightsProps) {
  // We will generate the insights dynamically based on the report data
  const { kpis, sourceDistribution } = report;
  
  const insights = [];

  // Insight 1: Conversion rate
  if (kpis.conversionRate > 20) {
    insights.push({ type: "good", text: `Tỷ lệ chuyển đổi đạt mức ${kpis.conversionRate}%, cao hơn trung bình.` });
  } else {
    insights.push({ type: "warn", text: `Tỷ lệ chuyển đổi (${kpis.conversionRate}%) đang khá thấp, cần cải thiện kỹ năng chốt sale.` });
  }

  // Insight 2: SLA
  if (kpis.slaBreached > 0) {
    insights.push({ type: "warn", text: `Có ${kpis.slaBreached} khách hàng quá SLA cần được xử lý gấp.` });
  } else {
    insights.push({ type: "good", text: "Tuyệt vời, bạn không có khách hàng nào bị trễ SLA." });
  }

  // Insight 3: Top source
  const topSource = [...sourceDistribution].sort((a, b) => b.count - a.count)[0];
  if (topSource && topSource.count > 0) {
    insights.push({ type: "good", text: `Lead từ kênh ${topSource.label} đang chiếm ưu thế (${topSource.percentage}%).` });
  }

  // Insight 4: Follow-up
  if (kpis.followUpOverdue > 0) {
    insights.push({ type: "warn", text: `Tỷ lệ follow-up còn chậm, đang có ${kpis.followUpOverdue} khách bị quên lịch hẹn.` });
  } else {
    insights.push({ type: "good", text: "Tốc độ follow-up khách hàng rất tốt, duy trì nhé!" });
  }

  return (
    <div className="bg-white dark:bg-[#13111c] border border-gray-200 dark:border-[#262338] rounded-2xl p-6 h-full shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Bot className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Đánh giá hiệu suất</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {insight.type === "good" ? (
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
