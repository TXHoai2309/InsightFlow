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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-500">Nhân viên</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Vai trò</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Nghiệp vụ</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Trạng thái</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold text-gray-500">Ngày tạo</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold text-gray-500">Đăng nhập cuối</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold text-gray-500">Mật khẩu tạm</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
                  <tr key={item.uid} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7]/20 to-purple-100 font-bold text-[#6C5CE7]">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{item.displayName || "—"}</p>
                          <p className="truncate text-[13px] text-gray-500">{item.email}</p>
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
                            ? "bg-red-50 text-red-700"
                            : hasTemporaryPassword
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
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

                    <td className="whitespace-nowrap px-6 py-4 text-[13px] text-gray-500">
                      {formatStaffDate(item.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-[13px] text-gray-500">
                      {formatStaffDate(item.lastLoginAt)}
                    </td>

                    <td className="px-6 py-4">
                      {temporaryPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[13px] text-gray-900">{temporaryPassword}</span>
                          <button
                            type="button"
                            onClick={() => copyPassword(item.uid, temporaryPassword)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[12px] font-semibold text-gray-600 transition hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                          >
                            {copiedUid === item.uid ? "Đã sao chép" : "Sao chép"}
                          </button>
                        </div>
                      ) : hasTemporaryPassword ? (
                        <button
                          type="button"
                          onClick={() => onRevealPassword(item)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-[13px] text-gray-700 transition hover:border-[#6C5CE7] hover:bg-[#6C5CE7]/5 hover:text-[#6C5CE7]"
                        >
                          **********
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onResetPassword(item)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:border-[#6C5CE7] hover:bg-[#6C5CE7]/5 hover:text-[#6C5CE7]"
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
