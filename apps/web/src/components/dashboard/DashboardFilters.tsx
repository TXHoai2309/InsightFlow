"use client";

/**
 * DashboardFilters Component
 * Bộ lọc theo workspace, thời gian, platform (đã bỏ sentiment filter)
 */

import React, { useCallback } from "react";
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
  const { filters, setFilters } = useDashboardStore();

  const handleFilterChange = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters({ [key]: value } as Partial<DashboardFilters>);
    },
    [setFilters]
  );

  return (
    <div
      className="rounded-xl p-4 md:p-6 shadow-sm mb-4 md:mb-6"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-bold text-xl md:text-2xl mb-1" style={{ color: "var(--color-text-primary)" }}>
            Tổng quan Dashboard
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Giám sát thông tin F&B thời gian thực được tổng hợp tự động
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 w-full sm:w-auto">
          {/* Workspace Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
              Thương hiệu
            </label>
            <div className="relative">
              <select
                value={filters.workspace_id}
                onChange={(e) => handleFilterChange("workspace_id", e.target.value)}
                className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm focus:ring-1 outline-none cursor-pointer w-full min-w-[160px]"
                style={{
                  backgroundColor: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                <option value="all">Tất cả thương hiệu</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.brand_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
              Thời gian
            </label>
            <div className="relative">
              <select
                value={filters.time_range}
                onChange={(e) =>
                  handleFilterChange("time_range", e.target.value as DashboardFilters["time_range"])
                }
                className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm focus:ring-1 outline-none cursor-pointer w-full min-w-[120px]"
                style={{
                  backgroundColor: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                <option value="all">Toàn bộ</option>
                <option value="24h">Hôm nay (24h)</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
              Nền tảng
            </label>
            <div className="relative">
              <select
                value={filters.platform}
                onChange={(e) =>
                  handleFilterChange("platform", e.target.value as DashboardFilters["platform"])
                }
                className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm focus:ring-1 outline-none cursor-pointer w-full min-w-[140px]"
                style={{
                  backgroundColor: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                <option value="all">Tất cả nền tảng</option>
                {PLATFORM_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_META[p].label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
