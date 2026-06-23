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
      <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-2">
        <span className="text-sm font-semibold text-outline uppercase">Tổng số Mentions</span>
        <span className="text-3xl font-bold text-on-surface">{overview.total_mentions.toLocaleString()}</span>
      </div>

      <div className="p-6 bg-red-50 rounded-2xl border border-red-100 shadow-sm flex flex-col gap-2">
        <span className="text-sm font-semibold text-red-600 uppercase">Mentions Rủi ro</span>
        <span className="text-3xl font-bold text-red-700">{overview.risk_mentions_count.toLocaleString()}</span>
      </div>

      <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-2">
        <span className="text-sm font-semibold text-outline uppercase">Nguồn phổ biến</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(overview.by_source)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => (
              <div key={source} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-outline-variant text-xs">
                <span className="font-medium text-on-surface capitalize">{source}</span>
                <span className="text-outline-variant">•</span>
                <span className="text-primary font-semibold">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
