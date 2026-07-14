"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { getScopedBrandKey } from "@/lib/brandScope";
import { exportCrisisReportCsv, exportCrisisReportExcel } from "@/lib/excelExport";
import { formatCrisisMinutes, type CrisisReportBucket } from "@/lib/crisis-report";
import {
  DEFAULT_CRISIS_REPORT_FILTERS,
  countActiveCrisisReportFilters,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import { ReportExportPreviewModal } from "@/components/reports/ReportExportPreviewModal";
import { getAlertReviewSinceIso, useAlertStore } from "@/stores/alert.store";
import { useCrisisMonitoringReport } from "./useCrisisMonitoringReport";

function formatPercent(value: number) {
  return `${value}%`;
}

function reportFilename() {
  return `Bao_cao_nhan_vien_khung_hoang_${new Date().toISOString().slice(0, 10)}`;
}

const SOURCE_OPTIONS = [
  { value: "all", label: "Tat ca nguon" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "google_maps", label: "Google Maps" },
  { value: "news", label: "Bao dien tu" },
  { value: "be", label: "BeFood" },
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

function DistributionList({ items }: { items: CrisisReportBucket[] }) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-[var(--color-text-primary)]">{item.label}</span>
            <span className="text-[var(--color-text-secondary)]">
              {item.count} case · {item.percentage}%
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

export function CrisisEmployeeReportPage() {
  const { profile } = useAuth();
  const [reportFilters, setReportFilters] = useState<CrisisReportFilters>(DEFAULT_CRISIS_REPORT_FILTERS);
  const report = useCrisisMonitoringReport(reportFilters);
  const [pendingExport, setPendingExport] = useState<"excel" | "csv" | null>(null);
  const activeFilterCount = countActiveCrisisReportFilters(reportFilters);
  const {
    isLoading,
    error,
    fetchAlerts,
    fetchCorrectionRequests,
  } = useAlertStore();

  useDashboard({ autoFetch: true, refetchInterval: 60000 });

  useEffect(() => {
    const scopedBrandKey = getScopedBrandKey(profile);
    fetchAlerts(scopedBrandKey, false);
    fetchCorrectionRequests(scopedBrandKey, false);
  }, [fetchAlerts, fetchCorrectionRequests, profile]);

  const updateReportFilter = <K extends keyof CrisisReportFilters>(
    key: K,
    value: CrisisReportFilters[K],
  ) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

  const exportFile = () => {
    if (pendingExport === "excel") exportCrisisReportExcel(report, reportFilename());
    if (pendingExport === "csv") exportCrisisReportCsv(report, reportFilename());
    setPendingExport(null);
  };

  return (
    <div data-tour="reports-center" className="space-y-6 p-4 md:p-8">
      {pendingExport ? (
        <ReportExportPreviewModal
          title="Bao cao xu ly khung hoang"
          subtitle="Preview truoc khi xuat file cho nhan vien Crisis."
          generatedAt={report.generatedAt}
          formatLabel={pendingExport.toUpperCase()}
          stats={[
            { label: "Tong canh bao", value: report.kpis.total },
            { label: "Da xu ly", value: formatPercent(report.kpis.resolvedRate), tone: "good" },
            { label: "Qua han SLA", value: report.kpis.overdue, tone: report.kpis.overdue > 0 ? "warn" : "good" },
            { label: "Escalation", value: report.kpis.escalated, tone: report.kpis.escalated > 0 ? "warn" : "default" },
          ]}
          summary={report.aiSummary}
          sections={[
            {
              title: "Pham vi file",
              rows: [
                { label: "Chi tiet case", value: `${report.detailRows.length} dong` },
                { label: "Case qua han SLA", value: report.overdueRows.length },
                { label: "Case escalation", value: report.escalationRows.length },
              ],
            },
            {
              title: "Uu tien nghiep vu",
              rows: [
                { label: "Critical", value: report.kpis.critical },
                { label: "High", value: report.kpis.high },
                { label: "Cho duyet", value: report.kpis.pendingApproval },
              ],
            },
          ]}
          sampleRows={report.detailRows.slice(0, 6).map((row) => ({
            label: row.topic,
            meta: `${row.platform} · ${row.status} · ${row.slaStatus}`,
            badge: row.severity.toUpperCase(),
            description: row.content,
          }))}
          onClose={() => setPendingExport(null)}
          onConfirm={exportFile}
        />
      ) : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--color-error)]">
            Báo cáo nhân viên khủng hoảng
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--color-text-primary)] md:text-4xl">
            Báo cáo xử lý khủng hoảng
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Theo dõi số lượng cảnh báo, mức độ nghiêm trọng, SLA, escalation, tốc độ phản hồi và danh sách case cần ưu tiên xử lý.
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
            Phạm vi dữ liệu: các cảnh báo trong {Math.round((Date.now() - new Date(getAlertReviewSinceIso()).getTime()) / (24 * 60 * 60 * 1000))} ngày gần nhất.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPendingExport("excel")}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
          >
            <span className="material-symbols-outlined text-base">table_view</span>
            Xuất Excel
          </button>
          <button
            type="button"
            onClick={() => setPendingExport("csv")}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)]"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Xuất CSV
          </button>
        </div>
      </header>

      {isLoading && report.kpis.total === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
          Đang tải dữ liệu báo cáo khủng hoảng...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error-subtle)] p-4 text-sm font-semibold text-[var(--color-error)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[var(--color-text-primary)]">Bo loc bao cao</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Ap dung cho KPI, bang chi tiet, preview va file xuat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportFilters(DEFAULT_CRISIS_REPORT_FILTERS)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-high)]"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Dat lai{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Thoi gian">
            <select
              value={reportFilters.timeRange}
              onChange={(event) => updateReportFilter("timeRange", event.target.value as CrisisReportFilters["timeRange"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="today">Hom nay</option>
              <option value="7d">7 ngay</option>
              <option value="30d">30 ngay</option>
              <option value="custom">Tuy chon</option>
            </select>
          </FilterField>
          <FilterField label="Trang thai">
            <select
              value={reportFilters.status}
              onChange={(event) => updateReportFilter("status", event.target.value)}
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
          <FilterField label="Muc do">
            <select
              value={reportFilters.severity}
              onChange={(event) => updateReportFilter("severity", event.target.value as CrisisReportFilters["severity"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </FilterField>
          <FilterField label="SLA">
            <select
              value={reportFilters.sla}
              onChange={(event) => updateReportFilter("sla", event.target.value as CrisisReportFilters["sla"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="in_sla">Trong/Dung SLA</option>
              <option value="overdue">Qua han</option>
              <option value="late">Tre SLA</option>
              <option value="closed">Da dong</option>
            </select>
          </FilterField>
          <FilterField label="Escalation">
            <select
              value={reportFilters.escalation}
              onChange={(event) => updateReportFilter("escalation", event.target.value as CrisisReportFilters["escalation"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="yes">Da escalation</option>
              <option value="no">Chua escalation</option>
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
          <FilterField label="Chu de">
            <select
              value={reportFilters.topic}
              onChange={(event) => updateReportFilter("topic", event.target.value)}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              {TOPIC_OPTIONS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Tu khoa">
            <input
              value={reportFilters.keyword}
              onChange={(event) => updateReportFilter("keyword", event.target.value)}
              placeholder="ID, topic, noi dung..."
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
          title="Tổng cảnh báo"
          value={report.kpis.total}
          sub={`${report.kpis.critical} nguy cấp · ${report.kpis.high} cao`}
          tone={report.kpis.critical + report.kpis.high > 0 ? "danger" : "default"}
        />
        <KpiCard
          title="Đã xử lý"
          value={formatPercent(report.kpis.resolvedRate)}
          sub={`${report.kpis.resolved}/${report.kpis.total} case`}
          tone="good"
        />
        <KpiCard
          title="Quá hạn SLA"
          value={report.kpis.overdue}
          sub={`Đúng SLA ${formatPercent(report.kpis.slaOnTimeRate)}`}
          tone={report.kpis.overdue > 0 ? "warn" : "good"}
        />
        <KpiCard
          title="Escalation"
          value={report.kpis.escalated}
          sub={`${report.kpis.pendingApproval} case đang chờ duyệt`}
          tone={report.kpis.escalated > 0 ? "warn" : "default"}
        />
      </section>

      <ReportPanel title="Tóm tắt vận hành" subtitle={`Cập nhật lúc ${new Date(report.generatedAt).toLocaleString("vi-VN")}`}>
        <p className="text-base leading-7 text-[var(--color-text-primary)]">{report.aiSummary}</p>
      </ReportPanel>

      <section className="grid gap-4 xl:grid-cols-3">
        <ReportPanel title="Mức độ khủng hoảng" subtitle="Tỷ trọng case theo độ nghiêm trọng.">
          <DistributionList items={report.severityDistribution} />
        </ReportPanel>
        <ReportPanel title="Trạng thái xử lý" subtitle="Luồng vận hành của các case khủng hoảng.">
          <DistributionList items={report.statusDistribution} />
        </ReportPanel>
        <ReportPanel title="Nguồn cảnh báo" subtitle="Nền tảng phát sinh nhiều case nhất.">
          <DistributionList items={report.sourceDistribution} />
        </ReportPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ReportPanel title="Xu hướng 7 ngày" subtitle="Case mới, đã xử lý, escalation và phản hồi trung bình.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Ngày</th>
                  <th className="px-3 py-2">Case mới</th>
                  <th className="px-3 py-2">Đã xử lý</th>
                  <th className="px-3 py-2">Escalate</th>
                  <th className="px-3 py-2">Phản hồi TB</th>
                </tr>
              </thead>
              <tbody>
                {report.responseTrend.map((row) => (
                  <tr key={row.day} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-3 font-bold text-[var(--color-text-primary)]">{row.day}</td>
                    <td className="px-3 py-3">{row.created}</td>
                    <td className="px-3 py-3">{row.resolved}</td>
                    <td className="px-3 py-3">{row.escalated}</td>
                    <td className="px-3 py-3">{formatCrisisMinutes(row.avgResponseMinutes || null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPanel>

        <ReportPanel title="Hiệu suất xử lý" subtitle="Theo nhân viên hoặc người đang nhận case.">
          <div className="space-y-3">
            {report.staffPerformance.slice(0, 6).map((row) => (
              <div key={row.ownerId} className="rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[var(--color-text-primary)]">{row.ownerName}</p>
                  <span className="text-sm font-bold text-[var(--color-brand)]">{row.total} case</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Đã xử lý {row.resolved} · Trễ {row.overdue} · Escalate {row.escalated} · Phản hồi TB {formatCrisisMinutes(row.avgFirstResponseMinutes)}
                </p>
              </div>
            ))}
          </div>
        </ReportPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportPanel title={`Case quá hạn SLA (${report.overdueRows.length})`} subtitle="Các case cần ưu tiên xử lý hoặc rà soát nguyên nhân trễ.">
          <div className="space-y-2">
            {report.overdueRows.slice(0, 6).map((row) => (
              <Link
                key={row.id}
                href={`/alerts?alertId=${encodeURIComponent(row.id)}`}
                className="block rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg-surface-high)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[var(--color-text-primary)]">{row.severity.toUpperCase()}</p>
                  <span className="text-xs font-bold text-amber-700">{row.slaStatus}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{row.content}</p>
              </Link>
            ))}
            {report.overdueRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">Không có case quá hạn SLA.</p>
            ) : null}
          </div>
        </ReportPanel>

        <ReportPanel title={`Escalation (${report.escalationRows.length})`} subtitle="Các case đã chuyển cấp hoặc đang chờ duyệt phản hồi.">
          <div className="space-y-2">
            {report.escalationRows.slice(0, 6).map((row) => (
              <Link
                key={row.id}
                href={`/alerts?alertId=${encodeURIComponent(row.id)}`}
                className="block rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg-surface-high)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[var(--color-text-primary)]">{row.status}</p>
                  <span className="text-xs font-bold text-[var(--color-brand)]">{row.assigneeName}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{row.content}</p>
              </Link>
            ))}
            {report.escalationRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">Chưa có case escalation.</p>
            ) : null}
          </div>
        </ReportPanel>
      </section>

      <ReportPanel title={`Bảng chi tiết (${report.detailRows.length} case)`} subtitle="Click vào case để quay về trung tâm xử lý khủng hoảng.">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-3">Case</th>
                <th className="px-3 py-3">Nội dung</th>
                <th className="px-3 py-3">Nguồn</th>
                <th className="px-3 py-3">Mức độ</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3">Phản hồi</th>
                <th className="px-3 py-3">Xử lý</th>
                <th className="px-3 py-3">Escalate</th>
              </tr>
            </thead>
            <tbody>
              {report.detailRows.slice(0, 100).map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="px-3 py-3">
                    <Link href={`/alerts?alertId=${encodeURIComponent(row.id)}`} className="font-bold text-[var(--color-brand)] hover:underline">
                      {row.id.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[var(--color-text-primary)]">{row.topic}</p>
                    <p className="line-clamp-2 max-w-[360px] text-xs text-[var(--color-text-secondary)]">{row.content}</p>
                  </td>
                  <td className="px-3 py-3">{row.platform}</td>
                  <td className="px-3 py-3 font-bold capitalize">{row.severity}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">{row.slaStatus}</td>
                  <td className="px-3 py-3">{formatCrisisMinutes(row.responseMinutes)}</td>
                  <td className="px-3 py-3">{formatCrisisMinutes(row.resolutionMinutes)}</td>
                  <td className="px-3 py-3">{row.escalated ? "Có" : "--"}</td>
                </tr>
              ))}
              {report.detailRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-[var(--color-text-secondary)]">
                    Chưa có cảnh báo khủng hoảng phù hợp trong phạm vi báo cáo hiện tại.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </ReportPanel>
    </div>
  );
}
