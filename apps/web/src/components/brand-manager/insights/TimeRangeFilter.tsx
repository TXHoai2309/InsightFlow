"use client";

import React from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import type { DashboardFilters } from "@/types/dashboard";

export const INSIGHTS_TIME_OPTIONS = [
  { value: "2d", label: "2 ngày" },
  { value: "3d", label: "3 ngày" },
  { value: "5d", label: "5 ngày" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "all", label: "90 ngày qua" },
] as const;

export const MOCK_VENUES = [
  "Láng Hạ",
  "Nguyễn Du",
  "Hàm Cá Mập",
  "Time City",
  "Landmark 81",
  "Võ Văn Ngân",
  "Phan Đình Phùng",
  "Trần Duy Hưng",
];

export function TimeRangeFilter() {
  const { filters, setFilters } = useDashboardStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-medium text-[var(--color-text-muted)]">Khoảng thời gian:</span>
      <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
        {INSIGHTS_TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilters({ time_range: opt.value as DashboardFilters["time_range"] })}
            className={`px-3 py-1.5 text-[12px] font-semibold transition-all border-r border-[var(--color-border)] last:border-r-0 ${
              filters.time_range === opt.value
                ? "bg-[var(--color-brand)] text-white"
                : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
