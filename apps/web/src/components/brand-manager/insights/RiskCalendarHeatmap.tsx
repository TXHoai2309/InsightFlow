"use client";

import React, { useMemo, useState } from "react";
import type { Mention } from "@/types/dashboard";

interface RiskCalendarHeatmapProps {
  mentions: Mention[];
}

function getIntensity(count: number, max: number): number {
  if (max === 0 || count === 0) return 0;
  return Math.ceil((count / max) * 4); // 0-4 levels
}

const LEVEL_CLASSES = [
  "bg-[var(--color-bg-surface-raised)]", // 0 - empty
  "bg-red-100",                           // 1 - low
  "bg-red-300",                           // 2 - medium
  "bg-red-500",                           // 3 - high
  "bg-red-700",                           // 4 - critical
];

const DAYS_OF_WEEK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];

export function RiskCalendarHeatmap({ mentions }: RiskCalendarHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: string; count: number; x: number; y: number } | null>(null);

  const { weeks, maxCount } = useMemo(() => {
    // Build map of negative mentions per day (last 13 weeks = 91 days)
    const negByDay: Record<string, number> = {};
    mentions
      .filter(m => m.sentiment === "negative")
      .forEach(m => {
        const d = new Date(m.posted_at);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          negByDay[key] = (negByDay[key] || 0) + 1;
        }
      });

    // Build grid: start from Sunday of the week 13 weeks ago
    const today = new Date();
    const todayDay = today.getDay(); // 0 = Sun
    const start = new Date(today);
    start.setDate(today.getDate() - todayDay - 12 * 7); // back 13 weeks to Sunday

    const cells: { date: Date; count: number }[][] = [];
    let week: { date: Date; count: number }[] = [];
    const d = new Date(start);

    for (let i = 0; i < 13 * 7; i++) {
      const key = d.toISOString().slice(0, 10);
      week.push({ date: new Date(d), count: negByDay[key] || 0 });
      if (d.getDay() === 6 || i === 13 * 7 - 1) {
        cells.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }

    const maxCount = Math.max(...Object.values(negByDay), 1);
    return { weeks: cells, maxCount };
  }, [mentions]);

  const hasData = mentions.filter(m => m.sentiment === "negative").length > 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">🗓️ Heatmap Cảnh báo Rủi ro theo Ngày</h3>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">Độ đậm màu đỏ tương ứng mức độ phàn nàn từng ngày (13 tuần gần nhất)</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] shrink-0">
          <span>Ít</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls} border border-[var(--color-border)]`} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-4xl mb-3">🎉</span>
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">Không có cảnh báo rủi ro</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Chưa có dữ liệu tiêu cực trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1 pt-5">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={d} className={`h-3 text-[10px] text-[var(--color-text-muted)] leading-3 ${i % 2 === 0 ? "opacity-0" : ""}`}>{d}</div>
              ))}
            </div>

            {/* Weeks grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {/* Month label on first week with new month */}
                <div className="h-4 text-[10px] text-[var(--color-text-muted)] leading-4">
                  {week[0] && week[0].date.getDate() <= 7 ? MONTHS_VI[week[0].date.getMonth()] : ""}
                </div>
                {week.map((cell, di) => {
                  const level = getIntensity(cell.count, maxCount);
                  const dateStr = cell.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                  return (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-150 ${LEVEL_CLASSES[level]} border border-[var(--color-border)]/50`}
                      onMouseEnter={(e) => setTooltip({ day: dateStr, count: cell.count, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg bg-[var(--color-text-primary)] text-white px-3 py-2 text-[12px] shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <div className="font-semibold">{tooltip.day}</div>
          <div>{tooltip.count > 0 ? `${tooltip.count} phàn nàn` : "Không có phàn nàn"}</div>
        </div>
      )}
    </div>
  );
}
