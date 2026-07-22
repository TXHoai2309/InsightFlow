"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { filterOperationalLeads } from "@/lib/operational-metrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DEMO_PROFILE, DEMO_MOCK_LEADS } from "@/lib/demo-mock-data";

export function useLeadMonitoringLeads() {
  const { profile: realProfile } = useAuth();
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo") ?? false;
  const profile = realProfile || (isDemo ? DEMO_PROFILE : null);
  const { leads: storeLeads, filters } = useDashboardStore();

  return useMemo(
    () => {
      if (isDemo && storeLeads.length === 0) return DEMO_MOCK_LEADS;
      return filterOperationalLeads(storeLeads, {
        profile,
        workspaceId: filters.workspace_id,
        platform: filters.platform,
      });
    },
    [isDemo, filters.platform, filters.workspace_id, storeLeads, profile],
  );
}
