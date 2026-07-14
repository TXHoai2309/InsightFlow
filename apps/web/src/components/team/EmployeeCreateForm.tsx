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
    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
      <p className="mb-2 text-[12px] font-semibold text-gray-600">Yêu cầu mật khẩu</p>
      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.key} className={`flex items-center gap-2 text-[12px] ${check.ok ? "text-green-600" : "text-gray-500"}`}>
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${check.ok ? "opacity-100" : "opacity-30"}`} />
            {t(check.key)}
          </li>
        ))}
      </ul>
      {policy.valid && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mật khẩu đạt yêu cầu
        </p>
      )}
    </div>
  );
}

function RoleIcon({ role }: { role: RoleAssignmentOption["value"] }) {
  if (role === "crisis_employee") {
    return <AlertTriangle className="h-5 w-5 text-orange-500" />;
  }
  return <Target className="h-5 w-5 text-blue-500" />;
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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#6C5CE7]/8 via-white to-white px-6 py-5 md:px-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 transition hover:text-[#6C5CE7]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[24px] font-bold text-gray-900">{t("team.form.title")}</h2>
              <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-gray-500">{t("team.form.subtitle")}</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#6C5CE7]/20 bg-[#6C5CE7]/5 px-4 py-2 text-[13px] font-medium text-[#6C5CE7]">
              <UserPlus className="h-4 w-4" />
              Tài khoản mới
            </div>
          </div>

          <div className="mt-6 hidden gap-2 sm:grid sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center gap-2 rounded-xl border border-[#6C5CE7]/15 bg-white/80 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-[11px] font-bold text-white">
                  {step.id}
                </span>
                <span className="truncate text-[12px] font-medium text-gray-700">{step.label}</span>
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
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5CE7]/10 text-[13px] font-bold text-[#6C5CE7]">1</span>
                <h3 className="text-[16px] font-bold text-gray-900">Thông tin cơ bản</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-[14px] font-semibold text-gray-900">{t("team.form.fullName")}</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder={t("team.form.fullNamePlaceholder")}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[14px] text-gray-900 outline-none transition-all focus:border-[#6C5CE7] focus:bg-white focus:ring-1 focus:ring-[#6C5CE7]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="block text-[14px] font-semibold text-gray-900">Email đăng nhập</span>
                  <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 transition-all focus-within:border-[#6C5CE7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#6C5CE7]">
                    <input
                      value={emailLocalPart}
                      onChange={(e) => setEmailLocalPart(e.target.value)}
                      required
                      placeholder="nhan_vien"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14px] text-gray-900 outline-none"
                    />
                    <span className="shrink-0 border-l border-gray-200 bg-gray-100/50 px-4 py-3 text-[14px] text-gray-500">
                      @{brandEmailDomain || "brand.com"}
                    </span>
                  </div>
                  {fullEmail && (
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      Sẽ tạo: <strong className="text-gray-700">{fullEmail}</strong>
                    </span>
                  )}
                </label>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5CE7]/10 text-[13px] font-bold text-[#6C5CE7]">2</span>
                <h3 className="text-[16px] font-bold text-gray-900">Vai trò & quyền truy cập</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      selectedRoleOptions.includes(option.value)
                        ? "border-[#6C5CE7] bg-[#6C5CE7]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <RoleIcon role={option.value} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] font-bold ${selectedRoleOptions.includes(option.value) ? "text-[#6C5CE7]" : "text-gray-900"}`}>
                            {t(option.labelKey)}
                          </span>
                          {selectedRoleOptions.includes(option.value) && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#6C5CE7]" />
                          )}
                        </div>
                        <span className="mt-1 block text-[13px] leading-relaxed text-gray-500">
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
                <legend className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                  <Shield className="h-4 w-4 text-gray-400" />
                  {t("team.form.operations")}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availableOperations.map((operation) => {
                    const checked = operations.includes(operation.value);
                    return (
                      <label
                        key={operation.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                          checked
                            ? "border-[#6C5CE7]/30 bg-[#6C5CE7]/5"
                            : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOperation(operation.value)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#6C5CE7] focus:ring-[#6C5CE7]"
                        />
                        <span className="select-none text-[14px] font-medium text-gray-700">{t(operation.labelKey)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5CE7]/10 text-[13px] font-bold text-[#6C5CE7]">3</span>
                <h3 className="text-[16px] font-bold text-gray-900">Mật khẩu tạm thời</h3>
              </div>

              <p className="text-[13px] text-gray-500">
                Nhân viên sẽ dùng mật khẩu này để đăng nhập lần đầu và được yêu cầu đổi mật khẩu ngay sau đó.
              </p>

              <label className="block space-y-2">
                <span className="block text-[14px] font-semibold text-gray-900">{t("team.form.tempPassword")}</span>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={temporaryPassword}
                      onChange={(e) => setTemporaryPassword(e.target.value)}
                      required
                      minLength={10}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 font-mono text-[14px] text-gray-900 outline-none transition-all focus:border-[#6C5CE7] focus:bg-white focus:ring-1 focus:ring-[#6C5CE7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onGeneratePassword}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("team.form.generate")}
                  </button>
                </div>
                <PasswordStrength password={temporaryPassword} t={t} />
              </label>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-5 sm:flex-row sm:justify-end md:px-8">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6C5CE7] px-8 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#5a4cdb] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? t("team.form.submitting") : t("team.form.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
