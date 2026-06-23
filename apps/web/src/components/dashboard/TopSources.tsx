"use client";

/**
 * US-13: TopSources Component
 * Hiển thị top 5 nguồn dữ liệu (Facebook, TikTok, News, YouTube)
 */

import React from "react";
import type { TopSource } from "@/types/dashboard";
import { PLATFORM_META } from "@/lib/services/dashboard";

interface TopSourcesProps {
  sources: TopSource[];
}

export function TopSources({ sources }: TopSourcesProps) {
  return (
    <div
      className="rounded-lg p-6 shadow-sm h-full"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h4 className="font-bold text-lg mb-4" style={{ color: "var(--color-text-primary)" }}>
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
              <div className="w-full rounded-full h-2" style={{ backgroundColor: "var(--color-bg-surface-raised)" }}>
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
