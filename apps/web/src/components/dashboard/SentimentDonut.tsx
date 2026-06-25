"use client";

/**
 * US-13: SentimentDonut Component
 * Biểu đồ tròn cơ cấu cảm xúc — hỗ trợ Dark Mode.
 * Màu sắc tự động chuyển sang Pastel Neon khi dark mode.
 */

import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
import { useTheme } from "@/contexts/ThemeContext";

ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend);

interface SentimentDonutProps {
  positive: number;
  neutral: number;
  negative: number;
}

/* ── Chart color palettes ───────────────────────────────────── */
const CHART_COLORS = {
  light: {
    positive: "#4648d4",
    neutral: "#c7c4d7",
    negative: "#ba1a1a",
  },
  dark: {
    positive: "#818cf8",   /* Indigo pastel — dịu mắt trên nền tối */
    neutral: "#94a3b8",    /* Slate */
    negative: "#f87171",   /* Red pastel */
  },
};

export function SentimentDonut({
  positive,
  neutral,
  negative,
}: SentimentDonutProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartJS(ctx, {
      type: "doughnut",
      data: {
        labels: [t("dashboard.sentimentDonut.positive"), t("dashboard.sentimentDonut.neutral"), t("dashboard.sentimentDonut.negative")],
        datasets: [
          {
            data: [positive, neutral, negative],
            backgroundColor: [colors.positive, colors.neutral, colors.negative],
            borderWidth: 0,
            borderRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#252530" : "#ffffff",
            titleColor: isDark ? "#e4e6eb" : "#111c2d",
            bodyColor: isDark ? "#a0a0b8" : "#4a4a6a",
            borderColor: isDark ? "#2e2e3a" : "#e2e4f0",
            borderWidth: 1,
            cornerRadius: 8,
          },
        },
        cutout: "70%",
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [positive, neutral, negative, theme]);

  return (
    <div
      className="rounded-lg p-6 shadow-sm h-full"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h4 className="font-bold text-lg mb-4" style={{ color: "var(--color-text-primary)" }}>
        {t("dashboard.sentimentDonut.title")}
      </h4>
      <div style={{ position: "relative", height: "300px" }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.positive }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>
            {t("dashboard.sentimentDonut.positive")} ({positive})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.neutral }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>
            {t("dashboard.sentimentDonut.neutral")} ({neutral})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.negative }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>
            {t("dashboard.sentimentDonut.negative")} ({negative})
          </span>
        </div>
      </div>
    </div>
  );
}
