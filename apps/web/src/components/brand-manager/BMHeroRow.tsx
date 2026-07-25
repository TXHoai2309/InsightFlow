"use client";

/**
 * BMHeroRow — Brand Health Gauge + Sentiment Donut + AI Insight
 * Hàng đầu tiên của dashboard: nhìn vào là biết ngay tình trạng thương hiệu.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  DoughnutController,
} from "chart.js";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

ChartJS.register(ArcElement, DoughnutController, Tooltip);
ChartJS.defaults.font.family = 'Inter, "Segoe UI", Arial, sans-serif';

interface BMHeroRowProps {
  score: number;       // 0–100
  trend: number;       // Điểm thay đổi so với kỳ trước
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  totalMentions: number;
  brandName?: string;
  timeRange?: string;
  topics?: Array<{ name: string; count: number; negative: number }>;
  trendData?: Array<number | null>;
  onViewDetail?: () => void;
}

interface DashboardAiAnalysis {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  riskTrend: "decreasing" | "stable" | "increasing";
  confidence: number;
}
/* ── Gauge arc drawing ──────────────────────────────────────── */
function GaugeChart({ score }: { score: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 220;
    canvas.width = size * dpr;
    canvas.height = (size * 0.7) * dpr; // semi-circle height
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size * 0.7}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size * 0.62;
    const radius = size * 0.4;
    const lineW = size * 0.085;
    const startAngle = Math.PI; // 180°
    const endAngle = 2 * Math.PI; // 360°

    // Background arc
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = lineW;
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9";
    ctx.lineCap = "round";
    ctx.stroke();

    // Color gradient based on score
    const pct = score / 100;
    const filledEnd = startAngle + pct * Math.PI;

    // Gradient from green(good) → yellow(warn) → red(bad)
    // We use the score to pick the color
    let color: string;
    if (score >= 70) color = "#22C55E";
    else if (score >= 40) color = "#F59E0B";
    else color = "#EF4444";

    // Draw gradient arc via segments
    const segments = 60;
    const segAngle = Math.PI / segments;
    for (let i = 0; i < segments * pct; i++) {
      const t = i / segments;
      // Lerp color based on score zone
      let segColor: string;
      if (score >= 70) {
        // Green zone: dark-green → bright-green
        const g = Math.round(160 + 55 * t);
        segColor = `rgb(20, ${g}, 80)`;
      } else if (score >= 40) {
        segColor = `hsl(${38 + t * 12}, 95%, ${45 + t * 10}%)`;
      } else {
        segColor = `hsl(${t * 10}, 90%, ${50 + t * 8}%)`;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle + i * segAngle, startAngle + (i + 1) * segAngle);
      ctx.lineWidth = lineW;
      ctx.strokeStyle = color;
      ctx.lineCap = i === 0 ? "round" : "butt";
      ctx.stroke();
    }

    // Needle
    const needleAngle = startAngle + pct * Math.PI;
    const needleLen = radius - lineW / 2 - 4;
    const nx = cx + Math.cos(needleAngle) * needleLen;
    const ny = cy + Math.sin(needleAngle) * needleLen;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 3;
    ctx.strokeStyle = isDark ? "#fff" : "#1E293B";
    ctx.lineCap = "round";
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? "#fff" : "#1E293B";
    ctx.fill();
  }, [score, theme]);

  return <canvas ref={canvasRef} />;
}

/* ── Donut ──────────────────────────────────────────────────── */
function SentimentDonut({
  positive, neutral, negative, total,
}: { positive: number; neutral: number; negative: number; total: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartJS(ctx, {
      type: "doughnut",
      data: {
        labels: [t("bm.hero.positive"), t("bm.hero.neutral"), t("bm.hero.negative")],
        datasets: [{
          data: [positive, neutral, negative],
          backgroundColor: isDark
            ? ["#4ADE80", "#94A3B8", "#F87171"]
            : ["#22C55E", "#CBD5E1", "#EF4444"],
          borderWidth: 3,
          borderColor: isDark ? "#0A0612" : "#FFFFFF",
          hoverBorderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#252530" : "#fff",
            titleColor: isDark ? "#e4e6eb" : "#111c2d",
            bodyColor: isDark ? "#a0a0b8" : "#4a4a6a",
            borderColor: isDark ? "#2e2e3a" : "#e2e4f0",
            borderWidth: 1,
            cornerRadius: 8,
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [positive, neutral, negative, theme]);

  const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
        <canvas ref={canvasRef} width={160} height={160} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{
            fontSize: 24, fontWeight: 800,
            color: "var(--color-text-primary)", lineHeight: 1,
          }}>
            {total.toLocaleString("vi-VN")}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3, fontWeight: 500 }}>
            {t("bm.hero.totalMentions")}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "Tích cực", value: positive, pct: pct(positive), color: "#22C55E", darkColor: "#4ADE80" },
          { label: "Trung lập", value: neutral, pct: pct(neutral), color: "#94A3B8", darkColor: "#94A3B8" },
          { label: "Tiêu cực", value: negative, pct: pct(negative), color: "#EF4444", darkColor: "#F87171" },
        ].map(({ label, value, pct: p, color, darkColor }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: color, flexShrink: 0,
            }} className={`dark:!bg-[${darkColor}]`} />
            <div>
              <div style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 600 }}>
                {t(`bm.hero.${label === "Tích cực" ? "positive" : label === "Trung lập" ? "neutral" : "negative"}`)} <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({p}%)</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                {value.toLocaleString("vi-VN")} {t("bm.hero.mentionsCount")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export function BMHeroRow({
  score,
  trend,
  sentiment,
  totalMentions,
  brandName,
  timeRange,
  topics = [],
  trendData = [],
  onViewDetail,
}: BMHeroRowProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [aiAnalysis, setAiAnalysis] = useState<DashboardAiAnalysis | null>(null);
  const [aiState, setAiState] = useState<"loading" | "ready" | "error">("loading");
  const [showAiDetail, setShowAiDetail] = useState(false);
  const isHealthy = score >= 70;
  const isWarning = score < 70 && score >= 40;
  const sparkValues = useMemo(() => {
    const values = trendData.slice(-7).map((value) => (Number.isFinite(value) ? Number(value) : null));
    if (values.length < 2) return [];
    const known = values.filter((value): value is number => value !== null);
    if (known.length < 2) return [];
    return values.map((value, index) => {
      if (value !== null) return value;
      const previous = values.slice(0, index).reverse().find((item): item is number => item !== null);
      const next = values.slice(index + 1).find((item): item is number => item !== null);
      return previous ?? next ?? known[0];
    });
  }, [trendData]);

  const sparkPath = useMemo(() => {
    if (sparkValues.length < 2) return null;
    const width = 200;
    const min = Math.min(...sparkValues);
    const max = Math.max(...sparkValues);
    const range = Math.max(1, max - min);
    const points = sparkValues.map((value, index) => {
      const x = (index / (sparkValues.length - 1)) * width;
      const y = 35 - ((value - min) / range) * 30;
      return [x, y] as const;
    });
    const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return { line, area: `${line} L ${width},40 L 0,40 Z` };
  }, [sparkValues]);

  const statusLabel = isHealthy ? t("bm.hero.status.good") : isWarning ? t("bm.hero.status.warning") : t("bm.hero.status.danger");
  const statusColor = isHealthy ? "#22C55E" : isWarning ? "#F59E0B" : "#EF4444";
  const statusBg = isHealthy ? "rgba(34,197,94,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  const fallbackAiText = isHealthy
    ? t("bm.hero.aiText.good")
    : isWarning
      ? t("bm.hero.aiText.warning")
      : t("bm.hero.aiText.danger");

  const topicsKey = JSON.stringify(topics);
  const analysisInput = useMemo(() => ({
    brandName,
    timeRange,
    score,
    trend,
    totalMentions,
    sentiment: {
      positive: sentiment.positive,
      neutral: sentiment.neutral,
      negative: sentiment.negative,
    },
    topics: JSON.parse(topicsKey),
  }), [brandName, score, sentiment.negative, sentiment.neutral, sentiment.positive, timeRange, topicsKey, totalMentions, trend]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAiState("loading");
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/dashboard/ai-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(analysisInput),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Dashboard AI request failed (${response.status})`);
        const result = await response.json() as DashboardAiAnalysis;
        if (!controller.signal.aborted) {
          setAiAnalysis(result);
          setAiState("ready");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Dashboard AI analysis unavailable:", error);
          setAiState("error");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [analysisInput, user]);

  const aiText = aiState === "loading"
    ? "AI đang phân tích dữ liệu mới nhất…"
    : aiAnalysis?.summary || fallbackAiText;
  const canExpandAiText = aiText.length > 220;
  const riskLevelLabels = {
    low: t("bm.hero.risk.low", "Thấp"),
    medium: t("bm.hero.risk.medium", "Trung bình"),
    high: t("bm.hero.risk.high", "Cao"),
  };
  const riskTrendLabels = {
    decreasing: t("bm.hero.risk.decreasing", "Đang giảm"),
    stable: t("bm.hero.risk.stable", "Ổn định"),
    increasing: t("bm.hero.risk.increasing", "Đang tăng"),
  };
  const riskLabel = aiAnalysis ? riskLevelLabels[aiAnalysis.riskLevel] : statusLabel;
  const riskTrendLabel = aiAnalysis
    ? riskTrendLabels[aiAnalysis.riskTrend]
    : isHealthy ? t("bm.hero.risk.stable") : isWarning ? t("bm.hero.risk.slightInc") : t("bm.hero.risk.high");

  return (
    <div className="bm-hero-row">
      {/* ── A. Brand Health Gauge ─────────────────────────────── */}
      <div className="bm-hero-card bm-hero-gauge" data-tour="dashboard-health-score">
        <div className="bm-card-header">
          <div className="bm-card-icon" style={{ background: "var(--color-brand-subtle)", color: "var(--color-brand)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
          </div>
          <div>
            <h2 className="bm-card-title">{t("bm.hero.healthScore", "Brand Health Score")}</h2>
            <p className="bm-card-sub">{t("bm.hero.healthScoreSub", "Tổng quan sức khỏe thương hiệu")}</p>
          </div>
        </div>

        {/* Gauge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8 }}>
          {/* Canvas only — no absolute overlay */}
          <GaugeChart score={score} />

          {/* Score label below canvas */}
          <div style={{
            textAlign: "center", marginTop: -8, lineHeight: 1,
            display: "flex", alignItems: "baseline", gap: "2px", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 42, fontWeight: 800,
              color: "var(--color-text-primary)",
            }}>
              {score}
            </span>
            <span style={{ fontSize: 15, color: "var(--color-text-muted)", fontWeight: 600 }}>
              /100
            </span>
          </div>

          {/* Status Badge + Trend */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{
              padding: "5px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 700,
              background: statusBg, color: statusColor,
              border: `1.5px solid ${statusColor}30`,
              letterSpacing: "0.05em",
            }}>
              {statusLabel}
            </span>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 13, fontWeight: 600,
              color: trend >= 0 ? "#22C55E" : "#EF4444",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {trend >= 0 ? "trending_up" : "trending_down"}
              </span>
              {trend >= 0 ? "+" : ""}{trend} {t("bm.hero.trendSuffix")}
            </div>
          </div>
        </div>

        {/* Gauge scale labels */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 8, padding: "0 16px",
        }}>
          {[t("bm.hero.status.danger"), t("bm.hero.status.warning"), t("bm.hero.status.good")].map((l, i) => (
            <span key={l} style={{
              fontSize: 11, fontWeight: 600,
              color: i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "#22C55E",
            }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* ── B. Sentiment Donut ────────────────────────────────── */}
      <div className="bm-hero-card bm-hero-sentiment" data-tour="dashboard-sentiment">
        <div className="bm-card-header">
          <div className="bm-card-icon" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              donut_large
            </span>
          </div>
          <div>
            <h2 className="bm-card-title">{t("bm.hero.sentimentRatio")}</h2>
            <p className="bm-card-sub">{t("bm.hero.sentimentRatioSub", "Tỷ lệ cảm xúc")}</p>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <SentimentDonut
            positive={sentiment.positive}
            neutral={sentiment.neutral}
            negative={sentiment.negative}
            total={totalMentions}
          />
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          {onViewDetail ? (
            <button type="button" onClick={onViewDetail} id="bm-hero-sentiment-link" style={{ border: 0, background: "transparent", color: "#6366F1", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Xem phân tích chi tiết <span aria-hidden="true">→</span>
            </button>
          ) : (
            <Link href="/mentions" id="bm-hero-sentiment-link" style={{ color: "#6366F1", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Xem phân tích chi tiết <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── C. AI Insight ─────────────────────────────────────── */}
      <div className="bm-hero-card bm-hero-insight" data-tour="dashboard-ai-insight">
        <div className="bm-card-header">
          <div className="bm-card-icon" style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              psychology
            </span>
          </div>
          <div>
            <h2 className="bm-card-title">{t("bm.hero.aiAnalysis")}</h2>
            <p className="bm-card-sub">{t("bm.hero.aiSub")}</p>
          </div>
        </div>

        {/* AI insight box */}
        <div className="bm-ai-insight-box">
          <span className="material-symbols-outlined bm-ai-bg-icon">auto_awesome</span>

          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: statusColor,
              animation: "bm-pulse 2s infinite",
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("bm.hero.riskLevel")}: {riskLabel}
            </span>
          </div>

          <p className="bm-ai-text">“{aiText}”</p>
          {canExpandAiText && (
            <button
              type="button"
              className="bm-ai-read-more"
              onClick={() => setShowAiDetail(true)}
            >
              Xem thêm
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_full</span>
            </button>
          )}

          <div className="bm-ai-metrics">
            <div className="bm-ai-metric" title={aiState === "error" ? "Đang hiển thị nhận định dự phòng vì AI tạm thời không khả dụng" : undefined}>
              <span className="bm-ai-metric-val" style={{ color: "#6366F1" }}>
                {aiState === "loading" ? "…" : `${aiAnalysis?.confidence ?? Math.min(95, Math.max(35, Math.round(totalMentions / 2)))}%`}
              </span>
              <span className="bm-ai-metric-label">{t("bm.hero.aiTrust")}</span>
            </div>
            <div className="bm-ai-metric-sep" />
            <div className="bm-ai-metric" title={aiState === "error" ? "Đang hiển thị nhận định dự phòng vì AI tạm thời không khả dụng" : undefined}>
              <span className="bm-ai-metric-val" style={{ color: statusColor }}>
                {aiState === "loading" ? "…" : riskTrendLabel}
              </span>
              <span className="bm-ai-metric-label">{t("bm.hero.riskTrend")}</span>
            </div>
          </div>

        </div>

        {/* 7-day mini sparkline */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {t("bm.hero.7dTrend")}
          </p>
          <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="bm-spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={statusColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={statusColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={sparkPath?.area ?? "M0,35 L200,35 L200,40 L0,40 Z"}
              fill="url(#bm-spark-grad)"
              stroke="none"
            />
            <path
              d={sparkPath?.line ?? "M0,35 L200,35"}
              fill="none"
              stroke={statusColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {showAiDetail && (
        <div
          className="bm-ai-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bm-ai-modal-title"
          onClick={() => setShowAiDetail(false)}
        >
          <div className="bm-ai-modal" onClick={(event) => event.stopPropagation()}>
            <div className="bm-ai-modal-header">
              <div>
                <p className="bm-ai-modal-eyebrow">Phân tích AI</p>
                <h3 id="bm-ai-modal-title">Nhận định chi tiết</h3>
              </div>
              <button type="button" className="bm-ai-modal-close" aria-label="Đóng" onClick={() => setShowAiDetail(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="bm-ai-modal-text">“{aiText}”</p>
            <div className="bm-ai-modal-footer">
              <span>{t("bm.hero.aiTrust")}: {aiAnalysis?.confidence ?? "—"}%</span>
              <button type="button" className="bm-ai-modal-done" onClick={() => setShowAiDetail(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .bm-hero-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .bm-hero-row { grid-template-columns: 1fr 1fr; }
          .bm-hero-insight { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .bm-hero-row { grid-template-columns: 1fr; }
          .bm-hero-insight { grid-column: auto; }
        }

        .bm-hero-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme), transform 0.2s ease, box-shadow 0.2s ease;
          position: relative; overflow: hidden;
          align-self: start;
          height: fit-content;
        }
        .bm-hero-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-card-hover);
        }

        .bm-card-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 4px;
        }
        .bm-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-card-title {
          font-size: 15px; font-weight: 700;
          color: var(--color-text-primary); margin: 0; line-height: 1.2;
        }
        .bm-card-sub {
          font-size: 11px; color: var(--color-text-muted);
          margin: 0; font-weight: 500;
        }

        /* AI Insight */
        .bm-ai-read-more {
          display: inline-flex; align-items: center; gap: 4px;
          margin: -5px 0 12px; padding: 0; border: 0; background: transparent;
          color: var(--color-brand); font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .bm-ai-read-more:hover { text-decoration: underline; }
        .bm-ai-modal-backdrop {
          position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 20px; background: rgba(15, 23, 42, 0.42);
        }
        .bm-ai-modal {
          width: min(620px, 100%); max-height: min(680px, 90vh); overflow: auto;
          border: 1px solid var(--color-border); border-radius: 18px; padding: 24px;
          background: var(--color-bg-surface); box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
        }
        .bm-ai-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .bm-ai-modal-eyebrow { margin: 0 0 4px; color: var(--color-brand); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
        .bm-ai-modal h3 { margin: 0; color: var(--color-text-primary); font-size: 20px; font-weight: 800; }
        .bm-ai-modal-close { display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 9px; color: var(--color-text-secondary); background: var(--color-bg-surface-raised); cursor: pointer; }
        .bm-ai-modal-close:hover { color: var(--color-text-primary); }
        .bm-ai-modal-text { margin: 24px 0; color: var(--color-text-primary); font-size: 15px; line-height: 1.75; font-style: italic; white-space: pre-wrap; }
        .bm-ai-modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--color-text-muted); font-size: 12px; font-weight: 600; }
        .bm-ai-modal-done { border: 0; border-radius: 8px; padding: 8px 14px; color: #fff; background: var(--color-brand); font-size: 12px; font-weight: 700; cursor: pointer; }        .bm-ai-insight-box {
          margin-top: 16px;
          background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.04));
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 14px;
          padding: 16px;
          position: relative; overflow: hidden;
        }
        .dark .bm-ai-insight-box {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.2);
        }
        .bm-ai-bg-icon {
          position: absolute; right: 12px; top: 12px;
          font-size: 40px !important;
          color: rgba(139,92,246,0.12);
          user-select: none;
        }
        .bm-ai-text {
          font-size: 13.5px; line-height: 1.65;
          color: var(--color-text-primary); font-weight: 500;
          margin: 0 0 14px; position: relative; z-index: 1;
          font-style: italic;
           display: -webkit-box;
           -webkit-box-orient: vertical;
           -webkit-line-clamp: 5;
           overflow: hidden;
        }
        .bm-ai-metrics {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
        }
        .bm-ai-metric { display: flex; flex-direction: column; gap: 2px; }
        .bm-ai-metric-val { font-size: 16px; font-weight: 800; line-height: 1; }
        .bm-ai-metric-label { font-size: 11px; color: var(--color-text-muted); font-weight: 500; }
        .bm-ai-metric-sep { width: 1px; height: 30px; background: var(--color-border); }
        .bm-ai-cta {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          background: var(--color-brand); color: #fff;
          font-size: 13px; font-weight: 600; text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .bm-ai-cta:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
