"use client";

/**
 * SentimentTrend Component
 * Biểu đồ xu hướng cảm xúc — hỗ trợ Dark Mode với grid/ticks thích nghi.
 */

import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
import type { Mention } from "@/types/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
ChartJS.defaults.font.family = 'Inter, "Segoe UI", Arial, sans-serif';

interface SentimentTrendProps {
  filteredMentions: Mention[];
}

/* ── Chart color palettes ───────────────────────────────────── */
const PALETTE = {
  light: {
    positive:    { line: "#4648d4", fill: "rgba(70,72,212,0.10)" },
    negative:    { line: "#ba1a1a", fill: "rgba(186,26,26,0.05)" },
    neutral:     { line: "#c7c4d7", fill: "rgba(199,196,215,0.10)" },
    gridColor:   "rgba(0,0,0,0.06)",
    tickColor:   "#9898b0",
    tooltipBg:   "#ffffff",
    tooltipTitle:"#111c2d",
    tooltipBody: "#4a4a6a",
    tooltipBorder:"#e2e4f0",
  },
  dark: {
    positive:    { line: "#818cf8", fill: "rgba(129,140,248,0.15)" },
    negative:    { line: "#f87171", fill: "rgba(248,113,113,0.10)" },
    neutral:     { line: "#94a3b8", fill: "rgba(148,163,184,0.12)" },
    gridColor:   "rgba(255,255,255,0.07)",
    tickColor:   "#6e6e88",
    tooltipBg:   "#252530",
    tooltipTitle:"#e4e6eb",
    tooltipBody: "#a0a0b8",
    tooltipBorder:"#2e2e3a",
  },
};

export function SentimentTrend({ filteredMentions }: SentimentTrendProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const timeRange = useDashboardStore((s) => s.filters.time_range);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const p = isDark ? PALETTE.dark : PALETTE.light;

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const trendData = DashboardService.calculateSentimentTrend(filteredMentions, timeRange);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels: trendData.map((d) => d.date),
        datasets: [
          {
            label: t("dashboard.filters.positive"),
            data: trendData.map((d) => d.positive),
            borderColor: p.positive.line,
            backgroundColor: p.positive.fill,
            tension: 0.3,
            fill: true,
            borderWidth: 2,
            pointRadius: trendData.length > 15 ? 2 : 4,
            pointBackgroundColor: p.positive.line,
          },
          {
            label: t("dashboard.filters.negative"),
            data: trendData.map((d) => d.negative),
            borderColor: p.negative.line,
            backgroundColor: p.negative.fill,
            tension: 0.3,
            fill: true,
            borderWidth: 2,
            pointRadius: trendData.length > 15 ? 2 : 4,
            pointBackgroundColor: p.negative.line,
          },
          {
            label: t("dashboard.filters.neutral"),
            data: trendData.map((d) => d.neutral),
            borderColor: p.neutral.line,
            backgroundColor: p.neutral.fill,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: trendData.length > 15 ? 2 : 4,
            pointBackgroundColor: p.neutral.line,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: p.tooltipBg,
            titleColor: p.tooltipTitle,
            bodyColor: p.tooltipBody,
            borderColor: p.tooltipBorder,
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: (items) => `${t("dashboard.sentimentTrend.postedDate")}: ${items[0]?.label}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: p.tickColor,
            },
            grid: {
              color: p.gridColor,
            },
            border: {
              color: p.gridColor,
            },
          },
          x: {
            ticks: {
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
              color: p.tickColor,
            },
            grid: {
              color: p.gridColor,
            },
            border: {
              color: p.gridColor,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [filteredMentions, timeRange, theme]);

  const trend = DashboardService.calculateSentimentTrend(filteredMentions, timeRange);
  const totalInPeriod = trend.reduce(
    (acc, d) => ({
      positive: acc.positive + d.positive,
      negative: acc.negative + d.negative,
      neutral: acc.neutral + d.neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 }
  );

  const pal = isDark ? PALETTE.dark : PALETTE.light;

  const getRangeLabel = () => {
    switch (timeRange) {
      case "all": return t("dashboard.sentimentTrend.allTime") || "Toàn thời gian";
      case "24h": return t("dashboard.sentimentTrend.24h") || "24 giờ qua";
      case "2d": return "2 ngày qua";
      case "3d": return "3 ngày qua";
      case "5d": return "5 ngày qua";
      case "7d": return t("dashboard.sentimentTrend.7d") || "7 ngày qua";
      case "30d": return t("dashboard.sentimentTrend.30d") || "30 ngày qua";
      case "custom": return "Tùy chỉnh";
      default: return t("dashboard.sentimentTrend.30d") || "30 ngày qua";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {getRangeLabel()}
          {` · ${t("dashboard.sentimentTrend.byPostDate")}`}
        </span>
      </div>

      <div style={{ position: "relative", height: "280px" }}>
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-4 flex justify-center gap-6 text-xs">
        {[
          { color: pal.positive.line, label: t("dashboard.filters.positive"), count: totalInPeriod.positive },
          { color: pal.negative.line, label: t("dashboard.filters.negative"), count: totalInPeriod.negative },
          { color: pal.neutral.line, label: t("dashboard.filters.neutral"), count: totalInPeriod.neutral },
        ].map(({ color, label, count }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span style={{ color: "var(--color-text-secondary)" }}>
              {label} <span className="font-bold">{count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
