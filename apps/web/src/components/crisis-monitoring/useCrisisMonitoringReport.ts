"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { buildCrisisReportData } from "@/lib/crisis-report";
import {
  DEFAULT_CRISIS_REPORT_FILTERS,
  filterCrisisReportItems,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import { useAlertStore } from "@/stores/alert.store";
import { buildCrisisEmployeeReportData } from "@/lib/crisis-employee-report";
import { DEMO_PROFILE, DEMO_MOCK_ALERTS } from "@/lib/demo-mock-data";

export function useCrisisMonitoringReport(filters: CrisisReportFilters = DEFAULT_CRISIS_REPORT_FILTERS) {
  const { profile: realProfile } = useAuth();
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo") ?? false;
  const profile = realProfile || (isDemo ? DEMO_PROFILE : null);
  const storeRawAlerts = useAlertStore((state) => state.rawAlerts);
  const rawAlerts = isDemo ? DEMO_MOCK_ALERTS : storeRawAlerts;

  return useMemo(
    () => buildCrisisReportData(filterCrisisReportItems(rawAlerts, filters), profile),
    [filters, isDemo, rawAlerts, profile],
  );
}

export function useCrisisEmployeeReport(
  filters: CrisisReportFilters = DEFAULT_CRISIS_REPORT_FILTERS,
) {
  const { profile: realProfile } = useAuth();
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo") ?? false;
  const profile = realProfile || (isDemo ? DEMO_PROFILE : null);
  const storeRawAlerts = useAlertStore((state) => state.rawAlerts);
  const rawAlerts = isDemo ? DEMO_MOCK_ALERTS : storeRawAlerts;

  return useMemo(
    () => buildCrisisEmployeeReportData(rawAlerts, filters, profile),
    [filters, isDemo, rawAlerts, profile],
  );
}
