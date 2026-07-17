"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, Zap, Flame, Star } from "lucide-react";

export function AgentNextTasks() {
  const { t } = useTranslation();

  const nextTasks = [
    {
      id: 1,
      titleKey: "agentDashboard.mockData.nextTasks.t1.title",
      timeKey: "agentDashboard.mockData.nextTasks.t1.time",
      statusColor: "bg-rose-500",
      shadow: "shadow-rose-500/40 dark:shadow-rose-500/10",
    },
    {
      id: 2,
      titleKey: "agentDashboard.mockData.nextTasks.t2.title",
      timeKey: "agentDashboard.mockData.nextTasks.t2.time",
      statusColor: "bg-amber-500",
      shadow: "shadow-amber-500/40 dark:shadow-amber-500/10",
    },
    {
      id: 3,
      titleKey: "agentDashboard.mockData.nextTasks.t3.title",
      timeKey: "agentDashboard.mockData.nextTasks.t3.time",
      statusColor: "bg-indigo-500",
      shadow: "shadow-indigo-500/40 dark:shadow-indigo-500/10",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#241c4a] dark:bg-[#13111C] dark:border dark:border-[#262338] rounded-[24px] p-6 shadow-xl text-white flex flex-col justify-between h-full">
      
      <div>
        <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-white/10 dark:border-[#262338]">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" fill="currentColor" />
            {t("agentDashboard.next.title")}
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 dark:bg-[var(--color-bg-surface-raised)] px-2.5 py-1 rounded-full text-indigo-200 dark:text-[var(--color-text-primary)]">
            {t("agentDashboard.next.priority")}
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          {nextTasks.map((task, index) => (
            <div key={task.id} className="flex items-start gap-4 group cursor-pointer">
              <div className="flex flex-col items-center mt-1">
                <div className={`w-3 h-3 rounded-full ${task.statusColor} shadow-lg ${task.shadow} ${index === 0 ? "ring-4 ring-rose-500/20" : ""}`}></div>
                {index !== nextTasks.length - 1 && (
                  <div className="w-[1px] h-10 bg-white/10 dark:bg-[var(--color-border)] my-1 group-hover:bg-white/20 dark:group-hover:bg-[var(--color-border-strong)] transition-colors"></div>
                )}
              </div>
              <div className="flex-1 bg-white/5 dark:bg-[var(--color-bg-primary)] hover:bg-white/10 dark:hover:bg-[var(--color-bg-surface-raised)] transition-colors rounded-xl p-3 border border-white/5 dark:border-[var(--color-border)]">
                <h4 className={`text-[13px] font-bold ${index === 0 ? "text-white" : "text-indigo-100 dark:text-[var(--color-text-primary)]"}`}>
                  {t(task.titleKey)}
                </h4>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-300 dark:text-[var(--color-text-muted)]" />
                  <span className={`text-[11px] font-semibold ${index === 0 ? "text-rose-300 dark:text-rose-400" : "text-indigo-300 dark:text-[var(--color-text-secondary)]"}`}>
                    {t(task.timeKey)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <button className="w-full bg-[#8c52ff] hover:bg-[#7b42ea] dark:bg-[#8c52ff]/80 dark:hover:bg-[#8c52ff] text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
          {t("agentDashboard.next.start")}
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Performance Stats */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-200 dark:text-gray-400">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-medium">{t("agentDashboard.next.currentStreak")}</span>
            </div>
            <span className="font-bold text-white">{t("agentDashboard.next.streakVal", { count: 12 })}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-200 dark:text-gray-400">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-medium">{t("agentDashboard.next.weeklyPerf")}</span>
            </div>
            <span className="font-bold text-emerald-400">92%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
