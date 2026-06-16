"use client";

/**
 * US-13: SentimentDonut Component
 * Hiển thị biểu đồ tròn cơ cấu cảm xúc (Positive/Neutral/Negative)
 */

import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";

// Register ChartJS components (include controller for doughnut)
ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend);

interface SentimentDonutProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentDonut({
  positive,
  neutral,
  negative,
}: SentimentDonutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart before creating new one
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartJS(ctx, {
      type: "doughnut",
      data: {
        labels: ["Tích cực", "Trung lập", "Tiêu cực"],
        datasets: [
          {
            data: [positive, neutral, negative],
            backgroundColor: ["#4648d4", "#c7c4d7", "#ba1a1a"],
            borderWidth: 0,
            borderRadius: 0,
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
        cutout: "70%",
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [positive, neutral, negative]);

  return (
    <div className="bg-white border border-outline-variant rounded-lg p-6 shadow-sm h-full">
      <h4 className="font-bold text-lg text-on-surface mb-4">Cơ cấu cảm xúc</h4>
      <div style={{ position: "relative", height: "300px" }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Tích cực ({positive})</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#c7c4d7" }}
          ></div>
          <span>Trung lập ({neutral})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <span>Tiêu cực ({negative})</span>
        </div>
      </div>
    </div>
  );
}
