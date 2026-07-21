"use client";

import React, { useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  RefreshCw,
  Shield,
  Target,
  UserPlus,
} from "lucide-react";
import type { OperationOption, RoleAssignmentOption, StaffRole } from "./types";
import { validateStrongPassword } from "@/lib/passwordPolicy";

interface EmployeeCreateFormProps {
  fullName: string;
  setFullName: (val: string) => void;
  emailLocalPart: string;
  setEmailLocalPart: (val: string) => void;
  brandEmailDomain: string;
  fullEmail: string;
  selectedRoleOptions: StaffRole[];
  onToggleRoleOption: (val: RoleAssignmentOption["value"]) => void;
  operations: string[];
  toggleOperation: (val: string) => void;
  availableOperations: OperationOption[];
  temporaryPassword: string;
  setTemporaryPassword: (val: string) => void;
  onGeneratePassword: () => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  roleOptions: RoleAssignmentOption[];
  t: (key: string) => string;
}

const STEPS = [
  { id: 1, label: "Thông tin cơ bản" },
  { id: 2, label: "Vai trò & quyền" },
  { id: 3, label: "Mật khẩu tạm" },
];

function PasswordStrength({ password, t }: { password: string; t: (key: string) => string }) {
  const policy = useMemo(() => validateStrongPassword(password), [password]);
  const checks = [
    { key: "passwordPolicy.minLength", ok: password.length >= 10 },
    { key: "passwordPolicy.uppercase", ok: /[A-Z]/.test(password) },
    { key: "passwordPolicy.lowercase", ok: /[a-z]/.test(password) },
    { key: "passwordPolicy.number", ok: /[0-9]/.test(password) },
    { key: "passwordPolicy.special", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#1A1B20]/50 p-4 backdrop-blur-sm">
      <p className="mb-3 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Yêu cầu mật khẩu</p>
      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.key} className={`flex items-center gap-2 text-[12px] ${check.ok ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${check.ok ? "opacity-100" : "opacity-30"}`} />
            {t(check.key)}
          </li>
        ))}
      </ul>
      {policy.valid && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mật khẩu đạt yêu cầu
        </p>
      )}
    </div>
  );
}

function RoleIcon({ role, active }: { role: RoleAssignmentOption["value"]; active: boolean }) {
  if (role === "crisis_employee") {
    return <AlertTriangle className={`h-5 w-5 ${active ? "text-white dark:text-[#1A1B20]" : "text-orange-500"}`} />;
  }
  return <Target className={`h-5 w-5 ${active ? "text-white dark:text-[#1A1B20]" : "text-blue-500"}`} />;
}

export function EmployeeCreateForm({
  fullName,
  setFullName,
  emailLocalPart,
  setEmailLocalPart,
  brandEmailDomain,
  fullEmail,
  selectedRoleOptions,
  onToggleRoleOption,
  operations,
  toggleOperation,
  availableOperations,
  temporaryPassword,
  setTemporaryPassword,
  onGeneratePassword,
  loading,
  error,
  onSubmit,
  onBack,
  roleOptions,
  t,
}: EmployeeCreateFormProps) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[24px] border border-[#E9E7EE] dark:border-white/5 bg-white/95 dark:bg-[#1A1B20]/95 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="border-b border-[#E9E7EE] dark:border-white/5 bg-gradient-to-r from-[#6C5CE7]/5 dark:from-[#9B8CFF]/5 via-transparent to-transparent px-6 py-8 md:px-10">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400 transition hover:text-[#6C5CE7] dark:hover:text-[#9B8CFF]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[24px] font-bold text-gray-900 dark:text-white">{t("team.form.title")}</h2>
              <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">{t("team.form.subtitle")}</p>
            </div>

          </div>

          <div className="mt-8 hidden gap-3 sm:flex">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center gap-3 rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/30 dark:hover:border-[#9B8CFF]/30">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#8E7CFF] dark:from-[#9B8CFF] dark:to-[#B4A8FF] text-[12px] font-bold text-white dark:text-[#1A1B20] shadow-md shadow-[#6C5CE7]/20 dark:shadow-none">
                  {step.id}
                </span>
                <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {error && (
            <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-6 py-4 text-[14px] text-red-700 md:px-8">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-8 p-6 md:p-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5CE7]/10 dark:bg-[#9B8CFF]/10 text-[13px] font-bold text-[#6C5CE7] dark:text-[#9B8CFF]">1</span>
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-300">{t("team.form.fullName")}</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder={t("team.form.fullNamePlaceholder")}
                    className="w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-5 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none transition-all focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10 shadow-sm dark:shadow-none"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-300">Email đăng nhập</span>
                  <div className="flex overflow-hidden rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 shadow-sm dark:shadow-none transition-all focus-within:border-[#6C5CE7] dark:focus-within:border-[#9B8CFF] focus-within:ring-4 focus-within:ring-[#6C5CE7]/10 dark:focus-within:ring-[#9B8CFF]/10">
                    <input
                      value={emailLocalPart}
                      onChange={(e) => setEmailLocalPart(e.target.value)}
                      required
                      placeholder="nhan_vien"
                      className="min-w-0 flex-1 bg-transparent px-5 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none"
                    />
                    <span className="shrink-0 border-l border-[#E9E7EE] dark:border-white/10 bg-gray-50/80 dark:bg-white/5 px-5 py-3.5 text-[14px] text-gray-500 dark:text-gray-400">
                      @{brandEmailDomain || "brand.com"}
                    </span>
                  </div>
                  {fullEmail && (
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                      <Mail className="h-3.5 w-3.5" />
                      Sẽ tạo: <strong className="text-gray-700 dark:text-gray-300">{fullEmail}</strong>
                    </span>
                  )}
                </label>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-100 dark:border-white/10 pt-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5CE7]/10 dark:bg-[#9B8CFF]/10 text-[13px] font-bold text-[#6C5CE7] dark:text-[#9B8CFF]">2</span>
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Vai trò & quyền truy cập</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`group cursor-pointer rounded-3xl border-2 p-5 transition-all duration-300 ${
                      selectedRoleOptions.includes(option.value)
                        ? "border-[#6C5CE7] dark:border-[#9B8CFF] bg-gradient-to-br from-[#6C5CE7]/5 to-transparent dark:from-[#9B8CFF]/10 dark:to-transparent shadow-lg shadow-[#6C5CE7]/5 dark:shadow-none"
                        : "border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-[#1A1B20] hover:border-[#6C5CE7]/30 dark:hover:border-[#9B8CFF]/30 hover:shadow-md dark:hover:shadow-none hover:-translate-y-1"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${selectedRoleOptions.includes(option.value) ? "bg-gradient-to-br from-[#6C5CE7] to-[#8E7CFF] dark:from-[#9B8CFF] dark:to-[#B4A8FF] text-white dark:text-[#1A1B20] shadow-lg shadow-[#6C5CE7]/30 dark:shadow-none" : "bg-gray-50 dark:bg-white/5 group-hover:scale-110"}`}>
                        <RoleIcon role={option.value} active={selectedRoleOptions.includes(option.value)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[16px] font-bold ${selectedRoleOptions.includes(option.value) ? "text-[#6C5CE7] dark:text-[#9B8CFF]" : "text-gray-900 dark:text-white"}`}>
                            {t(option.labelKey)}
                          </span>
                          {selectedRoleOptions.includes(option.value) && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#6C5CE7] dark:text-[#9B8CFF]" />
                          )}
                        </div>
                        <span className="mt-1 block text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                          {t(option.descriptionKey)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedRoleOptions.includes(option.value)}
                      onChange={() => onToggleRoleOption(option.value)}
                    />
                  </label>
                ))}
              </div>

              <fieldset className="space-y-3">
                <legend className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 dark:text-gray-300">
                  <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  {t("team.form.operations")}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availableOperations.map((operation) => {
                    const checked = operations.includes(operation.value);
                    return (
                      <label
                        key={operation.value}
                        className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300 ${
                          checked
                            ? "border-[#6C5CE7]/50 dark:border-[#9B8CFF]/50 bg-gradient-to-r from-[#6C5CE7]/10 to-transparent dark:from-[#9B8CFF]/15 dark:to-transparent"
                            : "border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#6C5CE7]/30 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none"
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${checked ? "border-[#6C5CE7] dark:border-[#9B8CFF] bg-[#6C5CE7] dark:bg-[#9B8CFF]" : "border-gray-300 dark:border-white/20 group-hover:border-[#6C5CE7]/50 dark:group-hover:border-[#9B8CFF]/50"}`}>
                          {checked && <CheckCircle2 className="h-3 w-3 text-white dark:text-[#1A1B20]" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOperation(operation.value)}
                          className="sr-only"
                        />
                        <span className="select-none text-[14px] font-medium text-gray-700 dark:text-gray-300">{t(operation.labelKey)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            <section className="space-y-4 border-t border-gray-100 dark:border-white/10 pt-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5CE7]/10 dark:bg-[#9B8CFF]/10 text-[13px] font-bold text-[#6C5CE7] dark:text-[#9B8CFF]">3</span>
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Mật khẩu tạm thời</h3>
              </div>

              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                Nhân viên sẽ dùng mật khẩu này để đăng nhập lần đầu và được yêu cầu đổi mật khẩu ngay sau đó.
              </p>

              <label className="block space-y-2">
                <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-300">{t("team.form.tempPassword")}</span>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={temporaryPassword}
                      onChange={(e) => setTemporaryPassword(e.target.value)}
                      required
                      minLength={10}
                      className="w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 py-3.5 pl-11 pr-4 font-mono text-[14px] text-gray-900 dark:text-white outline-none transition-all focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10 shadow-sm dark:shadow-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onGeneratePassword}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-6 py-3.5 text-[14px] font-semibold text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-none transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-md active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("team.form.generate")}
                  </button>
                </div>
                <PasswordStrength password={temporaryPassword} t={t} />
              </label>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E9E7EE] dark:border-white/10 bg-gray-50/30 dark:bg-[#1A1B20]/30 px-6 py-6 sm:flex-row sm:justify-end md:px-10">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-6 py-3.5 text-[14px] font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8E7CFF] dark:from-[#9B8CFF] dark:to-[#B4A8FF] px-8 py-3.5 text-[15px] font-semibold text-white dark:text-[#1A1B20] shadow-[0_8px_16px_rgba(108,92,231,0.25)] dark:shadow-[0_8px_16px_rgba(155,140,255,0.2)] transition-all hover:translate-y-[-2px] hover:shadow-[0_12px_20px_rgba(108,92,231,0.3)] dark:hover:shadow-[0_12px_20px_rgba(155,140,255,0.25)] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
              {loading ? t("team.form.submitting") : t("team.form.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
