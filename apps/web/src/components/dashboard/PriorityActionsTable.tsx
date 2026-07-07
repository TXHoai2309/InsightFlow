import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export interface PriorityAction {
  id: string;
  type: "negative" | "alert" | "lead" | "staff";
  title: string;
  description: string;
  actionText: string;
  link: string;
  urgency: "high" | "medium" | "low";
  deadline?: string;
}

interface PriorityActionsTableProps {
  actions: PriorityAction[];
}

export function PriorityActionsTable({ actions }: PriorityActionsTableProps) {
  const { t } = useTranslation();

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case "high": return { color: "bg-red-500", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", icon: "warning" };
      case "medium": return { color: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", icon: "notifications_active" };
      case "low": return { color: "bg-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400", icon: "assignment" };
      default: return { color: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", icon: "info" };
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1b1e] rounded-[16px] border border-[var(--color-border)] shadow-sm flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center">
          <span className="w-2 h-6 bg-red-500 rounded-full mr-3"></span>
          {t("dashboard.priorityActions.title", "Cần xử lý ngay")}
        </h3>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-[var(--color-border)]">
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("dashboard.priorityActions.task", "Công việc")}</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">{t("dashboard.priorityActions.deadline", "Hạn chót")}</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t("dashboard.priorityActions.action", "Hành động")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {actions.map((action, idx) => {
              const styles = getUrgencyStyles(action.urgency);
              return (
                <tr key={action.id || idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.bg} ${styles.text}`}>
                        <span className="material-symbols-outlined">{styles.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white mb-0.5">{action.title}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{action.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    <span className={`text-sm font-medium ${action.urgency === 'high' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {action.deadline || t("dashboard.priorityActions.today", "Hôm nay")}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={action.link}>
                      <button className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white text-sm font-semibold rounded-lg transition-colors">
                        {action.actionText}
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {actions.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">done_all</span>
                    <p>{t("dashboard.priorityActions.empty", "Không có việc cần xử lý ngay.")}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
