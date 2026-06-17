"use client";

/**
 * US-13: SentimentTrend Component
 * Hiển thị biểu đồ xu hướng cảm xúc theo ngày (7 ngày qua)
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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface SentimentTrendProps {
  timeRange: "24h" | "7d" | "30d";
}

interface TrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

export function SentimentTrend({ timeRange }: SentimentTrendProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  // Mock data generation based on time range
  const generateTrendData = (): TrendData[] => {
    const days = timeRange === "24h" ? 6 : timeRange === "7d" ? 6 : 29;
    const data: TrendData[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        positive: Math.floor(Math.random() * 30) + 10,
        negative: Math.floor(Math.random() * 20) + 5,
        neutral: Math.floor(Math.random() * 25) + 8,
      });
    }

    return data;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart before creating new one
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const trendData = generateTrendData();
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
          },
          {
            label: "Tiêu cực",
            data: trendData.map((d) => d.negative),
            borderColor: "#ba1a1a",
            backgroundColor: "rgba(186,26,26,0.05)",
            tension: 0.3,
            fill: true,
            borderWidth: 2,
          },
          {
            label: "Trung lập",
            data: trendData.map((d) => d.neutral),
            borderColor: "#c7c4d7",
            tension: 0.3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [timeRange]);

  return (
    <div className="bg-white border border-outline-variant rounded-lg p-6 shadow-sm h-full">
      <h4 className="font-bold text-lg text-on-surface mb-4">
        Xu hướng cảm xúc
      </h4>
      <div style={{ position: "relative", height: "300px" }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Tích cực</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <span>Tiêu cực</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#c7c4d7" }}
          ></div>
          <span>Trung lập</span>
        </div>
      </div>
    </div>
  );
}
