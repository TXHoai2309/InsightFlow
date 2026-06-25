"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/* ─── Light-theme Brand Dashboard ─── */
function BrandDashboardSVG({ animate }: { animate: boolean }) {
  const { t } = useTranslation();
  const sources = [
    { label: "Facebook", color: "#1877F2", pct: 68 },
    { label: "TikTok", color: "#FF0050", pct: 42 },
    { label: "Zalo", color: "#0068FF", pct: 28 },
  ];

  // Sparkline path (trend line going up)
  const points = [
    [0, 52], [12, 46], [24, 50], [36, 38], [48, 30], [60, 20], [72, 24], [84, 12], [96, 6],
  ];
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaD = `${pathD} L 96 60 L 0 60 Z`;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(109,76,255,0.13)",
        overflow: "hidden",
        filter: "drop-shadow(0 0 40px rgba(109,76,255,0.10))",
        transform: animate ? "perspective(1000px) rotateY(0deg)" : "perspective(1000px) rotateY(-3deg)",
        transition: "transform 0.4s ease",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #F3F0FF 0%, #EEF4FF 100%)",
          padding: "12px 16px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6D4CFF" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#4234b6" }}>InsightFlow</span>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "3px 10px",
            fontSize: 11,
            color: "#4A4A6A",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {t("home.dashboardPreview.brandA")} <span style={{ color: "#9898B0" }}>▾</span>
        </div>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Row 1: Share of Voice + Line Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 10 }}>
          {/* Share of Voice */}
          <div
            style={{
              background: "#FAFAFE",
              border: "1px solid #EDE9FF",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <p style={{ fontSize: 9, color: "#9898B0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Share of Voice
            </p>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#6D4CFF", lineHeight: 1 }}>34%</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: "#EDE9FF",
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: animate ? "34%" : "0%",
                    background: "linear-gradient(90deg, #6D4CFF, #9B8FF8)",
                    borderRadius: 999,
                    transition: "width 1s ease-out 0.4s",
                  }}
                />
              </div>
            </div>
            <p style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, marginTop: 4 }}>{t("home.dashboardPreview.vsPrevMonth")}</p>
          </div>

          {/* Trend Line Chart */}
          <div
            style={{
              background: "#FAFAFE",
              border: "1px solid #EDE9FF",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <p style={{ fontSize: 9, color: "#9898B0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              {t("home.dashboardPreview.trendTitle")}
            </p>
            <svg viewBox="0 0 96 60" style={{ width: "100%", height: 52 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D4CFF" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#6D4CFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[15, 30, 45].map((y) => (
                <line key={y} x1="0" y1={y} x2="96" y2={y} stroke="#F0ECFF" strokeWidth="0.8" />
              ))}
              {/* Area fill */}
              <path d={areaD} fill="url(#areaGrad)" />
              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#6D4CFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End dot */}
              <circle cx="96" cy="6" r="3" fill="#6D4CFF" />
            </svg>
          </div>
        </div>

        {/* Row 2: Source breakdown */}
        <div
          style={{
            background: "#FAFAFE",
            border: "1px solid #EDE9FF",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <p style={{ fontSize: 9, color: "#9898B0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {t("home.dashboardPreview.topSources")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {sources.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#4A4A6A", fontWeight: 600, width: 56, flexShrink: 0 }}>{s.label}</span>
                <div style={{ flex: 1, height: 7, borderRadius: 999, background: "#EDE9FF", overflow: "hidden" }}>
                  <div
                    style={{
                      width: animate ? `${s.pct}%` : "0%",
                      height: "100%",
                      background: `linear-gradient(90deg, ${s.color}cc, ${s.color}88)`,
                      borderRadius: 999,
                      transition: `width 0.9s ease-out ${0.5 + sources.indexOf(s) * 0.12}s`,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6D4CFF", width: 28, textAlign: "right" }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Top KOLs */}
        <div
          style={{
            background: "#FAFAFE",
            border: "1px solid #EDE9FF",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 9, color: "#9898B0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
            Top KOLs
          </span>
          <div style={{ width: 1, height: 16, background: "#E5E7EB" }} />
          {[
            t("home.dashboardPreview.kol1", { defaultValue: "Nguyễn A" }),
            t("home.dashboardPreview.kol2", { defaultValue: "Trần B" }),
            t("home.dashboardPreview.kol3", { defaultValue: "Lê C" })
          ].map((kol, i) => (
            <div
              key={kol}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: ["#EDE9FF", "#DBEAFE", "#FEF9C3"][i],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 800,
                  color: ["#6D4CFF", "#2563EB", "#B45309"][i],
                }}
              >
                {kol[0]}
              </div>
              <span style={{ fontSize: 10, color: "#4A4A6A", fontWeight: 600 }}>{kol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Numbered Feature Card ─── */
function FeatureCard({
  num,
  title,
  desc,
  visible,
  delay,
}: {
  num: string;
  title: string;
  desc: string;
  visible: boolean;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#F3F0FF" : "#FAFAFE",
        borderLeft: hovered ? "3px solid #4234b6" : "3px solid #6D4CFF",
        borderTop: "1px solid #EDE9FF",
        borderRight: "1px solid #EDE9FF",
        borderBottom: "1px solid #EDE9FF",
        borderRadius: 10,
        padding: "16px 20px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transform: visible
          ? hovered
            ? "translateX(4px)"
            : "translateX(0) translateY(0)"
          : "translateY(24px)",
        opacity: visible ? 1 : 0,
        transition: `transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, opacity 0.5s ease ${delay}ms`,
      }}
    >
      {/* Decorative number */}
      <span
        style={{
          position: "absolute",
          right: 12,
          top: 8,
          fontSize: 32,
          fontWeight: 900,
          color: "#EDE9FF",
          lineHeight: 1,
          userSelect: "none",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {num}
      </span>

      <p style={{ fontSize: 15, fontWeight: 700, color: "#1c1b23", marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

/* ─── Main Section ─── */
export default function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      num: "01",
      title: t("home.dashboardPreview.card1Title"),
      desc: t("home.dashboardPreview.card1Desc"),
    },
    {
      num: "02",
      title: t("home.dashboardPreview.card2Title"),
      desc: t("home.dashboardPreview.card2Desc"),
    },
    {
      num: "03",
      title: t("home.dashboardPreview.card3Title"),
      desc: t("home.dashboardPreview.card3Desc"),
    },
  ];

  return (
    <section
      style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F7FF 100%)" }}
      className="px-6 py-[60px]"
    >
      <div className="max-w-[1200px] mx-auto">
        <div
          ref={ref}
          className="grid grid-cols-1 lg:grid-cols-2 items-center"
          style={{ gap: 64 }}
        >
          {/* ── Left: Dashboard ── */}
          <div
            className="order-2 lg:order-1"
            style={{
              transform: visible ? "translateX(0)" : "translateX(-40px)",
              opacity: visible ? 1 : 0,
              transition: "transform 0.7s ease-out, opacity 0.7s ease-out",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget.querySelector<HTMLDivElement>("[data-dashboard]");
              if (el) el.style.transform = "perspective(1000px) rotateY(0deg)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget.querySelector<HTMLDivElement>("[data-dashboard]");
              if (el) el.style.transform = "perspective(1000px) rotateY(-3deg)";
            }}
          >
            <div data-dashboard>
              <BrandDashboardSVG animate={visible} />
            </div>
          </div>

          {/* ── Right: Text + Cards ── */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Label */}
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest"
              style={{ background: "#E4DFFF", color: "#4234b6" }}
            >
              Brand Intelligence
            </span>

            {/* Heading */}
            <h2 className="text-[32px] md:text-[38px] leading-tight tracking-[-0.02em] font-black text-[#1c1b23]">
              {t("home.dashboardPreview.title")}{" "}
              <span
                style={{
                  color: "#6D4CFF",
                  textDecoration: "underline",
                  textDecorationColor: "#C4B8FF",
                  textDecorationThickness: 3,
                  textUnderlineOffset: 4,
                }}
              >
                {t("home.dashboardPreview.titleHighlight")}
              </span>{" "}
              {t("home.dashboardPreview.titleEnd")}
            </h2>

            {/* Subtext */}
            <p className="text-[16px] leading-[26px] text-[#474554]">
              {t("home.dashboardPreview.subtitle")}
            </p>

            {/* Numbered cards */}
            <div className="flex flex-col gap-3">
              {cards.map((card, i) => (
                <FeatureCard
                  key={card.num}
                  num={card.num}
                  title={card.title}
                  desc={card.desc}
                  visible={visible}
                  delay={100 + i * 100}
                />
              ))}
            </div>

            {/* CTA link */}
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 font-semibold text-[14px] group"
              style={{ color: "#6D4CFF" }}
            >
              {t("home.dashboardPreview.demo")}
              <i
                className="ti ti-arrow-right text-[15px] transition-transform duration-200 group-hover:translate-x-1"
              />
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
