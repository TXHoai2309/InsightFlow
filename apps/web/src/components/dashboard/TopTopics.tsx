"use client";

/**
 * US-13: TopTopics Component
 * Hiển thị top 5 chủ đề thảo luận chính
 */

import React from "react";
import type { TopTopic } from "@/types/dashboard";

interface TopTopicsProps {
  topics: TopTopic[];
}

export function TopTopics({ topics }: TopTopicsProps) {
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

      <div className="mt-6 text-xs text-[var(--color-text-secondary)]">
        <p className="font-bold mb-2 text-[var(--color-text-primary)]">
          Cảnh báo: Các chủ đề liên quan đến
        </p>
        <ul className="space-y-1">
          <li>
            • <span className="font-bold">Chất lượng (quality)</span> - sản
            phẩm, dịch vụ
          </li>
          <li>
            • <span className="font-bold">Giá cả (price)</span> - tính cạnh
            tranh
          </li>
          <li>
            • <span className="font-bold">Dịch vụ (service)</span> - chăm sóc
            khách hàng
          </li>
        </ul>
      </div>
    </div>
  );
}
