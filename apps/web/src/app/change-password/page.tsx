"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const { setProfile } = useAuthStore();
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordPolicy = validateStrongPassword(newPassword);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error(t("changePassword.errors.invalidSession"));
      }

      if (!passwordPolicy.valid) {
        throw new Error(passwordPolicy.errors.map((key) => t(key)).join(" "));
      }

      if (newPassword !== confirmPassword) {
        throw new Error(t("changePassword.errors.mismatch"));
      }

      if (temporaryPassword === newPassword) {
        throw new Error(t("changePassword.errors.sameAsTemporary"));
      }

      const credential = EmailAuthProvider.credential(user.email, temporaryPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      const token = await user.getIdToken(true);
      const response = await fetch("/api/auth/complete-first-password-change", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("changePassword.errors.completeFailed"));
      }

      if (profile) {
        setProfile({ ...profile, temporaryPasswordIssued: false });
      }

      await user.getIdToken(true);
      router.replace(profile?.defaultRoute || "/dashboard");
    } catch (err: any) {
      const messageByCode: Record<string, string> = {
        "auth/wrong-password": t("changePassword.errors.wrongTemporary"),
        "auth/invalid-credential": t("changePassword.errors.invalidTemporary"),
        "auth/weak-password": t("changePassword.errors.weakPassword"),
        "auth/requires-recent-login": t("changePassword.errors.recentLogin"),
        "auth/too-many-requests": t("changePassword.errors.tooManyRequests"),
      };
      setError(messageByCode[err.code] || err.message || t("changePassword.errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8">
      <div className="mx-auto max-w-[560px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 md:p-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          {t("changePassword.badge")}
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          {t("changePassword.title")}
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-secondary)]">
          {t("changePassword.subtitle")}
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block space-y-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("changePassword.temporaryPassword")}</span>
            <input
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("changePassword.newPassword")}</span>
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("changePassword.confirmPassword")}</span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
            />
            {t("changePassword.showPassword")}
          </label>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4">
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t("changePassword.policy.title")}</p>
            <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-secondary)]">
              <li>{t("changePassword.policy.length")}</li>
              <li>{t("changePassword.policy.complexity")}</li>
              <li>{t("changePassword.policy.different")}</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("changePassword.submitting") : t("changePassword.submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
