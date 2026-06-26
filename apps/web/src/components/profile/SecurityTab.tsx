"use client";

import { useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  displayName: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrengthColor(level: StrengthLevel, barIndex: number, isDark: boolean): string {
  if (barIndex >= level) return isDark ? "bg-[#252530]" : "bg-[#E2E4F0]";
  if (level === 1) return "bg-[#EF4444]";
  if (level === 2) return "bg-[#F97316]";
  if (level === 3) return "bg-[#EAB308]";
  return "bg-[#22C55E]";
}

export default function SecurityTab({ displayName }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const strengthLabels = [
    t("profile.security.strengthLabels.empty"),
    t("profile.security.strengthLabels.weak"),
    t("profile.security.strengthLabels.medium"),
    t("profile.security.strengthLabels.strong"),
    t("profile.security.strengthLabels.veryStrong"),
  ];

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password requirements
  const hasLen = newPw.length >= 8;
  const hasUpper = /[A-Z]/.test(newPw);
  const hasNum = /[0-9]/.test(newPw);
  const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(newPw);

  const strength: StrengthLevel = [hasLen, hasUpper, hasNum, hasSpec].filter(Boolean).length as StrengthLevel;
  const passwordsMatch = confirmPw.length > 0 && confirmPw === newPw;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !passwordsMatch || strength < 3) {
      alert(t("profile.security.errorInvalid"));
      return;
    }
    setIsSubmitting(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
      const user = auth.currentUser;

      if (!user || !user.email) {
        alert(t("profile.security.loginNotFound"));
        setIsSubmitting(false);
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        alert(t("profile.security.errorWrongCurrent"));
      } else {
        alert(t("profile.security.errorGeneral") + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const Req = ({ ok, label }: { ok: boolean; label: string }) => (
    <li 
      className="flex items-center gap-[8px] text-[13px] transition-colors"
      style={{ color: isDark ? (ok ? "var(--color-success)" : "var(--color-text-secondary)") : (ok ? "#22C55E" : "#4A4A6A") }}
    >
      {ok ? (
        <i className="ti ti-circle-check-filled text-[18px]" style={{ color: "var(--color-success)" }}></i>
      ) : (
        <i className="ti ti-circle text-[18px]" style={{ color: isDark ? "var(--color-text-disabled)" : "#E2E4F0" }}></i>
      )}
      {label}
    </li>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in duration-300">
      {/* ── Left: Form ── */}
      <div className="md:col-span-2 space-y-8">
        <section>
          <h2 className="text-[20px] leading-[28px] font-semibold mb-6" style={{ color: isDark ? "var(--color-text-primary)" : "#111c2d" }}>
            {t("profile.security.title")}
          </h2>

          <form className="space-y-[24px]" onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium" style={{ color: isDark ? "var(--color-text-secondary)" : "#464554" }}>
                {t("profile.security.current")}
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[44px] px-[16px] pr-12 rounded-[10px] border-[1.5px] focus:ring-[3px] focus:ring-[#6C63FF]/12 focus:border-[#6C63FF] outline-none transition-all text-[14px] font-normal placeholder:text-[#9898B0]"
                  style={{
                    backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
                    borderColor: isDark ? "var(--color-border)" : "#E2E4F0",
                    color: isDark ? "var(--color-text-primary)" : "#4A4A6A",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B0] hover:text-[#6C63FF] transition-colors"
                >
                  <i className={"ti " + (showCurrent ? "ti-eye-off" : "ti-eye") + " text-[18px]"}></i>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium" style={{ color: isDark ? "var(--color-text-secondary)" : "#464554" }}>
                {t("profile.security.new")}
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder={t("profile.security.newPlaceholder")}
                  className="w-full h-[44px] px-[16px] pr-12 rounded-[10px] border-[1.5px] focus:ring-[3px] focus:ring-[#6C63FF]/12 focus:border-[#6C63FF] outline-none transition-all text-[14px] font-normal placeholder:text-[#9898B0]"
                  style={{
                    backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
                    borderColor: isDark ? "var(--color-border)" : "#E2E4F0",
                    color: isDark ? "var(--color-text-primary)" : "#4A4A6A",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B0] hover:text-[#6C63FF] transition-colors"
                >
                  <i className={"ti " + (showNew ? "ti-eye-off" : "ti-eye") + " text-[18px]"}></i>
                </button>
              </div>

              {/* Strength bars */}
              <div className="flex gap-[4px] mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={"h-[4px] flex-1 rounded-full transition-all duration-300 " + getStrengthColor(strength, i, isDark)}
                  />
                ))}
              </div>
              <p className="text-[12px] mt-1" style={{ color: isDark ? "var(--color-text-muted)" : "#464554" }}>
                {t("profile.security.strength")}
                <span className={strength >= 4 ? "text-green-600 font-semibold" : strength >= 2 ? "text-amber-500 font-semibold" : strength >= 1 ? "text-red-500 font-semibold" : ""}>
                  {" "}{strengthLabels[strength]}
                </span>
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium" style={{ color: isDark ? "var(--color-text-secondary)" : "#464554" }}>
                {t("profile.security.confirm")}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder={t("profile.security.confirmPlaceholder")}
                  className="w-full h-[44px] px-[16px] pr-12 rounded-[10px] border-[1.5px] outline-none transition-all text-[14px] font-normal focus:ring-[3px]"
                  style={{
                    backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#ffffff",
                    borderColor: passwordsMatch && confirmPw.length > 0
                      ? "#22C55E"
                      : (isDark ? "var(--color-border)" : "#E2E4F0"),
                    color: isDark ? "var(--color-text-primary)" : "#4A4A6A",
                  }}
                />
                {passwordsMatch && confirmPw.length > 0 ? (
                  <i className="ti ti-circle-check-filled absolute right-3 top-1/2 -translate-y-1/2 text-[#22C55E] text-[18px]"></i>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B0] hover:text-[#6C63FF] transition-colors"
                  >
                    <i className={"ti " + (showConfirm ? "ti-eye-off" : "ti-eye") + " text-[18px]"}></i>
                  </button>
                )}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={!currentPw || !passwordsMatch || strength < 3 || isSubmitting}
                className={
                  "rounded-[10px] px-[28px] py-[11px] font-semibold text-[14px] flex items-center justify-center gap-[8px] transition-all min-w-[150px] " +
                  (submitted
                    ? "bg-[#22C55E] text-white"
                    : "bg-[#6C63FF] text-white hover:bg-[#5A52D5] shadow-[0_4px_14px_rgba(108,99,255,0.35)] disabled:opacity-70 disabled:shadow-none disabled:cursor-not-allowed")
                }
              >
                {isSubmitting && <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {!isSubmitting && submitted ? (
                  <span className="flex items-center gap-2">
                    <i className="ti ti-circle-check text-[18px]"></i>
                    {t("profile.security.updated")}
                  </span>
                ) : (
                  !isSubmitting && t("profile.security.saveChanges")
                )}
                {isSubmitting && t("profile.security.saving")}
              </button>
              <button
                type="button"
                onClick={() => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                className="bg-transparent border-[1.5px] rounded-[10px] px-[28px] py-[11px] font-semibold transition-colors text-[14px]"
                style={{
                  borderColor: isDark ? "var(--color-border)" : "#E2E4F0",
                  color: isDark ? "var(--color-text-secondary)" : "#4A4A6A",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "var(--color-brand)" : "#6C63FF";
                  e.currentTarget.style.color = isDark ? "var(--color-brand)" : "#6C63FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "var(--color-border)" : "#E2E4F0";
                  e.currentTarget.style.color = isDark ? "var(--color-text-secondary)" : "#4A4A6A";
                }}
              >
                {t("profile.security.cancel")}
              </button>
            </div>
          </form>
        </section>

        {/* Remote logout */}
        <div className="mt-10 pt-8 border-t" style={{ borderColor: isDark ? "var(--color-border)" : "#e7eaf3" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h4 className="text-[14px] font-semibold" style={{ color: isDark ? "var(--color-text-primary)" : "#111c2d" }}>
                {t("profile.security.remoteLogoutTitle")}
              </h4>
              <p className="text-[14px] mt-1" style={{ color: isDark ? "var(--color-text-secondary)" : "#464554" }}>
                {t("profile.security.remoteLogoutDesc")}
              </p>
            </div>
            <button className="shrink-0 flex items-center gap-2 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#FEF2F2] px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all active:scale-95">
              <i className="ti ti-logout text-[18px]"></i>
              {t("profile.security.remoteLogoutBtn")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Requirements checklist ── */}
      <div className="md:col-span-1">
        <div 
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: isDark ? "var(--color-bg-surface-raised)" : "#f0f3ff",
            borderColor: isDark ? "var(--color-border)" : "#e7eaf3",
          }}
        >
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: isDark ? "var(--color-text-primary)" : "#111c2d" }}>
            {t("profile.security.req.title")}
          </h3>
          <ul className="space-y-3">
            <Req ok={hasLen} label={t("profile.security.req.len")} />
            <Req ok={hasUpper} label={t("profile.security.req.upper")} />
            <Req ok={hasNum} label={t("profile.security.req.num")} />
            <Req ok={hasSpec} label={t("profile.security.req.spec")} />
          </ul>
          <div className="mt-8 pt-6 border-t" style={{ borderColor: isDark ? "var(--color-border)" : "#c7c4d7" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: isDark ? "var(--color-text-secondary)" : "#464554" }}>
              {t("profile.security.note.part1")} <span className="font-semibold">{displayName}</span>{t("profile.security.note.part2")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

