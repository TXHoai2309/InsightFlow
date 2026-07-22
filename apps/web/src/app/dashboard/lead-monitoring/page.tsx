"use client";

import React, { useEffect } from "react";
import { LeadPriorityOverview } from "@/components/lead-monitoring/LeadPriorityOverview";
import { LeadScoreDoughnutCard } from "@/components/lead-monitoring/LeadScoreDoughnutCard";
import { LeadSourceBarCard } from "@/components/lead-monitoring/LeadSourceBarCard";
import { ResponseTimeTrendCard } from "@/components/lead-monitoring/ResponseTimeTrendCard";
import { LeadTable } from "@/components/lead-monitoring/LeadTable";
import { useDashboard } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { useDashboardStore } from "@/stores/dashboard.store";
import { DEMO_PROFILE } from "@/lib/demo-mock-data";

export default function DashboardLeadMonitoringPage() {
  const { profile: realProfile } = useAuth();
  const isDemo = typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
  const profile = realProfile || (isDemo ? DEMO_PROFILE : null);
  const { workspaces, filters, leads, isLoading, error, setFilters } = useDashboardStore();

  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0) return;
    if (filters.workspace_id !== "all") return;

    const profileBrandKey = normalizeBrandName(profile.brandName || profile.brandId || "");
    const scopedWorkspace = workspaces.find(
      (workspace) =>
        normalizeBrandName(workspace.id) === profileBrandKey ||
        normalizeBrandName(workspace.brand_name) === profileBrandKey,
    );

    setFilters({
      workspace_id:
        scopedWorkspace?.id || profile.brandId || profile.brandName || "all",
    });
  }, [
    filters.workspace_id,
    profile,
    profile?.brandId,
    profile?.brandName,
    setFilters,
    workspaces,
  ]);

  return (
    <div data-tour="dashboard-lead-monitoring" className="w-full space-y-6">
      {isLoading && leads.length === 0 ? (
        <div className="rounded-[12px] border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-[#1A1B20] px-5 py-4 text-[14px] font-semibold text-[#474554] dark:text-gray-400 shadow-sm dark:shadow-none">
          Đang tải dữ liệu báo cáo lead...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[12px] border border-[#FFDAD6] dark:border-red-500/30 bg-[#FFF4F2] dark:bg-red-500/20 px-5 py-4 text-[14px] font-semibold text-[#BA1A1A] dark:text-red-400 shadow-sm dark:shadow-none">
          {error}
        </div>
      ) : null}

      <section data-tour="dashboard-lead-monitoring-priority">
        <LeadPriorityOverview />
      </section>

      <section data-tour="dashboard-lead-monitoring-metrics" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LeadScoreDoughnutCard />
        <LeadSourceBarCard />
        <ResponseTimeTrendCard />
      </section>

      <section data-tour="dashboard-lead-monitoring-table">
        <LeadTable />
      </section>
    </div>
  );
}
