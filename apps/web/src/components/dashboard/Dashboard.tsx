"use client";

/**
 * US-13: Dashboard Component
 * Tổng quan Dashboard - hiển thị stats, charts, top sources, topics, alerts, leads
 */

import React, { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
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
    stats,
    topSources,
    topTopics,
    workspaces,
    filters,
    isLoading,
    setStats,
    setWorkspaces,
  } = useDashboardStore();

  const [isMounted, setIsMounted] = useState(false);

  // Initialize data
  useEffect(() => {
    setIsMounted(true);

    if (initialStats) {
      setStats(initialStats);
    }

    if (initialWorkspaces.length > 0) {
      setWorkspaces(initialWorkspaces);
    }
  }, []);

  if (!isMounted) {
    return <div className="p-8">Loading...</div>;
  }

  // Calculate sentiment metrics
  const total = stats.total_mentions || 1;
  const positivePercent = Math.round((stats.positive_count / total) * 100) || 0;
  const negativePercent = Math.round((stats.negative_count / total) * 100) || 0;
  const neutralPercent = Math.round((stats.neutral_count / total) * 100) || 0;

  const sentimentBadge =
    stats.net_sentiment > 20
      ? { text: "Tích Cực", color: "bg-green-500/10 text-green-700" }
      : stats.net_sentiment < -5
        ? { text: "Tiêu Cực", color: "bg-red-500/10 text-red-700" }
        : { text: "Ổn định", color: "bg-slate-500/10 text-slate-700" };

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <DashboardFilters workspaces={workspaces} />

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          title="Tổng lượt nhắc đến"
          value={stats.total_mentions.toLocaleString("vi-VN")}
          trend={{ value: 12, isPositive: true }}
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
          title="Hot Leads (30 phút)"
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
          <SentimentTrend timeRange={filters.time_range} />
        </div>
        <div className="col-span-2">
          <SentimentDonut
            positive={stats.positive_count}
            neutral={stats.neutral_count}
            negative={stats.negative_count}
          />
        </div>
      </div>

      {/* Sources, Topics, AI Summary */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <TopSources sources={topSources} />
        </div>

        <div className="col-span-2 space-y-6">
          <TopTopics topics={topTopics} />

          <div className="bg-secondary/5 border border-secondary/15 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-secondary font-bold text-xs">
              <span className="material-symbols-outlined text-sm">
                psychology
              </span>
              <span className="uppercase tracking-wide">
                Tóm tắt phân tích AI
              </span>
            </div>
            <p className="text-xs italic text-on-surface-variant leading-relaxed">
              {workspaces.length > 0
                ? `${workspaces.length} thương hiệu F&B được theo dõi. Nhận diện ${stats.total_mentions} lượt nhắc đến với ${stats.net_sentiment > 0 ? "xu hướng tích cực" : "xu hướng tiêu cực"}. Chủ yếu liên quan đến chất lượng sản phẩm và trải nghiệm khách hàng.`
                : "Thêm workspace để bắt đầu giám sát thương hiệu của bạn."}
            </p>
          </div>
        </div>
      </div>

      {/* Load more data indicator */}
      {isLoading && (
        <div className="text-center py-4 text-on-surface-variant">
          <p className="text-sm">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
}
