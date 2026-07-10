"use client";

import React from "react";
import { AISummaryBanner } from "@/components/lead-monitoring/AISummaryBanner";
import { LeadPriorityOverview } from "@/components/lead-monitoring/LeadPriorityOverview";
import { LeadScoreDoughnutCard } from "@/components/lead-monitoring/LeadScoreDoughnutCard";
import { LeadSourceBarCard } from "@/components/lead-monitoring/LeadSourceBarCard";
import { ResponseTimeTrendCard } from "@/components/lead-monitoring/ResponseTimeTrendCard";
import { LeadTable } from "@/components/lead-monitoring/LeadTable";

export default function DashboardLeadMonitoringPage() {
  return (
    <div className="w-full space-y-6">
      <LeadPriorityOverview />

      <section>
        <AISummaryBanner />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LeadScoreDoughnutCard />
        <LeadSourceBarCard />
        <ResponseTimeTrendCard />
      </section>

      <section>
        <LeadTable />
      </section>
    </div>
  );
}
