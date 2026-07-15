"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Check, Hourglass, Circle, AlertTriangle } from "lucide-react";

type ScheduleStatus = "completed" | "in-progress" | "upcoming" | "overdue";

interface ScheduleItem {
  id: string;
  timeKey: string;
  contentKey: string;
  status: ScheduleStatus;
}

const mockSchedule: ScheduleItem[] = [
  { id: "s1", timeKey: "agentDashboard.mockData.schedule.s1.time", contentKey: "agentDashboard.mockData.schedule.s1.title", status: "completed" },
  { id: "s2", timeKey: "agentDashboard.mockData.schedule.s2.time", contentKey: "agentDashboard.mockData.schedule.s2.title", status: "in-progress" },
  { id: "s3", timeKey: "agentDashboard.mockData.schedule.s3.time", contentKey: "agentDashboard.mockData.schedule.s3.title", status: "upcoming" },
  { id: "s4", timeKey: "agentDashboard.mockData.schedule.s4.time", contentKey: "agentDashboard.mockData.schedule.s4.title", status: "overdue" },
];

const statusConfig: Record<ScheduleStatus, { icon: React.ElementType, iconColor: string, borderColor: string, bgColor: string, textColor: string, timeColor: string, decoration: string }> = {
  "completed": { 
    icon: Check, iconColor: "text-white", borderColor: "border-emerald-500 dark:border-emerald-500", bgColor: "bg-emerald-500", 
    textColor: "text-slate-400 dark:text-gray-500", timeColor: "text-slate-400 dark:text-gray-500", decoration: "line-through decoration-slate-300 dark:decoration-gray-700" 
  },
  "in-progress": { 
    icon: Hourglass, iconColor: "text-blue-500 dark:text-blue-400", borderColor: "border-blue-200 dark:border-blue-500/30", bgColor: "bg-blue-50 dark:bg-blue-500/10", 
    textColor: "text-slate-900 dark:text-gray-100", timeColor: "text-blue-600 dark:text-blue-400", decoration: "" 
  },
  "upcoming": { 
    icon: Circle, iconColor: "text-slate-400 dark:text-gray-500", borderColor: "border-gray-200 dark:border-[#262338]", bgColor: "bg-[#ffffff] dark:bg-[#13111C]", 
    textColor: "text-slate-700 dark:text-gray-300", timeColor: "text-slate-500 dark:text-gray-400", decoration: "" 
  },
  "overdue": { 
    icon: AlertTriangle, iconColor: "text-rose-500 dark:text-rose-400", borderColor: "border-rose-200 dark:border-rose-500/30", bgColor: "bg-rose-50 dark:bg-rose-500/10", 
    textColor: "text-rose-700 dark:text-rose-400", timeColor: "text-rose-600 dark:text-rose-400", decoration: "" 
  },
};

export function AgentSchedule() {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState(mockSchedule);

  const toggleComplete = (id: string) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === "completed" ? "in-progress" : "completed" };
      }
      return item;
    }));
  };

  return (
    <div className="bg-[#ffffff] dark:bg-[#13111C] border border-gray-200 dark:border-[#262338] rounded-xl p-6 shadow-sm flex flex-col h-full">
      <div className="pb-4 border-b border-gray-100 dark:border-[#262338] flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-500 dark:text-gray-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-gray-100">{t("agentDashboard.schedule.title")}</h3>
      </div>
      <div className="pt-5 flex-1">
        <div className="relative border-l border-gray-200 dark:border-[#262338] ml-3 space-y-6">
          {schedule.map((item) => {
            const config = statusConfig[item.status];
            const Icon = config.icon;
            
            return (
              <div key={item.id} className="relative pl-6 group">
                <button 
                  onClick={() => toggleComplete(item.id)}
                  className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${config.borderColor} ${config.bgColor}`}
                >
                  <Icon className={`w-2.5 h-2.5 ${config.iconColor}`} strokeWidth={item.status === "completed" ? 3 : 2} />
                </button>
                
                <div>
                  <span className={`text-[11px] font-bold tracking-wider ${config.timeColor}`}>
                    {t(item.timeKey)}
                  </span>
                  <p className={`text-[13px] mt-0.5 font-medium ${config.textColor} ${config.decoration}`}>
                    {t(item.contentKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
