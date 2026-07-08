"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardStore } from "@/stores/dashboard.store";

export function LeadScoreDoughnutCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredLeads } = useDashboardStore();
  const leads = getFilteredLeads();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const distribution = useMemo(() => {
    const total = leads.length || 1; // avoid division by zero
    let hot = 0;
    let warm = 0;
    let cold = 0;

    leads.forEach(l => {
      if (l.intent === "hot") hot++;
      else if (l.intent === "warm") warm++;
      else cold++;
    });

    return [
      { label: "Hot (90-100)", value: Math.round((hot / total) * 100) || 0, color: "#BA1A1A", count: hot },
      { label: "Warm (50-89)", value: Math.round((warm / total) * 100) || 0, color: "#4234B6", count: warm },
      { label: "Cold (0-49)", value: Math.round((cold / total) * 100) || 0, color: "#B0A2FF", count: cold },
    ];
  }, [leads]);

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate offsets for SVG
  let currentOffset = 0;
  const arcs = distribution.map((item) => {
    const strokeDasharray = `${(item.value / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (item.value / 100) * circumference;
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="flex h-[280px] flex-col rounded-[16px] border border-[#E9E7EE] bg-[#FFFFFF] shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-hover">
      <div className="flex items-start justify-between px-6 pt-6 pb-2">
        <h3 className="font-['Hanken_Grotesk'] text-[14px] font-bold uppercase tracking-wider text-[#1A1B20]">
          Phân bổ điểm tiềm năng
        </h3>
        <Info className="h-5 w-5 text-[#787585]" />
      </div>

      <div className="flex flex-1 items-center justify-between px-6 pb-6">
        {/* Doughnut Chart */}
        <div className="relative flex h-[160px] w-[160px] items-center justify-center">
          <svg width={size} height={size} className="-rotate-90 transform">
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-['Hanken_Grotesk'] text-[18px] font-bold text-[#1A1B20]">{leads.length}</span>
            <span className="font-['Hanken_Grotesk'] text-[12px] font-medium text-[#787585]">Leads</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4">
          {arcs.map((arc) => (
            <div key={arc.label} className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: arc.color }}
              />
              <div className="flex flex-col">
                <span className="font-['Inter'] text-[14px] font-semibold text-[#1A1B20]">
                  {arc.label}
                </span>
                <span className="font-['Inter'] text-[12px] font-medium text-[#787585]">
                  {arc.value}% ({arc.count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
