"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { TopTopic } from "@/types/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";
import { isDemoPath, toDemoHref } from "@/lib/demo-navigation";

interface TopTopicsProps {
  topics: TopTopic[];
}

export function TopTopics({ topics }: TopTopicsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const setFilters = useDashboardStore((state) => state.setFilters);

  // Mapping topics to specific colors and icons
  const getTopicMeta = (name: string) => {
    switch(name) {
      case "quality": return { label: t("dashboard.topTopics.qualityDesc", "Chất lượng đồ uống"), icon: "local_cafe" };
      case "service": return { label: t("dashboard.topTopics.serviceDesc", "Phục vụ & Thái độ NV"), icon: "person" };
      case "price": return { label: t("dashboard.topTopics.priceDesc", "Giá cả & Khuyến mãi"), icon: "local_offer" };
      case "space": return { label: t("dashboard.topTopics.spaceDesc", "Không gian & Vệ sinh"), icon: "chair" };
      case "delivery": return { label: t("dashboard.topTopics.deliveryDesc", "Giao hàng"), icon: "two_wheeler" };
      case "legal": return { label: t("dashboard.topTopics.legalDesc", "Pháp lý"), icon: "gavel" };
      case "operation": return { label: t("dashboard.topTopics.operationDesc", "Vận hành"), icon: "build" };
      case "marketing": return { label: t("dashboard.topTopics.marketingDesc", "Marketing"), icon: "campaign" };
      default: return { label: name, icon: "label" };
    }
  };

  const handleTopicClick = (topicName: any) => {
    setFilters({ sentiment: "negative", topic: topicName });
    router.push(isDemoPath(pathname) ? toDemoHref("/mentions") || "/demo/mentions" : "/mentions");
  };

  // Lấy top 5 topics có số lượng đề cập tiêu cực cao nhất
  const displayTopics = topics.length > 0 ? topics.slice(0, 5) : [];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[16px] text-[#2A2B2F] dark:text-white">
          {t("dashboard.topics.negativeTitle", "Chủ đề tiêu cực nổi bật")}
        </h3>
        <Link
          href="/topics"
          className="text-[13px] font-medium text-[#6D5FFD] hover:underline flex items-center gap-1"
        >
          {t("dashboard.topics.viewAll", "Xem tất cả chủ đề")} &rarr;
        </Link>
      </div>

      {displayTopics.length === 0 ? (
        <div className="text-center py-6 text-[var(--color-text-muted)] text-sm border rounded-[12px] bg-white dark:bg-[#1a1b1e] border-dashed border-gray-300">
          {t("dashboard.topics.noData", "Chưa có dữ liệu chủ đề")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {displayTopics.map((topic, index) => {
            const meta = getTopicMeta(topic.name);
            const count = topic.count;
            // Use actual trend from data, default to 0
            const actualTrend = (topic as any).trend || 0;
            const isUp = actualTrend >= 0;

            return (
              <Link
                key={index}
                href={`/mentions?sentiment=negative&topic=${topic.name}`}
                className="group bg-[#FFF5F5] dark:bg-[#2D1616] rounded-xl p-3 border border-[#FED7D7] dark:border-[#5C2B2B] flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FED7D7] dark:bg-[#742A2A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[16px] text-[#C53030] dark:text-[#FC8181]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {meta.icon}
                    </span>
                  </div>
                  <div className="flex flex-col overflow-hidden max-w-[90px]">
                    <span className="font-bold text-[12px] text-[#2A2B2F] dark:text-white leading-tight mb-0.5 truncate group-hover:text-primary transition-colors" title={meta.label}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-[#718096] dark:text-[#A0AEC0]">
                      {count} {t("dashboard.topics.mentionsCount", "đề cập")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`text-[11px] font-bold flex items-center ${
                      isUp ? "text-[#E53E3E]" : "text-[#38A169]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isUp ? "arrow_drop_up" : "arrow_drop_down"}
                    </span>
                    {Math.abs(actualTrend)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
