"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { validateStrongPassword } from "@/lib/passwordPolicy";

interface CreatedAccount {
  uid: string;
  email: string;
  displayName: string;
  brandName: string;
  brandId: string;
  temporaryPassword: string;
  defaultRoute: string;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);

  const brandPreview = useMemo(() => {
    return brandName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [brandName]);

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
          email,
          brandName,
          temporaryPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("admin.brandManager.errors.createFailed"));
      }

      setCreatedAccount(data.data);
      setFullName("");
      setEmail("");
      setBrandName("");
      setTemporaryPassword(generateTemporaryPassword());
    } catch (err: any) {
      setError(err.message || t("admin.brandManager.errors.createFailed"));
    } finally {
      setLoading(false);
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
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                placeholder="manager@brand.com"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("admin.brandManager.form.brand")}</span>
            <input
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              required
              placeholder="Highlands Coffee"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
            />
            {brandPreview && (
              <span className="block text-[12px] text-[var(--color-text-muted)]">Brand ID: {brandPreview}</span>
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
    </div>
  );
}
