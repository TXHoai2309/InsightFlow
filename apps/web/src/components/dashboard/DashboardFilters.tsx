"use client";

/**
 * DashboardFilters Component
 * Bộ lọc theo workspace, thời gian, platform (đã bỏ sentiment filter)
 */

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
import type { DashboardFilters, Workspace, Platform } from "@/types/dashboard";

interface DashboardFiltersProps {
  workspaces: Workspace[];
}

// Thứ tự hiển thị platform trong dropdown
const PLATFORM_ORDER: Platform[] = [
  "facebook",
  "tiktok",
  "youtube",
  "thread",
  "be",
  "google_maps",
  "news",
];

export function DashboardFilters({ workspaces }: DashboardFiltersProps) {
  const { t } = useTranslation();
  const { filters, setFilters } = useDashboardStore();

  const handleFilterChange = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters({ [key]: value } as Partial<DashboardFilters>);
    },
    [setFilters]
  );

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 md:p-6 shadow-sm mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-bold text-xl md:text-2xl text-on-surface mb-1">
            Tổng quan Dashboard
          </h2>
          <p className="text-sm text-on-surface-variant">
            Giám sát thông tin F&B thời gian thực được tổng hợp tự động
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 w-full sm:w-auto">
          {/* Workspace Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-outline uppercase mb-1">
              Thương hiệu
            </label>
            <select
              value={filters.workspace_id}
              onChange={(e) => handleFilterChange("workspace_id", e.target.value)}
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">Tất cả thương hiệu</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.brand_name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-outline uppercase mb-1">
              Thời gian
            </label>
            <select
              value={filters.time_range}
              onChange={(e) =>
                handleFilterChange("time_range", e.target.value as DashboardFilters["time_range"])
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">Toàn bộ</option>
              <option value="24h">Hôm nay (24h)</option>
              <option value="7d">{t("dashboard.filters.7days")}</option>
              <option value="30d">{t("dashboard.filters.30days")}</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-outline uppercase mb-1">
              Nền tảng
            </label>
            <select
              value={filters.platform}
              onChange={(e) =>
                handleFilterChange("platform", e.target.value as DashboardFilters["platform"])
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">{t("dashboard.filters.allPlatforms")}</option>
              {PLATFORM_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_META[p].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
