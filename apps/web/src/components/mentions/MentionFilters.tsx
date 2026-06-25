"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters, Workspace, Mention } from "@/types/dashboard";

interface MentionFiltersProps {
  workspaces: Workspace[];
  filters: DashboardFilters;
  allMentions: Mention[];
}

export function MentionFilters({ workspaces, filters, allMentions }: MentionFiltersProps) {
  const { t } = useTranslation();
  const { setFilters } = useDashboardStore();

  const sentimentOptions = [
    { value: "all", label: t("mentions.filters.allSentiments") },
    { value: "positive", label: t("dashboard.filters.positive") },
    { value: "negative", label: t("dashboard.filters.negative") },
    { value: "neutral", label: t("dashboard.filters.neutral") },
  ];

  const timeRangeOptions = [
    { value: "all", label: t("mentions.filters.allTime") },
    { value: "24h", label: t("mentions.filters.24h") },
    { value: "7d", label: t("mentions.filters.7days") },
    { value: "30d", label: t("mentions.filters.30days") },
  ];

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
    return ws ? ws.brand_name : brandId;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <option key={brand} value={brand} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              {getBrandName(brand)}
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

