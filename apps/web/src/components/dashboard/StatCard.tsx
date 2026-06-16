"use client";

/**
 * US-13: StatCard Component
 * Hiển thị thống kê chính (Mentions, Sentiment, Hot Leads)
 */

import React from "react";

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
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  bgColor = "bg-primary/10",
  textColor = "text-primary",
}: StatCardProps) {
  return (
    <div className="glass-card p-6 rounded-lg border border-surface-container-high">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 ${bgColor} rounded-lg`}>
          {icon ? (
            icon
          ) : (
            <span className="material-symbols-outlined">{icon}</span>
          )}
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              trend.isPositive
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>

      <p className="font-bold text-outline uppercase text-xs mb-2">{title}</p>
      <h3 className={`font-bold text-4xl ${textColor} mb-1`}>{value}</h3>
      {subtitle && (
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
      )}
    </div>
  );
}
