"use client";

import { useLayoutEffect } from "react";
import { buildDemoAlertData, useAlertStore } from "@/stores/alert.store";
import AlertsPage from "@/app/alerts/page";

export default function DemoAlertsPage() {
  useLayoutEffect(() => {
    const demoAlerts = buildDemoAlertData();
    useAlertStore.setState({
      rawAlerts: demoAlerts,
      alerts: demoAlerts,
      brands: ["Demo Brand"],
      filters: { brand: "all", status: "all", severity: "all" },
      isLoading: false,
      error: null,
      lastFetchedAt: Date.now(),
    });
  }, []);

  return <AlertsPage />;
}
