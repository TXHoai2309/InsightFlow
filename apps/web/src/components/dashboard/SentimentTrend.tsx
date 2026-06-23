"use client";

/**
 * SentimentTrend Component
 * Hiển thị biểu đồ xu hướng cảm xúc từ dữ liệu thật (không random).
 * - Nhận filteredMentions từ props (đã qua filter workspace/platform/time)
 * - Hiển thị theo ngày ĐĂNG bài (posted_at), không phải ngày cào (crawled_at)
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

interface SentimentTrendProps {
  /** Danh sách mentions đã được filter (workspace, platform, time) */
  filteredMentions: Mention[];
}

export function SentimentTrend({ filteredMentions }: SentimentTrendProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  // Chỉ lấy time_range từ store để xác định granularity (giờ / ngày)
  const timeRange = useDashboardStore((s) => s.filters.time_range);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    // Tính trend data từ filtered mentions (dùng posted_at trong service)
    const trendData = DashboardService.calculateSentimentTrend(filteredMentions, timeRange);

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels: trendData.map((d) => d.date),
        datasets: [
          {
            label: "Tích cực",
            data: trendData.map((d) => d.positive),
            borderColor: "#4648d4",
            backgroundColor: "rgba(70,72,212,0.1)",
            tension: 0.3,
            fill: true,
            borderWidth: 2,
            pointRadius: trendData.length > 15 ? 2 : 4,
          },
          {
            label: "Tiêu cực",
            data: trendData.map((d) => d.negative),
            borderColor: "#ba1a1a",
            backgroundColor: "rgba(186,26,26,0.05)",
            tension: 0.3,
            fill: true,
            borderWidth: 2,
            pointRadius: trendData.length > 15 ? 2 : 4,
          },
          {
            label: "Trung lập",
            data: trendData.map((d) => d.neutral),
            borderColor: "#c7c4d7",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: trendData.length > 15 ? 2 : 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Ngày đăng: ${items[0]?.label}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
          x: {
            ticks: {
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [filteredMentions, timeRange]);

  // Tính tổng để hiển thị badge
  const trend = DashboardService.calculateSentimentTrend(filteredMentions, timeRange);
  const totalInPeriod = trend.reduce(
    (acc, d) => ({
      positive: acc.positive + d.positive,
      negative: acc.negative + d.negative,
      neutral: acc.neutral + d.neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 }
  );

  return (
    <div className="bg-white border border-outline-variant rounded-lg p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-lg text-on-surface">Xu hướng cảm xúc</h4>
        <span className="text-xs text-on-surface-variant">
          {timeRange === "all"
            ? "Toàn bộ thời gian"
            : timeRange === "24h"
            ? "24 giờ qua"
            : timeRange === "7d"
            ? "7 ngày qua"
            : "30 ngày qua"}
          {" · theo ngày đăng bài"}
        </span>
      </div>

      <div style={{ position: "relative", height: "280px" }}>
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-4 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>
            Tích cực <span className="font-bold">{totalInPeriod.positive}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error" />
          <span>
            Tiêu cực <span className="font-bold">{totalInPeriod.negative}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#c7c4d7" }} />
          <span>
            Trung lập <span className="font-bold">{totalInPeriod.neutral}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
