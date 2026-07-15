"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, Building2, User, TrendingUp, Mail, Phone, CheckSquare, Inbox, History } from "lucide-react";

type TaskStatus = "urgent" | "processing" | "waiting" | "completed";

interface Task {
  id: string;
  status: TaskStatus;
  timeLeft?: string;
  titleKey: string;
  trendKey?: string;
  brand?: string;
  customer?: string;
  progress?: number;
  completedTime?: string;
}

const mockTasks: Task[] = [
  {
    id: "t1",
    status: "urgent",
    titleKey: "agentDashboard.mockData.kanban.k1.title",
    trendKey: "agentDashboard.mockData.kanban.k1.trend",
    timeLeft: "agentDashboard.mockData.kanban.k1.time",
    brand: "Mixue",
    customer: "Nguyễn Văn Lead",
    progress: 10,
  },
  {
    id: "t2",
    status: "urgent",
    titleKey: "agentDashboard.mockData.kanban.k2.title",
    trendKey: "agentDashboard.mockData.kanban.k2.trend",
    timeLeft: "agentDashboard.mockData.kanban.k2.time",
    brand: "Highlands",
    customer: "Trần Thị A",
    progress: 0,
  },
  {
    id: "t5",
    status: "completed",
    titleKey: "agentDashboard.mockData.kanban.k5.title",
    completedTime: "agentDashboard.mockData.kanban.k5.time",
  },
  {
    id: "t6",
    status: "completed",
    titleKey: "agentDashboard.mockData.kanban.k6.title",
    completedTime: "agentDashboard.mockData.kanban.k6.time",
  },
  {
    id: "t7",
    status: "completed",
    titleKey: "agentDashboard.mockData.kanban.k7.title",
    completedTime: "agentDashboard.mockData.kanban.k7.time",
  },
];

const statusColorConfig: Record<TaskStatus, { dot: string, bar: string, text: string, cardShadow: string, tagBg: string }> = {
  urgent: { dot: "bg-rose-500", bar: "bg-gradient-to-r from-rose-500 to-pink-500", text: "text-rose-600 dark:text-rose-400", tagBg: "bg-rose-50 dark:bg-rose-500/10", cardShadow: "hover:shadow-rose-500/10 dark:hover:shadow-rose-500/5" },
  processing: { dot: "bg-indigo-500", bar: "bg-gradient-to-r from-indigo-500 to-blue-500", text: "text-indigo-600 dark:text-indigo-400", tagBg: "bg-indigo-50 dark:bg-indigo-500/10", cardShadow: "hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5" },
  waiting: { dot: "bg-amber-500", bar: "bg-gradient-to-r from-amber-400 to-orange-500", text: "text-amber-600 dark:text-amber-400", tagBg: "bg-amber-50 dark:bg-amber-500/10", cardShadow: "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/5" },
  completed: { dot: "bg-emerald-500", bar: "bg-gradient-to-r from-emerald-400 to-teal-500", text: "text-emerald-600 dark:text-emerald-400", tagBg: "bg-emerald-50 dark:bg-emerald-500/10", cardShadow: "" },
};

export function AgentKanbanBoard() {
  const { t } = useTranslation();

  const columnConfig = [
    { id: "urgent", title: t("agentDashboard.kanban.urgent"), icon: "🔥", borderCol: "border-rose-100 dark:border-rose-900/30", bgCol: "bg-[#ffffff] dark:bg-[#13111C]", headerBg: "bg-rose-50/50 dark:bg-[#13111C]" },
    { id: "processing", title: t("agentDashboard.kanban.processing"), icon: "⚡", borderCol: "border-indigo-100 dark:border-indigo-900/30", bgCol: "bg-[#ffffff] dark:bg-[#13111C]", headerBg: "bg-indigo-50/50 dark:bg-[#13111C]" },
    { id: "waiting", title: t("agentDashboard.kanban.waiting"), icon: "💬", borderCol: "border-amber-100 dark:border-amber-900/30", bgCol: "bg-[#ffffff] dark:bg-[#13111C]", headerBg: "bg-amber-50/50 dark:bg-[#13111C]" },
    { id: "completed", title: t("agentDashboard.kanban.completed"), icon: "✅", borderCol: "border-emerald-100 dark:border-emerald-900/30", bgCol: "bg-[#ffffff] dark:bg-[#13111C]", headerBg: "bg-emerald-50/50 dark:bg-[#13111C]" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {columnConfig.map((col) => {
        const columnTasks = mockTasks.filter(t => t.status === col.id);
        const isEmpty = columnTasks.length === 0;

        return (
          <div 
            key={col.id} 
            className={`flex flex-col rounded-[20px] border ${col.borderCol} ${col.bgCol} min-w-0 shadow-sm overflow-hidden`}
          >
            {/* Column Header */}
            <div className={`px-4 py-3 border-b border-gray-100 dark:border-[#262338] ${col.headerBg} flex items-center justify-between`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{col.icon}</span>
                <h3 className="font-extrabold text-slate-800 dark:text-gray-100 text-sm truncate tracking-tight">{col.title}</h3>
              </div>
              <span className="text-slate-500 dark:text-gray-400 text-xs font-bold px-2 py-0.5 bg-[#ffffff] dark:bg-[#262338] rounded-full shadow-sm shrink-0">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar relative bg-slate-50/30 dark:bg-transparent">
              
              {/* Empty State */}
              {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 bg-[#ffffff] dark:bg-[#262338] rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 dark:border-[#262338]">
                    <Inbox className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">{t("agentDashboard.kanban.emptyTitle")}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{t("agentDashboard.kanban.emptySub")}</p>
                </div>
              )}

              {/* Completed Log Layout */}
              {col.id === "completed" && !isEmpty && (
                <div className="flex flex-col h-full">
                  <div className="bg-[#ffffff] dark:bg-[#0B0914] border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 mb-3 text-center shadow-sm">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {t("agentDashboard.kanban.completedCount", { count: columnTasks.length })}
                    </p>
                  </div>
                  <div className="space-y-3 flex-1">
                    {columnTasks.map(task => (
                      <div key={task.id} className="flex gap-2.5 items-start opacity-70 hover:opacity-100 transition-opacity bg-[#ffffff] dark:bg-[#0B0914] p-2 rounded-lg border border-gray-100 dark:border-[#262338] shadow-sm">
                        <div className="text-[11px] font-bold text-emerald-500 mt-0.5 w-10 shrink-0 text-center">{task.completedTime ? t(task.completedTime) : ""}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700 dark:text-gray-300 truncate">{t(task.titleKey)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    {t("agentDashboard.progress.viewHistory")}
                  </button>
                </div>
              )}

              {/* Normal Task Cards Layout */}
              {col.id !== "completed" && !isEmpty && columnTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`group relative bg-[#ffffff] dark:bg-[#0B0914] border border-gray-100 dark:border-[#262338] rounded-[16px] p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 ${statusColorConfig[task.status].cardShadow}`}
                >
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusColorConfig[task.status].tagBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColorConfig[task.status].dot}`}></span>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${statusColorConfig[task.status].text}`}>
                        {t(`agentDashboard.kanban.${task.status}`)}
                      </span>
                    </div>
                    {task.timeLeft && (
                      <div className="flex items-center gap-1 text-slate-400 dark:text-gray-500 text-[11px] font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{t(task.timeLeft)}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-900 dark:text-gray-100 text-sm mb-3 leading-snug line-clamp-2">{t(task.titleKey)}</h4>
                  
                  {/* Trend Info */}
                  {task.trendKey && (
                    <div className="flex items-start gap-1.5 mb-3 bg-gray-50 dark:bg-[#13111C] rounded-lg p-2 border border-gray-100 dark:border-[#262338]">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-600 dark:text-gray-400 leading-tight">{t(task.trendKey)}</span>
                    </div>
                  )}

                  {/* Footer Info */}
                  {(task.brand || task.customer) && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-500 mb-3 font-medium">
                      <div className="flex items-center gap-1 min-w-0 pr-2">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{task.brand}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{task.customer}</span>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {task.progress !== undefined && (
                    <div className="w-full bg-gray-100 dark:bg-[#262338] rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${statusColorConfig[task.status].bar} transition-all duration-1000`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pointer-events-none z-10">
                    <div className="bg-[#ffffff] dark:bg-[#262338] border border-gray-200 dark:border-[#262338] text-slate-700 dark:text-gray-300 rounded-md shadow-md flex items-center p-1 gap-1 pointer-events-auto">
                      <button className="flex items-center gap-1 px-2 py-1 hover:bg-gray-50 dark:hover:bg-[#13111C] rounded text-[11px] font-semibold transition-colors">
                        <Mail className="w-3 h-3" /> {t("agentDashboard.kanban.reply")}
                      </button>
                      <div className="w-[1px] h-3 bg-gray-200 dark:bg-[#13111C]"></div>
                      <button className="flex items-center gap-1 px-2 py-1 hover:bg-gray-50 dark:hover:bg-[#13111C] rounded text-[11px] font-semibold transition-colors">
                        <Phone className="w-3 h-3" /> {t("agentDashboard.kanban.contact")}
                      </button>
                      <div className="w-[1px] h-3 bg-gray-200 dark:bg-[#13111C]"></div>
                      <button className="flex items-center gap-1 px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded text-[11px] font-semibold transition-colors text-emerald-600 dark:text-emerald-400">
                        <CheckSquare className="w-3 h-3" /> {t("agentDashboard.kanban.done")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
