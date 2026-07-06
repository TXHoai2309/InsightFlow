"use client";

import React, { useState } from "react";
import { CheckCircle2, ClipboardCopy, Mail, Route, User } from "lucide-react";
import type { StaffAccount } from "./types";

interface EmployeeCreateHandoffProps {
  createdAccount: StaffAccount | null;
  t: (key: string) => string;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
    >
      <ClipboardCopy className="h-3.5 w-3.5" />
      {copied ? "Đã sao chép" : label}
    </button>
  );
}

export function EmployeeCreateHandoff({ createdAccount, t }: EmployeeCreateHandoffProps) {
  return (
    <aside className="sticky top-6 h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gradient-to-br from-[#6C5CE7]/5 to-white px-6 py-5">
        <h2 className="text-[18px] font-bold text-gray-900">{t("team.handoff.title")}</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          {createdAccount
            ? "Gửi thông tin đăng nhập cho nhân viên sau khi tạo tài khoản."
            : t("team.handoff.empty")}
        </p>
      </div>

      <div className="p-6">
        {createdAccount ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-[14px] font-semibold text-green-800">Tạo tài khoản thành công</p>
                <p className="mt-1 text-[13px] text-green-700">Nhân viên có thể đăng nhập ngay bằng thông tin bên dưới.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  <User className="h-3.5 w-3.5" />
                  {t("team.handoff.employee")}
                </div>
                <p className="mt-2 text-[15px] font-bold text-gray-900">{createdAccount.displayName}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                  <CopyButton value={createdAccount.email} label="Sao chép" />
                </div>
                <p className="mt-2 break-all text-[14px] font-medium text-gray-800">{createdAccount.email}</p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-amber-700">
                    {t("team.handoff.tempPassword")}
                  </div>
                  {createdAccount.temporaryPassword && (
                    <CopyButton value={createdAccount.temporaryPassword} label="Sao chép" />
                  )}
                </div>
                <p className="mt-2 font-mono text-[15px] font-bold tracking-wide text-amber-900">
                  {createdAccount.temporaryPassword || "—"}
                </p>
              </div>

              {createdAccount.defaultRoute && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                    <Route className="h-3.5 w-3.5" />
                    {t("team.handoff.defaultRoute")}
                  </div>
                  <p className="mt-2 text-[14px] font-medium text-gray-800">{createdAccount.defaultRoute}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">📋</div>
            <p className="text-[14px] text-gray-500">{t("team.handoff.empty")}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
