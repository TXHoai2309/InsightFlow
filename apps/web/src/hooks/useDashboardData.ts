/**
 * useDashboard Hook
 * Fetch dữ liệu từ Firestore, tính aggregations, nạp vào Zustand store
 */

"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DashboardService } from "@/lib/services/dashboard";
import { filterByBusinessPolicy, getScopedBrandKey } from "@/lib/brandScope";
import { useAuth } from "@/hooks/useAuth";

interface UseDashboardOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

// Module-level in-memory cache time tracking to avoid duplicate fetching during menu transitions


export function useDashboard(options: UseDashboardOptions = {}) {
  const { autoFetch = true, refetchInterval = 1800000 } = options;
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
    lastFetchedAtMap,
    setLastFetchedAt,
  } = useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchDashboardData = async (force: boolean = false) => {
    try {
      const brandKey = getScopedBrandKey(profile) || "global";
      const cacheKey = `insightflow_dashboard_cache_${brandKey}`;
      let hasRenderedCache = false;

      // Check client-side localStorage cache if not forcing refresh
      if (!force && typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { timestamp, data } = JSON.parse(cached);
            setWorkspaces(data.workspaces || []);
            setMentions(data.mentions || []);
            setAlerts(data.alerts || []);
            setLeads(data.leads || []);
            setLabelChangeRequests(data.labelChangeRequests || []);
            setStats(data.stats);
            setTopSources(data.topSources || []);
            setTopTopics(data.topTopics || []);
            setTrendData(data.trendData || []);
            setError(null);
            hasRenderedCache = true;

            const CACHE_DURATION = 90 * 1000; // 90 seconds fresh cache window
            if (Date.now() - timestamp < CACHE_DURATION) {
              setLastFetchedAt(brandKey, timestamp);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.warn("[useDashboard] Parse cache error:", cacheError);
          }
        }
      }

      // If we don't have cached data to show immediately, display the blocking loader
      if (!hasRenderedCache) {
        setLoading(true);
      }

      // 1. Fetch raw data từ Firestore (lọc theo brand nếu có)
      const rawBrandKey = brandKey === "global" ? undefined : brandKey;
      const rawData =
        await DashboardService.fetchRawData({ brandKey: rawBrandKey });
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

      const labelChangeRequests = filterByBusinessPolicy(
        rawData.labelChangeRequests,
        profile,
        "view_leads",
      );

      // 3. Nạp vào Zustand store
      setWorkspaces(workspaces);
      setMentions(mentions);
      setAlerts(alerts);
      setLeads(leads);
      setLabelChangeRequests(labelChangeRequests);
      setStats(stats);
      setTopSources(topSources);
      setTopTopics(topTopics);
      setTrendData(trendData);

      // Save to localStorage cache
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              data: {
                workspaces,
                mentions,
                alerts,
                leads,
                labelChangeRequests,
                stats,
                topSources,
                topTopics,
                trendData,
              },
            }),
          );
        } catch (saveCacheError) {
          console.warn("[useDashboard] Save cache error:", saveCacheError);
        }
      }

      setLastFetchedAt(brandKey, Date.now());
      setError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể kết nối Firestore";
      
      console.error("[useDashboard] fetch error:", error);

      // Fallback: If DB errors, keep old data in store or load from localStorage cache
      let loadedFromCache = false;
      if (typeof window !== "undefined") {
        try {
          const currentMentions = useDashboardStore.getState().mentions;
          const hasDataInStore = currentMentions && currentMentions.length > 0;

          if (!hasDataInStore) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const { data } = JSON.parse(cached);
              setWorkspaces(data.workspaces || []);
              setMentions(data.mentions || []);
              setAlerts(data.alerts || []);
              setLeads(data.leads || []);
              setLabelChangeRequests(data.labelChangeRequests || []);
              setStats(data.stats);
              setTopSources(data.topSources || []);
              setTopTopics(data.topTopics || []);
              setTrendData(data.trendData || []);
              loadedFromCache = true;
            }
          } else {
            loadedFromCache = true;
          }
        } catch (cacheError) {
          console.warn("[useDashboard] Lỗi tải cache fallback khi DB lỗi:", cacheError);
        }
      }

      if (loadedFromCache) {
        setError("Lỗi kết nối cơ sở dữ liệu. Đang hiển thị dữ liệu lưu trữ cũ.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetch || authLoading) return;

    const brandKey = getScopedBrandKey(profile) || "global";
    const lastFetched = lastFetchedAtMap[brandKey] || 0;
    const CACHE_DURATION = 90 * 1000; // 90 seconds cache window

    // Only fetch if we don't have data in the Zustand store or it is older than 90 seconds
    const hasData = useDashboardStore.getState().mentions.length > 0;
    if (!hasData || Date.now() - lastFetched >= CACHE_DURATION) {
      fetchDashboardData();
    }

    setIsInitialized(true);
    const interval = setInterval(() => fetchDashboardData(), refetchInterval);
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
    refetch: (force?: boolean) => fetchDashboardData(force),
  };
}
