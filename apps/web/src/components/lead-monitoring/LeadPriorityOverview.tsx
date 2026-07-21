"use client";

import React, { useMemo } from "react";
import { AlertTriangle, Clock3, Flame, UserPlus } from "lucide-react";
import { getLeadWorkbenchMeta } from "@/lib/lead-workbench";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";

const cardStyles = {
  new: {
    icon: UserPlus,
    label: "Tổng lead",
    tone: "border-[#E2DFFF] bg-[#F7F5FF] text-[#4234B6] dark:border-[#4234B6]/30 dark:bg-[#4234B6]/10 dark:text-[#9B8CFF]",
    iconTone: "bg-[#E2DFFF] text-[#4234B6] dark:bg-[#4234B6]/30 dark:text-[#9B8CFF]",
  },
  hot: {
    icon: Flame,
    label: "Hot chưa xử lý",
    tone: "border-[#FFE2C7] bg-[#FFF8F0] text-[#A14A00] dark:border-[#A14A00]/30 dark:bg-[#A14A00]/10 dark:text-orange-400",
    iconTone: "bg-[#FFE2C7] text-[#A14A00] dark:bg-[#A14A00]/30 dark:text-orange-400",
  },
  overdue: {
    icon: AlertTriangle,
    label: "Quá SLA",
    tone: "border-[#FFDAD6] bg-[#FFF4F2] text-[#BA1A1A] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
    iconTone: "bg-[#FFDAD6] text-[#BA1A1A] dark:bg-red-500/30 dark:text-red-400",
  },
  unassigned: {
    icon: Clock3,
    label: "Chưa gán Sale",
    tone: "border-[#D7F4E2] bg-[#F3FCF6] text-[#147A3F] dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400",
    iconTone: "bg-[#D7F4E2] text-[#147A3F] dark:bg-green-500/30 dark:text-green-400",
  },
};

export function LeadPriorityOverview() {
  const leads = useLeadMonitoringLeads();

  const metrics = useMemo(() => {
    const nowMs = Date.now();
    const pending = leads.filter((lead) => lead.status === "new" || lead.status === "processing");

    return {
      new: leads.filter((lead) => lead.status === "new").length,
      hot: pending.filter((lead) => lead.intent === "hot").length,
      overdue: pending.filter((lead) => getLeadWorkbenchMeta(lead, nowMs).isOverdue).length,
      unassigned: pending.filter((lead) => !lead.owner_id).length,
    };
  }, [leads]);

  const items = [
    { key: "new", value: leads.length, hint: "Tất cả lead trong kỳ" },
    { key: "hot", value: metrics.hot, hint: "Ưu tiên kiểm tra tư vấn" },
    { key: "overdue", value: metrics.overdue, hint: "Có nguy cơ mất khách" },
    { key: "unassigned", value: metrics.unassigned, hint: "Cần chia cho nhân sự" },
  ] as const;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const style = cardStyles[item.key];
        const Icon = style.icon;

        return (
          <div
            key={item.key}
            className={`rounded-[12px] border px-4 py-4 shadow-sm ${style.tone}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#474554] dark:text-gray-400">
                  {style.label}
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-sans text-[30px] font-bold leading-none">
                    {item.value}
                  </span>
                  <span className="pb-1 text-[12px] font-semibold text-[#787585] dark:text-gray-500">
                    lead
                  </span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-[#474554] dark:text-gray-400">
                  {item.hint}
                </p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${style.iconTone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
