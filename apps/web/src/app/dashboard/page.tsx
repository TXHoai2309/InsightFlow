/**
 * /brand-manager — Trang Tổng quan Thương hiệu (Task 1)
 * Dành riêng cho vai trò Brand Manager.
 */

"use client";

import React from "react";
import dynamic from "next/dynamic";

const BrandManagerDashboard = dynamic(
  () => import("@/components/brand-manager").then((mod) => mod.BrandManagerDashboard),
  { ssr: false }
);

export default function BrandManagerPage() {
  return (
    <>
      <BrandManagerDashboard />
    </>
  );
}

