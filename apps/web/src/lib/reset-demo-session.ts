"use client";

import { clearDemoAlertWorkflowSession } from "@/lib/demo-alert-session";
import { buildDemoAlertData, useAlertStore } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";

const EMPTY_DASHBOARD_STATS = {
  total_mentions: 0,
  positive_count: 0,
  negative_count: 0,
  neutral_count: 0,
  net_sentiment: 0,
  hot_leads_today: 0,
  alerts_today: 0,
  trending_spike: 0,
};

/**
 * Ends the current Demo session without touching Firebase authentication or
 * production caches. This must only run for an explicit Demo logout/exit.
 */
export function resetDemoClientSession() {
  clearDemoAlertWorkflowSession();

  const initialAlerts = buildDemoAlertData();
  const initialBrands = Array.from(
    new Set(initialAlerts.map((alert) => alert.brand)),
  ).sort();

  // Reset synchronously before routing away. This also prevents browser Back
  // from briefly restoring the workflow state of the session that just ended.
  useAlertStore.setState({
    rawAlerts: initialAlerts,
    alerts: initialAlerts,
    brands: initialBrands,
    lastFetchedAt: 0,
    isLoading: false,
    error: null,
    correctionRequests: [],
    isLoadingRequests: false,
    recentLocks: {},
    filters: {
      brand: "all",
      status: "all",
      severity: "all",
    },
  });

  useDashboardStore.setState({
    stats: EMPTY_DASHBOARD_STATS,
    workspaces: [],
    mentions: [],
    alerts: [],
    leads: [],
    labelChangeRequests: [],
    topSources: [],
    topTopics: [],
    trendData: [],
    lastFetchedAtMap: {},
    isLoading: false,
    error: null,
  });
  useDashboardStore.getState().resetFilters();
}
