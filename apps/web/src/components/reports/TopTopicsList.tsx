"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface TopTopic {
  topic: string;
  count: number;
}

interface TopTopicsListProps {
  topics: TopTopic[];
}

const TOPIC_LABEL_MAP: Record<string, string> = {
  quality: "Sản phẩm",
  service: "Dịch vụ khách hàng",
  price: "Giá cả",
  staff: "Nhân viên",
  delivery: "Giao hàng",
  experience: "Trải nghiệm",
  competitor: "Đối thủ",
  marketing: "Marketing",
  legal: "Pháp lý",
  operation: "Vận hành",
  other: "Khác",
};

export function TopTopicsList({ topics }: TopTopicsListProps) {
  const { t } = useTranslation();
  if (topics.length === 0) {
    return <div className="text-center text-[var(--color-text-muted)] py-10">Chưa có dữ liệu chủ đề.</div>;
  }

  const maxCount = Math.max(...topics.map(t => t.count));

  return (
    <div className="bg-[var(--color-bg-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm h-full">
      <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">Chủ đề thảo luận nổi bật</h3>
      <div className="flex flex-col gap-4">
        {topics.map((item, index) => {
          const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                  {TOPIC_LABEL_MAP[item.topic] || item.topic}
                </span>
                <span className="text-[var(--color-brand)] font-bold">{item.count.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-bg-surface-raised)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
