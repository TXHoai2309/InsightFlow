"use client";

import React from "react";
import type { TopicDelta, CrisisSignal } from "./insightEngine";

interface AIRecommendationProps {
  opportunities: TopicDelta[];
  crisisSignals: CrisisSignal[];
}

export function AIRecommendation({ opportunities, crisisSignals }: AIRecommendationProps) {
  const capitalize = (opportunities: TopicDelta[]) =>
    opportunities.slice(0, 4).map(o => o.label);

  const handleList = crisisSignals.slice(0, 4).map(s => s.label);

  return (
    <div className="rounded-2xl border border-[var(--color-brand)]/20 bg-gradient-to-r from-[var(--color-brand-subtle)] via-white to-red-50 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)] flex items-center justify-center text-white font-black text-[18px]">
          🤖
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">AI Khuyến nghị hành động</h3>
          <p className="text-[12px] text-[var(--color-text-muted)]">Tổng hợp từ phân tích tiềm năng & khủng hoảng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nên tận dụng */}
        <div className="rounded-xl border border-green-200 bg-white p-4">
          <h4 className="text-[14px] font-bold text-green-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[12px]">✨</span>
            Nên tận dụng ngay
          </h4>
          {opportunities.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-muted)] italic">Chưa phát hiện cơ hội đáng kể</p>
          ) : (
            <ul className="space-y-2">
              {capitalize(opportunities).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  <span className="mt-0.5 text-green-500 shrink-0">→</span>
                  <span className="text-[var(--color-text-primary)]">
                    <strong>{item}</strong> — đang tăng bất thường, nên đẩy truyền thông ngay
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nên xử lý */}
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <h4 className="text-[14px] font-bold text-red-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-[12px]">⚡</span>
            Cần xử lý khẩn
          </h4>
          {crisisSignals.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-muted)] italic">Chưa phát hiện rủi ro cần xử lý</p>
          ) : (
            <ul className="space-y-2">
              {handleList.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  <span className="mt-0.5 text-red-500 shrink-0">!</span>
                  <span className="text-[var(--color-text-primary)]">
                    <strong>{item}</strong> — tín hiệu tiêu cực đang leo thang, cần phân công xử lý
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {opportunities.length === 0 && crisisSignals.length === 0 && (
        <div className="mt-4 text-center py-4">
          <span className="text-2xl block mb-2">🤖</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">AI chưa có đủ tín hiệu để đưa ra khuyến nghị trong khoảng thời gian này</p>
        </div>
      )}
    </div>
  );
}
