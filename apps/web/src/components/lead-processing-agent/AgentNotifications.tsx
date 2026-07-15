"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Bell, UserPlus, FileText, AlertCircle, MessageSquare } from "lucide-react";

const notifications = [
  {
    id: 1,
    icon: UserPlus,
    titleKey: "agentDashboard.mockData.notifications.n1.title",
    descKey: "agentDashboard.mockData.notifications.n1.desc",
    timeKey: "agentDashboard.mockData.notifications.n1.time",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    id: 2,
    icon: FileText,
    titleKey: "agentDashboard.mockData.notifications.n2.title",
    descKey: "agentDashboard.mockData.notifications.n2.desc",
    timeKey: "agentDashboard.mockData.notifications.n2.time",
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    id: 3,
    icon: AlertCircle,
    titleKey: "agentDashboard.mockData.notifications.n3.title",
    descKey: "agentDashboard.mockData.notifications.n3.desc",
    timeKey: "agentDashboard.mockData.notifications.n3.time",
    iconColor: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
  },
  {
    id: 4,
    icon: MessageSquare,
    titleKey: "agentDashboard.mockData.notifications.n4.title",
    descKey: "agentDashboard.mockData.notifications.n4.desc",
    timeKey: "agentDashboard.mockData.notifications.n4.time",
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
  },
];

export function AgentNotifications() {
  const { t } = useTranslation();

  return (
    <div className="bg-[#ffffff] dark:bg-[#13111C] border border-gray-200 dark:border-[#262338] rounded-xl shadow-sm flex flex-col h-full">
      <div className="p-5 pb-4 border-b border-gray-100 dark:border-[#262338] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500 dark:text-gray-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-gray-100">{t("agentDashboard.notifications.title")}</h3>
        </div>
        <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
          {t("agentDashboard.notifications.new", { count: 4 })}
        </span>
      </div>
      <div className="p-3 flex-1 overflow-auto custom-scrollbar">
        <div className="space-y-1">
          {notifications.map((noti) => (
            <div key={noti.id} className="p-2 hover:bg-slate-50 dark:hover:bg-[#262338]/50 rounded-lg transition-colors flex gap-3 cursor-pointer">
              <div className={`p-2 rounded-md shrink-0 h-fit ${noti.bgColor}`}>
                <noti.icon className={`w-3.5 h-3.5 ${noti.iconColor}`} />
              </div>
              <div className="flex-1 mt-0.5">
                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-gray-200 mb-0.5">{t(noti.titleKey)}</h4>
                <p className="text-[12px] text-slate-500 dark:text-gray-400 font-medium leading-relaxed mb-1">{t(noti.descKey)}</p>
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-semibold">{t(noti.timeKey)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
