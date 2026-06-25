"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { generateDailyReportPDF, generateCustomReportPDF } from "@/lib/pdfExport";
import { collection, getDocs } from "firebase/firestore";
import { secondDb } from "@/lib/firebase";

/**
 * Report Center Page — Fully Mobile Responsive
 * Sử dụng Card layout cho mobile, Table cho desktop
 */

interface Mention {
  id: string;
  brand: string;
  source: string;
  content: string;
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
  isExporting
}: {
  report: DailyReport;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
}) {
  const { t } = useTranslation();
  // Calculate basic stats for the preview
  const total = report.mentions.length;
  let pos = 0, neu = 0, neg = 0;
  const topics: Record<string, number> = {};

  report.mentions.forEach(m => {
    const s = m.sentiment.toLowerCase();
    if (s.includes("pos")) pos++;
    else if (s.includes("neg")) neg++;
    else neu++;

    const topicKey = m.topic.toLowerCase();
    topics[topicKey] = (topics[topicKey] || 0) + 1;
  });

  const topTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {t("reports.preview.title", { defaultValue: "Xem trước Báo cáo" })}
          </h2>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">
              {t("reports.preview.brand", { defaultValue: "Thương hiệu" })}
            </p>
            <p className="font-bold text-lg text-[var(--color-brand)] capitalize">{report.brand}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">
              {t("reports.preview.date", { defaultValue: "Ngày báo cáo" })}
            </p>
            <p className="font-bold text-lg text-[var(--color-text-primary)]">{report.dateStr}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.preview.totalMentions", { defaultValue: "Tổng lượt đề cập" })}
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{total}</p>
            </div>
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.preview.sentimentIndex", { defaultValue: "Chỉ số Cảm xúc" })}
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
                {t("reports.preview.topTopics", { defaultValue: "Chủ đề nổi bật" })}
              </p>
              <div className="flex flex-wrap gap-2">
                {topTopics.map(([topicKey, count]) => (
                  <span key={topicKey} className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-2 py-1 rounded text-xs font-semibold capitalize text-[var(--color-text-primary)]">
                    {t(`reports.topics.${topicKey}`, { defaultValue: topicKey })}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[var(--color-text-secondary)] font-bold hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)]">
            {t("reports.common.close", { defaultValue: "Đóng" })}
          </button>
          <button 
            onClick={onExport} 
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold shadow-sm hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {isExporting ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-lg">download</span>}
            {t("reports.common.downloadPdf", { defaultValue: "Tải PDF" })}
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
  onDelete
}: {
  report: ArchivedReport;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const stats = report.stats || {
    total: report.mentionsCount,
    positive: 0,
    negative: 0,
    neutral: 0,
    score: 0
  };

  const mentions = report.mentions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col gap-5 my-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-3">
          <div>
            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {report.id}
            </span>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{report.title}</h2>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">
              {t("reports.archive.savedDate", { date: report.dateStr, defaultValue: `Lưu trữ ngày: ${report.dateStr}` })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] rounded-full flex-shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.preview.brand", { defaultValue: "Thương hiệu" })}
              </p>
              <p className="font-bold text-sm text-[var(--color-brand)] capitalize">{report.brand}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.preview.dateRange", { defaultValue: "Thời gian lọc" })}
              </p>
              <p className="font-bold text-sm text-[var(--color-text-primary)]">
                {report.startDate ? new Date(report.startDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US") : "N/A"} - {report.endDate ? new Date(report.endDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US") : "N/A"}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.preview.filters", { defaultValue: "Bộ lọc" })}
              </p>
              <p className="font-bold text-xs text-[var(--color-text-primary)] truncate" title={report.filtersSummary}>
                {report.filtersSummary}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-[var(--color-border)] rounded-xl p-3 text-center bg-[var(--color-bg-surface)]">
              <p className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.archive.mentions", { defaultValue: "Đề cập" })}
              </p>
              <p className="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">{stats.total}</p>
            </div>
            <div className="border border-[var(--color-border)] rounded-xl p-3 text-center bg-[var(--color-bg-surface)]">
              <p className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.sentiment.positive", { defaultValue: "Tích cực" })}
              </p>
              <p className="text-xl font-bold text-green-600 mt-0.5">
                {stats.positive}
                <span className="text-[10px] font-normal text-[var(--color-text-muted)] ml-1">({stats.total > 0 ? Math.round(stats.positive/stats.total*100) : 0}%)</span>
              </p>
            </div>
            <div className="border border-[var(--color-border)] rounded-xl p-3 text-center bg-[var(--color-bg-surface)]">
              <p className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.sentiment.negative", { defaultValue: "Tiêu cực" })}
              </p>
              <p className="text-xl font-bold text-red-600 mt-0.5">
                {stats.negative}
                <span className="text-[10px] font-normal text-[var(--color-text-muted)] ml-1">({stats.total > 0 ? Math.round(stats.negative/stats.total*100) : 0}%)</span>
              </p>
            </div>
            <div className="border border-[var(--color-border)] rounded-xl p-3 text-center bg-[var(--color-bg-surface)]">
              <p className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase">
                {t("reports.archive.netSentiment", { defaultValue: "Net Sentiment" })}
              </p>
              <p className={`text-xl font-bold mt-0.5 ${stats.score >= 50 ? "text-green-600" : stats.score > 0 ? "text-[var(--color-brand)]" : "text-red-600"}`}>
                {stats.score >= 0 ? "+" : ""}{stats.score}%
              </p>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[var(--color-brand)]">
              <span className="material-symbols-outlined text-lg">psychology</span>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {t("reports.archive.aiInsightsTitle", { defaultValue: "AI Insights phân tích tại thời điểm lưu" })}
              </h4>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {report.insights}
            </p>
          </div>

          {/* Sample Mentions List (Up to 15 rows) */}
          {mentions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                {t("reports.archive.mentionsTitle", { count: Math.min(mentions.length, 15), defaultValue: `Đề cập tiêu biểu (${Math.min(mentions.length, 15)} bài viết)` })}
              </h4>
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border)]">
                      <th className="px-3 py-2 font-bold text-[var(--color-text-secondary)] w-16">
                        {t("reports.custom.table.source", { defaultValue: "Nguồn" })}
                      </th>
                      <th className="px-3 py-2 font-bold text-[var(--color-text-secondary)]">
                        {t("reports.custom.table.content", { defaultValue: "Nội dung" })}
                      </th>
                      <th className="px-3 py-2 font-bold text-[var(--color-text-secondary)] w-20">
                        {t("reports.custom.table.sentiment", { defaultValue: "Sắc thái" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]/40">
                    {mentions.slice(0, 15).map((m, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-bg-surface-raised)]/30 transition-colors">
                        <td className="px-3 py-2 font-bold capitalize text-[var(--color-brand)]">{m.source}</td>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)] truncate max-w-[200px]" title={m.content}>
                          {m.content}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            m.sentiment.toLowerCase().includes("pos") ? "text-green-600 bg-green-50 border-green-200" :
                            m.sentiment.toLowerCase().includes("neg") ? "text-red-600 bg-red-50 border-red-200" : "text-gray-600 bg-gray-50 border-gray-200"
                          }`}>
                            {m.sentiment === "positive" || m.sentiment === "pos" ? t("reports.sentiment.positive", { defaultValue: "Tích cực" }) : m.sentiment === "negative" || m.sentiment === "neg" ? t("reports.sentiment.negative", { defaultValue: "Tiêu cực" }) : t("reports.sentiment.neutral", { defaultValue: "Trung lập" })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3 mt-1">
          <button 
            onClick={() => {
              if (confirm(t("reports.archive.deleteConfirm", { defaultValue: "Bạn có chắc chắn muốn xóa báo cáo này khỏi kho lưu trữ?" }))) {
                onDelete();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            {t("reports.archive.deleteBtn", { defaultValue: "Xóa lưu trữ" })}
          </button>
          
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[var(--color-text-secondary)] font-bold text-xs hover:bg-[var(--color-bg-surface-raised)] transition-colors">
              {t("reports.common.close", { defaultValue: "Đóng" })}
            </button>
            <button 
              onClick={onExport} 
              disabled={isExporting || mentions.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isExporting ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">download</span>
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
  if (lower === "laha-cafe" || lower === "laha coffee" || lower === "laha_coffee" || lower.includes("laha")) return "Laha Coffee";
  if (lower === "maison-marou" || lower === "maison_marou" || lower.includes("marou")) return "Maison Marou";
  if (lower.includes("highlands")) return "Highlands Coffee";
  if (lower.includes("phúc long") || lower.includes("phuclong")) return "Phúc Long";
  if (lower.includes("katinat")) return "Katinat";
  
  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function generateAIInsights(brand: string, mentions: Mention[], prompt: string, lang: string = "vi"): string {
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
  const topicSentiment: Record<string, { pos: number; neg: number; neu: number }> = {};

  mentions.forEach(m => {
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
    summary += `Đây là mức chỉ số cực kỳ khả quan, phản ánh mức độ hài lòng và thiện cảm thương hiệu rất cao từ người tiêu dùng. Nhóm thảo luận tích cực chiếm đa số (${Math.round(positive/total*100)}%), tập trung ngợi khen các khía cạnh về sản phẩm và chất lượng dịch vụ. `;
  } else if (netSentiment >= 10) {
    summary += `Thương hiệu đang duy trì hình ảnh tương đối ổn định trong mắt công chúng. Mặc dù lượng thảo luận tích cực (${Math.round(positive/total*100)}%) chiếm ưu thế, song vẫn ghi nhận một số phản hồi chưa hài lòng ở mức trung bình hoặc góp ý xây dựng. `;
  } else if (netSentiment >= -10) {
    summary += `Cảm xúc của người tiêu dùng đang ở trạng thái trung dung hoặc phân cực. Số lượng ý kiến tích cực (${Math.round(positive/total*100)}%) và tiêu cực (${Math.round(negative/total*100)}%) khá cân bằng. Doanh nghiệp cần chú ý theo dõi các tín hiệu trái chiều từ thị trường. `;
  } else {
    summary += `Cảnh báo: Chỉ số cảm xúc của thương hiệu đang ở mức thấp báo động (${netSentiment}%). Lượng phản hồi tiêu cực chiếm tỉ lệ cao (${Math.round(negative/total*100)}%). Thương hiệu đang phải đối mặt với một số luồng chỉ trích hoặc bất bình lớn từ khách hàng cần lập tức can thiệp xử lý khủng hoảng. `;
  }

  summary += `\n\n2. PHÂN TÍCH CHỦ ĐỀ VÀ ĐIỂM NÓNG DƯ LUẬN:\n`;
  summary += `Chủ đề thảo luận nổi bật nhất chiếm tỉ trọng lớn nhất là '${mainTopic.toUpperCase()}' với ${topicCounts[mainTopic]} lượt đề cập (${Math.round(topicCounts[mainTopic]/total*100)}% tổng thảo luận). `;
  
  const mainTopicSent = topicSentiment[mainTopic];
  if (mainTopicSent) {
    const mainPosRatio = Math.round(mainTopicSent.pos / topicCounts[mainTopic] * 100);
    const mainNegRatio = Math.round(mainTopicSent.neg / topicCounts[mainTopic] * 100);
    if (mainPosRatio >= 60) {
      summary += `Tại chủ đề '${mainTopic.toUpperCase()}', khách hàng thể hiện thái độ đánh giá rất cao (chiếm ${mainPosRatio}% tích cực). Đây chính là thế mạnh cạnh tranh cốt lõi giúp kéo cảm xúc tích cực của thương hiệu lên cao. `;
    } else if (mainNegRatio >= 40) {
      summary += `Đáng lo ngại, chủ đề '${mainTopic.toUpperCase()}' cũng chính là 'điểm nóng' nhận nhiều chỉ trích nhất với tỉ lệ tiêu cực chiếm tới ${mainNegRatio}%. Các vấn đề nổi cộm chủ yếu liên quan tới trải nghiệm trực tiếp hoặc sự không đồng nhất về chất lượng. `;
    } else {
      summary += `Thảo luận xoay quanh chủ đề này chủ yếu mang tính khách quan, chia sẻ trải nghiệm trung tính (${Math.round(mainTopicSent.neu/topicCounts[mainTopic]*100)}%). `;
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
    if (lowerPrompt.includes("giá") || lowerPrompt.includes("price") || lowerPrompt.includes("đắt") || lowerPrompt.includes("rẻ")) {
      const priceMentions = mentions.filter(m => m.topic === "price");
      summary += `Hệ thống ghi nhận có ${priceMentions.length} lượt đề cập trực tiếp đến yếu tố giá cả. Khách hàng đang có xu hướng nhạy cảm hơn về giá, đặc biệt là trong bối cảnh các chương trình khuyến mãi giảm bớt. `;
    } else if (lowerPrompt.includes("phục vụ") || lowerPrompt.includes("nhân viên") || lowerPrompt.includes("thái độ") || lowerPrompt.includes("service") || lowerPrompt.includes("staff")) {
      const serviceMentions = mentions.filter(m => m.topic === "service" || m.topic === "staff");
      const serviceNeg = serviceMentions.filter(m => m.sentiment === "negative").length;
      summary += `Có tổng số ${serviceMentions.length} thảo luận liên quan đến chất lượng phục vụ và thái độ nhân viên. Trong đó có ${serviceNeg} phản hồi tiêu cực, phản ánh các vấn đề như thời gian chờ lâu, thái độ thiếu chuyên nghiệp tại một số điểm chạm. `;
    } else if (lowerPrompt.includes("chất lượng") || lowerPrompt.includes("ngon") || lowerPrompt.includes("dở") || lowerPrompt.includes("nước") || lowerPrompt.includes("bánh") || lowerPrompt.includes("quality")) {
      const qualityMentions = mentions.filter(m => m.topic === "quality");
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

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"periodic" | "custom" | "archive">("periodic");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // "all", "today", "week", "month"
  
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
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
    "facebook", "tiktok", "youtube", "thread", "be", "google_maps", "news"
  ]);
  const [customTopics, setCustomTopics] = useState<string[]>([
    "quality", "price", "service", "staff", "delivery", "experience", "legal", "operation", "marketing", "competitor", "other"
  ]);
  const [customSentiments, setCustomSentiments] = useState<string[]>([
    "positive", "neutral", "negative"
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
  const [previewArchiveReport, setPreviewArchiveReport] = useState<any | null>(null);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [archiveBrandFilter, setArchiveBrandFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("insightflow_archived_reports");
    if (saved) {
      try {
        setArchivedReports(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading archived reports:", e);
      }
    } else {
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
          insights: "Báo cáo lưu trữ tổng hợp chiến dịch Tết Nguyên Đán 2026. Laha Coffee ghi nhận tương tác thảo luận tích cực tăng mạnh 28% so với cùng kỳ năm ngoái. Khách hàng thể hiện sự hài lòng rất lớn đối với chất lượng nước và các chương trình khuyến mãi lì xì đầu năm. Tuy nhiên, ghi nhận một vài phản hồi tiêu cực về tình trạng xếp hàng chờ đợi tại các chi nhánh trung tâm trong giờ cao điểm.",
          stats: { total: 3, positive: 2, negative: 0, neutral: 1, score: 67 },
          mentions: [
            { id: "m1", brand: "Laha Coffee", source: "Facebook", content: "Cà phê muối Laha ngon ghê, đợt Tết này có lì xì nữa thích quá!", sentiment: "positive", topic: "quality", posted_at: "2026-02-10" },
            { id: "m2", brand: "Laha Coffee", source: "TikTok", content: "Quán Laha Coffee chi nhánh Quận 1 đông quá trời đông, chờ 20 phút mới có nước :( nhưng nước ngon nên bỏ qua", sentiment: "neutral", topic: "service", posted_at: "2026-02-12" },
            { id: "m3", brand: "Laha Coffee", source: "Facebook", content: "Laha phục vụ ngày Tết rất chu đáo và thân thiện nha.", sentiment: "positive", topic: "service", posted_at: "2026-02-14" }
          ]
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
          insights: "Phân tích cạnh tranh trong Q1 giữa đối thủ trực tiếp Mixue và Highlands. Mixue dẫn đầu về lượng thảo luận giá bán, đặc biệt là dòng kem 10k và trà sữa giá rẻ. Phản hồi tích cực chiếm 55% nhờ giá cả phù hợp túi tiền học sinh sinh viên. Mặc dù vậy, có một số ý kiến phàn nàn về không gian quán nhỏ hẹp và dịch vụ vệ sinh tại một số cửa hàng nhượng quyền.",
          stats: { total: 3, positive: 2, negative: 1, neutral: 0, score: 67 },
          mentions: [
            { id: "m4", brand: "Mixue", source: "Facebook", content: "Kem Mixue 10k siêu ngon siêu rẻ ăn hoài không chán luôn á!", sentiment: "positive", topic: "price", posted_at: "2026-03-20" },
            { id: "m5", brand: "Mixue", source: "Threads", content: "Trà sữa Mixue bình dân, chất lượng tạm ổn so với giá tiền.", sentiment: "positive", topic: "price", posted_at: "2026-03-25" },
            { id: "m6", brand: "Google Maps", content: "Không gian quán chật chội, bàn ghế dơ không ai lau dọn.", sentiment: "negative", topic: "service", posted_at: "2026-03-29" }
          ]
        }
      ];
      setArchivedReports(initialMocks);
      localStorage.setItem("insightflow_archived_reports", JSON.stringify(initialMocks));
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(secondDb, "mentions_nlp_demo"));
        const data: Mention[] = [];
        const brandSet = new Set<string>();

        snapshot.forEach(doc => {
          const d = doc.data();
          const rawBrand = d.brand || d.workspace_id || "unknown";
          const b = formatBrandName(rawBrand);
          if (b && b.toLowerCase() !== "unknown" && b.toLowerCase() !== "other") {
            brandSet.add(b);
          }

          let postedRaw = d.posted_at || d.created_at || d.analyzed_at || new Date().toISOString();
          let posted = "";
          if (typeof postedRaw === "object" && typeof postedRaw.toDate === "function") {
            posted = postedRaw.toDate().toISOString();
          } else {
            posted = String(postedRaw);
          }
          
          data.push({
            id: doc.id,
            brand: b,
            source: d.source || d.platform || "unknown",
            content: d.content || d.text || "",
            sentiment: d.baseline_sentiment || d.sentiment || "neutral",
            topic: d.baseline_topic || d.topic || "other",
            posted_at: posted
          });
        });

        setMentions(data);
        setBrands(Array.from(brandSet).sort());
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
    mentions.forEach(m => {
      let d: Date;
      const match = m.posted_at.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      } else {
        d = new Date(m.posted_at);
      }
      if (isNaN(d.getTime())) return;

      const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
      const b = m.brand;
      
      if (!groupedMentions[b]) groupedMentions[b] = {};
      if (!groupedMentions[b][dateStr]) groupedMentions[b][dateStr] = [];
      groupedMentions[b][dateStr].push(m);
    });

    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });

      targetBrands.forEach(b => {
        const arr = (groupedMentions[b] && groupedMentions[b][dateStr]) ? groupedMentions[b][dateStr] : [];
        result.push({
          id: `RPT-${b.replace(/\s+/g, '')}-${dateStr.replace(/\//g, "")}`,
          dateStr,
          dateObj: d,
          brand: b,
          mentions: arr,
          size: arr.length > 0 ? (arr.length * 0.05).toFixed(1) + " MB" : "0 MB"
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
    mentions.forEach(m => {
      let d = new Date(m.posted_at);
      const match = m.posted_at.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      
      if (!isNaN(d.getTime())) {
        const diffDays = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) weeklyMentions++;
      }
    });

    // 2. Sentiment Index
    let pos = 0;
    let totalSent = 0;
    reportsList.forEach(r => {
      r.mentions.forEach(m => {
        totalSent++;
        if (m.sentiment.toLowerCase().includes("pos")) pos++;
      });
    });
    const sentimentScore = totalSent > 0 ? Math.round((pos / totalSent) * 100) : 0;
    const sentimentLabel = sentimentScore >= 50 
      ? t("reports.sentiment.positive", { defaultValue: "Tích cực" }) 
      : sentimentScore > 0 
        ? t("reports.sentiment.negative", { defaultValue: "Tiêu cực" }) 
        : t("reports.stats.noReport", { defaultValue: "Chưa có" });
    const sentimentIcon = sentimentScore >= 50 ? "sentiment_satisfied" : sentimentScore > 0 ? "sentiment_dissatisfied" : "sentiment_neutral";

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
      latestReportTime: rptDate ? t("reports.stats.updatedDate", { date: rptDate, defaultValue: `Cập nhật ngày: ${rptDate}` }) : ""
    };
  }, [mentions, reportsList]);

  const handleExportPDF = async (report: DailyReport) => {
    try {
      setGeneratingPdfId(report.id);
      await generateDailyReportPDF(report.brand, report.dateStr, report.mentions);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // ── Custom report actions ──
  const toggleCheckbox = (value: string, list: string[], setList: (arr: string[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter(item => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleGenerateCustomReport = () => {
    setCustomReportLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    setTimeout(() => {
      const filtered = mentions.filter(m => {
        // Brand filter
        if (customBrand !== "all" && m.brand !== customBrand) return false;

        // Date filter
        let mDate: Date;
        const match = m.posted_at.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          mDate = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        } else {
          mDate = new Date(m.posted_at);
        }
        if (isNaN(mDate.getTime())) return false;

        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (mDate < start || mDate > end) return false;

        // Platform filter
        if (!customPlatforms.includes(m.source.toLowerCase())) return false;

        // Topic filter
        if (!customTopics.includes(m.topic.toLowerCase())) return false;

        // Sentiment filter
        const sentimentMap: Record<string, string> = {
          positive: "positive",
          neutral: "neutral",
          negative: "negative",
          pos: "positive",
          neg: "negative",
          neu: "neutral"
        };
        const s = sentimentMap[m.sentiment.toLowerCase()] || "neutral";
        if (!customSentiments.includes(s)) return false;

        return true;
      });

      if (filtered.length === 0) {
        clearInterval(stepInterval);
        setCustomReportLoading(false);
        alert(t("reports.custom.noMentionsFound", { defaultValue: "Không tìm thấy dữ liệu đề cập nào phù hợp với các bộ lọc đã chọn. Vui lòng điều chỉnh lại." }));
        return;
      }

      let pos = 0, neg = 0, neu = 0;
      filtered.forEach(m => {
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
          score
        },
        aiInsights: insights
      });

      clearInterval(stepInterval);
      setCustomReportLoading(false);
      setCustomReportGenerated(true);
    }, 2400);
  };

  const handleExportCustomPDF = async () => {
    if (!customReportData) return;
    try {
      setGeneratingPdfId("custom-export");
      const filtersSummary = i18n.language === "en"
        ? `${customPlatforms.length} sources, ${customTopics.length} topics, ${customSentiments.length} sentiments`
        : `${customPlatforms.length} nguồn, ${customTopics.length} chủ đề, ${customSentiments.length} sắc thái.`;
      const dateStartFormatted = new Date(customStartDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
      const dateEndFormatted = new Date(customEndDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
      
      await generateCustomReportPDF(
        customBrand,
        dateStartFormatted,
        dateEndFormatted,
        customReportData.mentions,
        customReportData.aiInsights,
        filtersSummary
      );
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleArchiveReport = () => {
    if (!customReportData) return;
    
    const formattedStart = new Date(customStartDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
    const formattedEnd = new Date(customEndDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
    const filters = i18n.language === "en"
      ? `${customPlatforms.length} sources, ${customTopics.length} topics, ${customSentiments.length} sentiments`
      : `${customPlatforms.length} nguồn, ${customTopics.length} chủ đề, ${customSentiments.length} sắc thái.`;

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
      mentions: customReportData.mentions
    };

    const updated = [newArchived, ...archivedReports];
    setArchivedReports(updated);
    localStorage.setItem("insightflow_archived_reports", JSON.stringify(updated));
    alert(t("reports.custom.archiveSuccess", { defaultValue: "Đã lưu trữ báo cáo thành công! Bạn có thể xem lại tại tab 'Lưu trữ'." }));
  };

  const handleExportArchivedPDF = async (report: any) => {
    try {
      setGeneratingPdfId(report.id);
      const startFormatted = new Date(report.startDate || new Date()).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
      const endFormatted = new Date(report.endDate || new Date()).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US");
      
      await generateCustomReportPDF(
        report.brand,
        startFormatted,
        endFormatted,
        report.mentions || [],
        report.insights || "",
        report.filtersSummary || t("reports.custom.archiveFallback", { defaultValue: "Báo cáo lưu trữ" })
      );
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleDeleteArchive = (id: string) => {
    const updated = archivedReports.filter(r => r.id !== id);
    setArchivedReports(updated);
    localStorage.setItem("insightflow_archived_reports", JSON.stringify(updated));
    if (previewArchiveReport?.id === id) {
      setPreviewArchiveReport(null);
    }
  };

  // Memoized search & filter for Archive tab
  const filteredArchivedReports = useMemo(() => {
    return archivedReports.filter(rpt => {
      const query = archiveSearchQuery.toLowerCase().trim();
      const matchesSearch = query === "" || 
        rpt.title.toLowerCase().includes(query) || 
        rpt.id.toLowerCase().includes(query) ||
        rpt.brand.toLowerCase().includes(query);
        
      const matchesBrand = archiveBrandFilter === "all" || 
        rpt.brand.toLowerCase() === archiveBrandFilter.toLowerCase();
        
      return matchesSearch && matchesBrand;
    });
  }, [archivedReports, archiveSearchQuery, archiveBrandFilter]);

  const loadingMessages = [
    t("reports.custom.loading.step0", { defaultValue: "Đang phân tích các bộ lọc và tìm kiếm đề cập tương thích..." }),
    t("reports.custom.loading.step1", { defaultValue: "Đang tính toán chỉ số sắc thái và xu hướng cảm xúc..." }),
    t("reports.custom.loading.step2", { defaultValue: "Đang đánh giá mật độ chủ đề thảo luận nhiều nhất..." }),
    t("reports.custom.loading.step3", { defaultValue: "AI đang biên soạn văn bản nhận xét thông minh (AI Insights)..." })
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
          onExport={() => handleExportArchivedPDF(previewArchiveReport)}
          isExporting={generatingPdfId === previewArchiveReport.id}
          onDelete={() => handleDeleteArchive(previewArchiveReport.id)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            {t("reports.header.title", { defaultValue: "Trung tâm Báo cáo" })}
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
            {t("reports.stats.weeklyMentions", { defaultValue: "Mentions tuần này" })}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">{stats.weeklyMentions.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-[var(--color-success)]">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-[10px] md:text-xs font-bold">
              {t("reports.stats.realtime", { defaultValue: "Realtime" })}
            </span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">analytics</span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group border-l-4 border-[var(--color-brand)]/30">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">
            {t("reports.stats.sentimentIndex", { defaultValue: "Sentiment Index" })}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">{stats.sentimentScore}/100</p>
          <div className="flex items-center gap-1 mt-2 text-[var(--color-brand)]">
            <span className="material-symbols-outlined text-sm">{stats.sentimentIcon}</span>
            <span className="text-[10px] md:text-xs font-bold">{stats.sentimentLabel}</span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">mood</span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group col-span-2 lg:col-span-1">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">
            {t("reports.stats.latestReport", { defaultValue: "Báo cáo mới nhất" })}
          </p>
          <p className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] truncate pr-6">{stats.latestReportName}</p>
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] mt-2 font-medium">{stats.latestReportTime}</p>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">history</span>
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
                activeTab === "periodic" ? "text-[var(--color-brand)] bg-[var(--color-brand-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              {t("reports.tabs.periodic", { defaultValue: "Định kỳ" })}
            </button>
            <button 
              onClick={() => { setActiveTab("custom"); setCustomReportGenerated(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === "custom" ? "text-[var(--color-brand)] bg-[var(--color-brand-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
              }`}
            >
              {t("reports.tabs.custom", { defaultValue: "Tùy chỉnh" })}
            </button>
            <button 
              onClick={() => setActiveTab("archive")}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === "archive" ? "text-[var(--color-brand)] bg-[var(--color-brand-subtle)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)]"
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
                  {t("reports.preview.brand", { defaultValue: "Thương hiệu" })}:
                </span>
                <select 
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                >
                  <option value="all">{t("reports.filters.allBrands", { defaultValue: "Tất cả nhãn hàng" })}</option>
                  {brands.map(b => (
                    <option key={b} value={b} className="capitalize">{b}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 md:flex-none min-w-[120px]">
                <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider hidden sm:block">
                  {t("reports.preview.dateRange", { defaultValue: "Thời gian" })}:
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
                 <p className="font-bold">
                   {t("reports.periodic.loading", { defaultValue: "Đang tải dữ liệu báo cáo..." })}
                 </p>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">description</span>
                <p className="font-bold">
                  {t("reports.periodic.empty", { defaultValue: "Không tìm thấy báo cáo nào phù hợp." })}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="md:hidden divide-y divide-[var(--color-border)]">
                  {paginatedReports.map((rpt) => (
                    <div key={rpt.id} className="p-4 cursor-pointer hover:bg-[var(--color-bg-surface-raised)] transition-colors" onClick={() => setPreviewReport(rpt)}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-xl">description</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] leading-snug truncate pr-2 capitalize">
                            {t("reports.table.dailyReport", { brand: rpt.brand, defaultValue: `Daily Report - ${rpt.brand}` })}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">{rpt.mentions.length} {t("reports.sentiment.mentionsCount", { defaultValue: "mentions" })}</p>
                        </div>
                        <span className="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 border border-[var(--color-brand-border)]">
                          {t("reports.periodic.dailyTag", { defaultValue: "Hàng ngày" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] font-bold mb-3 bg-[var(--color-bg-surface-raised)] rounded-lg px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {rpt.dateStr}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">data_usage</span>
                          {rpt.size}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExportPDF(rpt); }}
                          disabled={generatingPdfId === rpt.id || rpt.mentions.length === 0}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all text-[11px] font-bold disabled:opacity-50"
                        >
                          {generatingPdfId === rpt.id ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                          )}
                          {generatingPdfId === rpt.id ? t("reports.common.generating", { defaultValue: "Đang tạo..." }) : t("reports.common.pdf", { defaultValue: "PDF" })}
                        </button>
                        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          {t("reports.common.view", { defaultValue: "Xem" })}
                        </button>
                        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] transition-all text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                          {t("reports.common.more", { defaultValue: "Thêm" })}
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
                          {t("reports.table.name", { defaultValue: "Tên Báo Cáo" })}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] w-32">
                          {t("reports.table.createdDate", { defaultValue: "Ngày Tạo" })}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          {t("reports.table.mentions", { defaultValue: "Mentions" })}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          {t("reports.table.size", { defaultValue: "Dung Lượng" })}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-right">
                          {t("reports.table.actions", { defaultValue: "Hành động" })}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {paginatedReports.map((rpt) => (
                        <tr key={rpt.id} className="hover:bg-[var(--color-bg-surface-raised)] transition-colors group cursor-pointer" onClick={() => setPreviewReport(rpt)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0 ${rpt.mentions.length > 0 ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)] opacity-50"}`}>
                                <span className="material-symbols-outlined">description</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[var(--color-text-primary)] capitalize">
                                  {t("reports.table.dailyReport", { brand: rpt.brand, defaultValue: `Daily Report - ${rpt.brand}` })}
                                </p>
                                <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">ID: {rpt.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                            {rpt.dateStr}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                            {rpt.mentions.length > 0 ? `${rpt.mentions.length} ${t("reports.sentiment.mentionsCount", { defaultValue: "mentions" })}` : <span className="text-[var(--color-text-muted)] italic">0 mentions</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">{rpt.size}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPreviewReport(rpt); }}
                                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors" 
                                title={t("reports.table.tooltip.preview", { defaultValue: "Xem trước" })}
                              >
                                <span className="material-symbols-outlined text-xl">visibility</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleExportPDF(rpt); }}
                                disabled={generatingPdfId === rpt.id || rpt.mentions.length === 0}
                                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors disabled:opacity-50" 
                                title={t("reports.table.tooltip.exportPdf", { defaultValue: "Xuất PDF" })}
                              >
                                {generatingPdfId === rpt.id ? (
                                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block"></span>
                                ) : (
                                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                )}
                              </button>
                              <button onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" title={t("reports.table.tooltip.more", { defaultValue: "Thêm" })}>
                                <span className="material-symbols-outlined text-xl">more_vert</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 md:px-6 py-4 bg-[var(--color-bg-surface-raised)] border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">
                    {t("reports.pagination.display", {
                      start: reportsList.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      end: Math.min(currentPage * ITEMS_PER_PAGE, reportsList.length),
                      total: reportsList.length,
                      defaultValue: `Hiển thị ${reportsList.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, reportsList.length)} / ${reportsList.length} báo cáo`
                    })}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-high)] transition-colors text-[var(--color-text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors bg-primary text-white">
                      {currentPage}
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-high)] transition-colors text-[var(--color-text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>
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
                    <span className="material-symbols-outlined text-base">psychology</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-on-surface">
                    {t("reports.custom.loading.title", { defaultValue: "AI đang xử lý báo cáo..." })}
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
                    <span className="material-symbols-outlined text-primary">settings_suggest</span>
                    {t("reports.custom.config.title", { defaultValue: "Thiết lập Báo cáo Tùy chỉnh" })}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t("reports.custom.config.desc", { defaultValue: "Lọc dữ liệu mạng xã hội và truyền thông, sau đó yêu cầu AI lập báo cáo phân tích theo hướng đi cụ thể." })}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Brand & Date range */}
                  <div className="space-y-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("reports.custom.config.selectBrand", { defaultValue: "Chọn thương hiệu:" })}
                      </label>
                      <select 
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        className="bg-white border border-outline-variant rounded-lg text-sm py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-primary/25"
                      >
                        <option value="all">{t("reports.filters.allBrands", { defaultValue: "Tất cả nhãn hàng" })}</option>
                        {brands.map(b => (
                          <option key={b} value={b} className="capitalize">{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          {t("reports.custom.config.startDate", { defaultValue: "Từ ngày:" })}
                        </label>
                        <input 
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-white border border-outline-variant rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-primary/25"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          {t("reports.custom.config.endDate", { defaultValue: "Đến ngày:" })}
                        </label>
                        <input 
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-white border border-outline-variant rounded-lg text-sm py-2 px-3 outline-none focus:ring-2 focus:ring-primary/25"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Filter */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("reports.custom.config.selectSentiment", { defaultValue: "Chọn sắc thái:" })}
                      </label>
                      <button 
                        onClick={() => setCustomSentiments(customSentiments.length === 3 ? [] : ["positive", "neutral", "negative"])}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        {customSentiments.length === 3 
                          ? t("reports.custom.config.deselectAll", { defaultValue: "Bỏ chọn tất cả" }) 
                          : t("reports.custom.config.selectAll", { defaultValue: "Chọn tất cả" })}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { val: "positive", label: t("reports.sentiment.positive", { defaultValue: "Tích cực" }), icon: "mood", color: "text-green-600 bg-green-50 border-green-200" },
                        { val: "neutral", label: t("reports.sentiment.neutral", { defaultValue: "Trung lập" }), icon: "sentiment_neutral", color: "text-gray-600 bg-gray-50 border-gray-200" },
                        { val: "negative", label: t("reports.sentiment.negative", { defaultValue: "Tiêu cực" }), icon: "sentiment_dissatisfied", color: "text-red-600 bg-red-50 border-red-200" }
                      ].map(item => {
                        const active = customSentiments.includes(item.val);
                        return (
                          <button
                            key={item.val}
                            onClick={() => toggleCheckbox(item.val, customSentiments, setCustomSentiments)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              active ? `${item.color} shadow-sm` : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
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
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("reports.custom.config.sources", { defaultValue: "Nguồn dữ liệu (Nền tảng):" })}
                      </label>
                      <button 
                        onClick={() => setCustomPlatforms(customPlatforms.length === 7 ? [] : ["facebook", "tiktok", "youtube", "thread", "be", "google_maps", "news"])}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        {customPlatforms.length === 7 
                          ? t("reports.custom.config.deselectAllPlatforms", { defaultValue: "Bỏ tất cả" }) 
                          : t("reports.custom.config.selectAll", { defaultValue: "Chọn tất cả" })}
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
                        { val: "news", label: "Báo chí" }
                      ].map(p => {
                        const active = customPlatforms.includes(p.val);
                        const platformLabel = p.val === "news" 
                          ? t("mentions.filters.news", { defaultValue: "Báo chí" }) 
                          : p.val === "youtube" 
                            ? t("dashboard.filters.youtube", { defaultValue: "YouTube" })
                            : p.label;
                        return (
                          <label key={p.val} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded hover:bg-surface-container/50">
                            <input 
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleCheckbox(p.val, customPlatforms, setCustomPlatforms)}
                              className="accent-primary w-4 h-4"
                            />
                            {platformLabel}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("reports.custom.config.topics", { defaultValue: "Chủ đề quan tâm:" })}
                      </label>
                      <button 
                        onClick={() => setCustomTopics(customTopics.length === 11 ? [] : ["quality", "price", "service", "staff", "delivery", "experience", "legal", "operation", "marketing", "competitor", "other"])}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        {customTopics.length === 11 
                          ? t("reports.custom.config.deselectAllPlatforms", { defaultValue: "Bỏ tất cả" }) 
                          : t("reports.custom.config.selectAll", { defaultValue: "Chọn tất cả" })}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {[
                        { val: "quality", defaultLabel: "Chất lượng" },
                        { val: "price", defaultLabel: "Giá cả" },
                        { val: "service", defaultLabel: "Phục vụ" },
                        { val: "staff", defaultLabel: "Nhân viên" },
                        { val: "delivery", defaultLabel: "Giao hàng" },
                        { val: "experience", defaultLabel: "Trải nghiệm" },
                        { val: "legal", defaultLabel: "Pháp lý" },
                        { val: "operation", defaultLabel: "Vận hành" },
                        { val: "marketing", defaultLabel: "Marketing" },
                        { val: "competitor", defaultLabel: "Đối thủ" },
                        { val: "other", defaultLabel: "Khác" }
                      ].map(tItem => {
                        const active = customTopics.includes(tItem.val);
                        const label = t(`reports.topics.${tItem.val}`, { defaultValue: tItem.defaultLabel });
                        return (
                          <label key={tItem.val} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded hover:bg-surface-container/50">
                            <input 
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleCheckbox(tItem.val, customTopics, setCustomTopics)}
                              className="accent-primary w-4 h-4"
                            />
                            {label}
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
                    disabled={customPlatforms.length === 0 || customTopics.length === 0 || customSentiments.length === 0}
                    className="flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">science</span>
                    {t("reports.custom.config.generateBtn", { defaultValue: "Tạo báo cáo với AI Insights" })}
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
                    className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    {t("reports.custom.backToConfig", { defaultValue: "Quay lại cấu hình bộ lọc" })}
                  </button>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={handleArchiveReport}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container text-on-surface border border-outline-variant rounded-xl font-bold text-xs hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">archive</span>
                      {t("reports.custom.archiveReport", { defaultValue: "Lưu trữ báo cáo" })}
                    </button>
                    <button 
                      onClick={handleExportCustomPDF}
                      disabled={generatingPdfId === "custom-export"}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold text-xs hover:bg-[var(--color-brand-hover)] transition-all disabled:opacity-50"
                    >
                      {generatingPdfId === "custom-export" ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
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
                    {t("reports.custom.analysisReport", { brand: customBrand === "all" ? t("reports.filters.allBrands", { defaultValue: "Tất Cả Nhãn Hàng" }) : customBrand, defaultValue: `Báo cáo phân tích: ${customBrand === "all" ? "Tất Cả Nhãn Hàng" : customBrand}` })}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t("reports.custom.analysisDesc", {
                      start: new Date(customStartDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US"),
                      end: new Date(customEndDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US"),
                      count: customReportData?.mentions.length || 0,
                      defaultValue: `Phân tích trong khoảng thời gian từ ${new Date(customStartDate).toLocaleDateString("vi-VN")} đến ${new Date(customEndDate).toLocaleDateString("vi-VN")} dựa trên ${customReportData?.mentions.length} đề cập phù hợp.`
                    })}
                  </p>
                </div>

                {/* Custom Report Metrics */}
                {customReportData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        {t("reports.custom.stats.total", { defaultValue: "Tổng số đề cập" })}
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{customReportData.stats.total}</p>
                    </div>
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        {t("reports.custom.stats.positive", { defaultValue: "Sắc thái Tích cực" })}
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-success)] mt-1">
                        {customReportData.stats.positive}
                        <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">({stats.total > 0 ? Math.round(customReportData.stats.positive/customReportData.stats.total*100) : 0}%)</span>
                      </p>
                    </div>
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        {t("reports.custom.stats.negative", { defaultValue: "Sắc thái Tiêu cực" })}
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-error)] mt-1">
                        {customReportData.stats.negative}
                        <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">({stats.total > 0 ? Math.round(customReportData.stats.negative/customReportData.stats.total*100) : 0}%)</span>
                      </p>
                    </div>
                    <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                        {t("reports.custom.stats.netSentiment", { defaultValue: "Chỉ số Cảm xúc ròng" })}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${customReportData.stats.score >= 50 ? "text-[var(--color-success)]" : customReportData.stats.score > 0 ? "text-[var(--color-brand)]" : "text-[var(--color-error)]"}`}>
                        {customReportData.stats.score >= 0 ? "+" : ""}{customReportData.stats.score}%
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
                        <span className="material-symbols-outlined text-lg">psychology</span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--color-brand)] uppercase tracking-wider">
                        {t("reports.custom.aiInsightsTitle", { defaultValue: "AI Insights & Phân Tích Chuyên Sâu" })}
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
                    {t("reports.custom.matchedMentions", { defaultValue: "Các đề cập phù hợp tiêu chí (Tối đa 50 bài đăng mẫu)" })}
                  </h3>
                  
                  <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                    {/* Responsive list of matches */}
                    <div className="block md:hidden divide-y divide-[var(--color-border)]">
                      {customReportData?.mentions.slice(0, 50).map((m, idx) => (
                        <div key={idx} className="p-3 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[var(--color-brand)] capitalize">{m.source}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.sentiment.toLowerCase().includes("pos") ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]" :
                              m.sentiment.toLowerCase().includes("neg") ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]" : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                            }`}>
                              {m.sentiment === "positive" || m.sentiment === "pos" ? t("reports.sentiment.positive", { defaultValue: "Tích cực" }) : m.sentiment === "negative" || m.sentiment === "neg" ? t("reports.sentiment.negative", { defaultValue: "Tiêu cực" }) : t("reports.sentiment.neutral", { defaultValue: "Trung lập" })}
                            </span>
                          </div>
                          <p className="text-[var(--color-text-secondary)]">{m.content}</p>
                          <div className="text-[10px] text-[var(--color-text-muted)] flex justify-between">
                            <span>
                              {t("reports.custom.list.topic", { topic: t(`reports.topics.${m.topic}`, { defaultValue: m.topic }).toUpperCase(), defaultValue: `Chủ đề: ${m.topic.toUpperCase()}` })}
                            </span>
                            <span>{new Date(m.posted_at).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US")}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <table className="w-full text-left text-xs hidden md:table">
                      <thead>
                        <tr className="bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border)]">
                          <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] w-24">
                            {t("reports.custom.table.source", { defaultValue: "Nguồn" })}
                          </th>
                          <th className="px-4 py-3 font-bold text-[var(--color-text-muted)]">
                            {t("reports.custom.table.content", { defaultValue: "Nội dung đề cập" })}
                          </th>
                          <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] w-24">
                            {t("reports.custom.table.sentiment", { defaultValue: "Sắc thái" })}
                          </th>
                          <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] w-28">
                            {t("reports.custom.table.topic", { defaultValue: "Chủ đề" })}
                          </th>
                          <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] w-28">
                            {t("reports.custom.table.date", { defaultValue: "Ngày đăng" })}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {customReportData?.mentions.slice(0, 50).map((m, idx) => (
                          <tr key={idx} className="hover:bg-[var(--color-bg-surface-raised)]/50 transition-colors">
                            <td className="px-4 py-3 font-bold capitalize text-[var(--color-brand)]">{m.source}</td>
                            <td className="px-4 py-3 text-[var(--color-text-secondary)] font-medium max-w-xs truncate" title={m.content}>
                              {m.content}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                m.sentiment.toLowerCase().includes("pos") ? "text-[var(--color-success)] bg-[var(--color-success-subtle)] border-[var(--color-success)]/30" :
                                m.sentiment.toLowerCase().includes("neg") ? "text-[var(--color-error)] bg-[var(--color-error-subtle)] border-[var(--color-error)]/30" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-raised)] border-[var(--color-border)]"
                              }`}>
                                {m.sentiment === "positive" || m.sentiment === "pos" ? t("reports.sentiment.positive", { defaultValue: "Tích cực" }) : m.sentiment === "negative" || m.sentiment === "neg" ? t("reports.sentiment.negative", { defaultValue: "Tiêu cực" }) : t("reports.sentiment.neutral", { defaultValue: "Trung lập" })}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-[var(--color-text-secondary)] capitalize">
                              {t(`reports.topics.${m.topic}`, { defaultValue: m.topic })}
                            </td>
                            <td className="px-4 py-3 text-[var(--color-text-muted)] font-medium">
                              {new Date(m.posted_at).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  <span className="material-symbols-outlined text-[var(--color-brand)]">archive</span>
                  {t("reports.archive.title", { defaultValue: "Báo cáo đã Lưu trữ" })}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {t("reports.archive.desc", { defaultValue: "Các bản báo cáo Snapshot tĩnh đã được phê duyệt lưu giữ lâu dài để theo dõi sự phát triển thương hiệu." })}
                </p>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <div className="flex-1 relative flex items-center">
                <span className="material-symbols-outlined text-[var(--color-text-muted)] absolute left-3 pointer-events-none text-lg">search</span>
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
                  {t("reports.archive.filterBrand", { defaultValue: "Lọc nhãn:" })}
                </span>
                <select 
                  value={archiveBrandFilter}
                  onChange={(e) => setArchiveBrandFilter(e.target.value)}
                  className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2.5 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
                >
                  <option value="all">{t("reports.archive.allBrands", { defaultValue: "Tất cả nhãn hàng" })}</option>
                  {brands.map(b => (
                    <option key={b} value={b} className="capitalize">{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredArchivedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] bg-[var(--color-bg-surface-raised)] rounded-xl border border-dashed border-[var(--color-border)]">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">archive</span>
                <p className="font-bold text-sm">
                  {t("reports.archive.empty", { defaultValue: "Không tìm thấy báo cáo lưu trữ nào phù hợp." })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredArchivedReports.map((rpt) => (
                  <div key={rpt.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] hover:shadow-sm hover:border-[var(--color-brand)]/25 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)] truncate pr-4">{rpt.title}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 max-w-2xl font-normal leading-relaxed">
                        {rpt.insights}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-[var(--color-border)] pt-3 md:pt-0">
                      <div className="text-left md:text-right hidden sm:block mr-2">
                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                          {t("reports.archive.mentions", { defaultValue: "Lượt đề cập" })}
                        </p>
                        <p className="text-xs font-bold text-[var(--color-text-primary)]">
                          {rpt.mentionsCount} {t("reports.sentiment.mentionsCount", { defaultValue: "mentions" })}
                        </p>
                      </div>
                      <button 
                        onClick={() => setPreviewArchiveReport(rpt)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2.5 bg-[var(--color-bg-surface-high)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl font-bold text-xs hover:bg-[var(--color-border)] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        {t("reports.common.view", { defaultValue: "Xem" })}
                      </button>
                      <button 
                        onClick={() => handleExportArchivedPDF(rpt)}
                        disabled={generatingPdfId === rpt.id}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2.5 bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 rounded-xl font-bold text-xs hover:bg-[var(--color-brand)]/25 transition-colors disabled:opacity-50"
                      >
                        {generatingPdfId === rpt.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">download</span>
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
              {t("reports.banner.automation", { defaultValue: "Tự động hóa" })}
            </p>
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              {t("reports.banner.emailTitle", { defaultValue: "Gửi báo cáo qua Email" })}
            </h3>
            <p className="text-sm opacity-80 mb-5 max-w-sm">
              {t("reports.banner.emailDesc", { defaultValue: "Cấu hình gửi báo cáo AI tự động vào hộp thư lúc 8:00 sáng mỗi ngày." })}
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
                {t("reports.banner.newTag", { defaultValue: "Mới" })}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-[var(--color-text-primary)]">
              {t("reports.banner.trendTitle", { defaultValue: "Phân tích Xu hướng AI" })}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] opacity-75 mb-5">
              {t("reports.banner.trendDesc", { defaultValue: "Dùng LLM tóm tắt biến động thị trường quan trọng nhất trong tuần." })}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] font-bold text-sm transition-colors"
            >
              {t("reports.banner.exploreBtn", { defaultValue: "Khám phá ngay" })}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
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
