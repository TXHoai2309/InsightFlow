"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Bell, BarChart2, Settings, HelpCircle, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function LeadMonitoringSidebar() {
  const pathname = usePathname();

  const mainNav = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/team", label: "Quản lý đội ngũ", icon: Users },
    { href: "/crisis-monitoring", label: "Cảnh báo", icon: Bell },
    { href: "/lead-monitoring", label: "Báo cáo", icon: BarChart2 },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#C8C4D6] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#1A1B20]">
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B4FCF]">
            <BarChart2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-sans text-[24px] font-bold text-[#4234B6] dark:text-[#9B8CFF] tracking-tight">
            InsightFlow
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href === "/lead-monitoring" && pathname.startsWith("/lead-monitoring"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                isActive
                  ? "bg-[#F4F3FA] dark:bg-white/10 text-[#4234B6] dark:text-[#9B8CFF] font-semibold"
                  : "text-[#474554] dark:text-gray-400 hover:bg-[#F4F3FA] dark:hover:bg-white/5 hover:text-[#1A1B20] dark:hover:text-white"
              }`}
            >
              <item.icon className="h-[20px] w-[20px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E9E7EE] dark:border-white/10 px-4 py-4">
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-[#474554] dark:text-gray-400 transition-colors hover:bg-[#F4F3FA] dark:hover:bg-white/5 hover:text-[#1A1B20] dark:hover:text-white mb-2"
        >
          <HelpCircle className="h-[20px] w-[20px]" />
          Hỗ trợ
        </Link>
        <div className="flex items-center gap-3 px-4 py-2">
          <UserCircle className="h-10 w-10 text-[#C8C4D6] dark:text-gray-500" />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#1A1B20] dark:text-white">Admin User</span>
            <span className="text-[12px] font-medium text-[#787585] dark:text-gray-400">Workspace Manager</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
