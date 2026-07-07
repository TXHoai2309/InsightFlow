/**
 * useDashboard Hook
 * Fetch dữ liệu từ Firestore, tính aggregations, nạp vào Zustand store
 */

"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DashboardService } from "@/lib/services/dashboard";
import { filterByBusinessPolicy } from "@/lib/brandScope";
import { useAuth } from "@/hooks/useAuth";

interface UseDashboardOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { autoFetch = true, refetchInterval = 60000 } = options;
  const { profile, loading: authLoading } = useAuth();

  const {
    setStats,
    setWorkspaces,
    setTopSources,
    setTopTopics,
    setMentions,
    setAlerts,
    setLeads,
    setLabelChangeRequests,
    setTrendData,
    setLoading,
    setError,
    filters,
  } = useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch raw data từ Firestore (không giới hạn records)
      const rawData =
        await DashboardService.fetchRawData();
      const workspaces = filterByBusinessPolicy(
        rawData.workspaces.map((workspace) => ({
          ...workspace,
          brand: workspace.brand_name,
        })),
        profile,
        "view_dashboard",
      );
      const mentions = filterByBusinessPolicy(rawData.mentions, profile, "view_mentions");
      const alerts = filterByBusinessPolicy(rawData.alerts, profile, "view_crisis_queue");
      const leads = filterByBusinessPolicy(rawData.leads, profile, "view_leads");

      // 2. Aggregations từ toàn bộ dữ liệu
      const stats = DashboardService.calculateStats(mentions, alerts, leads);
      const topSources = DashboardService.calculateTopSources(mentions);
      const topTopics = DashboardService.calculateTopTopics(mentions);
      const trendData = DashboardService.calculateSentimentTrend(mentions, filters.time_range);

      // 3. Nạp vào Zustand store
      setWorkspaces(workspaces);
      setMentions(mentions);
      setAlerts(alerts);
      setLeads(leads);
      setLabelChangeRequests(
        filterByBusinessPolicy(
          rawData.labelChangeRequests,
          profile,
          "view_leads",
        ),
      );
      setStats(stats);
      setTopSources(topSources);
      setTopTopics(topTopics);
      setTrendData(trendData);

      setError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể kết nối Firestore";
      setError(message);
      console.error("[useDashboard] fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetch || authLoading) return;
    fetchDashboardData();
    setIsInitialized(true);
    const interval = setInterval(fetchDashboardData, refetchInterval);
    return () => clearInterval(interval);
  }, [autoFetch, refetchInterval, authLoading, profile?.brandId, profile?.brandName, profile?.role]);

  // Re-tính trend data khi time_range filter thay đổi
  useEffect(() => {
    const mentions = useDashboardStore.getState().mentions;
    if (mentions.length === 0) return;
    const trend = DashboardService.calculateSentimentTrend(mentions, filters.time_range);
    setTrendData(trend);
  }, [filters.time_range]);

  return {
    isInitialized,
    refetch: fetchDashboardData,
  };
}
