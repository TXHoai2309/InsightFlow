"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

function formatRemaining(remainingMs: number, language: string) {
  const minutes = Math.max(0, Math.ceil(remainingMs / 60_000));
  if (minutes < 60) {
    return language === "en" ? `${minutes} min left` : `Còn ${minutes} phút`;
  }

  const hours = Math.ceil(remainingMs / 3_600_000);
  if (hours < 48) {
    return language === "en" ? `${hours} hours left` : `Còn ${hours} giờ`;
  }

  const days = Math.ceil(remainingMs / 86_400_000);
  return language === "en" ? `${days} days left` : `Còn ${days} ngày`;
}

function formatCompactRemaining(remainingMs: number) {
  const minutes = Math.max(0, Math.ceil(remainingMs / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(remainingMs / 3_600_000);
  if (hours < 48) return `${hours}h`;
  return `${Math.ceil(remainingMs / 86_400_000)}d`;
}

export function TrialTimeRemaining() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!profile?.trialAccount || !profile.trialEndsAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [profile?.trialAccount, profile?.trialEndsAt]);

  if (!profile?.trialAccount || !profile.trialEndsAt) return null;

  const endsAt = new Date(profile.trialEndsAt);
  if (Number.isNaN(endsAt.getTime())) return null;

  const remainingMs = Math.max(0, endsAt.getTime() - now);
  const urgent = remainingMs <= 24 * 60 * 60 * 1000;
  const expired = remainingMs === 0;
  const label = expired
    ? (language === "en" ? "Trial expired" : "Đã hết hạn")
    : formatRemaining(remainingMs, language);
  const fullDate = endsAt.toLocaleString(language === "en" ? "en-US" : "vi-VN");

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-2 text-[11px] font-bold sm:gap-2 sm:px-3 sm:text-[12px] ${
        urgent
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      }`}
      title={`${language === "en" ? "Trial expires" : "Dùng thử đến"}: ${fullDate}`}
      aria-label={`${label}. ${language === "en" ? "Expires" : "Hết hạn lúc"} ${fullDate}`}
    >
      <span className="material-symbols-outlined text-[17px]">schedule</span>
      <span className="sm:hidden">{expired ? "0m" : formatCompactRemaining(remainingMs)}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
