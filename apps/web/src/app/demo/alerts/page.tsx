"use client";

import dynamic from "next/dynamic";

const AlertsPage = dynamic(() => import("@/app/alerts/page"), { ssr: false });

export default function DemoAlertsPage() {
  return <AlertsPage />;
}
