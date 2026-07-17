"use client";

/**
 * BMTopTopics — Top từ khóa/chủ đề đang được nhắc đến
 * Bảng xếp hạng với sentiment breakdown và trend arrow.
 */

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { TopTopic } from "@/types/dashboard";

interface BMTopTopicsProps {
  topics: (TopTopic & { trend?: number })[];
}

const TOPIC_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  quality:   { label: "Chất lượng sản phẩm", icon: "star",           color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  service:   { label: "Phục vụ & Thái độ NV", icon: "support_agent",  color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  price:     { label: "Giá cả & Khuyến mãi",  icon: "local_offer",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  space:     { label: "Không gian & Vệ sinh",  icon: "chair",         color: "#0EA5E9", bg: "rgba(14,165,233,0.1)" },
  delivery:  { label: "Giao hàng",             icon: "local_shipping",color: "#22C55E", bg: "rgba(34,197,94,0.1)"  },
  legal:     { label: "Pháp lý",               icon: "gavel",         color: "#EF4444", bg: "rgba(239,68,68,0.1)"  },
  operation: { label: "Vận hành",              icon: "build",         color: "#EA580C", bg: "rgba(234,88,12,0.1)"  },
  marketing: { label: "Marketing",             icon: "campaign",      color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  staff:     { label: "Nhân viên",             icon: "person",        color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  experience:{ label: "Trải nghiệm",           icon: "sentiment_satisfied", color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  competitor:{ label: "Đối thủ cạnh tranh",    icon: "emoji_events",  color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  other:     { label: "Khác",                  icon: "label",         color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};

export function BMTopTopics({ topics }: BMTopTopicsProps) {
  const { t } = useTranslation();
  const displayed = topics.slice(0, 8);

  const maxCount = Math.max(...displayed.map((t) => t.count), 1);

  return (
    <div className="bm-topics-card">
      {/* Header */}
      <div className="bm-topics-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(236,72,153,0.1)", color: "#EC4899",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              tag
            </span>
          </div>
          <div>
            <h3 className="bm-topics-title">{t("bm.topics.title")}</h3>
            <p className="bm-topics-sub">{t("bm.topics.sub")}</p>
          </div>
        </div>

        <Link href="/mentions" id="bm-topics-view-all" className="bm-topics-link">
          {t("bm.topics.viewAll")}
        </Link>
      </div>

      {/* Grid layout */}
      {displayed.length === 0 ? (
        <div style={{
          padding: "32px", textAlign: "center",
          color: "var(--color-text-muted)", fontSize: 13,
        }}>
          {t("bm.topics.empty")}
        </div>
      ) : (
        <div className="bm-topics-grid">
          {displayed.map((topic, index) => {
            const meta = TOPIC_META[topic.name] || TOPIC_META.other;
            const total = topic.count;
            const pos = topic.sentiment_breakdown?.positive || 0;
            const neg = topic.sentiment_breakdown?.negative || 0;
            const neu = topic.sentiment_breakdown?.neutral  || 0;
            const trend = topic.trend || 0;
            const isUp = trend > 0;
            const barWidth = (total / maxCount) * 100;

            // Dominant sentiment
            const domSentiment = pos >= neg && pos >= neu ? "positive"
              : neg >= pos && neg >= neu ? "negative" : "neutral";

            return (
              <Link
                key={topic.name}
                href={`/mentions?topic=${topic.name}`}
                id={`bm-topic-${topic.name}`}
                className={`bm-topic-item bm-topic-item--${domSentiment}`}
              >
                {/* Rank */}
                <div className="bm-topic-rank">{index + 1}</div>

                {/* Icon */}
                <div
                  className="bm-topic-icon"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
                  >
                    {meta.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="bm-topic-content">
                  <div className="bm-topic-top">
                    <span className="bm-topic-name">
                      {topic.name.toLowerCase() === "khác" 
                        ? t("dashboard.topics.other", "Other")
                        : t(`dashboard.topics.${topic.name}`, meta.label)}
                    </span>
                    <div className="bm-topic-right">
                      <span className="bm-topic-count">
                        {total.toLocaleString("vi-VN")}
                      </span>
                      <span
                        className="bm-topic-trend"
                        style={{ color: isUp ? "#EF4444" : trend < 0 ? "#22C55E" : "var(--color-text-muted)" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          {trend > 0 ? "arrow_drop_up" : trend < 0 ? "arrow_drop_down" : "remove"}
                        </span>
                        {Math.abs(trend)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="bm-topic-bar-bg">
                    <div
                      className="bm-topic-bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        background: meta.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>

                  {/* Sentiment mini strip */}
                  {total > 0 && (
                    <div className="bm-topic-sentiment-strip">
                      <div style={{ width: `${(pos / total) * 100}%`, background: "#22C55E" }} />
                      <div style={{ width: `${(neu / total) * 100}%`, background: "#94A3B8" }} />
                      <div style={{ width: `${(neg / total) * 100}%`, background: "#EF4444" }} />
                    </div>
                  )}

                  {/* Sentiment count badges */}
                  {total > 0 && (
                    <div className="bm-topic-sentiment-counts">
                      <span className="bm-sent-badge bm-sent-pos">
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>sentiment_satisfied</span>
                        {pos}
                      </span>
                      <span className="bm-sent-badge bm-sent-neu">
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>sentiment_neutral</span>
                        {neu}
                      </span>
                      <span className="bm-sent-badge bm-sent-neg">
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>sentiment_dissatisfied</span>
                        {neg}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Color Legend */}
      {displayed.length > 0 && (
        <div className="bm-topics-legend">
          <span className="bm-legend-label">{t("bm.topics.legend.title")}:</span>
          <div className="bm-legend-item">
            <span className="bm-legend-dot" style={{ background: "#22C55E" }} />
            <span>{t("bm.topics.legend.positive")}</span>
          </div>
          <div className="bm-legend-item">
            <span className="bm-legend-dot" style={{ background: "#94A3B8" }} />
            <span>{t("bm.topics.legend.neutral")}</span>
          </div>
          <div className="bm-legend-item">
            <span className="bm-legend-dot" style={{ background: "#EF4444" }} />
            <span>{t("bm.topics.legend.negative")}</span>
          </div>
          <span className="bm-legend-desc">
            <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle" }}>info</span>
            {" "}{t("bm.topics.legend.barDesc")}
          </span>
        </div>
      )}

      <style>{`
        .bm-topics-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px; padding: 24px;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme);
          height: 100%;
        }
        .bm-topics-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 20px; gap: 10px;
        }
        .bm-topics-title {
          font-size: 15px; font-weight: 700;
          color: var(--color-text-primary); margin: 0;
        }
        .bm-topics-sub {
          font-size: 11px; color: var(--color-text-muted); margin: 0; font-weight: 500;
        }
        .bm-topics-link {
          font-size: 13px; font-weight: 600; color: var(--color-brand);
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
        }
        .bm-topics-link:hover { text-decoration: underline; }

        .bm-topics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (max-width: 900px) {
          .bm-topics-grid { grid-template-columns: 1fr; }
        }

        .bm-topic-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px; border-radius: 12px;
          border: 1px solid var(--color-border);
          text-decoration: none;
          background: var(--color-bg-surface);
          transition: all 0.15s ease; position: relative;
          overflow: hidden;
        }
        .bm-topic-item:hover {
          border-color: var(--color-brand-border);
          background: var(--color-bg-surface-raised);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(108,99,255,0.08);
        }
        /* Left accent bar by sentiment */
        .bm-topic-item::before {
          content: ""; position: absolute; top: 0; bottom: 0; left: 0;
          width: 3px; border-radius: 12px 0 0 12px;
        }
        .bm-topic-item--positive::before { background: #22C55E; }
        .bm-topic-item--negative::before { background: #EF4444; }
        .bm-topic-item--neutral::before  { background: #94A3B8; }

        .bm-topic-rank {
          width: 20px; height: 20px; border-radius: 6px;
          background: var(--color-bg-surface-raised);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: var(--color-text-muted);
          flex-shrink: 0; margin-top: 2px;
        }
        .bm-topic-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-topic-content { flex: 1; min-width: 0; }
        .bm-topic-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 8px; margin-bottom: 6px;
        }
        .bm-topic-name {
          font-size: 12px; font-weight: 700; color: var(--color-text-primary);
          line-height: 1.3; flex: 1;
        }
        .bm-topic-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .bm-topic-count {
          font-size: 14px; font-weight: 800; color: var(--color-text-primary);
        }
        .bm-topic-trend {
          display: flex; align-items: center; font-size: 11px; font-weight: 700;
        }
        .bm-topic-bar-bg {
          height: 4px; background: var(--color-bg-surface-raised);
          border-radius: 2px; overflow: hidden; margin-bottom: 5px;
        }
        .bm-topic-bar-fill {
          height: 100%; border-radius: 2px;
          transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        .bm-topic-sentiment-strip {
          display: flex; height: 3px; border-radius: 2px; overflow: hidden; gap: 1px;
          margin-bottom: 4px;
        }
        .bm-topic-sentiment-strip > div { border-radius: 2px; }

        .bm-topic-sentiment-counts {
          display: flex; gap: 6px; margin-top: 2px;
        }
        .bm-sent-badge {
          display: inline-flex; align-items: center; gap: 2px;
          font-size: 10px; font-weight: 600; padding: 1px 5px;
          border-radius: 10px;
        }
        .bm-sent-pos { background: rgba(34,197,94,0.12); color: #16A34A; }
        .bm-sent-neu { background: rgba(148,163,184,0.15); color: #64748B; }
        .bm-sent-neg { background: rgba(239,68,68,0.12); color: #DC2626; }

        /* Legend */
        .bm-topics-legend {
          display: flex; align-items: center; flex-wrap: wrap;
          gap: 8px 14px; margin-top: 16px;
          padding: 10px 14px;
          background: var(--color-bg-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          font-size: 11px; color: var(--color-text-secondary);
        }
        .bm-legend-label {
          font-weight: 700; color: var(--color-text-muted);
          text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;
        }
        .bm-legend-item {
          display: flex; align-items: center; gap: 5px; font-weight: 600;
        }
        .bm-legend-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .bm-legend-desc {
          margin-left: auto; font-style: italic;
          color: var(--color-text-muted); font-size: 10px;
          display: flex; align-items: center; gap: 3px;
        }
      `}</style>
    </div>
  );
}
