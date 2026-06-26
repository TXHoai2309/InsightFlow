"use client";

import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── TrustedBySection — Social Proof ─── */

const brands = [
  { name: "FPT", label: "FPT" },
  { name: "VNPT", label: "VNPT" },
  { name: "Viettel", label: "Viettel" },
  { name: "Shopee", label: "Shopee" },
  { name: "MoMo", label: "MoMo" },
  { name: "Grab", label: "Grab" },
  { name: "VinGroup", label: "VinGroup" },
];

export default function TrustedBySection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section 
      className="py-10 px-6 border-y" 
      style={{ 
        background: isDark ? "var(--color-bg-surface)" : "#faf9ff",
        borderColor: isDark ? "var(--color-border)" : "#F0ECFF"
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        <p className="text-center text-[13px] text-[#9898B0] font-semibold uppercase tracking-widest mb-7">
          {t("home.trustedBy.text")}{" "}
          <span className="text-[#6D4CFF]">{t("home.trustedBy.highlight")}</span>
        </p>

        {/* Marquee wrapper */}
        <div className="relative overflow-hidden">
          <div
            className="flex gap-12 items-center"
            style={{ animation: "marquee 28s linear infinite" }}
          >
            {/* Duplicate for seamless loop */}
            {[...brands, ...brands].map((b, i) => (
              <div
                key={`${b.name}-${i}`}
                className="shrink-0 group cursor-pointer select-none"
              >
                <span
                  className="text-[20px] font-black tracking-tight transition-all duration-200"
                  style={{ color: isDark ? "var(--color-text-disabled)" : "#D1D5DB", letterSpacing: "-0.03em" }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLSpanElement).style.color = isDark ? "var(--color-text-primary)" : "#1c1b23";
                    (e.target as HTMLSpanElement).style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLSpanElement).style.color = isDark ? "var(--color-text-disabled)" : "#D1D5DB";
                    (e.target as HTMLSpanElement).style.transform = "scale(1)";
                  }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          {/* Fade edges */}
          <div
            className="absolute left-0 top-0 w-24 h-full pointer-events-none"
            style={{ background: isDark ? "linear-gradient(to right, var(--color-bg-surface), transparent)" : "linear-gradient(to right, #faf9ff, transparent)" }}
          />
          <div
            className="absolute right-0 top-0 w-24 h-full pointer-events-none"
            style={{ background: isDark ? "linear-gradient(to left, var(--color-bg-surface), transparent)" : "linear-gradient(to left, #faf9ff, transparent)" }}
          />
        </div>
      </div>

    </section>
  );
}

