"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDashboardStore } from "@/stores/dashboard.store";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg border border-[#FFDAD6] bg-white shadow-md text-xs">
        <p className="font-bold text-[#1A1B20]">{payload[0].payload.name}</p>
        <p className="font-semibold text-[#BA1A1A] mt-1">
          {payload[0].value} đề cập tiêu cực
        </p>
      </div>
    );
  }
  return null;
};

export function NegativeTrendCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { trendData } = useDashboardStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    return trendData.map((d) => ({
      name: d.date,
      value: d.negative
    }));
  }, [trendData]);

  // Calculate trend change percent
  const negativeTrendChangePercent = useMemo(() => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [data]);

  return (
    <Card className="flex h-[260px] flex-col rounded-xl shadow-[0px_4px_20px_rgba(30,31,36,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)] border-[#C8C4D6] bg-white">
      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-6 px-6">
        <CardTitle className="text-[14px] font-bold uppercase text-[#1A1B20] font-sans tracking-wide max-w-[70%] leading-tight">
          Xu hướng thảo luận tiêu cực
        </CardTitle>
        <span className={`text-[16px] font-bold ${negativeTrendChangePercent > 0 ? 'text-[#BA1A1A]' : 'text-green-600'}`}>
          {negativeTrendChangePercent > 0 ? '+' : ''}{negativeTrendChangePercent}%
        </span>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-6 px-6 relative">
        {isMounted ? (
          <div className="flex-1 mt-2 mb-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BA1A1A" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#BA1A1A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#BA1A1A', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#BA1A1A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorNegative)"
                  animationBegin={0}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 mt-2 mb-1 w-full animate-pulse bg-gray-100 rounded-md" />
        )}
        <div className="text-[12px] text-[#474554] mt-2 text-center font-medium">
          Theo thời gian
        </div>
      </CardContent>
    </Card>
  );
}

