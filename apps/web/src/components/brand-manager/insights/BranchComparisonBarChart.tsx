"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Mention } from "@/types/dashboard";
import { MOCK_VENUES } from "./TimeRangeFilter";

interface BranchComparisonBarChartProps {
  mentions: Mention[];
}

export function BranchComparisonBarChart({ mentions }: BranchComparisonBarChartProps) {
  const chartData = useMemo(() => {
    const venueData: Record<string, { pos: number; neg: number; neu: number }> = {};
    MOCK_VENUES.forEach(v => (venueData[v] = { pos: 0, neg: 0, neu: 0 }));

    mentions.forEach(m => {
      const idx = (m.id.charCodeAt(m.id.length - 1) || 0) % MOCK_VENUES.length;
      const v = MOCK_VENUES[idx];
      if (m.sentiment === "positive") venueData[v].pos++;
      else if (m.sentiment === "negative") venueData[v].neg++;
      else venueData[v].neu++;
    });

    return Object.entries(venueData)
      .map(([name, d]) => ({ name, "Tích cực": d.pos, "Tiêu cực": d.neg, total: d.pos + d.neg + d.neu }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [mentions]);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm h-full">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">🏪 So sánh theo Chi nhánh</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Tỉ lệ tích cực / tiêu cực theo từng địa điểm</p>
      <div className="h-[220px] overflow-y-auto">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <span className="text-3xl mb-2">🏪</span>
            <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có dữ liệu trong khoảng thời gian này</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 40)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 5, bottom: 0 }}
              barSize={14}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-text-primary)", fontWeight: 600 }}
                width={95}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}
                labelStyle={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar dataKey="Tích cực" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="stack" />
              <Bar dataKey="Tiêu cực" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
