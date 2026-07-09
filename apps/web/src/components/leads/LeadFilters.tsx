"use client";

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
import type { DashboardFilters as Filters, Workspace, Platform } from "@/types/dashboard";

interface LeadFiltersProps {
  workspaces: Workspace[];
  brandLocked?: boolean;
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

export function LeadFilters({ workspaces, brandLocked = false }: LeadFiltersProps) {
  const { t } = useTranslation();
  const { filters, setFilters } = useDashboardStore();

  const handleFilterChange = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters({ [key]: value } as Partial<Filters>);
    },
    [setFilters]
  );

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 shadow-sm">
      <div className="grid gap-3 min-[1160px]:grid-cols-[minmax(220px,1fr)_minmax(420px,0.95fr)] min-[1160px]:items-center">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">{t("leads.filters.title")}</h3>
          <p className="mt-0.5 max-w-[520px] text-xs text-[var(--color-text-secondary)]">
            {t("leads.filters.desc")}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {/* Workspace Filter */}
          <div className="flex min-w-0 flex-col">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 tracking-wider">
              {t("leads.filters.brand")}
            </label>
            <div className="relative">
              <select
                value={filters.workspace_id}
                onChange={(e) => handleFilterChange("workspace_id", e.target.value)}
                disabled={brandLocked}
                className={`w-full appearance-none rounded-lg border border-[var(--color-border)] py-2 pl-3 pr-9 text-sm outline-none transition-all focus:ring-1 focus:ring-[var(--color-brand)] ${brandLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"} select-app`}
              >
                {!brandLocked && (
                  <option value="all" style={{ backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
                    {t("leads.filters.brandAll")}
                  </option>
                )}
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
          <div className="flex min-w-0 flex-col">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 tracking-wider">
              {t("leads.filters.platform")}
            </label>
            <div className="relative">
              <select
                value={filters.platform}
                onChange={(e) =>
                  handleFilterChange("platform", e.target.value as Filters["platform"])
                }
                className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] py-2 pl-3 pr-9 text-sm outline-none transition-all focus:ring-1 focus:ring-[var(--color-brand)] select-app"
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
          <div className="flex min-w-0 flex-col">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 tracking-wider">
              {t("leads.filters.urgency")}
            </label>
            <div className="relative">
              <select
                value={filters.urgency || "pending"}
                onChange={(e) =>
                  handleFilterChange("urgency", e.target.value as Filters["urgency"])
                }
                className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] py-2 pl-3 pr-9 text-sm font-bold outline-none transition-all focus:ring-1 focus:ring-[var(--color-brand)] select-app"
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
