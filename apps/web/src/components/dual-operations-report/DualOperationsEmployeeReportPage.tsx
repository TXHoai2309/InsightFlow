"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { getScopedBrandKey } from "@/lib/brandScope";
import {
  buildDualOperationsReportExcelDocument,
  exportDualOperationsReportExcel,
  type DualOperationsExcelViewOptions,
} from "@/lib/excelExport";
import type {
  DualOperationsAttentionItem,
  DualOperationsPriorityRow,
} from "@/lib/dual-operations-report";
import {
  DEFAULT_CRISIS_REPORT_FILTERS,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { useAlertStore } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useDualOperationsReport } from "./useDualOperationsReport";
import { ExcelDocumentPreviewModal } from "@/components/reports/ExcelDocumentPreviewModal";

type OperationScope = "all" | "lead" | "crisis";
type OperationTab = "lead" | "crisis";

interface DualReportFilters {
  operation: OperationScope;
  timeRange: LeadReportFilters["timeRange"];
  startDate: string;
  endDate: string;
  sla: LeadReportFilters["sla"];
  priority: "all" | "high";
  source: string;
  leadStatus: LeadReportFilters["status"];
  crisisStatus: string;
  keyword: string;
}

const DEFAULT_DUAL_REPORT_FILTERS: DualReportFilters = {
  operation: "all",
  timeRange: "7d",
  startDate: "",
  endDate: "",
  sla: "all",
  priority: "all",
  source: "all",
  leadStatus: "all",
  crisisStatus: "all",
  keyword: "",
};

const SOURCE_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google_maps", label: "Google Maps" },
  { value: "be", label: "BeFood" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "news", label: "Báo điện tử" },
];

const inputClass =
  "h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20";

function getPeriodLabel(filters: DualReportFilters) {
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

function getScopeLabel(scope: OperationScope) {
  if (scope === "lead") return "Chỉ Khách hàng tiềm năng";
  if (scope === "crisis") return "Chỉ Khủng hoảng";
  return "Cả hai nghiệp vụ";
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
  const valueClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-red-700"
          : "text-[var(--color-brand)]";
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black leading-none ${valueClass}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
    </article>
  );
}

function AttentionCard({ item }: { item: DualOperationsAttentionItem }) {
  const toneClass =
    item.tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : item.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-indigo-200 bg-indigo-50 text-indigo-700";
  return (
    <Link
      href={item.href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{item.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
        </div>
        <strong className="text-3xl font-black">{item.count}</strong>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs font-bold">
        Mở danh sách xử lý
        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
          arrow_forward
        </span>
      </p>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-high)] p-4">
      <p className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function TrendBars({
  rows,
  primaryKey,
  secondaryKey,
  primaryLabel,
  secondaryLabel,
}: {
  rows: Array<Record<string, string | number>>;
  primaryKey: string;
  secondaryKey: string;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [Number(row[primaryKey] || 0), Number(row[secondaryKey] || 0)]),
  );
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" />{primaryLabel}</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{secondaryLabel}</span>
      </div>
      <div className="grid min-h-40 grid-cols-7 items-end gap-2">
        {rows.slice(-7).map((row, index) => (
          <div key={`${row.day}-${index}`} className="flex h-full min-w-0 flex-col justify-end gap-1">
            <div className="flex h-28 items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-indigo-500"
                style={{ height: `${Math.max(4, (Number(row[primaryKey] || 0) / maxValue) * 100)}%` }}
                title={`${primaryLabel}: ${row[primaryKey] || 0}`}
              />
              <div
                className="w-3 rounded-t bg-emerald-500"
                style={{ height: `${Math.max(4, (Number(row[secondaryKey] || 0) / maxValue) * 100)}%` }}
                title={`${secondaryLabel}: ${row[secondaryKey] || 0}`}
              />
            </div>
            <span className="truncate text-center text-[10px] text-[var(--color-text-muted)]">{row.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityRow({ row }: { row: DualOperationsPriorityRow }) {
  const urgencyClass =
    row.urgencyLevel === "urgent"
      ? "bg-red-50 text-red-700"
      : row.urgencyLevel === "attention"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";
  return (
    <Link
      href={row.href}
      className="block border-t border-[var(--color-border)] px-4 py-3 first:border-t-0 hover:bg-[var(--color-bg-surface-high)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-brand-subtle)] px-2 py-1 text-[10px] font-black uppercase text-[var(--color-brand)]">
              {row.typeLabel}
            </span>
            <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{row.title}</p>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">{row.content}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-muted)]">
            {row.urgencyReasons.length > 0 ? row.urgencyReasons.join(" · ") : "Theo dõi theo thứ tự SLA"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${urgencyClass}`}>
          {row.urgencyLevel === "urgent" ? "Khẩn cấp" : row.urgencyLevel === "attention" ? "Cần chú ý" : "Theo dõi"}
        </span>
      </div>
    </Link>
  );
}

export function DualOperationsEmployeeReportPage() {
  const { profile } = useAuth();
  const [reportFilters, setReportFilters] = useState<DualReportFilters>(DEFAULT_DUAL_REPORT_FILTERS);
  const [activeOperation, setActiveOperation] = useState<OperationTab>("lead");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);

  const leadFilters = useMemo<LeadReportFilters>(() => ({
    ...DEFAULT_LEAD_REPORT_FILTERS,
    timeRange: reportFilters.timeRange,
    startDate: reportFilters.startDate,
    endDate: reportFilters.endDate,
    sla: reportFilters.sla,
    source: reportFilters.source,
    keyword: reportFilters.keyword,
    status: reportFilters.leadStatus,
    intent: reportFilters.priority === "high" ? "hot" : "all",
    owner: "mine",
  }), [reportFilters]);

  const crisisFilters = useMemo<CrisisReportFilters>(() => ({
    ...DEFAULT_CRISIS_REPORT_FILTERS,
    timeRange: reportFilters.timeRange,
    startDate: reportFilters.startDate,
    endDate: reportFilters.endDate,
    sla: reportFilters.sla,
    source: reportFilters.source,
    keyword: reportFilters.keyword,
    status: reportFilters.crisisStatus,
    severity: reportFilters.priority === "high" ? "high_critical" : "all",
  }), [reportFilters]);

  const report = useDualOperationsReport({
    leadFilters,
    crisisFilters,
    includeLead: reportFilters.operation !== "crisis",
    includeCrisis: reportFilters.operation !== "lead",
  });
  const { filters, workspaces, isLoading: dashboardLoading, error: dashboardError, setFilters } = useDashboardStore();
  const { isLoading: alertLoading, error: alertError, fetchAlerts, fetchCorrectionRequests } = useAlertStore();

  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  useEffect(() => {
    if (!profile || profile.role === "admin" || workspaces.length === 0) return;
    if (filters.workspace_id !== "all") return;
    const profileBrandKey = normalizeBrandName(profile.brandName || profile.brandId || "");
    const scopedWorkspace = workspaces.find(
      (workspace) =>
        normalizeBrandName(workspace.id) === profileBrandKey ||
        normalizeBrandName(workspace.brand_name) === profileBrandKey,
    );
    setFilters({ workspace_id: scopedWorkspace?.id || profile.brandId || profile.brandName || "all" });
  }, [filters.workspace_id, profile, setFilters, workspaces]);

  useEffect(() => {
    const scopedBrandKey = getScopedBrandKey(profile);
    fetchAlerts(scopedBrandKey, false);
    fetchCorrectionRequests(scopedBrandKey, false);
  }, [fetchAlerts, fetchCorrectionRequests, profile]);

  useEffect(() => {
    if (reportFilters.operation === "lead") setActiveOperation("lead");
    if (reportFilters.operation === "crisis") setActiveOperation("crisis");
  }, [reportFilters.operation]);

  const updateFilter = <K extends keyof DualReportFilters>(key: K, value: DualReportFilters[K]) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

  const activeAdvancedFilterCount = [
    reportFilters.sla !== "all",
    reportFilters.priority !== "all",
    reportFilters.source !== "all",
    reportFilters.leadStatus !== "all",
    reportFilters.crisisStatus !== "all",
    Boolean(reportFilters.keyword.trim()),
  ].filter(Boolean).length;
  const periodLabel = getPeriodLabel(reportFilters);
  const scopeLabel = getScopeLabel(reportFilters.operation);
  const excelOptions: DualOperationsExcelViewOptions = {
    periodLabel,
    filterLabel: `${scopeLabel}${activeAdvancedFilterCount > 0 ? ` · ${activeAdvancedFilterCount} bộ lọc nâng cao` : ""}`,
    operation: reportFilters.operation,
  };
  const excelPreviewHtml = showExcelPreview
    ? buildDualOperationsReportExcelDocument(report, excelOptions)
    : "";
  const attentionItems = report.attentionItems.slice(0, 3);
  const visiblePriorityRows = report.priorityRows
    .filter((row) => reportFilters.operation === "all" || row.type === reportFilters.operation)
    .slice(0, 10);
  const loading = dashboardLoading || alertLoading;
  const error = dashboardError || alertError;

  return (
    <main data-tour="reports-center" className="space-y-6 p-4 md:p-8">
      {showExcelPreview ? (
        <ExcelDocumentPreviewModal
          title="Nội dung và hình thức sẽ được xuất nguyên bản"
          html={excelPreviewHtml}
          onClose={() => setShowExcelPreview(false)}
          onExport={() => exportDualOperationsReportExcel(report, `Bao_cao_ca_nhan_${new Date().toISOString().slice(0, 10)}`, excelOptions)}
        />
      ) : null}

      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--color-brand)]">Báo cáo công việc cá nhân</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--color-text-primary)]">Lead &amp; Khủng hoảng</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Tập trung vào kết quả, rủi ro cần chú ý và hành động cải thiện trong kỳ báo cáo.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <select
              aria-label="Kỳ báo cáo"
              value={reportFilters.timeRange}
              onChange={(event) => {
                const value = event.target.value as DualReportFilters["timeRange"];
                updateFilter("timeRange", value);
                if (value === "custom") setShowAdvancedFilters(true);
              }}
              className={`${inputClass} sm:w-48`}
            >
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày gần nhất</option>
              <option value="30d">30 ngày gần nhất</option>
              <option value="custom">Tùy chọn thời gian</option>
              <option value="all">Toàn bộ dữ liệu</option>
            </select>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((value) => !value)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)]"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Bộ lọc{activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setShowExcelPreview(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 text-sm font-bold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
            >
              <span className="material-symbols-outlined text-base">preview</span>
              Xem trước &amp; xuất Excel
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
          {(["all", "lead", "crisis"] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => updateFilter("operation", scope)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${reportFilters.operation === scope ? "bg-[var(--color-brand)] text-white" : "bg-[var(--color-bg-surface-high)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
            >
              {scope === "all" ? "Tổng quan" : scope === "lead" ? "Khách hàng tiềm năng" : "Khủng hoảng"}
            </button>
          ))}
          <span className="ml-auto self-center text-xs font-semibold text-[var(--color-text-muted)]">Cập nhật {new Date(report.generatedAt).toLocaleString("vi-VN")}</span>
        </div>
      </header>

      {showAdvancedFilters ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-[var(--color-text-primary)]">Bộ lọc nâng cao</h2>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Chỉ hiển thị bộ lọc trạng thái phù hợp với nghiệp vụ đang xem.</p>
            </div>
            <button type="button" onClick={() => setReportFilters(DEFAULT_DUAL_REPORT_FILTERS)} className="text-sm font-bold text-[var(--color-brand)]">Đặt lại</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">SLA</span><select value={reportFilters.sla} onChange={(event) => updateFilter("sla", event.target.value as DualReportFilters["sla"])} className={inputClass}><option value="all">Tất cả SLA</option><option value="in_sla">Trong/Đúng SLA</option><option value="overdue">Quá hạn</option><option value="late">Trễ SLA</option><option value="closed">Đã đóng</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Mức ưu tiên</span><select value={reportFilters.priority} onChange={(event) => updateFilter("priority", event.target.value as DualReportFilters["priority"])} className={inputClass}><option value="all">Tất cả mức độ</option><option value="high">Hot Lead / Crisis cao</option></select></label>
            <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Nguồn</span><select value={reportFilters.source} onChange={(event) => updateFilter("source", event.target.value)} className={inputClass}>{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            {activeOperation === "lead" ? (
              <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái Lead</span><select value={reportFilters.leadStatus} onChange={(event) => updateFilter("leadStatus", event.target.value as DualReportFilters["leadStatus"])} className={inputClass}><option value="all">Tất cả trạng thái</option><option value="new">Mới</option><option value="processing">Đang xử lý</option><option value="completed">Đã chuyển đổi</option><option value="skipped">Bỏ qua</option></select></label>
            ) : (
              <label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái Khủng hoảng</span><select value={reportFilters.crisisStatus} onChange={(event) => updateFilter("crisisStatus", event.target.value)} className={inputClass}><option value="all">Tất cả trạng thái</option><option value="new">Mới</option><option value="resolving">Đang xử lý</option><option value="monitoring">Đang theo dõi</option><option value="pending_approval">Chờ duyệt</option><option value="resolved">Đã xử lý</option></select></label>
            )}
            <label className="space-y-1 md:col-span-2"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ khóa</span><input value={reportFilters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="ID, khách hàng, nội dung..." className={inputClass} /></label>
            {reportFilters.timeRange === "custom" ? <><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Từ ngày</span><input type="date" value={reportFilters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className={inputClass} /></label><label className="space-y-1"><span className="text-xs font-bold text-[var(--color-text-muted)]">Đến ngày</span><input type="date" value={reportFilters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className={inputClass} /></label></> : null}
          </div>
        </section>
      ) : null}

      {loading && report.kpis.totalTasks === 0 ? <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Đang tải dữ liệu báo cáo...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Một phần dữ liệu chưa tải được: {error}</div> : null}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-wide text-red-600">Cần chú ý</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Việc nên xử lý trước</h2></div>
          <span className="text-xs text-[var(--color-text-muted)]">{periodLabel}</span>
        </div>
        {attentionItems.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">{attentionItems.map((item) => <AttentionCard key={item.key} item={item} />)}</div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">Không có rủi ro nổi bật trong phạm vi báo cáo hiện tại.</div>
        )}
      </section>

      <section>
        <div className="mb-3"><p className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">Kết quả trong kỳ</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Tình trạng công việc</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Đã hoàn tất" value={report.kpis.completedTasks} description="Lead đã kết thúc và case đã giải quyết." tone="good" />
          <KpiCard label="Đúng SLA" value={`${report.kpis.slaOnTimeRate}%`} description="Tỷ lệ chung trên các việc có thể đánh giá SLA." />
          <KpiCard label="Còn mở" value={report.kpis.pendingTasks} description="Công việc vẫn cần tiếp tục xử lý." tone="warn" />
          <KpiCard label="Quá hạn" value={report.kpis.overdueTasks} description="Việc quá hạn hoặc đã hoàn tất trễ SLA." tone={report.kpis.overdueTasks > 0 ? "danger" : "good"} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-wide text-[var(--color-brand)]">Theo nghiệp vụ</p><h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Kết quả và xu hướng</h2></div>
          <div className="flex rounded-xl bg-[var(--color-bg-surface-high)] p-1">
            {(["lead", "crisis"] as const).map((tab) => (
              <button key={tab} type="button" disabled={reportFilters.operation !== "all" && reportFilters.operation !== tab} onClick={() => setActiveOperation(tab)} className={`rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${activeOperation === tab ? "bg-[var(--color-bg-surface)] text-[var(--color-brand)] shadow-sm" : "text-[var(--color-text-secondary)]"}`}>{tab === "lead" ? "Khách hàng tiềm năng" : "Khủng hoảng"}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid grid-cols-2 gap-3">
            {activeOperation === "lead" ? <><Metric label="Đã liên hệ" value={`${report.lead.kpis.contacted}/${report.lead.kpis.total}`} /><Metric label="Tỷ lệ chuyển đổi" value={`${report.lead.kpis.conversionRate}%`} /><Metric label="Chưa ghi kết quả" value={report.lead.kpis.needResult} /><Metric label="Trễ SLA" value={report.lead.kpis.slaBreached} /></> : <><Metric label="Đã giải quyết" value={`${report.crisis.kpis.resolved}/${report.crisis.kpis.total}`} /><Metric label="Critical/High" value={report.crisis.kpis.critical + report.crisis.kpis.high} /><Metric label="Chờ duyệt" value={report.crisis.kpis.pendingApproval} /><Metric label="Quá hạn" value={report.crisis.kpis.overdue} /></>}
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <h3 className="mb-1 text-sm font-black text-[var(--color-text-primary)]">Xu hướng 7 ngày</h3>
            <p className="mb-4 text-xs text-[var(--color-text-secondary)]">Theo dõi khối lượng phát sinh và kết quả xử lý.</p>
            {activeOperation === "lead" ? <TrendBars rows={report.lead.responseTrend as unknown as Array<Record<string, string | number>>} primaryKey="created" secondaryKey="contacted" primaryLabel="Lead mới" secondaryLabel="Đã liên hệ" /> : <TrendBars rows={report.crisis.responseTrend as unknown as Array<Record<string, string | number>>} primaryKey="created" secondaryKey="resolved" primaryLabel="Case mới" secondaryLabel="Đã giải quyết" />}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-indigo-700">Nhận định và đề xuất</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">Hành động cải thiện</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {report.recommendations.map((recommendation, index) => <div key={recommendation} className="rounded-xl border border-indigo-100 bg-white p-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{index + 1}</span><p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{recommendation}</p></div>)}
        </div>
      </section>

      <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
          <div><p className="font-black text-[var(--color-text-primary)]">Phân tích chi tiết</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Mở khi cần xem các việc ưu tiên và đối soát dữ liệu.</p></div>
          <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
        </summary>
        <div className="border-t border-[var(--color-border)]">
          {visiblePriorityRows.length > 0 ? visiblePriorityRows.map((row) => <PriorityRow key={`${row.type}-${row.id}`} row={row} />) : <p className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Không có công việc ưu tiên trong phạm vi hiện tại.</p>}
          <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] p-4">
            {reportFilters.operation !== "crisis" ? <Link href="/leads" className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-brand)]">Mở trang Khách hàng</Link> : null}
            {reportFilters.operation !== "lead" ? <Link href="/alerts" className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-brand)]">Mở trang Cảnh báo</Link> : null}
          </div>
        </div>
      </details>
    </main>
  );
}
