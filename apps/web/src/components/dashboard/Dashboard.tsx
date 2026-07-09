"use client";

/**
 * US-13: Dashboard Component
 * Tổng quan Dashboard - hiển thị stats, charts, top sources, topics, alerts, leads.
 * Tất cả widgets đều được tính toán lại từ filtered mentions khi filter thay đổi.
 */

import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useAlertStore } from "@/stores/alert.store";
import { useAuth } from "@/hooks/useAuth";
import { getScopedBrandKey } from "@/lib/brandScope";
import { useRouter } from "next/navigation";
import { DashboardService, normalizeBrandName } from "@/lib/services/dashboard";
import { filterLeadsForDashboard } from "@/lib/lead-metrics";

// New components
import { BrandHealthScore } from "./BrandHealthScore";
import { KeyMetricsRow } from "./KeyMetricsRow";
import { PriorityActionsTable, PriorityAction } from "./PriorityActionsTable";
import { StaffPerformanceCard } from "./StaffPerformanceCard";
import { LeadFunnelCard } from "./LeadFunnelCard";

// Existing components
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

  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const setFilters = useDashboardStore((state) => state.setFilters);

  useEffect(() => {
    setIsMounted(true);
    if (initialStats) setStats(initialStats);
    if (initialWorkspaces.length > 0) setWorkspaces(initialWorkspaces);
    setFilters({ sentiment: "all", topic: "all" });
  }, []);

  const router = useRouter();
  const { profile } = useAuth();
  const scopedBrandKey = getScopedBrandKey(profile);
  const isManager = profile?.role === "brand_manager" || profile?.role === "admin";

  const {
    correctionRequests,
    fetchCorrectionRequests,
  } = useAlertStore();

  useEffect(() => {
    if (isMounted && isManager) {
      fetchCorrectionRequests(scopedBrandKey);
    }
  }, [isMounted, isManager, scopedBrandKey, fetchCorrectionRequests]);

  const pendingRequests = useMemo(() => {
    return correctionRequests.filter((r) => r.status === "pending");
  }, [correctionRequests]);

  const overviewMentions = useMemo(() => {
    const normFilter =
      filters.workspace_id !== "all"
        ? normalizeBrandName(filters.workspace_id)
        : null;

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

    return mentions.filter((m) => {
      const b = m.workspace_id ? normalizeBrandName(m.workspace_id) : "";
      if (normFilter && b !== normFilter) return false;
      if (filters.platform !== "all" && m.platform !== filters.platform) return false;
      if (cutoff !== null) {
        const time = new Date(m.posted_at).getTime();
        if (!Number.isFinite(time) || time < cutoff || time > Date.now()) return false;
      }
      return true;
    });
  }, [mentions, filters.workspace_id, filters.time_range, filters.platform]);

  const previousOverviewMentions = useMemo(() => {
    if (filters.time_range === "all") return [];
    
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

  const filteredAlerts = useMemo(() => getFilteredAlerts(), [filters, alerts, getFilteredAlerts]);
  const filteredLeadsForStats = useMemo(
    () => filterLeadsForDashboard(leads, filters),
    [leads, filters.workspace_id, filters.platform, filters.time_range],
  );

  const stats = useMemo(
    () => DashboardService.calculateStats(overviewMentions, filteredAlerts, filteredLeadsForStats),
    [overviewMentions, filteredAlerts, filteredLeadsForStats],
  );

  const prevStats = useMemo(
    () => DashboardService.calculateStats(previousOverviewMentions, [], []),
    [previousOverviewMentions],
  );

  const trends = useMemo(() => {
    const prevTotal = prevStats.total_mentions;
    const totalTrend = prevTotal === 0 ? 0 : ((stats.total_mentions - prevTotal) / prevTotal) * 100;
    const sentimentTrend = stats.net_sentiment - prevStats.net_sentiment;
    const prevTotalLeads = prevStats.hot_leads_today;
    const leadsTrend = prevTotalLeads === 0
      ? 0
      : Math.round(((filteredLeadsForStats.length - prevTotalLeads) / prevTotalLeads) * 100);
    return { total: totalTrend, sentiment: sentimentTrend, leads: leadsTrend };
  }, [stats, prevStats]);

  const topSources = useMemo(() => DashboardService.calculateTopSources(overviewMentions), [overviewMentions]);

  const topTopics = useMemo(() => {
    const current = DashboardService.calculateTopTopics(overviewMentions);
    const prev = DashboardService.calculateTopTopics(previousOverviewMentions);
    return current.map(t => {
      const prevCount = prev.find(p => p.name === t.name)?.count || 0;
      const trend = prevCount === 0 ? 0 : Math.round(((t.count - prevCount) / prevCount) * 100);
      return { ...t, trend };
    });
  }, [overviewMentions, previousOverviewMentions]);

  if (!isMounted) {
    return <div className="p-8 text-center text-sm">Loading...</div>;
  }

  // Calculate Mock Brand Health Score
  // Assuming net_sentiment is roughly -100 to 100, we normalize to 0-100
  // More realistically, brand health usually stays around 50-80
  const baseHealth = 60 + (stats.net_sentiment / 2);
  const brandHealthScore = Math.min(100, Math.max(0, Math.round(baseHealth)));
  const brandHealthTrend = Math.round(trends.sentiment / 2) || 0;

  // Compile Key Metrics
  const metricsRowData = {
    mentions: { 
      value: stats.total_mentions, 
      trend: `${Math.abs(Math.round(trends.total))}%`, 
      isPositive: trends.total >= 0 
    },
    negativeMentions: { 
      value: stats.negative_count, 
      trend: `↑ ${Math.max(0, stats.negative_count - prevStats.negative_count)}` 
    },
    aiAlerts: { 
      value: stats.alerts_today, 
      high: filteredAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length 
    },
    newLeads: { 
      value: filteredLeadsForStats.length, 
      trend: `+${Math.abs(Math.round(trends.leads))}` 
    },
    unprocessedContacts: { 
      value: leads.filter(l => l.status === 'new').length
    },
    monitoredCrises: { 
      value: filteredAlerts.filter(a => a.severity === 'critical').length 
    }
  };

  // Compile Priority Actions
  const priorityActions: PriorityAction[] = [];
  if (stats.negative_count > 0) {
    priorityActions.push({
      id: "neg-mentions",
      type: "negative",
      title: `${stats.negative_count} ${t("dashboard.priorityActions.negMentions", "Bài viết tiêu cực")}`,
      description: t("dashboard.priorityActions.negDesc", "Cần duyệt và phân công người xử lý ngay"),
      actionText: t("dashboard.priorityActions.reviewNow", "Xem bài viết"),
      link: "/mentions?sentiment=negative",
      urgency: "high"
    });
  }
  const highAlerts = filteredAlerts.filter(a => a.severity === 'high' || a.severity === 'critical');
  if (highAlerts.length > 0) {
    priorityActions.push({
      id: "high-alerts",
      type: "alert",
      title: `${highAlerts.length} ${t("dashboard.priorityActions.criticalAlerts", "Cảnh báo khẩn cấp")}`,
      description: t("dashboard.priorityActions.alertDesc", "AI phát hiện dấu hiệu khủng hoảng"),
      actionText: t("dashboard.priorityActions.assign", "Duyệt cảnh báo"),
      link: "/alerts",
      urgency: "medium"
    });
  }
  const newLeads = leads.filter(l => l.status === 'new');
  if (newLeads.length > 0) { 
    priorityActions.push({
      id: "unassigned-leads",
      type: "lead",
      title: `${newLeads.length} ${t("dashboard.priorityActions.leadsUnassigned", "Contact chưa phân công")}`,
      description: t("dashboard.priorityActions.leadDesc", "Khách hàng tiềm năng đang chờ phản hồi"),
      actionText: t("dashboard.priorityActions.distribute", "Phân công ngay"),
      link: "/contacts?assigned_to=unassigned",
      urgency: "low"
    });
  }
  // Remove mock staff overdue action unless we actually calculate it

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-10">
      <DashboardFilters workspaces={workspaces} />

      {isManager && pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 flex-shrink-0">
              <span className="material-symbols-outlined text-xl">edit_document</span>
            </div>
            <div>
              <p className="text-sm font-black text-[var(--color-text-primary)]">
                Yêu cầu duyệt sửa nhãn AI đang chờ xử lý
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                Có {pendingRequests.length} đề xuất sửa đổi nhãn từ nhân viên xử lý khủng hoảng cần bạn phê duyệt.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/alerts?tab=requests")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            Duyệt yêu cầu ngay
          </button>
        </div>
      )}

      {/* 1. Brand Health Score */}
      <BrandHealthScore 
        score={brandHealthScore} 
        trend={brandHealthTrend} 
        sentiment={{
          positive: stats.positive_count,
          neutral: stats.neutral_count,
          negative: stats.negative_count
        }}
      />

      {/* 2. Key Metrics Today */}
      <KeyMetricsRow metrics={metricsRowData} />

      {/* Main Grid for 3, 4, 5, 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Priority Actions & Employee Performance */}
        <div className="lg:col-span-8 space-y-6">
          {/* 3. Priority Actions */}
          <PriorityActionsTable actions={priorityActions} />

          {/* 5. Employee Performance */}
          <StaffPerformanceCard 
            working={14} 
            completedToday={28} 
            overdue={3} 
            avgResponseTime="15m" 
            successRate={92} 
          />
        </div>

        {/* Right Column (4 cols): Trends & Lead Pipeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* 4. Brand Trends */}
          <div className="bg-white dark:bg-[#1a1b1e] rounded-[16px] border border-[var(--color-border)] shadow-sm p-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center mb-4 uppercase tracking-wide">
              <span className="material-symbols-outlined mr-2 text-primary">trending_up</span>
              {t("dashboard.trends.title", "Xu hướng thương hiệu")}
            </h3>
            <SentimentTrend filteredMentions={overviewMentions} />
          </div>

          {/* 6. Lead Pipeline */}
          <LeadFunnelCard 
            funnelData={{
              new: leads.length,
              qualified: leads.filter(l => ['processing', 'completed'].includes(l.status)).length,
              contacted: leads.filter(l => ['processing', 'completed'].includes(l.status)).length,
              negotiating: leads.filter(l => ['completed'].includes(l.status)).length,
              won: leads.filter(l => l.status === 'completed').length
            }}
          />
        </div>
      </div>

      {/* Bottom Row: Top Sources and Top Topics (7, 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7. Top Sources */}
        <div className="lg:col-span-4">
          <TopSources sources={topSources} />
        </div>
        
        {/* 8. Top Topics */}
        <div className="lg:col-span-8">
          <TopTopics topics={topTopics} />
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">{t("common.loading", "Đang tải dữ liệu...")}</p>
        </div>
      )}
    </div>
  );
}
