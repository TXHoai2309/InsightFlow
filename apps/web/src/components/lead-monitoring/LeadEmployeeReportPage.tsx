"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { normalizeBrandName } from "@/lib/services/dashboard";
import {
  buildLeadEmployeeReportExcelDocument,
  exportLeadEmployeeReportExcel,
  type LeadEmployeeExcelViewOptions,
} from "@/lib/excelExport";
import { formatMinutes, type LeadReportBucket } from "@/lib/lead-report";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import type {
  LeadAttentionItem,
  LeadPriorityRow,
} from "@/lib/lead-employee-report";
import { ExcelDocumentPreviewModal } from "@/components/reports/ExcelDocumentPreviewModal";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useLeadEmployeeReport } from "./useLeadMonitoringReport";

const DEFAULT_EMPLOYEE_FILTERS: LeadReportFilters = {
  ...DEFAULT_LEAD_REPORT_FILTERS,
  timeRange: "7d",
  owner: "mine",
};

const SOURCE_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google_maps", label: "Google Maps" },
  { value: "be", label: "Be / BeFood" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "news", label: "Báo điện tử" },
];

const inputClass =
  "h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-indigo-500/20";

function getPeriodLabel(filters: LeadReportFilters) {
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
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-[var(--color-brand)]";
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-black leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
    </article>
  );
}

function AttentionCard({ item }: { item: LeadAttentionItem }) {
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

function TrendChart({ rows }: { rows: Array<{ day: string; created: number; contacted: number; converted: number }> }) {
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.created, row.contacted, row.converted]));
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Phát sinh</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Đã liên hệ</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Chuyển đổi</span>
      </div>
      <div className="grid min-h-44 grid-cols-7 items-end gap-2">
        {rows.map((row) => (
          <div key={row.day} className="flex h-full min-w-0 flex-col justify-end gap-1">
            <div className="flex h-32 items-end justify-center gap-1">
              {([
                [row.created, "bg-slate-400", "Phát sinh"],
                [row.contacted, "bg-indigo-500", "Đã liên hệ"],
                [row.converted, "bg-emerald-500", "Chuyển đổi"],
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

function PriorityRow({ row }: { row: LeadPriorityRow }) {
  const urgencyClass =
    row.urgencyLevel === "urgent"
      ? "bg-red-50 text-red-700"
      : row.urgencyLevel === "attention"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";
  return (
    <Link href={`/leads?leadId=${encodeURIComponent(row.id)}`} className="block border-t border-[var(--color-border)] px-4 py-3 first:border-t-0 hover:bg-[var(--color-bg-surface-high)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-700">{row.intent}</span>
            <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{row.customer}</p>
            <span className="text-xs text-[var(--color-text-muted)]">{row.platform}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">{row.content}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-muted)]">
            {row.urgencyReasons.length > 0 ? row.urgencyReasons.join(" · ") : "Theo dõi theo hạn SLA"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${urgencyClass}`}>
            {row.urgencyLevel === "urgent" ? "Khẩn cấp" : row.urgencyLevel === "attention" ? "Cần chú ý" : "Theo dõi"}
          </span>
          <span className="text-xs font-bold text-[var(--color-brand)]">{row.nextActionLabel}</span>
        </div>
      </div>
    </Link>
  );
}

function DistributionSummary({ title, rows }: { title: string; rows: LeadReportBucket[] }) {
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

export function LeadEmployeeReportPage() {
  const { profile } = useAuth();
  const { filters, workspaces, isLoading, error, setFilters } = useDashboardStore();
  const [reportFilters, setReportFilters] = useState<LeadReportFilters>(DEFAULT_EMPLOYEE_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const report = useLeadEmployeeReport(reportFilters);

  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0 || filters.workspace_id !== "all") return;
    const profileBrandKey = normalizeBrandName(profile.brandName || profile.brandId || "");
    const scopedWorkspace = workspaces.find(
      (workspace) => normalizeBrandName(workspace.id) === profileBrandKey || normalizeBrandName(workspace.brand_name) === profileBrandKey,
    );
    setFilters({ workspace_id: scopedWorkspace?.id || profile.brandId || profile.brandName || "all" });
  }, [filters.workspace_id, profile, setFilters, workspaces]);

  const updateFilter = <K extends keyof LeadReportFilters>(key: K, value: LeadReportFilters[K]) => {
    setReportFilters((current) => ({ ...current, [key]: value, owner: "mine" }));
  };
  const activeFilterCount = [
    reportFilters.status !== "all",
    reportFilters.intent !== "all",
    reportFilters.sla !== "all",
    reportFilters.source !== "all",
    Boolean(reportFilters.keyword.trim()),
  ].filter(Boolean).length;
  const periodLabel = getPeriodLabel(reportFilters);
  const excelOptions: LeadEmployeeExcelViewOptions = {
    periodLabel,
    filterLabel: activeFilterCount > 0
      ? `Lead của tôi · ${activeFilterCount} điều kiện bổ sung`
      : "Lead thuộc trách nhiệm của nhân viên",
  };
  const previewDocument = buildLeadEmployeeReportExcelDocument(report, excelOptions);
  const attentionItems = report.attentionItems.filter((item) => item.key !== "claimable").slice(0, 3);

  return (
    <main className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6 lg:p-8">
      {showExcelPreview ? (
        <ExcelDocumentPreviewModal
          title="Báo cáo xử lý khách hàng tiềm năng"
          html={previewDocument}
          onClose={() => setShowExcelPreview(false)}
          onExport={() => {
            exportLeadEmployeeReportExcel(report, `Bao_cao_nhan_vien_lead_${new Date().toISOString().slice(0, 10)}`, excelOptions);
            setShowExcelPreview(false);
          }}
        />
      ) : null}

      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-brand)]">Báo cáo công việc cá nhân</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">Xử lý khách hàng tiềm năng</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Tập trung vào việc cần làm, kết quả trong kỳ và dữ liệu có thể đối soát.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-auto xl:flex-nowrap xl:justify-end">
            <select value={reportFilters.timeRange} onChange={(event) => updateFilter("timeRange", event.target.value as LeadReportFilters["timeRange"])} className={`${inputClass} sm:w-[170px] sm:shrink-0`} aria-label="Kỳ báo cáo">
              <option value="today">Hôm nay</option><option value="7d">7 ngày gần nhất</option><option value="30d">30 ngày gần nhất</option><option value="custom">Tùy chọn</option><option value="all">Toàn bộ dữ liệu</option>
            </select>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((value) => !value)}
              aria-expanded={showAdvancedFilters}
              aria-controls="lead-report-advanced-filters"
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold transition-colors hover:bg-[var(--color-bg-surface-high)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 sm:w-auto sm:min-w-[116px]"
            >
              <span className="material-symbols-outlined shrink-0 text-[19px]" aria-hidden="true">filter_list</span>
              <span>Bộ lọc</span>
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-[11px] font-black text-indigo-700">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setShowExcelPreview(true)}
              aria-label="Xem trước báo cáo và xuất file Excel"
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-brand)] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--color-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[210px]"
            >
              <span className="material-symbols-outlined shrink-0 text-[19px]" aria-hidden="true">preview</span>
              <span>Xem trước &amp; xuất Excel</span>
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800 sm:flex-row sm:items-center sm:justify-between">
          <p><strong>Phạm vi cá nhân:</strong> KPI chỉ tính lead do {profile?.displayName || "bạn"} phụ trách; lead chưa phân công không được cộng vào hiệu suất.</p>
          <Link href="/leads?reportFilter=unassigned" className="shrink-0 font-black">{report.personalKpis.claimable} lead có thể nhận xử lý →</Link>
        </div>
      </header>

      {showAdvancedFilters ? (
        <section id="lead-report-advanced-filters" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái</span><select value={reportFilters.status} onChange={(event) => updateFilter("status", event.target.value as LeadReportFilters["status"])} className={inputClass}><option value="all">Tất cả</option><option value="new">Mới</option><option value="processing">Đang xử lý</option><option value="completed">Đã chuyển đổi</option><option value="skipped">Đã bỏ qua</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Mức độ tiềm năng</span><select value={reportFilters.intent} onChange={(event) => updateFilter("intent", event.target.value as LeadReportFilters["intent"])} className={inputClass}><option value="all">Tất cả</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option><option value="none">Chưa xác định</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">SLA</span><select value={reportFilters.sla} onChange={(event) => updateFilter("sla", event.target.value as LeadReportFilters["sla"])} className={inputClass}><option value="all">Tất cả</option><option value="in_sla">Trong SLA</option><option value="overdue">Quá hạn</option><option value="late">Trễ SLA</option><option value="closed">Đã đóng</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Nguồn</span><select value={reportFilters.source} onChange={(event) => updateFilter("source", event.target.value)} className={inputClass}>{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ khóa</span><input value={reportFilters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="Khách hàng, nội dung..." className={inputClass} /></label>
            {reportFilters.timeRange === "custom" ? <><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ ngày</span><input type="date" value={reportFilters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className={inputClass} /></label><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Đến ngày</span><input type="date" value={reportFilters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className={inputClass} /></label></> : null}
          </div>
        </section>
      ) : null}

      {isLoading && report.personalKpis.openCurrent === 0 ? <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Đang tải dữ liệu báo cáo lead...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Một phần dữ liệu chưa tải được: {error}</div> : null}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-amber-700">Cần xử lý ngay</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Lead cần ưu tiên</h2></div><span className="text-xs text-[var(--color-text-muted)]">Snapshot hiện tại</span></div>
        {attentionItems.length > 0 ? <div className="grid gap-3 lg:grid-cols-3">{attentionItems.map((item) => <AttentionCard key={item.key} item={item} />)}</div> : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">Không có tồn đọng nổi bật trong các lead đang thuộc trách nhiệm của bạn.</div>}
      </section>

      <section>
        <div className="mb-3"><p className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">Kết quả của tôi</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Hiệu suất trong kỳ</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">{periodLabel}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Đã liên hệ" value={report.personalKpis.contactedInPeriod} description={`Phản hồi đầu tiên trung bình ${formatMinutes(report.personalKpis.avgFirstResponseMinutes)}.`} />
          <KpiCard label="Đã chuyển đổi" value={report.personalKpis.convertedInPeriod} description={`${report.personalKpis.conversionRate}% trên ${report.personalKpis.resultRecordedInPeriod} kết quả được ghi nhận trong kỳ.`} tone="good" />
          <KpiCard label="Đúng SLA" value={report.personalKpis.contactedInPeriod > 0 ? `${report.personalKpis.slaOnTimeRate}%` : "—"} description="Tính theo thời điểm liên hệ đầu tiên phát sinh trong kỳ." />
          <KpiCard label="Lead còn mở" value={report.personalKpis.openCurrent} description={`${report.personalKpis.needResultCurrent} lead đang cần ghi nhận kết quả.`} tone={report.personalKpis.openCurrent > 0 ? "warn" : "good"} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">Xu hướng xử lý</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">7 ngày gần nhất</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Lead phát sinh, thời điểm liên hệ và kết quả chuyển đổi của riêng bạn.</p><div className="mt-5"><TrendChart rows={report.activityTrend} /></div></div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5"><p className="text-xs font-black uppercase tracking-wide text-indigo-700">Nhận định và đề xuất</p><h2 className="mt-1 text-xl font-black text-slate-900">Hành động cải thiện</h2><div className="mt-4 space-y-3">{report.recommendations.map((item, index) => <div key={item} className="rounded-xl border border-indigo-100 bg-white p-4"><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{index + 1}</span><p className="text-sm font-semibold leading-6 text-slate-700">{item}</p></div></div>)}</div></div>
      </section>

      <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="font-black text-[var(--color-text-primary)]">Phân tích chi tiết</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Mở khi cần đối soát lead ưu tiên, nguồn và trạng thái pipeline.</p></div><span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span></summary>
        <div className="border-t border-[var(--color-border)]">
          <div>{report.priorityRows.length > 0 ? report.priorityRows.slice(0, 10).map((row) => <PriorityRow key={row.id} row={row} />) : <p className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Không có lead ưu tiên hiện tại.</p>}</div>
          <div className="grid gap-4 border-t border-[var(--color-border)] p-4 lg:grid-cols-3"><DistributionSummary title="Mức độ tiềm năng" rows={report.intentDistribution} /><DistributionSummary title="Nguồn khách hàng" rows={report.sourceDistribution} /><DistributionSummary title="Pipeline" rows={report.pipeline} /></div>
          <div className="border-t border-[var(--color-border)] p-4"><Link href="/leads" className="inline-flex rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-brand)]">Mở trung tâm Khách hàng</Link></div>
        </div>
      </details>
    </main>
  );
}
