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
  resolved?: number;
  remaining?: number;
  resolvedLabel?: string;
  subColor?: string;
  trend?: { value: string; positive: boolean };
  status: "neutral" | "positive" | "warning" | "danger";
  href: string;
}

interface BMKpiCardsProps {
  negativeMentions: number;
  negativePrev: number;
  negativeResolved: number;
  unprocessed: number;
  crises: number;
  hotLeads: number;
  leadsTotal?: number;
  leadsResolved: number;
  negativeHref?: string;
  leadsHref?: string;
}

const STATUS_STYLES: Record<
  KpiDef["status"],
  { icon: string; iconBg: string; iconColor: string; valueColor?: string }
> = {
  neutral: { icon: "", iconBg: "var(--color-brand-subtle)", iconColor: "var(--color-brand)" },
  positive: { icon: "", iconBg: "rgba(34,197,94,0.1)", iconColor: "#22C55E" },
  warning: { icon: "", iconBg: "rgba(245,158,11,0.12)", iconColor: "#F59E0B" },
  danger: { icon: "", iconBg: "rgba(239,68,68,0.1)", iconColor: "#EF4444", valueColor: "#EF4444" },
};

export function BMKpiCards({
  negativeMentions,
  negativePrev,
  negativeResolved,
  unprocessed,
  crises,
  hotLeads,
  leadsTotal,
  leadsResolved,
  negativeHref = "/alerts?scope=negative",
  leadsHref = "/leads?view=all",
}: BMKpiCardsProps) {
  const { t } = useTranslation();
  const negDelta = negativeMentions - negativePrev;
  const totalLeads = leadsTotal !== undefined ? leadsTotal : hotLeads;
  const remainingLeads = Math.max(0, totalLeads - leadsResolved);

  const cards: KpiDef[] = [
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
      resolved: negativeResolved,
      remaining: Math.max(0, negativeMentions - negativeResolved),
      status: negativeMentions > 0 ? "danger" : "positive",
      href: negativeHref,
    },
    {
      id: "bm-kpi-leads",
      icon: "person_add",
      label: t("bm.kpi.leads"),
      value: totalLeads.toLocaleString("vi-VN"),
      sub: t("bm.kpi.needsAssign"),
      resolved: leadsResolved,
      remaining: remainingLeads,
      resolvedLabel: t("bm.kpi.processed", "Đã xử lý"),
      status: totalLeads > 0 ? "positive" : "neutral",
      href: leadsHref,
    },
  ];

  return (
    <div className="bm-kpi-grid" data-tour="dashboard-actionable">
      {cards.map((card) => {
        const s = STATUS_STYLES[card.status];
        const resolved = card.resolved ?? 0;
        const remaining = card.remaining ?? 0;
        const taskTotal = resolved + remaining;
        const resolvedPct = taskTotal === 0 ? 0 : Math.round((resolved / taskTotal) * 100);
        const remainingColor = card.status === "danger" ? "#EF4444" : "#6366F1";
        const resolvedLabel = card.resolvedLabel || t("bm.kpi.processed", "Đã xử lý");
        return (
          <Link
            key={card.id}
            id={card.id}
            href={card.href}
            data-tour={card.id === "bm-kpi-negative" ? "dashboard-negative-card" : card.id === "bm-kpi-leads" ? "dashboard-lead-card" : undefined}
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

            <div className="bm-kpi-body">
              <div className="bm-kpi-copy">
                <div
                  className="bm-kpi-value"
                  style={{ color: s.valueColor ?? "var(--color-text-primary)" }}
                >
                  {card.value}
                </div>
                <div className="bm-kpi-label">{card.label}</div>
                {card.sub && (
                  <div className="bm-kpi-sub" style={{ color: card.subColor ?? "var(--color-text-muted)" }}>
                    {card.sub}
                  </div>
                )}
              </div>

              {card.resolved !== undefined && (
                <div className="bm-kpi-donut-wrap">
                  <div
                    className="bm-kpi-donut"
                    style={{
                      background: resolvedPct > 0
                        ? `conic-gradient(#22C55E 0 ${resolvedPct}%, var(--color-border) ${resolvedPct}% 100%)`
                        : `var(--color-border)`,
                    }}
                    aria-label={`${resolvedLabel} ${resolvedPct}%, còn lại ${100 - resolvedPct}%`}
                  >
                    <div className="bm-kpi-donut-center">
                      <strong style={{ color: resolvedPct > 0 ? "#22C55E" : "var(--color-text-primary)" }}>{resolvedPct}%</strong>
                      <span>đã xử lý</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {card.resolved !== undefined && (
              <div className="bm-kpi-progress">
                <span className="bm-kpi-progress-done"><i style={{ background: "#22C55E" }} />{resolvedLabel}: {resolved.toLocaleString("vi-VN")}</span>
                <span className="bm-kpi-progress-left"><i style={{ background: "var(--color-text-muted)" }} />Còn lại: {remaining.toLocaleString("vi-VN")}</span>
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
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1280px) { .bm-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .bm-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .bm-kpi-grid { grid-template-columns: 1fr; } }

        .bm-kpi-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 16px 18px;
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
          justify-content: space-between; margin-bottom: 4px;
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
        .bm-kpi-body {
          display:flex; align-items:center; justify-content:space-between; gap:18px;
          min-height:76px;
        }
        .bm-kpi-copy { min-width:0; flex:1; }
        .bm-kpi-donut-wrap { flex:0 0 80px; display:flex; justify-content:center; }
        .bm-kpi-donut {
          width:76px; height:76px; border-radius:50%; padding:8px;
          box-shadow:0 6px 16px rgba(15,23,42,.10);
          transition:transform .2s ease;
        }
        .bm-kpi-card:hover .bm-kpi-donut { transform:rotate(2deg) scale(1.03); }
        .bm-kpi-donut-center {
          width:100%; height:100%; border-radius:50%;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          background:var(--color-bg-surface); box-shadow:inset 0 0 0 1px var(--color-border);
        }
        .bm-kpi-donut-center strong { font-size:16px; line-height:1; color:var(--color-text-primary); }
        .bm-kpi-donut-center span { margin-top:4px; font-size:9px; font-weight:700; color:var(--color-text-muted); }
        .bm-kpi-value {
          font-size: 30px; font-weight: 800; line-height: 1;
          letter-spacing: -0.02em;
        }
        .bm-kpi-label {
          font-size: 12px; font-weight: 600; letter-spacing: 0.03em;
          color: var(--color-text-secondary); margin-top: 4px;
          text-transform: uppercase;
        }
        .bm-kpi-progress { display:flex; justify-content:space-between; gap:10px; margin-top:6px; padding-top:7px; border-top:1px solid var(--color-border); font-size:11px; font-weight:700; }
        .bm-kpi-progress span { display:flex; align-items:center; gap:5px; white-space:nowrap; }
        .bm-kpi-progress i { width:7px; height:7px; border-radius:50%; background:#22C55E; }
        .bm-kpi-progress-done { color:#16A34A; }
        .bm-kpi-progress-left { color:var(--color-text-muted); }
        @media (max-width: 480px) { .bm-kpi-donut-wrap { flex-basis:80px; } .bm-kpi-donut { width:76px; height:76px; } }
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
