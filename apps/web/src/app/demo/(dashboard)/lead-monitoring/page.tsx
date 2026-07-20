"use client";

import React from "react";
import dynamic from "next/dynamic";

const DashboardLeadMonitoringPage = dynamic(
  () => import("@/app/dashboard/lead-monitoring/page"),
  { ssr: false }
);

export default function DemoLeadMonitoringPage() {
  return (
    <div className="mt-4">
      <DashboardLeadMonitoringPage />
    </div>
  );
}
