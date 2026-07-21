"use client";

import React from "react";
import { BMTabs } from "@/components/brand-manager";
import { BMLayoutHeader } from "@/components/brand-manager/BMLayoutHeader";

export default function DemoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <BMLayoutHeader />
      <BMTabs />
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
