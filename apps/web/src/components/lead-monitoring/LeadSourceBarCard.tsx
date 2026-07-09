"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardStore } from "@/stores/dashboard.store";

export function LeadSourceBarCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredLeads } = useDashboardStore();
  const leads = getFilteredLeads();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sourceData = useMemo(() => {
    const total = leads.length || 1;
    const counts: Record<string, number> = {
      facebook: 0,
      tiktok: 0,
      other: 0
    };

    leads.forEach(l => {
      if (l.platform === "facebook") counts.facebook++;
      else if (l.platform === "tiktok") counts.tiktok++;
      else counts.other++;
    });

    const sources = [
      { label: "Facebook (Brand Family)", value: Math.round((counts.facebook / total) * 100) || 0, color: "#4234B6", count: counts.facebook },
      { label: "TikTok", value: Math.round((counts.tiktok / total) * 100) || 0, color: "#5B4FCF", count: counts.tiktok },
      { label: "Nền tảng khác", value: Math.round((counts.other / total) * 100) || 0, color: "#B0A2FF", count: counts.other },
    ];

    return sources.sort((a, b) => b.value - a.value); // Sort by descending percentage
  }, [leads]);

  return (
    <div className="flex h-[280px] flex-col rounded-[16px] border border-[#E9E7EE] bg-[#FFFFFF] shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-hover">
      <div className="flex items-start justify-between px-6 pt-6 pb-2">
        <h3 className="font-['Hanken_Grotesk'] text-[14px] font-bold uppercase tracking-wider text-[#1A1B20]">
          Nguồn khách hàng
        </h3>
        <MousePointerClick className="h-5 w-5 text-[#787585]" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-6 pt-2 gap-5">
        {sourceData.map((item, idx) => (
          <div key={item.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-['Inter'] text-[14px]">
              <span className="font-semibold text-[#1A1B20]">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#787585] text-[12px]">({item.count})</span>
                <span className="font-bold text-[#1A1B20]">{item.value}%</span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEEDF4]">
              {isMounted ? (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              ) : (
                <div 
                  className="h-full w-0 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
