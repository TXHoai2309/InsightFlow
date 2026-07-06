"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Mention } from "@/types/dashboard";

const TOPIC_LABELS: Record<string, string> = {
  quality: "Chất lượng sp",
  service: "Phục vụ & CSKH",
  price: "Giá cả",
  delivery: "Giao hàng",
  staff: "Thái độ NV",
  legal: "Pháp lý",
  operation: "Vận hành",
  marketing: "Marketing",
  experience: "Không gian",
  competitor: "Đối thủ",
  other: "Chủ đề khác",
};

const COMPLAINT_COLORS = ["#ef4444", "#dc2626", "#f87171", "#fca5a5", "#fecaca"];

interface TopComplaintTopicsChartProps {
  mentions: Mention[];
}

export function TopComplaintTopicsChart({ mentions }: TopComplaintTopicsChartProps) {
  const data = useMemo(() => {
    const neg = mentions.filter(m => m.sentiment === "negative");
    const total = neg.length || 1;
    const counts: Record<string, number> = {};
    neg.forEach(m => { const t = m.topic || "other"; counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({
        name: TOPIC_LABELS[key] || key,
        value: count,
        pct: Math.round((count / total) * 100),
      }));
  }, [mentions]);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm h-full">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">⚠️ Top chủ đề bị phàn nàn</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">5 chủ đề nhận nhiều phản hồi tiêu cực nhất</p>
      <div className="h-[200px]">
        {!data.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-3xl mb-2">🎉</span>
            <p className="text-[13px] text-[var(--color-text-muted)]">Không có phàn nàn trong khoảng thời gian này!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 5, bottom: 0 }} barSize={16}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: "var(--color-text-primary)", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}
                formatter={(value: number, _name: string, props: { payload?: { pct: number } }) => [`${value} (${props?.payload?.pct ?? 0}%)`, "Lượt phàn nàn"]}
                labelStyle={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}
                itemStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, fill: "#ef4444", formatter: (v: number) => `${Math.round((v / (data.reduce((s, d) => s + d.value, 0) || 1)) * 100)}%` }}>
                {data.map((_, idx) => <Cell key={idx} fill={COMPLAINT_COLORS[idx % COMPLAINT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
