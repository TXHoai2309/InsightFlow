"use client";

import { useState } from "react";
import Link from "next/link";

export default function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[#E7EAF3] fixed top-0 left-0 right-0 h-16 z-50">
      <div className="flex justify-between items-center w-full px-8 max-w-[1200px] mx-auto h-full">
        {/* Logo */}
        <div className="text-[22px] font-bold text-[#5B4FCF] tracking-tight">
          InsightFlow
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            className="text-[#4B5563] font-medium text-[12px] hover:text-[#5B4FCF] transition-colors"
            href="#features"
          >
            Tính năng
          </Link>
          <Link
            className="text-[#4B5563] font-medium text-[12px] hover:text-[#5B4FCF] transition-colors"
            href="#usecases"
          >
            Ngành
          </Link>
          <Link
            className="text-[#4B5563] font-medium text-[12px] hover:text-[#5B4FCF] transition-colors"
            href="#about"
          >
            Về chúng tôi
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-6">
          <Link
            href="#"
            className="hidden md:block text-[#5B4FCF] font-semibold text-[12px] hover:opacity-80 transition-all"
          >
            Đăng nhập
          </Link>
          <button className="bg-[#5B4FCF] text-white px-6 h-10 rounded-[10px] font-semibold text-[12px] hover:opacity-90 active:scale-95 transition-all">
            Bắt đầu
          </button>

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
            href="#features"
            onClick={() => setMobileOpen(false)}
          >
            Tính năng
          </Link>
          <Link
            className="block text-[#4B5563] font-medium text-[14px] hover:text-[#5B4FCF] transition-colors"
            href="#usecases"
            onClick={() => setMobileOpen(false)}
          >
            Ngành
          </Link>
          <Link
            className="block text-[#4B5563] font-medium text-[14px] hover:text-[#5B4FCF] transition-colors"
            href="#about"
            onClick={() => setMobileOpen(false)}
          >
            Về chúng tôi
          </Link>
          <Link
            href="#"
            className="block text-[#5B4FCF] font-semibold text-[14px] hover:opacity-80 transition-all"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </nav>
  );
}
