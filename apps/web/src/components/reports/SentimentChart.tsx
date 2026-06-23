"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTheme } from "@/contexts/ThemeContext";

interface SentimentChartProps {
  distribution: Record<string, number>;
}

const COLORS_LIGHT = {
  positive: "#22c55e",
  neutral: "#3b82f6",
  negative: "#ef4444",
};

const COLORS_DARK = {
  positive: "#4ade80",  // green pastel
  neutral: "#60a5fa",   // blue pastel
  negative: "#f87171",  // red pastel
};

const LABEL_MAP: Record<string, string> = {
  positive: "Tích cực",
  neutral: "Trung lập",
  negative: "Tiêu cực",
};

export function SentimentChart({ distribution }: SentimentChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

  const data = Object.entries(distribution).map(([key, value]) => ({
    name: LABEL_MAP[key] || key,
    value,
    originalKey: key,
  }));

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="text-center text-[var(--color-text-muted)] py-10">
        Chưa có dữ liệu cảm xúc.
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">Phân bố cảm xúc</h3>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.originalKey as keyof typeof COLORS] || (isDark ? "#4b5563" : "#cccccc")}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} lượt`, "Số lượng"]}
              contentStyle={{
                borderRadius: "8px",
                border: `1px solid var(--color-border)`,
                backgroundColor: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                boxShadow: "var(--shadow-dropdown)",
              }}
              labelStyle={{ color: "var(--color-text-secondary)" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ color: "var(--color-text-secondary)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
