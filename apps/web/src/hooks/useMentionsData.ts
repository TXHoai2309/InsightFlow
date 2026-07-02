"use client";

import { useEffect, useState } from "react";
import { DashboardService } from "@/lib/services/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";
import { filterByBrandScope } from "@/lib/brandScope";
import { useAuth } from "@/hooks/useAuth";

interface UseMentionsOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export function useMentionsData(options: UseMentionsOptions = {}) {
  const { autoFetch = true, refetchInterval = 60000 } = options;
  const { profile, loading: authLoading } = useAuth();
  const {
    setMentions,
    setWorkspaces,
    setStats,
    setAlerts,
    setLeads,
    setLoading,
    setError,
  } = useDashboardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchMentions = async () => {
    setLoading(true);
    try {
      const rawData =
        await DashboardService.fetchRawData();
      const mentions = filterByBrandScope(rawData.mentions, profile);
      const workspaces = filterByBrandScope(rawData.workspaces.map((workspace) => ({
        ...workspace,
        brand: workspace.brand_name,
      })), profile);
      const alerts = filterByBrandScope(rawData.alerts, profile);
      const leads = filterByBrandScope(rawData.leads, profile);

      setMentions(mentions);
      setWorkspaces(workspaces);
      setAlerts(alerts);
      setLeads(leads);
      setStats(DashboardService.calculateStats(mentions, alerts, leads));
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

    fetchMentions();
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
