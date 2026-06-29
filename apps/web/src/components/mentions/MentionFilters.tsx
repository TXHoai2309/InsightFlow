"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters, Workspace, Mention } from "@/types/dashboard";

interface MentionFiltersProps {
  workspaces: Workspace[];
  filters: DashboardFilters;
  allMentions: Mention[];
  contentMode: "all" | "post" | "comment";
  onContentModeChange: (mode: "all" | "post" | "comment") => void;
}

const sentimentOptions = [
  { value: "all", label: "Tất cả Sắc thái" },
  { value: "positive", label: "Tích cực" },
  { value: "neutral", label: "Trung lập" },
  { value: "negative", label: "Tiêu cực" },
];

const timeRangeOptions = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "24h", label: "24 giờ qua" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
];

export function MentionFilters({ workspaces, filters, allMentions, contentMode, onContentModeChange }: MentionFiltersProps) {
  const { t } = useTranslation();
  const { setFilters } = useDashboardStore();

  // Keep the product scope fixed to the three tracked brands.
  const availableBrands = useMemo(() => {
    const order = ["highlandcoffee", "starbucks", "mixue"];
    return [...workspaces].sort((a, b) => {
      const aIndex = order.findIndex((key) =>
        a.id.toLowerCase().includes(key) ||
        a.brand_name.toLowerCase().replace(/[\s\-_.]/g, "").includes(key),
      );
      const bIndex = order.findIndex((key) =>
        b.id.toLowerCase().includes(key) ||
        b.brand_name.toLowerCase().replace(/[\s\-_.]/g, "").includes(key),
      );
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [workspaces]);

  // Derive available platforms from actual data
  const availablePlatforms = useMemo(() => {
    const platformSet = new Set<string>();
    allMentions.forEach(m => platformSet.add(m.platform));
    return Array.from(platformSet).sort();
  }, [allMentions]);

  // Derive available topics from actual data
  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    allMentions.forEach(m => {
      if (m.topic) topicSet.add(m.topic);
    });
    return Array.from(topicSet).sort();
  }, [allMentions]);

  // Get brand display name: check workspaces list, then fall back to raw value
  const getBrandName = (brandId: string) => {
    const ws = workspaces.find(w => w.id === brandId);
    if (!ws) return brandId;
    return ws.brand_name.toLowerCase().includes("highland")
      ? "Highland Coffee"
      : ws.brand_name;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
      {/* Brand Filter */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {t("mentions.filters.brandLabel")}
        </label>
        <select
          value={filters.workspace_id}
          onChange={(event) =>
            setFilters({ workspace_id: event.target.value })
          }
          className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
          style={{ color: "var(--color-text-primary)" }}
        >
          <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
            {t("mentions.filters.allBrands")}
          </option>
          {availableBrands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {getBrandName(brand.id)}
            </option>
          ))}
        </select>
      </div>

      {/* Sentiment Filter */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {t("mentions.filters.sentimentLabel")}
        </label>
        <select
          value={filters.sentiment}
          onChange={(event) =>
            setFilters({
              sentiment: event.target.value as DashboardFilters["sentiment"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
          style={{ color: "var(--color-text-primary)" }}
        >
          {sentimentOptions.map((option) => (
            <option key={option.value} value={option.value} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Platform Filter */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {t("mentions.filters.platformLabel")}
        </label>
        <select
          value={filters.platform}
          onChange={(event) =>
            setFilters({
              platform: event.target.value as DashboardFilters["platform"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
          style={{ color: "var(--color-text-primary)" }}
        >
          <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
            {t("mentions.filters.allPlatforms")}
          </option>
          {availablePlatforms.map((platform) => (
            <option key={platform} value={platform} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              {t(`dashboard.filters.${platform.toLowerCase()}`, { defaultValue: platform })}
            </option>
          ))}
        </select>
      </div>

      {/* Topic Filter */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {t("mentions.filters.topicLabel")}
        </label>
        <select
          value={filters.topic || "all"}
          onChange={(event) =>
            setFilters({
              topic: event.target.value as DashboardFilters["topic"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
          style={{ color: "var(--color-text-primary)" }}
        >
          <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
            {t("mentions.filters.allTopics")}
          </option>
          {availableTopics.map((topic) => (
            <option key={topic} value={topic} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              {t(`dashboard.topics.${topic.toLowerCase()}`, { defaultValue: topic })}
            </option>
          ))}
        </select>
      </div>

      {/* Content Display Filter */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {t("mentions.filters.contentModeLabel", { defaultValue: "Hiển thị" })}
        </label>
        <select
          value={contentMode}
          onChange={(event) => onContentModeChange(event.target.value as "all" | "post" | "comment")}
          className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
          style={{ color: "var(--color-text-primary)" }}
        >
          <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
            {t("mentions.filters.allContent", { defaultValue: "Tất cả nội dung" })}
          </option>
          <option value="post" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
            {t("mentions.filters.postContent", { defaultValue: "Nội dung bài viết" })}
          </option>
          <option value="comment" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
            {t("mentions.filters.commentContent", { defaultValue: "Nội dung cmt" })}
          </option>
        </select>
      </div>

      {/* Time Range Filter */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {t("mentions.filters.timeRangeLabel")}
        </label>
        <select
          value={filters.time_range}
          onChange={(event) =>
            setFilters({
              time_range: event.target.value as DashboardFilters["time_range"],
            })
          }
          className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
          style={{ color: "var(--color-text-primary)" }}
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

