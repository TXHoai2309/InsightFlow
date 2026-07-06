"use client";

/**
 * BMAlertTable — Bảng Cảnh báo với priority, status, loại tín hiệu
 * Sortable, filterable, drill-down.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Alert } from "@/types/dashboard";

interface BMAlertTableProps {
  alerts: Alert[];
}

const SEVERITY_META: Record<
  Alert["severity"],
  { label: string; color: string; bg: string; dot: string }
> = {
  critical: { label: "Khẩn cấp", color: "#DC2626", bg: "rgba(220,38,38,0.1)",  dot: "#DC2626" },
  high:     { label: "Cao",      color: "#EA580C", bg: "rgba(234,88,12,0.1)",   dot: "#EA580C" },
  medium:   { label: "Trung bình",color: "#D97706", bg: "rgba(217,119,6,0.1)",  dot: "#D97706" },
  low:      { label: "Thấp",    color: "#059669", bg: "rgba(5,150,105,0.1)",   dot: "#059669" },
};

const SIGNAL_META: Record<Alert["signal_type"], { icon: string; label: string }> = {
  mention_spike:  { icon: "trending_up",    label: "Tăng đột biến" },
  high_reach:     { icon: "public",         label: "Lan rộng"       },
  sensitive_topic:{ icon: "report",         label: "Chủ đề nhạy cảm" },
};

const STATUS_META: Record<Alert["status"], { label: string; color: string; bg: string }> = {
  new:          { label: "Mới",         color: "#EF4444", bg: "rgba(239,68,68,0.1)"    },
  acknowledged: { label: "Đang xử lý", color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  resolved:     { label: "Đã xử lý",   color: "#22C55E", bg: "rgba(34,197,94,0.1)"   },
};

type SortKey = "severity" | "created_at" | "status";

const SEVERITY_ORDER: Record<Alert["severity"], number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

export function BMAlertTable({ alerts }: BMAlertTableProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<"all" | Alert["status"]>("all");

  const filtered = alerts.filter(
    (a) => statusFilter === "all" || a.status === statusFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "severity") {
      cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    } else if (sortKey === "created_at") {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortKey === "status") {
      cmp = a.status.localeCompare(b.status);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };
  function setDir(fn: (d: "asc" | "desc") => "asc" | "desc") {
    setSortDir(fn(sortDir));
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", opacity: sortKey === k ? 1 : 0.3 }}>
      {sortKey === k && sortDir === "desc" ? "arrow_downward" : "arrow_upward"}
    </span>
  );

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)   return `${Math.round(diff)}s trước`;
    if (diff < 3600) return `${Math.round(diff / 60)}ph trước`;
    if (diff < 86400)return `${Math.round(diff / 3600)}h trước`;
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <div className="bm-alert-card">
      {/* Header */}
      <div className="bm-alert-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(239,68,68,0.1)", color: "#EF4444",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <div>
            <h3 className="bm-alert-title">{t("bm.alert.title")}</h3>
            <p className="bm-alert-sub">{alerts.length} {t("bm.alert.count")}</p>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="bm-alert-filter-pills">
          {(["all", "new", "acknowledged", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              id={`bm-alert-filter-${s}`}
              className={`bm-alert-pill ${statusFilter === s ? "bm-alert-pill--active" : ""}`}
            >
              {s === "all" ? t("bm.alert.filterAll") : t(`bm.alert.status.${s}`)}
            </button>
          ))}
        </div>

        <Link href="/alerts" id="bm-alert-view-all" className="bm-alert-view-all">
          {t("bm.alert.viewAll")}
        </Link>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="bm-table">
          <thead>
            <tr>
              <th className="bm-th" onClick={() => handleSort("severity")} style={{ cursor: "pointer" }}>
                {t("bm.alert.col.severity")} <SortIcon k="severity" />
              </th>
              <th className="bm-th">{t("bm.alert.col.signal")}</th>
              <th className="bm-th">{t("bm.alert.col.content")}</th>
              <th className="bm-th" onClick={() => handleSort("created_at")} style={{ cursor: "pointer" }}>
                {t("bm.alert.col.time")} <SortIcon k="created_at" />
              </th>
              <th className="bm-th" onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                {t("bm.alert.col.status")} <SortIcon k="status" />
              </th>
              <th className="bm-th" style={{ textAlign: "right" }}>{t("bm.alert.col.action")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((alert) => {
              const sev  = SEVERITY_META[alert.severity];
              const sig  = SIGNAL_META[alert.signal_type];
              const stat = STATUS_META[alert.status];
              return (
                <tr key={alert.id} className="bm-tr">
                  {/* Severity */}
                  <td className="bm-td">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: sev.dot, flexShrink: 0,
                        animation: alert.severity === "critical" ? "bm-pulse 2s infinite" : "none",
                      }} />
                      <span style={{
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        background: sev.bg, color: sev.color,
                        whiteSpace: "nowrap",
                      }}>
                        {t(`bm.alert.severity.${alert.severity}`)}
                      </span>
                    </div>
                  </td>

                  {/* Signal type */}
                  <td className="bm-td">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 15, color: "var(--color-text-muted)" }}
                      >
                        {sig.icon}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        {t(`bm.alert.signal.${alert.signal_type.replace('_topic', '').replace('_reach', '').replace('mention_', '')}`)}
                      </span>
                    </div>
                  </td>

                  {/* Message */}
                  <td className="bm-td" style={{ maxWidth: 340 }}>
                    <span style={{
                      fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {alert.message}
                    </span>
                    {alert.affected_mentions_count != null && (
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", marginTop: 2 }}>
                        {alert.affected_mentions_count.toLocaleString("vi-VN")} {t("bm.alert.affectedMentions")}
                        {alert.spike_multiplier ? ` · ${alert.spike_multiplier}x spike` : ""}
                      </span>
                    )}
                  </td>

                  {/* Time */}
                  <td className="bm-td">
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {fmtTime(alert.created_at)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="bm-td">
                    <span style={{
                      padding: "4px 10px", borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      background: stat.bg, color: stat.color,
                      whiteSpace: "nowrap",
                    }}>
                      {t(`bm.alert.status.${alert.status}`)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="bm-td" style={{ textAlign: "right" }}>
                    <Link
                      href={`/alerts`}
                      className="bm-action-btn"
                    >
                      {alert.status === "new" ? t("bm.alert.actionProcess") : t("bm.alert.actionView")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="bm-alert-empty">
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--color-text-muted)" }}>
              check_circle
            </span>
            <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
              {t("bm.alert.empty")}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .bm-alert-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px; overflow: hidden;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme);
        }
        .bm-alert-header {
          display: flex; align-items: center; flex-wrap: wrap;
          gap: 12px; padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
        }
        .bm-alert-title {
          font-size: 15px; font-weight: 700;
          color: var(--color-text-primary); margin: 0;
        }
        .bm-alert-sub {
          font-size: 11px; color: var(--color-text-muted); margin: 0; font-weight: 500;
        }
        .bm-alert-filter-pills {
          display: flex; gap: 4px; flex-wrap: wrap; margin-left: auto;
        }
        .bm-alert-pill {
          padding: 5px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          background: var(--color-bg-surface-raised);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
        }
        .bm-alert-pill:hover, .bm-alert-pill--active {
          background: var(--color-brand);
          border-color: var(--color-brand);
          color: #fff;
        }
        .bm-alert-view-all {
          font-size: 13px; font-weight: 600; color: var(--color-brand);
          text-decoration: none; white-space: nowrap;
        }
        .bm-alert-view-all:hover { text-decoration: underline; }

        /* Table */
        .bm-table {
          width: 100%; border-collapse: collapse;
        }
        .bm-th {
          padding: 12px 16px;
          text-align: left; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text-muted);
          background: var(--color-bg-surface-raised);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap; user-select: none;
        }
        .bm-tr {
          border-bottom: 1px solid var(--color-border);
          transition: background 0.15s ease;
        }
        .bm-tr:last-child { border-bottom: none; }
        .bm-tr:hover { background: var(--color-bg-surface-raised); }
        .bm-td { padding: 14px 16px; vertical-align: middle; }

        .bm-action-btn {
          padding: 6px 14px; border-radius: 8px;
          font-size: 12px; font-weight: 700;
          background: var(--color-brand-subtle);
          color: var(--color-brand);
          text-decoration: none; white-space: nowrap;
          border: 1px solid var(--color-brand-border);
          transition: all 0.15s ease;
          display: inline-block;
        }
        .bm-action-btn:hover {
          background: var(--color-brand); color: #fff;
        }

        .bm-alert-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 48px 24px; text-align: center;
        }
      `}</style>
    </div>
  );
}
