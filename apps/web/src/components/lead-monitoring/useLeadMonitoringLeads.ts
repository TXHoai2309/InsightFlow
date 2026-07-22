"use client";

import { useMemo } from "react";
import { filterOperationalLeads } from "@/lib/operational-metrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/stores/dashboard.store";

export function useLeadMonitoringLeads() {
  const { profile } = useAuth();
  const { leads, filters } = useDashboardStore();

  return useMemo(
    () => filterOperationalLeads(leads, {
      profile,
      workspaceId: filters.workspace_id,
      platform: filters.platform,
    }),
    [filters.platform, filters.workspace_id, leads, profile],
  );
}
