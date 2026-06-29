"use client";

import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const partners = [
  "VINAGROUP",
  "TECH-SOL",
  "VIETCOM",
  "GLOBAL-AI",
  "SMART-RETAIL",
  "F&B-CONNECT",
  "HEALTH-CARE",
];

export default function PartnersSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section 
      className="py-[40px] overflow-hidden"
      style={{ 
        background: isDark ? "var(--color-bg-surface)" : "#F8F7FF", 
        borderTop: `1px solid ${isDark ? "var(--color-border)" : "#E5E7EB"}`, 
        borderBottom: `1px solid ${isDark ? "var(--color-border)" : "#E5E7EB"}` 
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .marquee-container:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) { 
          .marquee-container { animation: none; flex-wrap: wrap; justify-content: center; width: 100%; } 
        }
      `}} />

      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col items-center">
        <p className="text-[16px] md:text-[18px] font-medium text-[#64748B] mb-8 text-center">
          {t("about.partners.text")}
        </p>
      </div>
      
      <div className="w-full relative">
        <div className="marquee-container flex gap-12 md:gap-20 px-10">
          {[...partners, ...partners].map((partner, idx) => (
            <div
              key={idx}
              className="text-[18px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap"
              style={{ color: isDark ? "var(--color-text-disabled)" : "#9CA3AF" }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.color = isDark ? "var(--color-brand)" : "#6D4CFF";
                (e.target as HTMLDivElement).style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.color = isDark ? "var(--color-text-disabled)" : "#9CA3AF";
                (e.target as HTMLDivElement).style.transform = "scale(1)";
              }}
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

