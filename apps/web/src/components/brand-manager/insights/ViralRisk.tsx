"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ViralRiskItem } from "./insightEngine";

interface ViralRiskProps {
  risks: ViralRiskItem[];
}

const PLATFORM_ICON: Record<string, string> = {
  facebook: "🔵", tiktok: "⚫", google: "🔴", instagram: "🟣", other: "🌐",
};
const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook", tiktok: "TikTok", google: "Google Reviews", instagram: "Instagram", other: "Khác",
};

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

interface ReplyModalProps {
  topic: string;
  onClose: () => void;
}

function ReplyModal({ topic, onClose }: ReplyModalProps) {
  const [text, setText] = useState(
    `Xin chào Quý khách, chúng tôi đã ghi nhận phản hồi về ${topic} và sẽ khắc phục ngay. Chân thành cảm ơn!`
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-bg-surface)] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[var(--color-text-primary)]">💬 Soạn phản hồi nhanh</h3>
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
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Huỷ</button>
          <button
            onClick={() => { alert("Đã gửi phản hồi!"); onClose(); }}
            className="px-5 py-2 text-[13px] font-bold bg-[var(--color-brand)] text-white rounded-xl hover:opacity-90 transition"
          >
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViralRisk({ risks }: ViralRiskProps) {
  const router = useRouter();
  const [replyTopic, setReplyTopic] = useState<string | null>(null);

  if (risks.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
          <span>📡</span> Viral Risk — Nội dung sắp bùng phát tiêu cực
        </h3>
        <div className="flex flex-col items-center py-8 text-center">
          <span className="text-3xl mb-2">🎉</span>
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Không phát hiện nguy cơ viral tiêu cực</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Tất cả nội dung đang trong tầm kiểm soát</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {replyTopic && <ReplyModal topic={replyTopic} onClose={() => setReplyTopic(null)} />}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
          <span>📡</span> Viral Risk — Nội dung sắp bùng phát tiêu cực
        </h3>

        <div className="space-y-4">
          {risks.map((risk, i) => (
            <div key={i} className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px]">{PLATFORM_ICON[risk.platform] || "🌐"}</span>
                <span className="text-[13px] font-bold text-[var(--color-text-primary)]">
                  {PLATFORM_LABEL[risk.platform] || risk.platform}
                </span>
                <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  ⚠ Nguy cơ Viral
                </span>
              </div>

              <div className="mb-2">
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{risk.label}</p>
                {risk.contentSample && (
                  <p className="text-[11px] text-[var(--color-text-muted)] italic mt-1 line-clamp-2">
                    "{risk.contentSample}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center bg-white rounded-lg p-2">
                  <div className="text-[16px] font-black text-red-600">{risk.negativeCount}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Phàn nàn</div>
                </div>
                <div className="text-center bg-white rounded-lg p-2">
                  <div className="text-[16px] font-black text-orange-500">+{risk.deltaPercent}%</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Tăng bất thường</div>
                </div>
                <div className="text-center bg-white rounded-lg p-2">
                  <div className="text-[16px] font-black text-[var(--color-text-primary)]">{formatViews(risk.projectedViews)}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Dự phóng view</div>
                </div>
              </div>

              <p className="text-[11px] text-red-700 bg-red-100 rounded-lg px-3 py-2 mb-3 font-medium">
                📈 Nếu tiếp tục xu hướng này, có thể đạt {formatViews(risk.projectedViews * 3)} view trong 48h
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-[var(--color-border)] bg-white py-2 text-[12px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition">
                  👁️ Theo dõi
                </button>
                <button
                  onClick={() => router.push("/team/staff?role=crisis")}
                  className="flex-1 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand-subtle)] py-2 text-[12px] font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white transition"
                >
                  👥 Phân công
                </button>
                <button
                  onClick={() => setReplyTopic(risk.label)}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-[12px] font-bold text-white hover:bg-red-600 transition"
                >
                  💬 Phản hồi
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
