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
ChartJS.defaults.font.family = 'Inter, "Segoe UI", Arial, sans-serif';

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
  totalMentions = 0,
}: SentimentDonutProps & { totalMentions?: number }) {
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
            backgroundColor: ["#38A169", "#A0AEC0", "#E53E3E"], // Match screenshot (Green, Gray, Red)
            borderWidth: 0,
            borderRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
        cutout: "75%",
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [positive, neutral, negative, theme]);

  const total = positive + neutral + negative;
  const getPercentage = (val: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <div className="bg-white dark:bg-[#1a1b1e] p-5 md:p-6 rounded-[16px] border border-[var(--color-border)] shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-[15px] text-[#2A2B2F] dark:text-white mb-6">{t("dashboard.sentimentDonut.title", "Tỷ Lệ Sắc Thái")}</h3>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <canvas ref={canvasRef}></canvas>
          {/* Text inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[28px] font-bold text-[#2A2B2F] dark:text-white leading-none mb-1">
              {totalMentions.toLocaleString("vi-VN")}
            </span>
            <span className="text-[12px] font-medium text-[#718096] dark:text-[#A0AEC0]">
              {t("dashboard.sentimentDonut.totalMentions", "Tổng đề cập")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#38A169]"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#4A5568] dark:text-[#E2E8F0]">{t("dashboard.sentimentDonut.positive", "Tích cực")}</span>
              <span className="text-[12px] text-[#718096] dark:text-[#A0AEC0]">{getPercentage(positive)}% ({positive.toLocaleString("vi-VN")})</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#E53E3E]"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#4A5568] dark:text-[#E2E8F0]">{t("dashboard.sentimentDonut.negative", "Tiêu cực")}</span>
              <span className="text-[12px] text-[#718096] dark:text-[#A0AEC0]">{getPercentage(negative)}% ({negative.toLocaleString("vi-VN")})</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#A0AEC0]"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#4A5568] dark:text-[#E2E8F0]">{t("dashboard.sentimentDonut.neutral", "Trung lập")}</span>
              <span className="text-[12px] text-[#718096] dark:text-[#A0AEC0]">{getPercentage(neutral)}% ({neutral.toLocaleString("vi-VN")})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <a href="#" className="text-[13px] font-semibold text-[#6D5FFD] hover:underline flex items-center justify-center gap-1">
          {t("dashboard.sentimentDonut.viewDetail", "Xem chi tiết phân tích")} &rarr;
        </a>
      </div>
    </div>
  );
}
