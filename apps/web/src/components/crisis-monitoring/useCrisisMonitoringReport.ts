"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildCrisisReportData } from "@/lib/crisis-report";
import {
  DEFAULT_CRISIS_REPORT_FILTERS,
  filterCrisisReportItems,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import { useAlertStore } from "@/stores/alert.store";
import { buildCrisisEmployeeReportData } from "@/lib/crisis-employee-report";
import { filterNegativeOperationalAlerts } from "@/lib/operational-metrics";
import { useDashboardStore } from "@/stores/dashboard.store";

function useCrisisReportItems() {
  const { profile } = useAuth();
  const rawAlerts = useAlertStore((state) => state.rawAlerts);
  const workspaceId = useDashboardStore((state) => state.filters.workspace_id);

  return useMemo(
    () => filterNegativeOperationalAlerts(
      rawAlerts,
      {
        profile,
        workspaceId,
        // Report pages own the source and time filters. Keep only the shared
        // operational scope here so their visible filter state is authoritative.
        platform: "all",
        reviewWindowDays: 36_500,
        dateBasis: "created_at",
      },
    ),
    [profile, rawAlerts, workspaceId],
  );
}

export function useCrisisMonitoringReport(filters: CrisisReportFilters = DEFAULT_CRISIS_REPORT_FILTERS) {
  const { profile } = useAuth();
  const alerts = useCrisisReportItems();

  return useMemo(
    () => buildCrisisReportData(filterCrisisReportItems(alerts, filters), profile),
    [alerts, filters, profile],
  );
}

export function useCrisisEmployeeReport(
  filters: CrisisReportFilters = DEFAULT_CRISIS_REPORT_FILTERS,
) {
  const { profile } = useAuth();
  const alerts = useCrisisReportItems();

  return useMemo(
    () => buildCrisisEmployeeReportData(alerts, filters, profile),
    [alerts, filters, profile],
  );
}
