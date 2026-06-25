"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/contexts/ThemeContext";

export default function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { href: "/#features", label: "Tính năng" },
    { href: "/nganh", label: "Ngành" },
    { href: "/ve-chung-toi", label: "Về chúng tôi" },
  ];

  const isActive = (href: string) => {
    if (href === "/#features") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300 font-sans h-[72px]"
        style={{
          background: scrolled
            ? isDark ? "rgba(28,28,36,0.92)" : "rgba(255,255,255,0.92)"
            : isDark ? "#1c1c24" : "#ffffff",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled
            ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "transparent"}`
            : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F1F0FF"}`,
          boxShadow: scrolled
            ? isDark ? "0 2px 20px rgba(0,0,0,0.3)" : "0 2px 20px rgba(0,0,0,0.08)"
            : "none",
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .nav-link {
            position: relative;
            color: ${isDark ? "#a0a0b8" : "#374151"};
            font-weight: 500;
            font-size: 15px;
            transition: color 0.2s;
            padding: 4px 0;
          }
          .nav-link:hover {
            color: ${isDark ? "#9B8FF8" : "#6D4CFF"};
          }
          .nav-link::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 2px;
            background-color: ${isDark ? "#9B8FF8" : "#6D4CFF"};
            transition: width 0.3s ease;
          }
          .nav-link:hover::after {
            width: 100%;
          }
          .nav-link.active {
            color: ${isDark ? "#9B8FF8" : "#6D4CFF"};
            font-weight: 600;
          }
          .cta-button {
            background: #6D4CFF;
            color: white;
            border-radius: 10px;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
          }
          .cta-button:hover {
            background: #5B3FE8;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(109,76,255,0.35);
          }
          @media (prefers-reduced-motion: reduce) { 
            * { transition: none !important; animation: none !important; } 
          }
        `}} />

        <div className="flex justify-between items-center w-full px-5 md:px-12 max-w-[1440px] mx-auto h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity w-[180px] md:w-[260px] h-full relative overflow-hidden">
            <img 
              src={isDark ? "/logo-dark.png" : "/logo.png"}
              alt="InsightFlow Logo" 
              className={`absolute left-[-8px] md:left-[-12px] top-1/2 -translate-y-1/2 h-[120px] md:h-[160px] max-w-none pointer-events-none ${isDark ? "" : "mix-blend-multiply"}`}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={`nav-link ${isActive(link.href) ? "active" : ""}`}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">

            {/* ── Dark Mode Toggle ── */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              title={isDark ? "Chế độ sáng" : "Chế độ tối"}
            >
              <span className="theme-toggle-thumb">
                {isDark ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM4.22 5.64a1 1 0 0 1 1.42-1.42l1.41 1.42a1 1 0 0 1-1.41 1.41L4.22 5.64zm12.72 12.72a1 1 0 0 1 1.41-1.41l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42zM3 11a1 1 0 0 1 0 2H1a1 1 0 0 1 0-2h2zm20 0a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2h2zM5.64 18.36a1 1 0 0 1-1.42 1.42L2.8 18.36a1 1 0 0 1 1.42-1.42l1.42 1.42zM18.36 5.64a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 1.42l-1.42 1.41z"/>
                  </svg>
                )}
              </span>
            </button>

            {/* Logged in: show avatar */}
            {!loading && user && (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-[12px] group"
                >
                  <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[14px] font-bold group-hover:scale-105 transition-transform shadow-sm shrink-0" style={{ background: "linear-gradient(135deg, #6D4CFF, #9B8FF8)" }}>
                    {(user.displayName || user.email || "U")
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span
                      className="text-[14px] font-semibold transition-colors"
                      style={{ color: isDark ? "#e4e6eb" : "#1a1a2e" }}
                    >
                      {user.displayName || user.email}
                    </span>
                    <span style={{ color: isDark ? "#6e6e88" : "#9CA3AF" }} className="text-[12px]">Quản trị viên</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Logged out: show login + signup */}
            {!loading && !user && (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-[15px] font-medium transition-colors"
                  style={{ color: isDark ? "#a0a0b8" : "#374151" }}
                  onMouseOver={(e) => { e.currentTarget.style.color = isDark ? "#9B8FF8" : "#6D4CFF"; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = isDark ? "#a0a0b8" : "#374151"; }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dashboard"
                  className="text-[14px] font-semibold text-white px-5 py-2 rounded-[10px] transition-all"
                  style={{ background: "#6D4CFF" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#5B3FE8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#6D4CFF"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Dùng thử miễn phí
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2"
              style={{ color: isDark ? "#9B8FF8" : "#6D4CFF" }}
              onClick={() => setMobileOpen(true)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </div>
      </nav>


      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-[110] transition-opacity md:hidden"
          style={{ background: isDark ? "rgba(17,19,24,0.6)" : "rgba(26,26,46,0.4)" }}
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[280px] z-[120] shadow-2xl transition-transform duration-300 md:hidden flex flex-col ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: isDark ? "#1c1c24" : "#ffffff" }}
      >
        <div className="p-5 flex justify-between items-center">
          {/* Mobile theme toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            <span className="theme-toggle-thumb">
              {isDark ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM4.22 5.64a1 1 0 0 1 1.42-1.42l1.41 1.42a1 1 0 0 1-1.41 1.41L4.22 5.64zm12.72 12.72a1 1 0 0 1 1.41-1.41l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42zM3 11a1 1 0 0 1 0 2H1a1 1 0 0 1 0-2h2zm20 0a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2h2zM5.64 18.36a1 1 0 0 1-1.42 1.42L2.8 18.36a1 1 0 0 1 1.42-1.42l1.42 1.42zM18.36 5.64a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 1.42l-1.42 1.41z"/>
                  </svg>
              )}
            </span>
          </button>
          <button 
            onClick={() => setMobileOpen(false)}
            style={{ color: isDark ? "#6e6e88" : "#64748B" }}
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className="block py-[16px] px-[24px] text-[18px] transition-colors"
              style={
                isActive(link.href)
                  ? { color: isDark ? "#9B8FF8" : "#6D4CFF", fontWeight: 600, background: isDark ? "rgba(123,116,255,0.08)" : "#F8F7FF" }
                  : { color: isDark ? "#a0a0b8" : "#374151", fontWeight: 500 }
              }
              href={link.href}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {!loading && user && (
            <div
              className="mt-4 px-[24px] py-[16px]"
              style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F1F0FF"}` }}
            >
              <p className="text-[14px] font-medium mb-3" style={{ color: isDark ? "#6e6e88" : "#9CA3AF" }}>Tài khoản</p>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 mb-4"
              >
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ background: "linear-gradient(135deg, #6D4CFF, #9B8FF8)" }}>
                  {(user.displayName || user.email || "U")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <span className="text-[16px] font-semibold" style={{ color: isDark ? "#e4e6eb" : "#1a1a2e" }}>
                  {user.displayName || user.email}
                </span>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-[#EF4444] text-[16px] font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
