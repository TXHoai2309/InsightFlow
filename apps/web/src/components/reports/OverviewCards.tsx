"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface OverviewCardsProps {
  overview: {
    total_mentions: number;
    risk_mentions_count: number;
    by_source: Record<string, number>;
  };
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Mentions */}
      <div className="p-6 bg-[var(--color-bg-surface-raised)] rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--color-text-muted)] uppercase">{t("reports.overview.totalMentionsCard", { defaultValue: "Tổng số Mentions" })}</span>
        <span className="text-3xl font-bold text-[var(--color-text-primary)]">{overview.total_mentions.toLocaleString()}</span>
      </div>

      {/* Risk Mentions */}
      <div className="p-6 bg-[var(--color-error-subtle)] rounded-2xl border border-[var(--color-error)]/20 shadow-sm flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--color-error)] uppercase">{t("reports.overview.riskMentions", { defaultValue: "Mentions Rủi ro" })}</span>
        <span className="text-3xl font-bold text-[var(--color-error)]">{overview.risk_mentions_count.toLocaleString()}</span>
      </div>

      {/* Top Sources */}
      <div className="p-6 bg-[var(--color-bg-surface-raised)] rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--color-text-muted)] uppercase">{t("reports.overview.topSources", { defaultValue: "Nguồn phổ biến" })}</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(overview.by_source)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => (
              <div key={source} className="flex items-center gap-1 bg-[var(--color-bg-surface)] px-2 py-1 rounded border border-[var(--color-border)] text-xs">
                <span className="font-medium text-[var(--color-text-primary)] capitalize">{source}</span>
                <span className="text-[var(--color-text-muted)]">•</span>
                <span className="text-[var(--color-brand)] font-semibold">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
