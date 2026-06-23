"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SentimentChartProps {
  distribution: Record<string, number>;
}

const COLORS = {
  positive: "#22c55e", // green-500
  neutral: "#3b82f6",  // blue-500
  negative: "#ef4444"  // red-500
};

const LABEL_MAP: Record<string, string> = {
  positive: "Tích cực",
  neutral: "Trung lập",
  negative: "Tiêu cực"
};

export function SentimentChart({ distribution }: SentimentChartProps) {
  const { t } = useTranslation();
  const data = Object.entries(distribution).map(([key, value]) => ({
    name: LABEL_MAP[key] || key,
    value,
    originalKey: key
  }));

  if (data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="text-center text-outline py-10">Chưa có dữ liệu cảm xúc.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-on-surface mb-6">Phân bố cảm xúc</h3>
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
                <Cell key={`cell-${index}`} fill={COLORS[entry.originalKey as keyof typeof COLORS] || "#cccccc"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} lượt`, 'Số lượng']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
