"use client";

import React from "react";

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
  if (topics.length === 0) {
    return <div className="text-center text-outline py-10">Chưa có dữ liệu chủ đề.</div>;
  }

  const maxCount = Math.max(...topics.map(t => t.count));

  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm h-full">
      <h3 className="text-lg font-bold text-on-surface mb-6">Chủ đề thảo luận nổi bật</h3>
      <div className="flex flex-col gap-4">
        {topics.map((item, index) => {
          const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-on-surface capitalize">
                  {TOPIC_LABEL_MAP[item.topic] || item.topic}
                </span>
                <span className="text-primary font-bold">{item.count.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
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
