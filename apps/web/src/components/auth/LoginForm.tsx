"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useTheme } from "@/contexts/ThemeContext";
import { getDefaultRouteForRole, inferRoleFromEmail } from "@/lib/rbac";

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
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const userSnapshot = await getDoc(doc(db, "users", credential.user.uid));
      const savedDefaultRoute = userSnapshot.exists() ? userSnapshot.data().defaultRoute : undefined;
      router.push(typeof savedDefaultRoute === "string" ? savedDefaultRoute : getDefaultRouteForRole(inferRoleFromEmail(email)));
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

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-0 relative overflow-hidden ${isDark ? "bg-[#111c2d]" : "bg-[#f9f9ff]"}`}>

      {/* Background atmospheric blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full blur-[120px]" style={{ background: isDark ? "rgba(139,92,246,0.18)" : "rgba(96,99,238,0.08)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] rounded-full blur-[100px]" style={{ background: isDark ? "rgba(244,114,182,0.10)" : "rgba(100,94,251,0.06)" }} />
      </div>

      <main className="w-full max-w-[480px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
            <img
              src={isDark ? "/logo.png" : "/logo-dark.png"}
              alt="InsightFlow Logo"
              className="w-[280px] h-auto pointer-events-none"
            />
          </Link>
        </div>

        {/* Card */}
        <div
          className="border border-[#c7c4d7] rounded-xl p-8 md:p-12 transition-all duration-300"
          style={{
            background: isDark ? "rgba(31,41,55,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px 0 rgba(70,72,212,0.04)",
          }}
        >
          <header className="mb-8">
            <h1 className={`font-['Hanken_Grotesk'] text-[32px] leading-[40px] font-bold tracking-[-0.02em] mb-2 ${isDark ? "text-white" : "text-[#111c2d]"}`}>{t("auth.login.welcome")}</h1>
            <p className={`text-[16px] ${isDark ? "text-gray-300" : "text-[#464554]"}`}>{t("auth.login.subtitle")}</p>
          </header>

          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
              <p className="text-[14px] text-[#93000a]">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-6">

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className={`text-[14px] font-medium px-1 ${isDark ? "text-gray-300" : "text-[#464554]"}`}>{t("auth.login.emailLabel")}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#767586] group-focus-within:text-[#4648d4] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@company.com"
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg text-[16px] transition-all focus:outline-none focus:ring-4 ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-[#4648d4] focus:ring-[#4648d4]/10" : "bg-[#f9f9ff] border-[#c7c4d7] text-[#111c2d] placeholder:text-[#767586]/50 focus:border-[#4648d4] focus:ring-[#4648d4]/10"}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="password" className={`text-[14px] font-medium ${isDark ? "text-gray-300" : "text-[#464554]"}`}>{t("auth.login.passwordLabel")}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#767586] group-focus-within:text-[#4648d4] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg text-[16px] transition-all focus:outline-none focus:ring-4 ${isDark ? "bg-gray-800 border-gray-600 text-white focus:border-[#4648d4] focus:ring-[#4648d4]/10" : "bg-[#f9f9ff] border-[#c7c4d7] text-[#111c2d] placeholder:text-[#767586]/50 focus:border-[#4648d4] focus:ring-[#4648d4]/10"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#767586] hover:text-[#464554] transition-colors"
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
              className="w-full bg-[#4648d4] hover:bg-[#6063ee] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
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

          {/* Footer */}
          <footer className="mt-12 text-center">
            <Link href="/forgot-password" className="text-[12px] font-medium text-[#4648d4] hover:text-[#645efb] transition-colors">{t("auth.login.forgotPassword")}</Link>
          </footer>
        </div>

        {/* System status bar */}
        <div className={`mt-8 flex items-center justify-between px-4 py-2 rounded-full border ${isDark ? "bg-gray-800 border-gray-600" : "bg-[#f0f3ff] border-[#c7c4d7]/30"}`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className={`text-[12px] font-medium ${isDark ? "text-gray-300" : "text-[#464554]"}`}>{t("auth.system.statusNormal")}</span>
          </div>
          <div className="flex items-center gap-2 text-[#767586]">
            <span className="material-symbols-outlined text-[16px]">public</span>
            <span className="text-[12px] font-medium">v2.4.0</span>
          </div>
        </div>

      </main>
    </div>
  );
}
