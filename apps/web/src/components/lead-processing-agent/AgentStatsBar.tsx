"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  TrendingUp 
} from "lucide-react";

export function AgentStatsBar() {
  const { t } = useTranslation();

  const stats = [
    {
      title: t("agentDashboard.stats.todo"),
      value: "12",
      icon: CheckCircle2,
      trend: t("agentDashboard.stats.vsYesterday"),
      trendColor: "text-emerald-500",
      iconColor: "text-indigo-500 dark:text-indigo-400",
      bgIcon: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      title: t("agentDashboard.stats.processing"),
      value: "3",
      icon: Clock,
      trend: t("agentDashboard.stats.onTrack"),
      trendColor: "text-slate-500 dark:text-gray-400",
      iconColor: "text-blue-500 dark:text-blue-400",
      bgIcon: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: t("agentDashboard.stats.waiting"),
      value: "2",
      icon: UserPlus,
      trend: t("agentDashboard.stats.waitingTime"),
      trendColor: "text-rose-500 dark:text-rose-400",
      iconColor: "text-rose-500 dark:text-rose-400",
      bgIcon: "bg-rose-50 dark:bg-rose-500/10",
    },
    {
      title: t("agentDashboard.stats.overdue"),
      value: "1",
      icon: AlertCircle,
      trend: t("agentDashboard.stats.dueBefore"),
      trendColor: "text-amber-500 dark:text-amber-400",
      iconColor: "text-amber-500 dark:text-amber-400",
      bgIcon: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      title: t("agentDashboard.stats.completion"),
      value: "67%",
      icon: TrendingUp,
      trend: t("agentDashboard.stats.vsLastWeek"),
      trendColor: "text-emerald-500 dark:text-emerald-400",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgIcon: "bg-emerald-50 dark:bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-[#ffffff] dark:bg-[#13111C] border border-gray-100 dark:border-[#262338] rounded-[20px] p-5 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-[12px] font-bold text-slate-500 dark:text-gray-400 tracking-wide uppercase">{stat.title}</p>
            <div className={`p-1.5 rounded-full ${stat.bgIcon}`}>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} strokeWidth={2.5} />
            </div>
          </div>
          
          <div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-gray-100 mb-1">
              {stat.value}
            </h3>
            <p className={`text-[12px] font-bold ${stat.trendColor}`}>
              {stat.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
