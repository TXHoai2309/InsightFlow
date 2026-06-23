"use client";

/**
 * US-13: TopSources Component
 * Hiển thị top 5 nguồn dữ liệu (Facebook, TikTok, News, YouTube)
 */

import React from "react";
import { useTranslation } from "react-i18next";
import type { TopSource } from "@/types/dashboard";
import { PLATFORM_META } from "@/lib/services/dashboard";

interface TopSourcesProps {
  sources: TopSource[];
}

export function TopSources({ sources }: TopSourcesProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white border border-outline-variant rounded-lg p-6 shadow-sm h-full">
      <h4 className="font-bold text-lg text-on-surface mb-4">
        Top nguồn dữ liệu
      </h4>

      <div className="space-y-4">
        {sources.map((source) => {
          const meta = PLATFORM_META[source.platform] ?? { label: source.platform, color: "#999" };
          return (
            <div key={source.platform}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold">
                  {meta.label}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {source.count} ({source.percentage}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${source.percentage}%`,
                    backgroundColor: meta.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
