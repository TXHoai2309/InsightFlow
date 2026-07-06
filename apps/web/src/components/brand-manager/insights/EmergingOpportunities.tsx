"use client";

import React from "react";
import type { TopicDelta } from "./insightEngine";

interface EmergingOpportunitiesProps {
  opportunities: TopicDelta[];
  loading?: boolean;
}

function getActionHint(delta: number, posRatio: number): string {
  if (delta > 200 && posRatio > 0.7) return "→ Tiềm năng viral cao — đẩy ngay";
  if (delta > 100 && posRatio > 0.6) return "→ Nên mở chiến dịch truyền thông";
  if (delta > 50) return "→ Nên đẩy content để tận dụng";
  return "→ Theo dõi thêm";
}

export function EmergingOpportunities({ opportunities, loading }: EmergingOpportunitiesProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
        <div className="h-5 w-48 rounded bg-[var(--color-border)] animate-pulse mb-4" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-[var(--color-border)] animate-pulse mb-3" />)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="text-[18px]">🌱</span>
            AI phát hiện <span className="text-green-600">{opportunities.length} cơ hội mới nổi</span>
          </h3>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">Sắp xếp theo mức tăng bất thường so với kỳ trước</p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">AI chưa phát hiện cơ hội mới nổi</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Trong khoảng thời gian này chưa có chủ đề nào tăng bất thường</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp, i) => (
            <div
              key={opp.topic}
              className="rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">#{i + 1}</span>
                    <span className="text-[14px] font-bold text-[var(--color-text-primary)] truncate">{opp.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] mb-2">
                    <span className="text-green-600 font-bold text-[14px]">
                      ▲ +{opp.deltaPercent === 999 ? "Mới xuất hiện" : `${opp.deltaPercent}%`}
                    </span>
                    <span className="text-[var(--color-text-muted)]">lượt nhắc</span>
                    <span className="text-[var(--color-text-muted)]">•</span>
                    <span className="font-semibold" style={{ color: opp.posRatio > 0.6 ? "#16a34a" : "#ca8a04" }}>
                      {Math.round(opp.posRatio * 100)}% tích cực
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-green-700">{getActionHint(opp.deltaPercent, opp.posRatio)}</p>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-[22px] font-black text-[var(--color-text-primary)]">{opp.currentCount}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">lượt nhắc</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
