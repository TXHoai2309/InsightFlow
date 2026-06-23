"use client";

/**
 * US-13: TopTopics Component
 * Hiển thị top 5 chủ đề thảo luận chính
 */

import React from "react";
import { useTranslation } from "react-i18next";
import type { TopTopic } from "@/types/dashboard";

interface TopTopicsProps {
  topics: TopTopic[];
}

export function TopTopics({ topics }: TopTopicsProps) {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-lg p-6 shadow-sm h-full"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h4 className="font-bold text-lg mb-4" style={{ color: "var(--color-text-primary)" }}>
        Chủ đề thảo luận chính
      </h4>

      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <div
            key={topic.name}
            className="px-3 py-1 bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand-border)] rounded-full text-xs font-bold hover:opacity-80 transition-all cursor-pointer"
            title={`P: ${topic.sentiment_breakdown.positive}, N: ${topic.sentiment_breakdown.negative}, Neu: ${topic.sentiment_breakdown.neutral}`}
          >
            {topic.name} ({topic.count})
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg border border-[var(--color-warning)]/20 text-xs transition-all duration-300" style={{ backgroundColor: "var(--color-warning-subtle)" }}>
        <p className="font-bold mb-2 flex items-center gap-1 text-[var(--color-warning)]">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Cảnh báo: Các chủ đề liên quan đến
        </p>
        <ul className="space-y-1.5" style={{ color: "var(--color-text-secondary)" }}>
          <li>
            • <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>Chất lượng (quality)</span> - sản
            phẩm, dịch vụ
          </li>
          <li>
            • <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>Giá cả (price)</span> - tính cạnh
            tranh
          </li>
          <li>
            • <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>Dịch vụ (service)</span> - chăm sóc
            khách hàng
          </li>
        </ul>
      </div>
    </div>
  );
}
