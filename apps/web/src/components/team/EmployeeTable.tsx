"use client";

import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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

interface CompactBadgeProps {
  text: string;
  className: string;
  maxWidthClass: string;
  dotClassName?: string;
}

function CompactBadge({
  text,
  className,
  maxWidthClass,
  dotClassName,
}: CompactBadgeProps) {
  const tooltipId = useId();
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
    placement: "top" | "bottom";
  } | null>(null);

  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const halfTooltipWidth = 140;
    const viewportPadding = 16;
    const left = Math.min(
      window.innerWidth - viewportPadding - halfTooltipWidth,
      Math.max(viewportPadding + halfTooltipWidth, rect.left + rect.width / 2),
    );
    const placement = rect.bottom + 72 < window.innerHeight ? "bottom" : "top";

    setTooltipPosition({
      left,
      top: placement === "bottom" ? rect.bottom + 8 : rect.top - 8,
      placement,
    });
  };

  useEffect(() => {
    if (!tooltipPosition) return;

    const hideTooltip = () => setTooltipPosition(null);
    window.addEventListener("resize", hideTooltip);
    window.addEventListener("scroll", hideTooltip, true);

    return () => {
      window.removeEventListener("resize", hideTooltip);
      window.removeEventListener("scroll", hideTooltip, true);
    };
  }, [tooltipPosition]);

  return (
    <>
      <span
        tabIndex={0}
        aria-describedby={tooltipPosition ? tooltipId : undefined}
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={() => setTooltipPosition(null)}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setTooltipPosition(null)}
        className={`inline-flex cursor-help items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium outline-none transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#6C5CE7]/30 ${maxWidthClass} ${className}`}
      >
        {dotClassName ? <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} /> : null}
        <span className="min-w-0 truncate">{text}</span>
      </span>

      {tooltipPosition && typeof document !== "undefined"
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
              className={`pointer-events-none fixed z-[100] max-w-[280px] -translate-x-1/2 rounded-lg bg-gray-950 px-3 py-2 text-center text-[12px] font-medium leading-relaxed text-white shadow-xl ${
                tooltipPosition.placement === "top" ? "-translate-y-full" : ""
              }`}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
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
              <th data-tour="team-roles" className="w-[148px] whitespace-nowrap px-4 py-4 font-semibold text-gray-500">Vai trò</th>
              <th className="w-[170px] whitespace-nowrap px-4 py-4 font-semibold text-gray-500">Nghiệp vụ</th>
              <th className="w-[128px] whitespace-nowrap px-4 py-4 font-semibold text-gray-500">Trạng thái</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold text-gray-500">Ngày tạo</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold text-gray-500">Đăng nhập cuối</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold text-gray-500">Mật khẩu tạm</th>
              <th data-tour="team-actions" className="px-6 py-4 font-semibold text-gray-500">Hành động</th>
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
                const businessRoleLabel = getBusinessRoleLabel(businessRole);
                const operationsLabel =
                  (item.permissions || [])
                    .map((permission) => t(getPermissionLabelKey(permission), { defaultValue: permission }))
                    .join(" • ") || "Chưa phân công";
                const statusLabel = item.disabled
                  ? "Đã khóa"
                  : hasTemporaryPassword
                    ? "Chờ đổi mật khẩu"
                    : "Đang hoạt động";
                const statusStyle = item.disabled
                  ? {
                      badge: "border-red-100 bg-red-50 text-red-700",
                      dot: "bg-red-500",
                    }
                  : hasTemporaryPassword
                    ? {
                        badge: "border-yellow-100 bg-yellow-50 text-yellow-700",
                        dot: "bg-yellow-500",
                      }
                    : {
                        badge: "border-green-100 bg-green-50 text-green-700",
                        dot: "bg-green-500",
                      };

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

                    <td className="px-4 py-4">
                      <CompactBadge
                        text={businessRoleLabel}
                        maxWidthClass="max-w-[132px]"
                        className={getBusinessRoleBadgeClass(businessRole)}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <CompactBadge
                        text={operationsLabel}
                        maxWidthClass="max-w-[154px]"
                        className="border-[#6C5CE7]/20 bg-[#6C5CE7]/10 text-[#6C5CE7]"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <CompactBadge
                        text={statusLabel}
                        maxWidthClass="max-w-[112px] rounded-full"
                        className={statusStyle.badge}
                        dotClassName={statusStyle.dot}
                      />
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
