"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flame,
  Inbox,
  LoaderCircle,
  MessageCircle,
  User,
} from "lucide-react";
import {
  filterEmployeeOperationsTasks,
  formatOperationsDueTime,
  formatOperationsRelativeTime,
  type EmployeeOperationsPeriod,
  type EmployeeOperationsTask,
  type EmployeeTaskStatus,
} from "@/lib/employee-operations";

interface AgentKanbanBoardProps {
  tasks: EmployeeOperationsTask[];
  nowMs: number;
}

const statusColorConfig: Record<
  EmployeeTaskStatus,
  { text: string; tagBg: string; border: string; background: string }
> = {
  urgent: {
    text: "text-rose-600 dark:text-rose-400",
    tagBg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-100 dark:border-rose-900/30",
    background: "bg-rose-50/40 dark:bg-[#13111C]",
  },
  processing: {
    text: "text-indigo-600 dark:text-indigo-400",
    tagBg: "bg-indigo-50 dark:bg-indigo-500/10",
    border: "border-indigo-100 dark:border-indigo-900/30",
    background: "bg-indigo-50/40 dark:bg-[#13111C]",
  },
  waiting: {
    text: "text-amber-600 dark:text-amber-400",
    tagBg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-900/30",
    background: "bg-amber-50/40 dark:bg-[#13111C]",
  },
  completed: {
    text: "text-emerald-600 dark:text-emerald-400",
    tagBg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-100 dark:border-emerald-900/30",
    background: "bg-emerald-50/40 dark:bg-[#13111C]",
  },
};

const PERIOD_OPTIONS: EmployeeOperationsPeriod[] = [
  "today",
  "yesterday",
  "last7Days",
  "last30Days",
  "all",
];

export function AgentKanbanBoard({ tasks, nowMs }: AgentKanbanBoardProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<EmployeeOperationsPeriod>("today");
  const filteredTasks = useMemo(
    () => filterEmployeeOperationsTasks(tasks, period, nowMs),
    [nowMs, period, tasks],
  );

  const columns: Array<{
    id: EmployeeTaskStatus;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "urgent", title: t("agentDashboard.kanban.urgent"), icon: Flame },
    { id: "processing", title: t("agentDashboard.kanban.processing"), icon: LoaderCircle },
    { id: "waiting", title: t("agentDashboard.kanban.waiting"), icon: MessageCircle },
    { id: "completed", title: t("agentDashboard.kanban.completed"), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[#262338] dark:bg-[#13111C]">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-gray-200">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          {t("agentDashboard.kanban.periodLabel", { defaultValue: "Thời gian hiển thị" })}
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as EmployeeOperationsPeriod)}
          aria-label={t("agentDashboard.kanban.periodLabel", { defaultValue: "Thời gian hiển thị" })}
          className="min-w-[160px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-[#353149] dark:bg-[#0B0914] dark:text-gray-200 dark:focus:ring-indigo-500/20"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`agentDashboard.kanban.period.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid min-h-[560px] grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((column) => {
          const config = statusColorConfig[column.id];
          const columnTasks = filteredTasks.filter((task) => task.status === column.id);
          const visibleTasks = columnTasks.slice(0, 20);
          const hiddenCount = Math.max(0, columnTasks.length - visibleTasks.length);
          const Icon = column.icon;

          return (
            <section
              key={column.id}
              className={`flex min-w-0 flex-col overflow-hidden rounded-[20px] border bg-white shadow-sm dark:bg-[#13111C] ${config.border}`}
            >
            <header
              className={`flex items-center justify-between border-b px-4 py-3 ${config.border} ${config.background}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${config.text}`} />
                <h3 className="truncate text-sm font-extrabold tracking-tight text-slate-800 dark:text-gray-100">
                  {column.title}
                </h3>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm dark:bg-[#262338] dark:text-gray-400">
                {columnTasks.length}
              </span>
            </header>

            <div className="relative flex flex-1 flex-col gap-3 bg-slate-50/30 p-3 dark:bg-transparent">
              {visibleTasks.length === 0 ? (
                <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center p-4 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm dark:border-[#262338] dark:bg-[#262338]">
                    <Inbox className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="mb-1 text-sm font-bold text-gray-600 dark:text-gray-400">
                    {t("agentDashboard.kanban.emptyTitle")}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {t("agentDashboard.kanban.emptySub")}
                  </p>
                </div>
              ) : (
                visibleTasks.map((task) => {
                  const taskTime =
                    task.status === "completed"
                      ? formatOperationsRelativeTime(task.completedAt, nowMs)
                      : formatOperationsDueTime(task.dueAt, nowMs);

                  return (
                    <Link
                      key={`${task.role}:${task.id}`}
                      href={task.href}
                      className="group rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-[#262338] dark:bg-[#0B0914] dark:hover:border-indigo-500/30"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${config.tagBg} ${config.text}`}
                        >
                          {task.priority}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
                      </div>

                      <h4 className="line-clamp-3 text-[13px] font-bold leading-5 text-slate-800 dark:text-gray-100">
                        {task.title}
                      </h4>
                      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                        {task.detail}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold">
                        <Clock3 className={`h-3.5 w-3.5 ${task.isOverdue ? "text-rose-500" : config.text}`} />
                        <span className={task.isOverdue ? "text-rose-600 dark:text-rose-400" : config.text}>
                          {taskTime}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500 dark:border-[#262338] dark:text-gray-500">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{task.brand || "Chưa xác định thương hiệu"}</span>
                        </div>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{task.customer}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}

              {hiddenCount > 0 && (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-500 dark:bg-[#262338] dark:text-gray-400">
                  {t("agentDashboard.kanban.moreItems", {
                    count: hiddenCount,
                    defaultValue: `Còn ${hiddenCount} công việc khác`,
                  })}
                </p>
              )}
            </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
