"use client";

/**
 * BMKpiCards — Hàng KPI 5 thẻ: mentions, tiêu cực, alerts, contacts, leads
 * Mỗi thẻ đều click-through drill-down.
 */

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface KpiDef {
  id: string;
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  trend?: { value: string; positive: boolean };
  status: "neutral" | "positive" | "warning" | "danger";
  href: string;
}

interface BMKpiCardsProps {
  totalMentions: number;
  totalTrend: number;
  negativeMentions: number;
  negativePrev: number;
  alertsTotal: number;
  alertsHigh: number;
  unprocessed: number;
  crises: number;
  hotLeads: number;
}

const STATUS_STYLES: Record<
  KpiDef["status"],
  { icon: string; iconBg: string; iconColor: string; valueColor?: string }
> = {
  neutral:  { icon: "", iconBg: "var(--color-brand-subtle)",       iconColor: "var(--color-brand)"  },
  positive: { icon: "", iconBg: "rgba(34,197,94,0.1)",  iconColor: "#22C55E" },
  warning:  { icon: "", iconBg: "rgba(245,158,11,0.12)", iconColor: "#F59E0B" },
  danger:   { icon: "", iconBg: "rgba(239,68,68,0.1)",  iconColor: "#EF4444", valueColor: "#EF4444" },
};

export function BMKpiCards({
  totalMentions,
  totalTrend,
  negativeMentions,
  negativePrev,
  alertsTotal,
  alertsHigh,
  unprocessed,
  crises,
  hotLeads,
}: BMKpiCardsProps) {
  const { t } = useTranslation();
  const negDelta = negativeMentions - negativePrev;

  const cards: KpiDef[] = [
    {
      id: "bm-kpi-mentions",
      icon: "forum",
      label: t("bm.kpi.mentions"),
      value: totalMentions.toLocaleString("vi-VN"),
      trend: {
        value: `${totalTrend >= 0 ? "+" : ""}${totalTrend}%`,
        positive: totalTrend >= 0,
      },
      sub: t("bm.kpi.vsLastPeriod"),
      status: "neutral",
      href: "/mentions",
    },
    {
      id: "bm-kpi-negative",
      icon: "sentiment_dissatisfied",
      label: t("bm.kpi.negative"),
      value: negativeMentions.toLocaleString("vi-VN"),
      trend: {
        value: `${negDelta >= 0 ? "+" : ""}${negDelta}`,
        positive: negDelta <= 0,
      },
      sub: t("bm.kpi.needsAction"),
      status: negativeMentions > 0 ? "danger" : "positive",
      href: "/mentions?sentiment=negative",
    },
    {
      id: "bm-kpi-alerts",
      icon: "warning",
      label: t("bm.kpi.alerts"),
      value: alertsTotal,
      sub: alertsHigh > 0 ? `${alertsHigh} ${t("bm.kpi.highLevel")}` : t("bm.kpi.noAlerts"),
      subColor: alertsHigh > 0 ? "#EF4444" : "#22C55E",
      status: alertsHigh > 0 ? "warning" : "neutral",
      href: "/alerts",
    },
    {
      id: "bm-kpi-leads",
      icon: "person_add",
      label: t("bm.kpi.leads"),
      value: hotLeads,
      sub: t("bm.kpi.needsAssign"),
      status: hotLeads > 0 ? "positive" : "neutral",
      href: "/leads",
    },
  ];

  return (
    <div className="bm-kpi-grid">
      {cards.map((card) => {
        const s = STATUS_STYLES[card.status];
        return (
          <Link
            key={card.id}
            id={card.id}
            href={card.href}
            className="bm-kpi-card"
          >
            {/* Top row */}
            <div className="bm-kpi-top">
              <div className="bm-kpi-icon" style={{ background: s.iconBg }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: s.iconColor, fontVariationSettings: "'FILL' 1" }}
                >
                  {card.icon}
                </span>
              </div>
              {card.trend && (
                <div
                  className="bm-kpi-trend"
                  style={{
                    background: card.trend.positive
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(239,68,68,0.1)",
                    color: card.trend.positive ? "#22C55E" : "#EF4444",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {card.trend.positive ? "arrow_upward" : "arrow_downward"}
                  </span>
                  {card.trend.value}
                </div>
              )}
            </div>

            {/* Value */}
            <div
              className="bm-kpi-value"
              style={{ color: s.valueColor ?? "var(--color-text-primary)" }}
            >
              {card.value}
            </div>

            {/* Label + sub */}
            <div className="bm-kpi-label">{card.label}</div>
            {card.sub && (
              <div
                className="bm-kpi-sub"
                style={{ color: card.subColor ?? "var(--color-text-muted)" }}
              >
                {card.sub}
              </div>
            )}

            {/* Hover indicator */}
            <div className="bm-kpi-arrow">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                open_in_new
              </span>
            </div>
          </Link>
        );
      })}

      <style>{`
        .bm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1280px) { .bm-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .bm-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .bm-kpi-grid { grid-template-columns: 1fr; } }

        .bm-kpi-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 20px;
          display: flex; flex-direction: column;
          gap: 4px; position: relative; overflow: hidden;
          text-decoration: none;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme), transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .bm-kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-card-hover);
          border-color: var(--color-brand-border);
        }
        .bm-kpi-card::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--color-brand);
          opacity: 0; transition: opacity 0.2s ease;
          border-radius: 16px 16px 0 0;
        }
        .bm-kpi-card:hover::before { opacity: 1; }

        .bm-kpi-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 10px;
        }
        .bm-kpi-icon {
          width: 40px; height: 40px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-kpi-trend {
          display: flex; align-items: center; gap: 3px;
          padding: 3px 8px; border-radius: 6px;
          font-size: 12px; font-weight: 700;
        }
        .bm-kpi-value {
          font-size: 30px; font-weight: 800; line-height: 1;
          letter-spacing: -0.02em;
        }
        .bm-kpi-label {
          font-size: 12px; font-weight: 600; letter-spacing: 0.03em;
          color: var(--color-text-secondary); margin-top: 4px;
          text-transform: uppercase;
        }
        .bm-kpi-sub {
          font-size: 12px; font-weight: 500; margin-top: 2px;
        }
        .bm-kpi-arrow {
          position: absolute; top: 14px; right: 14px;
          color: var(--color-text-muted); opacity: 0;
          transition: opacity 0.2s ease;
        }
        .bm-kpi-card:hover .bm-kpi-arrow { opacity: 1; }
      `}</style>
    </div>
  );
}
