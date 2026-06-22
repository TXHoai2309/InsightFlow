"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters, Workspace, Mention } from "@/types/dashboard";

interface MentionFiltersProps {
  workspaces: Workspace[];
  filters: DashboardFilters;
  allMentions: Mention[];
}

const sentimentOptions = [
  { value: "all", label: "Tất cả sắc thái" },
  { value: "positive", label: "Tích cực" },
  { value: "negative", label: "Tiêu cực" },
  { value: "neutral", label: "Trung lập" },
];

const platformLabelMap: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  news: "Báo chí",
  youtube: "YouTube",
  google_maps: "Google Maps",
};

const timeRangeOptions = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "24h", label: "24 giờ" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
];

export function MentionFilters({ workspaces, filters, allMentions }: MentionFiltersProps) {
  const { setFilters } = useDashboardStore();

  // Derive available brands from actual data
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    allMentions.forEach(m => brandSet.add(m.workspace_id));
    return Array.from(brandSet).sort();
  }, [allMentions]);

  // Derive available platforms from actual data
  const availablePlatforms = useMemo(() => {
    const platformSet = new Set<string>();
    allMentions.forEach(m => platformSet.add(m.platform));
    return Array.from(platformSet).sort();
  }, [allMentions]);

  // Get brand display name: check workspaces list, then fall back to raw value
  const getBrandName = (brandId: string) => {
    const ws = workspaces.find(w => w.id === brandId);
    return ws ? ws.brand_name : brandId;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Brand Filter */}
      <div className="bg-surface-bright p-4 rounded-2xl border border-outline-variant flex flex-col gap-3">
        <label className="text-xs font-semibold text-outline uppercase tracking-wider">
          Nhãn hàng (Brand)
        </label>
        <select
          value={filters.workspace_id}
          onChange={(event) =>
            setFilters({ workspace_id: event.target.value })
          }
          className="bg-transparent border-none focus:ring-0 font-medium text-on-surface w-full p-0 text-sm"
        >
          <option value="all">Tất cả nhãn hàng</option>
          {availableBrands.map((brand) => (
            <option key={brand} value={brand}>
              {getBrandName(brand)}
            </option>
          ))}
        </select>
      </div>

      {/* Sentiment Filter */}
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

      {/* Platform Filter - dynamic from data */}
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
          <option value="all">Tất cả nền tảng</option>
          {availablePlatforms.map((platform) => (
            <option key={platform} value={platform}>
              {platformLabelMap[platform] || platform}
            </option>
          ))}
        </select>
      </div>

      {/* Topic Filter */}
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
          <option value="staff">Nhân viên</option>
          <option value="delivery">Giao hàng</option>
          <option value="experience">Trải nghiệm</option>
          <option value="competitor">Đối thủ</option>
          <option value="other">Khác</option>
        </select>
      </div>

      {/* Time Range Filter */}
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
