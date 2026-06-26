"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── KPI Counter Hook ─── */
function useCountUp(target: number, duration = 1800, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return count;
}

/* ─── Mini Dashboard SVG Component ─── */
function DashboardDemo() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: isDark ? "var(--color-bg-surface)" : "#fff",
        boxShadow: isDark ? "0 0 120px rgba(123,116,255,0.12), 0 24px 64px rgba(0,0,0,0.3)" : "0 0 120px rgba(109,76,255,0.18), 0 24px 64px rgba(0,0,0,0.10)",
        border: isDark ? "1.5px solid var(--color-border)" : "1.5px solid #ede9ff",
      }}
    >
      {/* Dashboard header bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: isDark ? "var(--color-bg-surface-raised)" : "#faf9ff", borderColor: isDark ? "var(--color-border)" : "#F3F0FF" }}>
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-[11px] font-semibold text-[#9898B0] tracking-wide">InsightFlow Dashboard</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-16 h-5 rounded-full bg-[#F0ECFF] flex items-center justify-center">
            <span className="text-[9px] text-[#6D4CFF] font-semibold">Live ●</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Row 1: 3 stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Sentiment Score */}
          <div className="rounded-[14px] p-3 col-span-1" style={{ background: isDark ? "var(--color-bg-surface-raised)" : "#faf9ff", border: isDark ? "1px solid var(--color-border)" : "1px solid #ede9ff" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide mb-1" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("home.hero.demo.sentiment")}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold text-[#6D4CFF] leading-none">71%</span>
              <span className="text-[12px]">😊</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "var(--color-brand-subtle)" : "#ede9ff" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: "71%",
                  background: "linear-gradient(90deg, #6D4CFF, #9B8FF8)",
                  animation: "growBar 1.2s ease-out 0.5s both",
                }}
              />
            </div>
            <p className="text-[8px] mt-1" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("home.hero.demo.positive")}</p>
          </div>

          {/* Trend */}
          <div className="rounded-[14px] p-3 col-span-1" style={{ background: isDark ? "var(--color-success-subtle)" : "#f0fdf4", border: isDark ? "1px solid rgba(74,222,128,0.2)" : "1px solid #bbf7d0" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide mb-1" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("home.hero.demo.trend")}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold text-[#16a34a] leading-none">+43%</span>
              <span className="text-[11px]">📈</span>
            </div>
            {/* Mini sparkline */}
            <svg viewBox="0 0 60 22" className="mt-1 w-full h-5">
              <polyline
                points="0,18 12,14 24,16 36,9 48,5 60,1"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="60" cy="1" r="2.5" fill="#22c55e" />
            </svg>
          </div>

          {/* Crisis Alert */}
          <div className="rounded-[14px] p-3 col-span-1 relative overflow-hidden" style={{ background: isDark ? "var(--color-error-subtle)" : "#fff8f8", border: isDark ? "1px solid rgba(248,113,113,0.2)" : "1px solid #fed7d7" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide mb-1" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("home.hero.demo.crisis")}</p>
            <div className="flex items-center gap-1 mt-1">
              <span
                className="w-2 h-2 rounded-full bg-[#ef4444]"
                style={{ animation: "pulse 1.2s infinite" }}
              />
              <span className="text-[11px] font-bold text-[#ef4444]">{t("home.hero.demo.alert")} ⚠️</span>
            </div>
            <p className="text-[8px] text-[#ef4444] mt-1 font-medium">{t("home.hero.demo.newIssues")}</p>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#fee2e2] opacity-60" />
          </div>
        </div>

        {/* Row 2: Top Keywords bar chart */}
        <div className="rounded-[14px] p-3" style={{ background: isDark ? "var(--color-bg-surface-raised)" : "#faf9ff", border: isDark ? "1px solid var(--color-border)" : "1px solid #ede9ff" }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-2" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("home.hero.demo.topKeywords")}</p>
          <div className="space-y-1.5">
            {[
              { label: t("home.hero.demo.kw.quality"), pct: 88 },
              { label: t("home.hero.demo.kw.delivery"), pct: 72 },
              { label: t("home.hero.demo.kw.price"), pct: 60 },
              { label: t("home.hero.demo.kw.service"), pct: 51 },
              { label: t("home.hero.demo.kw.promo"), pct: 38 },
            ].map((kw, i) => (
              <div key={kw.label} className="flex items-center gap-2">
                <span className="text-[8px] w-14 shrink-0 font-medium" style={{ color: isDark ? "var(--color-text-secondary)" : "#4A4A6A" }}>{kw.label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? "var(--color-brand-subtle)" : "#ede9ff" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${kw.pct}%`,
                      background: `hsl(${253 - i * 10}, 72%, ${55 + i * 4}%)`,
                      animation: `growBar 0.8s ease-out ${0.3 + i * 0.1}s both`,
                    }}
                  />
                </div>
                <span className="text-[8px] font-semibold w-6 text-right" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{kw.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Word cloud */}
        <div className="rounded-[14px] px-3 py-2.5" style={{ background: isDark ? "var(--color-bg-surface-raised)" : "#faf9ff", border: isDark ? "1px solid var(--color-border)" : "1px solid #ede9ff" }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-2" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{t("home.hero.demo.wordCloud")}</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {[
              { word: t("home.hero.demo.wc.delicious"), size: 14, color: "#6D4CFF" },
              { word: t("home.hero.demo.wc.fast"), size: 11, color: "#9B8FF8" },
              { word: t("home.hero.demo.wc.goodService"), size: 12, color: "#4234b6" },
              { word: t("home.hero.demo.wc.cheap"), size: 13, color: "#6D4CFF" },
              { word: t("home.hero.demo.wc.clean"), size: 10, color: "#9B8FF8" },
              { word: t("home.hero.demo.wc.slow"), size: 9, color: "#ef4444" },
              { word: t("home.hero.demo.wc.fresh"), size: 12, color: "#16a34a" },
              { word: t("home.hero.demo.wc.crowded"), size: 10, color: "#f59e0b" },
              { word: t("home.hero.demo.wc.friendly"), size: 11, color: "#6D4CFF" },
            ].map((w) => (
              <span
                key={w.word}
                style={{ fontSize: w.size, color: w.color, fontWeight: 600, opacity: 0.85 }}
              >
                {w.word}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─── KPI Stats Bar ─── */
function KpiBar() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const businesses = useCountUp(500, 1600, started);
  const articles = useCountUp(200, 1800, started);
  const accuracy = useCountUp(98, 1400, started);

  const stats = [
    { value: `${businesses}+`, label: t("home.hero.kpi.businesses") },
    { value: `${articles * 10000 >= 2000000 ? "2M+" : (articles * 10000).toLocaleString()}`, label: t("home.hero.kpi.articles") },
    { value: `${accuracy}%`, label: t("home.hero.kpi.accuracy") },
    { value: "24/7", label: t("home.hero.kpi.monitoring"), static: true },
  ];

  return (
    <div
      ref={ref}
      className="flex flex-wrap gap-x-0 gap-y-3 pt-6 mt-2 border-t"
      style={{ borderColor: isDark ? "var(--color-border)" : "#e5e1f5" }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <div className="text-center px-5">
            <div className="text-[22px] font-black leading-none" style={{ color: isDark ? "var(--color-brand)" : "#6D4CFF" }}>{s.value}</div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: isDark ? "var(--color-text-muted)" : "#9898B0" }}>{s.label}</div>
          </div>
          {i < stats.length - 1 && (
            <div className="w-px h-8" style={{ background: isDark ? "var(--color-border)" : "#e5e1f5" }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main HeroSection ─── */
export default function HeroSection() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className="relative overflow-hidden px-6 py-16 md:py-20"
      style={{ background: isDark ? "linear-gradient(135deg, #111318 0%, #1a1a2e 100%)" : "linear-gradient(135deg, #f8f7ff 0%, #eef4ff 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "#6D4CFF", opacity: 0.06, filter: "blur(80px)" }}
      />
      <div
        className="absolute bottom-[-15%] right-[-8%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "#4234b6", opacity: 0.08, filter: "blur(100px)" }}
      />
      <div
        className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "#9B8FF8", opacity: 0.06, filter: "blur(80px)" }}
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

          {/* ── Left Content ── */}
          <div
            className="lg:col-span-6 space-y-5"
            style={{ animation: "heroSlideUp 0.6s ease-out 0.1s both" }}
          >
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-[12px] tracking-wider uppercase"
              style={{ background: isDark ? "rgba(123,116,255,0.15)" : "#e4dfff", color: isDark ? "#9B8FF8" : "#4234b6" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#6D4CFF] animate-pulse inline-block" />
              {t("home.hero.badge")}
            </span>

            {/* Headline */}
            <h1 className="text-[40px] md:text-[52px] leading-[1.1] tracking-[-0.02em] font-black" style={{ color: isDark ? "var(--color-text-primary)" : "#1c1b23" }}>
              {t("home.hero.title1")}{" "}
              <span
                className="relative inline-block"
                style={{
                  background: "linear-gradient(90deg, #6D4CFF, #9B8FF8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("home.hero.titleHighlight")}
              </span>{" "}
              {t("home.hero.title2")}
            </h1>

            {/* Subtext */}
            <p className="text-[17px] leading-[28px] max-w-lg" style={{ color: isDark ? "var(--color-text-secondary)" : "#474554" }}>
              {t("home.hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              {!loading && user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 text-white px-7 py-3.5 rounded-[12px] font-bold text-[15px] transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #6D4CFF, #4234b6)",
                    boxShadow: "0 4px 20px rgba(109,76,255,0.4)",
                  }}
                >
                  <i className="ti ti-layout-dashboard text-[16px]" />
                  {t("home.hero.dashboardBtn")}
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 text-white px-7 py-3.5 rounded-[12px] font-bold text-[15px] transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #6D4CFF, #4234b6)",
                    boxShadow: "0 4px 20px rgba(109,76,255,0.4)",
                  }}
                >
                  <i className="ti ti-rocket text-[16px]" />
                  {t("home.hero.freeTrialBtn")}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 border-2 px-7 py-3.5 rounded-[12px] font-bold text-[15px] transition-all active:scale-95"
                style={{ borderColor: "#6D4CFF", color: isDark ? "#9B8FF8" : "#6D4CFF" }}
              >
                <i className="ti ti-player-play text-[16px]" />
                {t("home.hero.demoBtn")}
              </Link>
            </div>

            {/* KPI counter bar */}
            <KpiBar />
          </div>

          {/* ── Right — Dashboard Preview ── */}
          <div
            className="lg:col-span-6 relative"
            style={{ animation: "heroDashboard 0.8s ease-out 0.3s both" }}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "24px",
                boxShadow: "0 0 120px rgba(109,76,255,0.22)",
              }}
            />
            <DashboardDemo />
          </div>
        </div>
      </div>

    </section>
  );
}
