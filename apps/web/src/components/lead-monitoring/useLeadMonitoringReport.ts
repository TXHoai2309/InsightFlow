"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildLeadReportData } from "@/lib/lead-report";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";

export function useLeadMonitoringReport() {
  const { profile } = useAuth();
  const leads = useLeadMonitoringLeads();

  return useMemo(
    () => buildLeadReportData(leads, profile),
    [leads, profile],
  );
}
