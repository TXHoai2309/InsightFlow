"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider, facebookProvider } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function LoginForm() {
  const router = useRouter();
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
        "auth/user-not-found": "Email không tồn tại.",
        "auth/wrong-password": "Mật khẩu không đúng.",
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
        "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau.",
      };
      setError(msg[err.code] ?? "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const credential = await signInWithPopup(auth, googleProvider);

      // Lưu hoặc cập nhật thông tin người dùng vào Firestore
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
        setError("Đăng nhập bằng Google chưa được bật trong Firebase Console.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Trình duyệt đã chặn cửa sổ bật lên. Vui lòng bật lại.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError("Đăng nhập Google thất bại: " + (err.message || "Lỗi không xác định"));
      }
    }
  };

  const handleFacebookLogin = async () => {
    setError("");
    try {
      const credential = await signInWithPopup(auth, facebookProvider);

      // Lưu hoặc cập nhật thông tin người dùng vào Firestore
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
        setError("Đăng nhập bằng Facebook chưa được bật trong Firebase Console.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Trình duyệt đã chặn cửa sổ bật lên. Vui lòng bật lại.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError("Đăng nhập Facebook thất bại: " + (err.message || "Lỗi không xác định"));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-0 relative overflow-hidden bg-[#f9f9ff]">

      {/* Background atmospheric blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#6063ee]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] rounded-full bg-[#645efb]/10 blur-[100px]" />
      </div>

      <main className="w-full max-w-[480px] z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#4648d4] flex items-center justify-center rounded-lg shadow-lg">
              <span className="material-symbols-outlined text-white text-[24px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                insights
              </span>
            </div>
            <span className="font-['Hanken_Grotesk'] text-2xl font-semibold text-[#111c2d] tracking-tight">
              InsightFlow
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          className="border border-[#c7c4d7] rounded-xl p-8 md:p-12 transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px 0 rgba(70,72,212,0.04)",
          }}
        >
          <header className="mb-8">
            <h1 className="font-['Hanken_Grotesk'] text-[32px] leading-[40px] font-bold tracking-[-0.02em] text-[#111c2d] mb-2">
              Chào mừng trở lại
            </h1>
            <p className="text-[16px] text-[#464554]">
              Đăng nhập để tiếp tục phân tích dữ liệu của bạn
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
              className="w-full flex items-center justify-center gap-2 border border-[#c7c4d7] bg-[#f9f9ff] hover:bg-[#f0f3ff] py-3 rounded-lg transition-all active:scale-95"
            >
              {/* Google SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-[14px] font-medium text-[#111c2d]">Đăng nhập với Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8 flex items-center">
            <div className="flex-grow border-t border-[#c7c4d7]" />
            <span className="mx-4 text-[12px] font-medium text-[#767586] uppercase tracking-widest">
              Hoặc đăng nhập với
            </span>
            <div className="flex-grow border-t border-[#c7c4d7]" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-6">

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-[14px] font-medium text-[#464554] px-1">
                Email
              </label>
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
                  className="block w-full pl-10 pr-4 py-3 bg-[#f9f9ff] border border-[#c7c4d7] rounded-lg text-[16px] text-[#111c2d] placeholder:text-[#767586]/50 transition-all focus:outline-none focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="text-[14px] font-medium text-[#464554]">
                  Mật khẩu
                </label>

              </div>
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
                  className="block w-full pl-10 pr-10 py-3 bg-[#f9f9ff] border border-[#c7c4d7] rounded-lg text-[16px] text-[#111c2d] placeholder:text-[#767586]/50 transition-all focus:outline-none focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10"
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
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <Link href="/forgot-password" className="text-[12px] font-medium text-[#4648d4] hover:text-[#645efb] transition-colors">
              Quên mật khẩu?
            </Link>
            <p className="text-[14px] text-[#464554]">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-[#4648d4] font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </footer>
        </div>

        {/* System status bar */}
        <div className="mt-8 flex items-center justify-between px-4 py-2 bg-[#f0f3ff] rounded-full border border-[#c7c4d7]/30">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[12px] font-medium text-[#464554]">Hệ thống: Hoạt động bình thường</span>
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
