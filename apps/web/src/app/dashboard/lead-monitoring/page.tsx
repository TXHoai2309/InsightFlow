"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboardData";
import { useDashboardStore } from "@/stores/dashboard.store";
import { canPerformAction } from "@/lib/rbac";
import { buildLeadReportData, formatMinutes } from "@/lib/lead-report";
import { getLeadExpiryTime, needsLeadResultCapture } from "@/lib/lead-workbench";
import { exportLeadReportCsv, exportLeadReportExcel } from "@/lib/excelExport";
import type { Lead } from "@/types/dashboard";

type IntentFilter = "all" | Lead["intent"];
type StatusFilter = "all" | Lead["status"] | "need_result" | "overdue" | "sales_handoff";

const PLATFORM_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google_maps", label: "Google Maps" },
  { value: "be", label: "Be / BeFood" },
  { value: "youtube", label: "YouTube" },
  { value: "thread", label: "Threads" },
  { value: "news", label: "Báo điện tử" },
];

function formatPercent(value: number) {
  return `${value}%`;
}

function isOverdueRow(row: ReturnType<typeof buildLeadReportData>["detailRows"][number]) {
  return row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA";
}

function formatDateTime(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Mới",
    processing: "Đang xử lý",
    completed: "Đã chuyển đổi",
    skipped: "Bỏ qua",
  };
  return labels[status] || status;
}

function KpiCard({
  title,
  value,
  sub,
  tone = "neutral",
}: {
  title: string;
  value: React.ReactNode;
  sub: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : tone === "warn"
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : tone === "bad"
          ? "text-red-700 bg-red-50 border-red-100"
          : "text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border-[var(--color-brand-border)]";

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
        {title}
      </p>
      <div className={`mt-3 inline-flex rounded-lg border px-3 py-1.5 text-2xl font-black ${toneClass}`}>
        {value}
      </div>
      <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{sub}</p>
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
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function downloadFilename() {
  return `Bao_cao_lead_${new Date().toISOString().slice(0, 10)}`;
}

export default function DashboardLeadMonitoringPage() {
  const { profile, loading: authLoading } = useAuth();
  const { refetch } = useDashboard({ autoFetch: true, refetchInterval: 60000 });
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    filters,
    setFilters,
    getFilteredLeadsWithoutUrgency,
    isLoading,
    error,
    workspaces,
  } = useDashboardStore();

  const canViewReports = canPerformAction(profile, "view_reports");
  const canViewLeads = canPerformAction(profile, "view_leads");
  const baseLeads = getFilteredLeadsWithoutUrgency();

  const ownerOptions = useMemo(() => {
    const owners = new Map<string, string>();
    baseLeads.forEach((lead) => {
      if (lead.owner_id) {
        owners.set(lead.owner_id, lead.owner_name || lead.owner_email || "Nhân viên chưa rõ tên");
      }
    });
    return Array.from(owners.entries()).map(([id, name]) => ({ id, name }));
  }, [baseLeads]);

  const reportLeads = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return baseLeads.filter((lead) => {
      if (profile?.role === "lead_employee" && lead.owner_id && lead.owner_id !== profile.uid) return false;
      if (ownerFilter !== "all") {
        if (ownerFilter === "unassigned" && lead.owner_id) return false;
        if (ownerFilter !== "unassigned" && lead.owner_id !== ownerFilter) return false;
      }
      if (intentFilter !== "all" && lead.intent !== intentFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "need_result" && !needsLeadResultCapture(lead)) {
          return false;
        } else if (
          statusFilter === "overdue" &&
          !(
            (lead.status === "new" || lead.status === "processing") &&
            getLeadExpiryTime(lead) < Date.now()
          )
        ) {
          return false;
        } else if (statusFilter === "sales_handoff" && lead.result_type !== "transfer_sales" && lead.sales_status !== "ready_to_transfer" && lead.sales_status !== "transferred") {
          return false;
        } else if (
          statusFilter !== "need_result" &&
          statusFilter !== "overdue" &&
          statusFilter !== "sales_handoff" &&
          lead.status !== statusFilter
        ) {
          return false;
        }
      }
      if (text) {
        const haystack = `${lead.author || ""} ${lead.id} ${lead.content} ${lead.owner_name || ""}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      return true;
    });
  }, [baseLeads, intentFilter, ownerFilter, profile, searchText, statusFilter]);

  const report = useMemo(() => buildLeadReportData(reportLeads, profile), [profile, reportLeads]);
  const maxPipelineCount = Math.max(...report.pipeline.map((item) => item.count), 1);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!authLoading && (!canViewReports || !canViewLeads)) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Vai trò hiện tại chưa được cấp quyền xem báo cáo khách hàng tiềm năng.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
              Báo cáo vận hành lead
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--color-text-primary)]">
              Báo cáo xử lý khách hàng tiềm năng
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Theo dõi khối lượng lead, tốc độ phản hồi, SLA, kết quả chuyển đổi, follow-up và hiệu suất nhân viên từ dữ liệu xử lý thực tế.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => exportLeadReportCsv(report, downloadFilename())}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportLeadReportExcel(report, downloadFilename())}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Thời gian</span>
            <select
              value={filters.time_range}
              onChange={(event) => setFilters({ time_range: event.target.value as typeof filters.time_range })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="24h">Hôm nay</option>
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
              <option value="all">Tất cả</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Thương hiệu</span>
            <select
              value={filters.workspace_id}
              onChange={(event) => setFilters({ workspace_id: event.target.value })}
              disabled={profile?.role !== "admin" && profile?.role !== "brand_manager"}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-70"
            >
              <option value="all">Tất cả brand</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.brand_name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Nguồn</span>
            <select
              value={filters.platform}
              onChange={(event) => setFilters({ platform: event.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Intent</span>
            <select
              value={intentFilter}
              onChange={(event) => setIntentFilter(event.target.value as IntentFilter)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="all">Tất cả intent</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="none">Không có intent</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Mới</option>
              <option value="processing">Đang xử lý</option>
              <option value="need_result">Cần ghi kết quả</option>
              <option value="overdue">Trễ SLA</option>
              <option value="sales_handoff">Chờ/chuyển sales</option>
              <option value="completed">Đã chuyển đổi</option>
              <option value="skipped">Bỏ qua</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Nhân viên</span>
            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              disabled={profile?.role === "lead_employee"}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-70"
            >
              <option value="all">{profile?.role === "lead_employee" ? "Của tôi và chưa phân công" : "Tất cả nhân viên"}</option>
              <option value="unassigned">Chưa phân công</option>
              {ownerOptions.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm theo khách hàng, nội dung, lead ID hoặc nhân viên..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] py-2 pl-10 pr-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard title="Tổng lead" value={report.kpis.total} sub={`${report.kpis.hot} hot · ${report.kpis.warm} warm`} />
        <KpiCard title="Đã liên hệ" value={formatPercent(report.kpis.contactRate)} sub={`${report.kpis.contacted}/${report.kpis.total} lead`} tone="good" />
        <KpiCard title="Phản hồi TB" value={formatMinutes(report.kpis.avgFirstResponseMinutes)} sub="Từ lúc phát hiện đến liên hệ đầu tiên" />
        <KpiCard title="Đúng SLA" value={formatPercent(report.kpis.slaOnTimeRate)} sub={`${report.kpis.slaBreached} lead trễ/quá hạn`} tone={report.kpis.slaBreached > 0 ? "warn" : "good"} />
        <KpiCard title="Cần ghi kết quả" value={report.kpis.needResult} sub="Đã mở liên hệ nhưng chưa chốt outcome" tone={report.kpis.needResult > 0 ? "bad" : "good"} />
        <KpiCard title="Chuyển đổi" value={formatPercent(report.kpis.conversionRate)} sub={`${report.kpis.converted} converted · ${report.kpis.salesHandoff} sales`} tone="good" />
      </section>

      <ReportPanel title="Tóm tắt nghiệp vụ" subtitle="Tự động tổng hợp từ dữ liệu report hiện tại.">
        <p className="text-base leading-7 text-[var(--color-text-primary)]">{report.aiSummary}</p>
      </ReportPanel>

      <section className="grid gap-4 xl:grid-cols-3">
        <ReportPanel title="Pipeline xử lý" subtitle="Nhìn nhanh lead đang kẹt ở bước nào.">
          <div className="space-y-3">
            {report.pipeline.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--color-text-primary)]">{item.label}</span>
                  <span className="text-[var(--color-text-secondary)]">{item.count} lead</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-surface-raised)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(4, (item.count / maxPipelineCount) * 100)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ReportPanel>

        <ReportPanel title="Phân bổ intent" subtitle="Hot/warm/cold theo dữ liệu đã lọc.">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.intentDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {report.intentDistribution.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel title="Nguồn tạo lead" subtitle="Nguồn nào đang tạo nhiều cơ hội nhất.">
          <div className="space-y-3">
            {report.sourceDistribution.filter((item) => item.count > 0).map((item) => (
              <div key={item.key} className="rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[var(--color-text-primary)]">{item.label}</span>
                  <span className="font-semibold text-[var(--color-text-secondary)]">{item.percentage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-bg-surface-raised)]">
                  <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.count} lead</p>
              </div>
            ))}
            {report.sourceDistribution.every((item) => item.count === 0) && (
              <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">Chưa có dữ liệu nguồn.</p>
            )}
          </div>
        </ReportPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ReportPanel title="Xu hướng 7 ngày" subtitle="Lead mới, liên hệ và chuyển đổi theo ngày.">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.responseTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="created" name="Lead mới" stroke="#4234B6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="contacted" name="Đã liên hệ" stroke="#0F766E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="converted" name="Chuyển đổi" stroke="#15803D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel title="Hiệu suất nhân viên" subtitle="Dùng cho Brand Manager theo dõi tải việc và chất lượng xử lý.">
          <div className="max-h-[280px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[var(--color-bg-surface)] text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="py-2 pr-3">Nhân viên</th>
                  <th className="py-2 pr-3 text-right">Lead</th>
                  <th className="py-2 pr-3 text-right">Liên hệ</th>
                  <th className="py-2 pr-3 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {report.staffPerformance.map((row) => (
                  <tr key={row.ownerId}>
                    <td className="py-2 pr-3">
                      <p className="font-semibold text-[var(--color-text-primary)]">{row.ownerName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        TB {formatMinutes(row.avgFirstResponseMinutes)} · {row.overdue} quá hạn
                      </p>
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold">{row.total}</td>
                    <td className="py-2 pr-3 text-right">{row.contacted}</td>
                    <td className="py-2 pr-3 text-right">{row.conversionRate}%</td>
                  </tr>
                ))}
                {report.staffPerformance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[var(--color-text-secondary)]">Chưa có dữ liệu nhân viên.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportPanel>
      </section>

      <ReportPanel title={`Bảng chi tiết (${report.detailRows.length} lead)`} subtitle="Click vào lead để quay về bàn xử lý và thao tác tiếp.">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-[var(--color-bg-surface-raised)] text-xs uppercase text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-3">Khách hàng</th>
                <th className="px-3 py-3">Nguồn / Intent</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Nhân viên</th>
                <th className="px-3 py-3 text-right">Phản hồi</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3">Kết quả</th>
                <th className="px-3 py-3">Nội dung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {report.detailRows.slice(0, 100).map((row) => (
                <tr key={row.id} className="hover:bg-[var(--color-bg-surface-raised)]">
                  <td className="px-3 py-3 align-top">
                    <Link href={`/leads?leadId=${encodeURIComponent(row.id)}`} className="font-bold text-[var(--color-brand)] hover:underline">
                      {row.customer}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDateTime(row.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="font-semibold text-[var(--color-text-primary)]">{row.platform}</p>
                    <p className="text-xs uppercase text-[var(--color-text-secondary)]">{row.intent}</p>
                  </td>
                  <td className="px-3 py-3 align-top">{getStatusLabel(row.status)}</td>
                  <td className="px-3 py-3 align-top">{row.ownerName}</td>
                  <td className="px-3 py-3 text-right align-top">{formatMinutes(row.responseMinutes)}</td>
                  <td className="px-3 py-3 align-top">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${isOverdueRow(row) ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {row.slaStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">{row.resultType || "--"}</td>
                  <td className="max-w-[340px] px-3 py-3 align-top">
                    <p className="line-clamp-2 text-[var(--color-text-secondary)]">{row.content}</p>
                  </td>
                </tr>
              ))}
              {report.detailRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-[var(--color-text-secondary)]">
                    Không có lead phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {report.detailRows.length > 100 && (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Đang hiển thị 100 dòng đầu. File Excel/CSV sẽ bao gồm toàn bộ {report.detailRows.length} lead.
          </p>
        )}
      </ReportPanel>
    </div>
  );
}
