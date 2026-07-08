"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function LeadMonitoringTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Tổng quan" },
    { href: "/crisis-monitoring", label: "Giám sát Khủng hoảng (3)" },
    { href: "/lead-monitoring", label: "Giám sát Tiềm năng (12)" },
  ];

  return (
    <div className="flex w-full items-center gap-[32px] border-b border-[#C8C4D6] px-10">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href) && tab.href !== "/dashboard";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative py-4 text-[16px] transition-colors ${
              isActive
                ? "text-[#4234B6] font-bold"
                : "text-[#474554] font-medium hover:text-[#1A1B20]"
            }`}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#4234B6]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
