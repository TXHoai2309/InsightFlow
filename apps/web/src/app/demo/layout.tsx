"use client";

import { useDashboard } from "@/hooks/useDashboardData";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  useDashboard({
    autoFetch: true,
    refetchInterval: 1800000,
  });

  return children;
}
