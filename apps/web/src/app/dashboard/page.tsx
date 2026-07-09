/**
 * /brand-manager — Trang Tổng quan Thương hiệu (Task 1)
 * Dành riêng cho vai trò Brand Manager.
 */

"use client";

import React from "react";
import { BrandManagerDashboard } from "@/components/brand-manager";
import { useDashboard } from "@/hooks/useDashboardData";

export default function BrandManagerPage() {
  useDashboard({
    autoFetch: true,
    refetchInterval: 30 * 60 * 1000,
    dataWindowDays: 30,
    maxMentions: 400,
    maxLeads: 200,
    excludePlatforms: ["news"],
    initialFetchDelayMs: 500,
  });

  return (
    <>
      <BrandManagerDashboard />
    </>
  );
}

