"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getAlertWorkflowStatus, isResolvedAlert } from "@/lib/alertWorkflow";
import type { AlertData, AlertFilters } from "@/stores/alert.store";
import { AlertDetailPanel, type AlertDetailPanelTab } from "./AlertDetailPanel";
import { AlertWorkbenchRow } from "./AlertWorkbenchRow";

type StatusFilter = "all" | "pending" | "processing" | "contact_failed" | "resolved";
type QueueStatus = Exclude<StatusFilter, "all">;

interface AlertWorkbenchProps {
  alerts: AlertData[];
  pageAlerts: AlertData[];
  selectedAlert: AlertData | null;
  selectedAlertId: string | null;
  panelCollapsed: boolean;
  detailTab: AlertDetailPanelTab;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string | null;
  statusFilter: StatusFilter;
  searchText: string;
  severityFilter: string;
  sourceFilter: string;
  contentTypeFilter: string;
  showMineOnly: boolean;
  sortBy: "risk" | "newest" | "reach";
  timeFilter: string;
  singleDate: string;
  customStartDate: string;
  customEndDate: string;
  brandFilterLocked: boolean;
  canViewAllAssignments: boolean;
  brands: string[];
  filters: AlertFilters;
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  profileEmail?: string | null;
  canUpdate: boolean;
  getResolverName: (value: string | null | undefined) => string;
  onRefresh: () => Promise<void>;
  onSelectAlert: (alert: AlertData) => void;
  onCollapsePanel: () => void;
  onOpenPanel: () => void;
  onDetailTabChange: (tab: AlertDetailPanelTab) => void;
  onClaim: (alert: AlertData) => Promise<void>;
  onRecordResult: (alert: AlertData) => Promise<void>;
  onOpenSource: (alert: AlertData) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSearchTextChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
  onSourceFilterChange: (value: string) => void;
  onContentTypeFilterChange: (value: string) => void;
  onMineOnlyChange: (value: boolean) => void;
  onSortChange: (value: "risk" | "newest" | "reach") => void;
  onTimeFilterChange: (value: string) => void;
  onSingleDateChange: (value: string) => void;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  onFiltersChange: (filters: Partial<AlertFilters>) => void;
  onPageChange: (page: number) => void;
}

const STATUS_VIEWS: Array<{ id: QueueStatus; label: string }> = [
  { id: "pending", label: "Chưa phân công" },
  { id: "processing", label: "Đang xử lý" },
  { id: "contact_failed", label: "Cần liên hệ lại" },
  { id: "resolved", label: "Đã giải quyết" },
];

export function AlertWorkbench(props: AlertWorkbenchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const counts = {
    pending: props.alerts.filter((alert) => getAlertWorkflowStatus(alert) === "pending").length,
    processing: props.alerts.filter((alert) => getAlertWorkflowStatus(alert) === "processing").length,
    contact_failed: props.alerts.filter((alert) => getAlertWorkflowStatus(alert) === "contact_failed").length,
    resolved: props.alerts.filter(isResolvedAlert).length,
  };
  const urgentCount = props.alerts.filter((alert) => !isResolvedAlert(alert) && ["critical", "high"].includes(String(alert.severity).toLowerCase())).length;
  const openCount = counts.pending + counts.processing + counts.contact_failed;
  const timeScopeLabel = props.timeFilter === "all"
    ? "Toàn thời gian"
    : props.timeFilter === "24h"
      ? "Hôm nay"
      : props.timeFilter === "7d"
        ? "7 ngày qua"
        : props.timeFilter === "30d"
          ? "30 ngày qua"
          : props.timeFilter === "single"
            ? (props.singleDate || "Ngày cụ thể")
            : props.timeFilter === "custom"
              ? `${props.customStartDate || "…"} → ${props.customEndDate || "…"}`
              : props.timeFilter;
  const isPanelOpen = Boolean(props.selectedAlert && !props.panelCollapsed);

  const ALL_STATUS_VIEWS = [
    { id: "all" as const, label: "Tất cả việc đang mở", count: openCount },
    { id: "pending" as const, label: "Chưa phân công", count: counts.pending },
    { id: "processing" as const, label: "Đang xử lý", count: counts.processing },
    { id: "contact_failed" as const, label: "Cần liên hệ lại", count: counts.contact_failed },
    { id: "resolved" as const, label: "Đã giải quyết", count: counts.resolved },
  ];

  return (
    <div className="space-y-[clamp(8px,0.8vw,14px)]">
      <header className="flex flex-col gap-3 min-[1320px]:flex-row min-[1320px]:items-center min-[1320px]:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black text-[var(--color-text-primary)] md:text-2xl">Trung tâm xử lý cảnh báo</h1>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1 text-[10px] font-black text-[var(--color-text-secondary)]">{timeScopeLabel}</span>
            {urgentCount > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700">{urgentCount} cảnh báo ưu tiên</span>}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Toàn bộ đề cập tiêu cực đều được đưa vào hàng đợi; nhóm ưu tiên cao được đánh dấu riêng.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 min-[1320px]:w-auto">
          <label className="relative min-w-[220px] flex-1 min-[1320px]:w-[20rem] min-[1320px]:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
            <input value={props.searchText} onChange={(event) => props.onSearchTextChange(event.target.value)} placeholder="Tìm nội dung hoặc người đăng..." className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20" />
          </label>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <KpiCard title="Tất cả việc đang mở" value={openCount} sub={`${urgentCount} việc có mức ưu tiên cao`} icon="bolt" color="var(--color-error)" bg="var(--color-error-subtle)" onClick={() => props.onStatusFilterChange("all")} />
        <KpiCard title="Chưa phân công" value={counts.pending} sub="Chưa có người phụ trách" icon="person_add" color="var(--color-info)" bg="var(--color-info-subtle)" onClick={() => props.onStatusFilterChange("pending")} />
        <KpiCard title="Đang được xử lý" value={counts.processing} sub="Đã có người phụ trách" icon="timer" color="var(--color-warning)" bg="var(--color-warning-subtle)" onClick={() => props.onStatusFilterChange("processing")} />
      </section>

      <section className="space-y-[clamp(6px,0.55vw,10px)]">
        <div className="flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar pb-2">
          <div className="flex items-center gap-2 shrink-0">
            {ALL_STATUS_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => props.onStatusFilterChange(view.id)}
                className={`inline-flex shrink-0 items-center rounded-xl border px-3.5 py-2 text-sm font-bold tracking-tight transition-all duration-200 ${props.statusFilter === view.id
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] dark:bg-slate-900/40"
                  }`}
              >
                <span className="whitespace-nowrap">{view.label}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-all duration-200 ${props.statusFilter === view.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                  {view.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select value={props.sortBy} onChange={(event) => props.onSortChange(event.target.value as AlertWorkbenchProps["sortBy"])} className="w-fit shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"><option value="risk">Rủi ro cao trước</option><option value="newest">Mới nhất</option><option value="reach">Tiếp cận cao nhất</option></select>
            <button
              type="button"
              onClick={() => void props.onRefresh()}
              disabled={props.isRefreshing}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Bộ lọc
            </button>
            {props.selectedAlert && props.panelCollapsed && (
              <button
                type="button"
                onClick={props.onOpenPanel}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]/80"
              >
                <span className="material-symbols-outlined text-base">dock_to_left</span>
                Xem chi tiết
              </button>
            )}
          </div>
        </div>

        {showFilters && <FilterPanel {...props} />}
        {props.error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{props.error}</div>}

        <div className={`grid w-full items-start gap-y-[1vh] ${isPanelOpen ? "min-[1100px]:grid-cols-[clamp(390px,25vw,420px)_minmax(0,1fr)] min-[1100px]:gap-x-2.5" : "grid-cols-1"}`}>
          <main data-tour="alerts-queue-list" className="flex min-w-0 scroll-mt-24 flex-col self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm min-[1100px]:sticky min-[1100px]:top-3 min-[1100px]:max-h-[calc(100vh-88px)]">
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-[4%] py-[3%]"><div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Danh sách cảnh báo</h2><p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{STATUS_VIEWS.find((view) => view.id === props.statusFilter)?.label || "Cảnh báo đang mở"}</p></div><span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-black text-[var(--color-text-primary)]">{props.totalFiltered}</span></header>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [scrollbar-gutter:stable]">
              {props.isLoading && props.pageAlerts.length === 0 ? [0, 1, 2].map((item) => <div key={item} className="h-[18vh] animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]" />) : props.pageAlerts.length === 0 ? <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] p-[8%] text-center"><p className="text-sm font-black text-[var(--color-text-primary)]">Không có cảnh báo phù hợp</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{props.canViewAllAssignments ? "Thử chọn trạng thái hoặc điều chỉnh bộ lọc." : "Không có cảnh báo nào đang chờ bạn xử lý."}</p></div> : props.pageAlerts.map((alert) => <AlertWorkbenchRow key={alert.id} alert={alert} selected={props.selectedAlertId === alert.id} onSelect={props.onSelectAlert} getResolverName={props.getResolverName} />)}
            </div>
            {props.totalFiltered > 0 && <footer className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] px-[4%] py-[3%] text-xs text-[var(--color-text-secondary)]"><span>{props.totalFiltered} cảnh báo</span><div className="flex items-center gap-2"><button type="button" onClick={() => props.onPageChange(props.currentPage - 1)} disabled={props.currentPage === 1} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40" title="Trang trước"><ChevronLeft size={16} /></button><span className="min-w-10 text-center font-black text-[var(--color-text-primary)]">{props.currentPage}/{props.totalPages}</span><button type="button" onClick={() => props.onPageChange(props.currentPage + 1)} disabled={props.currentPage === props.totalPages} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40" title="Trang sau"><ChevronRight size={16} /></button></div></footer>}
          </main>

          {props.selectedAlert && !props.panelCollapsed && <AlertDetailPanel alert={props.selectedAlert} activeTab={props.detailTab} onTabChange={props.onDetailTabChange} profileEmail={props.profileEmail} canUpdate={props.canUpdate} getResolverName={props.getResolverName} onClose={props.onCollapsePanel} onClaim={props.onClaim} onRecordResult={props.onRecordResult} onOpenSource={props.onOpenSource} />}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color, bg, onClick }: { title: string; value: number; sub: string; icon: string; color: string; bg: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-brand-border)] hover:shadow-md dark:bg-slate-900/40"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-300"
          style={{ backgroundColor: bg, color: color }}
        >
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="mt-1 truncate text-[11px] font-medium text-[var(--color-text-secondary)]">
            {sub}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="text-3xl font-black tracking-tight"
          style={{ color: color }}
        >
          {value}
        </span>
        <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)] opacity-50 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100">
          chevron_right
        </span>
      </div>
    </button>
  );
}

function FilterPanel(props: AlertWorkbenchProps) {
  return <div className="grid gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 sm:grid-cols-2 xl:grid-cols-6">
    {!props.brandFilterLocked && <select value={props.filters.brand} onChange={(event) => props.onFiltersChange({ brand: event.target.value })} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"><option value="all">Tất cả thương hiệu</option>{props.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select>}
    <select value={props.severityFilter} onChange={(event) => props.onSeverityFilterChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"><option value="all">Tất cả mức độ</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
    <select value={props.sourceFilter} onChange={(event) => props.onSourceFilterChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"><option value="all">Tất cả nền tảng</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="google_maps">Google Maps</option><option value="thread">Threads</option><option value="news">News</option></select>
    <select value={props.contentTypeFilter} onChange={(event) => props.onContentTypeFilterChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"><option value="all">Tất cả nội dung</option><option value="post">Bài viết</option><option value="comment">Bình luận</option></select>
    <select value={props.timeFilter} onChange={(event) => props.onTimeFilterChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"><option value="all">Toàn thời gian</option><option value="24h">Hôm nay</option><option value="7d">7 ngày qua</option><option value="30d">30 ngày qua</option><option value="single">Ngày cụ thể</option><option value="custom">Khoảng ngày</option></select>
    {props.canViewAllAssignments && <button type="button" onClick={() => props.onMineOnlyChange(!props.showMineOnly)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${props.showMineOnly ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}>Chỉ việc của tôi</button>}
    {props.timeFilter === "single" && <input type="date" value={props.singleDate} onChange={(event) => props.onSingleDateChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />}
    {props.timeFilter === "custom" && <><input type="date" value={props.customStartDate} onChange={(event) => props.onCustomStartDateChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" /><input type="date" value={props.customEndDate} onChange={(event) => props.onCustomEndDateChange(event.target.value)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" /></>}
  </div>;
}
