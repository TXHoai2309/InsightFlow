"use client";

import React from "react";
import type { CrisisSignal } from "./insightEngine";

interface RiskForecastProps {
  signals: CrisisSignal[];
}

// Heuristic: 7-day risk forecast from severity + deltaPercent
function calcRiskForecast(sig: CrisisSignal): number {
  const base = sig.severity === "critical" ? 80 : sig.severity === "high" ? 60 : sig.severity === "medium" ? 38 : 18;
  const boost = Math.min(sig.deltaPercent, 400) / 400 * 20;
  return Math.min(99, Math.round(base + boost));
}

export function RiskForecast({ signals }: RiskForecastProps) {
  const items = signals.slice(0, 5);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">🔮 Dự báo nguy cơ</h3>
        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Dự báo 7 ngày tới</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
        Xác suất chủ đề leo thang thành khủng hoảng (heuristic tạm, dễ thay bằng model ML)
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-2xl mb-2">✅</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Không có rủi ro nào được dự báo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((sig, i) => {
            const score = calcRiskForecast(sig);
            const color = score >= 70 ? "#ef4444" : score >= 45 ? "#f97316" : "#eab308";
            const label = score >= 70 ? "Đáng lo ngại" : score >= 45 ? "Cần chú ý" : "Theo dõi";
            return (
              <div key={sig.topic + i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate max-w-[62%]">{sig.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
                    <span className="text-[13px] font-black" style={{ color }}>{score}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-bg-surface-raised)] overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
