"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { dbData } from "@/lib/firebase";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import { buildBrandEmail, getBrandEmailDomain, slugifyBrandDomain, type BrandOption } from "@/lib/brandEmail";
import { formatBrandDisplayName } from "@/lib/services/dashboard";

interface CreatedAccount {
  uid: string;
  email: string;
  displayName: string;
  brandName: string;
  brandId: string;
  temporaryPassword: string;
  defaultRoute: string;
}

interface BrandManagerAccount extends Omit<CreatedAccount, "temporaryPassword"> {
  temporaryPassword?: string;
  disabled?: boolean;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [emailLocalPart, setEmailLocalPart] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);
  const [brandManagers, setBrandManagers] = useState<BrandManagerAccount[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [actionError, setActionError] = useState("");
  const [editingAccount, setEditingAccount] = useState<BrandManagerAccount | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editBrandName, setEditBrandName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const brandPreview = useMemo(() => {
    return slugifyBrandDomain(brandName);
  }, [brandName]);

  const selectedBrand = useMemo(
    () => brandOptions.find((brand) => brand.name === brandName),
    [brandName, brandOptions],
  );
  const selectedBrandDomain = selectedBrand?.domain || getBrandEmailDomain(brandName);
  const fullEmail = buildBrandEmail(emailLocalPart, selectedBrandDomain);

  const loadCrawledBrands = async () => {
    setLoadingBrands(true);

    try {
      const brandMap = new Map<string, BrandOption>();

      const seedBrands = ["Highland Coffee", "Starbucks", "Mixue"];
      seedBrands.forEach((name) => {
        const key = slugifyBrandDomain(name);
        brandMap.set(key, {
          id: key,
          name,
          domain: getBrandEmailDomain(name),
        });
      });

      if (dbData) {
        const snapshot = await getDocs(query(collection(dbData, "insightflow_labels"), limit(1000)));
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const rawBrand = String(data.brand || data.workspace_id || data.brandName || "").trim();
          if (!rawBrand) return;

          const name = formatBrandDisplayName(rawBrand);
          const key = slugifyBrandDomain(name);
          if (!key) return;

          brandMap.set(key, {
            id: String(data.workspace_id || data.brand || key),
            name,
            domain: getBrandEmailDomain(name),
          });
        });
      }

      const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setBrandOptions(brands);
      setBrandName((current) => current || brands[0]?.name || "");
    } catch (error) {
      console.warn("Could not load crawled brands for Admin form.", error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadBrandManagers = async () => {
    setLoadingList(true);
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error(t("admin.brandManager.errors.needAdmin"));
      }

      const response = await fetch("/api/admin/brand-managers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Khong the tai danh sach Brand Manager.");
      }

      setBrandManagers(data.data || []);
    } catch (err: any) {
      setActionError(err.message || "Khong the tai danh sach Brand Manager.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadBrandManagers();
    loadCrawledBrands();
  }, []);

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
      if (!token) {
        throw new Error(t("admin.brandManager.errors.needAdmin"));
      }

      const response = await fetch("/api/admin/brand-managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email: fullEmail,
          brandName,
          temporaryPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("admin.brandManager.errors.createFailed"));
      }

      setCreatedAccount(data.data);
      setBrandManagers((current) => {
        const withoutDuplicate = current.filter((item) => item.uid !== data.data.uid);
        return [data.data, ...withoutDuplicate];
      });
      setFullName("");
      setEmailLocalPart("");
      setTemporaryPassword(generateTemporaryPassword());
    } catch (err: any) {
      setError(err.message || t("admin.brandManager.errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (account: BrandManagerAccount) => {
    setEditingAccount(account);
    setEditFullName(account.displayName || "");
    setEditBrandName(account.brandName || "");
    setActionError("");
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;
    setSavingEdit(true);
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("admin.brandManager.errors.needAdmin"));

      const response = await fetch(`/api/admin/brand-managers/${editingAccount.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editFullName,
          brandName: editBrandName,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật tài khoản.");
      }

      setBrandManagers((current) =>
        current.map((item) => (item.uid === editingAccount.uid ? { ...item, ...data.data } : item)),
      );
      setEditingAccount(null);
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật tài khoản.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (account: BrandManagerAccount) => {
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("admin.brandManager.errors.needAdmin"));

      const response = await fetch(`/api/admin/brand-managers/${account.uid}/status`, {
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

      setBrandManagers((current) =>
        current.map((item) => (item.uid === account.uid ? { ...item, ...data.data } : item)),
      );
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  const flowSteps = [
    t("admin.brandManager.flow.1"),
    t("admin.brandManager.flow.2"),
    t("admin.brandManager.flow.3"),
    t("admin.brandManager.flow.4"),
    t("admin.brandManager.flow.5"),
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          {t("admin.brandManager.badge")}
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          {t("admin.brandManager.title")}
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--color-text-secondary)]">
          {t("admin.brandManager.subtitle")}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {flowSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[13px] font-bold text-[var(--color-brand)]">
              {index + 1}
            </div>
            <p className="text-[13px] font-medium leading-5 text-[var(--color-text-primary)]">{step}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 space-y-5"
        >
          <div>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">
              {t("admin.brandManager.form.title")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              {t("admin.brandManager.form.subtitle")}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.form.fullName")}</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder={t("admin.brandManager.form.fullNamePlaceholder")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.form.email")}</span>
              <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] focus-within:border-[var(--color-brand)]">
                <input
                  value={emailLocalPart}
                  onChange={(event) => setEmailLocalPart(event.target.value)}
                  required
                  placeholder="manager"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none"
                />
                <span className="shrink-0 border-l border-[var(--color-border)] px-3 py-2.5 text-[14px] text-[var(--color-text-secondary)]">
                  @{selectedBrandDomain || "brand.com"}
                </span>
              </div>
              {fullEmail && (
                <span className="block text-[12px] text-[var(--color-text-muted)]">Email: {fullEmail}</span>
              )}
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.form.brand")}</span>
            <select
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              required
              disabled={loadingBrands || brandOptions.length === 0}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {brandOptions.map((brand) => (
                <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
            {brandPreview && (
              <span className="block text-[12px] text-[var(--color-text-muted)]">
                Brand ID: {brandPreview} - Domain: {selectedBrandDomain}
              </span>
            )}
          </label>

          <label className="space-y-2 block">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.form.tempPassword")}</span>
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
                {t("admin.brandManager.form.generate")}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--color-brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("admin.brandManager.form.submitting") : t("admin.brandManager.form.submit")}
          </button>
        </form>

        <aside className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">{t("admin.brandManager.result.title")}</h2>
          {createdAccount ? (
            <div className="mt-4 space-y-3 text-[13px] text-[var(--color-text-secondary)]">
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.result.fullName")}</span> {createdAccount.displayName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Email:</span> {createdAccount.email}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.result.brand")}</span> {createdAccount.brandName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Brand ID:</span> {createdAccount.brandId}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.result.tempPassword")}</span> {createdAccount.temporaryPassword}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.result.defaultRoute")}</span> {createdAccount.defaultRoute}</p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] leading-6 text-[var(--color-text-secondary)]">
              {t("admin.brandManager.result.empty")}
            </p>
          )}
        </aside>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">Danh sach Brand Manager</h2>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Admin quan ly toan bo tai khoan quan ly thuong hieu.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBrandManagers}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
          >
            Tai lai
          </button>
        </div>

        {actionError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {actionError}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              <tr>
                <th className="py-3 pr-4">Tai khoan</th>
                <th className="py-3 pr-4">Thuong hieu</th>
                <th className="py-3 pr-4">Trang thai</th>
                <th className="py-3 pr-4">Hanh dong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loadingList ? (
                <tr>
                  <td className="py-5 text-[var(--color-text-secondary)]" colSpan={4}>Dang tai danh sach...</td>
                </tr>
              ) : brandManagers.length === 0 ? (
                <tr>
                  <td className="py-5 text-[var(--color-text-secondary)]" colSpan={4}>Chua co Brand Manager nao.</td>
                </tr>
              ) : (
                brandManagers.map((item) => (
                  <tr key={item.uid}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{item.displayName}</p>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">{item.email}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-[var(--color-text-primary)]">{item.brandName}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">{item.brandId}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${item.disabled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                        {item.disabled ? "Đã khóa" : "Đang hoạt động"}
                      </span>
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

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[440px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-xl">
            <h3 className="text-[18px] font-bold text-[var(--color-text-primary)]">Chinh sua Brand Manager</h3>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">{editingAccount.email}</p>

            <label className="mt-5 block space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Ho ten</span>
              <input
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Thuong hieu</span>
              <select
                value={editBrandName}
                onChange={(event) => setEditBrandName(event.target.value)}
                disabled={brandOptions.length === 0}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              >
                {editBrandName && !brandOptions.some((brand) => brand.name === editBrandName) && (
                  <option value={editBrandName}>{editBrandName}</option>
                )}
                {brandOptions.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-subtle)]"
              >
                Huy
              </button>
              <button
                type="button"
                disabled={savingEdit || !editFullName.trim() || !editBrandName.trim()}
                onClick={handleEditAccount}
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
