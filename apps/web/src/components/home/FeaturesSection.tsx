"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

type FeatureType = {
  icon: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  bg: string;
};

function FeatureCard({ feature, delay, learnMoreText }: { feature: FeatureType; delay: number; learnMoreText: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group p-7 border rounded-[16px] flex flex-col gap-4 cursor-pointer"
      style={{
        background: isDark ? "var(--color-bg-surface)" : "#ffffff",
        borderColor: isDark ? "var(--color-border)" : "#E5E7EB",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, opacity 0.5s ease",
        transform: visible ? "translateY(0)" : "translateY(24px)",
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}ms`,
        boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 12px 40px rgba(0,0,0,0.35)" : "0 12px 40px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 1px 4px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.06)";
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] transition-transform duration-300 group-hover:rotate-[10deg]"
        style={{ background: isDark ? `${feature.accent}18` : feature.bg }}
      >
        <i className={`ti ${feature.icon}`} style={{ color: feature.accent, fontSize: 22 }} />
      </div>

      {/* Labels */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: feature.accent }}>
          {feature.emoji} {feature.title}
        </p>
        <h3 className="text-[19px] font-bold leading-tight" style={{ color: isDark ? "var(--color-text-primary)" : "#1c1b23" }}>{feature.subtitle}</h3>
      </div>

      <p className="text-[14px] leading-[22px]" style={{ color: isDark ? "var(--color-text-muted)" : "#6B7280" }}>{feature.description}</p>

      {/* Learn more */}
      <div
        className="flex items-center gap-1 text-[13px] font-semibold mt-auto"
        style={{ color: feature.accent }}
      >
        {learnMoreText}
        <i className="ti ti-arrow-right text-[14px] transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features: FeatureType[] = [
    {
      icon: "ti-brain",
      emoji: "🤖",
      title: "AI Analysis",
      subtitle: t("home.features.ai.subtitle"),
      description: t("home.features.ai.desc"),
      accent: "#6D4CFF",
      bg: "#f5f3ff",
    },
    {
      icon: "ti-chart-line",
      emoji: "📊",
      title: "Real-time",
      subtitle: t("home.features.rt.subtitle"),
      description: t("home.features.rt.desc"),
      accent: "#0ea5e9",
      bg: "#f0f9ff",
    },
    {
      icon: "ti-shield-exclamation",
      emoji: "🛡️",
      title: "Crisis Alert",
      subtitle: t("home.features.crisis.subtitle"),
      description: t("home.features.crisis.desc"),
      accent: "#ef4444",
      bg: "#fff8f8",
    },
    {
      icon: "ti-file-analytics",
      emoji: "📋",
      title: "Auto Report",
      subtitle: t("home.features.report.subtitle"),
      description: t("home.features.report.desc"),
      accent: "#16a34a",
      bg: "#f0fdf4",
    },
  ];

  return (
    <section id="features" className="py-[72px] px-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest mb-4" style={{ background: isDark ? "rgba(123,116,255,0.15)" : "#e4dfff", color: isDark ? "#9B8FF8" : "#4234b6" }}>
          {t("home.features.badge")}
        </span>
        <h2 className="text-[34px] md:text-[40px] leading-tight tracking-[-0.02em] font-black mb-3" style={{ color: isDark ? "var(--color-text-primary)" : "#1c1b23" }}>
          {t("home.features.title1")}{" "}
          <span style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}>{t("home.features.titleHighlight")}</span>
        </h2>
        <p className="text-[15px] max-w-xl mx-auto" style={{ color: isDark ? "var(--color-text-muted)" : "#6B7280" }}>
          {t("home.features.subtitle")}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={i * 100} learnMoreText={t("home.features.learnMore")} />
        ))}
      </div>
    </section>
  );
}
