"use client";

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { filters, setFilters } = useDashboardStore();

  const handleFilterChange = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters({ [key]: value } as Partial<Filters>);
    },
    [setFilters]
  );

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-[var(--color-text-primary)]">{t("leads.filters.title")}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {t("leads.filters.desc")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
          {/* Workspace Filter */}
          <div className="flex flex-col min-w-[150px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 tracking-wider">
              {t("leads.filters.brand")}
            </label>
            <div className="relative">
              <select
                value={filters.workspace_id}
                onChange={(e) => handleFilterChange("workspace_id", e.target.value)}
                className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm focus:ring-1 focus:ring-[var(--color-brand)] outline-none transition-all cursor-pointer select-app w-full border border-[var(--color-border)]"
              >
                <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.brandAll")}
                </option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                    {ws.brand_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col min-w-[130px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 tracking-wider">
              {t("leads.filters.platform")}
            </label>
            <div className="relative">
              <select
                value={filters.platform}
                onChange={(e) =>
                  handleFilterChange("platform", e.target.value as Filters["platform"])
                }
                className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm focus:ring-1 focus:ring-[var(--color-brand)] outline-none transition-all cursor-pointer select-app w-full border border-[var(--color-border)]"
              >
                <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.platformAll")}
                </option>
                {PLATFORM_ORDER.map((p) => (
                  <option key={p} value={p} style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                    {t(`dashboard.filters.${p}`, { defaultValue: PLATFORM_META[p].label })}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>

          {/* Urgency Filter */}
          <div className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 tracking-wider">
              {t("leads.filters.urgency")}
            </label>
            <div className="relative">
              <select
                value={filters.urgency || "pending"}
                onChange={(e) =>
                  handleFilterChange("urgency", e.target.value as Filters["urgency"])
                }
                className="appearance-none pl-3 pr-9 py-2 rounded-lg text-sm focus:ring-1 focus:ring-[var(--color-brand)] outline-none transition-all cursor-pointer select-app font-bold w-full border border-[var(--color-border)]"
              >
                <option value="pending" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.pending")}
                </option>
                <option value="urgent" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.urgent")}
                </option>
                <option value="overdue" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.overdue")}
                </option>
                <option value="handled" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.handled")}
                </option>
                <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                  {t("leads.filters.urgencyAll")}
                </option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
