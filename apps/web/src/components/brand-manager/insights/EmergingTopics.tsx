"use client";

import React from "react";
import type { TopicDelta } from "./insightEngine";

interface EmergingTopicsProps {
  deltas: TopicDelta[];
}

export function EmergingTopics({ deltas }: EmergingTopicsProps) {
  const topics = deltas
    .filter(d => d.deltaPercent > 20)
    .sort((a, b) => b.deltaPercent - a.deltaPercent)
    .slice(0, 8);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
        <span>🔥</span> Chủ đề đang bùng nổ
      </h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Sắp xếp theo % tăng so với kỳ trước</p>

      {topics.length === 0 ? (
        <div className="py-6 text-center">
          <span className="text-2xl block mb-2">😴</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">AI chưa phát hiện chủ đề bùng nổ nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((d, i) => {
            const isHigh = d.deltaPercent > 150;
            const isMedium = d.deltaPercent > 70;
            return (
              <div key={d.topic} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-[11px] font-bold text-[var(--color-text-muted)] w-5 shrink-0">{i + 1}</span>
                <span className="flex-1 text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{d.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[13px] font-black ${isHigh ? "text-orange-500" : isMedium ? "text-yellow-600" : "text-green-600"}`}>
                    ↑ {d.deltaPercent === 999 ? "Mới" : `${d.deltaPercent}%`}
                  </span>
                  {isHigh && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">HOT</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
