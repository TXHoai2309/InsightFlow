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

export function CrisisAnalyticsCharts({ alerts }: { alerts: AlertData[] }) {
  const trendData = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(day.getDate() - (13 - index));
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayAlerts = alerts.filter((alert) => {
        const time = new Date(alert.created_at).getTime();
        return Number.isFinite(time) && time >= day.getTime() && time < nextDay.getTime();
      });
      return {
        label: day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        total: dayAlerts.length,
        highRisk: dayAlerts.filter((alert) => {
          const severity = normalizeSeverity(alert.severity);
          return severity === "critical" || severity === "high";
        }).length,
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

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <Card className="rounded-xl border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]">
        <CardHeader className="px-5 pb-2 pt-5">
          <CardTitle className="text-base font-black text-[#1A1B20]">Cảnh báo theo ngày đăng</CardTitle>
          <p className="text-xs font-medium text-[#6E6A7C]">Số nội dung được đăng trong 14 ngày gần nhất; đường đỏ là nhóm ưu tiên cao.</p>
        </CardHeader>
        <CardContent className="h-[285px] px-2 pb-4 sm:px-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="crisisTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B4FCF" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#5B4FCF" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="crisisHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BA1A1A" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#BA1A1A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ECE9F3" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#787585", fontSize: 11 }} interval={1} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#787585", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDD9E8", fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area type="monotone" dataKey="total" name="Đủ điều kiện Crisis" stroke="#5B4FCF" strokeWidth={2.5} fill="url(#crisisTotal)" />
              <Area type="monotone" dataKey="highRisk" name="Ưu tiên cao" stroke="#BA1A1A" strokeWidth={2.5} fill="url(#crisisHigh)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]">
        <CardHeader className="px-5 pb-2 pt-5">
          <CardTitle className="text-base font-black text-[#1A1B20]">Phân bổ mức ưu tiên</CardTitle>
          <p className="text-xs font-medium text-[#6E6A7C]">Mỗi cảnh báo thuộc đúng một mức ưu tiên trong kỳ 30 ngày.</p>
        </CardHeader>
        <CardContent className="h-[285px] px-2 pb-4">
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {severityData.map((item) => <Cell key={item.key} fill={item.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDD9E8", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-[#787585]">Chưa có dữ liệu rủi ro trong kỳ.</div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
