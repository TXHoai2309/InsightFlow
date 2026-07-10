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

const defaultPlatforms = ["facebook", "tiktok", "youtube", "thread", "be", "google_maps", "news"];
const defaultTopics = [
  "quality",
  "price",
  "service",
  "staff",
  "delivery",
  "experience",
  "legal",
  "operation",
  "marketing",
  "competitor",
  "other",
];

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  thread: "Threads",
  threads: "Threads",
  be: "Be / BeFood",
  befood: "Be / BeFood",
  google_maps: "Google Maps",
  news: "Báo chí",
};

function titleizeFilterValue(value: string) {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function MentionFilters({ workspaces, filters, allMentions, contentMode, onContentModeChange }: MentionFiltersProps) {
  const { t } = useTranslation();
  const { setFilters } = useDashboardStore();

  const timeRangeOptions = useMemo(() => [
    { value: "24h", label: t("time.today", "Hôm nay") },
    { value: "2d", label: t("time.2d", "2 ngày") },
    { value: "3d", label: t("time.3d", "3 ngày") },
    { value: "5d", label: t("time.5d", "5 ngày") },
    { value: "7d", label: t("time.7d", "7 ngày qua") },
    { value: "30d", label: t("time.30d", "30 ngày qua") },
    { value: "all", label: t("time.all", "Tất cả thời gian") },
    { value: "single", label: t("time.single", "Ngày cụ thể") },
    { value: "custom", label: t("time.custom", "Tự chọn ngày") },
  ] as const, [t]);

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
    const platformSet = new Set<string>(defaultPlatforms);
    allMentions.forEach(m => {
      if (m.platform) platformSet.add(m.platform);
    });
    return Array.from(platformSet).sort();
  }, [allMentions]);

  // Derive available topics from actual data
  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>(defaultTopics);
    allMentions.forEach(m => {
      if (m.topic) topicSet.add(m.topic);
    });
    return Array.from(topicSet).sort();
  }, [allMentions]);

  const getPlatformLabel = (platform: string) => {
    const normalized = platform.toLowerCase();
    return t(`dashboard.filters.${normalized}`, {
      defaultValue: platformLabels[normalized] || titleizeFilterValue(platform),
    });
  };

  const getTopicLabel = (topic: string) => {
    const normalized = topic.toLowerCase();
    return t(`dashboard.topics.${normalized}`, {
      defaultValue: titleizeFilterValue(topic),
    });
  };

  // Get brand display name: check workspaces list, then fall back to raw value
  const getBrandName = (brandId: string) => {
    const ws = workspaces.find(w => w.id === brandId);
    if (!ws) return brandId;
    return ws.brand_name.toLowerCase().includes("highland")
      ? "Highlands Coffee"
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
              {getPlatformLabel(platform)}
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
              {getTopicLabel(topic)}
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

      {/* Single specific date filter field */}
      {filters.time_range === "single" && (
        <div
          className="p-4 rounded-2xl flex flex-col gap-3 animate-fade-in"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Chọn Ngày
          </label>
          <input
            type="date"
            value={filters.single_date || ""}
            onChange={(e) => setFilters({ single_date: e.target.value })}
            className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      )}

      {/* Custom Date Range fields */}
      {filters.time_range === "custom" && (
        <>
          <div
            className="p-4 rounded-2xl flex flex-col gap-3 animate-fade-in"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.custom_start_date || ""}
              onChange={(e) => setFilters({ custom_start_date: e.target.value })}
              className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
          <div
            className="p-4 rounded-2xl flex flex-col gap-3 animate-fade-in"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.custom_end_date || ""}
              onChange={(e) => setFilters({ custom_end_date: e.target.value })}
              className="bg-transparent border-none focus:ring-0 font-medium w-full p-0 text-sm outline-none cursor-pointer"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </>
      )}
    </div>
  );
}

