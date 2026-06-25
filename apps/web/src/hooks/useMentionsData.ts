"use client";

import { useEffect, useState } from "react";
import { DashboardService } from "@/lib/services/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";

interface UseMentionsOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export function useMentionsData(options: UseMentionsOptions = {}) {
  const { autoFetch = true, refetchInterval = 60000 } = options;
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
      const { mentions, workspaces, alerts, leads } =
        await DashboardService.fetchRawData();

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
    if (!autoFetch) return;

    fetchMentions();
    setIsInitialized(true);

    const interval = setInterval(fetchMentions, refetchInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, refetchInterval]);

  return {
    isInitialized,
    refetch: fetchMentions,
  };
}
