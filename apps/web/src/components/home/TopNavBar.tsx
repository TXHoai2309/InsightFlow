"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-[#E7EAF3] fixed top-0 left-0 right-0 h-16 z-50">
      <div className="flex justify-between items-center w-full px-8 max-w-[1200px] mx-auto h-full">
        {/* Logo */}
        <Link href="/" className="text-[22px] font-bold text-[#5B4FCF] tracking-tight hover:opacity-80 transition-opacity">
          InsightFlow
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            className="text-[#4B5563] font-medium text-[12px] hover:text-[#5B4FCF] transition-colors"
            href="/#features"
          >
            Tính năng
          </Link>
          <Link
            className="text-[#4B5563] font-medium text-[12px] hover:text-[#5B4FCF] transition-colors"
            href="/nganh"
          >
            Ngành
          </Link>
          <Link
            className="text-[#4B5563] font-medium text-[12px] hover:text-[#5B4FCF] transition-colors"
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
                className="flex items-center gap-3 group"
              >
                {/* Avatar circle with initials */}
                <div className="w-9 h-9 rounded-full bg-[#4648d4] flex items-center justify-center text-white text-[12px] font-bold border-2 border-[#c0c1ff] group-hover:scale-105 transition-transform shadow-sm">
                  {(user.displayName || user.email || "U")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                {/* Name */}
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-semibold text-[#111c2d] group-hover:text-[#5B4FCF] transition-colors">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[11px] text-[#464554]">Quản trị viên</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[12px] font-semibold text-[#ef4444] hover:underline ml-1"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:block text-[#5B4FCF] font-semibold text-[12px] hover:opacity-80 transition-all"
              >
                Đăng nhập
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center bg-[#5B4FCF] text-white px-6 h-10 rounded-[10px] font-semibold text-[12px] hover:opacity-90 active:scale-95 transition-all"
              >
                Bắt đầu
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#5B4FCF]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E7EAF3] px-8 py-4 space-y-4">
          <Link
            className="block text-[#4B5563] font-medium text-[14px] hover:text-[#5B4FCF] transition-colors"
            href="/#features"
            onClick={() => setMobileOpen(false)}
          >
            Tính năng
          </Link>
          <Link
            className="block text-[#4B5563] font-medium text-[14px] hover:text-[#5B4FCF] transition-colors"
            href="/nganh"
            onClick={() => setMobileOpen(false)}
          >
            Ngành
          </Link>
          <Link
            className="block text-[#4B5563] font-medium text-[14px] hover:text-[#5B4FCF] transition-colors"
            href="/ve-chung-toi"
            onClick={() => setMobileOpen(false)}
          >
            Về chúng tôi
          </Link>
          {!loading && user ? (
            <div className="pt-2 border-t border-[#E7EAF3]">
              <p className="text-[14px] font-medium text-[#111c2d] mb-2">
                Chào, {user.displayName || user.email}
              </p>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="block text-[#ef4444] font-semibold text-[14px]"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-[#5B4FCF] font-semibold text-[14px] hover:opacity-80 transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
