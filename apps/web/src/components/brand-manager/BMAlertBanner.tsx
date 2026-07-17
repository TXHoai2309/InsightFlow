"use client";

/**
 * BMAlertBanner — Critical alert banner hiển thị above the fold
 * khi có cảnh báo mức high/critical.
 */

import React, { useState } from "react";
import Link from "next/link";
import type { Alert } from "@/types/dashboard";

interface BMAlertBannerProps {
  alerts: Alert[];
}

import { useTranslation } from "react-i18next";

export function BMAlertBanner({ alerts }: BMAlertBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div
      id="bm-alert-banner"
      role="alert"
      style={{
        background: "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)",
        border: "1.5px solid #FECACA",
        borderLeft: "4px solid #EF4444",
        borderRadius: "14px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap",
        animation: "bm-slideIn 0.3s ease-out",
      }}
      className="dark:!bg-none dark:!border-red-500/30 dark:!border-l-red-500 dark:!bg-red-500/10"
    >
      {/* Pulse icon */}
      <div className="bm-alert-pulse-ring">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: "#EF4444", fontVariationSettings: "'FILL' 1" }}
        >
          emergency
        </span>
      </div>

      {/* Message */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#991B1B" }}
           className="dark:!text-red-300">
          {criticalCount > 0 && (
            <span className="bm-badge-critical">{criticalCount} {t("bm.alert.critical", "Khẩn cấp")}</span>
          )}
          {highCount > 0 && (
            <span className="bm-badge-high">{highCount} {t("bm.alert.high", "Cao")}</span>
          )}
          &nbsp;{t("bm.alert.newAlerts", "cảnh báo mới cần xử lý ngay")}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#B45309" }}
           className="dark:!text-orange-300">
          {alerts[0]?.message ?? t("bm.alert.aiAnomaly", "AI phát hiện dấu hiệu bất thường trong dữ liệu thương hiệu")}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/alerts"
        id="bm-alert-banner-cta"
        style={{
          padding: "8px 18px",
          background: "#EF4444",
          color: "#fff",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        {t("bm.alert.viewAlerts", "Xem cảnh báo")} →
      </Link>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Đóng thông báo"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#9CA3AF", padding: 4, borderRadius: 6,
          display: "flex", alignItems: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>

      <style>{`
        @keyframes bm-slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bm-alert-pulse-ring {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(239,68,68,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          animation: bm-pulse 2s infinite;
        }
        @keyframes bm-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        .bm-badge-critical {
          display: inline-block;
          background: #EF4444; color: #fff;
          padding: 2px 8px; border-radius: 4px;
          font-size: 12px; font-weight: 700; margin-right: 6px;
        }
        .bm-badge-high {
          display: inline-block;
          background: #F97316; color: #fff;
          padding: 2px 8px; border-radius: 4px;
          font-size: 12px; font-weight: 700; margin-right: 6px;
        }
      `}</style>
    </div>
  );
}
