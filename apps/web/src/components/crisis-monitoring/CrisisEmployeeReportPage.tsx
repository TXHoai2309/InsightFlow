"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { getScopedBrandKey } from "@/lib/brandScope";
import {
  buildCrisisEmployeeReportExcelDocument,
  exportCrisisEmployeeReportExcel,
  type CrisisEmployeeExcelViewOptions,
} from "@/lib/excelExport";
import { formatCrisisMinutes, type CrisisReportBucket } from "@/lib/crisis-report";
import {
  DEFAULT_CRISIS_REPORT_FILTERS,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import type {
  CrisisAttentionItem,
  CrisisPriorityRow,
} from "@/lib/crisis-employee-report";
import { ExcelDocumentPreviewModal } from "@/components/reports/ExcelDocumentPreviewModal";
import { useAlertStore } from "@/stores/alert.store";
import { useCrisisEmployeeReport } from "./useCrisisMonitoringReport";

const DEFAULT_EMPLOYEE_FILTERS: CrisisReportFilters = {
  ...DEFAULT_CRISIS_REPORT_FILTERS,
  timeRange: "7d",
};

const SOURCE_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "google_maps", label: "Google Maps" },
  { value: "news", label: "Báo điện tử" },
  { value: "be", label: "Be / BeFood" },
];

const TOPIC_OPTIONS = [
  "service",
  "quality",
  "staff",
  "price",
  "delivery",
  "experience",
  "legal",
  "operation",
  "other",
];

const inputClass =
  "h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-red-500/20";

function getPeriodLabel(filters: CrisisReportFilters) {
  if (filters.timeRange === "today") return "Hôm nay";
  if (filters.timeRange === "7d") return "7 ngày gần nhất";
  if (filters.timeRange === "30d") return "30 ngày gần nhất";
  if (filters.timeRange === "custom") {
    return filters.startDate && filters.endDate
      ? `${new Date(filters.startDate).toLocaleDateString("vi-VN")} – ${new Date(filters.endDate).toLocaleDateString("vi-VN")}`
      : "Khoảng thời gian tùy chọn";
  }
  return "Toàn bộ dữ liệu";
}

function KpiCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  description: string;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-red-700"
          : "text-[var(--color-brand)]";
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-black leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
    </article>
  );
}

function AttentionCard({ item }: { item: CrisisAttentionItem }) {
  const classes =
    item.tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : item.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-indigo-200 bg-indigo-50 text-indigo-700";
  return (
    <Link href={item.href} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{item.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
        </div>
        <strong className="text-3xl font-black">{item.count}</strong>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs font-bold">
        Mở danh sách xử lý
        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">arrow_forward</span>
      </p>
    </Link>
  );
}

function TrendChart({ rows }: { rows: Array<{ day: string; created: number; resolved: number; overdue: number }> }) {
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.created, row.resolved, row.overdue]));
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Phát sinh</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Đã giải quyết</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-red-500" />Quá hạn</span>
      </div>
      <div className="grid min-h-44 grid-cols-7 items-end gap-2">
        {rows.map((row) => (
          <div key={row.day} className="flex h-full min-w-0 flex-col justify-end gap-1">
            <div className="flex h-32 items-end justify-center gap-1">
              {([
                [row.created, "bg-slate-400", "Phát sinh"],
                [row.resolved, "bg-emerald-500", "Đã giải quyết"],
                [row.overdue, "bg-red-500", "Quá hạn"],
              ] as const).map(([value, color, label]) => (
                <div key={label} className={`w-2.5 rounded-t ${color}`} style={{ height: `${Math.max(3, (value / maxValue) * 100)}%` }} title={`${label}: ${value}`} />
              ))}
            </div>
            <span className="truncate text-center text-[10px] text-[var(--color-text-muted)]">{row.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityRow({ row }: { row: CrisisPriorityRow }) {
  const urgencyClass =
    row.urgencyLevel === "urgent"
      ? "bg-red-50 text-red-700"
      : row.urgencyLevel === "attention"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";
  return (
    <Link href={`/alerts?alertId=${encodeURIComponent(row.id)}`} className="block border-t border-[var(--color-border)] px-4 py-3 first:border-t-0 hover:bg-[var(--color-bg-surface-high)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-700">{row.severity}</span>
            <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{row.topic}</p>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">{row.content}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-muted)]">
            {row.urgencyReasons.length > 0 ? row.urgencyReasons.join(" · ") : "Theo dõi theo hạn SLA"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${urgencyClass}`}>
          {row.urgencyLevel === "urgent" ? "Khẩn cấp" : row.urgencyLevel === "attention" ? "Cần chú ý" : "Theo dõi"}
        </span>
      </div>
    </Link>
  );
}

function DistributionSummary({ title, rows }: { title: string; rows: CrisisReportBucket[] }) {
  const visibleRows = rows.filter((row) => row.count > 0).slice(0, 5);
  const max = Math.max(1, ...visibleRows.map((row) => row.count));
  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-4 space-y-3">
        {visibleRows.length > 0 ? visibleRows.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-bold text-[var(--color-text-secondary)]">{row.label}</span><span>{row.count} · {row.percentage}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-surface-high)]"><div className="h-full rounded-full" style={{ width: `${Math.max(3, (row.count / max) * 100)}%`, backgroundColor: row.color }} /></div>
          </div>
        )) : <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">Chưa có dữ liệu.</p>}
      </div>
    </div>
  );
}

export function CrisisEmployeeReportPage() {
  const { profile } = useAuth();
  const [reportFilters, setReportFilters] = useState<CrisisReportFilters>(DEFAULT_EMPLOYEE_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const report = useCrisisEmployeeReport(reportFilters);
  const { isLoading, error, fetchAlerts, fetchCorrectionRequests } = useAlertStore();

  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  useEffect(() => {
    const scopedBrandKey = getScopedBrandKey(profile);
    fetchAlerts(scopedBrandKey, false);
    fetchCorrectionRequests(scopedBrandKey, false);
  }, [fetchAlerts, fetchCorrectionRequests, profile]);

  const updateFilter = <K extends keyof CrisisReportFilters>(key: K, value: CrisisReportFilters[K]) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };
  const activeFilterCount = [
    reportFilters.status !== "all",
    reportFilters.severity !== "all",
    reportFilters.sla !== "all",
    reportFilters.escalation !== "all",
    reportFilters.source !== "all",
    reportFilters.topic !== "all",
    Boolean(reportFilters.keyword.trim()),
  ].filter(Boolean).length;
  const periodLabel = getPeriodLabel(reportFilters);
  const excelOptions: CrisisEmployeeExcelViewOptions = {
    periodLabel,
    filterLabel: `Case thuộc trách nhiệm của tôi${activeFilterCount > 0 ? ` · ${activeFilterCount} bộ lọc nâng cao` : ""}`,
  };
  const excelPreviewHtml = showExcelPreview
    ? buildCrisisEmployeeReportExcelDocument(report, excelOptions)
    : "";
  const attentionItems = report.attentionItems
    .filter((item) => item.key !== "claimable")
    .slice(0, 3);

  return (
    <main data-tour="reports-center" className="space-y-6 p-4 md:p-8">
      {showExcelPreview ? (
        <ExcelDocumentPreviewModal
          title="Nội dung và hình thức sẽ được xuất nguyên bản"
          html={excelPreviewHtml}
          onClose={() => setShowExcelPreview(false)}
          onExport={() => exportCrisisEmployeeReportExcel(report, `Bao_cao_khung_hoang_ca_nhan_${new Date().toISOString().slice(0, 10)}`, excelOptions)}
        />
      ) : null}

      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">Báo cáo công việc cá nhân</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--color-text-primary)]">Xử lý khủng hoảng</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Tập trung vào case cần xử lý ngay, kết quả cá nhân và xu hướng rủi ro trong kỳ.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <select aria-label="Kỳ báo cáo" value={reportFilters.timeRange} onChange={(event) => { const value = event.target.value as CrisisReportFilters["timeRange"]; updateFilter("timeRange", value); if (value === "custom") setShowAdvancedFilters(true); }} className={`${inputClass} sm:w-48`}>
              <option value="today">Hôm nay</option><option value="7d">7 ngày gần nhất</option><option value="30d">30 ngày gần nhất</option><option value="custom">Tùy chọn thời gian</option><option value="all">Toàn bộ dữ liệu</option>
            </select>
            <button type="button" onClick={() => setShowAdvancedFilters((value) => !value)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-bg-surface-high)]"><span className="material-symbols-outlined text-base">tune</span>Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</button>
            <button type="button" onClick={() => setShowExcelPreview(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)]"><span className="material-symbols-outlined text-base">preview</span>Xem trước &amp; xuất Excel</button>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-text-secondary)]"><strong>Hiệu suất cá nhân</strong> chỉ tính case bạn đã nhận hoặc trực tiếp xử lý.</p>
          <Link href="/alerts?reportFilter=unassigned" className="inline-flex items-center gap-2 text-xs font-black text-[var(--color-brand)]">Chưa phân công: {report.personalKpis.claimable}<span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
        </div>
      </header>

      {showAdvancedFilters ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-black text-[var(--color-text-primary)]">Bộ lọc nâng cao</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Áp dụng cho KPI trong kỳ, phân tích và file Excel.</p></div><button type="button" onClick={() => setReportFilters(DEFAULT_EMPLOYEE_FILTERS)} className="text-sm font-bold text-[var(--color-brand)]">Đặt lại</button></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái</span><select value={reportFilters.status} onChange={(event) => updateFilter("status", event.target.value)} className={inputClass}><option value="all">Tất cả trạng thái</option><option value="new">Mới</option><option value="resolving">Đang xử lý</option><option value="monitoring">Đang theo dõi</option><option value="pending_approval">Chờ duyệt</option><option value="resolved">Đã xử lý</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Mức độ</span><select value={reportFilters.severity} onChange={(event) => updateFilter("severity", event.target.value as CrisisReportFilters["severity"])} className={inputClass}><option value="all">Tất cả mức độ</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">SLA</span><select value={reportFilters.sla} onChange={(event) => updateFilter("sla", event.target.value as CrisisReportFilters["sla"])} className={inputClass}><option value="all">Tất cả SLA</option><option value="in_sla">Trong/Đúng SLA</option><option value="overdue">Quá hạn</option><option value="late">Trễ SLA</option><option value="closed">Đã đóng</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Escalation</span><select value={reportFilters.escalation} onChange={(event) => updateFilter("escalation", event.target.value as CrisisReportFilters["escalation"])} className={inputClass}><option value="all">Tất cả</option><option value="yes">Đã escalation</option><option value="no">Chưa escalation</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Nguồn</span><select value={reportFilters.source} onChange={(event) => updateFilter("source", event.target.value)} className={inputClass}>{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Chủ đề</span><select value={reportFilters.topic} onChange={(event) => updateFilter("topic", event.target.value)} className={inputClass}><option value="all">Tất cả chủ đề</option>{TOPIC_OPTIONS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label>
            <label className="space-y-1 md:col-span-2"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ khóa</span><input value={reportFilters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="ID, chủ đề, nội dung..." className={inputClass} /></label>
            {reportFilters.timeRange === "custom" ? <><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ ngày</span><input type="date" value={reportFilters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className={inputClass} /></label><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Đến ngày</span><input type="date" value={reportFilters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className={inputClass} /></label></> : null}
          </div>
        </section>
      ) : null}

      {isLoading && report.personalKpis.createdInPeriod === 0 ? <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Đang tải dữ liệu báo cáo khủng hoảng...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Một phần dữ liệu chưa tải được: {error}</div> : null}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-red-600">Cần xử lý ngay</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Case cần ưu tiên</h2></div><span className="text-xs text-[var(--color-text-muted)]">Snapshot hiện tại</span></div>
        {attentionItems.length > 0 ? <div className="grid gap-3 lg:grid-cols-3">{attentionItems.map((item) => <AttentionCard key={item.key} item={item} />)}</div> : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">Không có rủi ro nổi bật trong các case đang thuộc trách nhiệm của bạn.</div>}
      </section>

      <section>
        <div className="mb-3"><p className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">Kết quả của tôi</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Hiệu suất trong kỳ</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">{periodLabel}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Đã giải quyết" value={report.personalKpis.resolvedInPeriod} description="Case do bạn giải quyết trong kỳ đã chọn." tone="good" />
          <KpiCard label="Đúng SLA" value={report.personalKpis.resolvedInPeriod > 0 ? `${report.personalKpis.slaOnTimeRate}%` : "—"} description="Tính trên case đã giải quyết và có đủ dữ liệu SLA." />
          <KpiCard label="Phản hồi trung bình" value={formatCrisisMinutes(report.personalKpis.avgFirstResponseMinutes)} description="Thời gian từ khi phát sinh đến phản hồi đầu tiên." />
          <KpiCard label="Case còn mở" value={report.personalKpis.openCurrent} description={`${report.personalKpis.criticalHighOpen} case Critical/High còn mở.`} tone={report.personalKpis.openCurrent > 0 ? "warn" : "good"} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">Xu hướng xử lý</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">7 ngày gần nhất</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Phát sinh, đã giải quyết và quá hạn trong các case của bạn.</p><div className="mt-5"><TrendChart rows={report.activityTrend} /></div></div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5"><p className="text-xs font-black uppercase tracking-wide text-red-700">Nhận định và đề xuất</p><h2 className="mt-1 text-xl font-black text-slate-900">Hành động cải thiện</h2><div className="mt-4 space-y-3">{report.recommendations.map((item, index) => <div key={item} className="rounded-xl border border-red-100 bg-white p-4"><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-700">{index + 1}</span><p className="text-sm font-semibold leading-6 text-slate-700">{item}</p></div></div>)}</div></div>
      </section>

      <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="font-black text-[var(--color-text-primary)]">Phân tích chi tiết</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Mở khi cần đối soát case ưu tiên, mức độ và nguồn phát sinh.</p></div><span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span></summary>
        <div className="border-t border-[var(--color-border)]">
          <div>{report.priorityRows.length > 0 ? report.priorityRows.slice(0, 10).map((row) => <PriorityRow key={row.id} row={row} />) : <p className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Không có case ưu tiên hiện tại.</p>}</div>
          <div className="grid gap-4 border-t border-[var(--color-border)] p-4 lg:grid-cols-3"><DistributionSummary title="Mức độ" rows={report.severityDistribution} /><DistributionSummary title="Nguồn phát sinh" rows={report.sourceDistribution} /><DistributionSummary title="Trạng thái" rows={report.statusDistribution} /></div>
          <div className="border-t border-[var(--color-border)] p-4"><Link href="/alerts" className="inline-flex rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-brand)]">Mở trung tâm Cảnh báo</Link></div>
        </div>
      </details>
    </main>
  );
}
