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
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";

export function useLeadMonitoringReport(filters: LeadReportFilters = DEFAULT_LEAD_REPORT_FILTERS) {
  const { profile } = useAuth();
  const leads = useLeadMonitoringLeads();

  return useMemo(
    () => buildLeadReportData(filterLeadReportItems(leads, filters, profile), profile),
    [filters, leads, profile],
  );
}

export function useLeadEmployeeReport(filters: LeadReportFilters = DEFAULT_LEAD_REPORT_FILTERS) {
  const { profile } = useAuth();
  const leads = useLeadMonitoringLeads();

  return useMemo(
    () => buildLeadEmployeeReportData(leads, filters, profile),
    [filters, leads, profile],
  );
}
