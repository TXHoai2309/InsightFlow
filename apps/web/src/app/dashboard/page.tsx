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
    refetchInterval: 60000, // Làm mới mỗi 60 giây
  });

  return (
    <>
      <BrandManagerDashboard />
    </>
  );
}
