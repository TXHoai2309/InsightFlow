"use client";

import React from "react";
import type { Mention } from "@/types/dashboard";

interface CrisisTimelineProps {
  mentions: Mention[];
}

interface TimelineEvent {
  day: string;        // DD/MM
  count: number;
  milestone?: string; // e.g. "Influencer đăng", "Báo chí đăng"
  isEscalation: boolean;
}

function detectEscalation(mentions: Mention[]): {
  events: TimelineEvent[];
  topic: string;
  isActive: boolean;
} {
  // Find most-mentioned negative topic in last 7 days, check if it's still growing
  const negMentions = mentions.filter(m => m.sentiment === "negative");
  if (negMentions.length < 5) return { events: [], topic: "", isActive: false };

  // Group by day (last 7 days)
  const now = Date.now();
  const dayMs = 86400000;
  const events: TimelineEvent[] = [];

  for (let d = 6; d >= 0; d--) {
    const dayStart = now - (d + 1) * dayMs;
    const dayEnd   = now - d * dayMs;
    const dateStr  = new Date(dayEnd).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    const dayMentions = negMentions.filter(m => {
      const t = new Date(m.posted_at).getTime();
      return t >= dayStart && t < dayEnd;
    });
    events.push({ day: dateStr, count: dayMentions.length, isEscalation: false });
  }

  // Check for escalation: count grows ≥ 2x over 3+ days
  const lastThree = events.slice(-3).map(e => e.count);
  const isEscalating = lastThree.every((v, i) => i === 0 || v >= lastThree[i - 1] * 1.3);
  const hasSignificantCount = events[events.length - 1].count >= 3;
  const isActive = isEscalating && hasSignificantCount;

  // Mark peaks as milestones
  const maxCount = Math.max(...events.map(e => e.count));
  events.forEach(e => {
    if (e.count === maxCount && maxCount >= 3) e.milestone = "Đỉnh điểm phàn nàn";
    if (e.count >= 2 && e.count === events[events.length - 1].count) e.isEscalation = true;
  });

  // Find dominant topic
  const topicCounts: Record<string, number> = {};
  negMentions.forEach(m => { const t = m.topic || "other"; topicCounts[t] = (topicCounts[t] || 0) + 1; });
  const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";

  return { events, topic: topTopic, isActive };
}

export function CrisisTimeline({ mentions }: CrisisTimelineProps) {
  const { events, topic, isActive } = detectEscalation(mentions);

  if (!isActive) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-3">
          <span>📊</span> Timeline Diễn biến Sự kiện
        </h3>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-3xl mb-2">✅</span>
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Hiện chưa có diễn biến nào cần theo dõi liên tục</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
            Timeline sẽ hiện khi AI phát hiện sự kiện đang leo thang liên tục
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...events.map(e => e.count), 1);

  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
          📊 Timeline Diễn biến — <span className="text-red-600">Đang leo thang</span>
        </h3>
        <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">LIVE</span>
      </div>

      {/* Timeline horizontal */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0 min-w-max">
          {events.map((event, i) => {
            const barH = event.count > 0 ? Math.max(12, Math.round((event.count / maxCount) * 80)) : 4;
            const isLast = i === events.length - 1;
            return (
              <div key={i} className="flex flex-col items-center gap-1 w-16">
                {/* Milestone label */}
                <div className="h-5 flex items-center">
                  {event.milestone && (
                    <span className="text-[9px] text-red-600 font-bold text-center leading-tight whitespace-nowrap">
                      {event.milestone}
                    </span>
                  )}
                </div>

                {/* Count label */}
                <div className="text-[11px] font-bold text-[var(--color-text-primary)]">
                  {event.count > 0 ? event.count : ""}
                </div>

                {/* Bar */}
                <div className="w-8 bg-[var(--color-bg-surface-raised)] rounded-t relative" style={{ height: 88 }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700 ${
                      event.isEscalation ? "bg-red-600" : event.count > maxCount * 0.6 ? "bg-red-400" : "bg-red-200"
                    }`}
                    style={{ height: barH }}
                  />
                </div>

                {/* Connector line */}
                <div className="flex items-center w-full h-4">
                  <div className={`flex-1 h-0.5 ${isLast ? "invisible" : ""} bg-[var(--color-border)]`} />
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    event.isEscalation ? "bg-red-600" : event.count > 0 ? "bg-red-400" : "bg-[var(--color-border)]"
                  }`} />
                  <div className={`flex-1 h-0.5 ${i === 0 ? "invisible" : ""} bg-[var(--color-border)]`} />
                </div>

                {/* Date label */}
                <div className="text-[10px] text-[var(--color-text-muted)] font-medium">{event.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[12px] text-red-700 bg-red-100 rounded-lg px-3 py-2 mt-3 font-medium">
        ⚠ AI phát hiện xu hướng leo thang liên tục trong 3+ ngày gần nhất. Cần phân công xử lý ngay.
      </p>
    </div>
  );
}
