import React from 'react';

interface ProgressBarProps {
  current: number;   // 0-based index
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  if (total === 0) return null;
  const safeCurrent = Math.max(0, Math.min(current, total - 1));
  const displayCurrent = safeCurrent + 1;
  const pct = Math.max(0, Math.min(100, Math.round((displayCurrent / total) * 100)));

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {displayCurrent} / {total} threads ({pct}%)
      </span>
    </div>
  );
}
