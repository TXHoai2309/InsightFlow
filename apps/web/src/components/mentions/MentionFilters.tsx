"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters, Workspace } from "@/types/dashboard";

interface MentionFiltersProps {
  workspaces: Workspace[];
  filters: DashboardFilters;
}

const sentimentOptions = [
  { value: "all", label: "Tất cả sắc thái" },
  { value: "positive", label: "Tích cực" },
  { value: "negative", label: "Tiêu cực" },
  { value: "neutral", label: "Trung lập" },
];

const platformOptions = [
  { value: "all", label: "Tất cả nền tảng" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "news", label: "Báo chí" },
  { value: "youtube", label: "YouTube" },
];

const timeRangeOptions = [
  { value: "24h", label: "24 giờ" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
];

export function MentionFilters({ workspaces, filters }: MentionFiltersProps) {
  const { setFilters } = useDashboardStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Sentiment Filter - Bento Card */}
      <div className="bg-surface-bright p-4 rounded-2xl border border-outline-variant flex flex-col gap-3">
        <label className="text-xs font-semibold text-outline uppercase tracking-wider">
          Sắc thái (Sentiment)
        </label>
        <select
          value={filters.sentiment}
          onChange={(event) =>
            setFilters({
              sentiment: event.target.value as DashboardFilters["sentiment"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium text-on-surface w-full p-0 text-sm"
        >
          {sentimentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Platform Filter - Bento Card */}
      <div className="bg-surface-bright p-4 rounded-2xl border border-outline-variant flex flex-col gap-3">
        <label className="text-xs font-semibold text-outline uppercase tracking-wider">
          Nền tảng (Platform)
        </label>
        <select
          value={filters.platform}
          onChange={(event) =>
            setFilters({
              platform: event.target.value as DashboardFilters["platform"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium text-on-surface w-full p-0 text-sm"
        >
          {platformOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Topic Filter - Bento Card */}
      <div className="bg-surface-bright p-4 rounded-2xl border border-outline-variant flex flex-col gap-3">
        <label className="text-xs font-semibold text-outline uppercase tracking-wider">
          Chủ đề (Topic)
        </label>
        <select
          value={filters.topic || "all"}
          onChange={(event) =>
            setFilters({
              topic: event.target.value as DashboardFilters["topic"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium text-on-surface w-full p-0 text-sm"
        >
          <option value="all">Tất cả chủ đề</option>
          <option value="quality">Sản phẩm</option>
          <option value="service">Dịch vụ khách hàng</option>
          <option value="price">Giá cả</option>
          <option value="competitor">Đối thủ</option>
        </select>
      </div>

      {/* Time Range Filter - Bento Card */}
      <div className="bg-surface-bright p-4 rounded-2xl border border-outline-variant flex flex-col gap-3">
        <label className="text-xs font-semibold text-outline uppercase tracking-wider">
          Khoảng thời gian
        </label>
        <select
          value={filters.time_range}
          onChange={(event) =>
            setFilters({
              time_range: event.target.value as DashboardFilters["time_range"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium text-on-surface w-full p-0 text-sm"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
