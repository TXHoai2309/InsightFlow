"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { CrisisSignal } from "./insightEngine";

interface CrisisDetectorProps {
  signals: CrisisSignal[];
  loading?: boolean;
}

const SEVERITY_STYLE = {
  critical: { border: "border-red-300 bg-red-50", badge: "bg-red-600 text-white", icon: "🔴" },
  high:     { border: "border-red-200 bg-red-50/60", badge: "bg-red-500 text-white", icon: "🟠" },
  medium:   { border: "border-orange-200 bg-orange-50/60", badge: "bg-orange-500 text-white", icon: "🟡" },
  low:      { border: "border-yellow-200 bg-yellow-50/60", badge: "bg-yellow-500 text-white", icon: "🟢" },
};

const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook", tiktok: "TikTok", google: "Google", instagram: "Instagram", other: "Khác",
};

export function CrisisDetector({ signals, loading }: CrisisDetectorProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5">
        <div className="h-5 w-52 rounded bg-[var(--color-border)] animate-pulse mb-4" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-[var(--color-border)] animate-pulse mb-3" />)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="text-[18px]">⚠️</span>
            {t("bm.crisis.aiDetected", "AI phát hiện")}{" "}
            <span className={signals.length > 0 ? "text-red-600" : "text-[var(--color-text-secondary)]"}>
              {signals.length} {t("bm.crisis.abnormalSignals", "tín hiệu bất thường")}
            </span>
          </h3>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
            {t("bm.crisis.baselineDesc", "% tăng so với baseline — không phải % tĩnh tổng thảo luận")}
          </p>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="text-3xl mb-2">✅</span>
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">{t("bm.crisis.noSignals", "Không phát hiện tín hiệu bất thường")}</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">{t("bm.crisis.noSignalsDesc", "AI chưa thấy gì đáng lo ngại trong khoảng thời gian này")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((sig, i) => {
            const style = SEVERITY_STYLE[sig.severity];
            return (
              <div key={sig.topic + i} className={`rounded-xl border p-4 ${style.border}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span>{style.icon}</span>
                    <span className="text-[14px] font-bold text-[var(--color-text-primary)]">{sig.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                    {sig.severity === "critical" ? t("bm.crisis.critical", "NGHIÊM TRỌNG") : sig.severity === "high" ? t("bm.crisis.high", "CAO") : sig.severity === "medium" ? t("bm.crisis.medium", "TRUNG BÌNH") : t("bm.crisis.low", "THẤP")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="text-red-600 font-black text-[15px]">
                    ↑ +{sig.deltaPercent === 999 ? t("bm.crisis.newlyAppeared", "Mới xuất hiện") : `${sig.deltaPercent}%`}
                  </span>
                  <span className="text-[var(--color-text-muted)]">{t("bm.crisis.abnormalComplaints", "lượt phàn nàn bất thường")}</span>
                </div>
                {sig.contentSample && (
                  <p className="mt-2 text-[11px] text-[var(--color-text-muted)] italic bg-white/70 rounded-lg p-2 border border-white line-clamp-2">
                    "{sig.contentSample}"
                  </p>
                )}
                <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                  {t("bm.crisis.samplePlatform", "Nền tảng mẫu:")} <span className="font-semibold">{PLATFORM_LABEL[sig.platformSample] || (sig.platformSample === "other" ? t("common.other", "Khác") : sig.platformSample)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
