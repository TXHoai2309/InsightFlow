"use client";

import { useState, FormEvent } from "react";

interface Props {
  displayName: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const strengthLabels = ["Chưa nhập", "Yếu", "Trung bình", "Khá mạnh", "Rất mạnh"];

function getStrengthColor(level: StrengthLevel, barIndex: number): string {
  if (barIndex >= level) return "bg-[#E2E4F0]"; // gray (empty)
  if (level === 1) return "bg-[#EF4444]"; // red (weak)
  if (level === 2) return "bg-[#F97316]"; // orange (fair)
  if (level === 3) return "bg-[#EAB308]"; // yellow (good)
  return "bg-[#22C55E]"; // green (strong)
}

function getStrengthTextColor(level: StrengthLevel): string {
  if (level === 0) return "text-[#9898B0]";
  if (level === 1) return "text-[#EF4444]";
  if (level === 2) return "text-[#F97316]";
  if (level === 3) return "text-[#EAB308]";
  return "text-[#22C55E]";
}

export default function SecurityTab({ displayName }: Props) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirements
  const hasLen = newPw.length >= 8;
  const hasUpper = /[A-Z]/.test(newPw);
  const hasNum = /[0-9]/.test(newPw);
  const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(newPw);

  const strength: StrengthLevel = ([hasLen, hasUpper, hasNum, hasSpec].filter(Boolean).length) as StrengthLevel;
  const passwordsMatch = confirmPw.length > 0 && confirmPw === newPw;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !passwordsMatch || strength < 3) {
      alert("Vui lòng nhập mật khẩu hợp lệ (Độ mạnh từ Khá mạnh trở lên).");
      return;
    }
    setIsSubmitting(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        alert("Không tìm thấy thông tin đăng nhập. Vui lòng tải lại trang.");
        setIsSubmitting(false);
        return;
      }
      
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      
      // Update Password
      await updatePassword(user, newPw);
      
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        alert("Mật khẩu hiện tại không chính xác.");
      } else {
        alert("Có lỗi xảy ra: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const Req = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={`flex items-center gap-[8px] text-[13px] transition-colors ${ok ? "text-[#22C55E]" : "text-[#4A4A6A]"}`}>
      {ok ? (
        <i className="ti ti-circle-check-filled text-[18px] text-[#22C55E]"></i>
      ) : (
        <i className="ti ti-circle text-[18px] text-[#E2E4F0]"></i>
      )}
      {label}
    </li>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in duration-300">
      {/* ── Left: Form ── */}
      <div className="md:col-span-2 space-y-8">
        <section>
          <h2 className="text-[20px] font-bold text-[#1A1A2E] mb-6">
            Đổi mật khẩu
          </h2>

          <form className="space-y-[24px]" onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="flex flex-col gap-[8px]">
              <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[44px] px-[16px] pr-12 rounded-[10px] border-[1.5px] border-[#E2E4F0] bg-white focus:ring-[3px] focus:ring-[#6C63FF]/12 focus:border-[#6C63FF] outline-none transition-all text-[14px] font-normal text-[#4A4A6A] placeholder:text-[#9898B0]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B0] hover:text-[#6C63FF] transition-colors"
                >
                  <i className={`ti ${showCurrent ? "ti-eye-off" : "ti-eye"} text-[18px]`}></i>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-[8px]">
              <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full h-[44px] px-[16px] pr-12 rounded-[10px] border-[1.5px] border-[#E2E4F0] bg-white focus:ring-[3px] focus:ring-[#6C63FF]/12 focus:border-[#6C63FF] outline-none transition-all text-[14px] font-normal text-[#4A4A6A] placeholder:text-[#9898B0]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B0] hover:text-[#6C63FF] transition-colors"
                >
                  <i className={`ti ${showNew ? "ti-eye-off" : "ti-eye"} text-[18px]`}></i>
                </button>
              </div>

              {/* Strength bars */}
              <div className="flex gap-[4px] mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-[4px] flex-1 rounded-full transition-all duration-300 ${getStrengthColor(strength, i)}`}
                  />
                ))}
              </div>
              <p className="text-[13px] mt-1 text-[#9898B0]">
                Độ mạnh:{" "}
                <span className={`font-semibold ${getStrengthTextColor(strength)}`}>
                  {strengthLabels[strength]}
                </span>
              </p>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-[8px]">
              <label className="text-[11px] font-semibold text-[#9898B0] uppercase tracking-[0.08em]">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full h-[44px] px-[16px] pr-12 rounded-[10px] border-[1.5px] outline-none transition-all text-[14px] font-normal focus:ring-[3px] focus:ring-[#6C63FF]/12 text-[#4A4A6A] placeholder:text-[#9898B0] ${
                    passwordsMatch && confirmPw.length > 0
                      ? "border-[#22C55E] focus:border-[#22C55E] focus:ring-[#22C55E]/12"
                      : "border-[#E2E4F0] focus:border-[#6C63FF]"
                  }`}
                />
                {passwordsMatch && confirmPw.length > 0 ? (
                  <i className="ti ti-circle-check-filled absolute right-3 top-1/2 -translate-y-1/2 text-[#22C55E] text-[18px]"></i>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B0] hover:text-[#6C63FF] transition-colors"
                  >
                    <i className={`ti ${showConfirm ? "ti-eye-off" : "ti-eye"} text-[18px]`}></i>
                  </button>
                )}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end gap-[12px] mt-[32px]">
              <button
                type="button"
                onClick={() => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                className="bg-transparent text-[#4A4A6A] border-[1.5px] border-[#E2E4F0] rounded-[10px] px-[28px] py-[11px] font-semibold hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors text-[14px]"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={!currentPw || !passwordsMatch || strength < 3 || isSubmitting}
                className={`rounded-[10px] px-[28px] py-[11px] font-semibold text-[14px] flex items-center justify-center gap-[8px] transition-all min-w-[150px] ${
                  submitted
                    ? "bg-[#22C55E] text-white"
                    : "bg-[#6C63FF] text-white hover:bg-[#5A52D5] shadow-[0_4px_14px_rgba(108,99,255,0.35)] disabled:opacity-70 disabled:shadow-none disabled:cursor-not-allowed"
                }`}
              >
                {isSubmitting && <span className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {!isSubmitting && submitted ? (
                  <span className="flex items-center gap-[8px]">
                    <i className="ti ti-circle-check-filled text-[18px]"></i>
                    Đã cập nhật!
                  </span>
                ) : (
                  !isSubmitting && "Lưu mật khẩu"
                )}
                {isSubmitting && "Đang lưu..."}
              </button>
            </div>
          </form>
        </section>

      </div>

      {/* ── Right: Requirements checklist ── */}
      <div className="md:col-span-1">
        <div className="bg-[#F7F8FF] p-[20px] rounded-[12px] border-[1.5px] border-[#E2E4F0] sticky top-32">
          <h3 className="text-[11px] font-semibold text-[#9898B0] mb-[16px] uppercase tracking-[0.08em]">
            Yêu cầu mật khẩu
          </h3>
          <ul className="space-y-[12px]">
            <Req ok={hasLen} label="Ít nhất 8 ký tự" />
            <Req ok={hasUpper} label="Chứa chữ cái in hoa" />
            <Req ok={hasNum} label="Chứa ít nhất một con số" />
            <Req ok={hasSpec} label="Ký tự đặc biệt (@, #, $...)" />
          </ul>
          
          <div className="mt-[24px]">
            <div className="bg-[#FFFBEB] border-l-[3px] border-[#F59E0B] p-[12px] rounded-[8px]">
              <p className="text-[13px] text-[#4A4A6A] leading-relaxed">
                <strong className="text-[#F59E0B] block mb-1">Lưu ý bảo mật</strong>
                Nên sử dụng mật khẩu mạnh để bảo vệ dữ liệu cá nhân của 
                <span className="font-semibold text-[#1A1A2E]"> {displayName} </span> 
                khỏi các truy cập trái phép.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

