"use client";

import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Sparkles, CheckCircle2, History, RefreshCw } from "lucide-react";

export function AgentProgressSection() {
  const { t } = useTranslation();
  const completed: number = 8; // Reset to 8 for normal state
  const total: number = 12;
  const percentage = Math.round((completed / total) * 100);
  const isFinished = completed === total;

  if (isFinished) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[20px] p-6 shadow-sm text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-slate-800 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {t("agentDashboard.progress.celebrationTitle")}
              </h2>
              <p className="text-slate-400 mt-1 font-medium text-sm">
                {t("agentDashboard.progress.celebrationSub", { completed, total })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <History className="w-4 h-4" />
              {t("agentDashboard.progress.viewHistory")}
            </button>
            <button className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {t("agentDashboard.progress.getNewTask")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#ffffff] dark:bg-[#13111C] border border-gray-100 dark:border-[#262338] rounded-[24px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] dark:shadow-none relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-gray-100 tracking-tight">
              {t("agentDashboard.progress.title")}
            </h2>
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-[13px] text-slate-500 dark:text-gray-400 font-medium">
            <Trans i18nKey="agentDashboard.progress.subtitle" values={{ completed, total }}>
              Bạn đã xuất sắc hoàn thành <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{completed}/{total}</span> khối lượng công việc.
            </Trans>
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm dark:shadow-none">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {t("agentDashboard.progress.goodPerf")}
          </span>
        </div>
      </div>

      <div className="relative z-10 w-full h-3 bg-gray-100 dark:bg-[#262338] rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="relative z-10 flex justify-between items-center mt-3 text-xs font-bold text-slate-400 dark:text-gray-500">
        <span>{t("agentDashboard.progress.start")}</span>
        <span className="text-indigo-600 dark:text-indigo-400">{percentage}%</span>
      </div>
    </div>
  );
}
