"use client";

import React from "react";
import { AICrisisAlertBanner } from "@/components/crisis-monitoring/AICrisisAlertBanner";
import { NegativeTrendCard } from "@/components/crisis-monitoring/NegativeTrendCard";
import { AngryTopicsCard } from "@/components/crisis-monitoring/AngryTopicsCard";
import { SLAGaugeCard } from "@/components/crisis-monitoring/SLAGaugeCard";
import { CrisisTable } from "@/components/crisis-monitoring/CrisisTable";

export default function InsightsPage() {
  return (
    <div className="w-full space-y-6">
      <section>
        <AICrisisAlertBanner />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NegativeTrendCard />
        <AngryTopicsCard />
        <SLAGaugeCard />
      </section>

      <section>
        <CrisisTable />
      </section>
    </div>
  );
}
