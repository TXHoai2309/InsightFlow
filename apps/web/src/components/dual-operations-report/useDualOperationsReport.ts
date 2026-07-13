"use client";

import { useMemo } from "react";
import { buildDualOperationsReportData } from "@/lib/dual-operations-report";
import { useCrisisMonitoringReport } from "@/components/crisis-monitoring/useCrisisMonitoringReport";
import { useLeadMonitoringReport } from "@/components/lead-monitoring/useLeadMonitoringReport";

export function useDualOperationsReport() {
  const leadReport = useLeadMonitoringReport();
  const crisisReport = useCrisisMonitoringReport();

  return useMemo(
    () => buildDualOperationsReportData(leadReport, crisisReport),
    [leadReport, crisisReport],
  );
}
