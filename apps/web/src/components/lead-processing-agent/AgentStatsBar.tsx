"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import type { EmployeeOperationsStats } from "@/lib/employee-operations";

interface AgentStatsBarProps {
  stats: EmployeeOperationsStats;
}

export function AgentStatsBar({ stats }: AgentStatsBarProps) {
  const { t } = useTranslation();

  const cards = [
    {
      title: t("agentDashboard.stats.todo"),
      value: stats.todo.toLocaleString("vi-VN"),
      icon: CheckCircle2,
      detail: t("agentDashboard.stats.urgentCount", {
        count: stats.urgent,
        defaultValue: `${stats.urgent} việc cần ưu tiên`,
      }),
      detailColor: stats.urgent > 0 ? "text-rose-500" : "text-emerald-500",
      iconColor: "text-indigo-500 dark:text-indigo-400",
      bgIcon: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      title: t("agentDashboard.stats.processing"),
      value: stats.processing.toLocaleString("vi-VN"),
      icon: Clock,
      detail: t("agentDashboard.stats.fromSupabase", {
        defaultValue: "Đồng bộ từ Supabase",
      }),
      detailColor: "text-slate-500 dark:text-gray-400",
      iconColor: "text-blue-500 dark:text-blue-400",
      bgIcon: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: t("agentDashboard.stats.waiting"),
      value: stats.waiting.toLocaleString("vi-VN"),
      icon: UserPlus,
      detail: t("agentDashboard.stats.waitingDetail", {
        count: stats.waiting,
        defaultValue: `${stats.waiting} việc đang chờ phản hồi`,
      }),
      detailColor: "text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500 dark:text-amber-400",
      bgIcon: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      title: t("agentDashboard.stats.overdue", { defaultValue: "Đã quá hạn" }),
      value: stats.overdue.toLocaleString("vi-VN"),
      icon: AlertCircle,
      detail: t("agentDashboard.stats.overdueDetail", {
        defaultValue: "Theo SLA hoặc lịch follow-up",
      }),
      detailColor: stats.overdue > 0 ? "text-rose-500" : "text-emerald-500",
      iconColor: "text-rose-500 dark:text-rose-400",
      bgIcon: "bg-rose-50 dark:bg-rose-500/10",
    },
    {
      title: t("agentDashboard.stats.completion"),
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      detail: t("agentDashboard.stats.completedRatio", {
        completed: stats.completedToday,
        total: stats.totalToday,
        defaultValue: `${stats.completedToday}/${stats.totalToday} việc hôm nay`,
      }),
      detailColor: "text-emerald-500 dark:text-emerald-400",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgIcon: "bg-emerald-50 dark:bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="flex flex-col justify-between rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md dark:border-[#262338] dark:bg-[#13111C] dark:shadow-none"
        >
          <div className="mb-4 flex items-start justify-between">
            <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500 dark:text-gray-400">
              {card.title}
            </p>
            <div className={`rounded-full p-1.5 ${card.bgIcon}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-3xl font-black text-slate-800 dark:text-gray-100">
              {card.value}
            </h3>
            <p className={`text-[12px] font-bold ${card.detailColor}`}>{card.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
