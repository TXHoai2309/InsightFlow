"use client";

import React from "react";
import { BMTabs } from "@/components/brand-manager";
import { useDashboard } from "@/hooks/useDashboardData";
import { BMLayoutHeader } from "@/components/brand-manager/BMLayoutHeader";

export default function BrandManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000, // Làm mới mỗi 30 phút
  });

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

