"use client";

import React from "react";

export interface ReportPreviewStat {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "good" | "warn" | "danger";
}

export interface ReportPreviewSection {
  title: string;
  rows: Array<{ label: string; value: React.ReactNode }>;
}

export interface ReportPreviewSampleRow {
  label: string;
  meta?: string;
  description?: string;
  badge?: string;
}

export interface ReportExportPreviewModalProps {
  title: string;
  subtitle?: string;
  generatedAt?: string;
  formatLabel: string;
  stats: ReportPreviewStat[];
  summary?: string;
  sections?: ReportPreviewSection[];
  sampleRows?: ReportPreviewSampleRow[];
  isExporting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function statToneClass(tone: ReportPreviewStat["tone"]) {
  if (tone === "good") return "text-emerald-700";
  if (tone === "warn") return "text-amber-700";
  if (tone === "danger") return "text-red-700";
  return "text-[var(--color-brand)]";
}

export function ReportExportPreviewModal({
  title,
  subtitle,
  generatedAt,
  formatLabel,
  stats,
  summary,
  sections = [],
  sampleRows = [],
  isExporting = false,
  onClose,
  onConfirm,
}: ReportExportPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-brand)]">
              Preview bao cao
            </p>
            <h2 className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
            ) : null}
            {generatedAt ? (
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Cap nhat luc {new Date(generatedAt).toLocaleString("vi-VN")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-high)]"
            aria-label="Dong preview"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {stat.label}
                </p>
                <p className={`mt-2 text-2xl font-black ${statToneClass(stat.tone)}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </section>

          {summary ? (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4">
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">
                Tom tat noi dung se xuat
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {summary}
              </p>
            </section>
          ) : null}

          {sections.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-2">
              {sections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4"
                >
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">
                    {section.title}
                  </h3>
                  <div className="mt-3 space-y-2">
                    {section.rows.map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-[var(--color-text-secondary)]">{row.label}</span>
                        <span className="text-right font-bold text-[var(--color-text-primary)]">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {sampleRows.length > 0 ? (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">
                Du lieu mau trong file
              </h3>
              <div className="mt-3 divide-y divide-[var(--color-border)]">
                {sampleRows.slice(0, 6).map((row, index) => (
                  <div key={`${row.label}-${index}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                          {row.label}
                        </p>
                        {row.meta ? (
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{row.meta}</p>
                        ) : null}
                      </div>
                      {row.badge ? (
                        <span className="rounded-full bg-[var(--color-brand-subtle)] px-2 py-1 text-xs font-bold text-[var(--color-brand)]">
                          {row.badge}
                        </span>
                      ) : null}
                    </div>
                    {row.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {row.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)] disabled:opacity-50"
          >
            Huy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {isExporting ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base">file_download</span>
            )}
            Xuat {formatLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
