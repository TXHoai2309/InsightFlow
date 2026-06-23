"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

export default function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

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
    { href: "/#features", label: t("nav.features") },
    { href: "/nganh", label: t("nav.industries") },
    { href: "/ve-chung-toi", label: t("nav.about") },
  ];

  const isActive = (href: string) => {
    if (href === "/#features") return pathname === "/";
    return pathname.startsWith(href);
  };

  const initials = (user?.displayName || user?.email || "U")
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300 font-sans h-[72px]"
        style={{
          background: scrolled ? "rgba(255,255,255,0.92)" : "#ffffff",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid transparent" : "1px solid #F1F0FF",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .nav-link {
            position: relative;
            color: #374151;
            font-weight: 500;
            font-size: 15px;
            transition: color 0.2s;
            padding: 4px 0;
          }
          .nav-link:hover {
            color: #6D4CFF;
          }
          .nav-link::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 2px;
            background-color: #6D4CFF;
            transition: width 0.3s ease;
          }
          .nav-link:hover::after {
            width: 100%;
          }
          .nav-link.active {
            color: #6D4CFF;
            font-weight: 600;
          }
          @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; animation: none !important; }
          }
        `,
          }}
        />

        <div className="flex justify-between items-center w-full px-5 md:px-12 max-w-[1440px] mx-auto h-full">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity w-[180px] md:w-[260px] h-full relative overflow-hidden">
            <img
              src="/logo.png"
              alt="InsightFlow Logo"
              className="absolute left-[-8px] md:left-[-12px] top-1/2 -translate-y-1/2 h-[120px] md:h-[160px] max-w-none mix-blend-multiply pointer-events-none"
            />
          </Link>

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

          <div className="flex items-center gap-4">
            {!loading && user && (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-[12px] group">
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[14px] font-bold group-hover:scale-105 transition-transform shadow-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #6D4CFF, #9B8FF8)" }}
                  >
                    {initials}
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[14px] font-semibold text-[#1a1a2e] group-hover:text-[#6D4CFF] transition-colors">
                      {user.displayName || user.email}
                    </span>
                    <span className="text-[12px] text-[#9CA3AF]">{t("profile.adminRole")}</span>
                  </div>
                </Link>
              </div>
            )}

            {!loading && !user && (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-[15px] font-medium text-[#374151] hover:text-[#6D4CFF] transition-colors"
                >
                  {t("auth.login.loginBtn")}
                </Link>
                <Link
                  href="/dashboard"
                  className="text-[14px] font-semibold text-white px-5 py-2 rounded-[10px] transition-all"
                  style={{ background: "#6D4CFF" }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.background = "#5B3FE8";
                    event.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.background = "#6D4CFF";
                    event.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {t("home.hero.freeTrialBtn")}
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 text-[#6D4CFF]"
              onClick={() => setMobileOpen(true)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm z-[110] transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[120] shadow-2xl transition-transform duration-300 md:hidden flex flex-col ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-5 flex justify-end">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-[#64748B] hover:text-[#1a1a2e]"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className={`block py-[16px] px-[24px] text-[18px] transition-colors ${isActive(link.href) ? "text-[#6D4CFF] font-semibold bg-[#F8F7FF]" : "text-[#374151] font-medium"}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {!loading && user && (
            <div className="mt-4 border-t border-[#F1F0FF] px-[24px] py-[16px]">
              <p className="text-[14px] font-medium text-[#9CA3AF] mb-3">{t("profile.title")}</p>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 mb-4"
              >
                <div
                  className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[14px] font-bold"
                  style={{ background: "linear-gradient(135deg, #6D4CFF, #9B8FF8)" }}
                >
                  {initials}
                </div>
                <span className="text-[16px] font-semibold text-[#1a1a2e]">
                  {user.displayName || user.email}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#EF4444] text-[16px] font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                {t("profile.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
