"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider, facebookProvider } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      const msg: Record<string, string> = {
        "auth/user-not-found": t("auth.errors.userNotFound"),
        "auth/wrong-password": t("auth.errors.wrongPassword"),
        "auth/invalid-credential": t("auth.errors.invalidCredential"),
        "auth/too-many-requests": t("auth.errors.tooManyRequests"),
      };
      setError(msg[err.code] ?? t("auth.errors.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || "",
        photoURL: credential.user.photoURL || "",
        lastLogin: new Date().toISOString(),
      }, { merge: true });
      router.push("/");
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError(t("auth.errors.googleNotEnabled"));
      } else if (err.code === "auth/popup-blocked") {
        setError(t("auth.errors.popupBlocked"));
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(t("auth.errors.googleFailed") + (err.message || t("auth.errors.unknown")));
      }
    }
  };

  const handleFacebookLogin = async () => {
    setError("");
    try {
      const credential = await signInWithPopup(auth, facebookProvider);
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || "",
        photoURL: credential.user.photoURL || "",
        lastLogin: new Date().toISOString(),
      }, { merge: true });
      router.push("/");
    } catch (err: any) {
      console.error("Facebook Login Error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError(t("auth.errors.facebookNotEnabled"));
      } else if (err.code === "auth/popup-blocked") {
        setError(t("auth.errors.popupBlocked"));
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(t("auth.errors.facebookFailed") + (err.message || t("auth.errors.unknown")));
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-0 relative overflow-hidden transition-colors duration-300"
      style={{ background: isDark ? "radial-gradient(circle at top right, #1a0e2e 0%, #0A0612 50%, #0f0f1a 100%)" : "radial-gradient(circle at top right, #f5f3ff 0%, #ffffff 50%, #f9f9ff 100%)" }}
    >

      {/* Background atmospheric blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div
          className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full blur-[120px]"
          style={{ background: isDark ? "rgba(139,92,246,0.18)" : "rgba(96,99,238,0.08)" }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] rounded-full blur-[100px]"
          style={{ background: isDark ? "rgba(244,114,182,0.10)" : "rgba(100,94,251,0.06)" }}
        />
      </div>

      <main className="w-full max-w-[480px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity w-[340px] h-[120px] relative">
            <img
              src={isDark ? "/logo-dark.png" : "/logo.png"}
              alt="InsightFlow Logo"
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220px] max-w-none pointer-events-none ${isDark ? "" : "mix-blend-multiply"}`}
            />
          </Link>
        </div>

        {/* Card */}
        <div
          className="auth-card rounded-xl p-8 md:p-12 transition-all duration-300"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #c7c4d7",
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(70,72,212,0.04)",
          }}
        >
          <header className="mb-8">
            <h1
              className="font-['Hanken_Grotesk'] text-[32px] leading-[40px] font-bold tracking-[-0.02em] mb-2"
              style={{ color: isDark ? "#F5F1FF" : "#111c2d" }}
            >
              {t("auth.login.welcome")}
            </h1>
            <p className="text-[16px]" style={{ color: isDark ? "rgba(245,241,255,0.55)" : "#464554" }}>
              {t("auth.login.subtitle")}
            </p>
          </header>

          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
              <p className="text-[14px] text-[#93000a]">{error}</p>
            </div>
          )}

          {/* Social login */}
          <div className="mb-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all active:scale-95"
              style={{
                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #c7c4d7",
                background: isDark ? "rgba(255,255,255,0.05)" : "#f9f9ff",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.10)" : "#f0f3ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f9f9ff"; }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-[14px] font-medium" style={{ color: isDark ? "#F5F1FF" : "#111c2d" }}>
                {t("auth.login.googleBtn")}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8 flex items-center">
            <div className="flex-grow border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.10)" : "#c7c4d7" }} />
            <span className="mx-4 text-[12px] font-medium uppercase tracking-widest" style={{ color: isDark ? "rgba(245,241,255,0.35)" : "#767586" }}>
              {t("auth.login.orLoginWith")}
            </span>
            <div className="flex-grow border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.10)" : "#c7c4d7" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-6">

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-[14px] font-medium px-1" style={{ color: isDark ? "rgba(245,241,255,0.7)" : "#464554" }}>
                {t("auth.login.emailLabel")}
              </label>
              <div className="relative group">
                <div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors"
                  style={{ color: isDark ? "rgba(245,241,255,0.35)" : "#767586" }}
                >
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@company.com"
                  className="auth-input block w-full pl-10 pr-4 py-3 rounded-lg text-[16px] transition-all focus:outline-none focus:ring-4"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "#f9f9ff",
                    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #c7c4d7",
                    color: isDark ? "#F5F1FF" : "#111c2d",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="text-[14px] font-medium" style={{ color: isDark ? "rgba(245,241,255,0.7)" : "#464554" }}>
                  {t("auth.login.passwordLabel")}
                </label>
              </div>
              <div className="relative group">
                <div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors"
                  style={{ color: isDark ? "rgba(245,241,255,0.35)" : "#767586" }}
                >
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input block w-full pl-10 pr-10 py-3 rounded-lg text-[16px] transition-all focus:outline-none focus:ring-4"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "#f9f9ff",
                    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #c7c4d7",
                    color: isDark ? "#F5F1FF" : "#111c2d",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                  style={{ color: isDark ? "rgba(245,241,255,0.35)" : "#767586" }}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              style={{
                background: isDark ? "linear-gradient(135deg, #7C3AED, #6D28D9)" : "#4648d4",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = isDark ? "linear-gradient(135deg, #8B5CF6, #7C3AED)" : "#6063ee"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = isDark ? "linear-gradient(135deg, #7C3AED, #6D28D9)" : "#4648d4"; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t("auth.login.loggingIn")}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.login.loginBtn")}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Links điều hướng */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium transition-colors hover:underline"
              style={{ color: isDark ? "var(--color-brand)" : "#4648d4" }}
            >
              {t("auth.login.forgotPassword")}
            </Link>
            <p className="text-[14px]" style={{ color: isDark ? "rgba(245,241,255,0.55)" : "#464554" }}>
              {t("auth.login.noAccount")}{" "}
              <Link
                href="/register"
                className="font-semibold hover:underline"
                style={{ color: isDark ? "var(--color-brand)" : "#4648d4" }}
              >
                {t("auth.login.registerNow")}
              </Link>
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
