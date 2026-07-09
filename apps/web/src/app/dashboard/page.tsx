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
<<<<<<< HEAD
    refetchInterval: 1800000, // Làm mới mỗi 30 phút
=======
    refetchInterval: 30 * 60 * 1000,
    dataWindowDays: 30,
    maxMentions: 400,
    maxLeads: 200,
    excludePlatforms: ["news"],
    initialFetchDelayMs: 500,
>>>>>>> d592e20f68c854b34c4a446ec42f6c71814aeb4a
  });

  return (
    <>
      <BrandManagerDashboard />
    </>
  );
}

