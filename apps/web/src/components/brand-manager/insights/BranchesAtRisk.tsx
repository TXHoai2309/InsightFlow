"use client";

import React from "react";

export interface VenueRisk {
  name: string;
  negCount: number;
  totalCount: number;
  negRatio: number;   // ratio vs system average (e.g. 1.8 = cao hơn 1.8×)
}

interface BranchesAtRiskProps {
  venues: VenueRisk[];
  systemAvgNegRatio: number; // 0–1
}

export function BranchesAtRisk({ venues, systemAvgNegRatio }: BranchesAtRiskProps) {
  const atRisk = venues
    .filter(v => v.negRatio > 1.2 && v.totalCount >= 3)
    .sort((a, b) => b.negRatio - a.negRatio)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">📍 Chi nhánh có rủi ro cao</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
        Tỉ lệ phản hồi tiêu cực cao hơn mức trung bình hệ thống ({Math.round(systemAvgNegRatio * 100)}%)
      </p>

      {atRisk.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-2xl mb-2">✅</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Mọi chi nhánh đang trong ngưỡng bình thường</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {atRisk.map((v, i) => {
            const isHigh = v.negRatio >= 2.0;
            const labelColor = isHigh ? "text-red-600" : "text-orange-500";
            const badgeClass = isHigh ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700";
            return (
              <li key={v.name} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{v.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className={`text-[12px] ${labelColor} font-bold`}>
                    {v.negRatio.toFixed(1)}× trung bình
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {isHigh ? "Rất cao" : "Cao"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
