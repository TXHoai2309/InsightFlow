"use client";

import React from "react";
import type { CrisisSignal } from "./insightEngine";

interface SpreadLikelihoodProps {
  signals: CrisisSignal[];
}

// Heuristic: spread score từ severity + deltaPercent
function calcSpread(sig: CrisisSignal): number {
  const base = sig.severity === "critical" ? 85 : sig.severity === "high" ? 65 : sig.severity === "medium" ? 42 : 20;
  const boost = Math.min(sig.deltaPercent, 400) / 400 * 15;
  return Math.min(99, Math.round(base + boost));
}

export function SpreadLikelihood({ signals }: SpreadLikelihoodProps) {
  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-4">📡 Mức độ lan truyền tiêu cực</h3>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-2xl mb-2">✅</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Không có rủi ro lan truyền nào được phát hiện</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">📡 Mức độ lan truyền tiêu cực</h3>
        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Khả năng lan truyền</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Xác suất nội dung tiêu cực về chủ đề này tiếp tục lan rộng</p>
      <div className="space-y-4">
        {signals.map((sig, i) => {
          const spread = calcSpread(sig);
          const color = spread >= 70 ? "#ef4444" : spread >= 45 ? "#f97316" : "#eab308";
          return (
            <div key={sig.topic + i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate max-w-[65%]">{sig.label}</span>
                <span className="text-[13px] font-black" style={{ color }}>{spread}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-bg-surface-raised)] overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${spread}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
