"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";

export default function ChangePasswordPage() {
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
        throw new Error("Phien dang nhap khong hop le. Vui long dang nhap lai.");
      }

      if (!passwordPolicy.valid) {
        throw new Error(passwordPolicy.errors.join(" "));
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Mat khau moi va xac nhan mat khau khong khop.");
      }

      if (temporaryPassword === newPassword) {
        throw new Error("Mat khau moi phai khac mat khau tam thoi.");
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
        throw new Error(data.error || "Khong the hoan tat doi mat khau.");
      }

      if (profile) {
        setProfile({ ...profile, temporaryPasswordIssued: false });
      }

      await user.getIdToken(true);
      router.replace(profile?.defaultRoute || "/dashboard");
    } catch (err: any) {
      const messageByCode: Record<string, string> = {
        "auth/wrong-password": "Mat khau tam thoi khong dung.",
        "auth/invalid-credential": "Mat khau tam thoi khong dung hoac da het hieu luc.",
        "auth/weak-password": "Mat khau moi chua du manh.",
        "auth/requires-recent-login": "Vui long dang nhap lai roi doi mat khau.",
        "auth/too-many-requests": "Firebase dang tam khoa yeu cau do thu sai qua nhieu lan. Vui long doi vai phut roi thu lai, hoac lien he Admin/Quan ly thuong hieu de cap lai mat khau tam.",
      };
      setError(messageByCode[err.code] || err.message || "Khong the doi mat khau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8">
      <div className="mx-auto max-w-[560px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 md:p-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand)]">
          Bao mat tai khoan
        </p>
        <h1 className="mt-2 text-[28px] font-bold text-[var(--color-text-primary)]">
          Doi mat khau lan dau
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-secondary)]">
          Tai khoan cua ban dang dung mat khau tam thoi. Hay dat mat khau moi truoc khi su dung InsightFlow.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block space-y-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Mat khau tam thoi</span>
            <input
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Mat khau moi</span>
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Xac nhan mat khau moi</span>
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
            Hien mat khau
          </label>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4">
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Chinh sach mat khau</p>
            <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-secondary)]">
              <li>Toi thieu 10 ky tu.</li>
              <li>Co chu hoa, chu thuong, so va ky tu dac biet.</li>
              <li>Khac voi mat khau tam thoi.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-brand)] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Dang doi mat khau..." : "Doi mat khau va tiep tuc"}
          </button>
        </form>
      </div>
    </main>
  );
}
