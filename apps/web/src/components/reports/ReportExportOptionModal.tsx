"use client";

import React, { useState } from "react";
import { Sparkles, Table2, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export interface ReportExportOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRaw: () => void;
  onSelectAI: () => void;
  isGeneratingAI?: boolean;
}

export function ReportExportOptionModal({
  isOpen,
  onClose,
  onSelectRaw,
  onSelectAI,
  isGeneratingAI = false,
}: ReportExportOptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5 bg-[var(--color-bg-surface-raised)]">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--color-brand)]">
              <Zap className="h-3.5 w-3.5" />
              Tùy chọn xuất báo cáo
            </span>
            <h2 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
              Chọn phương thức tạo Báo cáo &amp; Excel
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              Vui lòng chọn 1 trong 2 hình thức tạo báo cáo phù hợp với nhu cầu của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-high)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body Options */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Option 1: Báo cáo thô */}
          <div
            onClick={onSelectRaw}
            className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-bg-surface-raised)] cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Table2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)] transition-colors">
                    1. Báo cáo thô nguyên bản
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Raw Data
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Xuất dữ liệu thống kê nguyên bản từ hệ thống hiện tại gồm chỉ số KPI, danh sách công việc, Lead &amp; Cảnh báo SLA theo bộ lọc của bạn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRaw();
              }}
              className="inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs font-bold text-[var(--color-text-primary)] group-hover:bg-[var(--color-brand)] group-hover:text-white group-hover:border-[var(--color-brand)] transition-all"
            >
              <span>Xem báo cáo thô</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Option 2: AI Gen Báo cáo */}
          <div
            onClick={() => {
              if (!isGeneratingAI) onSelectAI();
            }}
            className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border-2 border-[var(--color-brand)]/40 bg-[var(--color-brand)]/5 hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 cursor-pointer transition-all shadow-sm ${
              isGeneratingAI ? "opacity-75 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white shadow-md">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-[var(--color-brand)]">
                    2. AI Gen Báo cáo (Data + Insights)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[var(--color-brand)] text-white">
                    Gemini Key Rotation
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Đẩy toàn bộ dữ liệu vào Gemini AI qua API Key xoay vòng. AI sẽ tự động phân tích Net Sentiment, rủi ro SLA, điểm nóng và **dẫn chứng bằng số liệu thực tế** kèm khuyến nghị cho thương hiệu.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={(e) => {
                e.stopPropagation();
                if (!isGeneratingAI) onSelectAI();
              }}
              className="inline-flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-bold shadow-md hover:bg-[var(--color-brand-hover)] transition-all disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Tạo báo cáo AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-[var(--color-border)] px-6 py-4 bg-[var(--color-bg-surface-raised)] text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Nguồn dữ liệu chính xác 100% từ hệ thống</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
