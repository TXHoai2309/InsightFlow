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
  // Check if bgColor / textColor is hardcoded to adjust for dark mode
  const resolvedBgColor = bgColor === "bg-primary/10" 
    ? "bg-[var(--color-brand-subtle)]" 
    : bgColor === "bg-green-500/10" 
    ? "bg-[var(--color-success-subtle)]"
    : bgColor === "bg-amber-500/10"
    ? "bg-[var(--color-warning-subtle)]"
    : bgColor;

  const resolvedTextColor = textColor === "text-primary"
    ? "text-[var(--color-brand)]"
    : textColor === "text-green-600"
    ? "text-[var(--color-success)]"
    : textColor === "text-amber-600"
    ? "text-[var(--color-warning)]"
    : textColor;

  return (
    <div className="glass-card p-6 rounded-lg border border-[var(--color-border)]">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 ${resolvedBgColor} rounded-lg flex items-center justify-center`}>
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
                ? "text-[var(--color-success)] bg-[var(--color-success-subtle)]"
                : "text-[var(--color-error)] bg-[var(--color-error-subtle)]"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>

      <p className="font-bold text-[var(--color-text-muted)] uppercase text-xs mb-2">{title}</p>
      <h3 className={`font-bold text-4xl ${resolvedTextColor} mb-1`}>{value}</h3>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
      )}
    </div>
  );
}
