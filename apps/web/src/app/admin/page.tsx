"use client";

import React, { useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

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
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Ban can dang nhap bang tai khoan Admin.");
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
        throw new Error(data.error || "Khong the tao tai khoan Brand Manager.");
      }

      setCreatedAccount(data.data);
      setFullName("");
      setEmail("");
      setBrandName("");
      setTemporaryPassword(generateTemporaryPassword());
    } catch (err: any) {
      setError(err.message || "Khong the tao tai khoan Brand Manager.");
    } finally {
      setLoading(false);
    }
  };

  const flowSteps = [
    "Admin xac dinh Brand Manager trong Sprint 2",
    "Admin nhap ho ten, email, thuong hieu va mat khau tam",
    "He thong tao Firebase Auth user",
    "He thong luu users/{uid} voi role brand_manager va brandId",
    "Brand Manager dang nhap bang tai khoan duoc cap san",
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          Sprint 2 Admin
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          Cap tai khoan Brand Manager
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--color-text-secondary)]">
          Brand Manager khong tu dang ky. Admin tao tai khoan san, gan dung thuong hieu va cap mat khau tam thoi
          de nguoi phu trach thuong hieu dang nhap vao InsightFlow.
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
              Tao tai khoan moi
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              Tai khoan se duoc luu vao Firebase Auth va collection users voi role brand_manager.
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
                placeholder="Nguyen Van Quan Ly"
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
                placeholder="manager@brand.com"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Thuong hieu</span>
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
            {loading ? "Dang tao tai khoan..." : "Tao Brand Manager"}
          </button>
        </form>

        <aside className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">Ket qua cap tai khoan</h2>
          {createdAccount ? (
            <div className="mt-4 space-y-3 text-[13px] text-[var(--color-text-secondary)]">
              <p><span className="font-semibold text-[var(--color-text-primary)]">Ho ten:</span> {createdAccount.displayName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Email:</span> {createdAccount.email}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Thuong hieu:</span> {createdAccount.brandName}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Brand ID:</span> {createdAccount.brandId}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Mat khau tam:</span> {createdAccount.temporaryPassword}</p>
              <p><span className="font-semibold text-[var(--color-text-primary)]">Trang vao:</span> {createdAccount.defaultRoute}</p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] leading-6 text-[var(--color-text-secondary)]">
              Sau khi tao thanh cong, thong tin tai khoan va thuong hieu gan kem se hien o day de Admin ban giao cho
              Brand Manager.
            </p>
          )}
        </aside>
      </section>
    </div>
  );
}

