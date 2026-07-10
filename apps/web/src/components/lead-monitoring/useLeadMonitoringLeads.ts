"use client";

import { useMemo } from "react";
import { filterLeadsForDashboard } from "@/lib/lead-metrics";
import { canLeadBeVisibleToUser } from "@/lib/lead-workbench";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/stores/dashboard.store";

export function useLeadMonitoringLeads() {
  const { profile } = useAuth();
  const { leads, filters } = useDashboardStore();

  return useMemo(
    () =>
      filterLeadsForDashboard(leads, { ...filters, time_range: "all" }).filter((lead) =>
        canLeadBeVisibleToUser(lead, profile),
      ),
    [filters, leads, profile],
  );
}
