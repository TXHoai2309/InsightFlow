"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Mention } from "@/types/dashboard";

interface TrendAreaChartProps {
  mentions: Mention[];
  timeRange: string; // "7d" | "30d" | "all"
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <span className="text-3xl mb-2">📊</span>
      <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có dữ liệu trong khoảng thời gian này</p>
    </div>
  );
}

export function TrendAreaChart({ mentions, timeRange }: TrendAreaChartProps) {
  const chartData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const result: { date: string; positive: number; negative: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;

      const dayMentions = mentions.filter(m => {
        const t = new Date(m.posted_at).getTime();
        return t >= dayStart && t < dayEnd;
      });

      result.push({
        date: dateStr,
        positive: dayMentions.filter(m => m.sentiment === "positive").length,
        negative: dayMentions.filter(m => m.sentiment === "negative").length,
      });
    }
    return result;
  }, [mentions, timeRange]);

  const hasData = chartData.some(d => d.positive > 0 || d.negative > 0);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm h-full">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">📈 Xu hướng theo thời gian</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Tín hiệu tích cực & rủi ro mỗi ngày</p>
      <div className="h-[220px]">
        {!hasData ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                interval={timeRange === "7d" ? 0 : timeRange === "30d" ? 4 : 9}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-surface)", boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.15)" }}
                labelStyle={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(v) => v === "positive" ? "Tín hiệu tích cực" : "Rủi ro / Tiêu cực"}
              />
              <Area type="monotone" dataKey="positive" stroke="#22c55e" fill="url(#greenGrad)" strokeWidth={2} dot={false} name="positive" />
              <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#redGrad)" strokeWidth={2} dot={false} name="negative" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
