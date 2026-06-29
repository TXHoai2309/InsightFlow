"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import emailjs from "@emailjs/browser";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// ─── Atmospheric floating dots ───────────
function AtmosphereDots() {
  const [dots, setDots] = useState<{ size: number; left: number; top: number; color: string }[]>([]);

  useEffect(() => {
    const newDots = [];
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 4 + 2;
      newDots.push({
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: i % 2 === 0 ? "#4648d4" : "#645efb",
      });
    }
    setDots(newDots);
  }, []);

  return (
    <>
      {dots.map((dot, i) => (
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

// ─── Main component ────────────────────────────────────────────────────────────
export default function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [iconFill, setIconFill] = useState<Record<string, string>>({});

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!otpSent || otpVerified) return;
    setCountdown(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, otpVerified]);

  const handleIconFocus = (id: string) =>
    setIconFill((prev) => ({ ...prev, [id]: "'FILL' 1" }));
  const handleIconBlur = (id: string) =>
    setIconFill((prev) => ({ ...prev, [id]: "'FILL' 0" }));

  const pwStrength = getPasswordStrength(password, t);

  // OTP handlers
  const handleSendOtp = async () => {
    if (!email) {
      setError(t("auth.register.invalidEmail"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        { to_email: email, otp_code: code },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      setOtpSent(true);
    } catch (err: any) {
      console.error("EmailJS Error:", err);
      setError("Không thể gửi email. Vui lòng kiểm tra cấu hình EmailJS.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otpDigits.join("");
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      setError("");
    } else {
      setError("Mã OTP không chính xác. Vui lòng nhập lại.");
      setOtpDigits(["", "", "", "", "", ""]);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

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

      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: fullName.trim(),
        createdAt: new Date().toISOString(),
      });

      router.push("/login");
    } catch (err: any) {
      setError(t("auth.register.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo && !additionalInfo.isNewUser) {
        setError(t("auth.register.emailInUse"));
        await auth.signOut();
        return;
      }

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
      style={{ backgroundColor: isDark ? "#111c2d" : "#f9f9ff", color: isDark ? "#fff" : "#111c2d", fontFamily: "'Inter', sans-serif" }}
    >
      <AtmosphereDots />

      <main className="flex-grow flex items-center justify-center relative py-12 px-4 md:px-10 overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="hidden lg:flex lg:col-span-6 flex-col gap-8">
            <div className="flex items-center mb-0">
              <Link href="/" className="flex hover:opacity-80 transition-opacity w-[340px] h-[120px] relative">
                <img
                  src={isDark ? "/logo.png" : "/logo-dark.png"}
                  alt="InsightFlow Logo"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[220px] max-w-none pointer-events-none"
                />
              </Link>
            </div>
            <h2 className="text-[40px] leading-[48px] font-bold tracking-[-0.02em]">{t("auth.register.heroTitle1")} <span className="text-[#4648d4]">{t("auth.register.heroTitle2")}</span>.</h2>
            <p className="text-[18px] leading-[28px] text-[#464554] max-w-md">{t("auth.register.heroDesc")}</p>
          </div>

          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div
              className={`w-full max-w-md p-8 md:p-12 rounded-xl border border-[#c7c4d7]/20 relative z-10 ${isDark ? "bg-[#1f2937]" : "bg-white"}`}
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
            >
              <div className="lg:hidden flex items-center justify-center mb-2">
                <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity w-[340px] h-[120px] relative">
                  <img
                    src={isDark ? "/logo.png" : "/logo-dark.png"}
                    alt="InsightFlow Logo"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220px] max-w-none pointer-events-none"
                  />
                </Link>
              </div>

              <div className="text-center lg:text-left mb-8">
                <h2 className="text-[24px] leading-[32px] font-semibold mb-1">{t("auth.register.title")}</h2>
                <p className="text-[14px] text-gray-500">{t("auth.register.subtitle")}</p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
                  <p className="text-[14px] text-[#93000a]">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <label htmlFor="full_name" className="text-[14px] font-medium">{t("auth.register.nameLabel")}</label>
                  <input
                    id="full_name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.register.namePlaceholder")}
                    className="w-full pl-4 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px] text-[#111c2d]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-[14px] font-medium">{t("auth.register.emailLabel")}</label>
                  <div className="flex gap-2">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@insightflow.com"
                      className="flex-grow pl-4 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px] text-[#111c2d]"
                      disabled={otpVerified}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || otpSent || otpVerified}
                      className="px-4 py-3 bg-[#4648d4] hover:bg-[#6063ee] text-white text-[14px] font-medium rounded-lg transition-all"
                    >
                      {otpSent ? "Đã gửi" : "Gửi OTP"}
                    </button>
                  </div>
                </div>

                {otpSent && !otpVerified && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-medium">Nhập mã OTP</label>
                    <div className="flex gap-2 justify-between">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          className="w-12 h-12 text-center text-[18px] border border-[#c7c4d7] rounded-lg focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="w-full bg-[#1a7a4a] text-white text-[14px] font-medium py-2 rounded-lg"
                    >
                      Xác thực OTP
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!canResend || loading}
                      className="text-[12px] text-[#4648d4] hover:underline disabled:text-gray-400"
                    >
                      {canResend ? "Gửi lại mã OTP" : `Gửi lại sau ${countdown}s`}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-[14px] font-medium">{t("auth.register.passwordLabel")}</label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      disabled={!otpVerified}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="confirm_password" className="text-[14px] font-medium">{t("auth.register.confirmLabel")}</label>
                    <input
                      id="confirm_password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-4 py-3 rounded-lg border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                      disabled={!otpVerified}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otpVerified}
                  className="w-full bg-[#4648d4] hover:bg-[#6063ee] text-white text-[14px] font-medium py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? t("auth.register.registering") : t("auth.register.registerBtn")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

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
