"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export function BMTabs() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const TABS = [
    { href: "/dashboard", label: t("bm.tab.overview"), icon: "dashboard" },
    { href: "/dashboard/insights", label: "Tiềm năng & Khủng hoảng", icon: "trending_up" },
  ];


  return (
    <div className="bm-tabs-container">
      <div className="bm-tabs">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`bm-tab ${isActive ? "bm-tab--active" : ""}`}
            >
              <span className="material-symbols-outlined bm-tab-icon">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      <style>{`
        .bm-tabs-container {
          margin-bottom: 24px;
          border-bottom: 1px solid var(--color-border);
        }
        .bm-tabs {
          display: flex;
          align-items: center;
          gap: 32px;
          overflow-x: auto;
        }
        .bm-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-decoration: none;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
          position: relative;
          bottom: -1px; /* Overlap the container border */
          white-space: nowrap;
        }
        .bm-tab:hover {
          color: var(--color-text-primary);
        }
        .bm-tab--active {
          color: var(--color-brand);
          border-bottom-color: var(--color-brand);
        }
        .bm-tab-icon {
          font-size: 20px !important;
          font-variation-settings: 'FILL' 0;
          transition: font-variation-settings 0.2s ease;
        }
        .bm-tab--active .bm-tab-icon {
          font-variation-settings: 'FILL' 1;
        }
      `}</style>
    </div>
  );
}
