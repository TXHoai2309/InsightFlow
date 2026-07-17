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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#C8C4D6] bg-[#FFFFFF]">
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B4FCF]">
            <BarChart2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-sans text-[24px] font-bold text-[#4234B6] tracking-tight">
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
                  ? "bg-[#F4F3FA] text-[#4234B6] font-semibold"
                  : "text-[#474554] hover:bg-[#F4F3FA] hover:text-[#1A1B20]"
              }`}
            >
              <item.icon className="h-[20px] w-[20px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E9E7EE] px-4 py-4">
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-[#474554] transition-colors hover:bg-[#F4F3FA] hover:text-[#1A1B20] mb-2"
        >
          <HelpCircle className="h-[20px] w-[20px]" />
          Hỗ trợ
        </Link>
        <div className="flex items-center gap-3 px-4 py-2">
          <UserCircle className="h-10 w-10 text-[#C8C4D6]" />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#1A1B20]">Admin User</span>
            <span className="text-[12px] font-medium text-[#787585]">Workspace Manager</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
