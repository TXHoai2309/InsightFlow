"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { CustomSelect } from "@/components/ui/CustomSelect";
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
  "quality", "price", "service", "staff", "delivery", "experience",
  "legal", "operation", "marketing", "competitor", "other",
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

  const availablePlatforms = useMemo(() => {
    const platformSet = new Set<string>(defaultPlatforms);
    allMentions.forEach(m => {
      if (m.platform) platformSet.add(m.platform);
    });
    return Array.from(platformSet).sort();
  }, [allMentions]);

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

  const getBrandName = (brandId: string) => {
    const ws = workspaces.find(w => w.id === brandId);
    if (!ws) return brandId;
    return ws.brand_name.toLowerCase().includes("highland")
      ? "Highlands Coffee"
      : ws.brand_name;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-4">
        


        {/* Sentiment Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {t("mentions.filters.sentimentLabel")}
          </label>
          <CustomSelect
            value={filters.sentiment || "all"}
            onChange={(val) => setFilters({ sentiment: val as DashboardFilters["sentiment"] })}
            options={sentimentOptions}
            minWidth="100%"
          />
        </div>

        {/* Platform Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {t("mentions.filters.platformLabel")}
          </label>
          <CustomSelect
            value={filters.platform || "all"}
            onChange={(val) => setFilters({ platform: val as DashboardFilters["platform"] })}
            options={[
              { value: "all", label: t("mentions.filters.allPlatforms") },
              ...availablePlatforms.map((platform) => ({
                value: platform,
                label: getPlatformLabel(platform)
              }))
            ]}
            minWidth="100%"
          />
        </div>

        {/* Topic Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {t("mentions.filters.topicLabel")}
          </label>
          <CustomSelect
            value={filters.topic || "all"}
            onChange={(val) => setFilters({ topic: val as DashboardFilters["topic"] })}
            options={[
              { value: "all", label: t("mentions.filters.allTopics") },
              ...availableTopics.map((topic) => ({
                value: topic,
                label: getTopicLabel(topic)
              }))
            ]}
            minWidth="100%"
          />
        </div>

        {/* Content Mode Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {t("mentions.filters.contentModeLabel", { defaultValue: "Hiển thị" })}
          </label>
          <CustomSelect
            value={contentMode}
            onChange={(val) => onContentModeChange(val as "all" | "post" | "comment")}
            options={[
              { value: "all", label: t("mentions.filters.allContent", { defaultValue: "Tất cả nội dung" }) },
              { value: "post", label: t("mentions.filters.postContent", { defaultValue: "Nội dung bài viết" }) },
              { value: "comment", label: t("mentions.filters.commentContent", { defaultValue: "Nội dung bình luận" }) },
            ]}
            minWidth="100%"
          />
        </div>

        {/* Time Range Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {t("mentions.filters.timeRangeLabel")}
          </label>
          <CustomSelect
            value={filters.time_range || "24h"}
            onChange={(val) => setFilters({ time_range: val as DashboardFilters["time_range"] })}
            options={[...timeRangeOptions]}
            minWidth="100%"
          />
        </div>
      </div>

      {/* Conditional Date Pickers - Rendered below if needed */}
      {(filters.time_range === "single" || filters.time_range === "custom") && (
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3 flex gap-4 animate-fade-in w-fit shadow-sm">
          {filters.time_range === "single" && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] font-bold uppercase text-[var(--color-text-muted)]">Chọn Ngày:</label>
              <input
                type="date"
                value={filters.single_date || ""}
                onChange={(e) => setFilters({ single_date: e.target.value })}
                className="bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
            </div>
          )}
          {filters.time_range === "custom" && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] font-bold uppercase text-[var(--color-text-muted)]">Từ ngày:</label>
              <input
                type="date"
                value={filters.custom_start_date || ""}
                onChange={(e) => setFilters({ custom_start_date: e.target.value })}
                className="bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
              <label className="text-[12px] font-bold uppercase text-[var(--color-text-muted)] ml-2">Đến ngày:</label>
              <input
                type="date"
                value={filters.custom_end_date || ""}
                onChange={(e) => setFilters({ custom_end_date: e.target.value })}
                className="bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
