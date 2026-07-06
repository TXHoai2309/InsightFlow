"use client";

import React from "react";
import type { InsightSummary } from "./generateInsightSummary";

interface AIInsightBannerProps {
  summary: InsightSummary;
  oppCount: number;
  riskCount: number;
}

export function AIInsightBanner({ summary, oppCount, riskCount }: AIInsightBannerProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-brand)]/20 bg-gradient-to-r from-slate-50 via-white to-purple-50 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[var(--color-brand)] flex items-center justify-center text-white text-[22px] shrink-0 shadow-md">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">AI Insight</h2>
            <div className="flex items-center gap-2">
              {oppCount > 0 && (
                <span className="text-[12px] font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                  🌱 {oppCount} cơ hội
                </span>
              )}
              {riskCount > 0 && (
                <span className="text-[12px] font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">
                  ⚠️ {riskCount} rủi ro
                </span>
              )}
              {oppCount === 0 && riskCount === 0 && (
                <span className="text-[12px] font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                  ✅ Bình thường
                </span>
              )}
            </div>
          </div>

          <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3 leading-relaxed">
            {summary.headline}
          </p>

          <ul className="space-y-2">
            {summary.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                <span className="text-[var(--color-brand)] mt-0.5 shrink-0 font-bold">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
