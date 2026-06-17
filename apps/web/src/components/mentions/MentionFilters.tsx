"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters, Workspace } from "@/types/dashboard";

interface MentionFiltersProps {
  workspaces: Workspace[];
  filters: DashboardFilters;
}

const sentimentOptions = [
  { value: "all", label: "Tất cả cảm xúc" },
  { value: "positive", label: "Tích cực" },
  { value: "negative", label: "Tiêu cực" },
  { value: "neutral", label: "Trung lập" },
];

const platformOptions = [
  { value: "all", label: "Tất cả nguồn" },
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
  const { setFilters, resetFilters } = useDashboardStore();

  const workspaceOptions = useMemo(
    () => [
      {
        id: "all",
        brand_name: "Tất cả thương hiệu",
        scale: "large",
        keywords: [],
        synonyms: [],
        priority: false,
        created_at: new Date().toISOString(),
      },
      ...workspaces,
    ],
    [workspaces],
  );

  return (
    <section className="rounded-3xl bg-white border border-outline-variant p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">
            Bộ lọc mentions
          </h2>
          <p className="text-sm text-on-surface-variant">
            Lọc dữ liệu theo workspace, nguồn, cảm xúc và khoảng thời gian.
          </p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Đặt lại bộ lọc
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Thương hiệu
          </label>
          <select
            value={filters.workspace_id}
            onChange={(event) =>
              setFilters({ workspace_id: event.target.value })
            }
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {workspaceOptions.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.brand_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Nguồn
          </label>
          <select
            value={filters.platform}
            onChange={(event) =>
              setFilters({
                platform: event.target.value as DashboardFilters["platform"],
              })
            }
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Cảm xúc
          </label>
          <select
            value={filters.sentiment}
            onChange={(event) =>
              setFilters({
                sentiment: event.target.value as DashboardFilters["sentiment"],
              })
            }
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {sentimentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Khoảng thời gian
          </label>
          <select
            value={filters.time_range}
            onChange={(event) =>
              setFilters({
                time_range: event.target
                  .value as DashboardFilters["time_range"],
              })
            }
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
