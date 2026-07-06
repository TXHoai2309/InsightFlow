"use client";

import React from "react";
import type { TopicDelta } from "./insightEngine";

interface GrowingTopicsProps {
  deltas: TopicDelta[];
}

export function GrowingTopics({ deltas }: GrowingTopicsProps) {
  const growing = deltas
    .filter(d => d.deltaPercent > 20)
    .sort((a, b) => b.deltaPercent - a.deltaPercent)
    .slice(0, 8);

  const max = Math.max(...growing.map(d => Math.min(d.deltaPercent, 500)), 1);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">🔥 Chủ đề tăng trưởng nhanh</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Xu hướng mới nổi, sắp giảm dần theo % tăng</p>

      {growing.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-2xl mb-2">📊</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa phát hiện chủ đề tăng trưởng nhanh</p>
        </div>
      ) : (
        <div className="space-y-3">
          {growing.map((d, i) => {
            const barW = Math.round((Math.min(d.deltaPercent, 500) / max) * 100);
            const isHot = d.deltaPercent > 200;
            const isMed = d.deltaPercent > 80;
            const barColor = isHot ? "bg-orange-500" : isMed ? "bg-yellow-500" : "bg-green-500";
            const textColor = isHot ? "text-orange-600" : isMed ? "text-yellow-600" : "text-green-600";
            return (
              <div key={d.topic}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-muted)] w-4">{i + 1}</span>
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{d.label}</span>
                    {isHot && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">HOT</span>}
                  </div>
                  <span className={`text-[13px] font-black ${textColor}`}>
                    ↑ {d.deltaPercent === 999 ? "Mới" : `${d.deltaPercent}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-bg-surface-raised)] overflow-hidden">
                  <div className={`h-2 rounded-full ${barColor} transition-all duration-700`} style={{ width: `${barW}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
