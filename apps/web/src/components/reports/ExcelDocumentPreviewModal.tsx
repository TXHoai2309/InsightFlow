"use client";

import React from "react";

export function ExcelDocumentPreviewModal({
  title,
  description = "Bản xem trước bên dưới được tạo từ chính tài liệu dùng để tải xuống.",
  html,
  onClose,
  onExport,
}: {
  title: string;
  description?: string;
  html: string;
  onClose: () => void;
  onExport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm md:p-6">
      <div className="flex h-[94vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-brand)]">
              Bản xem trước Excel
            </p>
            <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">
              {title}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bản xem trước"
            className="rounded-full p-2 hover:bg-[var(--color-bg-surface-high)]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 bg-slate-200 p-3 md:p-5">
          <iframe
            title="Xem trước báo cáo Excel"
            srcDoc={html}
            className="h-full w-full rounded-lg border border-slate-300 bg-white"
          />
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)]"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            Xuất file Excel
          </button>
        </footer>
      </div>
    </div>
  );
}
