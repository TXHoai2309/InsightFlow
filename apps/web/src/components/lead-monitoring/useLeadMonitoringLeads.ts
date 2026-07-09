"use client";

import { useMemo } from "react";
import { filterLeadsForDashboard } from "@/lib/lead-metrics";
import { useDashboardStore } from "@/stores/dashboard.store";

export function useLeadMonitoringLeads() {
  const { leads, filters } = useDashboardStore();

  return useMemo(
    () => filterLeadsForDashboard(leads, filters),
    [filters, leads],
  );
}
