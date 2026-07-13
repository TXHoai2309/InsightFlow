"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildCrisisReportData } from "@/lib/crisis-report";
import { useAlertStore } from "@/stores/alert.store";

export function useCrisisMonitoringReport() {
  const { profile } = useAuth();
  const rawAlerts = useAlertStore((state) => state.rawAlerts);

  return useMemo(
    () => buildCrisisReportData(rawAlerts, profile),
    [rawAlerts, profile],
  );
}
