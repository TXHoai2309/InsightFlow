"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

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
}

const roleOptions: Array<{ value: StaffRole; label: string; description: string }> = [
  {
    value: "crisis_employee",
    label: "Nhan vien xu ly khung hoang",
    description: "Co the xu ly mentions, canh bao va bao cao. Khong truy cap Leads.",
  },
  {
    value: "lead_employee",
    label: "Nhan vien xu ly khach hang tiem nang",
    description: "Co the xu ly mentions, leads va bao cao. Khong truy cap Alerts.",
  },
];

const operationOptions = [
  { value: "dashboard", label: "Theo doi du lieu", roles: ["crisis_employee", "lead_employee"] },
  { value: "mentions", label: "Kiem tra mention", roles: ["crisis_employee", "lead_employee"] },
  { value: "alerts", label: "Xu ly canh bao", roles: ["crisis_employee"] },
  { value: "reports", label: "Ho tro bao cao", roles: ["crisis_employee", "lead_employee"] },
  { value: "leads", label: "Xu ly khach hang tiem nang", roles: ["lead_employee"] },
];

const permissionLabels: Record<string, string> = {
  dashboard: "Du lieu",
  mentions: "Mentions",
  alerts: "Alerts",
  reports: "Reports",
  leads: "Leads",
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

  const availableOperations = useMemo(
    () => operationOptions.filter((operation) => operation.roles.includes(staffRole)),
    [staffRole],
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
      if (!token) throw new Error("Ban can dang nhap bang tai khoan Quan ly thuong hieu.");

      const response = await fetch("/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Khong the tai danh sach nhan vien.");
      }

      setStaff(data.data || []);
    } catch (err: any) {
      setError(err.message || "Khong the tai danh sach nhan vien.");
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
      if (!token) throw new Error("Ban can dang nhap bang tai khoan Quan ly thuong hieu.");

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
        throw new Error(data.error || "Khong the tao tai khoan nhan vien.");
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
      setError(err.message || "Khong the tao tai khoan nhan vien.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          Quan ly nhan vien theo brand
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          Tao tai khoan va phan cong nghiep vu
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--color-text-secondary)]">
          Nhan vien duoc tao tai day se tu dong gan voi thuong hieu{" "}
          <strong>{profile?.brandName || "dang duoc gan cho ban"}</strong>. Moi tai khoan se chi truy cap cac chuc
          nang dung voi nghiep vu duoc phan cong.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 space-y-5"
        >
          <div>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">Tao nhan vien moi</h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              Brand se duoc lay tu ho so Brand Manager hien tai, khong nhap thu cong.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Ho ten</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Nguyen Van A"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                placeholder="nhan_vien@brand.com"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-4 transition ${
                  staffRole === option.value
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
                <span className="block text-[14px] font-bold text-[var(--color-text-primary)]">{option.label}</span>
                <span className="mt-1 block text-[12px] leading-5 text-[var(--color-text-secondary)]">
                  {option.description}
                </span>
              </label>
            ))}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-[13px] font-semibold text-[var(--color-text-primary)]">Nghiep vu duoc phan cong</legend>
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
                  {operation.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="space-y-2 block">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Mat khau tam thoi</span>
            <div className="flex gap-2">
              <input
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
              <button
                type="button"
                onClick={() => setTemporaryPassword(generateTemporaryPassword())}
                className="rounded-lg border border-[var(--color-border)] px-4 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
              >
                Sinh
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--color-brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Dang tao tai khoan..." : "Tao tai khoan nhan vien"}
          </button>
        </form>

        <aside className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">Thong tin ban giao</h2>
          {createdAccount ? (
            <div className="mt-4 space-y-3 text-[13px] text-[var(--color-text-secondary)]">
              <p><span className="font-semibold text-[var(--color-text-primary)]">Nhan vien:</span> {createdAccount.displayName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Email:</span> {createdAccount.email}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Brand:</span> {createdAccount.brandName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Mat khau tam:</span> {createdAccount.temporaryPassword}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Trang vao:</span> {createdAccount.defaultRoute}</p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] leading-6 text-[var(--color-text-secondary)]">
              Sau khi tao thanh cong, thong tin dang nhap tam thoi cua nhan vien se hien tai day.
            </p>
          )}
        </aside>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">Danh sach nhan vien</h2>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Chi hien nhan vien thuoc brand {profile?.brandName || "hien tai"}.
            </p>
          </div>
          <button
            onClick={loadStaff}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
          >
            Tai lai
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              <tr>
                <th className="py-3 pr-4">Nhan vien</th>
                <th className="py-3 pr-4">Vai tro</th>
                <th className="py-3 pr-4">Nghiep vu</th>
                <th className="py-3 pr-4">Trang vao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loadingList ? (
                <tr>
                  <td className="py-5 text-[var(--color-text-secondary)]" colSpan={4}>Dang tai danh sach...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td className="py-5 text-[var(--color-text-secondary)]" colSpan={4}>Chua co nhan vien nao.</td>
                </tr>
              ) : (
                staff.map((item) => (
                  <tr key={item.uid}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{item.displayName}</p>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">{item.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-[var(--color-text-secondary)]">
                      {isCrisisRole(item.role) ? "Xu ly khung hoang" : "Xu ly lead"}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {(item.permissions || []).map((permission) => (
                          <span
                            key={permission}
                            className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-brand)]"
                          >
                            {permissionLabels[permission] || permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-[var(--color-text-secondary)]">{item.defaultRoute}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

