"use client";

import React from "react";

interface EarlyWarningProps {
  score: number;  // 0-99
  factors: string[];
}

export function EarlyWarning({ score, factors }: EarlyWarningProps) {
  const isHigh = score >= 65;
  const isMed  = score >= 40;

  const borderColor = isHigh ? "border-red-300"    : isMed ? "border-orange-300"   : "border-yellow-200";
  const bgGrad      = isHigh ? "from-red-50 to-white" : isMed ? "from-orange-50 to-white" : "from-yellow-50 to-white";
  const scoreColor  = isHigh ? "text-red-600"       : isMed ? "text-orange-500"     : "text-yellow-600";
  const label       = isHigh ? "Nguy cơ cao"         : isMed ? "Cần theo dõi"        : "Ổn định";
  const emoji       = isHigh ? "🔴"                  : isMed ? "🟠"                  : "🟡";

  return (
    <div className={`rounded-2xl border ${borderColor} bg-gradient-to-br ${bgGrad} p-5 shadow-sm`}>
      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
        <span>🛡️</span> Early Warning — Dự báo khủng hoảng
      </h3>

      {/* Score ring */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-border)" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="32"
              fill="none"
              stroke={isHigh ? "#ef4444" : isMed ? "#f97316" : "#eab308"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 201} 201`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[18px] font-black leading-none ${scoreColor}`}>{score}%</span>
          </div>
        </div>
        <div>
          <div className={`text-[20px] font-bold ${scoreColor} flex items-center gap-2`}>
            {emoji} {label}
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
            Xác suất leo thang thành khủng hoảng trong 24–48h tới
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 italic">
            ⚙️ Heuristic tạm — sẽ thay bằng model ML thật
          </p>
        </div>
      </div>

      {/* Factors checklist */}
      <div>
        <p className="text-[12px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
          Yếu tố AI phân tích:
        </p>
        <ul className="space-y-1.5">
          {factors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-primary)]">
              <span className={`mt-0.5 shrink-0 ${isHigh ? "text-red-500" : isMed ? "text-orange-500" : "text-yellow-500"}`}>✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
