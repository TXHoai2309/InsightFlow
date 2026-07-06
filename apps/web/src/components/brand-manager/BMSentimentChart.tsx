"use client";

/**
 * BMSentimentChart — Biểu đồ xu hướng Mentions & Sentiment theo thời gian
 * Area chart với 3 series: positive, negative, neutral.
 * Hỗ trợ Dark/Light mode.
 */

import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DashboardService } from "@/lib/services/dashboard";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import type { Mention } from "@/types/dashboard";

ChartJS.register(
  CategoryScale, LinearScale, LineController, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
);

const PALETTE = {
  light: {
    positive: { line: "#22C55E", fill: "rgba(34,197,94,0.10)" },
    negative: { line: "#EF4444", fill: "rgba(239,68,68,0.08)" },
    neutral:  { line: "#94A3B8", fill: "rgba(148,163,184,0.07)" },
    grid:     "rgba(0,0,0,0.05)",
    tick:     "#94A3B8",
    ttBg:     "#fff",
    ttTitle:  "#111C2D",
    ttBody:   "#4A4A6A",
    ttBorder: "#E2E4F0",
  },
  dark: {
    positive: { line: "#4ADE80", fill: "rgba(74,222,128,0.12)" },
    negative: { line: "#F87171", fill: "rgba(248,113,113,0.10)" },
    neutral:  { line: "#94A3B8", fill: "rgba(148,163,184,0.08)" },
    grid:     "rgba(255,255,255,0.06)",
    tick:     "#6E6E88",
    ttBg:     "#252530",
    ttTitle:  "#E4E6EB",
    ttBody:   "#A0A0B8",
    ttBorder: "#2E2E3A",
  },
};

interface BMSentimentChartProps {
  filteredMentions: Mention[];
}

export function BMSentimentChart({ filteredMentions }: BMSentimentChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<ChartJS | null>(null);
  const timeRange = useDashboardStore((s) => s.filters.time_range);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const p = isDark ? PALETTE.dark : PALETTE.light;

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const trendData = DashboardService.calculateSentimentTrend(filteredMentions, timeRange);
    const totalByDay = trendData.map((d) => d.positive + d.negative + d.neutral);
    const maxTotal = Math.max(...totalByDay, 1);

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels: trendData.map((d) => d.date),
        datasets: [
          {
            label: t("bm.hero.positive"),
            data: trendData.map((d) => d.positive),
            borderColor: p.positive.line,
            backgroundColor: p.positive.fill,
            tension: 0.4, fill: true, borderWidth: 2.5,
            pointRadius: trendData.length > 20 ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: p.positive.line,
            pointBorderColor: isDark ? "#0A0612" : "#fff",
            pointBorderWidth: 2,
          },
          {
            label: t("bm.hero.negative"),
            data: trendData.map((d) => d.negative),
            borderColor: p.negative.line,
            backgroundColor: p.negative.fill,
            tension: 0.4, fill: true, borderWidth: 2.5,
            pointRadius: trendData.length > 20 ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: p.negative.line,
            pointBorderColor: isDark ? "#0A0612" : "#fff",
            pointBorderWidth: 2,
          },
          {
            label: t("bm.hero.neutral"),
            data: trendData.map((d) => d.neutral),
            borderColor: p.neutral.line,
            backgroundColor: p.neutral.fill,
            tension: 0.4, fill: true, borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: p.ttBg,
            titleColor: p.ttTitle,
            bodyColor: p.ttBody,
            borderColor: p.ttBorder,
            borderWidth: 1,
            cornerRadius: 10,
            padding: 12,
            callbacks: {
              title: (items) => `📅 ${items[0]?.label}`,
              afterBody: (items) => {
                const total = items.reduce((s, i) => s + (i.parsed.y || 0), 0);
                return `${t("bm.chart.total") || "Tổng:"} ${total} ${t("bm.hero.mentionsCount") || "đề cập"}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: p.tick, font: { size: 11 } },
            grid: { color: p.grid },
            border: { color: "transparent" },
          },
          x: {
            ticks: {
              maxRotation: 35,
              autoSkip: true,
              maxTicksLimit: 14,
              color: p.tick,
              font: { size: 11 },
            },
            grid: { display: false },
            border: { color: "transparent" },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [filteredMentions, timeRange, theme]);

  // Legend totals
  const trend = DashboardService.calculateSentimentTrend(filteredMentions, timeRange);
  const totals = trend.reduce(
    (acc, d) => ({
      positive: acc.positive + d.positive,
      negative: acc.negative + d.negative,
      neutral:  acc.neutral  + d.neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 }
  );

  const rangeLabel =
    timeRange === "all" ? t("time.all") :
    timeRange === "24h" ? t("time.today") :
    timeRange === "7d"  ? t("time.7d") : t("time.30d");

  return (
    <div className="bm-chart-card">
      {/* Header */}
      <div className="bm-chart-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(99,102,241,0.1)",
            color: "#6366F1",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              area_chart
            </span>
          </div>
          <div>
            <h3 className="bm-chart-title">{t("bm.chart.title") || "Xu hướng Mentions & Sentiment"}</h3>
            <p className="bm-chart-sub">{rangeLabel} · {t("bm.chart.byDate") || "theo ngày đăng"}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="bm-chart-legend">
          {[
            { color: p.positive.line, label: t("bm.hero.positive"), count: totals.positive },
            { color: p.negative.line, label: t("bm.hero.negative"), count: totals.negative },
            { color: p.neutral.line,  label: t("bm.hero.neutral"), count: totals.neutral, dash: true },
          ].map(({ color, label, count, dash }) => (
            <div key={label} className="bm-legend-item">
              <svg width="24" height="3">
                <line
                  x1="0" y1="1.5" x2="24" y2="1.5"
                  stroke={color} strokeWidth="2.5"
                  strokeDasharray={dash ? "4 3" : "none"}
                  strokeLinecap="round"
                />
              </svg>
              <span className="bm-legend-label">{label}</span>
              <span className="bm-legend-count">{count.toLocaleString("vi-VN")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative", height: 300 }}>
        <canvas ref={canvasRef} />
      </div>

      <style>{`
        .bm-chart-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px; padding: 24px;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme);
          height: 100%;
        }
        .bm-chart-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; flex-wrap: wrap;
          gap: 12px; margin-bottom: 20px;
        }
        .bm-chart-title {
          font-size: 15px; font-weight: 700;
          color: var(--color-text-primary); margin: 0; line-height: 1.2;
        }
        .bm-chart-sub {
          font-size: 11px; color: var(--color-text-muted);
          margin: 0; font-weight: 500;
        }
        .bm-chart-legend {
          display: flex; flex-wrap: wrap; gap: 14px; align-items: center;
        }
        .bm-legend-item {
          display: flex; align-items: center; gap: 6px;
        }
        .bm-legend-label {
          font-size: 12px; color: var(--color-text-secondary); font-weight: 500;
        }
        .bm-legend-count {
          font-size: 12px; font-weight: 700; color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}
