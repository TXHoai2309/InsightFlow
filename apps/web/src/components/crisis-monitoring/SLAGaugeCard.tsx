"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDashboardStore } from "@/stores/dashboard.store";

export function SLAGaugeCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredAlerts } = useDashboardStore();
  const alerts = getFilteredAlerts();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const slaSuccessRate = useMemo(() => {
    if (alerts.length === 0) return 100;
    
    let success = 0;
    let total = 0;
    
    alerts.forEach(alert => {
      total++;
      const createdTime = new Date(alert.created_at).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - createdTime) / 60000);
      const limitMins = alert.severity === "critical" ? 60 : alert.severity === "high" ? 120 : 240;
      
      // Thành công nếu đã giải quyết, hoặc nếu chưa giải quyết nhưng vẫn còn trong hạn
      if (alert.status === "resolved" || diffMins <= limitMins) {
        success++;
      }
    });

    return Math.round((success / total) * 100);
  }, [alerts]);

  const size = 130;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (slaSuccessRate / 100) * circumference;

  return (
    <Card className="flex h-[260px] flex-col rounded-xl shadow-[0px_4px_20px_rgba(30,31,36,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)] border-[#C8C4D6]">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-[14px] font-bold uppercase text-[#1A1B20] font-['Hanken_Grotesk'] tracking-wide leading-tight text-center">
          Tỷ lệ đạt SLA xử lý
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-6 px-6 pt-2 flex flex-col items-center justify-between">
        <div className="relative flex items-center justify-center w-[130px] h-[130px]">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FFDAD6"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            {isMounted && (
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={slaSuccessRate >= 80 ? "#10B981" : slaSuccessRate >= 50 ? "#F97316" : "#BA1A1A"} // Emerald green
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-[#1A1B20] leading-none">
              {slaSuccessRate}%
            </span>
            <span className={`text-[10px] font-bold tracking-wider mt-1 ${slaSuccessRate >= 80 ? 'text-[#10B981]' : slaSuccessRate >= 50 ? 'text-[#F97316]' : 'text-[#BA1A1A]'}`}>
              {slaSuccessRate >= 80 ? 'ON TRACK' : slaSuccessRate >= 50 ? 'WARNING' : 'CRITICAL'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 w-full mt-4">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span className="text-[12px] font-medium text-[#474554]">Thành công</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#BA1A1A]" />
            <span className="text-[12px] font-medium text-[#474554]">Trễ SLA</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
