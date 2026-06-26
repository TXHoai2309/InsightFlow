"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
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
  const strengthBgColors = [
    "#ef4444",
    "#f97316",
    "#fb923c",
    "#eab308",
    "#16a34a",
  ];
  const strengthTextColors = [
    "#ef4444",
    "#f97316",
    "#fb923c",
    "#eab308",
    "#16a34a",
  ];

  const pwdStrength = getPasswordStrength(newPassword);

  // ── Bước 1: Gửi OTP qua EmailJS ──
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

  // ── Bước 2: Xác thực OTP ──
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

  // OTP input handlers
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

  // Gửi lại OTP
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

  // ── Bước 3: Đặt lại mật khẩu ──
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

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowX: "hidden",
        background: "radial-gradient(circle at top right, #f5f3ff 0%, #ffffff 50%, #fafafa 100%)",
        fontFamily: "'Inter', 'Public Sans', sans-serif",
      }}
    >
      {/* ── Atmospheric background blobs ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div
          className="fp-animate-pulse"
          style={{
            position: "absolute", top: "-10%", right: "-5%",
            width: "40%", height: "40%", borderRadius: "50%",
            background: "#ede9fe", filter: "blur(120px)", opacity: 0.6,
          }}
        />
        <div
          className="fp-animate-pulse"
          style={{
            position: "absolute", bottom: "-10%", left: "-5%",
            width: "35%", height: "35%", borderRadius: "50%",
            background: "#e0e7ff", filter: "blur(100px)", opacity: 0.5,
            animationDelay: "1.5s",
          }}
        />
        <svg width="100%" height="100%" style={{ opacity: 0.15, position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="fp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#a78bfa" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fp-grid)" />
        </svg>
      </div>

      {/* ── Main card ── */}
      <main
        className="fp-fade-in-up"
        style={{ position: "relative", width: "100%", maxWidth: 460, zIndex: 10 }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD40JZ9SkDsppMTY0YekusoeFd8Gw_cMV_vbfNjWf_FJZ6SyWRar4WTUqS_XP4ENa_7uqv35ZfUsxYJ9L6iomqhlBuacM8LIbk8EqLodgmT98yaiTPCAhOxS9js-kmPkZRHNAgoFNFNMI9cXiNnEeoP01VKG_smeYQbf68GpkDAJmw30ERBL7IJfeNx7s4aJ6HGhELGr0Rw7feufcbirerKkOXY6Rk1pIOuv1wwfy-CWzmD7YXZV_X9xAOq427lwqQw07Vj_JwzfcQ"
            alt="InsightFlow Logo"
            style={{ height: 52, width: "auto", objectFit: "contain" }}
          />
        </div>

        {/* Glass card */}
        <div
          className="fp-glass-card"
          style={{
            borderRadius: 24,
            padding: "clamp(28px, 6vw, 44px)",
            boxShadow: "0 24px 60px rgba(124,58,237,0.09)",
          }}
        >
          {/* ════ STEP 1: EMAIL ════ */}
          {step === 1 && (
            <div className="fp-fade-in-up">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#18181b", marginBottom: 10, letterSpacing: "-0.02em" }}>
                  Quên mật khẩu?
                </h1>
                <p style={{ color: "#52525b", fontSize: "0.9rem", lineHeight: 1.65 }}>
                  Nhập email liên kết với tài khoản của bạn để nhận mã xác thực.
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="fp-email"
                    style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#71717a", marginLeft: 2 }}
                  >
                    Địa chỉ Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#71717a", fontSize: 20, pointerEvents: "none" }}
                    >
                      mail
                    </span>
                    <input
                      id="fp-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      style={{
                        width: "100%", paddingLeft: 44, paddingRight: 16,
                        paddingTop: 14, paddingBottom: 14,
                        background: "#fff", border: "1px solid #e4e4e7",
                        borderRadius: 12, fontSize: "0.95rem", color: "#18181b",
                        outline: "none", transition: "border-color .2s, box-shadow .2s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#7C3AED"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <PrimaryButton loading={loading} disabled={loading} label="Gửi mã xác thực" icon="arrow_forward" />
              </form>

              <div style={{ marginTop: 24, textAlign: "center" }}>
                <BackToLoginBtn onClick={() => router.push("/login")} />
              </div>
            </div>
          )}

          {/* ════ STEP 2: OTP ════ */}
          {step === 2 && (
            <div className="fp-fade-in-up">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", background: "#f5f3ff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <span className="material-symbols-outlined" style={{ color: "#7C3AED", fontSize: 28 }}>mark_email_read</span>
                </div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#18181b", marginBottom: 10 }}>
                  Xác thực tài khoản
                </h1>
                <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.65 }}>
                  Chúng tôi đã gửi mã OTP gồm 6 chữ số đến{" "}
                  <strong style={{ color: "#7C3AED" }}>{email}</strong>.
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* 6-digit OTP inputs */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      className="fp-otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{
                        width: 44, height: 52, textAlign: "center",
                        fontSize: "1.25rem", fontWeight: 700,
                        background: "#f4f4f5", border: "2px solid transparent",
                        borderRadius: 10, color: "#18181b",
                        transition: "all .2s", outline: "none", cursor: "text",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>

                <PrimaryButton
                  loading={loading}
                  disabled={loading || otpDigits.join("").length < 6}
                  label="Xác nhận mã"
                  icon="arrow_forward"
                />

                {/* Resend & change email */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 4 }}>
                  <p style={{ fontSize: "0.875rem", color: "#71717a", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                    Không nhận được mã?{" "}
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        style={{ color: "#7C3AED", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        Gửi lại ngay
                      </button>
                    ) : (
                      <span style={{ fontWeight: 700, color: "#18181b" }}>còn {countdown}s</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    style={{
                      color: "#7C3AED", fontWeight: 600, fontSize: "0.875rem",
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    Thay đổi email
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ════ STEP 3: NEW PASSWORD ════ */}
          {step === 3 && (
            <div className="fp-fade-in-up">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#18181b", marginBottom: 8 }}>
                  Thiết lập mật khẩu mới
                </h1>
                <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.65 }}>
                  Vui lòng nhập mật khẩu mới và xác nhận để hoàn tất khôi phục.
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              {submitSuccess && (
                <div style={{
                  marginBottom: 16, padding: "12px 16px",
                  background: "#dcfce7", border: "1px solid rgba(22,163,74,0.2)",
                  borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span className="material-symbols-outlined" style={{ color: "#16a34a", fontSize: 18 }}>check_circle</span>
                  <p style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 500, margin: 0 }}>
                    Đặt lại mật khẩu thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* New Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="fp-new-pwd" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18181b" }}>
                    Mật khẩu mới
                  </label>
                  <PasswordInput
                    id="fp-new-pwd"
                    value={newPassword}
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                    onChange={(v) => setNewPassword(v)}
                  />
                  {/* Strength bar */}
                  {newPassword && (
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ height: 6, width: "100%", background: "#e4e4e7", borderRadius: 99, overflow: "hidden" }}>
                        <div
                          className="fp-strength-bar"
                          style={{
                            height: "100%",
                            width: `${(pwdStrength / 4) * 100}%`,
                            background: strengthBgColors[pwdStrength],
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <p style={{
                        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em",
                        textTransform: "uppercase", marginTop: 4,
                        color: strengthTextColors[pwdStrength],
                      }}>
                        Độ mạnh: {strengthLabels[pwdStrength]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="fp-confirm-pwd" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18181b" }}>
                    Xác nhận mật khẩu mới
                  </label>
                  <PasswordInput
                    id="fp-confirm-pwd"
                    value={confirmPassword}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    onChange={(v) => setConfirmPassword(v)}
                  />
                </div>

                {/* Requirements */}
                <div style={{ background: "#f9f9ff", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(124,58,237,0.1)" }}>
                  <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#18181b", marginBottom: 10, marginTop: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                    Yêu cầu mật khẩu:
                  </h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { regex: /.{8,}/, label: "Ít nhất 8 ký tự" },
                      { regex: /[A-Z]/, label: "Chứa chữ cái in hoa" },
                      { regex: /[0-9]/, label: "Chứa ít nhất một con số" },
                      { regex: /[^A-Za-z0-9]/, label: "Ký tự đặc biệt (@, #, $...)" },
                    ].map((req) => {
                      const met = req.regex.test(newPassword);
                      return (
                        <li
                          key={req.label}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            fontSize: "0.78rem", color: met ? "#16a34a" : "#71717a",
                            transition: "color .2s",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 16,
                              fontVariationSettings: met
                                ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                                : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                            }}
                          >
                            check_circle
                          </span>
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <PrimaryButton
                  loading={loading}
                  disabled={loading || submitSuccess}
                  label={submitSuccess ? "Thành công!" : "Cập nhật mật khẩu"}
                  icon={submitSuccess ? "check_circle" : "arrow_forward"}
                  successState={submitSuccess}
                />

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: "0.875rem", fontWeight: 600, color: "#7C3AED",
                      background: "none", border: "none", cursor: "pointer",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, textAlign: "center", fontSize: "0.72rem", color: "#a1a1aa", fontWeight: 500, letterSpacing: "0.04em" }}>
          © 2024 InsightFlow Inc. Bảo mật &amp; Quy trình chuẩn AI.
        </div>
      </main>
    </div>
  );
}

/* ─── Shared sub-components ─────────────────────────────── */

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      marginBottom: 16, padding: "12px 16px",
      background: "#ffdad6", border: "1px solid rgba(186,26,26,0.2)",
      borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
    }}>
      <span className="material-symbols-outlined" style={{ color: "#ba1a1a", fontSize: 18, flexShrink: 0 }}>error</span>
      <p style={{ fontSize: "0.875rem", color: "#93000a", fontWeight: 500, margin: 0 }}>{message}</p>
    </div>
  );
}

function PrimaryButton({
  loading, disabled, label, icon, successState = false,
}: {
  loading: boolean; disabled: boolean; label: string; icon: string; successState?: boolean;
}) {
  const bg = successState ? "#16a34a" : disabled && !successState ? "#a78bfa" : "#7C3AED";
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: "100%", background: bg, color: "#fff", fontWeight: 700,
        fontSize: "1rem", padding: "15px 24px", borderRadius: 12, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 4px 16px rgba(124,58,237,0.22)",
        transition: "background .2s, transform .1s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#6d28d9"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = bg; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined fp-spin" style={{ fontSize: 20 }}>progress_activity</span>
          Đang xử lý...
        </>
      ) : (
        <>
          {label}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </>
      )}
    </button>
  );
}

function PasswordInput({
  id, value, show, onToggle, onChange,
}: {
  id: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        style={{
          width: "100%", padding: "12px 44px 12px 16px",
          background: "#fff", border: "1px solid #e4e4e7",
          borderRadius: 10, fontSize: "0.95rem", color: "#18181b",
          outline: "none", transition: "border-color .2s, box-shadow .2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#7C3AED"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
        onBlur={(e) => { e.target.style.borderColor = "#e4e4e7"; e.target.style.boxShadow = "none"; }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#71717a",
          display: "flex", alignItems: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {show ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

function BackToLoginBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: "0.875rem", fontWeight: 600, color: "#71717a",
        background: "none", border: "none", cursor: "pointer", transition: "color .2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#7C3AED"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
      Quay lại đăng nhập
    </button>
  );
}
