"use client";

import React from "react";
import type { TopicDelta } from "./insightEngine";

interface OpportunityHighlightsProps {
  opportunities: TopicDelta[];
  timeLabel: string;
}

export function OpportunityHighlights({ opportunities, timeLabel }: OpportunityHighlightsProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">
        🌱 {opportunities.length} cơ hội nổi bật trong {timeLabel} qua
      </h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Tín hiệu tích cực tăng bất thường so với kỳ trước</p>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center py-7 text-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Chưa phát hiện cơ hội nổi bật</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Chưa có chủ đề nào tăng bất thường trong khoảng thời gian này</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {opportunities.map((opp, i) => {
            const deltaStr = opp.deltaPercent === 999
              ? "lần đầu xuất hiện trong kỳ này"
              : `được nhắc đến nhiều hơn ${opp.deltaPercent}%`;
            const posStr = `${Math.round(opp.posRatio * 100)}% phản hồi tích cực`;
            return (
              <li key={opp.topic} className="flex items-start gap-2 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                <span className="text-green-500 font-bold mt-0.5 shrink-0">•</span>
                <span>
                  <strong className="text-[var(--color-text-primary)]">{opp.label}</strong>{" "}
                  {deltaStr}{opp.posRatio > 0 ? `, ${posStr}` : ""}.
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
