"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { generateDailyReportPDF, generateCustomReportPDF } from "@/lib/pdfExport";
import { collection, getDocs } from "firebase/firestore";
import { secondDb } from "@/lib/firebase";
import { mapSourceToPlatform, PLATFORM_META } from "@/lib/services/dashboard";


/**
 * Report Center Page — Fully Mobile Responsive
 * Sử dụng Card layout cho mobile, Table cho desktop
 */

interface Mention {
  id: string;
  brand: string;
  source: string;
  content: string;
  content_type: "post" | "comment" | "reply";
  sentiment: string;
  topic: string;
  posted_at: string;
}

interface DailyReport {
  id: string;
  dateStr: string;
  dateObj: Date;
  brand: string;
  mentions: Mention[];
  size: string;
}

// Modal component for previewing a report
function ReportPreviewModal({
  report,
  onClose,
  onExport,
  isExporting,
}: {
  report: DailyReport;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
}) {
  const { t } = useTranslation();
  // Calculate basic stats for the preview
  const total = report.mentions.length;
  let pos = 0,
    neu = 0,
    neg = 0;
  const topics: Record<string, number> = {};

  report.mentions.forEach((m) => {
    const s = m.sentiment.toLowerCase();
    if (s.includes("pos")) pos++;
    else if (s.includes("neg")) neg++;
    else neu++;

    const topicKey = m.topic.toLowerCase();
    topics[topicKey] = (topics[topicKey] || 0) + 1;
  });

  const topTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Xem trước Báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">
              Thương hiệu
            </p>
            <p className="font-bold text-lg text-[var(--color-brand)] capitalize">
              {report.brand}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">
              Ngày báo cáo
            </p>
            <p className="font-bold text-lg text-[var(--color-text-primary)]">
              {report.dateStr}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase">
                Tổng lượt đề cập
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                {total}
              </p>
            </div>
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase">
                Chỉ số Cảm xúc
              </p>
              <div className="flex gap-2 text-sm mt-1 font-medium">
                <span className="text-[var(--color-success)]">
                  {pos} {t("reports.preview.pos", { defaultValue: "Tốt" })}
                </span>
                <span className="text-[var(--color-error)]">
                  {neg} {t("reports.preview.neg", { defaultValue: "Xấu" })}
                </span>
              </div>
            </div>
          </div>

          {topTopics.length > 0 && (
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mb-2">
                Chủ đề nổi bật
              </p>
              <div className="flex flex-wrap gap-2">
                {topTopics.map(([t, count]) => (
                  <span
                    key={t}
                    className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-2 py-1 rounded text-xs font-semibold capitalize text-[var(--color-text-primary)]"
                  >
                    {t}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[var(--color-text-secondary)] font-bold hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)]"
          >
            Đóng
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold shadow-sm hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-lg">
                download
              </span>
            )}
            Tải PDF
          </button>
        </div>
      </div>
    </div>
  );
}

interface ArchivedReport {
  id: string;
  title: string;
  dateStr: string;
  brand: string;
  startDate: string;
  endDate: string;
  filtersSummary: string;
  size: string;
  mentionsCount: number;
  insights: string;
  stats?: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    score: number;
  };
  mentions?: Mention[];
}

function ArchivedReportDetailModal({
  report,
  onClose,
  onExport,
  isExporting,
  onDelete,
}: {
  report: ArchivedReport;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [archiveMentionsPage, setArchiveMentionsPage] = useState(1);
  const stats = report.stats || {
    total: report.mentionsCount,
    positive: 0,
    negative: 0,
    neutral: 0,
    score: 0,
  };

  const mentions = report.mentions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col gap-5 my-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-3">
          <div>
            <span className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {report.id}
            </span>
            <h2 className="text-lg font-bold text-on-surface mt-1">
              {report.title}
            </h2>
            <p className="text-xs text-outline font-medium">
              Lưu trữ ngày: {report.dateStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full flex-shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
            <div>
              <p className="text-[10px] text-outline font-bold uppercase">
                Thương hiệu
              </p>
              <p className="font-bold text-sm text-primary capitalize">
                {report.brand}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-outline font-bold uppercase">
                Thời gian lọc
              </p>
              <p className="font-bold text-sm text-on-surface">
                {report.startDate
                  ? new Date(report.startDate).toLocaleDateString("vi-VN")
                  : "N/A"}{" "}
                -{" "}
                {report.endDate
                  ? new Date(report.endDate).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-outline font-bold uppercase">
                Bộ lọc
              </p>
              <p
                className="font-bold text-xs text-on-surface truncate"
                title={report.filtersSummary}
              >
                {report.filtersSummary}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-outline-variant rounded-xl p-3 text-center bg-surface-bright">
              <p className="text-[9px] text-outline font-bold uppercase">
                Đề cập
              </p>
              <p className="text-xl font-bold text-on-surface mt-0.5">
                {stats.total}
              </p>
            </div>
            <div className="border border-outline-variant rounded-xl p-3 text-center bg-surface-bright">
              <p className="text-[9px] text-outline font-bold uppercase">
                Tích cực
              </p>
              <p className="text-xl font-bold text-green-600 mt-0.5">
                {stats.positive}
                <span className="text-[10px] font-normal text-outline ml-1">
                  (
                  {stats.total > 0
                    ? Math.round((stats.positive / stats.total) * 100)
                    : 0}
                  %)
                </span>
              </p>
            </div>
            <div className="border border-outline-variant rounded-xl p-3 text-center bg-surface-bright">
              <p className="text-[9px] text-outline font-bold uppercase">
                Tiêu cực
              </p>
              <p className="text-xl font-bold text-red-600 mt-0.5">
                {stats.negative}
                <span className="text-[10px] font-normal text-outline ml-1">
                  (
                  {stats.total > 0
                    ? Math.round((stats.negative / stats.total) * 100)
                    : 0}
                  %)
                </span>
              </p>
            </div>
            <div className="border border-outline-variant rounded-xl p-3 text-center bg-surface-bright">
              <p className="text-[9px] text-outline font-bold uppercase">
                Net Sentiment
              </p>
              <p
                className={`text-xl font-bold mt-0.5 ${stats.score >= 50 ? "text-green-600" : stats.score > 0 ? "text-primary" : "text-red-600"}`}
              >
                {stats.score >= 0 ? "+" : ""}
                {stats.score}%
              </p>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-lg">
                psychology
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                AI Insights phân tích tại thời điểm lưu
              </h4>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {report.insights}
            </p>
          </div>

          {/* Sample Mentions List */}
          {mentions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-on-surface">
                Đề cập tiêu biểu ({mentions.length} bài viết)
              </h4>
              <ReportMentionsTable
                mentions={mentions.map((m, idx) => ({
                  ...m,
                  id: m.id || `archived-${idx}`,
                  content_type: m.content_type || "post",
                }))}
                currentPage={archiveMentionsPage}
                itemsPerPage={10}
                onPageChange={setArchiveMentionsPage}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center border-t border-outline-variant pt-3 mt-1">
          <button
            onClick={() => {
              if (
                confirm(
                  "Bạn có chắc chắn muốn xóa báo cáo này khỏi kho lưu trữ?",
                )
              ) {
                onDelete();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-xl font-bold text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              delete
            </span>
            Xóa lưu trữ
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-on-surface-variant font-bold text-xs hover:bg-surface-container transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={onExport}
              disabled={isExporting || mentions.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isExporting ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>
              )}
              {t("reports.common.downloadPdf", { defaultValue: "Tải PDF" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBrandName(brand: string): string {
  if (!brand) return "";
  const lower = brand.toLowerCase().trim();
  if (lower === "mixue") return "Mixue";
  if (lower.includes("highland")) return "Highland Coffee";
  if (lower.includes("starbuck")) return "Starbucks";

  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeSourceName(source: string): string {
  return mapSourceToPlatform(source);
}

function mapContentType(raw: unknown): Mention["content_type"] {
  const type = String(raw || "post").toLowerCase().trim();
  if (type === "comment") return "comment";
  if (type === "reply") return "reply";
  return "post";
}

function parsePostedAtRaw(field: unknown): string {
  if (!field) return "";
  if (typeof (field as { toDate?: () => Date }).toDate === "function") {
    return (field as { toDate: () => Date }).toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  const s = String(field).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00Z`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && (s.includes("+") || s.endsWith("Z"))) {
    return s;
  }
  const dmyRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const match = s.match(dmyRegex);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];
    const timeRegex = /(\d{1,2}):(\d{2})/;
    const timeMatch = s.match(timeRegex);
    const hour = timeMatch ? timeMatch[1].padStart(2, "0") : "00";
    const minute = timeMatch ? timeMatch[2].padStart(2, "0") : "00";
    return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.endsWith("Z") ? s : `${s}Z`;
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function parsePostedAtDate(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPlatformLabel(source: string): string {
  const key = source.toLowerCase() as keyof typeof PLATFORM_META;
  return PLATFORM_META[key]?.label || source;
}

function formatContentTypeLabel(type: Mention["content_type"]): string {
  const labels: Record<Mention["content_type"], string> = {
    post: "Post",
    comment: "Comment",
    reply: "Reply",
  };
  return labels[type] || "Post";
}

function formatSentimentLabel(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s.includes("pos")) return "Tích cực";
  if (s.includes("neg")) return "Tiêu cực";
  return "Trung lập";
}

function formatReportTime(value: string) {
  const date = parsePostedAtDate(value);
  if (!date) return { timeStr: "Không rõ", relativeTime: "" };
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  let relativeTime = "Vừa xong";
  if (diffDays >= 1) relativeTime = `${diffDays} ngày trước`;
  else if (diffHours >= 1) relativeTime = `${diffHours} giờ trước`;
  else if (diffMinutes >= 1) relativeTime = `${diffMinutes} phút trước`;
  return { timeStr, relativeTime };
}

function ReportPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "báo cáo",
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  if (totalItems === 0) return null;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div
      className="px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
      style={{
        backgroundColor: "var(--color-bg-surface-raised)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <span className="text-xs text-[var(--color-text-muted)] font-medium">
        Hiển thị {startIndex + 1}–{endIndex} trên tổng số {totalItems} {itemLabel}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
            currentPage === 1
              ? "text-[var(--color-text-disabled)] cursor-not-allowed border-[var(--color-border)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] border-[var(--color-border)]"
          }`}
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let startPage = Math.max(1, currentPage - 2);
          if (startPage + 4 > totalPages) startPage = Math.max(1, totalPages - 4);
          const pageNum = startPage + i;
          if (pageNum > totalPages) return null;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded font-medium text-sm transition-colors ${
                currentPage === pageNum
                  ? "bg-[var(--color-brand)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
            currentPage === totalPages
              ? "text-[var(--color-text-disabled)] cursor-not-allowed border-[var(--color-border)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] border-[var(--color-border)]"
          }`}
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

function ReportMentionsTable({
  mentions,
  currentPage,
  itemsPerPage,
  onPageChange,
}: {
  mentions: Mention[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(mentions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageMentions = mentions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div
      className="rounded-2xl shadow-sm overflow-hidden border border-[var(--color-border)]"
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="md:hidden divide-y divide-[var(--color-border)]">
        {pageMentions.map((m) => {
          const { timeStr, relativeTime } = formatReportTime(m.posted_at);
          return (
            <div key={m.id} className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-[var(--color-brand)]">{formatPlatformLabel(m.source)}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                  {formatContentTypeLabel(m.content_type)}
                </span>
              </div>
              <p className="text-[var(--color-text-primary)]">{m.content}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-info-subtle)] text-[var(--color-info)]">
                  {formatSentimentLabel(m.sentiment)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]">
                  {m.topic}
                </span>
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                <div>{timeStr}</div>
                {relativeTime && <div>{relativeTime}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-surface-raised)", borderBottom: "1px solid var(--color-border)" }}>
              <th className="px-4 py-4 font-semibold uppercase tracking-wider text-center w-28">Nền tảng</th>
              <th className="px-4 py-4 font-semibold uppercase tracking-wider text-center">Nội dung liên quan</th>
              <th className="px-4 py-4 font-semibold uppercase tracking-wider text-center w-28">Phân loại</th>
              <th className="px-4 py-4 font-semibold uppercase tracking-wider text-center w-28">Sắc thái</th>
              <th className="px-4 py-4 font-semibold uppercase tracking-wider text-center w-28">Chủ đề</th>
              <th className="px-4 py-4 font-semibold uppercase tracking-wider text-center w-40">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {pageMentions.map((m) => {
              const { timeStr, relativeTime } = formatReportTime(m.posted_at);
              const sentimentClass =
                m.sentiment.toLowerCase().includes("pos")
                  ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                  : m.sentiment.toLowerCase().includes("neg")
                    ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]"
                    : "bg-[var(--color-info-subtle)] text-[var(--color-info)]";
              return (
                <tr key={m.id} className="hover:bg-[var(--color-bg-surface-raised)] transition-colors">
                  <td className="px-4 py-4 text-center font-medium text-[var(--color-text-primary)]">
                    {formatPlatformLabel(m.source)}
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-primary)] line-clamp-2">{m.content}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                      {formatContentTypeLabel(m.content_type)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sentimentClass}`}>
                      {formatSentimentLabel(m.sentiment)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]">
                      {m.topic}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-center">
                      <span className="font-medium text-[var(--color-text-primary)] text-sm">{timeStr}</span>
                      {relativeTime && (
                        <span className="text-xs text-[var(--color-text-muted)]">{relativeTime}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ReportPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={mentions.length}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        itemLabel="đề cập"
      />
    </div>
  );
}

function normalizeTopicName(topic: unknown): string {
  const firstTopic = Array.isArray(topic) ? topic[0] : topic;
  const normalized = String(firstTopic || "other").toLowerCase().trim();
  const validTopics = new Set([
    "quality",
    "price",
    "service",
    "staff",
    "delivery",
    "experience",
    "legal",
    "operation",
    "marketing",
    "competitor",
    "other",
  ]);

  return validTopics.has(normalized) ? normalized : "other";
}

function generateAIInsights(
  brand: string,
  mentions: Mention[],
  prompt: string,
  lang: string = "vi",
): string {
  const total = mentions.length;
  if (lang === "en") {
    if (total === 0) return "No mention data available for analysis.";
  } else {
    if (total === 0) return "Không có dữ liệu đề cập để phân tích.";
  }

  let positive = 0;
  let negative = 0;
  let neutral = 0;
  const topicCounts: Record<string, number> = {};
  const topicSentiment: Record<
    string,
    { pos: number; neg: number; neu: number }
  > = {};

  mentions.forEach((m) => {
    const s = m.sentiment.toLowerCase();
    if (s.includes("pos")) positive++;
    else if (s.includes("neg")) negative++;
    else neutral++;

    const t = m.topic;
    topicCounts[t] = (topicCounts[t] || 0) + 1;
    if (!topicSentiment[t]) topicSentiment[t] = { pos: 0, neg: 0, neu: 0 };
    if (s.includes("pos")) topicSentiment[t].pos++;
    else if (s.includes("neg")) topicSentiment[t].neg++;
    else topicSentiment[t].neu++;
  });

  const netSentiment = Math.round(((positive - negative) / total) * 100);
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  const mainTopic = sortedTopics[0] ? sortedTopics[0][0] : "other";
  const secondTopic = sortedTopics[1] ? sortedTopics[1][0] : "";

  if (lang === "en") {
    const displayBrand = brand === "all" ? "all brands" : brand;
    let summary = `INTELLIGENT ANALYSIS REPORT (AI INSIGHTS) FOR BRAND: ${displayBrand.toUpperCase()}\n\n`;
    summary += `1. OVERALL BRAND HEALTH EVALUATION:\n`;
    summary += `Out of the collected dataset of ${total} mentions, the sentiment score for ${displayBrand} reached a Net Sentiment of ${netSentiment > 0 ? "+" : ""}${netSentiment}%. `;
    
    if (netSentiment >= 40) {
      summary += `This index is highly positive, reflecting excellent customer satisfaction and brand affinity. Positive discussions represent the majority (${Math.round(positive/total*100)}%), mostly praising product and service quality. `;
    } else if (netSentiment >= 10) {
      summary += `The brand maintains a relatively stable public image. Although positive sentiment (${Math.round(positive/total*100)}%) is dominant, some average or constructive feedback has been recorded. `;
    } else if (netSentiment >= -10) {
      summary += `Consumer sentiment is currently neutral or polarized. The amount of positive (${Math.round(positive/total*100)}%) and negative (${Math.round(negative/total*100)}%) feedback is quite balanced. The business should monitor conflicting market signals. `;
    } else {
      summary += `Warning: The brand's sentiment index is alarmingly low (${netSentiment}%). Negative feedback accounts for a high proportion (${Math.round(negative/total*100)}%). The brand faces significant public criticism or customer dissatisfaction, requiring immediate crisis management. `;
    }

    summary += `\n\n2. TOPIC ANALYSIS AND PUBLIC INTEREST HOTSPOTS:\n`;
    summary += `The most prominent topic is '${mainTopic.toUpperCase()}' with ${topicCounts[mainTopic]} mentions (${Math.round(topicCounts[mainTopic]/total*100)}% of total discussions). `;
    
    const mainTopicSent = topicSentiment[mainTopic];
    if (mainTopicSent) {
      const mainPosRatio = Math.round(mainTopicSent.pos / topicCounts[mainTopic] * 100);
      const mainNegRatio = Math.round(mainTopicSent.neg / topicCounts[mainTopic] * 100);
      if (mainPosRatio >= 60) {
        summary += `Under the topic '${mainTopic.toUpperCase()}', customers expressed highly positive reviews (accounting for ${mainPosRatio}% positive). This core competitive strength drives the brand's overall positive sentiment. `;
      } else if (mainNegRatio >= 40) {
        summary += `Worryingly, the topic '${mainTopic.toUpperCase()}' is also the 'hotspot' receiving the most criticism, with negative feedback at ${mainNegRatio}%. Key issues are mainly related to direct experiences or inconsistent quality. `;
      } else {
        summary += `Discussions around this topic are mostly objective, sharing neutral experiences (${Math.round(mainTopicSent.neu/topicCounts[mainTopic]*100)}%). `;
      }
    }

    if (secondTopic) {
      summary += `The second most active topic is '${secondTopic.toUpperCase()}' contributing ${topicCounts[secondTopic]} discussions. `;
      const secSent = topicSentiment[secondTopic];
      if (secSent) {
        if (secSent.pos > secSent.neg) {
          summary += `This topic has recorded positive customer reception, reflecting good improvements in recent campaigns or customer experience. `;
        } else if (secSent.neg > secSent.pos) {
          summary += `This is a secondary weakness to address, as negative feedback still outweighs positive comments. `;
        }
      }
    }

    if (prompt && prompt.trim() !== "") {
      summary += `\n\n3. IN-DEPTH EVALUATION BASED ON CUSTOM REQUIREMENTS:\n`;
      summary += `Your custom direction: "${prompt}"\n`;
      summary += `Based on in-depth analysis of the above query: AI detected focused direct discussions that align with your specified direction. `;
      
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("price") || lowerPrompt.includes("expensive") || lowerPrompt.includes("cheap") || lowerPrompt.includes("giá")) {
        const priceMentions = mentions.filter(m => m.topic === "price");
        summary += `The system recorded ${priceMentions.length} direct mentions related to price. Customers show sensitivity towards pricing, especially as promotional campaigns decrease. `;
      } else if (lowerPrompt.includes("service") || lowerPrompt.includes("staff") || lowerPrompt.includes("attitude") || lowerPrompt.includes("phục vụ") || lowerPrompt.includes("nhân viên")) {
        const serviceMentions = mentions.filter(m => m.topic === "service" || m.topic === "staff");
        const serviceNeg = serviceMentions.filter(m => m.sentiment === "negative").length;
        summary += `There are ${serviceMentions.length} discussions related to service quality and staff attitude. Of these, ${serviceNeg} are negative, reflecting issues like long waiting times or unprofessional behavior at some points. `;
      } else if (lowerPrompt.includes("quality") || lowerPrompt.includes("taste") || lowerPrompt.includes("drink") || lowerPrompt.includes("chất lượng") || lowerPrompt.includes("ngon")) {
        const qualityMentions = mentions.filter(m => m.topic === "quality");
        summary += `Analysis of ${qualityMentions.length} discussions on product quality shows diverse user feedback regarding beverage flavor, presentation, and ingredient freshness. `;
      } else {
        summary += `AI has noted user interest in this area and suggests continuing to monitor related keywords on social platforms to optimize products and services. `;
      }
    }

    summary += `\n\n4. RECOMMENDED ACTION PLAN:\n`;
    if (negative > 0) {
      summary += `- Urgently review negative posts under the topic '${mainTopic.toUpperCase()}' to implement response measures or adjust operations.\n`;
    }
    if (netSentiment < 20) {
      summary += `- Enhance positive media campaigns or customer care programs to improve the brand's sentiment index (Net Sentiment).\n`;
    } else {
      summary += `- Capitalize on strengths and maintain superior quality standards in the '${mainTopic.toUpperCase()}' segment, which currently enjoys strong customer trust.\n`;
    }
    summary += `- Leverage feedback from high-engagement channels to spread the brand message effectively.`;

    return summary;
  }

  const displayBrand = brand === "all" ? "các nhãn hàng" : brand;
  let summary = `BÁO CÁO PHÂN TÍCH THÔNG MINH (AI INSIGHTS) CHO THƯƠNG HIỆU: ${displayBrand.toUpperCase()}\n\n`;
  summary += `1. ĐÁNH GIÁ CHUNG VỀ SỨC KHỎE THƯƠNG HIỆU:\n`;
  summary += `Trong tập dữ liệu thu thập gồm ${total} lượt đề cập, sắc thái thảo luận của khách hàng đối với ${displayBrand} có chỉ số cảm xúc ròng (Net Sentiment) đạt ${netSentiment > 0 ? "+" : ""}${netSentiment}%. `;

  if (netSentiment >= 40) {
    summary += `Đây là mức chỉ số cực kỳ khả quan, phản ánh mức độ hài lòng và thiện cảm thương hiệu rất cao từ người tiêu dùng. Nhóm thảo luận tích cực chiếm đa số (${Math.round((positive / total) * 100)}%), tập trung ngợi khen các khía cạnh về sản phẩm và chất lượng dịch vụ. `;
  } else if (netSentiment >= 10) {
    summary += `Thương hiệu đang duy trì hình ảnh tương đối ổn định trong mắt công chúng. Mặc dù lượng thảo luận tích cực (${Math.round((positive / total) * 100)}%) chiếm ưu thế, song vẫn ghi nhận một số phản hồi chưa hài lòng ở mức trung bình hoặc góp ý xây dựng. `;
  } else if (netSentiment >= -10) {
    summary += `Cảm xúc của người tiêu dùng đang ở trạng thái trung dung hoặc phân cực. Số lượng ý kiến tích cực (${Math.round((positive / total) * 100)}%) và tiêu cực (${Math.round((negative / total) * 100)}%) khá cân bằng. Doanh nghiệp cần chú ý theo dõi các tín hiệu trái chiều từ thị trường. `;
  } else {
    summary += `Cảnh báo: Chỉ số cảm xúc của thương hiệu đang ở mức thấp báo động (${netSentiment}%). Lượng phản hồi tiêu cực chiếm tỉ lệ cao (${Math.round((negative / total) * 100)}%). Thương hiệu đang phải đối mặt với một số luồng chỉ trích hoặc bất bình lớn từ khách hàng cần lập tức can thiệp xử lý khủng hoảng. `;
  }

  summary += `\n\n2. PHÂN TÍCH CHỦ ĐỀ VÀ ĐIỂM NÓNG DƯ LUẬN:\n`;
  summary += `Chủ đề thảo luận nổi bật nhất chiếm tỉ trọng lớn nhất là '${mainTopic.toUpperCase()}' với ${topicCounts[mainTopic]} lượt đề cập (${Math.round((topicCounts[mainTopic] / total) * 100)}% tổng thảo luận). `;

  const mainTopicSent = topicSentiment[mainTopic];
  if (mainTopicSent) {
    const mainPosRatio = Math.round(
      (mainTopicSent.pos / topicCounts[mainTopic]) * 100,
    );
    const mainNegRatio = Math.round(
      (mainTopicSent.neg / topicCounts[mainTopic]) * 100,
    );
    if (mainPosRatio >= 60) {
      summary += `Tại chủ đề '${mainTopic.toUpperCase()}', khách hàng thể hiện thái độ đánh giá rất cao (chiếm ${mainPosRatio}% tích cực). Đây chính là thế mạnh cạnh tranh cốt lõi giúp kéo cảm xúc tích cực của thương hiệu lên cao. `;
    } else if (mainNegRatio >= 40) {
      summary += `Đáng lo ngại, chủ đề '${mainTopic.toUpperCase()}' cũng chính là 'điểm nóng' nhận nhiều chỉ trích nhất với tỉ lệ tiêu cực chiếm tới ${mainNegRatio}%. Các vấn đề nổi cộm chủ yếu liên quan tới trải nghiệm trực tiếp hoặc sự không đồng nhất về chất lượng. `;
    } else {
      summary += `Thảo luận xoay quanh chủ đề này chủ yếu mang tính khách quan, chia sẻ trải nghiệm trung tính (${Math.round((mainTopicSent.neu / topicCounts[mainTopic]) * 100)}%). `;
    }
  }

  if (secondTopic) {
    summary += `Chủ đề xếp thứ hai là '${secondTopic.toUpperCase()}' đóng góp ${topicCounts[secondTopic]} lượt thảo luận. `;
    const secSent = topicSentiment[secondTopic];
    if (secSent) {
      if (secSent.pos > secSent.neg) {
        summary += `Chủ đề này ghi nhận xu hướng đón nhận tích cực từ khách hàng, phản ánh việc cải thiện tốt trong các chiến dịch hoặc nâng cao trải nghiệm gần đây. `;
      } else if (secSent.neg > secSent.pos) {
        summary += `Đây là điểm yếu thứ hai cần lưu ý do lượng phản hồi tiêu cực vẫn lấn lướt các lời khen ngợi. `;
      }
    }
  }

  if (prompt && prompt.trim() !== "") {
    summary += `\n\n3. ĐÁNH GIÁ CHUYÊN SÂU THEO YÊU CẦU RIÊNG:\n`;
    summary += `Yêu cầu bổ sung của bạn: "${prompt}"\n`;
    summary += `Dựa trên phân tích chuyên sâu cho từ khóa/yêu cầu trên: AI nhận thấy dữ liệu có sự tập trung vào các luồng thảo luận trực tiếp có chứa sắc thái biểu đạt liên quan đến định hướng yêu cầu của bạn. `;

    const lowerPrompt = prompt.toLowerCase();
    if (
      lowerPrompt.includes("giá") ||
      lowerPrompt.includes("price") ||
      lowerPrompt.includes("đắt") ||
      lowerPrompt.includes("rẻ")
    ) {
      const priceMentions = mentions.filter((m) => m.topic === "price");
      summary += `Hệ thống ghi nhận có ${priceMentions.length} lượt đề cập trực tiếp đến yếu tố giá cả. Khách hàng đang có xu hướng nhạy cảm hơn về giá, đặc biệt là trong bối cảnh các chương trình khuyến mãi giảm bớt. `;
    } else if (
      lowerPrompt.includes("phục vụ") ||
      lowerPrompt.includes("nhân viên") ||
      lowerPrompt.includes("thái độ") ||
      lowerPrompt.includes("service") ||
      lowerPrompt.includes("staff")
    ) {
      const serviceMentions = mentions.filter(
        (m) => m.topic === "service" || m.topic === "staff",
      );
      const serviceNeg = serviceMentions.filter(
        (m) => m.sentiment === "negative",
      ).length;
      summary += `Có tổng số ${serviceMentions.length} thảo luận liên quan đến chất lượng phục vụ và thái độ nhân viên. Trong đó có ${serviceNeg} phản hồi tiêu cực, phản ánh các vấn đề như thời gian chờ lâu, thái độ thiếu chuyên nghiệp tại một số điểm chạm. `;
    } else if (
      lowerPrompt.includes("chất lượng") ||
      lowerPrompt.includes("ngon") ||
      lowerPrompt.includes("dở") ||
      lowerPrompt.includes("nước") ||
      lowerPrompt.includes("bánh") ||
      lowerPrompt.includes("quality")
    ) {
      const qualityMentions = mentions.filter((m) => m.topic === "quality");
      summary += `Phân tích ${qualityMentions.length} lượt thảo luận về chất lượng sản phẩm cho thấy sự đánh giá đa dạng của người dùng về hương vị đồ uống, cách trình bày và độ tươi ngon của nguyên liệu. `;
    } else {
      summary += `AI ghi nhận mối quan tâm của người dùng về vấn đề này và đề xuất tiếp tục theo dõi sát các từ khóa liên quan trên các nền tảng mạng xã hội để kịp thời tối ưu hóa sản phẩm và dịch vụ. `;
    }
  }

  summary += `\n\n4. ĐỀ XUẤT HÀNH ĐỘNG KHUYÊN DÙNG:\n`;
  if (negative > 0) {
    summary += `- Khẩn trương rà soát lại các bài đăng tiêu cực ở chủ đề '${mainTopic.toUpperCase()}' để có biện pháp phản hồi hoặc sửa đổi quy trình tương ứng.\n`;
  }
  if (netSentiment < 20) {
    summary += `- Tăng cường các chiến dịch truyền thông tích cực hoặc chương trình chăm sóc khách hàng để cải thiện chỉ số cảm xúc thương hiệu (Net Sentiment) hiện tại.\n`;
  } else {
    summary += `- Tiếp tục phát huy lợi thế và duy trì tiêu chuẩn chất lượng vượt trội tại mảng '${mainTopic.toUpperCase()}' vốn đang chiếm trọn niềm tin của khách hàng.\n`;
  }
  summary += `- Tận dụng các phản hồi từ kênh có tương tác cao để lan tỏa thông điệp thương hiệu hiệu quả hơn.`;

  return summary;
}

function LanguageSelectModal({
  isOpen,
  onClose,
  onSelect,
  isExporting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lang: "vi" | "en") => void;
  isExporting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Chọn ngôn ngữ báo cáo
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] -mt-2">
          Vui lòng lựa chọn ngôn ngữ phù hợp cho bản báo cáo PDF tải xuống.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect("vi")}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all group disabled:opacity-50 text-center"
          >
            <span className="text-3xl">🇻🇳</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)]">
              Tiếng Việt
            </span>
          </button>
          <button
            onClick={() => onSelect("en")}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all group disabled:opacity-50 text-center"
          >
            <span className="text-3xl">🇬🇧</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)]">
              English
            </span>
          </button>
        </div>

        {isExporting && (
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-brand)] font-bold mt-1">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            Đang xuất báo cáo PDF...
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"periodic" | "custom" | "archive">(
    "periodic",
  );
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // "all", "today", "week", "month"

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);
  const [exportConfig, setExportConfig] = useState<{
    type: "periodic" | "custom" | "archive";
    data: any;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [customMentionsPage, setCustomMentionsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ── States for Custom Report ──
  const [customBrand, setCustomBrand] = useState("all");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [customPlatforms, setCustomPlatforms] = useState<string[]>([
    "facebook",
    "tiktok",
    "youtube",
    "thread",
    "be",
    "google_maps",
    "news",
  ]);
  const [customTopics, setCustomTopics] = useState<string[]>([
    "quality",
    "price",
    "service",
    "staff",
    "delivery",
    "experience",
    "legal",
    "operation",
    "marketing",
    "competitor",
    "other",
  ]);
  const [customSentiments, setCustomSentiments] = useState<string[]>([
    "positive",
    "neutral",
    "negative",
  ]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customReportLoading, setCustomReportLoading] = useState(false);
  const [customReportGenerated, setCustomReportGenerated] = useState(false);
  const [customReportData, setCustomReportData] = useState<{
    mentions: Mention[];
    stats: {
      total: number;
      positive: number;
      negative: number;
      neutral: number;
      score: number;
    };
    aiInsights: string;
  } | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // ── States for Archived Reports ──
  const [archivedReports, setArchivedReports] = useState<any[]>([]);
  const [previewArchiveReport, setPreviewArchiveReport] = useState<any | null>(
    null,
  );
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [archiveBrandFilter, setArchiveBrandFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("insightflow_archived_reports_v2");
    if (saved) {
      try {
        setArchivedReports(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading archived reports:", e);
      }
    } else {
      setArchivedReports([]);
      return;
      const initialMocks = [
        {
          id: "RPT-ARC-001",
          title: "Báo cáo Chiến dịch Tết 2026 - Laha Coffee",
          dateStr: "15/02/2026",
          brand: "Laha Coffee",
          startDate: "2026-02-01",
          endDate: "2026-02-15",
          filtersSummary: "7 nguồn, 11 chủ đề, 3 sắc thái",
          size: "2.4 MB",
          mentionsCount: 3,
          insights:
            "Báo cáo lưu trữ tổng hợp chiến dịch Tết Nguyên Đán 2026. Laha Coffee ghi nhận tương tác thảo luận tích cực tăng mạnh 28% so với cùng kỳ năm ngoái. Khách hàng thể hiện sự hài lòng rất lớn đối với chất lượng nước và các chương trình khuyến mãi lì xì đầu năm. Tuy nhiên, ghi nhận một vài phản hồi tiêu cực về tình trạng xếp hàng chờ đợi tại các chi nhánh trung tâm trong giờ cao điểm.",
          stats: { total: 3, positive: 2, negative: 0, neutral: 1, score: 67 },
          mentions: [
            {
              id: "m1",
              brand: "Laha Coffee",
              source: "Facebook",
              content:
                "Cà phê muối Laha ngon ghê, đợt Tết này có lì xì nữa thích quá!",
              sentiment: "positive",
              topic: "quality",
              posted_at: "2026-02-10",
            },
            {
              id: "m2",
              brand: "Laha Coffee",
              source: "TikTok",
              content:
                "Quán Laha Coffee chi nhánh Quận 1 đông quá trời đông, chờ 20 phút mới có nước :( nhưng nước ngon nên bỏ qua",
              sentiment: "neutral",
              topic: "service",
              posted_at: "2026-02-12",
            },
            {
              id: "m3",
              brand: "Laha Coffee",
              source: "Facebook",
              content: "Laha phục vụ ngày Tết rất chu đáo và thân thiện nha.",
              sentiment: "positive",
              topic: "service",
              posted_at: "2026-02-14",
            },
          ],
        },
        {
          id: "RPT-ARC-002",
          title: "Báo cáo So sánh Quý 1 - Highlands vs Mixue",
          dateStr: "31/03/2026",
          brand: "Mixue",
          startDate: "2026-03-15",
          endDate: "2026-03-31",
          filtersSummary: "7 nguồn, 11 chủ đề, 3 sắc thái",
          size: "4.1 MB",
          mentionsCount: 3,
          insights:
            "Phân tích cạnh tranh trong Q1 giữa đối thủ trực tiếp Mixue và Highlands. Mixue dẫn đầu về lượng thảo luận giá bán, đặc biệt là dòng kem 10k và trà sữa giá rẻ. Phản hồi tích cực chiếm 55% nhờ giá cả phù hợp túi tiền học sinh sinh viên. Mặc dù vậy, có một số ý kiến phàn nàn về không gian quán nhỏ hẹp và dịch vụ vệ sinh tại một số cửa hàng nhượng quyền.",
          stats: { total: 3, positive: 2, negative: 1, neutral: 0, score: 67 },
          mentions: [
            {
              id: "m4",
              brand: "Mixue",
              source: "Facebook",
              content:
                "Kem Mixue 10k siêu ngon siêu rẻ ăn hoài không chán luôn á!",
              sentiment: "positive",
              topic: "price",
              posted_at: "2026-03-20",
            },
            {
              id: "m5",
              brand: "Mixue",
              source: "Threads",
              content:
                "Trà sữa Mixue bình dân, chất lượng tạm ổn so với giá tiền.",
              sentiment: "positive",
              topic: "price",
              posted_at: "2026-03-25",
            },
            {
              id: "m6",
              brand: "Google Maps",
              content:
                "Không gian quán chật chội, bàn ghế dơ không ai lau dọn.",
              sentiment: "negative",
              topic: "service",
              posted_at: "2026-03-29",
            },
          ],
        },
      ];
      setArchivedReports(initialMocks);
      localStorage.setItem(
        "insightflow_archived_reports",
        JSON.stringify(initialMocks),
      );
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const snapshot = await getDocs(
          collection(secondDb, "insightflow_labels"),
        );
        const data: Mention[] = [];
        const brandOrder = ["Highland Coffee", "Starbucks", "Mixue"];
        const brandSet = new Set<string>(brandOrder);

        snapshot.forEach((doc) => {
          const d = doc.data();
          const labels = d.labels || {};
          const rawBrand = d.brand || d.workspace_id || "unknown";
          const b = formatBrandName(rawBrand);
          if (brandOrder.includes(b)) {
            brandSet.add(b);
          }

          let posted = parsePostedAtRaw(d.post_date ?? d.posted_at);

          data.push({
            id: doc.id,
            brand: b,
            source: normalizeSourceName(d.source || d.platform || "unknown"),
            content: d.clean_text || d.content || d.text || d.original_text || "",
            content_type: mapContentType(d.content_type),
            sentiment: labels.sentiment || d.baseline_sentiment || d.sentiment || "neutral",
            topic: normalizeTopicName(labels.topic || d.baseline_topic || d.topic),
            posted_at: posted,
          });
        });

        setMentions(data);
        setBrands(brandOrder.filter((brand) => brandSet.has(brand)));
      } catch (err) {
        console.error("Error fetching mentions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Generate Reports List directly from required date range
  const reportsList = useMemo(() => {
    const targetBrands = selectedBrand === "all" ? brands : [selectedBrand];
    if (targetBrands.length === 0) return [];

    let daysToGenerate = 30; // default for "all" and "month"
    if (timeFilter === "today") daysToGenerate = 1;
    if (timeFilter === "week") daysToGenerate = 7;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result: DailyReport[] = [];

    // Pre-group mentions by brand and date string for quick lookup
    const groupedMentions: Record<string, Record<string, Mention[]>> = {};
    mentions.forEach((m) => {
      const d = parsePostedAtDate(m.posted_at);
      if (!d) return;

      const dateStr = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const b = m.brand;

      if (!groupedMentions[b]) groupedMentions[b] = {};
      if (!groupedMentions[b][dateStr]) groupedMentions[b][dateStr] = [];
      groupedMentions[b][dateStr].push(m);
    });

    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      targetBrands.forEach((b) => {
        const arr =
          groupedMentions[b] && groupedMentions[b][dateStr]
            ? groupedMentions[b][dateStr]
            : [];
        result.push({
          id: `RPT-${b.replace(/\s+/g, "")}-${dateStr.replace(/\//g, "")}`,
          dateStr,
          dateObj: d,
          brand: b,
          mentions: arr,
          size:
            arr.length > 0 ? (arr.length * 0.05).toFixed(1) + " MB" : "0 MB",
        });
      });
    }

    // Sort newest first
    return result.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [mentions, brands, selectedBrand, timeFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, timeFilter, reportsList.length]);

  const totalPages = Math.ceil(reportsList.length / ITEMS_PER_PAGE);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return reportsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [reportsList, currentPage]);

  // Dynamic Stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Mentions tuần này (all brands, last 7 days)
    let weeklyMentions = 0;
    mentions.forEach((m) => {
      const d = parsePostedAtDate(m.posted_at);
      if (!d) return;

      if (!isNaN(d.getTime())) {
        const diffDays = Math.ceil(
          (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays >= 0 && diffDays < 7) weeklyMentions++;
      }
    });

    // 2. Sentiment Index
    let pos = 0;
    let totalSent = 0;
    reportsList.forEach((r) => {
      r.mentions.forEach((m) => {
        totalSent++;
        if (m.sentiment.toLowerCase().includes("pos")) pos++;
      });
    });
    const sentimentScore =
      totalSent > 0 ? Math.round((pos / totalSent) * 100) : 0;
    const sentimentLabel =
      sentimentScore >= 50
        ? "Tích cực"
        : sentimentScore > 0
          ? "Tiêu cực"
          : "Chưa có";
    const sentimentIcon =
      sentimentScore >= 50
        ? "sentiment_satisfied"
        : sentimentScore > 0
          ? "sentiment_dissatisfied"
          : "sentiment_neutral";

    // 3. Báo cáo gần nhất
    const latestRpt = reportsList.length > 0 ? reportsList[0] : null;
    let rptName = t("reports.stats.noReport", { defaultValue: "Chưa có" });
    let rptDate = "";
    if (latestRpt) {
      rptName = t("reports.table.dailyReport", { brand: latestRpt.brand.charAt(0).toUpperCase() + latestRpt.brand.slice(1), defaultValue: `Daily Report ${latestRpt.brand.charAt(0).toUpperCase() + latestRpt.brand.slice(1)}` });
      rptDate = latestRpt.dateStr;
    }

    return {
      weeklyMentions,
      sentimentScore,
      sentimentLabel,
      sentimentIcon,
      latestReportName: rptName,
      latestReportTime: rptDate ? `Cập nhật ngày: ${rptDate}` : "",
    };
  }, [mentions, reportsList]);

  const handleExportPDF = (report: DailyReport) => {
    setExportConfig({ type: "periodic", data: report });
  };

  // ── Custom report actions ──
  const toggleCheckbox = (
    value: string,
    list: string[],
    setList: (arr: string[]) => void,
  ) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleGenerateCustomReport = () => {
    setCustomReportLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    setTimeout(() => {
      const filtered = mentions.filter((m) => {
        // Brand filter
        if (customBrand !== "all" && m.brand !== customBrand) return false;

        // Date filter
        const mDate = parsePostedAtDate(m.posted_at);
        if (!mDate) return false;

        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (mDate < start || mDate > end) return false;

        // Platform filter
        if (!customPlatforms.includes(m.source)) return false;

        // Topic filter
        if (!customTopics.includes(m.topic.toLowerCase())) return false;

        // Sentiment filter
        const sentimentMap: Record<string, string> = {
          positive: "positive",
          neutral: "neutral",
          negative: "negative",
          pos: "positive",
          neg: "negative",
          neu: "neutral",
        };
        const s = sentimentMap[m.sentiment.toLowerCase()] || "neutral";
        if (!customSentiments.includes(s)) return false;

        return true;
      });

      if (filtered.length === 0) {
        clearInterval(stepInterval);
        setCustomReportLoading(false);
        alert(
          "Không tìm thấy dữ liệu đề cập nào phù hợp với các bộ lọc đã chọn. Vui lòng điều chỉnh lại.",
        );
        return;
      }

      let pos = 0,
        neg = 0,
        neu = 0;
      filtered.forEach((m) => {
        const s = m.sentiment.toLowerCase();
        if (s.includes("pos")) pos++;
        else if (s.includes("neg")) neg++;
        else neu++;
      });
      const score = Math.round((pos / filtered.length) * 100);

      const insights = generateAIInsights(customBrand, filtered, customPrompt, i18n.language);

      setCustomReportData({
        mentions: filtered,
        stats: {
          total: filtered.length,
          positive: pos,
          negative: neg,
          neutral: neu,
          score,
        },
        aiInsights: insights,
      });

      clearInterval(stepInterval);
      setCustomReportLoading(false);
      setCustomReportGenerated(true);
      setCustomMentionsPage(1);
    }, 2400);
  };

  const handleExportCustomPDF = () => {
    if (!customReportData) return;
    setExportConfig({ type: "custom", data: customReportData });
  };

  const handleArchiveReport = () => {
    if (!customReportData) return;

    const formattedStart = new Date(customStartDate).toLocaleDateString(
      "vi-VN",
    );
    const formattedEnd = new Date(customEndDate).toLocaleDateString("vi-VN");
    const filters = `${customPlatforms.length} nguồn, ${customTopics.length} chủ đề, ${customSentiments.length} sắc thái.`;

    const newArchived = {
      id: `RPT-ARC-${Math.floor(100 + Math.random() * 900)}`,
      title: customBrand === "all"
        ? t("reports.custom.allBrandsTitle", { defaultValue: "Báo cáo Tùy chỉnh - Tất Cả Nhãn Hàng" }) + ` (${formattedStart} - ${formattedEnd})`
        : t("reports.custom.brandTitle", { brand: customBrand, defaultValue: `Báo cáo Tùy chỉnh - ${customBrand}` }) + ` (${formattedStart} - ${formattedEnd})`,
      dateStr: new Date().toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US"),
      brand: customBrand === "all" ? t("reports.custom.all", { defaultValue: "Tất cả" }) : customBrand,
      startDate: customStartDate,
      endDate: customEndDate,
      filtersSummary: filters,
      size: `${(customReportData.mentions.length * 0.05).toFixed(1)} MB`,
      mentionsCount: customReportData.mentions.length,
      insights: customReportData.aiInsights,
      stats: customReportData.stats,
      mentions: customReportData.mentions,
    };

    const updated = [newArchived, ...archivedReports];
    setArchivedReports(updated);
    localStorage.setItem(
      "insightflow_archived_reports_v2",
      JSON.stringify(updated),
    );
    alert(
      "Đã lưu trữ báo cáo thành công! Bạn có thể xem lại tại tab 'Lưu trữ'.",
    );
  };

  const handleExportArchivedPDF = (report: any) => {
    setExportConfig({ type: "archive", data: report });
  };

  const executeExportPDF = async (lang: "vi" | "en") => {
    if (!exportConfig) return;
    const { type, data } = exportConfig;
    const fixedT = i18n.getFixedT(lang);
    try {
      setGeneratingPdfId(data.id || "export-pdf");
      if (type === "periodic") {
        await generateDailyReportPDF(
          data.brand,
          data.dateStr,
          data.mentions,
          fixedT,
          lang
        );
      } else if (type === "custom") {
        const filtersSummary = `${customPlatforms.length} nguồn, ${customTopics.length} chủ đề, ${customSentiments.length} sắc thái.`;
        const dateStartFormatted = new Date(customStartDate).toLocaleDateString(
          lang === "vi" ? "vi-VN" : "en-US",
        );
        const dateEndFormatted = new Date(customEndDate).toLocaleDateString(
          lang === "vi" ? "vi-VN" : "en-US",
        );
        const insights = generateAIInsights(customBrand, data.mentions, customPrompt, lang);

        await generateCustomReportPDF(
          customBrand,
          dateStartFormatted,
          dateEndFormatted,
          data.mentions,
          insights,
          filtersSummary,
          fixedT,
          lang
        );
      } else if (type === "archive") {
        const startFormatted = new Date(
          data.startDate || new Date(),
        ).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US");
        const endFormatted = new Date(
          data.endDate || new Date(),
        ).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US");
        
        const insights = data.mentions && data.mentions.length > 0
          ? generateAIInsights(data.brand, data.mentions, "", lang)
          : data.insights || "";

        await generateCustomReportPDF(
          data.brand,
          startFormatted,
          endFormatted,
          data.mentions || [],
          insights,
          data.filtersSummary || "Báo cáo lưu trữ",
          fixedT,
          lang
        );
      }
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
    } finally {
      setGeneratingPdfId(null);
      setExportConfig(null);
    }
  };

  const handleDeleteArchive = (id: string) => {
    const updated = archivedReports.filter((r) => r.id !== id);
    setArchivedReports(updated);
    localStorage.setItem(
      "insightflow_archived_reports_v2",
      JSON.stringify(updated),
    );
    if (previewArchiveReport?.id === id) {
      setPreviewArchiveReport(null);
    }
  };

  // Memoized search & filter for Archive tab
  const filteredArchivedReports = useMemo(() => {
    return archivedReports.filter((rpt) => {
      const query = archiveSearchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        rpt.title.toLowerCase().includes(query) ||
        rpt.id.toLowerCase().includes(query) ||
        rpt.brand.toLowerCase().includes(query);

      const matchesBrand =
        archiveBrandFilter === "all" ||
        rpt.brand.toLowerCase() === archiveBrandFilter.toLowerCase();

      return matchesSearch && matchesBrand;
    });
  }, [archivedReports, archiveSearchQuery, archiveBrandFilter]);

  const loadingMessages = [
    "Đang phân tích các bộ lọc và tìm kiếm đề cập tương thích...",
    "Đang tính toán chỉ số sắc thái và xu hướng cảm xúc...",
    "Đang đánh giá mật độ chủ đề thảo luận nhiều nhất...",
    "AI đang biên soạn văn bản nhận xét thông minh (AI Insights)...",
  ];

  return (
    <div className="p-4 md:p-8 mx-auto space-y-5 md:space-y-8">
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onExport={() => {
            handleExportPDF(previewReport);
          }}
          isExporting={generatingPdfId === previewReport.id}
        />
      )}

      {previewArchiveReport && (
        <ArchivedReportDetailModal
          report={previewArchiveReport}
          onClose={() => setPreviewArchiveReport(null)}
          onExport={() => setExportConfig({ type: "archive", data: previewArchiveReport })}
          isExporting={generatingPdfId === previewArchiveReport.id}
          onDelete={() => handleDeleteArchive(previewArchiveReport.id)}
        />
      )}

      <LanguageSelectModal
        isOpen={!!exportConfig}
        onClose={() => setExportConfig(null)}
        onSelect={executeExportPDF}
        isExporting={!!generatingPdfId}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Trung tâm Báo cáo
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t("reports.header.desc", { defaultValue: "Quản lý và tải xuống các báo cáo phân tích định kỳ từ AI." })}
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab("custom");
            setCustomReportGenerated(false);
          }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-xl">add_chart</span>
          {t("reports.header.createCustomBtn", { defaultValue: "Tạo báo cáo thủ công" })}
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">
            Mentions tuần này
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">
            {stats.weeklyMentions.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[var(--color-success)]">
            <span className="material-symbols-outlined text-sm">
              trending_up
            </span>
            <span className="text-[10px] md:text-xs font-bold">Realtime</span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">
            analytics
          </span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group border-l-4 border-[var(--color-brand)]/30">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">
            Sentiment Index
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">
            {stats.sentimentScore}/100
          </p>
          <div className="flex items-center gap-1 mt-2 text-[var(--color-brand)]">
            <span className="material-symbols-outlined text-sm">
              {stats.sentimentIcon}
            </span>
            <span className="text-[10px] md:text-xs font-bold">
              {stats.sentimentLabel}
            </span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">
            mood
          </span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group col-span-2 lg:col-span-1">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">
            Báo cáo mới nhất
          </p>
          <p className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] truncate pr-6">
            {stats.latestReportName}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] mt-2 font-medium">
            {stats.latestReportTime}
          </p>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">
            history
          </span>
        </div>
      </div>

      {/* ── Reports List ── */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        {/* Toolbar */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] flex flex-col md:flex-row md:items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto flex-1">
            <button
              onClick={() => setActiveTab("periodic")}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === "periodic"
                  ? "text-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              {t("reports.tabs.periodic", { defaultValue: "Định kỳ" })}
            </button>
            <button
              onClick={() => {
                setActiveTab("custom");
                setCustomReportGenerated(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === "custom"
                  ? "text-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              {t("reports.tabs.custom", { defaultValue: "Tùy chỉnh" })}
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === "archive"
                  ? "text-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              {t("reports.tabs.archive", { defaultValue: "Lưu trữ" })}
            </button>
          </div>

          {/* Filters */}
          {activeTab === "periodic" && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 flex-1 md:flex-none min-w-[140px]">
                <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider hidden sm:block">
                  Thương hiệu:
                </span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                >
                  <option value="all">Tất cả nhãn hàng</option>
                  {brands.map((b) => (
                    <option key={b} value={b} className="capitalize">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 md:flex-none min-w-[120px]">
                <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider hidden sm:block">
                  Thời gian:
                </span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                >
                  <option value="all">{t("reports.filters.allTime", { defaultValue: "Tất cả thời gian" })}</option>
                  <option value="today">{t("reports.filters.today", { defaultValue: "Hôm nay" })}</option>
                  <option value="week">{t("reports.filters.week", { defaultValue: "Tuần này" })}</option>
                  <option value="month">{t("reports.filters.month", { defaultValue: "Tháng này" })}</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* ── Tab Content: Periodic ── */}
        {activeTab === "periodic" && (
          <>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
                <div className="w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold">Đang tải dữ liệu báo cáo...</p>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">
                  description
                </span>
                <p className="font-bold">Không tìm thấy báo cáo nào phù hợp.</p>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="md:hidden divide-y divide-[var(--color-border)]">
                  {paginatedReports.map((rpt) => (
                    <div
                      key={rpt.id}
                      className="p-4 cursor-pointer hover:bg-[var(--color-bg-surface-raised)] transition-colors"
                      onClick={() => setPreviewReport(rpt)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-xl">
                            description
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] leading-snug truncate pr-2 capitalize">
                            Daily - {rpt.brand}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">
                            {rpt.mentions.length} mentions
                          </p>
                        </div>
                        <span className="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 border border-[var(--color-brand-border)]">
                          {t("reports.periodic.dailyTag", { defaultValue: "Hàng ngày" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] font-bold mb-3 bg-[var(--color-bg-surface-raised)] rounded-lg px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">
                            calendar_today
                          </span>
                          {rpt.dateStr}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">
                            data_usage
                          </span>
                          {rpt.size}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPDF(rpt);
                          }}
                          disabled={
                            generatingPdfId === rpt.id ||
                            rpt.mentions.length === 0
                          }
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all text-[11px] font-bold disabled:opacity-50"
                        >
                          {generatingPdfId === rpt.id ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">
                              picture_as_pdf
                            </span>
                          )}
                          {generatingPdfId === rpt.id ? t("reports.common.generating", { defaultValue: "Đang tạo..." }) : t("reports.common.pdf", { defaultValue: "PDF" })}
                        </button>
                        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[16px]">
                            visibility
                          </span>
                          Xem
                        </button>
                        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition-all text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[16px]">
                            more_horiz
                          </span>
                          Thêm
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          Tên Báo Cáo
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] w-32">
                          Ngày Tạo
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          Mentions
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          Dung Lượng
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-right">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {paginatedReports.map((rpt) => (
                        <tr
                          key={rpt.id}
                          className="hover:bg-[var(--color-bg-surface-raised)] transition-colors group cursor-pointer"
                          onClick={() => setPreviewReport(rpt)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0 ${rpt.mentions.length > 0 ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)] opacity-50"}`}
                              >
                                <span className="material-symbols-outlined">
                                  description
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[var(--color-text-primary)] capitalize">
                                  Daily Report - {rpt.brand}
                                </p>
                                <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">
                                  ID: {rpt.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                            {rpt.dateStr}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                            {rpt.mentions.length > 0 ? (
                              `${rpt.mentions.length} mentions`
                            ) : (
                              <span className="text-[var(--color-text-muted)] italic">
                                0 mentions
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                            {rpt.size}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewReport(rpt);
                                }}
                                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors"
                                title="Xem trước"
                              >
                                <span className="material-symbols-outlined text-xl">
                                  visibility
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportPDF(rpt);
                                }}
                                disabled={
                                  generatingPdfId === rpt.id ||
                                  rpt.mentions.length === 0
                                }
                                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors disabled:opacity-50"
                                title="Xuất PDF"
                              >
                                {generatingPdfId === rpt.id ? (
                                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block"></span>
                                ) : (
                                  <span className="material-symbols-outlined text-xl">
                                    picture_as_pdf
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                                title="Thêm"
                              >
                                <span className="material-symbols-outlined text-xl">
                                  more_vert
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <ReportPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={reportsList.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                  itemLabel="báo cáo"
                />
              </>
            )}
          </>
        )}

        {/* ── Tab Content: Custom (AI Configuration Panel & Result) ── */}
        {activeTab === "custom" && (
          <div className="p-4 md:p-6 space-y-6 flex-1 flex flex-col">
            {customReportLoading ? (
              // Pulsing Loading State
              <div className="flex-1 flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center absolute inset-0 m-auto animate-pulse">
                    <span className="material-symbols-outlined text-base">
                      psychology
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-on-surface">
                    AI đang xử lý báo cáo...
                  </h3>
                  <p className="text-sm text-on-surface-variant min-h-[40px] animate-pulse">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              </div>
            ) : !customReportGenerated ? (
              // A: Configuration Form
              <div className="space-y-6 max-w-4xl">
                {/* Tabs switcher inside custom config view since we hide the outer toolbar */}
                <div className="flex gap-1 overflow-x-auto border-b border-outline-variant pb-3">
                  <button
                    onClick={() => setActiveTab("periodic")}
                    className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors font-bold whitespace-nowrap flex-shrink-0"
                  >
                    {t("reports.tabs.periodic", { defaultValue: "Định kỳ" })}
                  </button>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-primary bg-primary/10 whitespace-nowrap flex-shrink-0"
                  >
                    {t("reports.tabs.custom", { defaultValue: "Tùy chỉnh" })}
                  </button>
                  <button
                    onClick={() => setActiveTab("archive")}
                    className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors font-bold whitespace-nowrap flex-shrink-0"
                  >
                    {t("reports.tabs.archive", { defaultValue: "Lưu trữ" })}
                  </button>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      settings_suggest
                    </span>
                    Thiết lập Báo cáo Tùy chỉnh
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Lọc dữ liệu mạng xã hội và truyền thông, sau đó yêu cầu AI
                    lập báo cáo phân tích theo hướng đi cụ thể.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Brand & Date range */}
                  <div className="space-y-4 bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Chọn thương hiệu:
                      </label>
                      <select
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg text-sm py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20"
                      >
                        <option value="all">Tất cả nhãn hàng</option>
                        {brands.map((b) => (
                          <option key={b} value={b} className="capitalize">
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Từ ngày:
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Đến ngày:
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Filter */}
                  <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)] space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Chọn sắc thái:
                      </label>
                      <button
                        onClick={() =>
                          setCustomSentiments(
                            customSentiments.length === 3
                              ? []
                              : ["positive", "neutral", "negative"],
                          )
                        }
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        {customSentiments.length === 3
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        {
                          val: "positive",
                          label: "Tích cực",
                          icon: "mood",
                          color: "text-green-600 bg-green-50 border-green-200",
                        },
                        {
                          val: "neutral",
                          label: "Trung lập",
                          icon: "sentiment_neutral",
                          color: "text-gray-600 bg-gray-50 border-gray-200",
                        },
                        {
                          val: "negative",
                          label: "Tiêu cực",
                          icon: "sentiment_dissatisfied",
                          color: "text-red-600 bg-red-50 border-red-200",
                        },
                      ].map((item) => {
                        const active = customSentiments.includes(item.val);
                        return (
                          <button
                            key={item.val}
                            onClick={() =>
                              toggleCheckbox(
                                item.val,
                                customSentiments,
                                setCustomSentiments,
                              )
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              active
                                ? `${item.color} shadow-sm`
                                : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Platforms & Topics selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Platforms */}
                  <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)] space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Nguồn dữ liệu (Nền tảng):
                      </label>
                      <button
                        onClick={() =>
                          setCustomPlatforms(
                            customPlatforms.length === 7
                              ? []
                              : [
                                  "facebook",
                                  "tiktok",
                                  "youtube",
                                  "thread",
                                  "be",
                                  "google_maps",
                                  "news",
                                ],
                          )
                        }
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        {customPlatforms.length === 7
                          ? "Bỏ tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: "facebook", label: "Facebook" },
                        { val: "tiktok", label: "TikTok" },
                        { val: "youtube", label: "YouTube" },
                        { val: "thread", label: "Threads" },
                        { val: "be", label: "BeFood" },
                        { val: "google_maps", label: "Google Maps" },
                        { val: "news", label: "Báo chí" },
                      ].map((p) => {
                        const active = customPlatforms.includes(p.val);
                        const platformLabel = p.val === "news" 
                          ? t("mentions.filters.news", { defaultValue: "Báo chí" }) 
                          : p.val === "youtube" 
                            ? t("dashboard.filters.youtube", { defaultValue: "YouTube" })
                            : p.label;
                        return (
                          <label
                            key={p.val}
                            className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded hover:bg-surface-container/50"
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                toggleCheckbox(
                                  p.val,
                                  customPlatforms,
                                  setCustomPlatforms,
                                )
                              }
                              className="accent-primary w-4 h-4"
                            />
                            {platformLabel}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)] space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Chủ đề quan tâm:
                      </label>
                      <button
                        onClick={() =>
                          setCustomTopics(
                            customTopics.length === 11
                              ? []
                              : [
                                  "quality",
                                  "price",
                                  "service",
                                  "staff",
                                  "delivery",
                                  "experience",
                                  "legal",
                                  "operation",
                                  "marketing",
                                  "competitor",
                                  "other",
                                ],
                          )
                        }
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        {customTopics.length === 11
                          ? "Bỏ tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {[
                        { val: "quality", label: "Chất lượng" },
                        { val: "price", label: "Giá cả" },
                        { val: "service", label: "Phục vụ" },
                        { val: "staff", label: "Nhân viên" },
                        { val: "delivery", label: "Giao hàng" },
                        { val: "experience", label: "Trải nghiệm" },
                        { val: "legal", label: "Pháp lý" },
                        { val: "operation", label: "Vận hành" },
                        { val: "marketing", label: "Marketing" },
                        { val: "competitor", label: "Đối thủ" },
                        { val: "other", label: "Khác" },
                      ].map((topic) => {
                        const active = customTopics.includes(topic.val);
                        const topicLabel = t(`reports.topics.${topic.val}`, { defaultValue: topic.label });
                        return (
                          <label
                            key={topic.val}
                            className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded hover:bg-surface-container/50"
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                toggleCheckbox(
                                  topic.val,
                                  customTopics,
                                  setCustomTopics,
                                )
                              }
                              className="accent-primary w-4 h-4"
                            />
                            {topicLabel}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* AI Guidance input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("reports.custom.config.promptLabel", { defaultValue: "Định hướng phân tích cho AI (Tùy chọn):" })}
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t("reports.custom.config.promptPlaceholder", { defaultValue: "Ví dụ: Tập trung làm rõ các phản hồi tiêu cực về chất lượng đồ uống và thái độ phục vụ của nhân viên, đưa ra so sánh nếu có ý kiến nhắc tới thương hiệu đối thủ..." })}
                    className="bg-white border border-outline-variant rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/25 min-h-[100px] w-full"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGenerateCustomReport}
                    disabled={
                      customPlatforms.length === 0 ||
                      customTopics.length === 0 ||
                      customSentiments.length === 0
                    }
                    className="flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">
                      science
                    </span>
                    Tạo báo cáo với AI Insights
                  </button>
                </div>
              </div>
            ) : (
              // B: Results view
              <div className="space-y-6">
                {/* Back and action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant pb-4 gap-3">
                  <button
                    onClick={() => setCustomReportGenerated(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      arrow_back
                    </span>
                    Quay lại cấu hình bộ lọc
                  </button>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleArchiveReport}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl font-bold text-xs hover:bg-[var(--color-bg-surface-high)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        archive
                      </span>
                      Lưu trữ báo cáo
                    </button>
                    <button
                      onClick={handleExportCustomPDF}
                      disabled={generatingPdfId === "custom-export"}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold text-xs hover:bg-[var(--color-brand-hover)] transition-all disabled:opacity-50"
                    >
                      {generatingPdfId === "custom-export" ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">
                          picture_as_pdf
                        </span>
                      )}
                      {t("reports.custom.downloadPdf", { defaultValue: "Tải báo cáo PDF" })}
                    </button>
                  </div>
                </div>

                {/* Report Header metadata */}
                <div>
                  <span className="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand-border)] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {t("reports.custom.aiGenerated", { defaultValue: "Báo cáo Tùy chỉnh (AI-generated)" })}
                  </span>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] capitalize mt-2">
                    Báo cáo phân tích:{" "}
                    {customBrand === "all" ? "Tất Cả Nhãn Hàng" : customBrand}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Phân tích trong khoảng thời gian từ{" "}
                    {new Date(customStartDate).toLocaleDateString("vi-VN")} đến{" "}
                    {new Date(customEndDate).toLocaleDateString("vi-VN")} dựa
                    trên {customReportData?.mentions.length} đề cập phù hợp.
                  </p>
                </div>

                {/* Custom Report Metrics */}
                {customReportData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        Tổng số đề cập
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                        {customReportData.stats.total}
                      </p>
                    </div>
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        Sắc thái Tích cực
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-success)] mt-1">
                        {customReportData.stats.positive}
                        <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">
                          (
                          {Math.round(
                            (customReportData.stats.positive /
                              customReportData.stats.total) *
                              100,
                          )}
                          %)
                        </span>
                      </p>
                    </div>
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        Sắc thái Tiêu cực
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-error)] mt-1">
                        {customReportData.stats.negative}
                        <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">
                          (
                          {Math.round(
                            (customReportData.stats.negative /
                              customReportData.stats.total) *
                              100,
                          )}
                          %)
                        </span>
                      </p>
                    </div>
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        Chỉ số Cảm xúc ròng
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${customReportData.stats.score >= 50 ? "text-[var(--color-success)]" : customReportData.stats.score > 0 ? "text-[var(--color-brand)]" : "text-[var(--color-error)]"}`}
                      >
                        {customReportData.stats.score >= 0 ? "+" : ""}
                        {customReportData.stats.score}%
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Insights display area */}
                {customReportData && (
                  <div className="bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-24 h-24 bg-[var(--color-brand)]/10 rounded-full blur-2xl"></div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">
                          psychology
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--color-brand)] uppercase tracking-wider">
                        AI Insights & Phân Tích Chuyên Sâu
                      </h3>
                    </div>

                    <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-normal whitespace-pre-wrap">
                      {customReportData.aiInsights}
                    </div>
                  </div>
                )}

                {/* Matched mentions table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    Các đề cập phù hợp tiêu chí ({customReportData?.mentions.length ?? 0} đề cập)
                  </h3>

                  {customReportData && (
                    <ReportMentionsTable
                      mentions={customReportData.mentions}
                      currentPage={customMentionsPage}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setCustomMentionsPage}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: Archive (List of Archived Reports) ── */}
        {activeTab === "archive" && (
          <div className="p-4 md:p-6 space-y-5 flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-brand)]">
                    archive
                  </span>
                  Báo cáo đã Lưu trữ
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Các bản báo cáo Snapshot tĩnh đã được phê duyệt lưu giữ lâu
                  dài để theo dõi sự phát triển thương hiệu.
                </p>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <div className="flex-1 relative flex items-center">
                <span className="material-symbols-outlined text-[var(--color-text-muted)] absolute left-3 pointer-events-none text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder={t("reports.archive.searchPlaceholder", { defaultValue: "Tìm kiếm theo tiêu đề, nhãn hàng, mã..." })}
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg text-xs pl-10 pr-3 py-2.5 outline-none font-semibold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full text-[var(--color-text-primary)]"
                />
              </div>

              <div className="flex items-center gap-2 min-w-[180px]">
                <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider hidden sm:block whitespace-nowrap">
                  Lọc nhãn:
                </span>
                <select
                  value={archiveBrandFilter}
                  onChange={(e) => setArchiveBrandFilter(e.target.value)}
                  className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2.5 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                >
                  <option value="all">Tất cả nhãn hàng</option>
                  {brands.map((b) => (
                    <option key={b} value={b} className="capitalize">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredArchivedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] bg-[var(--color-bg-surface-raised)] rounded-xl border border-dashed border-[var(--color-border)]">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">
                  archive
                </span>
                <p className="font-bold text-sm">
                  Không tìm thấy báo cáo lưu trữ nào phù hợp.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredArchivedReports.map((rpt) => (
                  <div
                    key={rpt.id}
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] hover:shadow-sm hover:border-[var(--color-brand)]/25 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-[var(--color-border)]">
                          {rpt.id}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">
                          {t("reports.archive.savedDate", { date: rpt.dateStr, defaultValue: `Lưu ngày: ${rpt.dateStr}` })}
                        </span>
                        {rpt.brand && (
                          <span className="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] text-[10px] px-2 py-0.5 rounded font-bold capitalize">
                            {rpt.brand}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)] truncate pr-4">
                        {rpt.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 max-w-2xl font-normal leading-relaxed">
                        {rpt.insights}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-[var(--color-border)] pt-3 md:pt-0">
                      <div className="text-left md:text-right hidden sm:block mr-2">
                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                          Lượt đề cập
                        </p>
                        <p className="text-xs font-bold text-[var(--color-text-primary)]">
                          {rpt.mentionsCount} mentions
                        </p>
                      </div>
                      <button
                        onClick={() => setPreviewArchiveReport(rpt)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2.5 bg-[var(--color-bg-surface-high)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl font-bold text-xs hover:bg-[var(--color-border)] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          visibility
                        </span>
                        Xem
                      </button>
                      <button
                        onClick={() => handleExportArchivedPDF(rpt)}
                        disabled={generatingPdfId === rpt.id}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2.5 bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 rounded-xl font-bold text-xs hover:bg-[var(--color-brand)]/25 transition-colors disabled:opacity-50"
                      >
                        {generatingPdfId === rpt.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">
                            download
                          </span>
                        )}
                        {t("reports.common.download", { defaultValue: "Tải về" })}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Promotional Banners ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
        {/* Email Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-brand)] text-white p-6 md:p-8 flex flex-col justify-center min-h-[180px] md:min-h-[220px]">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">
              Tự động hóa
            </p>
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              Gửi báo cáo qua Email
            </h3>
            <p className="text-sm opacity-80 mb-5 max-w-sm">
              Cấu hình gửi báo cáo AI tự động vào hộp thư lúc 8:00 sáng mỗi
              ngày.
            </p>
            <button className="bg-white text-[var(--color-brand)] px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg active:scale-95 transition-all w-fit">
              {t("reports.banner.setupBtn", { defaultValue: "Thiết lập ngay" })}
            </button>
          </div>
          <span
            className="material-symbols-outlined absolute -right-6 -top-6 text-[130px] md:text-[180px] opacity-10 rotate-12 pointer-events-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            mail
          </span>
        </div>

        {/* AI Trend Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-bg-surface-high)] border border-[var(--color-border)] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5 min-h-[180px] md:min-h-[220px]">
          <div className="flex-1 relative z-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="bg-[var(--color-brand)] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg">
                Mới
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-[var(--color-text-primary)]">
              Phân tích Xu hướng AI
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] opacity-75 mb-5">
              {t("reports.banner.trendDesc", { defaultValue: "Dùng LLM tóm tắt biến động thị trường quan trọng nhất trong tuần." })}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] font-bold text-sm transition-colors"
            >
              Khám phá ngay
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </a>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-2xl border-2 border-[var(--color-border)] flex-shrink-0 rotate-3 hidden sm:block relative z-10">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFCABMvUN8JyM7a3E2elTgaODiz73B5O5e6t0CG4tqShjMiOpQt34ZqJsvkeVwSxzqY0Cq4Ev06YARyRjjEyW1vN2-3_33fBGzU12y6RBh0xm8_ZNFF5LAn3l7k0Yt3zdPvTj5Lmd6tlyM2dwsDzs4MIZNaXD76ohyzbXFkcNWO-hKAYON9biih5GUW4oV3RfVXy04Zc3FAfQuioapcW7o_sjM2865Oh8xGp62uIWVdNouDsgCvqGRdJihgGOCo9T26pmf4QIDXkY"
              alt="AI Visualization"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
