"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-[#E2E4F0] fixed top-0 left-0 right-0 h-16 z-50 font-sans">
      <div className="flex justify-between items-center w-full px-8 max-w-[1200px] mx-auto h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity w-[160px] md:w-[220px] h-full relative overflow-hidden">
          <img 
            src="/logo.png" 
            alt="InsightFlow Logo" 
            className="absolute left-[-5px] md:left-[-10px] top-1/2 -translate-y-1/2 h-[100px] md:h-[140px] max-w-none mix-blend-multiply pointer-events-none" 
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            className="text-[#4A4A6A] font-medium text-[14px] hover:text-[#6C63FF] transition-colors"
            href="/#features"
          >
            Tính năng
          </Link>
          <Link
            className="text-[#4A4A6A] font-medium text-[14px] hover:text-[#6C63FF] transition-colors"
            href="/nganh"
          >
            Ngành
          </Link>
          <Link
            className="text-[#4A4A6A] font-medium text-[14px] hover:text-[#6C63FF] transition-colors"
            href="/ve-chung-toi"
          >
            Về chúng tôi
          </Link>
        </div>

        {/* CTA Buttons or User Info */}
        <div className="flex items-center gap-6">
          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-[12px] group"
              >
                {/* Avatar circle with initials */}
                <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#9B8FF8] flex items-center justify-center text-white text-[13px] font-bold group-hover:scale-105 transition-transform shadow-sm shrink-0">
                  {(user.displayName || user.email || "U")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                {/* Name */}
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[14px] font-semibold text-[#1A1A2E] group-hover:text-[#6C63FF] transition-colors">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[12px] text-[#9898B0]">Quản trị viên</span>
                </div>
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:block text-[#6C63FF] font-semibold text-[14px] hover:opacity-80 transition-all"
              >
                Đăng nhập
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center bg-[#6C63FF] text-white px-[24px] h-[40px] rounded-[10px] font-semibold text-[14px] hover:bg-[#5A52D5] active:scale-95 transition-all shadow-[0_4px_14px_rgba(108,99,255,0.35)]"
              >
                Bắt đầu
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#6C63FF]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <i className={`text-[24px] ${mobileOpen ? "ti ti-x" : "ti ti-menu-2"}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E4F0] px-8 py-4 space-y-4 shadow-lg">
          <Link
            className="block text-[#4A4A6A] font-medium text-[14px] hover:text-[#6C63FF] transition-colors"
            href="/#features"
            onClick={() => setMobileOpen(false)}
          >
            Tính năng
          </Link>
          <Link
            className="block text-[#4A4A6A] font-medium text-[14px] hover:text-[#6C63FF] transition-colors"
            href="/nganh"
            onClick={() => setMobileOpen(false)}
          >
            Ngành
          </Link>
          <Link
            className="block text-[#4A4A6A] font-medium text-[14px] hover:text-[#6C63FF] transition-colors"
            href="/ve-chung-toi"
            onClick={() => setMobileOpen(false)}
          >
            Về chúng tôi
          </Link>
          {!loading && user ? (
            <div className="pt-2 border-t border-[#E2E4F0]">
              <p className="text-[14px] font-semibold text-[#1A1A2E] mb-2">
                Chào, {user.displayName || user.email}
              </p>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="block text-[#6C63FF] font-semibold text-[14px]"
              >
                Cài đặt tài khoản
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-[#6C63FF] font-semibold text-[14px] hover:opacity-80 transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

