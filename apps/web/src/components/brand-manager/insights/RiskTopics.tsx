"use client";

import React from "react";
import type { CrisisSignal } from "./insightEngine";

interface RiskTopicsProps {
  signals: CrisisSignal[];
}

function getRiskLevel(severity: string): { label: string; color: string; bar: string; badge: string } {
  switch (severity) {
    case "critical": return { label: "Rất cao",    color: "#b91c1c", bar: "bg-red-700",    badge: "bg-red-100 text-red-800" };
    case "high":     return { label: "Cao",         color: "#ef4444", bar: "bg-red-500",    badge: "bg-red-100 text-red-700" };
    case "medium":   return { label: "Trung bình",  color: "#f97316", bar: "bg-orange-500", badge: "bg-orange-100 text-orange-700" };
    default:         return { label: "Thấp",        color: "#eab308", bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700" };
  }
}

// Severity → bar width %
const SEV_WIDTH: Record<string, number> = { critical: 100, high: 75, medium: 50, low: 25 };

export function RiskTopics({ signals }: RiskTopicsProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">🎯 Chủ đề có nguy cơ trở thành khủng hoảng</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Mức độ nguy cơ theo thang: Thấp → Trung bình → Cao → Rất cao</p>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center py-7 text-center">
          <span className="text-2xl mb-2">🎉</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có chủ đề nào có nguy cơ trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((sig, i) => {
            const risk = getRiskLevel(sig.severity);
            const barW = SEV_WIDTH[sig.severity] || 20;
            return (
              <div key={sig.topic + i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate max-w-[60%]">
                    {sig.label}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${risk.badge}`}>
                    Nguy cơ {risk.label}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--color-bg-surface-raised)] overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${risk.bar}`}
                    style={{ width: `${barW}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
