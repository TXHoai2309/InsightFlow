"use client";

/**
 * BrandManagerDashboard — Màn hình Tổng quan Thương hiệu (Task 1)
 * Dành riêng cho vai trò Brand Manager.
 * Bao gồm: Filters, BHS Gauge, KPI Cards, Alert Banner,
 *           Sentiment Trend Chart, Alerts Table, Top Sources,
 *           Top Topics, và Today's Focus sidebar.
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useAlertStore } from "@/stores/alert.store";
import { DashboardService, normalizeBrandName } from "@/lib/services/dashboard";
import { filterLeadsForDashboard } from "@/lib/lead-metrics";
import { useTranslation } from "react-i18next";

import { BMFiltersBar } from "./BMFiltersBar";
import { BMHeroRow } from "./BMHeroRow";
import { DEMO_MOCK_ALERTS, DEMO_MOCK_LEADS, DEMO_MOCK_MENTIONS, DEMO_MOCK_WORKSPACES } from "@/lib/demo-mock-data";
import { BMKpiCards } from "./BMKpiCards";
import { BMAlertBanner } from "./BMAlertBanner";
import { BMSentimentChart } from "./BMSentimentChart";
import { BMTopSources } from "./BMTopSources";
import { BMTopTopics } from "./BMTopTopics";
import { BMPlatformDashboard } from "./BMPlatformDashboard";

import type { Workspace } from "@/types/dashboard";

interface BrandManagerDashboardProps {
  initialWorkspaces?: Workspace[];
}

export function BrandManagerDashboard({
  initialWorkspaces = [],
}: BrandManagerDashboardProps) {
  const {
    mentions: rawMentions,
    alerts,
    leads,
    workspaces: rawWorkspaces,
    filters,
    isLoading,
    error,
    setWorkspaces,
    setFilters,
  } = useDashboardStore();
  const isDemo = typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
  const mentions = isDemo && rawMentions.length === 0 ? DEMO_MOCK_MENTIONS : rawMentions;
  const workspaces = isDemo && rawWorkspaces.length === 0 ? DEMO_MOCK_WORKSPACES : rawWorkspaces;
  const crisisAlerts = useAlertStore((state) => state.rawAlerts);

  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
  const [viewMode, setViewMode] = useState<"overview" | "platform">("overview");

  useEffect(() => {
    setIsMounted(true);
    if (initialWorkspaces.length > 0) setWorkspaces(initialWorkspaces);
    // The Supabase dashboard data is historical; defaulting to only today can
    // make every KPI look empty when the latest crawl finished on a prior day.
    setFilters({ sentiment: "all", topic: "all", time_range: "30d" });
  }, []);

  useEffect(() => {
    if (!isLoading && isMounted) {
      setIsFirstLoadDone(true);
    }
  }, [isLoading, isMounted]);

  // Sync viewMode based on filters.platform selection
  useEffect(() => {
    if (filters.platform !== "all") {
      setViewMode("platform");
    }
  }, [filters.platform]);

  const handleBackToOverview = () => {
    setFilters({ platform: "all" });
    setViewMode("overview");
  };

  const checkTimeFilter = useCallback((postedAt: string) => {
    const time = new Date(postedAt).getTime();
    if (!Number.isFinite(time)) return false;

    if (filters.time_range === "custom") {
      if (filters.custom_start_date) {
        const start = new Date(`${filters.custom_start_date}T00:00:00`).getTime();
        if (time < start) return false;
      }
      if (filters.custom_end_date) {
        const end = new Date(`${filters.custom_end_date}T23:59:59`).getTime();
        if (time > end) return false;
      }
    } else if (filters.time_range === "single") {
      if (filters.single_date) {
        const start = new Date(`${filters.single_date}T00:00:00`).getTime();
        const end = new Date(`${filters.single_date}T23:59:59`).getTime();
        if (time < start || time > end) return false;
      }
    } else {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayMs = startOfToday.getTime();

      let cutoff: number | null = null;
      if (filters.time_range === "24h") {
        cutoff = startOfTodayMs;
      } else if (filters.time_range === "2d") {
        cutoff = startOfTodayMs - 1 * 24 * 60 * 60 * 1000;
      } else if (filters.time_range === "3d") {
        cutoff = startOfTodayMs - 2 * 24 * 60 * 60 * 1000;
      } else if (filters.time_range === "5d") {
        cutoff = startOfTodayMs - 4 * 24 * 60 * 60 * 1000;
      } else if (filters.time_range === "7d") {
        cutoff = startOfTodayMs - 6 * 24 * 60 * 60 * 1000;
      } else if (filters.time_range === "30d") {
        cutoff = startOfTodayMs - 29 * 24 * 60 * 60 * 1000;
      }

      if (cutoff !== null) {
        if (time < cutoff || time > Date.now()) return false;
      }
    }

    return true;
  }, [
    filters.time_range,
    filters.custom_start_date,
    filters.custom_end_date,
    filters.single_date,
  ]);

  /* ── Filtered mentions for current period ─────────────────── */
  const currentMentions = useMemo(() => {
    const normFilter =
      filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;

    return mentions.filter((m) => {
      // 1. Brand/Workspace filter
      const b = m.workspace_id ? normalizeBrandName(m.workspace_id) : "";
      if (normFilter && b !== normFilter) return false;

      // 2. Platform filter
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;

      // 3. Time filter
      return checkTimeFilter(m.posted_at);
    });
  }, [
    mentions,
    filters.workspace_id,
    filters.platform,
    checkTimeFilter,
  ]);


  /* ── Filtered mentions for previous period (trend calc) ────── */
  const previousMentions = useMemo(() => {
    if (filters.time_range === "all" || filters.time_range === "custom" || filters.time_range === "single") return [];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    let cutoff: number | null = null;
    let durationMs = 0;
    if (filters.time_range === "24h") {
      cutoff = startOfTodayMs;
      durationMs = Date.now() - startOfTodayMs;
    } else if (filters.time_range === "2d") {
      cutoff = startOfTodayMs - 1 * 24 * 60 * 60 * 1000;
      durationMs = 2 * 24 * 60 * 60 * 1000;
    } else if (filters.time_range === "3d") {
      cutoff = startOfTodayMs - 2 * 24 * 60 * 60 * 1000;
      durationMs = 3 * 24 * 60 * 60 * 1000;
    } else if (filters.time_range === "5d") {
      cutoff = startOfTodayMs - 4 * 24 * 60 * 60 * 1000;
      durationMs = 5 * 24 * 60 * 60 * 1000;
    } else if (filters.time_range === "7d") {
      cutoff = startOfTodayMs - 6 * 24 * 60 * 60 * 1000;
      durationMs = 7 * 24 * 60 * 60 * 1000;
    } else if (filters.time_range === "30d") {
      cutoff = startOfTodayMs - 29 * 24 * 60 * 60 * 1000;
      durationMs = 30 * 24 * 60 * 60 * 1000;
    }

    if (cutoff === null) return [];

    const currentCutoff = cutoff;
    const previousCutoff = cutoff - durationMs;

    const normFilter =
      filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;

    return mentions.filter((m) => {
      const b = m.workspace_id ? normalizeBrandName(m.workspace_id) : "";
      if (normFilter && b !== normFilter) return false;
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;
      const time = new Date(m.posted_at).getTime();
      return time >= previousCutoff && time < currentCutoff;
    });
  }, [mentions, filters.workspace_id, filters.time_range, filters.platform]);

  /* ── Stats ──────────────────────────────────────────────────── */
  const filteredAlerts = useMemo(() => {
    const targetBrand = filters.workspace_id !== "all" ? normalizeBrandName(filters.workspace_id) : null;
    return alerts.filter((a) => {
      if (targetBrand && normalizeBrandName(a.workspace_id || "") !== targetBrand) return false;
      return checkTimeFilter(a.created_at);
    });
  }, [alerts, filters.workspace_id, checkTimeFilter]);

  const filteredLeads = useMemo(
    () => {
      const baseLeads = isDemo && leads.length === 0 ? DEMO_MOCK_LEADS : leads;
      return filterLeadsForDashboard(baseLeads, isDemo ? { ...filters, workspace_id: "all" } : filters);
    },
    [isDemo, leads, filters],
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

  /* ── Derived alerts from real mentions when DB alerts is empty ── */
  const derivedAlerts = useMemo(() => {
    if (filteredAlerts.length > 0) return filteredAlerts;
    const negMentions = currentMentions.filter((m) => m.sentiment === "negative");
    if (negMentions.length === 0) return [];

    const topicCounts: Record<string, { count: number; mentions: typeof negMentions }> = {};
    negMentions.forEach((m) => {
      const topic = m.topic || "other";
      if (!topicCounts[topic]) topicCounts[topic] = { count: 0, mentions: [] };
      topicCounts[topic].count++;
      topicCounts[topic].mentions.push(m);
    });

    const totalNeg = negMentions.length;
    const totalAll = currentMentions.length || 1;
    const negRatio = totalNeg / totalAll;

    return Object.entries(topicCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([topic, data], i) => {
        const ratio = data.count / totalAll;
        const severity =
          ratio > 0.3 ? "critical" : ratio > 0.15 ? "high" : ratio > 0.05 ? "medium" : "low";
        const sample = data.mentions[0];
        const TOPIC_LABELS: Record<string, string> = {
          quality: t("dashboard.topics.quality") || "Chất lượng sản phẩm", 
          service: t("dashboard.topics.service") || "Phục vụ & CSKH",
          price: t("dashboard.topics.price") || "Giá cả", 
          delivery: t("dashboard.topics.delivery") || "Giao hàng", 
          staff: t("dashboard.topics.staff") || "Thái độ nhân viên",
          legal: t("dashboard.topics.legal") || "Pháp lý", 
          operation: t("dashboard.topics.operation") || "Vận hành", 
          marketing: t("dashboard.topics.marketing") || "Marketing",
          experience: t("dashboard.topics.experience") || "Trải nghiệm", 
          competitor: t("dashboard.topics.competitor") || "Đối thủ", 
          other: t("dashboard.topics.other") || "Chủ đề khác",
        };
        return {
          id: `derived-${topic}-${i}`,
          workspace_id: sample?.workspace_id || "",
          severity: severity as "critical" | "high" | "medium" | "low",
          signal_type: (negRatio > 0.2 ? "mention_spike" : "sensitive_topic") as "mention_spike" | "high_reach" | "sensitive_topic",
          message: `${TOPIC_LABELS[topic] || topic}: ${data.count} ${t("bm.hero.negativeComments", "bình luận tiêu cực")} (${Math.round(ratio * 100)}% ${t("bm.hero.totalDiscussions", "tổng thảo luận")})`,
          spike_multiplier: parseFloat((data.count / Math.max(totalAll / 10, 1)).toFixed(1)),
          affected_mentions_count: data.count,
          created_at: sample?.created_at || new Date().toISOString(),
          status: "new" as const,
        };
      });
  }, [filteredAlerts, currentMentions, t]);

  const highAlerts = derivedAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  );

  const crisisAlertKpi = useMemo(() => {
    const baseAlerts = isDemo && crisisAlerts.length === 0 ? DEMO_MOCK_ALERTS : crisisAlerts;
    if (isDemo) {
      const high = baseAlerts.filter((a) => ["critical", "high", "urgent"].includes(String(a.severity || "").toLowerCase())).length;
      return { total: baseAlerts.length, high };
    }
    const targetBrand =
      filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;

    const scopedAlerts = baseAlerts.filter((alert) => {
      if (targetBrand && normalizeBrandName(alert.brand || "") !== targetBrand) return false;
      if (filters.platform !== "all" && alert.source !== filters.platform) return false;
      return true;
    });
    const high = scopedAlerts.filter((alert) => {
      const severity = String(alert.severity || alert.urgency || "").toLowerCase();
      return severity === "critical" || severity === "high" || severity === "urgent";
    }).length;

    return { total: scopedAlerts.length, high };
  }, [isDemo, crisisAlerts, filters.workspace_id, filters.platform]);
  const unprocessedContacts = filteredLeads.filter((l) => l.status === "new").length;

  const hasData = mentions.length > 0;
  if ((!isMounted && !hasData) || (!isFirstLoadDone && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-brand)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)] font-medium">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (viewMode === "platform") {
    return (
      <div data-tour="dashboard-overview" className="max-w-[1600px] mx-auto space-y-6 pb-12">
        <BMFiltersBar workspaces={workspaces} />
        {error && (
          <div className="p-4 rounded-xl border border-[var(--color-error-border,rgba(239,68,68,0.2))] bg-[var(--color-error-subtle)] text-[var(--color-error)] flex items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">cloud_off</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
        <BMPlatformDashboard
          onBack={handleBackToOverview}
          currentMentions={currentMentions}
        />
      </div>
    );
  }

  return (
    <div data-tour="dashboard-overview" className="max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* ── 1. Sticky Filter Bar ───────────────────────────────── */}
      <BMFiltersBar workspaces={workspaces} />

      {error && (
        <div className="p-4 rounded-xl border border-[var(--color-error-border,rgba(239,68,68,0.2))] bg-[var(--color-error-subtle)] text-[var(--color-error)] flex items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">cloud_off</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

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
        onViewDetail={() => setViewMode("platform")}
      />

      {/* ── 4. KPI Cards ────────────────────────────────────────── */}
      <BMKpiCards
        totalMentions={stats.total_mentions}
        totalTrend={totalTrend}
        negativeMentions={stats.negative_count}
        negativePrev={prevStats.negative_count}
        alertsTotal={crisisAlertKpi.total}
        alertsHigh={crisisAlertKpi.high}
        unprocessed={unprocessedContacts}
        crises={derivedAlerts.filter((a) => a.severity === "critical").length}
        hotLeads={filteredLeads.length}
      />

      {/* ── 5. Row 2: Sentiment Trend (Full Width) ──────────────── */}
      <div className="grid grid-cols-1 gap-6">
        <BMSentimentChart filteredMentions={currentMentions} />
      </div>

      {/* ── 6. Row 3: Top Sources + Top Topics ─────────────────── */}
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
