import React from "react";
import { useTranslation } from "react-i18next";

import Link from "next/link";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  isAlert?: boolean;
  isSuccess?: boolean;
  icon: string;
  href: string;
}

function MetricCard({ label, value, trend, trendPositive, isAlert, isSuccess, icon, href }: MetricCardProps) {
  const getIconColor = () => {
    if (isAlert) return "bg-red-50 dark:bg-red-500/10 text-red-500";
    if (isSuccess) return "bg-green-50 dark:bg-green-500/10 text-green-500";
    return "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400";
  };

  const getTextColor = () => {
    if (isAlert) return "text-red-600 dark:text-red-400";
    if (isSuccess) return "text-green-600 dark:text-green-400";
    return "text-gray-900 dark:text-white";
  };

  return (
    <Link href={href} className="bg-white dark:bg-[#1a1b1e] rounded-[16px] border border-[var(--color-border)] p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all h-full group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide group-hover:text-primary transition-colors">
          {label}
        </span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor()}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-2">
        <span className={`text-3xl font-bold tracking-tight ${getTextColor()}`}>
          {value}
        </span>
        {trend && (
          <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-md mb-1 ${
            trendPositive 
              ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" 
              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          }`}>
            <span className="material-symbols-outlined text-[14px] mr-0.5">
              {trendPositive ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend}
          </div>
        )}
      </div>
    </Link>
  );
}

interface KeyMetricsRowProps {
  metrics: {
    mentions: { value: number; trend: string; isPositive: boolean };
    negativeMentions: { value: number; trend: string };
    aiAlerts: { value: number; high: number };
    newLeads: { value: number; trend: string };
    unprocessedContacts: { value: number };
    monitoredCrises: { value: number };
  };
}

export function KeyMetricsRow({ metrics }: KeyMetricsRowProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
      <MetricCard 
        label={t("dashboard.metrics.mentionsToday", "Lượt đề cập")} 
        value={metrics.mentions.value.toLocaleString()} 
        trend={metrics.mentions.trend} 
        trendPositive={metrics.mentions.isPositive}
        icon="forum"
        href="/mentions?time_range=24h"
      />
      <MetricCard 
        label={t("dashboard.metrics.negativeMentions", "Tiêu cực")} 
        value={metrics.negativeMentions.value.toLocaleString()} 
        trend={metrics.negativeMentions.trend} 
        trendPositive={false}
        isAlert={metrics.negativeMentions.value > 0}
        icon="sentiment_dissatisfied"
        href="/mentions?sentiment=negative&time_range=24h"
      />
      <MetricCard 
        label={t("dashboard.metrics.aiAlerts", "Cảnh báo AI")} 
        value={metrics.aiAlerts.value} 
        trend={metrics.aiAlerts.high > 0 ? `${metrics.aiAlerts.high} Cao` : undefined}
        trendPositive={false}
        isAlert={metrics.aiAlerts.high > 0}
        icon="warning"
        href="/alerts"
      />
      <MetricCard 
        label={t("dashboard.metrics.newLeads", "Lead mới")} 
        value={metrics.newLeads.value} 
        trend={metrics.newLeads.trend}
        trendPositive={true}
        isSuccess={metrics.newLeads.value > 0}
        icon="person_add"
        href="/leads?status=new"
      />
      <MetricCard 
        label={t("dashboard.metrics.unassignedContacts", "Chưa phân công")} 
        value={metrics.unprocessedContacts.value} 
        isAlert={metrics.unprocessedContacts.value > 0}
        icon="contact_mail"
        href="/contacts?assigned_to=unassigned"
      />
      <MetricCard 
        label={t("dashboard.metrics.activeCrisis", "Khủng hoảng")} 
        value={metrics.monitoredCrises.value} 
        isAlert={metrics.monitoredCrises.value > 0}
        icon="emergency"
        href="/crisis"
      />
    </div>
  );
}
