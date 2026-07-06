"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

type StaffRole = "crisis_staff" | "lead_staff";

interface StaffAccount {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRole;
  brandName: string;
  permissions: string[];
  defaultRoute: string;
  temporaryPassword?: string;
}

const roleOptions: Array<{ value: StaffRole; label: string; labelKey: string; descKey: string }> = [
  {
    value: "crisis_staff",
    label: "Nhân viên xử lý khủng hoảng",
    labelKey: "team.roleOption.crisis.label",
    descKey: "team.roleOption.crisis.desc",
  },
  {
    value: "lead_staff",
    label: "Nhân viên xử lý khách hàng tiềm năng",
    labelKey: "team.roleOption.lead.label",
    descKey: "team.roleOption.lead.desc",
  },
];

const operationOptions = [
  { value: "dashboard", labelKey: "team.op.dashboard", label: "Theo dõi dữ liệu", roles: ["crisis_staff", "lead_staff"] },
  { value: "mentions", labelKey: "team.op.mentions", label: "Kiểm tra mention", roles: ["crisis_staff", "lead_staff"] },
  { value: "alerts", labelKey: "team.op.alerts", label: "Xử lý cảnh báo", roles: ["crisis_staff"] },
  { value: "reports", labelKey: "team.op.reports", label: "Hỗ trợ báo cáo", roles: ["crisis_staff", "lead_staff"] },
  { value: "leads", labelKey: "team.op.leads", label: "Xử lý khách hàng tiềm năng", roles: ["lead_staff"] },
];

const permissionLabels: Record<string, string> = {
  dashboard: "Dữ liệu",
  mentions: "Mentions",
  alerts: "Alerts",
  reports: "Reports",
  leads: "Leads",
};

const featureCards = [
  { id: 'dashboard', titleKey: 'team.feature.dashboard', descKey: 'team.featureDesc.dashboard', icon: 'ti ti-chart-pie', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'mentions', titleKey: 'team.feature.mentions', descKey: 'team.featureDesc.mentions', icon: 'ti ti-message-2', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'alerts', titleKey: 'team.feature.alerts', descKey: 'team.featureDesc.alerts', icon: 'ti ti-alert-triangle', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { id: 'reports', titleKey: 'team.feature.reports', descKey: 'team.featureDesc.reports', icon: 'ti ti-file-analytics', color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

export default function TeamPage() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("crisis_staff");
  const [operations, setOperations] = useState<string[]>(["dashboard", "mentions", "alerts", "reports"]);
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] = useState<StaffAccount | null>(null);

  const availableOperations = useMemo(
    () => operationOptions.filter((operation) => operation.roles.includes(staffRole)),
    [staffRole],
  );

  useEffect(() => {
    const defaults =
      staffRole === "crisis_staff"
        ? ["dashboard", "mentions", "alerts", "reports"]
        : ["dashboard", "mentions", "leads", "reports"];
    setOperations(defaults);
  }, [staffRole]);

  const loadStaff = async () => {
    setLoadingList(true);
    setError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu.");

      const response = await fetch("/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải danh sách nhân viên.");
      }

      setStaff(data.data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách nhân viên.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const toggleOperation = (operation: string) => {
    setOperations((current) => {
      if (current.includes(operation)) {
        return current.filter((item) => item !== operation);
      }
      return [...current, operation];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedAccount(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Bạn cần đăng nhập bằng tài khoản Quản lý thương hiệu.");

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          staffRole,
          operations,
          temporaryPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo tài khoản nhân viên.");
      }

      setCreatedAccount(data.data);
      setStaff((current) => {
        const withoutDuplicate = current.filter((item) => item.uid !== data.data.uid);
        return [data.data, ...withoutDuplicate];
      });
      setFullName("");
      setEmail("");
      setTemporaryPassword(generateTemporaryPassword());
    } catch (err: any) {
      setError(err.message || "Không thể tạo tài khoản nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* 3. Vùng tiêu đề trang */}
      <div className="glass-card rounded-2xl p-8 flex items-center justify-between relative overflow-hidden bg-[var(--color-bg-surface)]">
        <div className="relative z-10 space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] text-xs font-bold tracking-wider uppercase">
            {t("team.manageLabel", "QUẢN LÝ NHÂN VIÊN THEO BRAND")}
          </span>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">
            {t("team.pageTitle", "Tạo tài khoản và phân công nghiệp vụ")}
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-xl text-sm leading-relaxed">
            {t("team.pageDesc", "Tạo và quản lý các tài khoản nhân viên thuộc thương hiệu của bạn. Phân quyền truy cập an toàn và hiệu quả.")}
          </p>
        </div>
        <div className="hidden md:flex gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center rotate-[-10deg] shadow-sm">
            <i className="ti ti-shield-lock text-3xl text-purple-600 dark:text-purple-400"></i>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center rotate-[10deg] shadow-sm mt-8">
            <i className="ti ti-device-laptop text-3xl text-blue-600 dark:text-blue-400"></i>
          </div>
        </div>
        {/* Trang trí background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-brand-subtle)] to-transparent opacity-50 rounded-bl-full pointer-events-none"></div>
      </div>

      {/* 4. Hàng 4 thẻ chức năng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featureCards.map(card => (
          <div key={card.id} className="glass-card rounded-xl p-5 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
              <i className={`${card.icon} text-2xl ${card.color}`}></i>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)] text-sm">{t(card.titleKey, card.id)}</h3>
              <p className="text-[var(--color-text-secondary)] text-xs mt-1">{t(card.descKey, card.id)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Phần chính: Form (5) và Sidebar phải (6) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* 5. Form chính */}
        <div className="flex-1 w-full space-y-6">
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-8 bg-[var(--color-bg-surface)]">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <i className="ti ti-user-plus text-[var(--color-brand)]"></i>
              {t("team.createStaff", "Tạo nhân viên mới")}
            </h2>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <i className="ti ti-alert-circle text-lg"></i> {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t("team.fullName", "Họ tên")}</span>
                <div className="relative">
                  <i className="ti ti-user absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-lg"></i>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] focus:border-[var(--color-brand)] outline-none transition-all"
                  />
                </div>
              </label>
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t("team.email", "Email")}</span>
                <div className="relative">
                  <i className="ti ti-mail absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-lg"></i>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    placeholder="nhanvien@brand.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] focus:border-[var(--color-brand)] outline-none transition-all"
                  />
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t("team.role", "Vai trò")}</span>
              <div className="grid gap-4 md:grid-cols-2">
                {roleOptions.map(option => (
                  <label key={option.value} className={`cursor-pointer rounded-xl border-2 p-5 transition-all flex items-start gap-4 ${
                    staffRole === option.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] hover:border-[var(--color-border-strong)]"
                  }`}>
                    <div className="relative flex items-center justify-center mt-1 flex-shrink-0">
                      <input
                        type="radio"
                        className="sr-only"
                        checked={staffRole === option.value}
                        onChange={() => setStaffRole(option.value)}
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        staffRole === option.value ? "border-[var(--color-brand)]" : "border-[var(--color-text-muted)]"
                      }`}>
                        {staffRole === option.value && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand)]"></div>}
                      </div>
                    </div>
                    <div>
                      <span className="block font-bold text-[var(--color-text-primary)] mb-1">{t(option.labelKey, option.label)}</span>
                      <span className="block text-xs leading-relaxed text-[var(--color-text-secondary)]">{t(option.descKey, "")}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t("team.operations", "Nghiệp vụ được phân công")}</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableOperations.map(op => (
                  <label key={op.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={operations.includes(op.value)}
                        onChange={() => toggleOperation(op.value)}
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        operations.includes(op.value) ? "bg-[var(--color-brand)] border-[var(--color-brand)]" : "border-[var(--color-text-muted)] group-hover:border-[var(--color-border-strong)]"
                      }`}>
                        {operations.includes(op.value) && <i className="ti ti-check text-white text-xs"></i>}
                      </div>
                    </div>
                    <span className="text-sm text-[var(--color-text-primary)]">{t(op.labelKey, op.label)}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t("team.tempPassword", "Mật khẩu tạm thời")}</span>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <i className="ti ti-lock absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-lg"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] focus:border-[var(--color-brand)] outline-none transition-all font-mono tracking-wider"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg transition">
                    <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"} text-lg`}></i>
                  </button>
                </div>
                <button type="button" onClick={() => setTemporaryPassword(generateTemporaryPassword())} className="px-5 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)] transition flex items-center justify-center gap-2 flex-shrink-0">
                  <i className="ti ti-refresh"></i> {t("team.generate", "Sinh lại")}
                </button>
              </div>
            </label>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-hover)] transition-all shadow-[0_4px_14px_0_rgba(109,95,253,0.39)] hover:shadow-[0_6px_20px_rgba(109,95,253,0.23)] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2">
                {loading ? <i className="ti ti-loader animate-spin"></i> : <i className="ti ti-plus"></i>}
                {loading ? t("team.creating", "Đang tạo tài khoản...") : t("team.submitBtn", "Tạo tài khoản nhân viên")}
              </button>
            </div>
          </form>

          {/* Danh sách nhân viên */}
          <div className="glass-card rounded-2xl p-6 md:p-8 bg-[var(--color-bg-surface)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                 <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                   <i className="ti ti-users text-[var(--color-brand)]"></i>
                   {t("team.listTitle", "Danh sách nhân viên")}
                 </h2>
                 <p className="text-xs text-[var(--color-text-secondary)] mt-1 ml-7">
                   {t("team.listSubtitle", "Chỉ hiện nhân viên thuộc brand")} {profile?.brandName || ""}.
                 </p>
              </div>
              <button onClick={loadStaff} className="w-10 h-10 rounded-xl bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] flex items-center justify-center transition">
                <i className={`ti ti-refresh ${loadingList ? "animate-spin" : ""}`}></i>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-3 px-4 font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-xs">{t("team.colStaff", "Nhân viên")}</th>
                    <th className="py-3 px-4 font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-xs">{t("team.colRole", "Vai trò")}</th>
                    <th className="py-3 px-4 font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-xs">{t("team.colOps", "Nghiệp vụ")}</th>
                    <th className="py-3 px-4 font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-xs text-right">{t("team.colEntry", "Trang vào")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {loadingList ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[var(--color-text-secondary)]">
                        <i className="ti ti-loader animate-spin text-2xl text-[var(--color-brand)] mx-auto mb-2 block"></i>
                        {t("team.listLoading", "Đang tải danh sách...")}
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[var(--color-text-secondary)]">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-surface-raised)] flex items-center justify-center mx-auto mb-3">
                          <i className="ti ti-users text-2xl text-[var(--color-text-muted)]"></i>
                        </div>
                        {t("team.listEmpty", "Chưa có nhân viên nào được tạo.")}
                      </td>
                    </tr>
                  ) : (
                    staff.map(item => (
                      <tr key={item.uid} className="hover:bg-[var(--color-bg-surface-raised)] transition group">
                        <td className="py-4 px-4">
                          <div className="font-bold text-[var(--color-text-primary)]">{item.displayName}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{item.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                            item.role === 'crisis_staff' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {item.role === 'crisis_staff' ? t('team.role.crisis', 'Xử lý khủng hoảng') : t('team.role.lead', 'Xử lý lead')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(item.permissions || []).map(perm => (
                              <span key={perm} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--color-bg-surface-high)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                {permissionLabels[perm] || perm}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-raised)] px-2 py-1 rounded border border-[var(--color-border)]">
                            {item.defaultRoute}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. Sidebar phải (1/3) */}
        <div className="w-full xl:w-[360px] space-y-6 flex-shrink-0">
          
          {/* Card Thông tin bàn giao */}
          {createdAccount && (
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-[var(--color-brand-subtle)] to-[var(--color-bg-surface)] border-[var(--color-brand-border)] animate-in fade-in zoom-in duration-300">
              <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
                <i className="ti ti-circle-check text-[var(--color-success)] text-xl"></i>
                {t("team.success", "Tạo thành công!")}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[var(--color-brand-border)]">
                  <span className="text-[var(--color-text-secondary)]">{t("team.successStaff", "Nhân viên:")}</span>
                  <span className="font-bold text-[var(--color-text-primary)] text-right">{createdAccount.displayName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--color-brand-border)]">
                  <span className="text-[var(--color-text-secondary)]">{t("team.successEmail", "Email:")}</span>
                  <span className="font-bold text-[var(--color-text-primary)] text-right">{createdAccount.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--color-brand-border)]">
                  <span className="text-[var(--color-text-secondary)]">{t("team.successPassword", "Mật khẩu tạm:")}</span>
                  <span className="font-mono font-bold bg-[var(--color-bg-surface-raised)] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-brand)]">{createdAccount.temporaryPassword}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[var(--color-text-secondary)]">{t("team.successRoute", "Trang vào:")}</span>
                  <span className="font-mono text-[var(--color-text-primary)]">{createdAccount.defaultRoute}</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 bg-[var(--color-bg-surface)]">
            <h3 className="font-bold text-[var(--color-text-primary)] mb-5">{t("team.processTitle", "Quy trình tạo tài khoản")}</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
              {[
                { id: 1, titleKey: 'team.step1Title', descKey: 'team.step1Desc' },
                { id: 2, titleKey: 'team.step2Title', descKey: 'team.step2Desc' },
                { id: 3, titleKey: 'team.step3Title', descKey: 'team.step3Desc' },
                { id: 4, titleKey: 'team.step4Title', descKey: 'team.step4Desc' },
              ].map((step) => (
                <div key={step.id} className="relative">
                  <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-[var(--color-brand-subtle)] border-2 border-[var(--color-brand)] flex items-center justify-center text-[10px] font-bold text-[var(--color-brand)] z-10">
                    {step.id}
                  </div>
                  <h4 className="font-bold text-[var(--color-text-primary)] text-sm">{t(step.titleKey, step.titleKey)}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t(step.descKey, step.descKey)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 bg-[var(--color-info-subtle)] border-[var(--color-info)]/20 flex items-start gap-3">
            <i className="ti ti-info-circle text-[var(--color-info)] text-xl flex-shrink-0 mt-0.5"></i>
            <p className="text-sm text-[var(--color-info)] dark:text-blue-300 leading-relaxed font-medium">
              {t("team.securityNote", "Hệ thống sẽ yêu cầu nhân viên đổi mật khẩu ở lần đăng nhập đầu tiên để đảm bảo bảo mật.")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
