"use client";

import React from "react";
import dynamic from "next/dynamic";

const CrisisCommandCenter = dynamic(
  () => import("@/components/crisis-monitoring/CrisisCommandCenter").then((mod) => mod.CrisisCommandCenter),
  { ssr: false }
);

export default function DemoInsightsPage() {
  return (
    <div className="mt-4">
      <CrisisCommandCenter />
    </div>
  );
}
