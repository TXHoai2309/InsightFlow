"use client";

import dynamic from "next/dynamic";

const ReportsPage = dynamic(() => import("@/app/reports/page"), { ssr: false });

export default function DemoReportsPage() {
  return <ReportsPage />;
}
