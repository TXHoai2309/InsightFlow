"use client";

import React from "react";
import type { CrisisSignal } from "./insightEngine";

interface AnomalySignalsProps {
  signals: CrisisSignal[];
}

export function AnomalySignals({ signals }: AnomalySignalsProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
        ⚠️ AI phát hiện dấu hiệu bất thường
      </h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
        Tín hiệu tiêu cực tăng đột biến so với baseline — không phải % tĩnh
      </p>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center py-7 text-center">
          <span className="text-3xl mb-2">✅</span>
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Chưa phát hiện dấu hiệu khủng hoảng nào</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Tất cả chỉ số đang trong ngưỡng bình thường</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {signals.map((sig, i) => {
            const isHigh = sig.severity === "critical" || sig.severity === "high";
            const deltaStr = sig.deltaPercent === 999
              ? "lần đầu xuất hiện trong kỳ này"
              : `tăng đột biến +${sig.deltaPercent}%`;
            return (
              <li key={sig.topic + i} className="flex items-start gap-2 text-[13px] leading-relaxed">
                <span className={`mt-0.5 shrink-0 font-bold ${isHigh ? "text-red-500" : "text-orange-400"}`}>•</span>
                <span className="text-[var(--color-text-secondary)]">
                  Chủ đề{" "}
                  <strong className="text-[var(--color-text-primary)]">“{sig.label}”</strong>{" "}
                  {deltaStr}.
                  {sig.contentSample && (
                    <span className="block text-[11px] text-[var(--color-text-muted)] italic mt-0.5 line-clamp-1">
                      Ví dụ: “{sig.contentSample}”
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
