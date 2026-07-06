"use client";

import React, { useMemo } from "react";
import type { Mention } from "@/types/dashboard";
import { TOPIC_LABELS } from "./insightEngine";

interface MarketingOpportunityProps {
  mentions: Mention[];
}

export function MarketingOpportunity({ mentions }: MarketingOpportunityProps) {
  // Trích xuất insight marketing từ dữ liệu thật
  const insights = useMemo(() => {
    const results: { label: string; growth: string; reach: string }[] = [];
    
    // 1. Nền tảng có nhiều tích cực nhất
    const platformPos: Record<string, number> = {};
    mentions.forEach(m => {
      if (m.sentiment === "positive") {
        platformPos[m.platform] = (platformPos[m.platform] || 0) + 1;
      }
    });
    const topPlatform = Object.entries(platformPos).sort((a, b) => b[1] - a[1])[0];
    if (topPlatform && topPlatform[1] > 2) {
      const pName = topPlatform[0].charAt(0).toUpperCase() + topPlatform[0].slice(1);
      results.push({
        label: `Cộng đồng trên ${pName} phản hồi tốt`,
        growth: `+${topPlatform[1]} bài`,
        reach: "Tiềm năng",
      });
    }

    // 2. Chủ đề được khen ngợi nhiều nhất
    const topicPos: Record<string, number> = {};
    mentions.forEach(m => {
      if (m.sentiment === "positive") {
        const t = m.topic || "other";
        topicPos[t] = (topicPos[t] || 0) + 1;
      }
    });
    const topTopic = Object.entries(topicPos).sort((a, b) => b[1] - a[1])[0];
    if (topTopic && topTopic[1] > 2) {
      results.push({
        label: `Khen ngợi về "${TOPIC_LABELS[topTopic[0]] || topTopic[0]}"`,
        growth: `${topTopic[1]} lượt khen`,
        reach: "Nổi bật",
      });
    }

    // 3. Khách hàng đóng góp nội dung (UGC) - dựa trên tác giả có bài dài
    const ugcCount = mentions.filter(m => m.sentiment === "positive" && m.content.length > 50).length;
    if (ugcCount > 0) {
      results.push({
        label: "Khách hàng tự tạo nội dung dài (UGC)",
        growth: `${ugcCount} bài viết`,
        reach: "Chất lượng cao",
      });
    }

    return results;
  }, [mentions]);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>📣</span> Cơ hội Truyền thông
        </h3>
        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Phân tích từ bình luận</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
        Các điểm sáng về mặt truyền thông được AI tổng hợp từ phản hồi thực tế của khách hàng.
      </p>
      
      {insights.length === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="text-2xl mb-2">🔍</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có đủ dữ liệu để tạo đề xuất marketing</p>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{item.label}</span>
              <div className="flex items-center gap-3 text-[12px]">
                <span className="text-green-600 font-bold">{item.growth}</span>
                <span className="text-[var(--color-text-muted)]">{item.reach}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
