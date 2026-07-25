"use client";

import { BMTabs } from "@/components/brand-manager";
import { BMLayoutHeader } from "@/components/brand-manager/BMLayoutHeader";
import { BrandManagerDashboard } from "@/components/brand-manager/BrandManagerDashboard";

export default function DemoPage() {
  return (
    <div data-tour="demo-overview" className="mx-auto max-w-[1600px] p-4 md:p-8">
      <BMLayoutHeader demoMode />
      <BMTabs />
      <div className="mt-4">
        <BrandManagerDashboard />
      </div>
    </div>
  );
}
