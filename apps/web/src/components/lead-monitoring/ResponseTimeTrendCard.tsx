"use client";

import React, { useMemo } from "react";
import { Gauge } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getLeadWorkbenchMeta } from "@/lib/lead-workbench";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";

export function ResponseTimeTrendCard() {
  const leads = useLeadMonitoringLeads();

  const data = useMemo(() => {
    const days: Record<string, { totalMins: number; count: number }> = {};
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days[date.toLocaleDateString("vi-VN", { weekday: "short" })] = { totalMins: 0, count: 0 };
    }

    leads.forEach((lead) => {
      const contactedAt = lead.first_contacted_at || lead.last_contact_at;
      if (!contactedAt) return;
      const createdAt = new Date(lead.created_at);
      const key = createdAt.toLocaleDateString("vi-VN", { weekday: "short" });
      if (!days[key]) return;
      const diff = new Date(contactedAt).getTime() - createdAt.getTime();
      if (diff >= 0) {
        days[key].totalMins += Math.floor(diff / 60000);
        days[key].count += 1;
      }
    });

    return Object.entries(days).map(([day, value]) => ({
      day,
      minutes: value.count > 0 ? Math.round(value.totalMins / value.count) : 0,
    }));
  }, [leads]);

  const sla = useMemo(() => {
    const pending = leads.filter((lead) => lead.status === "new" || lead.status === "processing");
    const nowMs = Date.now();
    const overdue = pending.filter((lead) => getLeadWorkbenchMeta(lead, nowMs).isOverdue).length;
    const contacted = leads.filter((lead) => lead.first_contacted_at || lead.last_contact_at).length;
    const avg =
      contacted === 0
        ? 0
        : Math.round(
            leads.reduce((sum, lead) => {
              const contactedAt = lead.first_contacted_at || lead.last_contact_at;
              if (!contactedAt) return sum;
              return sum + Math.max(0, new Date(contactedAt).getTime() - new Date(lead.created_at).getTime()) / 60000;
            }, 0) / contacted,
          );

    return { overdue, avg };
  }, [leads]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-[8px] bg-[#1A1B20] px-3 py-1.5 text-[12px] font-semibold text-white shadow-md">
          {payload[0].value} phút
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-[280px] flex-col rounded-[14px] border border-[#E9E7EE] bg-white shadow-sm">
      <div className="flex items-start justify-between px-6 pb-2 pt-6">
        <div>
          <h3 className="font-['Hanken_Grotesk'] text-[14px] font-bold uppercase tracking-wide text-[#1A1B20]">
            SLA phản hồi
          </h3>
          <p className="mt-1 text-[12px] font-medium text-[#787585]">
            Mục tiêu dưới 5 phút
          </p>
        </div>
        <Gauge className="h-5 w-5 text-[#787585]" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pt-2">
        <div className="rounded-[10px] bg-[#F4F3FA] px-3 py-2">
          <p className="text-[11px] font-bold uppercase text-[#787585]">TB phản hồi</p>
          <p className="mt-1 text-[20px] font-bold text-[#1A1B20]">{sla.avg}p</p>
        </div>
        <div className="rounded-[10px] bg-[#FFF4F2] px-3 py-2">
          <p className="text-[11px] font-bold uppercase text-[#BA1A1A]">Quá SLA</p>
          <p className="mt-1 text-[20px] font-bold text-[#BA1A1A]">{sla.overdue}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#787585", fontSize: 11, fontWeight: 600 }} />
            <YAxis hide domain={[0, "dataMax + 5"]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F4F3FA" }} />
            <Bar dataKey="minutes" radius={[5, 5, 0, 0]} animationDuration={900}>
              {data.map((entry) => (
                <Cell key={entry.day} fill={entry.minutes > 5 ? "#BA1A1A" : "#22C55E"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
