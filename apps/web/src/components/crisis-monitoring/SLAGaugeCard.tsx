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

  const avgResponseTime = useMemo(() => {
    const resolvedAlerts = alerts.filter(a => a.status === "resolved");
    if (resolvedAlerts.length === 0) return 42; // Fallback default
    const sum = resolvedAlerts.reduce((acc, a) => {
      const created = new Date(a.created_at).getTime();
      const resolved = a.resolved_at ? new Date(a.resolved_at).getTime() : Date.now();
      return acc + Math.floor((resolved - created) / 60000);
    }, 0);
    return Math.round(sum / resolvedAlerts.length);
  }, [alerts]);

  const overdueCount = useMemo(() => {
    return alerts.filter(alert => {
      if (alert.status === "resolved") return false;
      const createdTime = new Date(alert.created_at).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - createdTime) / 60000);
      const limitMins = alert.severity === "critical" ? 60 : alert.severity === "high" ? 120 : 240;
      return diffMins > limitMins;
    }).length;
  }, [alerts]);

  const size = 110;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (slaSuccessRate / 100) * circumference;

  return (
    <Card className="flex h-[260px] flex-col rounded-xl shadow-[0px_4px_20px_rgba(30,31,36,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_8px_30px_rgba(30,31,36,0.12)] border-[#C8C4D6] bg-white/70 backdrop-blur-md">
      <CardHeader className="pb-1 pt-5 px-6">
        <CardTitle className="text-[14px] font-bold uppercase text-[#1A1B20] font-sans tracking-wide leading-tight text-center">
          Tỷ lệ đạt SLA xử lý
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4 px-6 pt-1 flex flex-col items-center justify-between">
        <div className="relative flex items-center justify-center w-[110px] h-[110px]">
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
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
                stroke={slaSuccessRate >= 80 ? "#10B981" : slaSuccessRate >= 50 ? "#F97316" : "#BA1A1A"}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
                filter="url(#glow)"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[24px] font-black text-[#1A1B20] leading-none">
              {slaSuccessRate}%
            </span>
            <span className={`text-[8px] font-black tracking-wider mt-1 ${slaSuccessRate >= 80 ? 'text-[#10B981]' : slaSuccessRate >= 50 ? 'text-[#F97316]' : 'text-[#BA1A1A]'}`}>
              {slaSuccessRate >= 80 ? 'ON TRACK' : slaSuccessRate >= 50 ? 'WARNING' : 'CRITICAL'}
            </span>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mt-2 border-t border-[#EEEDF4] pt-3">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-[#767586] uppercase tracking-wide text-center">
              Phản hồi TB
            </span>
            <span className="text-[14px] font-black text-[#1A1B20] mt-0.5">
              {avgResponseTime} phút
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-[#767586] uppercase tracking-wide text-center">
              Vụ việc trễ
            </span>
            <span className={`text-[14px] font-black mt-0.5 ${overdueCount > 0 ? 'text-[#BA1A1A]' : 'text-green-600'}`}>
              {overdueCount} sự vụ
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

