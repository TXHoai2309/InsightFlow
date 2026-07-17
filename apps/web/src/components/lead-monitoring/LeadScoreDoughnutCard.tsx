"use client";

import React, { useMemo } from "react";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";

export function LeadScoreDoughnutCard() {
  const leads = useLeadMonitoringLeads();

  const distribution = useMemo(() => {
    const total = Math.max(leads.length, 1);
    const counts = leads.reduce(
      (acc, lead) => {
        if (lead.intent === "hot") acc.hot += 1;
        else if (lead.intent === "warm") acc.warm += 1;
        else acc.cold += 1;
        return acc;
      },
      { hot: 0, warm: 0, cold: 0 },
    );

    return [
      { label: "Hot", range: "90-100", value: Math.round((counts.hot / total) * 100), color: "#BA1A1A", count: counts.hot },
      { label: "Warm", range: "50-89", value: Math.round((counts.warm / total) * 100), color: "#D97706", count: counts.warm },
      { label: "Cold", range: "0-49", value: Math.round((counts.cold / total) * 100), color: "#5B4FCF", count: counts.cold },
    ];
  }, [leads]);

  const size = 154;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const arcs = distribution.map((item) => {
    const length = (item.value / 100) * circumference;
    const strokeDasharray = `${length} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += length;
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  const hotCount = distribution.find((item) => item.label === "Hot")?.count || 0;

  return (
    <div className="flex h-[280px] flex-col rounded-[14px] border border-[#E9E7EE] bg-white shadow-sm">
      <div className="flex items-start justify-between px-6 pb-2 pt-6">
        <div>
          <h3 className="font-sans text-[14px] font-bold uppercase tracking-wide text-[#1A1B20]">
            Chất lượng lead
          </h3>
          <p className="mt-1 text-[12px] font-medium text-[#787585]">
            {hotCount} lead hot cần theo sát
          </p>
        </div>
        <Info className="h-5 w-5 text-[#787585]" />
      </div>

      <div className="flex flex-1 items-center justify-between gap-5 px-6 pb-6">
        <div className="relative flex h-[154px] w-[154px] shrink-0 items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#EEEDF4"
              strokeWidth={strokeWidth}
            />
            {arcs.map((arc, index) => (
              <motion.circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: index * 0.08 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-sans text-[22px] font-bold text-[#1A1B20]">{leads.length}</span>
            <span className="text-[12px] font-semibold text-[#787585]">leads</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {distribution.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[#1A1B20]">
                    {item.label} ({item.range})
                  </p>
                  <p className="text-[12px] font-medium text-[#787585]">{item.count} lead</p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#1A1B20]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
