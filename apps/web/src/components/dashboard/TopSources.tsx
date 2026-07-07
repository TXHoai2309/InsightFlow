"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PLATFORM_META } from "@/lib/services/dashboard";

interface SourceData {
  platform: string;
  count: number;
  percentage: number;
}

interface TopSourcesProps {
  sources: SourceData[];
}

export function TopSources({ sources }: TopSourcesProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-[#1a1b1e] p-5 md:p-6 rounded-[16px] border border-[var(--color-border)] shadow-sm flex flex-col">
      <h3 className="font-bold text-[15px] text-[#2A2B2F] dark:text-white mb-6">
        {t("dashboard.topSources.negativeTitle", "Nguồn Thảo Luận Chính")}
      </h3>

      <div className="flex-1 flex flex-col gap-5">
        {sources.slice(0, 5).map((source, index) => {
          const baseMeta = PLATFORM_META[source.platform as keyof typeof PLATFORM_META];
          const meta: { icon?: string; color: string; label: string } = baseMeta
            ? { icon: (baseMeta as { icon?: string }).icon, color: baseMeta.color, label: baseMeta.label }
            : { icon: "ti-world", color: "#CBD5E1", label: source.platform };
          
          // Use red for top 3, gray for rest to match screenshot
          const isTop3 = index < 3;
          const barColor = isTop3 ? "#F56565" : "#E2E8F0";

          return (
            <Link key={source.platform} href={`/mentions?platform=${source.platform.toLowerCase()}`} className="flex flex-col gap-1.5 group cursor-pointer">
              <div className="flex justify-between items-center text-[13px]">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[12px] group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: meta.color }}
                  >
                    <i className={`ti ${meta.icon ?? "ti-world"}`}></i>
                  </div>
                  <span className="font-medium text-[#4A5568] dark:text-[#E2E8F0] group-hover:text-primary transition-colors">
                    {meta.label}
                  </span>
                </div>
                <div className="font-medium text-[#4A5568] dark:text-[#E2E8F0]">
                  {source.count.toLocaleString("vi-VN")}{" "}
                  <span className="text-[#A0AEC0] ml-1">({source.percentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-[#EDF2F7] dark:bg-[#2D3748] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${source.percentage}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-6 text-center">
        <Link href="/mentions" className="text-[13px] font-semibold text-[#6D5FFD] hover:underline flex items-center justify-center gap-1">
          {t("dashboard.topSources.viewDetail", "Xem chi tiết nguồn")} &rarr;
        </Link>
      </div>
    </div>
  );
}
