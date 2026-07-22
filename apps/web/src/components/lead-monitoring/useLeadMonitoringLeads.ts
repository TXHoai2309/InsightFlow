"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { filterLeadsForDashboard } from "@/lib/lead-metrics";
import { canLeadBeVisibleToUser } from "@/lib/lead-workbench";
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
      if (isDemo) return DEMO_MOCK_LEADS;
      const activeFilters = { ...filters, time_range: "all" as const };
      const filtered = filterLeadsForDashboard(storeLeads, activeFilters);
      return filtered.filter((lead) => canLeadBeVisibleToUser(lead, profile));
    },
    [isDemo, filters, storeLeads, profile],
  );
}
