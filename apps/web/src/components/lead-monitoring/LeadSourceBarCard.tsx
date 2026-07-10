"use client";

import React, { useMemo } from "react";
import { MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";

export function LeadSourceBarCard() {
  const leads = useLeadMonitoringLeads();

  const sourceData = useMemo(() => {
    const buckets: Record<string, { count: number; hot: number }> = {};

    leads.forEach((lead) => {
      const key = lead.platform || "other";
      if (!buckets[key]) buckets[key] = { count: 0, hot: 0 };
      buckets[key].count += 1;
      if (lead.intent === "hot") buckets[key].hot += 1;
    });

    const total = Math.max(leads.length, 1);
    return Object.entries(buckets)
      .map(([platform, data]) => ({
        label: platform === "facebook" ? "Facebook" : platform === "tiktok" ? "TikTok" : platform,
        count: data.count,
        value: Math.round((data.count / total) * 100),
        hotRate: data.count > 0 ? Math.round((data.hot / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [leads]);

  return (
    <div className="flex h-[280px] flex-col rounded-[14px] border border-[#E9E7EE] bg-white shadow-sm">
      <div className="flex items-start justify-between px-6 pb-2 pt-6">
        <div>
          <h3 className="font-['Hanken_Grotesk'] text-[14px] font-bold uppercase tracking-wide text-[#1A1B20]">
            Nguồn lead chất lượng
          </h3>
          <p className="mt-1 text-[12px] font-medium text-[#787585]">
            Theo số lượng và tỉ lệ hot
          </p>
        </div>
        <MousePointerClick className="h-5 w-5 text-[#787585]" />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 px-6 pb-6 pt-2">
        {sourceData.length === 0 ? (
          <div className="rounded-[10px] bg-[#F4F3FA] px-4 py-6 text-center text-[13px] text-[#787585]">
            Chưa có dữ liệu nguồn lead
          </div>
        ) : (
          sourceData.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="font-bold capitalize text-[#1A1B20]">{item.label}</span>
                <span className="font-semibold text-[#787585]">
                  {item.count} lead · {item.hotRate}% hot
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEEDF4]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#5B4FCF]"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
