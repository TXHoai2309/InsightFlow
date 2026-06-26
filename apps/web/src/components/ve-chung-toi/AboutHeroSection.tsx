"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

export default function AboutHeroSection() {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section
      className="relative px-6 md:px-10 py-16 md:py-24 overflow-hidden"
      style={{
        background: isDark ? "linear-gradient(135deg, #111318 0%, #1a1a2e 100%)" : "linear-gradient(135deg, #f8f7ff 0%, #eef4ff 100%)",
      }}
    >
      {/* Decorative Blobs */}
      <div 
        className="absolute top-0 right-0 rounded-full pointer-events-none hidden md:block"
        style={{ width: "400px", height: "400px", background: "#6D4CFF", opacity: 0.07, filter: "blur(80px)", transform: "translate(20%, -20%)" }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 rounded-full pointer-events-none hidden md:block"
        style={{ width: "300px", height: "300px", background: "#3B82F6", opacity: 0.05, filter: "blur(80px)", transform: "translate(-20%, 20%)" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        {/* Left Content */}
        <div className="w-full md:w-1/2 space-y-6">
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[20px] text-[14px] font-semibold tracking-wide"
            style={{ 
              background: "rgba(109,76,255,0.08)", 
              border: "1px solid rgba(109,76,255,0.2)",
              color: "#6D4CFF"
            }}
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            {t("about.hero.badge")}
          </div>
          
          <h1 className="text-[36px] md:text-[44px] font-[800] text-[#1a1a2e]" style={{ lineHeight: 1.2 }}>
            {t("about.hero.title1")}
            <span style={{ background: "linear-gradient(90deg, #6D4CFF, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("about.hero.titleHighlight")}
            </span>
            {t("about.hero.title2")}
          </h1>
          
          <p className="text-[16px] md:text-[18px] leading-[1.6] text-[#64748B] max-w-xl">
            {t("about.hero.subtitle")}
          </p>
          
          <div className="flex gap-4 flex-wrap pt-2">
            <Link
              href="#mission-vision"
              className="px-8 py-4 rounded-xl text-[16px] font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-block"
              style={{ background: "#6D4CFF" }}
            >
              {t("about.hero.ctaLearnMore")}
            </Link>
            <Link
              href="#team"
              className="border-2 px-8 py-4 rounded-xl text-[16px] font-bold transition-all hover:bg-gray-50 inline-block"
              style={{ borderColor: isDark ? "var(--color-border)" : "#E5E7EB", color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}
            >
              {t("about.hero.ctaViewTeam")}
            </Link>
          </div>
        </div>

        {/* Right: Stat Panel Card */}
        <div className="w-full md:w-1/2 relative flex justify-center md:justify-end perspective-1000">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeInSlideRight {
              from { opacity: 0; transform: translateX(50px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}} />
          
          <div 
            className="w-full max-w-md p-8 opacity-0"
            data-about-stat-card
            style={{ 
              borderRadius: "24px",
              background: isDark ? "var(--color-bg-surface)" : "#ffffff",
              boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.3)" : "0 20px 60px rgba(109,76,255,0.12)",
              animation: isLoaded ? "fadeInSlideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none"
            }}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: isDark ? "var(--color-border)" : "#f3f4f6" }}>
              <span className="text-[24px]">🏆</span>
              <h3 className="text-[20px] font-bold text-[#1a1a2e]">{t("about.hero.statsTitle")}</h3>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { icon: "calendar_today", num: t("about.hero.stat1Num"), label: t("about.hero.stat1Label") },
                { icon: "group", num: t("about.hero.stat2Num"), label: t("about.hero.stat2Label") },
                { icon: "corporate_fare", num: t("about.hero.stat3Num"), label: t("about.hero.stat3Label") },
                { icon: "public", num: t("about.hero.stat4Num"), label: t("about.hero.stat4Label") },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 py-2 px-4 rounded-lg"
                  data-stat-row
                  style={{ borderLeft: "3px solid #6D4CFF", background: isDark ? "var(--color-bg-surface-raised)" : "#f8f7ff" }}
                >
                  <span className="material-symbols-outlined text-[24px]" style={{ color: "#6D4CFF" }}>
                    {stat.icon}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[18px] font-bold" style={{ color: isDark ? "var(--color-text-primary)" : "#1a1a2e" }}>{stat.num}</span>
                    <span className="text-[14px]" style={{ color: isDark ? "var(--color-text-muted)" : "#64748B" }}>{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: isDark ? "var(--color-border)" : "#f3f4f6" }}>
              <div className="flex gap-1 text-[#FBBF24] text-[20px]">
                ★★★★★
              </div>
              <span className="text-[14px] font-semibold text-[#1a1a2e]">{t("about.hero.rating")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
