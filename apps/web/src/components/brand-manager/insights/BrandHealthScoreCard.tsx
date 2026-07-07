"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Mention } from "@/types/dashboard";
import { TimeRangeFilter } from "./TimeRangeFilter";

interface BrandHealthScoreCardProps {
  currentMentions: Mention[];
  previousMentions: Mention[];
}

function getStatusBadge(score: number) {
  if (score >= 70) return { label: "Tốt", color: "bg-green-100 text-green-700" };
  if (score >= 45) return { label: "Cần chú ý", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Nguy cấp", color: "bg-red-100 text-red-700" };
}

export function BrandHealthScoreCard({ currentMentions, previousMentions }: BrandHealthScoreCardProps) {
  const { score, prevScore } = useMemo(() => {
    const calcScore = (mentions: Mention[]) => {
      if (!mentions.length) return 0;
      const pos = mentions.filter(m => m.sentiment === "positive").length;
      const neg = mentions.filter(m => m.sentiment === "negative").length;
      const total = mentions.length;
      // Score = 60 base + adjustment based on net sentiment ratio
      const posRatio = pos / total;
      const negRatio = neg / total;
      return Math.min(100, Math.max(0, Math.round(50 + posRatio * 40 - negRatio * 30)));
    };
    return {
      score: calcScore(currentMentions),
      prevScore: calcScore(previousMentions),
    };
  }, [currentMentions, previousMentions]);

  const trend = score - prevScore;
  const badge = getStatusBadge(score);

  // Gauge data: score and remaining
  const gaugeData = [
    { value: score, fill: score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444" },
    { value: 100 - score, fill: "var(--color-border)" },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">Chỉ số Sức khỏe Thương hiệu</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">Brand Health Score — tổng hợp từ sentiment & rủi ro</p>
        </div>
        <TimeRangeFilter />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
        {/* Gauge chart */}
        <div className="relative w-[180px] h-[100px] flex-shrink-0">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span className="text-[36px] font-black text-[var(--color-text-primary)] leading-none">{score}</span>
            <span className="text-[12px] text-[var(--color-text-muted)] font-medium">/100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold w-fit ${badge.color}`}>
            {badge.label === "Tốt" ? "✅" : badge.label === "Cần chú ý" ? "⚠️" : "🔴"} {badge.label}
          </span>
          <div className={`flex items-center gap-2 text-[14px] font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            <span className="text-[20px]">{trend >= 0 ? "▲" : "▼"}</span>
            <span>{Math.abs(trend)} điểm so với kỳ trước</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="text-center">
              <div className="text-[20px] font-bold text-green-600">{currentMentions.filter(m => m.sentiment === "positive").length}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">Tích cực</div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-bold text-[var(--color-text-secondary)]">{currentMentions.filter(m => m.sentiment === "neutral").length}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">Trung tính</div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-bold text-red-500">{currentMentions.filter(m => m.sentiment === "negative").length}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">Tiêu cực</div>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex-1 hidden md:block">
          <div className="space-y-3">
            {[
              { label: "Tích cực", count: currentMentions.filter(m => m.sentiment === "positive").length, color: "bg-green-500", textColor: "text-green-600" },
              { label: "Trung tính", count: currentMentions.filter(m => m.sentiment === "neutral").length, color: "bg-gray-400", textColor: "text-gray-500" },
              { label: "Tiêu cực", count: currentMentions.filter(m => m.sentiment === "negative").length, color: "bg-red-500", textColor: "text-red-500" },
            ].map(({ label, count, color, textColor }) => {
              const pct = currentMentions.length > 0 ? Math.round((count / currentMentions.length) * 100) : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-[var(--color-text-secondary)] w-16 shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-surface-raised)]">
                    <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[12px] font-bold w-8 text-right ${textColor}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
