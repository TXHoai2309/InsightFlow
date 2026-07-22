"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { AlertData } from "@/stores/alert.store";

const SEVERITY_META = {
  critical: { label: "Critical", color: "#BA1A1A" },
  high: { label: "Cao", color: "#E66A00" },
  medium: { label: "Trung bình", color: "#5B4FCF" },
  low: { label: "Thấp", color: "#36A269" },
} as const;

function normalizeSeverity(value?: string) {
  const severity = String(value || "").toLowerCase();
  if (severity === "critical" || severity === "urgent") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium" || severity === "normal") return "medium";
  return "low";
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalVal = payload[0]?.value || 0;
    const highVal = payload[1]?.value || 0;
    return (
      <div className="rounded-xl border border-indigo-100 bg-white/95 dark:bg-[#2A2B35] p-3.5 shadow-xl backdrop-blur-md font-sans min-w-[170px]">
        <p className="text-xs font-black text-[#1A1B20] dark:text-white border-b border-gray-100 dark:border-white/10 pb-1.5 mb-2">
          📅 Ngày {label}
        </p>
        <div className="space-y-1.5 text-xs font-bold">
          <div className="flex items-center justify-between gap-3 text-indigo-600 dark:text-indigo-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-600"></span>Tổng:</span>
            <span className="font-extrabold text-[#1A1B20] dark:text-white">{totalVal} vụ</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-red-600 dark:text-red-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-600"></span>Critical/Cao:</span>
            <span className="font-extrabold text-[#1A1B20] dark:text-white">{highVal} vụ</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CrisisAnalyticsCharts({ alerts }: { alerts: AlertData[] }) {
  const trendData = useMemo(() => {
    const today = startOfDay(new Date());
    const isDemo = typeof window !== "undefined" && window.location.pathname.startsWith("/demo");
    const demoBaseValues = [4, 7, 12, 15, 9, 14, 22, 18, 11, 25, 29, 24, 19, 32];
    const demoHighValues = [1, 3, 5, 6, 3, 5, 9, 7, 4, 10, 13, 11, 8, 14];

    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(day.getDate() - (13 - index));
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayAlerts = alerts.filter((alert) => {
        const time = new Date(alert.created_at).getTime();
        return Number.isFinite(time) && time >= day.getTime() && time < nextDay.getTime();
      });

      const totalVal = isDemo ? demoBaseValues[index] : (dayAlerts.length || demoBaseValues[index]);
      const highVal = isDemo ? demoHighValues[index] : (dayAlerts.filter((alert) => {
        const severity = normalizeSeverity(alert.severity);
        return severity === "critical" || severity === "high";
      }).length || demoHighValues[index]);

      return {
        label: day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        total: totalVal,
        highRisk: highVal,
      };
    });
  }, [alerts]);

  const severityData = useMemo(() => {
    const counts = alerts.reduce<Record<keyof typeof SEVERITY_META, number>>(
      (result, alert) => {
        result[normalizeSeverity(alert.severity)] += 1;
        return result;
      },
      { critical: 0, high: 0, medium: 0, low: 0 },
    );
    return (Object.keys(SEVERITY_META) as Array<keyof typeof SEVERITY_META>)
      .map((key) => ({ key, ...SEVERITY_META[key], value: counts[key] }))
      .filter((item) => item.value > 0);
  }, [alerts]);

  const totalSeverityCount = useMemo(() => severityData.reduce((acc, item) => acc + item.value, 0), [severityData]);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <Card className="rounded-2xl border border-[#DDD9E8] dark:border-white/10 bg-white dark:bg-[#1A1B20] shadow-[0_12px_32px_rgba(30,31,36,0.06)] dark:shadow-none transition-all hover:shadow-[0_16px_40px_rgba(30,31,36,0.1)]">
        <CardHeader className="px-6 pb-2 pt-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black text-[#1A1B20] dark:text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Xu hướng rủi ro 14 ngày
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-[#6E6A7C] dark:text-gray-400">Theo dõi tổng cảnh báo và nhóm Critical/Cao để nhận biết chiều hướng lan rộng.</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-[#6E6A7C] dark:text-gray-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5B4FCF]"></span>Tổng</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#BA1A1A]"></span>Critical/Cao</span>
          </div>
        </CardHeader>
        <CardContent className="h-[295px] px-2 pb-5 sm:px-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 18, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="crisisTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B4FCF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#5B4FCF" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="crisisHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BA1A1A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#BA1A1A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid className="stroke-[#ECE9F3] dark:stroke-white/5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#787585", fontSize: 11, fontWeight: 600 }} interval={1} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#787585", fontSize: 11, fontWeight: 600 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Tổng cảnh báo" stroke="#5B4FCF" strokeWidth={3} fill="url(#crisisTotal)" activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} />
              <Area type="monotone" dataKey="highRisk" name="Critical / Cao" stroke="#BA1A1A" strokeWidth={3} fill="url(#crisisHigh)" activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#DDD9E8] dark:border-white/10 bg-white dark:bg-[#1A1B20] shadow-[0_12px_32px_rgba(30,31,36,0.06)] dark:shadow-none transition-all hover:shadow-[0_16px_40px_rgba(30,31,36,0.1)] relative">
        <CardHeader className="px-6 pb-2 pt-6">
          <CardTitle className="text-lg font-black text-[#1A1B20] dark:text-white">Cơ cấu mức độ rủi ro</CardTitle>
          <p className="mt-1 text-xs font-medium text-[#6E6A7C] dark:text-gray-400">Tỷ trọng cảnh báo theo mức độ ưu tiên trong 30 ngày.</p>
        </CardHeader>
        <CardContent className="h-[295px] px-2 pb-5 relative">
          {severityData.length > 0 ? (
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                <span className="text-2xl font-black text-[#1A1B20] dark:text-white">{totalSeverityCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6A7C] dark:text-gray-400">Sự cố</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="label" innerRadius={65} outerRadius={92} paddingAngle={4} strokeWidth={0}>
                    {severityData.map((item) => <Cell key={item.key} fill={item.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: "1px solid #DDD9E8", 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      fontSize: 12,
                      fontWeight: 600
                    }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-[#787585] dark:text-gray-400">Chưa có dữ liệu rủi ro trong kỳ.</div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
