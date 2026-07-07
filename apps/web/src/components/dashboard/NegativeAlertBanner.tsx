"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Alert, DashboardStats, DashboardFilters } from "@/types/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";

interface NegativeAlertBannerProps {
  alerts?: Alert[];
  stats?: DashboardStats;
  prevStats?: DashboardStats;
}

export function NegativeAlertBanner({ alerts = [], stats, prevStats }: NegativeAlertBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const setFilters = useDashboardStore((state) => state.setFilters);

  const handleNavigate = (link: string, filterUpdates?: Partial<DashboardFilters>) => {
    if (filterUpdates) {
      setFilters(filterUpdates);
    }
    router.push(link);
  };

  // Compute metrics from real data
  const dynamicAlerts = useMemo(() => {
    const totalMentions = stats?.total_mentions || 1;
    const negativeCount = stats?.negative_count || 0;
    const negativeRatio = ((negativeCount / totalMentions) * 100).toFixed(1);
    
    // Compare with prevStats
    const prevTotal = prevStats?.total_mentions || 1;
    const prevNegative = prevStats?.negative_count || 0;
    const prevRatio = ((prevNegative / prevTotal) * 100);
    const ratioTrend = (parseFloat(negativeRatio) - prevRatio).toFixed(1);
    
    // Tìm phàn nàn nhiều nhất từ alerts nếu có type liên quan (hoặc dùng tạm total negative)
    const complaintsCount = negativeCount;
    const complaintsTrend = prevNegative === 0 ? 0 : Math.round(((negativeCount - prevNegative) / prevNegative) * 100);
    
    // Đếm số bài viral (ví dụ có spike_multiplier > 1.5)
    const viralAlertsCount = alerts.filter(a => (a.spike_multiplier || 0) > 1.5).length;
    // We don't have prevAlerts easily available without passing them, so we mock or use 0 trend
    const viralTrend = 0; 
    
    // Tính NPS giả định từ net_sentiment
    const nps = stats?.net_sentiment || 0;
    const prevNps = prevStats?.net_sentiment || 0;
    const npsTrend = nps - prevNps;

    return [
      {
        title: t("dashboard.alerts.negativeRatio", "Tỷ lệ tiêu cực cao"),
        value: `${negativeRatio}%`,
        trend: `${Math.abs(parseFloat(ratioTrend))}%`, 
        isUp: parseFloat(ratioTrend) >= 0,
        sub: t("dashboard.alerts.vs7days", "so với 7 ngày trước"),
        icon: "sentiment_very_dissatisfied",
        link: "/mentions",
        filters: { sentiment: "negative" as const },
      },
      {
        title: t("dashboard.alerts.totalComplaints", "Tổng số phàn nàn"),
        value: complaintsCount.toString(),
        trend: `${Math.abs(complaintsTrend)}%`,
        isUp: complaintsTrend >= 0,
        sub: t("dashboard.alerts.aboutQuality", "về chất lượng đồ uống"),
        icon: "chat_bubble",
        link: "/mentions",
        filters: { sentiment: "negative" as const, topic: "quality" as const },
      },
      {
        title: t("dashboard.alerts.slowResponse", "Thời gian phản hồi chậm"),
        value: "5.6 giờ", // Needs real SLA data
        trend: "0 giờ", // placeholder until SLA data available
        isUp: false,
        sub: t("dashboard.alerts.avgResponse", "trung bình phản hồi"),
        icon: "schedule",
        link: "/mentions",
        filters: { urgency: "urgent" as const },
      },
      {
        title: t("dashboard.alerts.npsDrop", "NPS giảm mạnh"),
        value: nps.toString(),
        trend: `${Math.abs(npsTrend)} điểm`,
        isUp: npsTrend >= 0,
        sub: t("dashboard.alerts.vs7days", "so với 7 ngày trước"),
        icon: "thumb_down",
        link: "/mentions",
        filters: { sentiment: "negative" as const },
      },
      {
        title: t("dashboard.alerts.viralWarning", "Cảnh báo bài viết viral"),
        value: viralAlertsCount.toString(),
        trend: `${viralTrend} bài`,
        isUp: viralTrend >= 0,
        sub: t("dashboard.alerts.highReach", "tiếp cận lượng lớn"),
        icon: "warning",
        link: "/alerts",
        filters: {},
      },
    ];
  }, [alerts, stats, prevStats, t]);

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="font-bold text-[#E53E3E] text-sm md:text-[15px] flex items-center uppercase">
          <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          {t("dashboard.alerts.title", "ĐIỂM TIÊU CỰC NỔI BẬT (Cần ưu tiên xử lý)")}
        </h3>
        <Link
          href="/alerts"
          className="text-[13px] font-medium text-[#6D5FFD] hover:underline flex items-center gap-1"
        >
          {t("dashboard.alerts.viewAll", "Xem tất cả cảnh báo")} ({alerts.length}) &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {dynamicAlerts.map((alert, index) => (
          <div
            key={index}
            onClick={() => handleNavigate(alert.link, alert.filters)}
            className="cursor-pointer bg-[#FFF5F5] dark:bg-[#2D1616] rounded-xl p-4 shadow-sm border border-[#FED7D7] dark:border-[#5C2B2B] flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#FED7D7] dark:bg-[#742A2A] flex items-center justify-center text-[#C53030] dark:text-[#FC8181] shrink-0">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{alert.icon}</span>
              </div>
              <p className="text-[13px] font-semibold text-[#4A5568] dark:text-[#E2E8F0] leading-tight pt-1">
                {alert.title}
              </p>
            </div>
            
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[28px] font-bold text-[#C53030] dark:text-[#FC8181] leading-none">
                {alert.value}
              </span>
              {alert.trend && (
                <span className="text-[12px] font-bold text-[#C53030] dark:text-[#FC8181] flex items-center mb-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {alert.isUp ? "arrow_drop_up" : "arrow_drop_down"}
                  </span>
                  {alert.trend}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#718096] dark:text-[#A0AEC0]">
              {alert.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
