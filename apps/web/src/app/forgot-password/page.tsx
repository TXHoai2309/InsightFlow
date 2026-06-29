"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import emailjs from "@emailjs/browser";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(59);
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
  }, [step]);

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Rất mạnh"];
  const strengthBgColors = ["#ef4444", "#f97316", "#fb923c", "#eab308", "#16a34a"];
  const strengthTextColors = ["#ef4444", "#f97316", "#fb923c", "#eab308", "#16a34a"];
  const pwdStrength = getPasswordStrength(newPassword);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setStep(2);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err: any) {
      console.error("EmailJS Error:", err);
      setError("Không thể gửi email. Vui lòng kiểm tra cấu hình EmailJS.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const enteredOtp = otpDigits.join("");
    if (enteredOtp === generatedOtp) {
      setStep(3);
    } else {
      setError("Mã OTP không chính xác. Vui lòng nhập lại.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
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
      setOtpDigits(["", "", "", "", "", ""]);
      setCountdown(59);
      setCanResend(false);
    } catch {
      setError("Không thể gửi lại email. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra khi cập nhật mật khẩu.");
      setSubmitSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.92)";
  const textPrimary = isDark ? "#F5F1FF" : "#18181b";
  const textSecondary = isDark ? "rgba(245,241,255,0.55)" : "#52525b";
  const textMuted = isDark ? "rgba(245,241,255,0.35)" : "#71717a";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "#e4e4e7";
  const brandColor = isDark ? "#C4ACFF" : "#7C3AED";
  const otpBg = isDark ? "rgba(255,255,255,0.08)" : "#f4f4f5";
  const reqBoxBg = isDark ? "rgba(255,255,255,0.04)" : "#f9f9ff";
  const reqBoxBorder = isDark ? "rgba(196,172,255,0.15)" : "rgba(124,58,237,0.1)";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowX: "hidden",
        background: isDark
          ? "radial-gradient(circle at top right, #1a0e2e 0%, #0A0612 50%, #0f0f1a 100%)"
          : "radial-gradient(circle at top right, #f5f3ff 0%, #ffffff 50%, #fafafa 100%)",
        fontFamily: "'Inter', 'Public Sans', sans-serif",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div
          className="fp-animate-pulse"
          style={{
            position: "absolute", top: "-10%", right: "-5%",
            width: "40%", height: "40%", borderRadius: "50%",
            background: isDark ? "rgba(139,92,246,0.15)" : "#ede9fe",
            filter: "blur(120px)", opacity: isDark ? 1 : 0.6,
          }}
        />
        <div
          className="fp-animate-pulse"
          style={{
            position: "absolute", bottom: "-10%", left: "-5%",
            width: "35%", height: "35%", borderRadius: "50%",
            background: isDark ? "rgba(244,114,182,0.10)" : "#e0e7ff",
            filter: "blur(100px)", opacity: isDark ? 1 : 0.5,
            animationDelay: "1.5s",
          }}
        />
        <svg width="100%" height="100%" style={{ opacity: isDark ? 0.05 : 0.15, position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="fp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? "#C4ACFF" : "#a78bfa"} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fp-grid)" />
        </svg>
      </div>

      <main className="fp-fade-in-up" style={{ position: "relative", width: "100%", maxWidth: 460, zIndex: 10 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <img
            src={isDark ? "/logo.png" : "/logo-dark.png"}
            alt="InsightFlow Logo"
            style={{ height: 300, width: "auto", objectFit: "contain" }}
          />
        </div>

        <div
          className="fp-glass-card"
          style={{
            borderRadius: 24,
            padding: "clamp(28px, 6vw, 44px)",
            boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(124,58,237,0.09)",
            background: cardBg,
          }}
        >
          {step === 1 && (
            <div className="fp-fade-in-up">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: textPrimary, marginBottom: 10, letterSpacing: "-0.02em" }}>Quên mật khẩu?</h1>
                <p style={{ color: textSecondary, fontSize: "0.9rem", lineHeight: 1.65 }}>Nhập email liên kết với tài khoản của bạn để nhận mã xác thực.</p>
              </div>
              {error && <ErrorBanner message={error} isDark={isDark} />}
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="fp-email" style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: textMuted, marginLeft: 2 }}>Địa chỉ Email</label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: textMuted, fontSize: 20, pointerEvents: "none" }}>mail</span>
                    <input
                      id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
                      style={{
                        width: "100%", paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                        background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, fontSize: "0.95rem", color: textPrimary,
                        outline: "none", transition: "border-color .2s, box-shadow .2s", boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = brandColor; e.target.style.boxShadow = isDark ? "0 0 0 3px rgba(196,172,255,0.15)" : "0 0 0 3px rgba(124,58,237,0.12)"; }}
                      onBlur={(e) => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full text-white text-[1rem] font-bold py-[14px] rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 transition-all" style={{ background: brandColor }}>{loading ? "Đang xử lý..." : "Gửi mã xác thực"}</button>
              </form>
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <button type="button" onClick={() => router.push("/login")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.875rem", fontWeight: 600, color: textMuted, background: "none", border: "none", cursor: "pointer" }}>Quay lại đăng nhập</button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="fp-fade-in-up">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: isDark ? "rgba(196,172,255,0.15)" : "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <span className="material-symbols-outlined" style={{ color: brandColor, fontSize: 28 }}>mark_email_read</span>
                </div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: textPrimary, marginBottom: 10 }}>Xác thực tài khoản</h1>
              </div>
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i} ref={(el) => { otpRefs.current[i] = el; }} className="fp-otp-input" type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{ width: 44, height: 52, textAlign: "center", fontSize: "1.25rem", fontWeight: 700, background: otpBg, border: `2px solid ${isDark ? "rgba(255,255,255,0.10)" : "transparent"}`, borderRadius: 10, color: textPrimary }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading} className="w-full text-white text-[1rem] font-bold py-[14px] rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 transition-all" style={{ background: brandColor }}>Xác nhận mã</button>
              </form>
            </div>
          )}
          {step === 3 && (
            <div className="fp-fade-in-up">
              <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: textPrimary, marginBottom: 28, textAlign: "center" }}>Thiết lập mật khẩu mới</h1>
              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Inputs for New Password/Confirm Password */}
                <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", padding: "12px 16px", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, color: textPrimary }} />
                <input type="password" placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: "12px 16px", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, color: textPrimary }} />
                <button type="submit" className="w-full text-white text-[1rem] font-bold py-[14px] rounded-xl border-none cursor-pointer" style={{ background: brandColor }}>Cập nhật mật khẩu</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ErrorBanner({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 16px", background: isDark ? "rgba(248,175,212,0.15)" : "#ffdad6", border: `1px solid ${isDark ? "rgba(248,175,212,0.25)" : "rgba(186,26,26,0.2)"}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
      <span className="material-symbols-outlined" style={{ color: isDark ? "#F8AFD4" : "#ba1a1a", fontSize: 18 }}>error</span>
      <p style={{ fontSize: "0.875rem", color: isDark ? "#F8AFD4" : "#93000a", fontWeight: 500, margin: 0 }}>{message}</p>
    </div>
  );
}
