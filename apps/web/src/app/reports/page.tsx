"use client";

import React, { useState, useEffect, useMemo } from "react";
import { generateDailyReportPDF } from "@/lib/pdfExport";
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
  // Calculate basic stats for the preview
  const total = report.mentions.length;
  let pos = 0, neu = 0, neg = 0;
  const topics: Record<string, number> = {};

  report.mentions.forEach(m => {
    const s = m.sentiment.toLowerCase();
    if (s.includes("pos")) pos++;
    else if (s.includes("neg")) neg++;
    else neu++;

    const t = m.topic.toLowerCase();
    topics[t] = (topics[t] || 0) + 1;
  });

  const topTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Xem trước Báo cáo</h2>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">Thương hiệu</p>
            <p className="font-bold text-lg text-[var(--color-brand)] capitalize">{report.brand}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">Ngày báo cáo</p>
            <p className="font-bold text-lg text-[var(--color-text-primary)]">{report.dateStr}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase">Tổng lượt đề cập</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{total}</p>
            </div>
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase">Chỉ số Cảm xúc</p>
              <div className="flex gap-2 text-sm mt-1 font-medium">
                <span className="text-[var(--color-success)]">{pos} Tốt</span>
                <span className="text-[var(--color-error)]">{neg} Xấu</span>
              </div>
            </div>
          </div>

          {topTopics.length > 0 && (
            <div className="bg-[var(--color-bg-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mb-2">Chủ đề nổi bật</p>
              <div className="flex flex-wrap gap-2">
                {topTopics.map(([t, count]) => (
                  <span key={t} className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-2 py-1 rounded text-xs font-semibold capitalize text-[var(--color-text-primary)]">
                    {t}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[var(--color-text-secondary)] font-bold hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)]">
            Đóng
          </button>
          <button 
            onClick={onExport} 
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold shadow-sm hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {isExporting ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-lg">download</span>}
            Tải PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // "all", "today", "week", "month"
  
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(secondDb, "mentions_nlp_demo"));
        const data: Mention[] = [];
        const brandSet = new Set<string>();

        snapshot.forEach(doc => {
          const d = doc.data();
          const b = (d.brand || "unknown").toLowerCase();
          if (b !== "unknown") brandSet.add(b);

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
    const sentimentLabel = sentimentScore >= 50 ? "Tích cực" : sentimentScore > 0 ? "Tiêu cực" : "Chưa có";
    const sentimentIcon = sentimentScore >= 50 ? "sentiment_satisfied" : sentimentScore > 0 ? "sentiment_dissatisfied" : "sentiment_neutral";

    // 3. Báo cáo gần nhất
    const latestRpt = reportsList.length > 0 ? reportsList[0] : null;
    let rptName = "Chưa có";
    let rptDate = "";
    if (latestRpt) {
      rptName = `Daily Report ${latestRpt.brand.charAt(0).toUpperCase() + latestRpt.brand.slice(1)}`;
      rptDate = latestRpt.dateStr;
    }

    return {
      weeklyMentions,
      sentimentScore,
      sentimentLabel,
      sentimentIcon,
      latestReportName: rptName,
      latestReportTime: rptDate ? `Cập nhật ngày: ${rptDate}` : ""
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

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">Trung tâm Báo cáo</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Quản lý và tải xuống các báo cáo phân tích định kỳ từ AI.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[var(--color-brand)] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-[var(--color-brand-hover)] active:scale-95 transition-all shadow-sm w-full sm:w-auto">
          <span className="material-symbols-outlined text-xl">add_chart</span>
          Tạo báo cáo thủ công
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">Mentions tuần này</p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">{stats.weeklyMentions.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-[var(--color-success)]">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-[10px] md:text-xs font-bold">Realtime</span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">analytics</span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group border-l-4 border-[var(--color-brand)]/30">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">Sentiment Index</p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">{stats.sentimentScore}/100</p>
          <div className="flex items-center gap-1 mt-2 text-[var(--color-brand)]">
            <span className="material-symbols-outlined text-sm">{stats.sentimentIcon}</span>
            <span className="text-[10px] md:text-xs font-bold">{stats.sentimentLabel}</span>
          </div>
          <span className="absolute -right-3 -bottom-3 material-symbols-outlined text-[80px] md:text-[100px] opacity-5 hidden sm:block">mood</span>
        </div>

        <div className="glass-card p-4 md:p-6 rounded-xl relative overflow-hidden group col-span-2 lg:col-span-1">
          <p className="text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-2">Báo cáo mới nhất</p>
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
            <button className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] whitespace-nowrap flex-shrink-0">
              Định kỳ
            </button>
            <button className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] transition-colors whitespace-nowrap flex-shrink-0">
              Tùy chỉnh
            </button>
            <button className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] transition-colors whitespace-nowrap flex-shrink-0">
              Lưu trữ
            </button>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-1 md:flex-none min-w-[140px]">
              <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider hidden sm:block">Thương hiệu:</span>
              <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
              >
                <option value="all">Tất cả nhãn hàng</option>
                {brands.map(b => (
                  <option key={b} value={b} className="capitalize">{b}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 md:flex-none min-w-[120px]">
              <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider hidden sm:block">Thời gian:</span>
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="select-app border border-[var(--color-border)] rounded-lg text-xs py-2 px-3 outline-none font-bold focus:ring-2 focus:ring-[var(--color-brand)]/20 w-full"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
             <div className="w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="font-bold">Đang tải dữ liệu báo cáo...</p>
          </div>
        ) : reportsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
            <span className="material-symbols-outlined text-5xl mb-2 opacity-50">description</span>
            <p className="font-bold">Không tìm thấy báo cáo nào phù hợp.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card List */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {paginatedReports.map((rpt) => (
                <div key={rpt.id} className="p-4 cursor-pointer hover:bg-[var(--color-bg-surface-raised)] transition-colors" onClick={() => setPreviewReport(rpt)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-xl">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-text-primary)] leading-snug truncate pr-2 capitalize">Daily - {rpt.brand}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">{rpt.mentions.length} mentions</p>
                    </div>
                    <span className="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 border border-[var(--color-brand-border)]">
                      Hàng ngày
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
                      {generatingPdfId === rpt.id ? "Đang tạo..." : "PDF"}
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Xem
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-high)] transition-all text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                      Thêm
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Tên Báo Cáo</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] w-32">Ngày Tạo</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Mentions</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Dung Lượng</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Hành động</th>
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
                            <p className="text-sm font-bold text-[var(--color-text-primary)] capitalize">Daily Report - {rpt.brand}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">ID: {rpt.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                        {rpt.dateStr}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">
                        {rpt.mentions.length > 0 ? `${rpt.mentions.length} mentions` : <span className="text-[var(--color-text-muted)] italic">0 mentions</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] font-medium">{rpt.size}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewReport(rpt); }}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors" 
                            title="Xem trước"
                          >
                            <span className="material-symbols-outlined text-xl">visibility</span>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleExportPDF(rpt); }}
                            disabled={generatingPdfId === rpt.id || rpt.mentions.length === 0}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors disabled:opacity-50" 
                            title="Xuất PDF"
                          >
                            {generatingPdfId === rpt.id ? (
                              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                            )}
                          </button>
                          <button onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)] transition-colors" title="Thêm">
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
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
                Hiển thị {reportsList.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, reportsList.length)} / {reportsList.length} báo cáo
              </p>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-high)] transition-colors text-[var(--color-text-muted)] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors bg-[var(--color-brand)] text-white">
                  {currentPage}
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-high)] transition-colors text-[var(--color-text-muted)] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Promotional Banners ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
        {/* Email Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-brand)] text-white p-6 md:p-8 flex flex-col justify-center min-h-[180px] md:min-h-[220px]">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Tự động hóa</p>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Gửi báo cáo qua Email</h3>
            <p className="text-sm opacity-80 mb-5 max-w-sm">
              Cấu hình gửi báo cáo AI tự động vào hộp thư lúc 8:00 sáng mỗi ngày.
            </p>
            <button className="bg-white text-[var(--color-brand)] px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg active:scale-95 transition-all w-fit">
              Thiết lập ngay
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
              <span className="bg-[var(--color-brand)] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg">Mới</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-[var(--color-text-primary)]">Phân tích Xu hướng AI</h3>
            <p className="text-sm text-[var(--color-text-secondary)] opacity-75 mb-5">
              Dùng LLM tóm tắt biến động thị trường quan trọng nhất trong tuần.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] font-bold text-sm transition-colors"
            >
              Khám phá ngay
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
