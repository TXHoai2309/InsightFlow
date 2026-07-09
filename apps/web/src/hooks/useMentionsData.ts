"use client";

import { useEffect, useState } from "react";
import { DashboardService } from "@/lib/services/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";
import { filterByBusinessPolicy, getScopedBrandKey } from "@/lib/brandScope";
import { useAuth } from "@/hooks/useAuth";

interface UseMentionsOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

const MENTION_FETCH_WINDOW_DAYS = 30;
const MENTION_FETCH_LIMIT = 700;

export function useMentionsData(options: UseMentionsOptions = {}) {
  const { autoFetch = true, refetchInterval = 1800000 } = options;
  const { profile, loading: authLoading } = useAuth();
  const {
    setMentions,
    setWorkspaces,
    setStats,
    setAlerts,
    setLeads,
    setLoading,
    setError,
    lastFetchedAtMap,
    setLastFetchedAt,
  } = useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchMentions = async (force: boolean = false) => {
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
            setMentions(data.mentions || []);
            setWorkspaces(data.workspaces || []);
            setAlerts(data.alerts || []);
            setLeads(data.leads || []);
            setStats(data.stats);
            setError(null);
            hasRenderedCache = true;

            const CACHE_DURATION = 90 * 1000; // 90 seconds fresh cache window
            if (Date.now() - timestamp < CACHE_DURATION) {
              setLastFetchedAt(brandKey, timestamp);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.warn("[useMentionsData] Parse cache error:", cacheError);
          }
        }
      }

      // If we don't have cached data to show immediately, display the loader
      if (!hasRenderedCache) {
        setLoading(true);
      }

      const rawBrandKey = brandKey === "global" ? undefined : brandKey;
      const since = new Date(
        Date.now() - MENTION_FETCH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      const rawData = await DashboardService.fetchRawData({
        brandKey: rawBrandKey,
        since,
        maxMentions: MENTION_FETCH_LIMIT,
        excludePlatforms: ["news"],
      });
      const mentions = filterByBusinessPolicy(rawData.mentions, profile, "view_mentions");
      const workspaces = filterByBusinessPolicy(
        rawData.workspaces.map((workspace) => ({
          ...workspace,
          brand: workspace.brand_name,
        })),
        profile,
        "view_mentions",
      );
      const alerts = filterByBusinessPolicy(rawData.alerts, profile, "view_crisis_queue");
      const leads = filterByBusinessPolicy(rawData.leads, profile, "view_leads");

      const stats = DashboardService.calculateStats(mentions, alerts, leads);

      setMentions(mentions);
      setWorkspaces(workspaces);
      setAlerts(alerts);
      setLeads(leads);
      setStats(stats);

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
                stats,
              },
            }),
          );
        } catch (saveCacheError) {
          console.warn("[useMentionsData] Save cache error:", saveCacheError);
        }
      }

      setLastFetchedAt(brandKey, Date.now());
      setError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu mentions";
      setError(message);
      console.error("[useMentionsData] fetch error:", error);
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
      fetchMentions();
    }
    setIsInitialized(true);

    const interval = setInterval(fetchMentions, refetchInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, refetchInterval, authLoading, profile?.brandId, profile?.brandName, profile?.role]);

  return {
    isInitialized,
    refetch: fetchMentions,
  };
}
