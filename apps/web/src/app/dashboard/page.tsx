/**
 * US-13: Dashboard Page Route
 * Trang /dashboard - hiển thị Dashboard tổng quan
 */

"use client";

import React from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useDashboard } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  // Fetch dashboard data on component mount
  useDashboard({
    autoFetch: true,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  return (
    <div className="p-4 md:p-8">
      <Dashboard />
    </div>
  );
}
