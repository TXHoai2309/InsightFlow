"use client";

/**
 * BrandManagerDashboard — Màn hình Tổng quan Thương hiệu (Task 1)
 * Dành riêng cho vai trò Brand Manager.
 * Bao gồm: Filters, BHS Gauge, KPI Cards, Alert Banner,
 *           Sentiment Trend Chart, Alerts Table, Top Sources,
 *           Top Topics, và Today's Focus sidebar.
 */

import React, { useState, useMemo, useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DashboardService } from "@/lib/services/dashboard";
import { useTranslation } from "react-i18next";

import { BMFiltersBar } from "./BMFiltersBar";
import { BMHeroRow } from "./BMHeroRow";
import { BMKpiCards } from "./BMKpiCards";
import { BMAlertBanner } from "./BMAlertBanner";
import { BMSentimentChart } from "./BMSentimentChart";
import { BMAlertTable } from "./BMAlertTable";
import { BMTopSources } from "./BMTopSources";
import { BMTopTopics } from "./BMTopTopics";
import { BMTodayFocus } from "./BMTodayFocus";

import type { Workspace } from "@/types/dashboard";

interface BrandManagerDashboardProps {
  initialWorkspaces?: Workspace[];
}

export function BrandManagerDashboard({
  initialWorkspaces = [],
}: BrandManagerDashboardProps) {
  const {
    mentions,
    alerts,
    leads,
    workspaces,
    filters,
    setWorkspaces,
    setFilters,
  } = useDashboardStore();

  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (initialWorkspaces.length > 0) setWorkspaces(initialWorkspaces);
    setFilters({ sentiment: "all", topic: "all" });
  }, []);

  /* ── Filtered mentions for current period ─────────────────── */
  const currentMentions = useMemo(() => {
    const normFilter =
      filters.workspace_id !== "all"
        ? filters.workspace_id.toLowerCase().replace(/[\s\-_.]/g, "").trim()
        : null;

    const durationMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30 };
    const durationMs =
      filters.time_range !== "all"
        ? durationMap[filters.time_range] * 24 * 60 * 60 * 1000
        : null;
    const cutoff = durationMs ? Date.now() - durationMs : null;

    return mentions.filter((m) => {
      const b = m.workspace_id
        ? m.workspace_id.toLowerCase().replace(/[\s\-_.]/g, "").trim()
        : "";
      if (normFilter && b !== normFilter) return false;
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;
      if (cutoff !== null) {
        const time = new Date(m.posted_at).getTime();
        if (!Number.isFinite(time) || time < cutoff || time > Date.now()) return false;
      }
      return true;
    });
  }, [mentions, filters.workspace_id, filters.time_range, filters.platform]);

  /* ── Filtered mentions for previous period (trend calc) ────── */
  const previousMentions = useMemo(() => {
    if (filters.time_range === "all") return [];
    const durationMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30 };
    const durationMs = durationMap[filters.time_range] * 24 * 60 * 60 * 1000;
    const currentCutoff = Date.now() - durationMs;
    const previousCutoff = currentCutoff - durationMs;

    const normFilter =
      filters.workspace_id !== "all"
        ? filters.workspace_id.toLowerCase().replace(/[\s\-_.]/g, "").trim()
        : null;

    return mentions.filter((m) => {
      const b = m.workspace_id
        ? m.workspace_id.toLowerCase().replace(/[\s\-_.]/g, "").trim()
        : "";
      if (normFilter && b !== normFilter) return false;
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;
      const time = new Date(m.posted_at).getTime();
      return time >= previousCutoff && time < currentCutoff;
    });
  }, [mentions, filters.workspace_id, filters.time_range, filters.platform]);

  /* ── Stats ──────────────────────────────────────────────────── */
  const filteredAlerts = useMemo(
    () =>
      alerts.filter((a) => {
        if (filters.workspace_id !== "all" && a.workspace_id !== filters.workspace_id) return false;
        return true;
      }),
    [alerts, filters.workspace_id]
  );

  const filteredLeads = useMemo(
    () =>
      leads.filter((l) => {
        if (filters.workspace_id !== "all" && l.workspace_id !== filters.workspace_id) return false;
        return true;
      }),
    [leads, filters.workspace_id]
  );

  const stats = useMemo(
    () => DashboardService.calculateStats(currentMentions, filteredAlerts, filteredLeads),
    [currentMentions, filteredAlerts, filteredLeads]
  );

  const prevStats = useMemo(
    () => DashboardService.calculateStats(previousMentions, [], []),
    [previousMentions]
  );

  const topSources = useMemo(
    () => DashboardService.calculateTopSources(currentMentions),
    [currentMentions]
  );

  const topTopics = useMemo(() => {
    const current = DashboardService.calculateTopTopics(currentMentions);
    const prev = DashboardService.calculateTopTopics(previousMentions);
    return current.map((t) => {
      const prevCount = prev.find((p) => p.name === t.name)?.count || 0;
      const trend =
        prevCount === 0 ? 0 : Math.round(((t.count - prevCount) / prevCount) * 100);
      return { ...t, trend };
    });
  }, [currentMentions, previousMentions]);

  /* ── Derived KPIs ───────────────────────────────────────────── */
  const total = stats.total_mentions;
  const prevTotal = prevStats.total_mentions;
  const totalTrend =
    prevTotal === 0 ? 0 : Math.round(((total - prevTotal) / prevTotal) * 100);

  const baseHealth = 60 + stats.net_sentiment / 2;
  const brandHealthScore = Math.min(100, Math.max(0, Math.round(baseHealth)));
  const brandHealthTrend = Math.round((stats.net_sentiment - prevStats.net_sentiment) / 2);

  const highAlerts = filteredAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  );
  const unprocessedContacts = filteredLeads.filter((l) => l.status === "new").length;

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-brand)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)] font-medium">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* ── 1. Sticky Filter Bar ───────────────────────────────── */}
      <BMFiltersBar workspaces={workspaces} />

      {/* ── 2. Critical Alert Banner (above the fold) ─────────── */}
      {highAlerts.length > 0 && <BMAlertBanner alerts={highAlerts} />}

      {/* ── 3. Hero Row: Brand Health Gauge + Sentiment Donut ─── */}
      <BMHeroRow
        score={brandHealthScore}
        trend={brandHealthTrend}
        sentiment={{
          positive: stats.positive_count,
          neutral: stats.neutral_count,
          negative: stats.negative_count,
        }}
        totalMentions={stats.total_mentions}
      />

      {/* ── 4. KPI Cards ────────────────────────────────────────── */}
      <BMKpiCards
        totalMentions={stats.total_mentions}
        totalTrend={totalTrend}
        negativeMentions={stats.negative_count}
        negativePrev={prevStats.negative_count}
        alertsTotal={stats.alerts_today}
        alertsHigh={highAlerts.length}
        unprocessed={unprocessedContacts}
        crises={filteredAlerts.filter((a) => a.severity === "critical").length}
        hotLeads={stats.hot_leads_today}
      />

      {/* ── 5. Main Grid: Chart + Today Focus ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Chart — 8 cols */}
        <div className="xl:col-span-8">
          <BMSentimentChart filteredMentions={currentMentions} />
        </div>

        {/* Today Focus — 4 cols */}
        <div className="xl:col-span-4">
          <BMTodayFocus
            unprocessedContacts={unprocessedContacts}
            newAlerts={filteredAlerts.filter((a) => a.status === "new").length}
            highAlerts={highAlerts.length}
            crises={filteredAlerts.filter((a) => a.severity === "critical").length}
            hotLeads={stats.hot_leads_today}
          />
        </div>
      </div>

      {/* ── 6. Alerts Table ─────────────────────────────────────── */}
      <BMAlertTable alerts={filteredAlerts.slice(0, 8)} />

      {/* ── 7. Bottom Row: Top Sources + Top Topics ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <BMTopSources sources={topSources} />
        </div>
        <div className="lg:col-span-8">
          <BMTopTopics topics={topTopics} />
        </div>
      </div>
    </div>
  );
}
