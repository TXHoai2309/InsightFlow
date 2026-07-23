"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildLeadReportData } from "@/lib/lead-report";
import { buildLeadEmployeeReportData } from "@/lib/lead-employee-report";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  filterLeadReportItems,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import { filterOperationalLeads } from "@/lib/operational-metrics";
import { useDashboardStore } from "@/stores/dashboard.store";

function useLeadReportItems() {
  const { profile } = useAuth();
  const leads = useDashboardStore((state) => state.leads);
  const workspaceId = useDashboardStore((state) => state.filters.workspace_id);

  return useMemo(
    () => filterOperationalLeads(leads, {
      profile,
      workspaceId,
      // Report pages own the source filter. Applying Dashboard's platform
      // filter here would create a hidden second filter and undercount rows.
      platform: "all",
    }),
    [leads, profile, workspaceId],
  );
}

export function useLeadMonitoringReport(filters: LeadReportFilters = DEFAULT_LEAD_REPORT_FILTERS) {
  const { profile } = useAuth();
  const leads = useLeadReportItems();

  return useMemo(
    () => buildLeadReportData(filterLeadReportItems(leads, filters, profile), profile),
    [filters, leads, profile],
  );
}

export function useLeadEmployeeReport(filters: LeadReportFilters = DEFAULT_LEAD_REPORT_FILTERS) {
  const { profile } = useAuth();
  const leads = useLeadReportItems();

  return useMemo(
    () => buildLeadEmployeeReportData(leads, filters, profile),
    [filters, leads, profile],
  );
}
