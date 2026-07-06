"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Mention } from "@/types/dashboard";
import { TOPIC_LABELS } from "./insightEngine";

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2", "#65a30d"];

interface CustomerTopInsightProps {
  mentions: Mention[];
}

export function CustomerTopInsight({ mentions }: CustomerTopInsightProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    mentions.forEach(m => {
      const t = m.topic || "other";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, count]) => ({
        name: TOPIC_LABELS[key] || key,
        value: count,
      }));
  }, [mentions]);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">👥 Khách hàng đang quan tâm điều gì?</h3>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-4">Top chủ đề được nhắc đến nhiều nhất (mọi sentiment)</p>

      {data.length === 0 ? (
        <div className="flex flex-col items-center py-7 text-center">
          <span className="text-2xl mb-2">📝</span>
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có dữ liệu trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={75} innerRadius={42} dataKey="value" paddingAngle={2}>
                  {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} lượt (${Math.round((value / total) * 100)}%)`, "Lượt nhắc"]}
                  contentStyle={{ borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg-surface)", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {data.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[12px]">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                <span className="text-[var(--color-text-secondary)] truncate">{d.name}</span>
                <span className="ml-auto font-bold text-[var(--color-text-primary)] shrink-0">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
