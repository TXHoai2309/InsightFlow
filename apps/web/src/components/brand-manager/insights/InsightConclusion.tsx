"use client";

import React from "react";
import type { InsightSummary } from "./generateInsightSummary";

interface InsightConclusionProps {
  summary: InsightSummary;
}

export function InsightConclusion({ summary }: InsightConclusionProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-slate-50 to-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-[20px] mt-0.5 shrink-0">📌</span>
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-2">
            Kết luận — AI tổng hợp những điểm nổi bật nhất
          </h3>
          <ul className="space-y-2">
            {summary.conclusion.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                <span className="mt-0.5 text-[var(--color-brand)] font-bold shrink-0">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
