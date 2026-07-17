"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { ViralRiskItem } from "./insightEngine";

interface ViralRiskProps {
  risks: ViralRiskItem[];
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

interface ReplyModalProps {
  selectedRisk: ViralRiskItem;
  onClose: () => void;
}

function ReplyModal({ selectedRisk, onClose }: ReplyModalProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(
    t("bm.viral.mockDraft", "Xin chào Quý khách, chúng tôi đã ghi nhận phản hồi về {{topic}} và sẽ khắc phục ngay. Chân thành cảm ơn!", { topic: selectedRisk.label })
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-[500px] max-w-[90vw] rounded-xl bg-[var(--color-bg-surface)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[var(--color-text-primary)]">💬 {t("bm.viral.quickReply", "Soạn phản hồi nhanh")}</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-red-500 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-[13px] text-[var(--color-text-primary)] resize-none outline-none focus:border-[var(--color-brand)] transition"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">{t("common.cancel", "Huỷ")}</button>
          <button
            onClick={() => { alert(t("bm.viral.sent", "Đã gửi phản hồi!")); onClose(); }}
            className="px-5 py-2 text-[13px] font-bold bg-[var(--color-brand)] text-white rounded-xl hover:opacity-90 transition"
          >
            {t("bm.viral.send", "Gửi phản hồi")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViralRisk({ risks }: ViralRiskProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedRisk, setSelectedRisk] = useState<ViralRiskItem | null>(null);

  const PLATFORM_ICON: Record<string, string> = {
    facebook: "🔵", tiktok: "⚫", google: "🔴", instagram: "🟣", other: "🌐",
  };
  const PLATFORM_LABEL: Record<string, string> = {
    facebook: "Facebook", tiktok: "TikTok", google: "Google Reviews", instagram: "Instagram", other: t("common.other", "Khác"),
  };

  if (risks.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-[18px]">
            <span>📡</span>
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">{t("bm.viral.title", "Viral Risk — Nội dung sắp bùng phát tiêu cực")}</h3>
          </div>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-3xl mb-2">🛡️</span>
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">{t("bm.viral.noRisk", "Không phát hiện nguy cơ viral tiêu cực")}</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">{t("bm.viral.underControl", "Tất cả nội dung đang trong tầm kiểm soát")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedRisk && <ReplyModal selectedRisk={selectedRisk} onClose={() => setSelectedRisk(null)} />}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-[18px]">
            <span>📡</span>
          </div>
          <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">{t("bm.viral.title", "Viral Risk — Nội dung sắp bùng phát tiêu cực")}</h3>
        </div>

        <div className="space-y-4">
          {risks.map((risk, i) => (
            <div key={i} className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">{PLATFORM_ICON[risk.platform] || "🌐"}</span>
                  <span className="text-[13px] font-bold text-[var(--color-text-primary)]">
                    {PLATFORM_LABEL[risk.platform] || risk.platform}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  <span className="text-[10px]">⚠</span>
                  <span className="text-[10px] font-bold">{t("bm.viral.riskWarning", "Nguy cơ Viral")}</span>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{risk.label}</p>
                {risk.contentSample && (
                  <p className="text-[11px] text-[var(--color-text-muted)] italic mt-1 line-clamp-2">
                    "{risk.contentSample}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 bg-orange-50/50 p-2 rounded-lg">
                <div className="text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)]">{t("bm.viral.complaints", "Phàn nàn")}</div>
                  <div className="text-[13px] font-bold text-orange-600">{risk.negativeCount}</div>
                </div>
                <div className="text-center border-x border-orange-200/50">
                  <div className="text-[10px] text-[var(--color-text-muted)]">{t("bm.viral.abnormalIncrease", "Tăng bất thường")}</div>
                  <div className="text-[13px] font-bold text-red-600">+{risk.deltaPercent}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[var(--color-text-muted)]">{t("bm.viral.projectedViews", "Dự phóng view")}</div>
                  <div className="text-[13px] font-bold text-[var(--color-text-primary)]">{formatViews(risk.projectedViews)}</div>
                </div>
              </div>

              <div className="mt-3 text-[11px] font-medium text-orange-700 bg-orange-100/50 px-2 py-1.5 rounded flex items-start gap-1">
                <span>📈</span>
                <span>{t("bm.viral.trendWarning", "Nếu tiếp tục xu hướng này, có thể đạt {{views}} view trong 48h", { views: formatViews(risk.projectedViews * 3) })}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[var(--color-border)]/50">
                <button className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-[var(--color-text-secondary)] text-[12px] font-bold rounded-lg transition-colors">
                  👁️ {t("bm.viral.track", "Theo dõi")}
                </button>
                <button
                  onClick={() => router.push("/team/staff?role=crisis")}
                  className="flex-1 py-1.5 px-2 bg-[var(--color-brand-subtle)] hover:bg-[var(--color-brand)] hover:text-white text-[var(--color-brand)] text-[12px] font-bold rounded-lg transition-colors"
                >
                  👥 {t("bm.viral.assign", "Phân công")}
                </button>
                <button
                  onClick={() => setSelectedRisk(risk)}
                  className="flex-1 py-1.5 px-2 bg-orange-100 hover:bg-orange-500 hover:text-white text-orange-600 text-[12px] font-bold rounded-lg transition-colors"
                >
                  💬 {t("bm.viral.reply", "Phản hồi")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
