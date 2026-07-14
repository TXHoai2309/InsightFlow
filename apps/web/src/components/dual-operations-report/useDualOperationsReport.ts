"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildDualOperationsReportData } from "@/lib/dual-operations-report";
import { buildCrisisReportData } from "@/lib/crisis-report";
import { buildLeadReportData } from "@/lib/lead-report";
import type { CrisisReportFilters } from "@/lib/crisis-report-filters";
import type { LeadReportFilters } from "@/lib/lead-report-filters";
import { useCrisisMonitoringReport } from "@/components/crisis-monitoring/useCrisisMonitoringReport";
import { useLeadMonitoringReport } from "@/components/lead-monitoring/useLeadMonitoringReport";

export function useDualOperationsReport(options: {
  leadFilters?: LeadReportFilters;
  crisisFilters?: CrisisReportFilters;
  includeLead?: boolean;
  includeCrisis?: boolean;
} = {}) {
  const { profile } = useAuth();
  const leadReport = useLeadMonitoringReport(options.leadFilters);
  const crisisReport = useCrisisMonitoringReport(options.crisisFilters);

  return useMemo(
    () =>
      buildDualOperationsReportData(
        options.includeLead === false ? buildLeadReportData([], profile) : leadReport,
        options.includeCrisis === false ? buildCrisisReportData([], profile) : crisisReport,
      ),
    [crisisReport, leadReport, options.includeCrisis, options.includeLead, profile],
  );
}
