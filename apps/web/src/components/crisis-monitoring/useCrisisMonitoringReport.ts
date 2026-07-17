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

export function useCrisisMonitoringReport(filters: CrisisReportFilters = DEFAULT_CRISIS_REPORT_FILTERS) {
  const { profile } = useAuth();
  const rawAlerts = useAlertStore((state) => state.rawAlerts);

  return useMemo(
    () => buildCrisisReportData(filterCrisisReportItems(rawAlerts, filters), profile),
    [filters, rawAlerts, profile],
  );
}

export function useCrisisEmployeeReport(
  filters: CrisisReportFilters = DEFAULT_CRISIS_REPORT_FILTERS,
) {
  const { profile } = useAuth();
  const rawAlerts = useAlertStore((state) => state.rawAlerts);

  return useMemo(
    () => buildCrisisEmployeeReportData(rawAlerts, filters, profile),
    [filters, rawAlerts, profile],
  );
}
