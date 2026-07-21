"use client";

import React from "react";
import { BMTabs } from "@/components/brand-manager";
import { useDashboard } from "@/hooks/useDashboardData";

export default function DemoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tải trước và lưu vào cache bộ dữ liệu mẫu một cách nhanh chóng
  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  return (
    <>
      <BMTabs />
      <div className="mt-4">
        {children}
      </div>
    </>
  );
}
