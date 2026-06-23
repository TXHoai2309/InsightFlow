"use client";

/**
 * US-13: Dashboard Component
 * Tổng quan Dashboard - hiển thị stats, charts, top sources, topics, alerts, leads.
 * Tất cả widgets đều được tính toán lại từ filtered mentions khi filter thay đổi.
 */

import React, { useEffect, useState, useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DashboardService } from "@/lib/services/dashboard";
import { StatCard } from "./StatCard";
import { SentimentDonut } from "./SentimentDonut";
import { SentimentTrend } from "./SentimentTrend";
import { TopSources } from "./TopSources";
import { TopTopics } from "./TopTopics";
import { DashboardFilters } from "./DashboardFilters";
import type { DashboardStats, Workspace } from "@/types/dashboard";

interface DashboardProps {
  initialStats?: DashboardStats;
  initialWorkspaces?: Workspace[];
}

export function Dashboard({
  initialStats,
  initialWorkspaces = [],
}: DashboardProps) {
  const {
    mentions,
    alerts,
    leads,
    workspaces,
    filters,
    isLoading,
    setStats,
    setWorkspaces,
    getFilteredMentions,
    getFilteredAlerts,
    getFilteredLeads,
    getFilteredLeadsWithoutUrgency,
  } = useDashboardStore();

  const [isMounted, setIsMounted] = useState(false);

  // Initialize data
  useEffect(() => {
    setIsMounted(true);
    if (initialStats) setStats(initialStats);
    if (initialWorkspaces.length > 0) setWorkspaces(initialWorkspaces);
  }, []);

  // ── Re-calculate tất cả metrics từ filtered mentions ─────────────────────
  // Hooks phải được gọi trước bất kỳ conditional return nào
  // mentions/alerts/leads được thêm vào deps để re-calc khi Firestore data load xong
  const filteredMentions = useMemo(
    () => getFilteredMentions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, mentions],
  );

  const filteredAlerts = useMemo(
    () => getFilteredAlerts(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, alerts],
  );

  const filteredLeads = useMemo(
    () => getFilteredLeads(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, leads],
  );

  const filteredLeadsForStats = useMemo(
    () => getFilteredLeadsWithoutUrgency(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, leads],
  );

  // Stats tính lại từ filtered data, hot leads count = tất cả hot leads theo filter Dashboard
  const stats = useMemo(
    () =>
      DashboardService.calculateStats(
        filteredMentions,
        filteredAlerts,
        filteredLeadsForStats,
      ),
    [filteredMentions, filteredAlerts, filteredLeadsForStats],
  );

  // Top sources tính từ toàn bộ mentions gốc trong firebase (không áp dụng lọc)
  const topSources = useMemo(
    () => DashboardService.calculateTopSources(mentions),
    [mentions],
  );

  // Top topics tính lại từ filtered mentions
  const topTopics = useMemo(
    () => DashboardService.calculateTopTopics(filteredMentions),
    [filteredMentions],
  );

  // Conditional render (sau tất cả hooks)
  if (!isMounted) {
    return <div className="p-8">Loading...</div>;
  }

  // ── Derived display values ────────────────────────────────────────────────
  const sentimentBadge =
    stats.net_sentiment > 20
      ? { text: "Tích Cực", color: "bg-green-500/10 text-green-700" }
      : stats.net_sentiment < -5
        ? { text: "Tiêu Cực", color: "bg-red-500/10 text-red-700" }
        : { text: "Ổn định", color: "bg-slate-500/10 text-slate-700" };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Global Filters */}
      <DashboardFilters workspaces={workspaces} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Tổng lượt nhắc đến"
          value={stats.total_mentions.toLocaleString("vi-VN")}
          icon={
            <span className="material-symbols-outlined text-primary">
              analytics
            </span>
          }
          bgColor="bg-primary/10"
          textColor="text-primary"
        />

        <StatCard
          title="Chỉ số Net Sentiment"
          value={`${stats.net_sentiment}%`}
          subtitle={sentimentBadge.text}
          icon={
            <span className="material-symbols-outlined text-green-600">
              mood
            </span>
          }
          bgColor="bg-green-500/10"
          textColor={
            stats.net_sentiment > 20
              ? "text-green-600"
              : stats.net_sentiment < -5
                ? "text-red-600"
                : "text-slate-600"
          }
        />

        <StatCard
          title="Hot Leads"
          value={stats.hot_leads_today}
          icon={
            <span className="material-symbols-outlined text-amber-600">
              shopping_cart
            </span>
          }
          bgColor="bg-amber-500/10"
          textColor="text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          {/* SentimentTrend nhận filteredMentions — hiển thị theo posted_at */}
          <SentimentTrend filteredMentions={filteredMentions} />
        </div>
        <div className="col-span-2">
          {/* SentimentDonut dùng counts từ filtered stats */}
          <SentimentDonut
            positive={stats.positive_count}
            neutral={stats.neutral_count}
            negative={stats.negative_count}
          />
        </div>
      </div>

      {/* Sources, Topics, AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="lg:col-span-3">
          <TopSources sources={topSources} />
        </div>

        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <TopTopics topics={topTopics} />
        </div>
      </div>

      {/* Load more data indicator */}
      {isLoading && (
        <div className="text-center py-4 text-[var(--color-text-secondary)]">
          <p className="text-sm">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
}
