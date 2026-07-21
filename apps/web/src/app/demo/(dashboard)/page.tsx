"use client";

import React from "react";
import dynamic from "next/dynamic";

const BrandManagerDashboard = dynamic(
  () => import("@/components/brand-manager/BrandManagerDashboard").then((mod) => mod.BrandManagerDashboard),
  { ssr: false }
);

export default function DemoOverviewPage() {
  return (
    <div className="mt-4">
      <BrandManagerDashboard />
    </div>
  );
}
