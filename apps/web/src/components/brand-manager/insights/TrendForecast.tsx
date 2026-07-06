"use client";

import React from "react";
import type { TopicDelta } from "./insightEngine";

interface TrendForecastProps {
  opportunities: TopicDelta[];
}

export function TrendForecast({ opportunities }: TrendForecastProps) {
  const items = opportunities.slice(0, 5);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>🤖</span> AI dự báo xu hướng
        </h3>
        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Dự báo 7 ngày tới</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
        Khả năng tiếp tục tăng (heuristic từ tốc độ tăng + tỉ lệ tích cực)
      </p>

      {items.length === 0 ? (
        <div className="py-6 text-center">
          <span className="text-2xl block mb-2">🔮</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa đủ dữ liệu để dự báo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(d => {
            const score = d.forecastScore;
            const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#94a3b8";
            return (
              <div key={d.topic}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate max-w-[70%]">{d.label}</span>
                  <span className="text-[13px] font-black" style={{ color }}>{score}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--color-bg-surface-raised)] overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: color }}
                  />
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  {score >= 75 ? "Khả năng cao sẽ tiếp tục tăng" : score >= 50 ? "Có thể duy trì" : "Không chắc chắn"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
