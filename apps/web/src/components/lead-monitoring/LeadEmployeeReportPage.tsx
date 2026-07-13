"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { normalizeBrandName } from "@/lib/services/dashboard";
import { exportLeadReportCsv, exportLeadReportExcel } from "@/lib/excelExport";
import { formatMinutes, type LeadReportBucket } from "@/lib/lead-report";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  countActiveLeadReportFilters,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import { ReportExportPreviewModal } from "@/components/reports/ReportExportPreviewModal";
import { useDashboardStore } from "@/stores/dashboard.store";
import { useLeadMonitoringReport } from "./useLeadMonitoringReport";

function formatPercent(value: number) {
  return `${value}%`;
}

function reportFilename() {
  return `Bao_cao_nhan_vien_lead_${new Date().toISOString().slice(0, 10)}`;
}

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
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
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

function DistributionList({ items }: { items: LeadReportBucket[] }) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-[var(--color-text-primary)]">{item.label}</span>
            <span className="text-[var(--color-text-secondary)]">
              {item.count} lead · {item.percentage}%
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

export function LeadEmployeeReportPage() {
  const { profile } = useAuth();
  const { filters, workspaces, isLoading, error, setFilters } = useDashboardStore();
  const [reportFilters, setReportFilters] = useState<LeadReportFilters>(DEFAULT_LEAD_REPORT_FILTERS);
  const report = useLeadMonitoringReport(reportFilters);
  const [pendingExport, setPendingExport] = useState<"excel" | "csv" | null>(null);
  const activeFilterCount = countActiveLeadReportFilters(reportFilters);

  const updateReportFilter = <K extends keyof LeadReportFilters>(
    key: K,
    value: LeadReportFilters[K],
  ) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

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

  const exportFile = () => {
    if (pendingExport === "excel") exportLeadReportExcel(report, reportFilename());
    if (pendingExport === "csv") exportLeadReportCsv(report, reportFilename());
    setPendingExport(null);
  };

  return (
    <div data-tour="reports-center" className="p-4 md:p-8 space-y-6">
      {pendingExport ? (
        <ReportExportPreviewModal
          title="Bao cao xu ly khach hang tiem nang"
          subtitle="Preview truoc khi xuat file cho nhan vien Lead."
          generatedAt={report.generatedAt}
          formatLabel={pendingExport.toUpperCase()}
          stats={[
            { label: "Tong lead", value: report.kpis.total },
            { label: "Da lien he", value: formatPercent(report.kpis.contactRate), tone: "good" },
            { label: "Can ghi ket qua", value: report.kpis.needResult, tone: report.kpis.needResult > 0 ? "warn" : "default" },
            { label: "Tre SLA", value: report.kpis.slaBreached, tone: report.kpis.slaBreached > 0 ? "warn" : "good" },
          ]}
          summary={report.aiSummary}
          sections={[
            {
              title: "Pham vi file",
              rows: [
                { label: "Chi tiet lead", value: `${report.detailRows.length} dong` },
                { label: "Hieu suat nhan vien", value: `${report.staffPerformance.length} dong` },
                { label: "Ty le chuyen doi", value: formatPercent(report.kpis.conversionRate) },
              ],
            },
            {
              title: "Uu tien nghiep vu",
              rows: [
                { label: "Hot lead", value: report.kpis.hot },
                { label: "Follow-up qua han", value: report.kpis.followUpOverdue },
                { label: "Cho chuyen sales", value: report.kpis.salesHandoff },
              ],
            },
          ]}
          sampleRows={report.detailRows.slice(0, 6).map((row) => ({
            label: row.customer,
            meta: `${row.platform} · ${row.status} · ${row.slaStatus}`,
            badge: row.intent.toUpperCase(),
            description: row.content,
          }))}
          onClose={() => setPendingExport(null)}
          onConfirm={exportFile}
        />
      ) : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--color-brand)]">
            Báo cáo nhân viên lead
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--color-text-primary)] md:text-4xl">
            Báo cáo xử lý khách hàng tiềm năng
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Theo dõi khối lượng lead, tốc độ phản hồi, SLA, follow-up, kết quả chuyển đổi và các lead cần xử lý tiếp.
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
          Đang tải dữ liệu báo cáo lead...
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
            onClick={() => setReportFilters(DEFAULT_LEAD_REPORT_FILTERS)}
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
              onChange={(event) => updateReportFilter("timeRange", event.target.value as LeadReportFilters["timeRange"])}
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
              onChange={(event) => updateReportFilter("status", event.target.value as LeadReportFilters["status"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="new">Moi</option>
              <option value="processing">Dang xu ly</option>
              <option value="completed">Da chuyen doi</option>
              <option value="skipped">Bo qua</option>
            </select>
          </FilterField>
          <FilterField label="Intent">
            <select
              value={reportFilters.intent}
              onChange={(event) => updateReportFilter("intent", event.target.value as LeadReportFilters["intent"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="none">Khong co intent</option>
            </select>
          </FilterField>
          <FilterField label="SLA">
            <select
              value={reportFilters.sla}
              onChange={(event) => updateReportFilter("sla", event.target.value as LeadReportFilters["sla"])}
              className={inputClass}
            >
              <option value="all">Tat ca</option>
              <option value="in_sla">Trong/Dung SLA</option>
              <option value="overdue">Qua han</option>
              <option value="late">Tre SLA</option>
              <option value="closed">Da dong</option>
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
          <FilterField label="Phu trach">
            <select
              value={reportFilters.owner}
              onChange={(event) => updateReportFilter("owner", event.target.value as LeadReportFilters["owner"])}
              className={inputClass}
            >
              <option value="all">Tat ca duoc phep</option>
              <option value="mine">Cua toi</option>
              <option value="unassigned">Chua phan cong</option>
            </select>
          </FilterField>
          <FilterField label="Tu khoa">
            <input
              value={reportFilters.keyword}
              onChange={(event) => updateReportFilter("keyword", event.target.value)}
              placeholder="ID, khach hang, noi dung..."
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
        <KpiCard title="Tổng lead" value={report.kpis.total} sub={`${report.kpis.hot} hot · ${report.kpis.warm} warm`} />
        <KpiCard title="Đã liên hệ" value={formatPercent(report.kpis.contactRate)} sub={`${report.kpis.contacted}/${report.kpis.total} lead`} tone="good" />
        <KpiCard title="Cần ghi kết quả" value={report.kpis.needResult} sub={`${report.kpis.uncontacted} lead chưa liên hệ`} tone={report.kpis.needResult > 0 ? "warn" : "default"} />
        <KpiCard title="Đúng SLA" value={formatPercent(report.kpis.slaOnTimeRate)} sub={`${report.kpis.slaBreached} lead trễ/quá hạn`} tone={report.kpis.slaBreached > 0 ? "warn" : "good"} />
      </section>

      <ReportPanel title="Tóm tắt vận hành" subtitle={`Cập nhật lúc ${new Date(report.generatedAt).toLocaleString("vi-VN")}`}>
        <p className="text-base leading-7 text-[var(--color-text-primary)]">{report.aiSummary}</p>
      </ReportPanel>

      <section className="grid gap-4 xl:grid-cols-3">
        <ReportPanel title="Pipeline xử lý" subtitle="Lead đang kẹt ở bước nào.">
          <DistributionList items={report.pipeline} />
        </ReportPanel>
        <ReportPanel title="Phân bố intent" subtitle="Mức độ tiềm năng của khách hàng.">
          <DistributionList items={report.intentDistribution} />
        </ReportPanel>
        <ReportPanel title="Nguồn tạo lead" subtitle="Nguồn nào đang tạo nhiều cơ hội nhất.">
          <DistributionList items={report.sourceDistribution} />
        </ReportPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ReportPanel title="Xu hướng 7 ngày" subtitle="Lead mới, đã liên hệ, chuyển đổi và phản hồi trung bình.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Ngày</th>
                  <th className="px-3 py-2">Lead mới</th>
                  <th className="px-3 py-2">Đã liên hệ</th>
                  <th className="px-3 py-2">Chuyển đổi</th>
                  <th className="px-3 py-2">Phản hồi TB</th>
                </tr>
              </thead>
              <tbody>
                {report.responseTrend.map((row) => (
                  <tr key={row.day} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-3 font-bold text-[var(--color-text-primary)]">{row.day}</td>
                    <td className="px-3 py-3">{row.created}</td>
                    <td className="px-3 py-3">{row.contacted}</td>
                    <td className="px-3 py-3">{row.converted}</td>
                    <td className="px-3 py-3">{formatMinutes(row.avgResponseMinutes || null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPanel>

        <ReportPanel title="Hiệu suất xử lý" subtitle="Theo người phụ trách trong phạm vi dữ liệu được xem.">
          <div className="space-y-3">
            {report.staffPerformance.slice(0, 6).map((row) => (
              <div key={row.ownerId} className="rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[var(--color-text-primary)]">{row.ownerName}</p>
                  <span className="text-sm font-bold text-[var(--color-brand)]">{row.total} lead</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Đã liên hệ {row.contacted} · Chuyển đổi {row.converted} · Cần ghi {row.needResult} · Trễ {row.overdue}
                </p>
              </div>
            ))}
          </div>
        </ReportPanel>
      </section>

      <ReportPanel title={`Bảng chi tiết (${report.detailRows.length} lead)`} subtitle="Click vào lead để quay về bàn xử lý và thao tác tiếp.">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Khách hàng</th>
                <th className="px-3 py-3">Nguồn</th>
                <th className="px-3 py-3">Intent</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3">Phản hồi</th>
                <th className="px-3 py-3">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {report.detailRows.slice(0, 100).map((row) => (
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
                  <td className="px-3 py-3">{row.platform}</td>
                  <td className="px-3 py-3 font-bold capitalize">{row.intent}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">{row.slaStatus}</td>
                  <td className="px-3 py-3">{formatMinutes(row.responseMinutes)}</td>
                  <td className="px-3 py-3">{row.resultType || "--"}</td>
                </tr>
              ))}
              {report.detailRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-[var(--color-text-secondary)]">
                    Chưa có lead phù hợp trong phạm vi báo cáo hiện tại.
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
