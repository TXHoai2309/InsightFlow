"use client";

/**
 * US-13: TopSources Component
 * Hiển thị top 5 nguồn dữ liệu (Facebook, TikTok, News, YouTube)
 */

import React from "react";
import type { TopSource } from "@/types/dashboard";

interface TopSourcesProps {
  sources: TopSource[];
}

const platformColors: Record<string, string> = {
  facebook: "#1877F2",
  tiktok: "#000000",
  news: "#4648d4",
  youtube: "#FF0000",
};

const platformNames: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  news: "Báo điện tử",
  youtube: "YouTube",
};

export function TopSources({ sources }: TopSourcesProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-lg p-6 shadow-sm h-full">
      <h4 className="font-bold text-lg text-on-surface mb-4">
        Top nguồn dữ liệu
      </h4>

      <div className="space-y-4">
        {sources.map((source) => (
          <div key={source.platform}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold capitalize">
                {platformNames[source.platform]}
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
                  backgroundColor: platformColors[source.platform],
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
