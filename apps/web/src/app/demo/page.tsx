"use client";

import dynamic from "next/dynamic";
import { BMTabs } from "@/components/brand-manager";
import { BMLayoutHeader } from "@/components/brand-manager/BMLayoutHeader";

const BrandManagerDashboard = dynamic(
  () =>
    import("@/components/brand-manager/BrandManagerDashboard").then(
      (mod) => mod.BrandManagerDashboard,
    ),
  { ssr: false },
);

export default function DemoPage() {
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <BMLayoutHeader />
      <BMTabs />
      <div className="mt-4">
        <BrandManagerDashboard />
      </div>
    </div>
  );
}
