"use client";

/**
 * BMTodayFocus — Panel "Việc cần chú ý hôm nay"
 * Quick-action checklist cho Brand Manager: contact chờ, alerts mới, leads hot.
 */

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface BMTodayFocusProps {
  unprocessedContacts: number;
  newAlerts: number;
  highAlerts: number;
  crises: number;
  hotLeads: number;
}

interface FocusItem {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  count: number;
  sub: string;
  urgent?: boolean;
  href: string;
}

export function BMTodayFocus({
  unprocessedContacts,
  newAlerts,
  highAlerts,
  crises,
  hotLeads,
}: BMTodayFocusProps) {
  const { t } = useTranslation();
  const items: FocusItem[] = [
    {
      id: "bm-focus-contacts",
      icon: "contact_mail",
      iconColor: unprocessedContacts > 0 ? "#F59E0B" : "#22C55E",
      iconBg:    unprocessedContacts > 0 ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.1)",
      label: t("bm.focus.contacts"),
      count: unprocessedContacts,
      sub: t("bm.focus.contactsSub"),
      urgent: unprocessedContacts > 10,
      href: "/leads?status=new",
    },
    {
      id: "bm-focus-alerts",
      icon: "notifications_active",
      iconColor: newAlerts > 0 ? "#EF4444" : "#22C55E",
      iconBg:    newAlerts > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
      label: t("bm.focus.alerts"),
      count: newAlerts,
      sub: `${highAlerts} ${t("bm.focus.alertsSub")}`,
      urgent: highAlerts > 0,
      href: "/alerts?status=new",
    },
    {
      id: "bm-focus-crisis",
      icon: "emergency",
      iconColor: crises > 0 ? "#DC2626" : "#22C55E",
      iconBg:    crises > 0 ? "rgba(220,38,38,0.1)" : "rgba(34,197,94,0.1)",
      label: t("bm.focus.crisis"),
      count: crises,
      sub: crises > 0 ? t("bm.focus.crisisUrgent") : t("bm.focus.crisisClear"),
      urgent: crises > 0,
      href: "/alerts?severity=critical",
    },
    {
      id: "bm-focus-leads",
      icon: "person_add",
      iconColor: "#6366F1",
      iconBg:    "rgba(99,102,241,0.1)",
      label: t("bm.focus.leads"),
      count: hotLeads,
      sub: t("bm.focus.leadsSub"),
      href: "/leads?intent=hot",
    },
  ];

  const total = unprocessedContacts + newAlerts + crises;
  const allClear = total === 0 && crises === 0;

  return (
    <div className="bm-focus-card">
      {/* Header */}
      <div className="bm-focus-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: allClear ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: allClear ? "#22C55E" : "#EF4444",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              {allClear ? "task_alt" : "priority_high"}
            </span>
          </div>
          <div>
            <h3 className="bm-focus-title">{t("bm.focus.title")}</h3>
            <p className="bm-focus-sub">
              {allClear ? t("bm.focus.allClear") : `${total} ${t("bm.focus.actionNeeded")}`}
            </p>
          </div>
        </div>

        {!allClear && (
          <div className="bm-focus-badge">
            <span className="bm-focus-badge-dot" />
            {total} {t("bm.focus.new")}
          </div>
        )}
      </div>

      {/* All clear state */}
      {allClear ? (
        <div className="bm-focus-all-clear">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#22C55E" }}>
            check_circle
          </span>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--color-text-muted)", fontWeight: 500 }}>
            {t("bm.focus.empty")}
          </p>
        </div>
      ) : (
        /* Focus items */
        <div className="bm-focus-list">
          {items.map((item) => (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              className={`bm-focus-item ${item.urgent ? "bm-focus-item--urgent" : ""}`}
            >
              <div
                className="bm-focus-item-icon"
                style={{ background: item.iconBg, color: item.iconColor }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
              </div>

              <div className="bm-focus-item-content">
                <span className="bm-focus-item-label">{item.label}</span>
                <span className="bm-focus-item-sub">{item.sub}</span>
              </div>

              <div className="bm-focus-item-count" style={{ color: item.iconColor }}>
                {item.count}
              </div>

              <span
                className="material-symbols-outlined bm-focus-item-arrow"
                style={{ fontSize: 16, color: "var(--color-text-muted)" }}
              >
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Quick-action footer */}
      <div className="bm-focus-footer">
        <Link href="/mentions?sentiment=negative" id="bm-focus-review-link" className="bm-focus-action-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>reviews</span>
          {t("bm.focus.btnReview")}
        </Link>
        <Link href="/alerts" id="bm-focus-alerts-link" className="bm-focus-action-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>notifications</span>
          {t("bm.focus.btnAlerts")}
        </Link>
      </div>

      <style>{`
        .bm-focus-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px; padding: 24px;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme);
          display: flex; flex-direction: column; gap: 16px;
          height: 100%;
        }
        .bm-focus-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 10px;
        }
        .bm-focus-title {
          font-size: 15px; font-weight: 700;
          color: var(--color-text-primary); margin: 0; line-height: 1.2;
        }
        .bm-focus-sub {
          font-size: 11px; color: var(--color-text-muted);
          margin: 0; font-weight: 500; margin-top: 2px;
        }
        .bm-focus-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          background: rgba(239,68,68,0.1); color: #EF4444;
          font-size: 12px; font-weight: 700; white-space: nowrap;
          flex-shrink: 0;
        }
        .bm-focus-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #EF4444; animation: bm-pulse 2s infinite;
        }

        /* List */
        .bm-focus-list {
          display: flex; flex-direction: column; gap: 4px; flex: 1;
        }
        .bm-focus-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px;
          cursor: pointer; text-decoration: none;
          border: 1px solid transparent;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .bm-focus-item:hover {
          background: var(--color-bg-surface-raised);
          border-color: var(--color-border);
        }
        .bm-focus-item--urgent {
          background: rgba(239,68,68,0.04);
          border-color: rgba(239,68,68,0.15);
        }
        .bm-focus-item--urgent:hover {
          background: rgba(239,68,68,0.08);
        }
        .bm-focus-item-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-focus-item-content {
          flex: 1; display: flex; flex-direction: column; gap: 1px;
          min-width: 0;
        }
        .bm-focus-item-label {
          font-size: 13px; font-weight: 600;
          color: var(--color-text-primary); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .bm-focus-item-sub {
          font-size: 11px; color: var(--color-text-muted); font-weight: 500;
        }
        .bm-focus-item-count {
          font-size: 22px; font-weight: 800; line-height: 1; flex-shrink: 0;
        }
        .bm-focus-item-arrow {
          flex-shrink: 0; opacity: 0.4;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .bm-focus-item:hover .bm-focus-item-arrow {
          opacity: 1; transform: translateX(3px);
        }

        /* All clear */
        .bm-focus-all-clear {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px 0; text-align: center;
        }

        /* Footer */
        .bm-focus-footer {
          display: flex; gap: 8px; flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
        }
        .bm-focus-action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 5px; padding: 9px 12px; border-radius: 9px;
          background: var(--color-bg-surface-raised);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary); font-size: 12px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
          transition: all 0.15s ease;
        }
        .bm-focus-action-btn:hover {
          background: var(--color-brand-subtle);
          border-color: var(--color-brand-border);
          color: var(--color-brand);
        }
      `}</style>
    </div>
  );
}
