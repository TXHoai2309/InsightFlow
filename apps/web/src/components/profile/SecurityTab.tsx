"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";

interface Props {
  displayName: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrengthColor(level: StrengthLevel, barIndex: number): string {
  if (barIndex >= level) return "bg-[#dee8ff]";
  if (level <= 1) return "bg-red-500";
  if (level <= 3) return "bg-amber-500";
  return "bg-green-600";
}

const strengthLabels = ["Chưa nhập", "Yếu", "Trung bình", "Khá mạnh", "Rất mạnh"];

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
    <li className={`flex items-center gap-2 text-[14px] transition-colors ${ok ? "text-green-600" : "text-[#464554]"}`}>
      <span
        className="material-symbols-outlined text-[18px]"
        style={ok ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {ok ? "check_circle" : "radio_button_unchecked"}
      </span>
      {label}
    </li>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* ── Left: Form ── */}
      <div className="md:col-span-2 space-y-6">
        <section>
          <h2 className="text-[20px] leading-[28px] font-semibold text-[#111c2d] mb-6">
            Đổi mật khẩu
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#464554]">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767586] hover:text-[#4648d4] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showCurrent ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#464554]">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#c7c4d7] bg-white focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767586] hover:text-[#4648d4] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNew ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {/* Strength bars */}
              <div className="flex gap-1 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${getStrengthColor(strength, i)}`}
                  />
                ))}
              </div>
              <p className="text-[12px] text-[#464554] mt-1">
                Độ mạnh:{" "}
                <span className={strength >= 4 ? "text-green-600 font-semibold" : strength >= 2 ? "text-amber-500 font-semibold" : strength >= 1 ? "text-red-500 font-semibold" : ""}>
                  {newPw ? strengthLabels[strength] : "Chưa nhập"}
                </span>
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#464554]">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border outline-none transition-all text-[16px] focus:ring-2 focus:ring-[#4648d4]/20 ${
                    passwordsMatch
                      ? "border-green-500 focus:border-green-500"
                      : "border-[#c7c4d7] focus:border-[#4648d4]"
                  }`}
                />
                {passwordsMatch ? (
                  <span
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767586] hover:text-[#4648d4] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={!currentPw || !passwordsMatch || strength < 3 || isSubmitting}
                className={`px-8 py-3 rounded-xl text-[14px] font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[150px] ${
                  submitted
                    ? "bg-green-500 text-white shadow-green-200"
                    : "bg-[#4648d4] text-white shadow-[#4648d4]/20 hover:bg-[#6063ee] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {!isSubmitting && submitted ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    Đã cập nhật!
                  </span>
                ) : (
                  !isSubmitting && "Lưu thay đổi"
                )}
                {isSubmitting && "Đang lưu..."}
              </button>
              <button
                type="button"
                onClick={() => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                className="px-8 py-3 rounded-xl border border-[#c7c4d7] text-[#464554] text-[14px] font-medium hover:bg-[#f0f3ff] active:scale-95 transition-all"
              >
                Hủy
              </button>
            </div>
          </form>
        </section>

        {/* Remote logout */}
        <div className="mt-10 pt-8 border-t border-[#e7eaf3]">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h4 className="text-[14px] font-semibold text-[#111c2d]">
                Đăng xuất từ xa
              </h4>
              <p className="text-[14px] text-[#464554] mt-1">
                Nếu bạn nghi ngờ có truy cập lạ, hãy đăng xuất khỏi tất cả
                thiết bị khác.
              </p>
            </div>
            <button className="shrink-0 flex items-center gap-2 text-[#ba1a1a] border border-[#ba1a1a]/20 hover:bg-[#ffdad6] px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all active:scale-95">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Đăng xuất khỏi tất cả thiết bị
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Requirements checklist ── */}
      <div className="md:col-span-1">
        <div className="bg-[#f0f3ff] p-6 rounded-2xl border border-[#e7eaf3]">
          <h3 className="text-[14px] font-semibold text-[#111c2d] mb-4">
            Yêu cầu mật khẩu:
          </h3>
          <ul className="space-y-3">
            <Req ok={hasLen} label="Ít nhất 8 ký tự" />
            <Req ok={hasUpper} label="Chứa chữ cái in hoa" />
            <Req ok={hasNum} label="Chứa ít nhất một con số" />
            <Req ok={hasSpec} label='Ký tự đặc biệt (@, #, $...)' />
          </ul>
          <div className="mt-8 pt-6 border-t border-[#c7c4d7]">
            <p className="text-[12px] text-[#464554] leading-relaxed">
              Lưu ý: Bạn nên sử dụng mật khẩu mạnh để bảo vệ dữ liệu cá nhân
              của <span className="font-semibold">{displayName}</span> khỏi các
              truy cập trái phép.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
