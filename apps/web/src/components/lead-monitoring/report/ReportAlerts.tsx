"use client";

import React from "react";
import { LeadReportData } from "@/lib/lead-report";
import { AlertOctagon, Flame, ArrowRight, ArrowDownRight, ArrowUpRight, Megaphone } from "lucide-react";
import Link from "next/link";

interface ReportAlertsProps {
  report: LeadReportData;
}

export function ReportAlerts({ report }: ReportAlertsProps) {
  const { kpis, detailRows, sourceDistribution } = report;

  const vipUnresponded = detailRows.filter(r => r.intent === "hot" && r.responseMinutes === null).length;
  
  // Find top source
  const topSource = [...sourceDistribution].sort((a, b) => b.count - a.count)[0];
  const topSourceName = topSource ? topSource.label : "Facebook";

  // Mock trend since we don't have historical data in this object
  const conversionTrend = kpis.conversionRate > 20 ? "+5%" : "-10%";
  const isTrendDown = conversionTrend.startsWith("-");

  const alerts = [
    {
      icon: AlertOctagon,
      iconColor: "text-rose-400",
      bgColor: "bg-rose-500/10",
      title: `${kpis.slaBreached} khách hàng quá SLA`,
      desc: "Cần xử lý ngay để tránh bị phạt KPI.",
      actionText: "Xem danh sách",
      link: "#lead-table"
    },
    {
      icon: Flame,
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      title: `${vipUnresponded} khách VIP chưa phản hồi`,
      desc: "Khách hàng Hot đang chờ được liên hệ.",
      actionText: "Phản hồi ngay",
      link: "/leads?view=priority"
    },
    {
      icon: Megaphone,
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      title: `${topSourceName} tạo nhiều lead nhất`,
      desc: "Nguồn khách hàng chính trong kỳ này.",
      actionText: "Xem phân tích",
      link: "#source-analysis"
    },
    {
      icon: isTrendDown ? ArrowDownRight : ArrowUpRight,
      iconColor: isTrendDown ? "text-amber-400" : "text-emerald-400",
      bgColor: isTrendDown ? "bg-amber-500/10" : "bg-emerald-500/10",
      title: `Tỷ lệ chuyển đổi ${isTrendDown ? "giảm" : "tăng"} ${conversionTrend.replace("-", "").replace("+", "")}`,
      desc: "So với kỳ báo cáo trước đó.",
      actionText: "Chi tiết",
      link: "#trend-chart"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-rose-500 rounded-full inline-block"></span>
        Điểm nghẽn cần chú ý
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alerts.map((alert, idx) => (
          <div key={idx} className="bg-white dark:bg-[#13111c] border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between group hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors shadow-lg">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${alert.bgColor} flex items-center justify-center border border-black/5 dark:border-white/5`}>
                  <alert.icon className={`w-4 h-4 ${alert.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.title}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-4">
                {alert.desc}
              </p>
            </div>
            <Link 
              href={alert.link}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 uppercase tracking-wider w-fit group-hover:gap-2 transition-all"
            >
              {alert.actionText}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
