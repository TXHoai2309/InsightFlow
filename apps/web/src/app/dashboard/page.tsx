/**
 * /brand-manager — Trang Tổng quan Thương hiệu (Task 1)
 * Dành riêng cho vai trò Brand Manager.
 */

"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDashboard } from "@/hooks/useDashboardData";

const BrandManagerDashboard = dynamic(
  () => import("@/components/brand-manager").then((mod) => mod.BrandManagerDashboard),
  { ssr: false }
);

export default function BrandManagerPage() {
  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000, // Làm mới mỗi 30 phút
    dataWindowDays: 30,
    maxMentions: 400,
    maxLeads: 200,
    initialFetchDelayMs: 500,
  });

  return (
    <>
      <BrandManagerDashboard />
    </>
  );
}

