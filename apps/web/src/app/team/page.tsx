"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { validateStrongPassword } from "@/lib/passwordPolicy";

type StaffRole = "crisis_employee" | "lead_employee";
type LegacyStaffRole = "crisis_staff" | "lead_staff";
type StaffRoleValue = StaffRole | LegacyStaffRole;

interface StaffAccount {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRoleValue;
  brandName: string;
  permissions: string[];
  defaultRoute: string;
  temporaryPassword?: string;
  hasTemporaryPassword?: boolean;
  disabled?: boolean;
}

const roleOptions: Array<{ value: StaffRole; labelKey: string; descriptionKey: string }> = [
  {
    value: "crisis_employee",
    labelKey: "team.roles.crisis.label",
    descriptionKey: "team.roles.crisis.description",
  },
  {
    value: "lead_employee",
    labelKey: "team.roles.lead.label",
    descriptionKey: "team.roles.lead.description",
  },
];

const operationOptions = [
  { value: "dashboard", labelKey: "team.operations.dashboard", roles: ["crisis_employee", "lead_employee"] },
  { value: "mentions", labelKey: "team.operations.mentions", roles: ["crisis_employee", "lead_employee"] },
  { value: "alerts", labelKey: "team.operations.alerts", roles: ["crisis_employee"] },
  { value: "reports", labelKey: "team.operations.reports", roles: ["crisis_employee", "lead_employee"] },
  { value: "leads", labelKey: "team.operations.leads", roles: ["lead_employee"] },
];

const permissionLabels: Record<string, string> = {
  dashboard: "team.permissions.dashboard",
  mentions: "team.permissions.mentions",
  alerts: "team.permissions.alerts",
  reports: "team.permissions.reports",
  leads: "team.permissions.leads",
};

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

function isCrisisRole(role: StaffRoleValue) {
  return role === "crisis_employee" || role === "crisis_staff";
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("crisis_employee");
  const [operations, setOperations] = useState<string[]>(["dashboard", "mentions", "alerts", "reports"]);
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] = useState<StaffAccount | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [passwordRequestUid, setPasswordRequestUid] = useState<string | null>(null);
  const [passwordRequestMode, setPasswordRequestMode] = useState<"reveal" | "reset">("reveal");
  const [managerPassword, setManagerPassword] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState<StaffRole>("crisis_employee");
  const [editOperations, setEditOperations] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const availableOperations = useMemo(
    () => operationOptions.filter((operation) => operation.roles.includes(staffRole)),
    [staffRole],
  );

  const availableEditOperations = useMemo(
    () => operationOptions.filter((operation) => operation.roles.includes(editStaffRole)),
    [editStaffRole],
  );

  useEffect(() => {
    const defaults =
      staffRole === "crisis_employee"
        ? ["dashboard", "mentions", "alerts", "reports"]
        : ["dashboard", "mentions", "leads", "reports"];
    setOperations(defaults);
  }, [staffRole]);

  const loadStaff = async () => {
    setLoadingList(true);
    setError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("team.errors.needBrandManager"));

      const response = await fetch("/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("team.errors.loadFailed"));
      }

      setStaff(data.data || []);
    } catch (err: any) {
      setError(err.message || t("team.errors.loadFailed"));
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

  const toggleEditOperation = (operation: string) => {
    setEditOperations((current) => {
      if (current.includes(operation)) {
        return current.filter((item) => item !== operation);
      }
      return [...current, operation];
    });
  };

  const normalizeRoleForEdit = (role: StaffRoleValue): StaffRole => {
    return isCrisisRole(role) ? "crisis_employee" : "lead_employee";
  };

  const openEditModal = (account: StaffAccount) => {
    const normalizedRole = normalizeRoleForEdit(account.role);
    setEditingStaff(account);
    setEditFullName(account.displayName || "");
    setEditStaffRole(normalizedRole);
    setEditOperations(account.permissions?.length ? account.permissions : normalizedRole === "crisis_employee"
      ? ["dashboard", "mentions", "alerts", "reports"]
      : ["dashboard", "mentions", "leads", "reports"]);
    setActionError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedAccount(null);

    try {
      const passwordPolicy = validateStrongPassword(temporaryPassword);
      if (!passwordPolicy.valid) {
        throw new Error(passwordPolicy.errors.map((key) => t(key)).join(" "));
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("team.errors.needBrandManager"));

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
        throw new Error(data.error || t("team.errors.createFailed"));
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
      setError(err.message || t("team.errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRevealTemporaryPassword = async (staffUid: string) => {
    setRevealLoading(true);
    setRevealError("");

    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error(t("team.errors.invalidSession"));
      }

      const credential = EmailAuthProvider.credential(user.email, managerPassword);
      await reauthenticateWithCredential(user, credential);

      const selectedStaff = staff.find((item) => item.uid === staffUid);
      if (passwordRequestMode === "reveal" && selectedStaff?.temporaryPassword) {
        setRevealedPasswords((current) => ({
          ...current,
          [staffUid]: selectedStaff.temporaryPassword as string,
        }));
        setPasswordRequestUid(null);
        setManagerPassword("");
        return;
      }

      const token = await user.getIdToken(true);
      const endpoint =
        passwordRequestMode === "reset"
          ? `/api/staff/${staffUid}/reset-temporary-password`
          : `/api/staff/${staffUid}/temporary-password`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setStaff((current) =>
            current.map((item) =>
              item.uid === staffUid ? { ...item, hasTemporaryPassword: false, temporaryPassword: undefined } : item,
            ),
          );
        }
        throw new Error(data.error || t("team.errors.revealFailed"));
      }

      setRevealedPasswords((current) => ({
        ...current,
        [staffUid]: data.data.temporaryPassword,
      }));
      setStaff((current) =>
        current.map((item) =>
          item.uid === staffUid
            ? { ...item, hasTemporaryPassword: true, temporaryPassword: data.data.temporaryPassword }
            : item,
        ),
      );
      setPasswordRequestUid(null);
      setManagerPassword("");
    } catch (err: any) {
      const messageByCode: Record<string, string> = {
        "auth/wrong-password": t("team.errors.managerPasswordWrong"),
        "auth/invalid-credential": t("team.errors.managerPasswordWrong"),
        "auth/too-many-requests": t("team.errors.tooManyRequests"),
      };
      const backendMessage =
        err.message === "Temporary password is no longer available for this account."
          ? t("team.errors.tempPasswordUnavailable")
          : err.message;
      setRevealError(messageByCode[err.code] || backendMessage || t("team.errors.revealFailed"));
    } finally {
      setRevealLoading(false);
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;
    setSavingEdit(true);
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("team.errors.needBrandManager"));

      const response = await fetch(`/api/staff/${editingStaff.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: editFullName,
          staffRole: editStaffRole,
          operations: editOperations,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật tài khoản nhân viên.");
      }

      setStaff((current) =>
        current.map((item) => (item.uid === editingStaff.uid ? { ...item, ...data.data } : item)),
      );
      setEditingStaff(null);
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật tài khoản nhân viên.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (account: StaffAccount) => {
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("team.errors.needBrandManager"));

      const response = await fetch(`/api/staff/${account.uid}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabled: !account.disabled }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật trạng thái tài khoản.");
      }

      setStaff((current) =>
        current.map((item) => (item.uid === account.uid ? { ...item, ...data.data } : item)),
      );
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          {t("team.badge")}
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          {t("team.title")}
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--color-text-secondary)]">
          {t("team.subtitle", { brandName: profile?.brandName || t("team.currentBrandFallback") })}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 space-y-5"
        >
          <div>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">{t("team.form.title")}</h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              {t("team.form.subtitle")}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("team.form.fullName")}</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder={t("team.form.fullNamePlaceholder")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("team.form.email")}</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                placeholder={t("team.form.emailPlaceholder")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-4 transition ${staffRole === option.value
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]"
                  }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={staffRole === option.value}
                  onChange={() => setStaffRole(option.value)}
                />
                <span className="block text-[14px] font-bold text-[var(--color-text-primary)]">{t(option.labelKey)}</span>
                <span className="mt-1 block text-[12px] leading-5 text-[var(--color-text-secondary)]">
                  {t(option.descriptionKey)}
                </span>
              </label>
            ))}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("team.form.operations")}</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {availableOperations.map((operation) => (
                <label
                  key={operation.value}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-3 text-[14px] text-[var(--color-text-primary)]"
                >
                  <input
                    type="checkbox"
                    checked={operations.includes(operation.value)}
                    onChange={() => toggleOperation(operation.value)}
                    className="rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
                  />
                  {t(operation.labelKey)}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="space-y-2 block">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("team.form.tempPassword")}</span>
            <div className="flex gap-2">
              <input
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                required
                minLength={10}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
              <button
                type="button"
                onClick={() => setTemporaryPassword(generateTemporaryPassword())}
                className="rounded-lg border border-[var(--color-border)] px-4 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
              >
                {t("team.form.generate")}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--color-brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("team.form.submitting") : t("team.form.submit")}
          </button>
        </form>

        <aside className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">{t("team.handoff.title")}</h2>
          {createdAccount ? (
            <div className="mt-4 space-y-3 text-[13px] text-[var(--color-text-secondary)]">
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("team.handoff.employee")}</span> {createdAccount.displayName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Email:</span> {createdAccount.email}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("team.handoff.brand")}</span> {createdAccount.brandName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("team.handoff.tempPassword")}</span> {createdAccount.temporaryPassword}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("team.handoff.defaultRoute")}</span> {createdAccount.defaultRoute}</p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] leading-6 text-[var(--color-text-secondary)]">
              {t("team.handoff.empty")}
            </p>
          )}
        </aside>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">{t("team.list.title")}</h2>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              {t("team.list.subtitle", { brandName: profile?.brandName || t("team.list.brandFallback") })}
            </p>
          </div>
          <button
            onClick={loadStaff}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
          >
            {t("team.list.reload")}
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {actionError}
            </div>
          )}
          <table className="min-w-full text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              <tr>
                <th className="py-3 pr-4">{t("team.table.employee")}</th>
                <th className="py-3 pr-4">{t("team.table.role")}</th>
                <th className="py-3 pr-4">{t("team.table.operations")}</th>
                <th className="py-3 pr-4">Trang thai</th>
                <th className="py-3 pr-4">{t("team.table.defaultRoute")}</th>
                <th className="py-3 pr-4">{t("team.table.tempPassword")}</th>
                <th className="py-3 pr-4">Hanh dong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loadingList ? (
                <tr>
                  <td className="py-5 text-[var(--color-text-secondary)]" colSpan={7}>{t("team.table.loading")}</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td className="py-5 text-[var(--color-text-secondary)]" colSpan={7}>{t("team.table.empty")}</td>
                </tr>
              ) : (
                staff.map((item) => (
                  <tr key={item.uid}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{item.displayName}</p>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">{item.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-[var(--color-text-secondary)]">
                      {isCrisisRole(item.role) ? t("team.staffRole.crisis") : t("team.staffRole.lead")}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {(item.permissions || []).map((permission) => (
                          <span
                            key={permission}
                            className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-brand)]"
                          >
                            {permissionLabels[permission] ? t(permissionLabels[permission]) : permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${item.disabled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                        {item.disabled ? "Đã khóa" : "Đang hoạt động"}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-[var(--color-text-secondary)]">{item.defaultRoute}</td>
                    <td className="py-4 pr-4">
                      {revealedPasswords[item.uid] ? (
                        <span className="font-mono text-[13px] text-[var(--color-text-primary)]">
                          {revealedPasswords[item.uid]}
                        </span>
                      ) : item.hasTemporaryPassword || item.temporaryPassword ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordRequestUid(item.uid);
                            setPasswordRequestMode("reveal");
                            setRevealError("");
                            setManagerPassword("");
                          }}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-mono text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
                        >
                          ••••••••••
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordRequestUid(item.uid);
                            setPasswordRequestMode("reset");
                            setRevealError("");
                            setManagerPassword("");
                          }}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
                        >
                          {t("team.password.reset")}
                        </button>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
                        >
                          Sua
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${item.disabled
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                        >
                          {item.disabled ? "Mở khóa" : "Khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {passwordRequestUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-xl">
            <h3 className="text-[18px] font-bold text-[var(--color-text-primary)]">
              {passwordRequestMode === "reset" ? t("team.password.modal.resetTitle") : t("team.password.modal.revealTitle")}
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              {passwordRequestMode === "reset"
                ? t("team.password.modal.resetDesc")
                : t("team.password.modal.revealDesc")}
            </p>

            {revealError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {revealError}
              </div>
            )}

            <label className="mt-5 block space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t("team.password.modal.managerPassword")}
              </span>
              <input
                value={managerPassword}
                onChange={(event) => setManagerPassword(event.target.value)}
                type="password"
                autoFocus
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPasswordRequestUid(null);
                  setPasswordRequestMode("reveal");
                  setManagerPassword("");
                  setRevealError("");
                }}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
              >
                {t("team.password.modal.cancel")}
              </button>
              <button
                type="button"
                disabled={revealLoading || !managerPassword}
                onClick={() => handleRevealTemporaryPassword(passwordRequestUid)}
                className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {revealLoading
                  ? t("team.password.modal.authenticating")
                  : passwordRequestMode === "reset"
                    ? t("team.password.modal.resetAndReveal")
                    : t("team.password.modal.reveal")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[560px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-xl">
            <h3 className="text-[18px] font-bold text-[var(--color-text-primary)]">Chỉnh sửa tài khoản nhân viên</h3>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">{editingStaff.email}</p>

            <label className="mt-5 block space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Họ tên</span>
              <input
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg border p-4 transition ${editStaffRole === option.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]"
                    }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={editStaffRole === option.value}
                    onChange={() => {
                      setEditStaffRole(option.value);
                      setEditOperations(option.value === "crisis_employee"
                        ? ["dashboard", "mentions", "alerts", "reports"]
                        : ["dashboard", "mentions", "leads", "reports"]);
                    }}
                  />
                  <span className="block text-[14px] font-bold text-[var(--color-text-primary)]">{t(option.labelKey)}</span>
                  <span className="mt-1 block text-[12px] leading-5 text-[var(--color-text-secondary)]">
                    {t(option.descriptionKey)}
                  </span>
                </label>
              ))}
            </div>

            <fieldset className="mt-5 space-y-3">
              <legend className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("team.form.operations")}</legend>
              <div className="grid gap-2 md:grid-cols-2">
                {availableEditOperations.map((operation) => (
                  <label
                    key={operation.value}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-3 text-[14px] text-[var(--color-text-primary)]"
                  >
                    <input
                      type="checkbox"
                      checked={editOperations.includes(operation.value)}
                      onChange={() => toggleEditOperation(operation.value)}
                      className="rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
                    />
                    {t(operation.labelKey)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
              >
                Huy
              </button>
              <button
                type="button"
                disabled={savingEdit || !editFullName.trim()}
                onClick={handleEditStaff}
                className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEdit ? "Dang luu..." : "Luu thay doi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
