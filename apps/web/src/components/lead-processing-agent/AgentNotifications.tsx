"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle, Bell, Inbox, LoaderCircle, MessageSquare } from "lucide-react";
import {
  formatOperationsRelativeTime,
  type EmployeeOperationsNotification,
} from "@/lib/employee-operations";

interface AgentNotificationsProps {
  notifications: EmployeeOperationsNotification[];
}

const statusConfig = {
  urgent: {
    icon: AlertCircle,
    iconColor: "text-rose-500",
    background: "bg-rose-50 dark:bg-rose-500/10",
  },
  processing: {
    icon: LoaderCircle,
    iconColor: "text-indigo-500",
    background: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  waiting: {
    icon: MessageSquare,
    iconColor: "text-amber-500",
    background: "bg-amber-50 dark:bg-amber-500/10",
  },
};

export function AgentNotifications({ notifications }: AgentNotificationsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#262338] dark:bg-[#13111C]">
      <div className="flex items-center justify-between border-b border-gray-100 p-5 pb-4 dark:border-[#262338]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-500 dark:text-gray-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-gray-100">
            {t("agentDashboard.attention.title", { defaultValue: "Cần chú ý" })}
          </h3>
        </div>
        <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {notifications.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {notifications.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
            <Inbox className="mb-2 h-8 w-8 text-slate-300 dark:text-gray-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">
              {t("agentDashboard.attention.empty", {
                defaultValue: "Không có công việc cần chú ý trong phạm vi của bạn.",
              })}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const config = statusConfig[notification.status];
              const Icon = config.icon;
              return (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-[#262338]/50"
                >
                  <div className={`h-fit shrink-0 rounded-md p-2 ${config.background}`}>
                    <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                  </div>
                  <div className="mt-0.5 min-w-0 flex-1">
                    <h4 className="mb-0.5 text-[13px] font-semibold text-slate-800 dark:text-gray-200">
                      {notification.title}
                    </h4>
                    <p className="mb-1 line-clamp-2 text-[12px] font-medium leading-relaxed text-slate-500 dark:text-gray-400">
                      {notification.description}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500">
                      {formatOperationsRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
