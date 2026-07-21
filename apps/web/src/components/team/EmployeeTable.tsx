"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StaffAccount } from "./types";
import { EmployeeActionMenu } from "./EmployeeActionMenu";
import {
  formatStaffDate,
  getBusinessRoleBadgeClass,
  getBusinessRoleLabel,
  getPermissionLabelKey,
  getStaffBusinessRole,
} from "./utils";

interface EmployeeTableProps {
  staff: StaffAccount[];
  onEdit: (account: StaffAccount) => void;
  onToggleStatus: (account: StaffAccount) => void;
  onResetPassword: (account: StaffAccount) => void;
  onRevealPassword: (account: StaffAccount) => void;
  revealedPasswords: Record<string, string>;
}

export function EmployeeTable({
  staff,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onRevealPassword,
  revealedPasswords,
}: EmployeeTableProps) {
  const { t } = useTranslation();
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const copyPassword = async (uid: string, password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedUid(uid);
      setTimeout(() => setCopiedUid(null), 1600);
    } catch {
      // Clipboard may be unavailable in some browser contexts.
    }
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E9E7EE] dark:border-white/5 bg-white/95 dark:bg-[#1A1B20]/95 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-[#E9E7EE] dark:border-white/5 bg-gray-50/50 dark:bg-[#2A2B35]/50 backdrop-blur-md">
            <tr>
              <th className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Nhân viên</th>
              <th className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Vai trò</th>
              <th className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Nghiệp vụ</th>
              <th className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Trạng thái</th>
              <th className="whitespace-nowrap px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Ngày tạo</th>
              <th className="whitespace-nowrap px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Đăng nhập cuối</th>
              <th className="whitespace-nowrap px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Mật khẩu tạm</th>
              <th className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7EE] dark:divide-white/5">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              staff.map((item) => {
                const initial = (item.displayName || item.email || "?").charAt(0).toUpperCase();
                const temporaryPassword = revealedPasswords[item.uid];
                const hasTemporaryPassword = item.hasTemporaryPassword || item.temporaryPassword;
                const businessRole = getStaffBusinessRole(item.permissions, item.role);

                return (
                  <tr key={item.uid} className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#8E7CFF] dark:from-[#9B8CFF] dark:to-[#B4A8FF] font-bold text-white dark:text-[#1A1B20] shadow-md shadow-[#6C5CE7]/20 dark:shadow-none transition-transform group-hover:scale-105">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900 dark:text-white transition-colors group-hover:text-[#6C5CE7] dark:group-hover:text-[#9B8CFF]">{item.displayName || "—"}</p>
                          <p className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-gray-400">{item.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[12px] font-medium ${getBusinessRoleBadgeClass(businessRole)}`}>
                        {getBusinessRoleLabel(businessRole)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {(item.permissions || []).map((permission) => (
                          <span
                            key={permission}
                            className="rounded border border-[#6C5CE7]/20 bg-[#6C5CE7]/10 px-2 py-0.5 text-[11px] font-medium text-[#6C5CE7]"
                            title={permission}
                          >
                            {t(getPermissionLabelKey(permission))}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                          item.disabled
                            ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            : hasTemporaryPassword
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                              : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.disabled ? "bg-red-500" : hasTemporaryPassword ? "bg-yellow-500" : "bg-green-500"
                          }`}
                        />
                        {item.disabled ? "Đã khóa" : hasTemporaryPassword ? "Chờ đổi MK" : "Đang hoạt động"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-[13px] text-gray-500 dark:text-gray-400">
                      {formatStaffDate(item.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-[13px] text-gray-500 dark:text-gray-400">
                      {formatStaffDate(item.lastLoginAt)}
                    </td>

                    <td className="px-6 py-4">
                      {temporaryPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[13px] text-gray-900 dark:text-white">{temporaryPassword}</span>
                          <button
                            type="button"
                            onClick={() => copyPassword(item.uid, temporaryPassword)}
                            className="rounded-xl border border-[#E9E7EE] dark:border-white/10 px-3 py-1.5 text-[12px] font-semibold text-gray-600 dark:text-gray-300 transition-all hover:border-[#6C5CE7]/50 hover:bg-[#6C5CE7]/5 hover:text-[#6C5CE7] dark:hover:border-[#9B8CFF]/50 dark:hover:bg-[#9B8CFF]/10 dark:hover:text-[#9B8CFF] hover:shadow-sm"
                          >
                            {copiedUid === item.uid ? "Đã sao chép" : "Sao chép"}
                          </button>
                        </div>
                      ) : hasTemporaryPassword ? (
                        <button
                          type="button"
                          onClick={() => onRevealPassword(item)}
                          className="rounded-xl border border-[#E9E7EE] dark:border-white/10 px-4 py-2 font-mono text-[13px] text-gray-700 dark:text-gray-300 transition-all hover:border-[#6C5CE7]/50 hover:bg-[#6C5CE7]/5 hover:text-[#6C5CE7] dark:hover:border-[#9B8CFF]/50 dark:hover:bg-[#9B8CFF]/10 dark:hover:text-[#9B8CFF] hover:shadow-sm"
                        >
                          **********
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onResetPassword(item)}
                          className="rounded-xl border border-[#E9E7EE] dark:border-white/10 px-4 py-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-[#6C5CE7]/50 hover:bg-[#6C5CE7]/5 hover:text-[#6C5CE7] dark:hover:border-[#9B8CFF]/50 dark:hover:bg-[#9B8CFF]/10 dark:hover:text-[#9B8CFF] hover:shadow-sm"
                        >
                          Cấp lại
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <EmployeeActionMenu
                        account={item}
                        onEdit={onEdit}
                        onToggleStatus={onToggleStatus}
                        onResetPassword={onResetPassword}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
