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
    <div className="mb-4 md:mb-6 pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-bold text-2xl md:text-[28px] mb-2 flex items-center gap-2 text-[#2A2B2F] dark:text-white">
            {t("dashboard.overview.title")}
          </h2>
          <p className="text-[13px] text-gray-500 font-medium">
            {t("dashboard.overview.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 md:gap-4">
          {/* Workspace Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400">
              {t("dashboard.filters.brand", "THƯƠNG HIỆU")}
            </label>
            <div className="relative">
              <select
                value={filters.workspace_id}
                onChange={(e) => handleFilterChange("workspace_id", e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6D5FFD] cursor-pointer min-w-[160px]"
              >
                <option value="all">{t("dashboard.filters.allBrandsOption", "Tất cả thương hiệu")}</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.brand_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i className="ti ti-chevron-down text-[14px]"></i>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400">
              {t("dashboard.filters.time", "THỜI GIAN")}
            </label>
            <div className="relative">
              <select
                value={filters.time_range}
                onChange={(e) =>
                  handleFilterChange("time_range", e.target.value as DashboardFilters["time_range"])
                }
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6D5FFD] cursor-pointer min-w-[140px]"
              >
                <option value="24h">{t("time.today")}</option>
                <option value="2d">{t("time.2d")}</option>
                <option value="3d">{t("time.3d")}</option>
                <option value="5d">{t("time.5d")}</option>
                <option value="7d">{t("time.7d")}</option>
                <option value="30d">{t("time.30d")}</option>
                <option value="all">{t("time.all")}</option>
                <option value="single">{t("time.single")}</option>
                <option value="custom">{t("time.custom")}</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i className="ti ti-chevron-down text-[14px]"></i>
              </div>
            </div>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400">
              {t("dashboard.filters.platform", "NỀN TẢNG")}
            </label>
            <div className="relative">
              <select
                value={filters.platform}
                onChange={(e) =>
                  handleFilterChange("platform", e.target.value as DashboardFilters["platform"])
                }
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6D5FFD] cursor-pointer min-w-[150px]"
              >
                <option value="all">{t("dashboard.filters.allPlatformsOption", "Tất cả nền tảng")}</option>
                {PLATFORM_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {t(`dashboard.filters.${p}`)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i className="ti ti-chevron-down text-[14px]"></i>
              </div>
            </div>
          </div>
          
          {/* Custom Date Range Picker */}
          {filters.time_range === "custom" && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-[10px] font-bold uppercase text-gray-400">
                {t("dashboard.filters.dateRange", "TỪ NGÀY - ĐẾN NGÀY")}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={filters.custom_start_date || ""}
                    className="appearance-none pl-10 pr-3 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6D5FFD] cursor-pointer"
                    onChange={(e) => handleFilterChange("custom_start_date", e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <i className="ti ti-calendar text-[16px]"></i>
                  </div>
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.custom_end_date || ""}
                    className="appearance-none pl-10 pr-3 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6D5FFD] cursor-pointer"
                    onChange={(e) => handleFilterChange("custom_end_date", e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <i className="ti ti-calendar text-[16px]"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Single Specific Date Picker */}
          {filters.time_range === "single" && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-[10px] font-bold uppercase text-gray-400">
                CHỌN NGÀY
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.single_date || ""}
                  className="appearance-none pl-10 pr-3 py-2.5 rounded-lg text-[13px] font-medium bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6D5FFD] cursor-pointer"
                  onChange={(e) => handleFilterChange("single_date", e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <i className="ti ti-calendar text-[16px]"></i>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
