"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// ─── Atmospheric floating dots (replaces the JS createAtmosphere()) ───────────
function AtmosphereDots() {
  const dots = useRef<{ size: number; left: number; top: number; color: string }[]>([]);

  if (dots.current.length === 0) {
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 4 + 2;
      dots.current.push({
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: i % 2 === 0 ? "#4648d4" : "#645efb",
      });
    }
  }

  return (
    <>
      {dots.current.map((dot, i) => (
        <div
          key={i}
          className="fixed rounded-full pointer-events-none opacity-20"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.left}vw`,
            top: `${dot.top}vh`,
            backgroundColor: dot.color,
            filter: "blur(1px)",
          }}
        />
      ))}
    </>
  );
}

// ─── Password strength indicator ──────────────────────────────────────────────
function getPasswordStrength(pw: string, t: any): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" };
  if (pw.length < 6) return { label: t("auth.register.passwordWeak"), color: "#ba1a1a", width: "25%" };
  if (pw.length < 10) return { label: t("auth.register.passwordMedium"), color: "#904900", width: "60%" };
  return { label: t("auth.register.passwordStrong"), color: "#1a7a4a", width: "100%" };
}

// ─── Firebase error messages ───────────────────────────────────────────────────
// Map error codes to i18n keys (NOT translated here — t() is not available at module level)
const FIREBASE_ERROR_I18N_KEYS: Record<string, string> = {
  "auth/email-already-in-use": "auth.register.emailInUse",
  "auth/invalid-email": "auth.register.invalidEmail",
  "auth/weak-password": "auth.register.weakPassword",
  "auth/too-many-requests": "auth.register.tooManyRequests",
  "auth/popup-closed-by-user": "", // silent — user intentionally closed
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation();

  // Translate Firebase error codes lazily (t is available here inside the component)
  const getFirebaseError = (code: string) => {
    const key = FIREBASE_ERROR_I18N_KEYS[code];
    if (key === undefined) return t("auth.register.registerFailed");
    if (key === "") return ""; // silent error
    return t(key);
  };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [iconFill, setIconFill] = useState<Record<string, string>>({});

  // Replicate the password-field focus FILL animation from the original HTML
  const handleIconFocus = (id: string) =>
    setIconFill((prev) => ({ ...prev, [id]: "'FILL' 1" }));
  const handleIconBlur = (id: string) =>
    setIconFill((prev) => ({ ...prev, [id]: "'FILL' 0" }));

  const pwStrength = getPasswordStrength(password, t);

  // ── Email / Password register ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError(t("auth.register.nameRequired"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.register.weakPassword"));
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName.trim() });

      // Lưu thông tin người dùng vào Firestore
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: fullName.trim(),
        createdAt: new Date().toISOString(),
      });

      router.push("/login");
    } catch (err: any) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google register ──
  const handleGoogle = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const additionalInfo = getAdditionalUserInfo(result);

      // Nếu tài khoản đã tồn tại (không phải user mới)
      if (additionalInfo && !additionalInfo.isNewUser) {
        setError(t("auth.register.emailInUse"));
        // Logout ngay lập tức để không cho phép họ login qua trang register
        await auth.signOut();
        return;
      }

      // Nếu là user mới, lưu vào Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || "",
        photoURL: result.user.photoURL || "",
        createdAt: new Date().toISOString(),
      }, { merge: true });

      router.push("/");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(t("auth.register.googleFailed"));
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f9f9ff", color: "#111c2d", fontFamily: "'Inter', sans-serif" }}
    >
      <AtmosphereDots />

      {/* ── MAIN ── */}
      <main className="flex-grow flex items-center justify-center relative py-12 px-4 md:px-10 overflow-hidden">

        {/* Background blobs */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full -z-10"
          style={{
            background: "rgba(70,72,212,0.05)",
            filter: "blur(48px)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-5%] right-[-5%] w-[350px] h-[350px] rounded-full -z-10"
          style={{
            background: "rgba(75,65,225,0.05)",
            filter: "blur(48px)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* ── LEFT PANEL (desktop only) ── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col gap-8">
            <div className="flex items-center mb-0">
              <Link href="/" className="flex hover:opacity-80 transition-opacity w-[340px] h-[120px] relative">
                <img 
                  src="/logo.png" 
                  alt="InsightFlow Logo" 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[220px] max-w-none mix-blend-multiply pointer-events-none" 
                />
              </Link>
            </div>

            <h2
              className="text-[40px] leading-[48px] font-bold tracking-[-0.02em] text-[#111c2d]"
              style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
            >{t("auth.register.heroTitle1")} <span className="text-[#4648d4]">{t("auth.register.heroTitle2")}</span>.</h2>

            <p className="text-[18px] leading-[28px] text-[#464554] max-w-md">{t("auth.register.heroDesc")}</p>

            {/* Dashboard preview image */}
            <div className="mt-8 relative rounded-xl overflow-hidden shadow-xl border border-[#c7c4d7]/30 group">
              <img
                className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-105"
                alt="InsightFlow Dashboard Preview"
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex -space-x-3">
                {["AB6AXuDSGH", "AB6AXuAp8V", "AB6AXuCnXY"].map((seed, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-[#f9f9ff] bg-[#e7eeff] flex items-center justify-center text-[10px] font-bold text-[#4648d4]"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-[#464554]"><span className="font-bold text-[#111c2d]">+10,000</span> {t("auth.register.trustedBy")}</p>
            </div>
          </div>

          {/* ── RIGHT PANEL: FORM ── */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div
              className="w-full max-w-md bg-white p-8 md:p-12 rounded-xl border border-[#c7c4d7]/20 relative z-10"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
            >

              {/* Mobile logo */}
              <div className="lg:hidden flex items-center justify-center mb-2">
                <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity w-[340px] h-[120px] relative">
                  <img 
                    src="/logo.png" 
                    alt="InsightFlow Logo" 
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220px] max-w-none mix-blend-multiply pointer-events-none" 
                  />
                </Link>
              </div>

              <div className="text-center lg:text-left mb-8">
                <h2
                  className="text-[24px] leading-[32px] font-semibold text-[#111c2d] mb-1"
                  style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
                >{t("auth.register.title")}</h2>
                <p className="text-[14px] text-[#464554]">{t("auth.register.subtitle")}</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 px-4 py-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
                  <p className="text-[14px] text-[#93000a]">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-6">

                {/* Full name */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="full_name" className="text-[14px] font-medium text-[#111c2d]">{t("auth.register.nameLabel")}</label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767586] text-[20px] group-focus-within:text-[#4648d4] transition-colors"
                    >
                      person
                    </span>
                    <input
                      id="full_name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("auth.register.namePlaceholder")}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px] text-[#111c2d] placeholder:text-[#767586]/50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-[14px] font-medium text-[#111c2d]">{t("auth.register.emailLabel")}</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767586] text-[20px] group-focus-within:text-[#4648d4] transition-colors">
                      mail
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@insightflow.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px] text-[#111c2d] placeholder:text-[#767586]/50"
                    />
                  </div>
                </div>

                {/* Password + Confirm — 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Password */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-[14px] font-medium text-[#111c2d]">{t("auth.register.passwordLabel")}</label>
                    <div className="relative group">
                      <span
                        className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767586] text-[20px] group-focus-within:text-[#4648d4] transition-colors"
                        style={{ fontVariationSettings: iconFill["password"] ?? "'FILL' 0" }}
                      >
                        lock
                      </span>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => handleIconFocus("password")}
                        onBlur={() => handleIconBlur("password")}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px] placeholder:text-[#767586]/50"
                      />
                    </div>
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <div className="h-1 w-full bg-[#e7eeff] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: pwStrength.width, backgroundColor: pwStrength.color }}
                          />
                        </div>
                        <p className="text-[11px]" style={{ color: pwStrength.color }}>
                          {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="confirm_password" className="text-[14px] font-medium text-[#111c2d]">{t("auth.register.confirmLabel")}</label>
                    <div className="relative group">
                      <span
                        className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#767586] text-[20px] group-focus-within:text-[#4648d4] transition-colors"
                        style={{ fontVariationSettings: iconFill["confirm"] ?? "'FILL' 0" }}
                      >
                        lock_reset
                      </span>
                      <input
                        id="confirm_password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => handleIconFocus("confirm")}
                        onBlur={() => handleIconBlur("confirm")}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white focus:ring-2 outline-none transition-all text-[16px] placeholder:text-[#767586]/50 ${confirmPassword && confirmPassword !== password
                          ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/20 focus:border-[#ba1a1a]"
                          : "border-[#c7c4d7] focus:ring-[#4648d4]/20 focus:border-[#4648d4]"
                          }`}
                      />
                      {/* Match indicator */}
                      {confirmPassword.length > 0 && (
                        <span
                          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px]"
                          style={{
                            color: confirmPassword === password ? "#1a7a4a" : "#ba1a1a",
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          {confirmPassword === password ? "check_circle" : "cancel"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4648d4] hover:bg-[#6063ee] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-medium py-3 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>{t("auth.register.registering")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("auth.register.registerBtn")}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-1">
                  <div className="flex-grow h-[1px] bg-[#c7c4d7]/50" />
                  <span className="text-[12px] font-medium text-[#767586] uppercase tracking-wider">{t("auth.register.orRegisterWith")}</span>
                  <div className="flex-grow h-[1px] bg-[#c7c4d7]/50" />
                </div>

                {/* Social buttons */}
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-[#c7c4d7] rounded-lg text-[14px] font-medium text-[#111c2d] hover:bg-[#e7eeff] transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t("auth.register.googleBtn")}</button>
                </div>
              </form>

              {/* Footer link */}
              <div className="mt-8 text-center">
                <p className="text-[14px] text-[#464554]">
                  {t("auth.register.hasAccount")} {" "}
                  <Link href="/login" className="text-[#4648d4] font-semibold hover:underline">{t("auth.register.loginNow")}</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 md:px-10 border-t border-[#c7c4d7]/30 bg-[#f9f9ff]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[12px] font-medium text-[#767586]">{t("auth.register.footerCopyright")}</p>
          <nav className="flex gap-8">
            {[t("auth.register.footerTerms"), t("auth.register.footerPrivacy"), t("auth.register.footerSupport")].map((label) => (
              <Link
                key={label}
                href="#"
                className="text-[12px] font-medium text-[#464554] hover:text-[#4648d4] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
