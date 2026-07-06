import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface StaffPerformanceProps {
  working: number;
  completedToday: number;
  overdue: number;
  avgResponseTime: string;
  successRate: number;
}

export function StaffPerformanceCard({ working, completedToday, overdue, avgResponseTime, successRate }: StaffPerformanceProps) {
  const { t } = useTranslation();

  // Mock Top Performers for the UI
  const topPerformers = [
    { id: 1, name: "Nguyễn Văn A", task: "Customer Support", success: 98, status: "Online" },
    { id: 2, name: "Trần Thị B", task: "Lead Nurturing", success: 95, status: "In Meeting" },
    { id: 3, name: "Lê Văn C", task: "Crisis Management", success: 92, status: "Offline" },
  ];

  return (
    <div className="bg-white dark:bg-[#1a1b1e] rounded-[16px] border border-[var(--color-border)] shadow-sm flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center">
          <span className="material-symbols-outlined mr-2 text-indigo-500">groups</span>
          {t("dashboard.staff.title", "Hiệu suất Nhân viên")}
        </h3>
        <button className="text-sm font-semibold text-primary hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">
          {t("dashboard.staff.viewTeam", "Xem Nhóm")}
        </button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("dashboard.staff.working", "Đang làm")}</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{working}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("dashboard.staff.completed", "Hoàn thành")}</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{completedToday}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("dashboard.staff.overdue", "Quá hạn")}</span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{overdue}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("dashboard.staff.avgResponseTime", "P/Hồi TB")}</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{avgResponseTime}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("dashboard.staff.successRate", "Tỷ lệ Thành công")}</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{successRate}%</span>
          </div>
        </div>

        {/* Top Performers Table */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
            {t("dashboard.staff.topPerformers", "Nhân viên Xuất sắc")}
          </h4>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="py-2 px-4 font-semibold text-gray-500">{t("dashboard.staff.name", "Tên")}</th>
                  <th className="py-2 px-4 font-semibold text-gray-500 hidden sm:table-cell">{t("dashboard.staff.task", "Nhiệm vụ")}</th>
                  <th className="py-2 px-4 font-semibold text-gray-500 text-right">{t("dashboard.staff.success", "Thành công")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {topPerformers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <Link href={`/settings?employee=${encodeURIComponent(user.name)}`} className="contents">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1a1b1e] ${user.status === 'Online' ? 'bg-green-500' : user.status === 'In Meeting' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">{user.name}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{user.task}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">{user.success}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
