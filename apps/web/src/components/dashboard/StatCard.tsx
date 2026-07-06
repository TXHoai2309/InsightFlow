"use client";

/**
 * US-13: StatCard Component
 * Hiển thị thống kê chính (Mentions, Sentiment, Hot Leads) với mini sparkline.
 */

import React from "react";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  sparklineData?: number[];
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  bgColor = "bg-primary/10",
  textColor = "text-primary",
  sparklineData,
}: StatCardProps) {
  const { t } = useTranslation();
  // Simple sparkline generator
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const padding = 2;
    const height = 24;
    const width = 100;
    const step = width / (sparklineData.length - 1);

    const points = sparklineData.map((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(" ");

    const color = textColor === "text-primary" 
      ? "#6D5FFD" 
      : textColor === "text-green-600" 
      ? "#38A169" 
      : "#DD6B20";

    return (
      <div className="mt-4 w-full h-[24px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-aspect-ratio-none">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            points={points}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  const getResolvedBgColor = () => {
    if (textColor === "text-primary") return "bg-[#EEEDFF]";
    if (textColor === "text-green-600") return "bg-[#F0FFF4]";
    if (textColor === "text-amber-600") return "bg-[#FFFAF0]";
    return bgColor;
  };
  
  const getResolvedIconColor = () => {
    if (textColor === "text-primary") return "text-[#6D5FFD]";
    if (textColor === "text-green-600") return "text-[#38A169]";
    if (textColor === "text-amber-600") return "text-[#DD6B20]";
    return "";
  };

  const getResolvedTextColor = () => {
    if (textColor === "text-primary") return "text-[#6D5FFD]";
    if (textColor === "text-green-600") return "text-[#38A169]";
    if (textColor === "text-amber-600") return "text-[#DD6B20]";
    return "text-gray-800 dark:text-gray-100";
  };

  return (
    <div className="bg-white dark:bg-[#1a1b1e] p-5 md:p-6 rounded-[16px] border border-[var(--color-border)] shadow-sm flex flex-col transition-all hover:shadow-md h-full">
      <div className={`w-10 h-10 ${getResolvedBgColor()} rounded-[10px] flex items-center justify-center mb-4 shrink-0`}>
        <div className={getResolvedIconColor()}>
          {icon ? icon : <span className="material-symbols-outlined text-[20px]">analytics</span>}
        </div>
      </div>
      
      <p className="font-bold text-gray-500 text-[11px] uppercase tracking-wider mb-2">
        {title}
      </p>

      <div className="flex items-center gap-2 mb-1">
        <h3 className={`font-bold text-[32px] md:text-[36px] leading-none ${getResolvedTextColor()}`}>
          {value}
        </h3>
        {trend && (
          <span
            className={`text-[13px] font-bold flex items-center pt-1 ${
              trend.isPositive ? "text-[#38A169]" : "text-[#E53E3E]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px] font-bold">
              {trend.isPositive ? "arrow_drop_up" : "arrow_drop_down"}
            </span>
            {trend.value}%
          </span>
        )}
      </div>

      <p className="text-[12px] text-gray-500 font-medium">
        {subtitle || (trend?.isPositive !== undefined ? t("dashboard.alerts.vs7days", "so với 7 ngày trước") : "")}
      </p>
      
      {renderSparkline()}
    </div>
  );
}
