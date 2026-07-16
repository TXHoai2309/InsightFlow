"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CheckCircle2, History, Sparkles } from "lucide-react";

interface AgentProgressSectionProps {
  completed: number;
  total: number;
  detailsHref: string;
}

export function AgentProgressSection({
  completed,
  total,
  detailsHref,
}: AgentProgressSectionProps) {
  const { t } = useTranslation();
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isFinished = total > 0 && completed === total;

  if (isFinished) {
    return (
      <div className="rounded-[20px] border border-slate-800 bg-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-slate-800 p-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {t("agentDashboard.progress.celebrationTitle")}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {t("agentDashboard.progress.completedToday", {
                  completed,
                  total,
                  defaultValue: `${completed}/${total} công việc đã hoàn thành hôm nay.`,
                })}
              </p>
            </div>
          </div>
          <Link
            href={detailsHref}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
          >
            <History className="h-4 w-4" />
            {t("agentDashboard.progress.viewHistory")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] dark:border-[#262338] dark:bg-[#13111C] dark:shadow-none">
      <div className="relative z-10 mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-gray-100">
              {t("agentDashboard.progress.title")}
            </h2>
            <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-gray-400">
            {t("agentDashboard.progress.completedToday", {
              completed,
              total,
              defaultValue: `Đã hoàn thành ${completed}/${total} công việc trong phạm vi của bạn.`,
            })}
          </p>
        </div>
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          {t("agentDashboard.stats.fromSupabase", { defaultValue: "Đồng bộ từ Supabase" })}
        </span>
      </div>

      <div className="relative z-10 h-3 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner dark:bg-[#262338]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="relative z-10 mt-3 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-gray-500">
        <span>{t("agentDashboard.progress.start")}</span>
        <span className="text-indigo-600 dark:text-indigo-400">{percentage}%</span>
      </div>
    </div>
  );
}
