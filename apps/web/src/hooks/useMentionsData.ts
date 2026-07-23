"use client";

import { useEffect, useState } from "react";
import { DashboardService } from "@/lib/services/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";
import { filterByBusinessPolicy, getScopedBrandKey } from "@/lib/brandScope";
import { useAuth } from "@/hooks/useAuth";
import { isDemoRuntime } from "@/lib/demo-navigation";
import { canLeadBeVisibleToUser } from "@/lib/lead-workbench";

interface UseMentionsOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

const DASHBOARD_CACHE_PREFIX = "insightflow_dashboard_cache_";
const DASHBOARD_CACHE_VERSION = "v6";

// Module-level in-memory cache time tracking to avoid duplicate fetching during menu transitions


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
      const profileKey = profile?.uid || profile?.role || "anonymous";
      const fetchScopeKey = `${DASHBOARD_CACHE_VERSION}:${brandKey}:${profileKey}`;
      const cacheKey = `${DASHBOARD_CACHE_PREFIX}${DASHBOARD_CACHE_VERSION}_${brandKey}_${profileKey}`;
      let hasRenderedCache = false;

      // Check client-side localStorage cache if not forcing refresh
      if (!force && !isDemoRuntime() && typeof window !== "undefined") {
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

            const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes fresh cache window
            const hasCachedMentions = data.mentions && data.mentions.length > 0;
            if (hasCachedMentions && Date.now() - timestamp < CACHE_DURATION) {
              setLastFetchedAt(fetchScopeKey, timestamp);
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
      const rawData = await DashboardService.fetchRawData(
        { brandKey: rawBrandKey, maxMentions: 1000 },
        profile,
      );
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
      const leads = filterByBusinessPolicy(rawData.leads, profile, "view_leads")
        .filter((lead) => canLeadBeVisibleToUser(lead, profile));

      const stats = DashboardService.calculateStats(mentions, alerts, leads);

      setMentions(mentions);
      setWorkspaces(workspaces);
      setAlerts(alerts);
      setLeads(leads);
      setStats(stats);

      // Save to localStorage cache
      if (!isDemoRuntime() && typeof window !== "undefined") {
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

      setLastFetchedAt(fetchScopeKey, Date.now());
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
    const profileKey = profile?.uid || profile?.role || "anonymous";
    const fetchScopeKey = `${DASHBOARD_CACHE_VERSION}:${brandKey}:${profileKey}`;
    const lastFetched = lastFetchedAtMap[fetchScopeKey] || 0;
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache window

    // Only fetch if we don't have data in the Zustand store or it is older than 30 minutes
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
