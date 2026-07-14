"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { getScopedBrandKey } from "@/lib/brandScope";
import { exportDualOperationsReportCsv, exportDualOperationsReportExcel } from "@/lib/excelExport";
import type { DualOperationsBucket } from "@/lib/dual-operations-report";
import { formatCrisisMinutes } from "@/lib/crisis-report";
import { DEFAULT_CRISIS_REPORT_FILTERS, type CrisisReportFilters } from "@/lib/crisis-report-filters";
import { formatMinutes } from "@/lib/lead-report";
import { DEFAULT_LEAD_REPORT_FILTERS, type LeadReportFilters } from "@/lib/lead-report-filters";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { ReportExportPreviewModal } from "@/components/reports/ReportExportPreviewModal";
import { getAlertReviewSinceIso, useAlertStore } from "@/stores/alert.store";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useDualOperationsReport } from "./useDualOperationsReport";

function formatPercent(value: number) {
  return `${value}%`;
}

function reportFilename() {
  return `Bao_cao_nhan_vien_2_nghiep_vu_${new Date().toISOString().slice(0, 10)}`;
}

type DualOperationFilter = "all" | "lead" | "crisis";

interface DualReportFilters {
  operation: DualOperationFilter;
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
  timeRange: "all",
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
  { value: "all", label: "Tat ca nguon" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google_maps", label: "Google Maps" },
  { value: "be", label: "BeFood" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "news", label: "Bao dien tu" },
];

function KpiCard({
  title,
  value,
  sub,
  tone = "default",
}: {
  title: string;
  value: React.ReactNode;
  sub: string;
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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {title}
      </p>
      <p className={`mt-2 text-3xl font-black leading-none ${color}`}>{value}</p>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{sub}</p>
    </div>
  );
}

function ReportPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-[var(--color-text-primary)]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DistributionList({ items }: { items: DualOperationsBucket[] }) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-[var(--color-text-primary)]">{item.label}</span>
            <span className="text-[var(--color-text-secondary)]">
              {item.count} viec · {item.percentage}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-surface-high)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(3, (item.count / maxCount) * 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-black uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20";

function countActiveDualReportFilters(filters: DualReportFilters) {
  return [
    filters.operation !== "all",
    filters.timeRange !== "all",
    filters.sla !== "all",
    filters.priority !== "all",
    filters.source !== "all",
    filters.leadStatus !== "all",
    filters.crisisStatus !== "all",
    Boolean(filters.keyword.trim()),
  ].filter(Boolean).length;
}

export function DualOperationsEmployeeReportPage() {
  const { profile } = useAuth();
  const [reportFilters, setReportFilters] = useState<DualReportFilters>(DEFAULT_DUAL_REPORT_FILTERS);
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
  const [pendingExport, setPendingExport] = useState<"excel" | "csv" | null>(null);
  const activeFilterCount = countActiveDualReportFilters(reportFilters);
  const { filters, workspaces, isLoading: dashboardLoading, error: dashboardError, setFilters } = useDashboardStore();
  const {
    isLoading: alertLoading,
    error: alertError,
    fetchAlerts,
    fetchCorrectionRequests,
  } = useAlertStore();

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

    setFilters({
      workspace_id: scopedWorkspace?.id || profile.brandId || profile.brandName || "all",
    });
  }, [
    filters.workspace_id,
    profile,
    profile?.brandId,
    profile?.brandName,
    setFilters,
    workspaces,
  ]);

  useEffect(() => {
    const scopedBrandKey = getScopedBrandKey(profile);
    fetchAlerts(scopedBrandKey, false);
    fetchCorrectionRequests(scopedBrandKey, false);
  }, [fetchAlerts, fetchCorrectionRequests, profile]);

  const updateReportFilter = <K extends keyof DualReportFilters>(
    key: K,
    value: DualReportFilters[K],
  ) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

  const exportFile = () => {
    if (pendingExport === "excel") exportDualOperationsReportExcel(report, reportFilename());
    if (pendingExport === "csv") exportDualOperationsReportCsv(report, reportFilename());
    setPendingExport(null);
  };

  return (
    <div data-tour="reports-center" className="space-y-6 p-4 md:p-8">
      {pendingExport ? (
        <ReportExportPreviewModal
          title="Bao cao Lead + Khung hoang"
          subtitle="Preview truoc khi xuat file cho nhan vien xu ly ca 2 nghiep vu."
          generatedAt={report.generatedAt}
          formatLabel={pendingExport.toUpperCase()}
          stats={[
            { label: "Tong viec", value: report.kpis.totalTasks },
            { label: "Da hoan tat", value: report.kpis.completedTasks, tone: "good" },
            { label: "Qua han/SLA", value: report.kpis.overdueTasks, tone: report.kpis.overdueTasks > 0 ? "warn" : "good" },
            { label: "Uu tien cao", value: report.kpis.priorityTasks, tone: report.kpis.priorityTasks > 0 ? "danger" : "default" },
          ]}
          summary={report.aiSummary}
          sections={[
            {
              title: "Pham vi file",
              rows: [
                { label: "Chi tiet Lead", value: `${report.lead.detailRows.length} dong` },
                { label: "Chi tiet Khung hoang", value: `${report.crisis.detailRows.length} dong` },
                { label: "Viec uu tien chung", value: report.priorityRows.length },
              ],
            },
            {
              title: "Ty le chinh",
              rows: [
                { label: "Chuyen doi lead", value: formatPercent(report.kpis.leadConversionRate) },
                { label: "Xu ly crisis", value: formatPercent(report.kpis.crisisResolvedRate) },
                { label: "Dung SLA tong hop", value: formatPercent(report.kpis.slaOnTimeRate) },
              ],
            },
          ]}
          sampleRows={report.priorityRows.slice(0, 6).map((row) => ({
            label: row.title,
            meta: `${row.typeLabel} · ${row.status} · ${row.slaStatus}`,
            badge: row.priority,
            description: row.content,
          }))}
          onClose={() => setPendingExport(null)}
          onConfirm={exportFile}
        />
      ) : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--color-brand)]">
            Bao cao nhan vien 2 nghiep vu
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--color-text-primary)] md:text-4xl">
            Bao cao Lead + Khung hoang
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Tong hop khoi luong lead va case khung hoang trong pham vi xu ly cua nhan vien, giup uu tien viec can lam truoc va xuat Excel theo tung nghiep vu.
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
            Du lieu khung hoang: {Math.round((Date.now() - new Date(getAlertReviewSinceIso()).getTime()) / (24 * 60 * 60 * 1000))} ngay gan nhat.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPendingExport("excel")}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
          >
            <span className="material-symbols-outlined text-base">table_view</span>
            Xuat Excel
          </button>
          <button
            type="button"
            onClick={() => setPendingExport("csv")}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)]"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Xuat CSV
          </button>
        </div>
      </header>

      {(dashboardLoading || alertLoading) && report.kpis.totalTasks === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
          Dang tai du lieu bao cao 2 nghiep vu...
        </div>
      ) : null}

      {dashboardError || alertError ? (
        <div className="rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error-subtle)] p-4 text-sm font-semibold text-[var(--color-error)]">
          {dashboardError || alertError}
        </div>
      ) : null}

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[var(--color-text-primary)]">Bo loc bao cao</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Ap dung dong thoi cho KPI tong hop, viec uu tien, preview va file xuat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportFilters(DEFAULT_DUAL_REPORT_FILTERS)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)]"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Dat lai{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Nghiep vu">
            <select
              value={reportFilters.operation}
              onChange={(event) => updateReportFilter("operation", event.target.value as DualReportFilters["operation"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="lead">Chi Lead</option>
              <option value="crisis">Chi Khung hoang</option>
            </select>
          </FilterField>
          <FilterField label="Thoi gian">
            <select
              value={reportFilters.timeRange}
              onChange={(event) => updateReportFilter("timeRange", event.target.value as DualReportFilters["timeRange"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="today">Hom nay</option>
              <option value="7d">7 ngay</option>
              <option value="30d">30 ngay</option>
              <option value="custom">Tuy chon</option>
            </select>
          </FilterField>
          <FilterField label="SLA">
            <select
              value={reportFilters.sla}
              onChange={(event) => updateReportFilter("sla", event.target.value as DualReportFilters["sla"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="in_sla">Trong/Dung SLA</option>
              <option value="overdue">Qua han</option>
              <option value="late">Tre SLA</option>
              <option value="closed">Da dong</option>
            </select>
          </FilterField>
          <FilterField label="Uu tien">
            <select
              value={reportFilters.priority}
              onChange={(event) => updateReportFilter("priority", event.target.value as DualReportFilters["priority"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="high">Hot lead / Crisis cao</option>
            </select>
          </FilterField>
          <FilterField label="Nguon">
            <select
              value={reportFilters.source}
              onChange={(event) => updateReportFilter("source", event.target.value)}
              className={inputClass}
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Trang thai Lead">
            <select
              value={reportFilters.leadStatus}
              onChange={(event) => updateReportFilter("leadStatus", event.target.value as DualReportFilters["leadStatus"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="new">Moi</option>
              <option value="processing">Dang xu ly</option>
              <option value="completed">Da chuyen doi</option>
              <option value="skipped">Bo qua</option>
            </select>
          </FilterField>
          <FilterField label="Trang thai Crisis">
            <select
              value={reportFilters.crisisStatus}
              onChange={(event) => updateReportFilter("crisisStatus", event.target.value)}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="new">Moi</option>
              <option value="resolving">Dang xu ly</option>
              <option value="monitoring">Dang theo doi</option>
              <option value="pending_approval">Cho duyet</option>
              <option value="resolved">Da xu ly</option>
            </select>
          </FilterField>
          <FilterField label="Tu khoa">
            <input
              value={reportFilters.keyword}
              onChange={(event) => updateReportFilter("keyword", event.target.value)}
              placeholder="ID, noi dung, topic..."
              className={inputClass}
            />
          </FilterField>
        </div>

        {reportFilters.timeRange === "custom" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <FilterField label="Tu ngay">
              <input
                type="date"
                value={reportFilters.startDate}
                onChange={(event) => updateReportFilter("startDate", event.target.value)}
                className={inputClass}
              />
            </FilterField>
            <FilterField label="Den ngay">
              <input
                type="date"
                value={reportFilters.endDate}
                onChange={(event) => updateReportFilter("endDate", event.target.value)}
                className={inputClass}
              />
            </FilterField>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tong viec"
          value={report.kpis.totalTasks}
          sub={`${report.kpis.leadTotal} lead · ${report.kpis.crisisTotal} case`}
        />
        <KpiCard
          title="Da hoan tat"
          value={report.kpis.completedTasks}
          sub={`${report.kpis.pendingTasks} viec con mo`}
          tone="good"
        />
        <KpiCard
          title="Qua han/SLA"
          value={report.kpis.overdueTasks}
          sub={`Dung SLA ${formatPercent(report.kpis.slaOnTimeRate)}`}
          tone={report.kpis.overdueTasks > 0 ? "warn" : "good"}
        />
        <KpiCard
          title="Uu tien cao"
          value={report.kpis.priorityTasks}
          sub={`${report.lead.kpis.hot} hot lead · ${report.crisis.kpis.critical + report.crisis.kpis.high} crisis cao`}
          tone={report.kpis.priorityTasks > 0 ? "danger" : "default"}
        />
      </section>

      <ReportPanel title="Tom tat van hanh" subtitle={`Cap nhat luc ${new Date(report.generatedAt).toLocaleString("vi-VN")}`}>
        <p className="text-base leading-7 text-[var(--color-text-primary)]">{report.aiSummary}</p>
      </ReportPanel>

      <section className="grid gap-4 xl:grid-cols-3">
        <ReportPanel title="Phan bo khoi luong" subtitle="Ty trong viec Lead va Khung hoang trong cung mot hang doi.">
          <DistributionList items={report.workloadDistribution} />
        </ReportPanel>

        <ReportPanel title="Tong quan Lead" subtitle="Chi so chinh cua nghiep vu khach hang tiem nang.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Tong lead" value={report.lead.kpis.total} />
            <Metric label="Hot/Warm" value={`${report.lead.kpis.hot}/${report.lead.kpis.warm}`} />
            <Metric label="Da lien he" value={formatPercent(report.lead.kpis.contactRate)} />
            <Metric label="Chuyen doi" value={formatPercent(report.lead.kpis.conversionRate)} />
            <Metric label="Can ghi ket qua" value={report.lead.kpis.needResult} />
            <Metric label="Tre SLA" value={report.lead.kpis.slaBreached} />
          </div>
        </ReportPanel>

        <ReportPanel title="Tong quan Khung hoang" subtitle="Chi so chinh cua nghiep vu xu ly canh bao.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Tong case" value={report.crisis.kpis.total} />
            <Metric label="Cao/Nguy cap" value={report.crisis.kpis.high + report.crisis.kpis.critical} />
            <Metric label="Da xu ly" value={formatPercent(report.crisis.kpis.resolvedRate)} />
            <Metric label="Dang xu ly" value={report.crisis.kpis.resolving} />
            <Metric label="Escalation" value={report.crisis.kpis.escalated} />
            <Metric label="Qua han" value={report.crisis.kpis.overdue} />
          </div>
        </ReportPanel>
      </section>

      <ReportPanel title={`Viec uu tien chung (${report.priorityRows.length})`} subtitle="Sap xep ket hop theo diem uu tien, SLA, muc do khung hoang va intent lead.">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-3">Loai</th>
                <th className="px-3 py-3">Ma</th>
                <th className="px-3 py-3">Noi dung</th>
                <th className="px-3 py-3">Muc uu tien</th>
                <th className="px-3 py-3">Trang thai</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3">Phu trach</th>
              </tr>
            </thead>
            <tbody>
              {report.priorityRows.slice(0, 60).map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-t border-[var(--color-border)] align-top">
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.type === "crisis" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
                      {row.typeLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={row.href} className="font-bold text-[var(--color-brand)] hover:underline">
                      {row.id.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[var(--color-text-primary)]">{row.title}</p>
                    <p className="line-clamp-2 max-w-[420px] text-xs text-[var(--color-text-secondary)]">{row.content}</p>
                  </td>
                  <td className="px-3 py-3 font-bold">{row.priority}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">{row.slaStatus}</td>
                  <td className="px-3 py-3">{row.ownerName}</td>
                </tr>
              ))}
              {report.priorityRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[var(--color-text-secondary)]">
                    Chua co viec uu tien trong pham vi bao cao hien tai.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </ReportPanel>

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportPanel title={`Chi tiet Lead (${report.lead.detailRows.length})`} subtitle="Danh sach lead trong pham vi xu ly cua nhan vien.">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-3">Lead</th>
                  <th className="px-3 py-3">Khach hang</th>
                  <th className="px-3 py-3">Intent</th>
                  <th className="px-3 py-3">SLA</th>
                  <th className="px-3 py-3">Phan hoi</th>
                </tr>
              </thead>
              <tbody>
                {report.lead.detailRows.slice(0, 40).map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                    <td className="px-3 py-3">
                      <Link href={`/leads?leadId=${encodeURIComponent(row.id)}`} className="font-bold text-[var(--color-brand)] hover:underline">
                        {row.id.slice(0, 10)}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[var(--color-text-primary)]">{row.customer}</p>
                      <p className="line-clamp-2 max-w-[320px] text-xs text-[var(--color-text-secondary)]">{row.content}</p>
                    </td>
                    <td className="px-3 py-3 font-bold uppercase">{row.intent}</td>
                    <td className="px-3 py-3">{row.slaStatus}</td>
                    <td className="px-3 py-3">{formatMinutes(row.responseMinutes)}</td>
                  </tr>
                ))}
                {report.lead.detailRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-[var(--color-text-secondary)]">
                      Chua co lead phu hop.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </ReportPanel>

        <ReportPanel title={`Chi tiet Khung hoang (${report.crisis.detailRows.length})`} subtitle="Danh sach case khung hoang trong pham vi xu ly cua nhan vien.">
          <div className="overflow-x-auto">
            <table className="min-w-[780px] w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-3">Case</th>
                  <th className="px-3 py-3">Noi dung</th>
                  <th className="px-3 py-3">Muc do</th>
                  <th className="px-3 py-3">SLA</th>
                  <th className="px-3 py-3">Xu ly</th>
                </tr>
              </thead>
              <tbody>
                {report.crisis.detailRows.slice(0, 40).map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                    <td className="px-3 py-3">
                      <Link href={`/alerts?alertId=${encodeURIComponent(row.id)}`} className="font-bold text-[var(--color-brand)] hover:underline">
                        {row.id.slice(0, 10)}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[var(--color-text-primary)]">{row.topic}</p>
                      <p className="line-clamp-2 max-w-[340px] text-xs text-[var(--color-text-secondary)]">{row.content}</p>
                    </td>
                    <td className="px-3 py-3 font-bold uppercase">{row.severity}</td>
                    <td className="px-3 py-3">{row.slaStatus}</td>
                    <td className="px-3 py-3">{formatCrisisMinutes(row.resolutionMinutes)}</td>
                  </tr>
                ))}
                {report.crisis.detailRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-[var(--color-text-secondary)]">
                      Chua co case khung hoang phu hop.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </ReportPanel>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-high)] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
