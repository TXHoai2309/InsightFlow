"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useAlertStore } from "@/stores/alert.store";
import { filterLeadsForDashboard } from "@/lib/lead-metrics";
import { useTranslation } from "react-i18next";

export function BMTabs() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const { leads, filters } = useDashboardStore();
  const alertsCount = useAlertStore((state) => state.rawAlerts.length);
  const leadsCount = useMemo(
    () => filterLeadsForDashboard(leads, filters).length,
    [filters, leads],
  );

  useEffect(() => setPendingHref(null), [pathname]);

  const tabs = [
    { href: "/dashboard", label: t("bm.tabs.overview", "Tổng quan") },
    { href: "/dashboard/insights", label: t("bm.tabs.crisis", "Crisis Monitoring"), count: alertsCount },
    { href: "/dashboard/lead-monitoring", label: t("bm.tabs.lead", "Lead Monitoring"), count: leadsCount },
  ];

  return (
    <div className="flex w-full items-center space-x-1 border-b border-[#C8C4D6] dark:border-gray-800 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const isCrisisTab = tab.href === "/dashboard/insights";
        const isLeadTab = tab.href === "/dashboard/lead-monitoring";
        
        // Active color logic based on which tab it is
        let activeColorClass = "text-[#4234B6]";
        let activeBgClass = "bg-[#4234B6]";
        
        if (isCrisisTab) {
          activeColorClass = "text-[#BA1A1A]";
          activeBgClass = "bg-[#BA1A1A]";
        } else if (isLeadTab) {
          activeColorClass = "text-[#5B5CEB]";
          activeBgClass = "bg-[#5B5CEB]";
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            aria-busy={pendingHref === tab.href}
            onClick={() => setPendingHref(tab.href)}
            onFocus={() => router.prefetch(tab.href)}
            onPointerEnter={() => router.prefetch(tab.href)}
            className={cn(
              "relative px-4 py-4 text-[15px] transition-colors focus:outline-none flex items-center space-x-2",
              isActive 
                ? cn(activeColorClass, "font-bold")
                : "text-[#474554] font-medium hover:text-[#1A1B20] dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  isActive 
                    ? cn(activeBgClass, "text-white")
                    : "bg-[#EEEDF4] text-[#474554] dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {tab.count}
              </span>
            )}
            
            {isActive && (
              <motion.div
                layoutId="bm-tab-indicator"
                className={cn(
                  "absolute bottom-[-1px] left-0 right-0 h-[2px]",
                  activeBgClass
                )}
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
