"use client";

import React from "react";
import { AISummaryBanner } from "@/components/lead-monitoring/AISummaryBanner";
import { LeadScoreDoughnutCard } from "@/components/lead-monitoring/LeadScoreDoughnutCard";
import { LeadSourceBarCard } from "@/components/lead-monitoring/LeadSourceBarCard";
import { ResponseTimeTrendCard } from "@/components/lead-monitoring/ResponseTimeTrendCard";
import { LeadTable } from "@/components/lead-monitoring/LeadTable";

export default function DashboardLeadMonitoringPage() {
  return (
    <div className="w-full space-y-6">
      {/* AI Summary Banner */}
      <section>
        <AISummaryBanner />
      </section>

      {/* Analytics Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LeadScoreDoughnutCard />
        <LeadSourceBarCard />
        <ResponseTimeTrendCard />
      </section>

      {/* Lead Table */}
      <section>
        <LeadTable />
      </section>
    </div>
  );
}
