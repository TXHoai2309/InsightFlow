"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Gauge } from "lucide-react";
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { useDashboardStore } from "@/stores/dashboard.store";

export function ResponseTimeTrendCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredLeads } = useDashboardStore();
  const leads = getFilteredLeads();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const trendData = useMemo(() => {
    // Lấy 7 ngày gần nhất
    const days: Record<string, { totalMins: number, count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("vi-VN", { weekday: "short" });
      days[dayStr] = { totalMins: 0, count: 0 };
    }

    leads.forEach(l => {
      if (l.first_contacted_at && l.created_at) {
        const d = new Date(l.created_at);
        const dayStr = d.toLocaleDateString("vi-VN", { weekday: "short" });
        if (days[dayStr]) {
          const diff = new Date(l.first_contacted_at).getTime() - d.getTime();
          if (diff >= 0) {
            days[dayStr].totalMins += Math.floor(diff / 60000);
            days[dayStr].count++;
          }
        }
      }
    });

    return Object.entries(days).map(([day, data]) => ({
      day,
      minutes: data.count > 0 ? Math.round(data.totalMins / data.count) : 0
    }));
  }, [leads]);

  const maxMinutes = Math.max(...trendData.map((d) => d.minutes), 1); // avoid /0

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-[8px] bg-[#1A1B20] px-3 py-1.5 text-[12px] font-semibold text-white shadow-md">
          {payload[0].value}m
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-[280px] flex-col rounded-[16px] border border-[#E9E7EE] bg-[#FFFFFF] shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-hover">
      <div className="flex items-start justify-between px-6 pt-6 pb-2">
        <h3 className="font-['Hanken_Grotesk'] text-[14px] font-bold uppercase tracking-wider text-[#1A1B20]">
          Tốc độ phản hồi (phút)
        </h3>
        <Gauge className="h-5 w-5 text-[#787585]" />
      </div>

      <div className="flex-1 px-6 pb-4">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#787585', fontSize: 12, fontWeight: 500 }} 
                dy={10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#F4F3FA' }}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]} animationDuration={1000}>
                {trendData.map((entry, index) => {
                  const ratio = 1 - (entry.minutes / maxMinutes); 
                  const opacity = 0.2 + (ratio * 0.8);
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="#5B4FCF" 
                      fillOpacity={Math.max(0.2, Math.min(1, opacity))} 
                      className="transition-all duration-300 hover:fill-[#4234B6] hover:fill-opacity-100"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-md bg-[#EEEDF4]" />
        )}
      </div>
    </div>
  );
}
