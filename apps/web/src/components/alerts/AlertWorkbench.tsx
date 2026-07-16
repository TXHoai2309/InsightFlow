"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, PanelRightOpen, RefreshCw, Search } from "lucide-react";
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
  const isPanelOpen = Boolean(props.selectedAlert && !props.panelCollapsed);

  return (
    <div className="space-y-[clamp(8px,0.8vw,14px)]">
      <header className="flex flex-col gap-3 min-[1320px]:flex-row min-[1320px]:items-center min-[1320px]:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black text-[var(--color-text-primary)] md:text-2xl">Cảnh báo khủng hoảng</h1>
            {urgentCount > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700">{urgentCount} cảnh báo ưu tiên</span>}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Chọn cảnh báo bên trái và xử lý nghiệp vụ trực tiếp trong panel.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 min-[1320px]:w-auto">
          <label className="relative min-w-[220px] flex-1 min-[1320px]:w-[20rem] min-[1320px]:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
            <input value={props.searchText} onChange={(event) => props.onSearchTextChange(event.target.value)} placeholder="Tìm nội dung hoặc người đăng..." className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20" />
          </label>
          <button type="button" onClick={() => void props.onRefresh()} disabled={props.isRefreshing} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)] disabled:opacity-50"><RefreshCw size={17} className={props.isRefreshing ? "animate-spin" : ""} />Làm mới</button>
          <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"><Filter size={17} />Bộ lọc</button>
          {props.selectedAlert && props.panelCollapsed && <button type="button" onClick={props.onOpenPanel} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-bold text-[var(--color-brand)]"><PanelRightOpen size={17} />Xem chi tiết</button>}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiButton label="Tất cả đang mở" value={counts.pending + counts.processing + counts.contact_failed} hint={`${urgentCount} cảnh báo Critical/High`} tone="red" active={props.statusFilter === "all"} onClick={() => props.onStatusFilterChange("all")} />
        <KpiButton label="Chưa phân công" value={counts.pending} hint="Chưa có người nhận" tone="amber" active={props.statusFilter === "pending"} onClick={() => props.onStatusFilterChange("pending")} />
        <KpiButton label="Đang xử lý" value={counts.processing} hint={props.canViewAllAssignments ? "Đã có người phụ trách" : "Cảnh báo bạn đang phụ trách"} tone="blue" active={props.statusFilter === "processing"} onClick={() => props.onStatusFilterChange("processing")} />
        <KpiButton label="Giải quyết thất bại" value={counts.contact_failed} hint={props.canViewAllAssignments ? "Cần liên hệ lại" : "Việc của bạn cần liên hệ lại"} tone="red" active={props.statusFilter === "contact_failed"} onClick={() => props.onStatusFilterChange("contact_failed")} />
        <KpiButton label="Đã giải quyết" value={counts.resolved} hint={props.canViewAllAssignments ? "Đã lưu kết quả" : "Kết quả xử lý của bạn"} tone="green" active={props.statusFilter === "resolved"} onClick={() => props.onStatusFilterChange("resolved")} />
      </section>

      <section className="space-y-2">
        <div className="flex justify-end">
          <select value={props.sortBy} onChange={(event) => props.onSortChange(event.target.value as AlertWorkbenchProps["sortBy"])} className="w-fit rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"><option value="risk">Rủi ro cao trước</option><option value="newest">Mới nhất</option><option value="reach">Tiếp cận cao nhất</option></select>
        </div>

        {showFilters && <FilterPanel {...props} />}
        {props.error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{props.error}</div>}

        <div className={`grid w-full items-start gap-y-[1vh] ${isPanelOpen ? "min-[1100px]:grid-cols-[32%_minmax(0,1fr)] min-[1100px]:gap-x-[0.75%]" : "grid-cols-1"}`}>
          <main data-tour="alerts-queue-list" className="min-w-0 scroll-mt-24 self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
            <header className="flex items-center justify-between border-b border-[var(--color-border)] px-[4%] py-[3%]"><div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Danh sách cảnh báo</h2><p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{STATUS_VIEWS.find((view) => view.id === props.statusFilter)?.label || "Cảnh báo đang mở"}</p></div><span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-black text-[var(--color-text-primary)]">{props.totalFiltered}</span></header>
            <div className="space-y-[2.5%] p-[3%]">
              {props.isLoading && props.pageAlerts.length === 0 ? [0, 1, 2].map((item) => <div key={item} className="h-[18vh] animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]" />) : props.pageAlerts.length === 0 ? <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] p-[8%] text-center"><p className="text-sm font-black text-[var(--color-text-primary)]">Không có cảnh báo phù hợp</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{props.canViewAllAssignments ? "Thử chọn trạng thái hoặc điều chỉnh bộ lọc." : "Không có cảnh báo nào đang chờ bạn xử lý."}</p></div> : props.pageAlerts.map((alert) => <AlertWorkbenchRow key={alert.id} alert={alert} selected={props.selectedAlertId === alert.id} onSelect={props.onSelectAlert} getResolverName={props.getResolverName} />)}
            </div>
            {props.totalFiltered > 0 && <footer className="flex items-center justify-between border-t border-[var(--color-border)] px-[4%] py-[3%] text-xs text-[var(--color-text-secondary)]"><span>{props.totalFiltered} cảnh báo</span><div className="flex items-center gap-2"><button type="button" onClick={() => props.onPageChange(props.currentPage - 1)} disabled={props.currentPage === 1} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40" title="Trang trước"><ChevronLeft size={16} /></button><span className="min-w-10 text-center font-black text-[var(--color-text-primary)]">{props.currentPage}/{props.totalPages}</span><button type="button" onClick={() => props.onPageChange(props.currentPage + 1)} disabled={props.currentPage === props.totalPages} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40" title="Trang sau"><ChevronRight size={16} /></button></div></footer>}
          </main>

          {props.selectedAlert && !props.panelCollapsed && <AlertDetailPanel alert={props.selectedAlert} activeTab={props.detailTab} onTabChange={props.onDetailTabChange} profileEmail={props.profileEmail} canUpdate={props.canUpdate} getResolverName={props.getResolverName} onClose={props.onCollapsePanel} onClaim={props.onClaim} onRecordResult={props.onRecordResult} onOpenSource={props.onOpenSource} />}
        </div>
      </section>
    </div>
  );
}

function KpiButton({ label, value, hint, tone, active, onClick }: { label: string; value: number; hint: string; tone: "red" | "amber" | "blue" | "green"; active: boolean; onClick: () => void }) {
  const toneClass = { red: "text-red-600 bg-red-50 border-red-100", amber: "text-amber-600 bg-amber-50 border-amber-100", blue: "text-blue-600 bg-blue-50 border-blue-100", green: "text-green-600 bg-green-50 border-green-100" }[tone];
  return <button type="button" onClick={onClick} className={`flex items-center justify-between rounded-xl border p-3 text-left transition hover:shadow-sm ${toneClass} ${active ? "ring-2 ring-[var(--color-brand)] ring-offset-2" : ""}`}><div><p className="text-xs font-black text-[var(--color-text-primary)]">{label}</p><p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">{hint}</p></div><strong className="text-2xl font-black">{value}</strong></button>;
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
