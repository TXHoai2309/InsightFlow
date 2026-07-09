"use client";

/**
 * BMFiltersBar — Bộ lọc thời gian + kênh + thương hiệu
 * Thiết kế dạng pill chips cho time filter, select cho platform & workspace.
 */

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
import type { DashboardFilters, Workspace, Platform } from "@/types/dashboard";

const TIME_OPTIONS = [
  { value: "24h", label: "time.today" },
  { value: "2d",  label: "time.2d" },
  { value: "3d",  label: "time.3d" },
  { value: "5d",  label: "time.5d" },
  { value: "7d",  label: "time.7d" },
  { value: "30d", label: "time.30d" },
  { value: "all", label: "time.all" },
  { value: "single", label: "time.single" },
  { value: "custom", label: "time.custom" },
] as const;

const PLATFORM_ORDER: Platform[] = [
  "facebook","tiktok","youtube","thread","be","google_maps","news",
];


interface BMFiltersBarProps {
  workspaces: Workspace[];
}

export function BMFiltersBar({ workspaces }: BMFiltersBarProps) {
  const { t } = useTranslation();
  const { filters, setFilters, isLoading } = useDashboardStore();

  const handle = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters({ [key]: value } as Partial<DashboardFilters>);
    },
    [setFilters]
  );

  const handleTimeRangeChange = useCallback(
    (timeRange: DashboardFilters["time_range"]) => {
      if (timeRange === "custom") {
        const todayStr = new Date().toISOString().split("T")[0];
        setFilters({
          time_range: "custom",
          custom_start_date: filters.custom_start_date || todayStr,
          custom_end_date: filters.custom_end_date || todayStr,
        });
      } else {
        setFilters({ time_range: timeRange });
      }
    },
    [filters, setFilters]
  );

  // Today display
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div data-tour="dashboard-filters" className="bm-filters-bar">
      {/* Left: Title + date */}
      <div className="bm-filters-left">
        <div className="flex items-center gap-3">
          <div className="bm-filters-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
              monitoring
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="bm-page-title">{t("bm.tab.overview")}</h1>
              {isLoading && (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin flex-shrink-0" />
              )}
            </div>
            <p className="bm-page-subtitle">{dateStr}</p>
          </div>
        </div>
      </div>


      {/* Right: Filter controls */}
      <div className="bm-filters-right">

        {/* Time select */}
        <div className="bm-select-wrap">
          <span className="material-symbols-outlined bm-select-icon">schedule</span>
          <select
            id="bm-time-filter"
            value={filters.time_range}
            onChange={(e) => handleTimeRangeChange(e.target.value as DashboardFilters["time_range"])}
            className="bm-select"
          >
            {TIME_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined bm-select-chevron">expand_more</span>
        </div>

        {/* Custom date range fields */}
        {filters.time_range === "custom" && (
          <div className="bm-date-custom animate-fade-in">
            <span className="material-symbols-outlined bm-date-icon">calendar_month</span>
            <input
              type="date"
              value={filters.custom_start_date || ""}
              onChange={(e) => handle("custom_start_date", e.target.value)}
              className="bm-date-input"
            />
            <span className="bm-date-sep">to</span>
            <input
              type="date"
              value={filters.custom_end_date || ""}
              onChange={(e) => handle("custom_end_date", e.target.value)}
              className="bm-date-input"
            />
          </div>
        )}

        {/* Single specific date field */}
        {filters.time_range === "single" && (
          <div className="bm-date-custom animate-fade-in">
            <span className="material-symbols-outlined bm-date-icon">calendar_month</span>
            <input
              type="date"
              value={filters.single_date || ""}
              onChange={(e) => handle("single_date", e.target.value)}
              className="bm-date-input"
            />
          </div>
        )}

        {/* Platform select */}
        <div className="bm-select-wrap">
          <span className="material-symbols-outlined bm-select-icon">cell_tower</span>
          <select
            id="bm-platform-filter"
            value={filters.platform}
            onChange={(e) => handle("platform", e.target.value as DashboardFilters["platform"])}
            className="bm-select"
          >
            <option value="all">{t("dashboard.filters.allPlatforms")}</option>
            {PLATFORM_ORDER.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_META[p]?.label ?? p}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined bm-select-chevron">expand_more</span>
        </div>


      </div>

      <style>{`
        .bm-filters-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 0 8px;
        }
        .bm-filters-left { display: flex; align-items: center; gap: 12px; }
        .bm-filters-right { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

        .bm-filters-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--color-brand-subtle);
          color: var(--color-brand);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-page-title {
          font-size: 20px; font-weight: 700; 
          color: var(--color-text-primary); line-height: 1.2; margin: 0;
        }
        .bm-page-subtitle {
          font-size: 12px; color: var(--color-text-muted);
          font-weight: 500; margin: 0; margin-top: 2px;
          text-transform: capitalize;
        }

        /* Time Pills */
        .bm-time-pills {
          display: flex; align-items: center; gap: 4px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px; padding: 4px;
        }
        .bm-pill {
          padding: 6px 14px; border-radius: 7px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          background: none; border: none; outline: none;
          color: var(--color-text-secondary);
          transition: all 0.18s ease;
        }
        .bm-pill:hover { background: var(--color-bg-surface-raised); color: var(--color-text-primary); }
        .bm-pill--active {
          background: var(--color-brand);
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(108,99,255,0.3);
        }

        /* Custom Date */
        .bm-date-custom {
          display: flex; align-items: center; gap: 4px;
          padding: 0 6px; border-left: 1px solid var(--color-border);
          margin-left: 2px;
        }
        .bm-date-icon { font-size: 14px !important; color: var(--color-text-muted); }
        .bm-date-sep { font-size: 12px; color: var(--color-text-muted); }
        .bm-date-input {
          border: none; background: none; outline: none;
          font-size: 12px; color: var(--color-text-secondary);
          width: 110px; cursor: pointer;
          color-scheme: light;
        }
        .dark .bm-date-input { color-scheme: dark; }

        /* Select */
        .bm-select-wrap {
          position: relative; display: flex; align-items: center;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px; padding: 0 10px;
          gap: 6px; height: 38px;
        }
        .bm-select-icon { font-size: 16px !important; color: var(--color-text-muted); flex-shrink: 0; }
        .bm-select-chevron { font-size: 16px !important; color: var(--color-text-muted); flex-shrink: 0; pointer-events: none; }
        .bm-select {
          appearance: none; background: none; border: none; outline: none;
          font-size: 13px; font-weight: 600; cursor: pointer;
          color: var(--color-text-primary);
          padding-right: 0; min-width: 130px;
        }
        .bm-select option {
          background: var(--color-bg-surface);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}
