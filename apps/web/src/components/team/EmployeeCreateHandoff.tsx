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
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm active:scale-95"
    >
      <ClipboardCopy className="h-3.5 w-3.5" />
      {copied ? "Đã sao chép" : label}
    </button>
  );
}

export function EmployeeCreateHandoff({ createdAccount, t }: EmployeeCreateHandoffProps) {
  return (
    <aside className="sticky top-6 h-fit overflow-hidden rounded-[24px] border border-[#E9E7EE] dark:border-white/5 bg-white/95 dark:bg-[#1A1B20]/95 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="border-b border-[#E9E7EE] dark:border-white/5 bg-gradient-to-br from-[#6C5CE7]/5 dark:from-[#9B8CFF]/5 to-transparent px-6 py-6 md:px-8">
        <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">{t("team.handoff.title")}</h2>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
          {createdAccount
            ? "Gửi thông tin đăng nhập cho nhân viên sau khi tạo tài khoản."
            : t("team.handoff.empty")}
        </p>
      </div>

      <div className="p-6">
        {createdAccount ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-2xl border border-green-200/60 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/10 p-5 backdrop-blur-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-[14px] font-semibold text-green-800 dark:text-green-300">Tạo tài khoản thành công</p>
                <p className="mt-1 text-[13px] text-green-700 dark:text-green-400/80">Nhân viên có thể đăng nhập ngay bằng thông tin bên dưới.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E9E7EE] dark:border-white/5 bg-white dark:bg-white/5 p-5 shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/20 dark:hover:border-white/10">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <User className="h-3.5 w-3.5" />
                  {t("team.handoff.employee")}
                </div>
                <p className="mt-2 text-[15px] font-bold text-gray-900 dark:text-white">{createdAccount.displayName}</p>
              </div>

              <div className="rounded-2xl border border-[#E9E7EE] dark:border-white/5 bg-white dark:bg-white/5 p-5 shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/20 dark:hover:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                  <CopyButton value={createdAccount.email} label="Sao chép" />
                </div>
                <p className="mt-2 break-all text-[14px] font-medium text-gray-800 dark:text-gray-200">{createdAccount.email}</p>
              </div>

              <div className="rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
                    {t("team.handoff.tempPassword")}
                  </div>
                  {createdAccount.temporaryPassword && (
                    <CopyButton value={createdAccount.temporaryPassword} label="Sao chép" />
                  )}
                </div>
                <p className="mt-2 font-mono text-[15px] font-bold tracking-wide text-amber-900 dark:text-amber-400">
                  {createdAccount.temporaryPassword || "—"}
                </p>
              </div>

              {createdAccount.defaultRoute && (
                <div className="rounded-2xl border border-[#E9E7EE] dark:border-white/5 bg-white dark:bg-white/5 p-5 shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/20 dark:hover:border-white/10">
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <Route className="h-3.5 w-3.5" />
                    {t("team.handoff.defaultRoute")}
                  </div>
                  <p className="mt-2 text-[14px] font-medium text-gray-800 dark:text-gray-200">{createdAccount.defaultRoute}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#1A1B20] text-2xl shadow-sm dark:shadow-none border border-[#E9E7EE] dark:border-white/5">📋</div>
            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">{t("team.handoff.empty")}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
