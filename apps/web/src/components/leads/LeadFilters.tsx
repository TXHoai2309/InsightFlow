"use client";

import React, { useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
import type { DashboardFilters as Filters, Workspace, Platform } from "@/types/dashboard";

interface LeadFiltersProps {
  workspaces: Workspace[];
}

const PLATFORM_ORDER: Platform[] = [
  "facebook",
  "tiktok",
  "youtube",
  "thread",
  "be",
  "google_maps",
  "news",
];

export function LeadFilters({ workspaces }: LeadFiltersProps) {
  const { filters, setFilters } = useDashboardStore();

  const handleFilterChange = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters({ [key]: value } as Partial<Filters>);
    },
    [setFilters]
  );

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 md:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-on-surface">Bộ lọc tìm kiếm</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Lọc khách hàng tiềm năng theo thương hiệu, nền tảng và độ khẩn cấp xử lý
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
          {/* Workspace Filter */}
          <div className="flex flex-col min-w-[150px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-outline uppercase mb-1 tracking-wider">
              Thương hiệu
            </label>
            <select
              value={filters.workspace_id}
              onChange={(e) => handleFilterChange("workspace_id", e.target.value)}
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer text-on-surface"
            >
              <option value="all">Tất cả thương hiệu</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.brand_name}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col min-w-[130px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-outline uppercase mb-1 tracking-wider">
              Nền tảng
            </label>
            <select
              value={filters.platform}
              onChange={(e) =>
                handleFilterChange("platform", e.target.value as Filters["platform"])
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer text-on-surface"
            >
              <option value="all">Tất cả nền tảng</option>
              {PLATFORM_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_META[p].label}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-outline uppercase mb-1 tracking-wider">
              Độ khẩn cấp
            </label>
            <select
              value={filters.urgency || "pending"}
              onChange={(e) =>
                handleFilterChange("urgency", e.target.value as Filters["urgency"])
              }
              className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer text-on-surface font-bold"
            >
              <option value="pending">🟢 Đang chờ xử lý</option>
              <option value="urgent">🔥 Cần xử lý gấp</option>
              <option value="overdue">🔴 Đã quá hạn</option>
              <option value="handled">⚫ Đã xử lý / Bỏ qua</option>
              <option value="all">🔵 Tất cả trạng thái</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
