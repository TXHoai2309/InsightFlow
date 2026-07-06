"use client";

/**
 * BMTopSources — Top nguồn/kênh có nhiều mentions
 * Horizontal bar chart với platform icons và percentage.
 */

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PLATFORM_META } from "@/lib/services/dashboard";

interface SourceData {
  platform: string;
  count: number;
  percentage: number;
}

interface BMTopSourcesProps {
  sources: SourceData[];
}

// Color scheme for each platform bar
const BAR_COLORS = ["#6366F1", "#8B5CF6", "#A78BFA", "#C4B5FD", "#E9D5FF"];

export function BMTopSources({ sources }: BMTopSourcesProps) {
  const { t } = useTranslation();
  const maxPct = Math.max(...sources.map((s) => s.percentage), 1);

  return (
    <div className="bm-sources-card">
      {/* Header */}
      <div className="bm-sources-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(99,102,241,0.1)", color: "#6366F1",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              cell_tower
            </span>
          </div>
          <div>
            <h3 className="bm-sources-title">{t("bm.sources.title")}</h3>
            <p className="bm-sources-sub">{t("bm.sources.sub")}</p>
          </div>
        </div>

        <Link href="/mentions" id="bm-sources-view-all" className="bm-sources-link">
          {t("bm.sources.viewAll")}
        </Link>
      </div>

      {/* Source bars */}
      <div className="bm-sources-list">
        {sources.slice(0, 6).map((source, index) => {
          const baseMeta = PLATFORM_META[source.platform as keyof typeof PLATFORM_META];
          const meta: { icon?: string; color: string; label: string } = baseMeta
            ? { icon: (baseMeta as { icon?: string }).icon, color: baseMeta.color, label: baseMeta.label }
            : { icon: "ti-world", color: "#CBD5E1", label: source.platform };
          const barColor = BAR_COLORS[index % BAR_COLORS.length];
          const barWidth = (source.percentage / maxPct) * 100;

          return (
            <Link
              key={source.platform}
              href={`/mentions?platform=${source.platform.toLowerCase()}`}
              id={`bm-source-${source.platform}`}
              className="bm-source-item"
            >
              {/* Rank */}
              <span className="bm-source-rank">{index + 1}</span>

              {/* Platform icon */}
              <div
                className="bm-source-icon"
                style={{ background: meta.color + "20" }}
              >
                <i className={`ti ${meta.icon ?? "ti-world"}`} style={{ color: meta.color, fontSize: 14 }} />
              </div>

              {/* Name + bar */}
              <div className="bm-source-content">
                <div className="bm-source-top">
                  <span className="bm-source-name">{meta.label}</span>
                  <div className="bm-source-stats">
                    <span className="bm-source-count">
                      {source.count.toLocaleString("vi-VN")}
                    </span>
                    <span className="bm-source-pct">({source.percentage}%)</span>
                  </div>
                </div>
                <div className="bm-source-bar-bg">
                  <div
                    className="bm-source-bar-fill"
                    style={{
                      width: `${barWidth}%`,
                      background: barColor,
                      transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}

        {sources.length === 0 && (
          <div style={{
            padding: "32px", textAlign: "center",
            color: "var(--color-text-muted)", fontSize: 13,
          }}>
            {t("bm.sources.empty")}
          </div>
        )}
      </div>

      <style>{`
        .bm-sources-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px; padding: 24px;
          box-shadow: var(--shadow-card);
          transition: var(--transition-theme);
          height: 100%;
        }
        .bm-sources-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 20px; gap: 10px;
        }
        .bm-sources-title {
          font-size: 15px; font-weight: 700;
          color: var(--color-text-primary); margin: 0;
        }
        .bm-sources-sub {
          font-size: 11px; color: var(--color-text-muted); margin: 0; font-weight: 500;
        }
        .bm-sources-link {
          font-size: 13px; font-weight: 600; color: var(--color-brand);
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
        }
        .bm-sources-link:hover { text-decoration: underline; }

        .bm-sources-list { display: flex; flex-direction: column; gap: 10px; }
        .bm-source-item {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; padding: 8px; border-radius: 10px;
          border: 1px solid transparent;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .bm-source-item:hover {
          background: var(--color-bg-surface-raised);
          border-color: var(--color-border);
        }
        .bm-source-rank {
          font-size: 11px; font-weight: 700; color: var(--color-text-muted);
          width: 16px; text-align: center; flex-shrink: 0;
        }
        .bm-source-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-source-content { flex: 1; min-width: 0; }
        .bm-source-top {
          display: flex; justify-content: space-between;
          align-items: baseline; margin-bottom: 5px; gap: 6px;
        }
        .bm-source-name {
          font-size: 13px; font-weight: 600; color: var(--color-text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .bm-source-stats { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; }
        .bm-source-count { font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
        .bm-source-pct   { font-size: 11px; color: var(--color-text-muted); }
        .bm-source-bar-bg {
          height: 5px; background: var(--color-bg-surface-raised);
          border-radius: 3px; overflow: hidden;
        }
        .bm-source-bar-fill { height: 100%; border-radius: 3px; }
      `}</style>
    </div>
  );
}
