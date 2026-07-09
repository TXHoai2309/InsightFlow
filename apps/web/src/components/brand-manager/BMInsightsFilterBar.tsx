"use client";

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters } from "@/types/dashboard";

const TIME_OPTIONS = [
  { value: "24h", label: "Hôm nay" },
  { value: "2d", label: "2 ngày" },
  { value: "3d", label: "3 ngày" },
  { value: "5d", label: "5 ngày" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "all", label: "Toàn thời gian" },
  { value: "single", label: "Ngày cụ thể" },
  { value: "custom", label: "Tự chọn ngày" },
];

export const MOCK_VENUES = [
  "Chi nhánh Láng Hạ",
  "Chi nhánh Nguyễn Du",
  "Chi nhánh Hàm Cá Mập",
  "Chi nhánh Time City",
  "Chi nhánh Landmark 81",
];

export function BMInsightsFilterBar() {
  const { t } = useTranslation();
  const { filters, setFilters } = useDashboardStore();

  const handle = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters({ [key]: value } as Partial<DashboardFilters>);
    },
    [setFilters]
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-4 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
          <i className="ti ti-filter text-xl"></i>
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">Bộ lọc Insights</h2>
          <p className="text-[12px] text-[var(--color-text-secondary)]">Áp dụng cho Tiềm năng & Khủng hoảng</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Time Filter */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1.5">
          <i className="ti ti-calendar text-[var(--color-text-muted)]"></i>
          <select
            value={filters.time_range}
            onChange={(e) => handle("time_range", e.target.value as DashboardFilters["time_range"])}
            className="bg-transparent text-[13px] font-semibold text-[var(--color-text-primary)] outline-none"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom date range fields */}
        {filters.time_range === "custom" && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1.5 animate-fade-in">
            <i className="ti ti-calendar text-[var(--color-text-muted)]"></i>
            <input
              type="date"
              value={filters.custom_start_date || ""}
              onChange={(e) => handle("custom_start_date", e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-[var(--color-text-primary)] outline-none cursor-pointer"
            />
            <span className="text-[12px] text-[var(--color-text-muted)]">đến</span>
            <input
              type="date"
              value={filters.custom_end_date || ""}
              onChange={(e) => handle("custom_end_date", e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-[var(--color-text-primary)] outline-none cursor-pointer"
            />
          </div>
        )}

        {/* Single specific date picker field */}
        {filters.time_range === "single" && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1.5 animate-fade-in">
            <i className="ti ti-calendar text-[var(--color-text-muted)]"></i>
            <input
              type="date"
              value={filters.single_date || ""}
              onChange={(e) => handle("single_date", e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-[var(--color-text-primary)] outline-none cursor-pointer"
            />
          </div>
        )}

        {/* Venue Filter (Mocked via workspace_id for now) */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1.5">
          <i className="ti ti-map-pin text-[var(--color-text-muted)]"></i>
          <select
            value={filters.workspace_id}
            onChange={(e) => handle("workspace_id", e.target.value)}
            className="bg-transparent text-[13px] font-semibold text-[var(--color-text-primary)] outline-none"
          >
            <option value="all">Tất cả chi nhánh</option>
            {MOCK_VENUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
