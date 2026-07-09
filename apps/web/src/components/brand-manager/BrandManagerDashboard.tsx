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
    mentions,
    alerts,
    leads,
    workspaces,
    filters,
    isLoading,
    setWorkspaces,
    setFilters,
  } = useDashboardStore();

  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
  const [viewMode, setViewMode] = useState<"overview" | "platform">("overview");

  useEffect(() => {
    setIsMounted(true);
    if (initialWorkspaces.length > 0) setWorkspaces(initialWorkspaces);
    setFilters({ sentiment: "all", topic: "all" });
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

  /* ── Filtered mentions for current period ─────────────────── */
  const currentMentions = useMemo(() => {
    const normFilter =
      filters.workspace_id !== "all"
        ? filters.workspace_id.toLowerCase().replace(/[\s\-_.]/g, "").trim()
        : null;

    return mentions.filter((m) => {
      // 1. Brand/Workspace filter
      const b = m.workspace_id
        ? m.workspace_id.toLowerCase().replace(/[\s\-_.]/g, "").trim()
        : "";
      if (normFilter && b !== normFilter) return false;

      // 2. Platform filter
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;

      // 3. Time filter
      const time = new Date(m.posted_at).getTime();
      if (!Number.isFinite(time)) return false;

      if (filters.time_range === "custom") {
        if (filters.custom_start_date) {
          const start = new Date(`${filters.custom_start_date}T00:00:00Z`).getTime();
          if (time < start) return false;
        }
        if (filters.custom_end_date) {
          const end = new Date(`${filters.custom_end_date}T23:59:59Z`).getTime();
          if (time > end) return false;
        }
      } else {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayMs = startOfToday.getTime();

        let cutoff: number | null = null;
        if (filters.time_range === "24h") {
          cutoff = startOfTodayMs;
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
    });
  }, [
    mentions,
    filters.workspace_id,
    filters.time_range,
    filters.platform,
    filters.custom_start_date,
    filters.custom_end_date,
  ]);


  /* ── Filtered mentions for previous period (trend calc) ────── */
  const previousMentions = useMemo(() => {
    if (filters.time_range === "all" || filters.time_range === "custom") return [];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    let cutoff: number | null = null;
    let durationMs = 0;
    if (filters.time_range === "24h") {
      cutoff = startOfTodayMs;
      durationMs = Date.now() - startOfTodayMs;
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

  /* ── Derived alerts from real mentions when DB alerts is empty ── */
  const derivedAlerts = useMemo(() => {
    if (filteredAlerts.length > 0) return filteredAlerts;
    // Tạo alerts từ mentions tiêu cực nhóm theo topic
    const negMentions = currentMentions.filter((m) => m.sentiment === "negative");
    if (negMentions.length === 0) return [];

    // Group by topic
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
          quality: "Chất lượng sản phẩm", service: "Phục vụ & CSKH",
          price: "Giá cả", delivery: "Giao hàng", staff: "Thái độ nhân viên",
          legal: "Pháp lý", operation: "Vận hành", marketing: "Marketing",
          experience: "Trải nghiệm", competitor: "Đối thủ", other: "Chủ đề khác",
        };
        return {
          id: `derived-${topic}-${i}`,
          workspace_id: sample?.workspace_id || "",
          severity: severity as "critical" | "high" | "medium" | "low",
          signal_type: (negRatio > 0.2 ? "mention_spike" : "sensitive_topic") as "mention_spike" | "high_reach" | "sensitive_topic",
          message: `${TOPIC_LABELS[topic] || topic}: ${data.count} bình luận tiêu cực (${Math.round(ratio * 100)}% tổng thảo luận)`,
          spike_multiplier: parseFloat((data.count / Math.max(totalAll / 10, 1)).toFixed(1)),
          affected_mentions_count: data.count,
          created_at: sample?.created_at || new Date().toISOString(),
          status: "new" as const,
        };
      });
  }, [filteredAlerts, currentMentions]);

  const highAlerts = derivedAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  );
  const unprocessedContacts = filteredLeads.filter((l) => l.status === "new").length;

  if (!isMounted || (!isFirstLoadDone && isLoading)) {
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
        alertsTotal={stats.alerts_today}
        alertsHigh={highAlerts.length}
        unprocessed={unprocessedContacts}
        crises={derivedAlerts.filter((a) => a.severity === "critical").length}
        hotLeads={stats.hot_leads_today}
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
