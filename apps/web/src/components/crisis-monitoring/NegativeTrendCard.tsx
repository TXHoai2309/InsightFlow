"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDashboardStore } from "@/stores/dashboard.store";

export function NegativeTrendCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { trendData } = useDashboardStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    return trendData.map((d, i) => ({
      name: d.date,
      value: d.negative
    }));
  }, [trendData]);

  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  // Calculate trend change percent
  const negativeTrendChangePercent = useMemo(() => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [data]);

  return (
    <Card className="flex h-[260px] flex-col rounded-xl shadow-[0px_4px_20px_rgba(30,31,36,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)] border-[#C8C4D6]">
      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-6 px-6">
        <CardTitle className="text-[14px] font-bold uppercase text-[#1A1B20] font-['Hanken_Grotesk'] tracking-wide max-w-[70%] leading-tight">
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
              <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="15%">
                <Bar
                  dataKey="value"
                  radius={[2, 2, 0, 0]}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {data.map((entry, index) => {
                    const opacity = 0.3 + (entry.value / maxVal) * 0.7;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill="#BA1A1A"
                        fillOpacity={opacity}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 mt-2 mb-1 w-full animate-pulse bg-gray-100 rounded-md" />
        )}
        <div className="text-[12px] text-[#474554] mt-2 text-center">
          Theo thời gian
        </div>
      </CardContent>
    </Card>
  );
}
