"use client";

/**
 * US-13: DashboardFilters Component
 * Bộ lọc global cho Dashboard
 */

import React, { useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters, Workspace } from "@/types/dashboard";

interface DashboardFiltersProps {
  workspaces: Workspace[];
}

export function DashboardFilters({ workspaces }: DashboardFiltersProps) {
  const { filters, setFilters } = useDashboardStore();

  const handleFilterChange = useCallback(
    (key: keyof DashboardFilters, value: any) => {
      setFilters({ [key]: value });
    },
    [setFilters],
  );

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
      <div className="flex flex-wrap justify-between items-center gap-6">
        <div>
          <h2 className="font-bold text-2xl text-on-surface mb-1">
            Tổng quan Dashboard
          </h2>
          <p className="text-sm text-on-surface-variant">
            Giám sát thông tin F&B thời gian thực được tổng hợp tự động
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Workspace Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-outline uppercase mb-1">
              Workspace
            </label>
            <select
              value={filters.workspace_id}
              onChange={(e) =>
                handleFilterChange("workspace_id", e.target.value)
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">Tất cả (F&B)</option>
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
                handleFilterChange("time_range", e.target.value as any)
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="24h">Hôm nay (24h)</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-outline uppercase mb-1">
              Platform
            </label>
            <select
              value={filters.platform}
              onChange={(e) =>
                handleFilterChange("platform", e.target.value as any)
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="news">Báo điện tử</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-outline uppercase mb-1">
              Sentiment
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) =>
                handleFilterChange("sentiment", e.target.value as any)
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="positive">Tích cực</option>
              <option value="neutral">Trung lập</option>
              <option value="negative">Tiêu cực</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
