"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  UserPlus,
} from "lucide-react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { createAlertWorkbenchHref } from "@/lib/alert-navigation";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { canPerformAction } from "@/lib/rbac";
import { useAlertStore, type AlertData } from "@/stores/alert.store";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_RETURN_CONFIG,
  createDashboardReturnHref,
  getAppScrollTop,
  loadDashboardReturnContext,
  removeDashboardReturnTokenFromCurrentUrl,
  saveDashboardReturnContext,
  type DashboardReturnContext,
} from "@/lib/dashboard-return-context";

const PAGE_SIZE = 10;

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "high-risk", label: "Critical / Cao" },
  { id: "overdue", label: "Quá SLA" },
  { id: "unassigned", label: "Chưa giao" },
  { id: "processing", label: "Đang xử lý" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];
type StaffOption = {
  uid: string;
  email: string;
  displayName?: string;
  permissions?: string[];
  disabled?: boolean;
};

function normalizeSeverity(value?: string) {
  const severity = String(value || "").toLowerCase();
  if (severity === "critical" || severity === "urgent") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium" || severity === "normal") return "medium";
  return "low";
}

function getSlaInfo(alert: AlertData) {
  const severity = normalizeSeverity(alert.severity);
  const limitHours = severity === "critical" ? 1 : severity === "high" ? 2 : severity === "medium" ? 4 : 8;
  const createdAt = new Date(alert.created_at).getTime();
  const usedMinutes = Number.isFinite(createdAt) ? Math.max(0, Math.floor((Date.now() - createdAt) / 60000)) : 0;
  const limitMinutes = limitHours * 60;
  const isTerminal = ["resolved", "contact_failed"].includes(getAlertWorkflowStatus(alert));
  const overdueMinutes = Math.max(0, usedMinutes - limitMinutes);

  if (isTerminal) return { isOverdue: false, label: "Đã kết thúc", percent: 100 };
  if (overdueMinutes > 0) {
    const label = overdueMinutes >= 60
      ? `Quá ${Math.floor(overdueMinutes / 60)}g ${overdueMinutes % 60}p`
      : `Quá ${overdueMinutes}p`;
    return { isOverdue: true, label, percent: 100 };
  }
  return {
    isOverdue: false,
    label: `Còn ${Math.max(1, limitMinutes - usedMinutes)}p`,
    percent: Math.min(100, Math.round((usedMinutes / limitMinutes) * 100)),
  };
}

function getStatusInfo(alert: AlertData) {
  const status = getAlertWorkflowStatus(alert);
  if (status === "resolved") return { label: "Đã giải quyết", dot: "bg-emerald-500", text: "text-emerald-700" };
  if (status === "contact_failed") return { label: "Liên hệ không thành", dot: "bg-rose-500", text: "text-rose-700" };
  if (status === "processing") return { label: "Đang xử lý", dot: "bg-amber-500", text: "text-amber-700" };
  return { label: "Chưa xử lý", dot: "bg-red-600", text: "text-red-700" };
}

function getSeverityInfo(alert: AlertData) {
  const severity = normalizeSeverity(alert.severity);
  const riskScore = Math.max(0, Math.min(100, alert.negativity_score || (severity === "critical" ? 95 : severity === "high" ? 80 : severity === "medium" ? 60 : 40)));
  if (severity === "critical") return { label: "Critical", score: riskScore, tone: "bg-red-100 text-red-800", bar: "bg-red-700" };
  if (severity === "high") return { label: "Cao", score: riskScore, tone: "bg-orange-100 text-orange-800", bar: "bg-orange-600" };
  if (severity === "medium") return { label: "Trung bình", score: riskScore, tone: "bg-indigo-100 text-indigo-800", bar: "bg-indigo-600" };
  return { label: "Thấp", score: riskScore, tone: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-600" };
}

function sourceUrl(alert: AlertData) {
  return [alert.url, alert.post_url, alert.social_profile_url].find((url) => Boolean(url && url !== "#"));
}

export function CrisisTable({ alerts }: { alerts: AlertData[] }) {
  const { profile } = useAuth();
  const lockAlertForResolution = useAlertStore((state) => state.lockAlertForResolution);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [highlightedAlertId, setHighlightedAlertId] = useState<string | null>(null);
  const pendingRestoreContext = useRef<DashboardReturnContext | null>(null);
  const isRestoringContext = useRef(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [assignmentAlertId, setAssignmentAlertId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const canAssign = profile?.role === "brand_manager" && canPerformAction(profile, "update_crisis_status");
  const dashboardReturnToken = DASHBOARD_RETURN_CONFIG["crisis-monitoring"].token;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const context = loadDashboardReturnContext(params.get("dashboardReturnToken"));
    if (!context || context.origin !== "crisis-monitoring") return;
    isRestoringContext.current = true;
    if (FILTERS.some((filter) => filter.id === context.filter)) {
      setActiveFilter(context.filter as FilterId);
    }
    setSearchText(context.searchText || "");
    setPage(Math.max(1, Math.floor(context.page || 1)));
    setHighlightedAlertId(context.selectedItemId || null);
    pendingRestoreContext.current = context;
    removeDashboardReturnTokenFromCurrentUrl();
  }, []);

  useEffect(() => {
    if (!canAssign) return;
    const loadStaff = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const response = await fetch("/api/staff", { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json();
        if (response.ok) {
          setStaff((payload.data || []).filter((item: StaffOption) => !item.disabled && (item.permissions || []).includes("alerts")));
        }
      } catch (error) {
        console.warn("[CrisisTable] Không thể tải danh sách nhân viên:", error);
      }
    };
    void loadStaff();
  }, [canAssign]);

  const filteredAlerts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return alerts
      .filter((alert) => {
        if (query && ![alert.text, alert.author, alert.topic, alert.source].some((value) => String(value || "").toLowerCase().includes(query))) return false;
        const severity = normalizeSeverity(alert.severity);
        const status = getAlertWorkflowStatus(alert);
        if (activeFilter === "high-risk") return severity === "critical" || severity === "high";
        if (activeFilter === "overdue") return getSlaInfo(alert).isOverdue;
        if (activeFilter === "unassigned") return !alert.being_resolved_by && !["resolved", "contact_failed"].includes(status);
        if (activeFilter === "processing") return status === "processing";
        return true;
      })
      .sort((left, right) => {
        const scoreDiff = getSeverityInfo(right).score - getSeverityInfo(left).score;
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
  }, [activeFilter, alerts, searchText]);

  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageAlerts = filteredAlerts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (isRestoringContext.current) return;
    setPage(1);
  }, [activeFilter, searchText]);
  useEffect(() => {
    if (alerts.length > 0 && page > pageCount) setPage(pageCount);
  }, [alerts.length, page, pageCount]);

  useEffect(() => {
    const context = pendingRestoreContext.current;
    if (!context || alerts.length === 0) return;
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`dashboard-alert-row-${context.selectedItemId}`);
      if (row) {
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        const scrollRoot = document.querySelector<HTMLElement>('[data-app-scroll-root="true"]');
        if (scrollRoot) scrollRoot.scrollTo({ top: Math.max(0, context.scrollTop), behavior: "smooth" });
        else window.scrollTo({ top: Math.max(0, context.scrollTop), behavior: "smooth" });
      }
      pendingRestoreContext.current = null;
      isRestoringContext.current = false;
    }, 160);
    const highlightTimer = window.setTimeout(() => setHighlightedAlertId(null), 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(highlightTimer);
    };
  }, [activeFilter, alerts.length, page, pageAlerts, searchText]);

  const rememberDashboardContext = (alert: AlertData) => {
    saveDashboardReturnContext({
      token: dashboardReturnToken,
      origin: "crisis-monitoring",
      returnPath: DASHBOARD_RETURN_CONFIG["crisis-monitoring"].path,
      filter: activeFilter,
      searchText,
      page: safePage,
      selectedItemId: alert.id,
      scrollTop: getAppScrollTop(),
      savedAt: new Date().toISOString(),
    });
    window.history.replaceState(
      window.history.state,
      "",
      createDashboardReturnHref("crisis-monitoring", dashboardReturnToken),
    );
  };

  const handleAssign = async (alert: AlertData, staffUid: string) => {
    const selectedStaff = staff.find((item) => item.uid === staffUid);
    if (!selectedStaff) return;
    setAssigning(alert.id);
    try {
      await lockAlertForResolution(alert.id, {
        ...profile,
        uid: selectedStaff.uid,
        email: selectedStaff.email,
        displayName: selectedStaff.displayName,
      } as any);
      setToast({ message: `Đã giao sự vụ cho ${selectedStaff.displayName || selectedStaff.email}.` });
      setAssignmentAlertId(null);
    } catch (error) {
      console.error("[CrisisTable] Giao nhiệm vụ thất bại:", error);
      setToast({ message: "Không thể giao nhiệm vụ. Vui lòng thử lại.", error: true });
    } finally {
      setAssigning(null);
      window.setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[#DDD9E8] bg-white shadow-[0_8px_24px_rgba(30,31,36,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#EEEAF6] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#1A1B20]">Danh sách sự vụ khẩn cấp ({filteredAlerts.length})</h2>
          <p className="mt-1 text-xs font-medium text-[#6E6A7C]">Ưu tiên theo điểm rủi ro; chọn nội dung để mở đúng mention tại trang Cảnh báo.</p>
        </div>
        <label className="flex h-10 min-w-[260px] items-center gap-2 rounded-lg border border-[#D8D4E3] bg-white px-3 focus-within:border-[#5B4FCF]">
          <Search className="h-4 w-4 text-[#787585]" />
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Tìm nội dung hoặc người đăng..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#A09CAC]" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#EEEAF6] px-5 py-3">
        {FILTERS.map((filter) => (
          <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold transition-colors", activeFilter === filter.id ? "border-[#5B4FCF] bg-[#5B4FCF] text-white" : "border-[#DDD9E8] bg-white text-[#514D5E] hover:bg-[#F7F5FC]")}>{filter.label}</button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead className="bg-[#F8F7FC] text-[11px] font-black uppercase tracking-wide text-[#6E6A7C]">
            <tr>
              <th className="px-5 py-3">Sự vụ & nội dung</th>
              <th className="px-4 py-3">Nền tảng</th>
              <th className="px-4 py-3">Rủi ro</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Phụ trách</th>
              <th className="px-5 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEAF6]">
            {pageAlerts.map((alert) => {
              const severity = getSeverityInfo(alert);
              const sla = getSlaInfo(alert);
              const status = getStatusInfo(alert);
              const url = sourceUrl(alert);
              return (
                <tr id={`dashboard-alert-row-${alert.id}`} key={alert.id} className={cn("align-middle hover:bg-[#FCFBFF]", highlightedAlertId === alert.id && "bg-[#EEEBFF] ring-2 ring-inset ring-[#5B4FCF]")}>
                  <td className="max-w-[390px] px-5 py-4">
                    <Link href={createAlertWorkbenchHref(alert, { origin: "crisis-monitoring", token: dashboardReturnToken })} onClick={() => rememberDashboardContext(alert)} onAuxClick={() => rememberDashboardContext(alert)} onContextMenu={() => rememberDashboardContext(alert)} className="group block">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-black uppercase", severity.tone)}>{severity.label}</span>
                        <span className="text-[11px] font-semibold text-[#787585]">{alert.topic || "Khác"}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[#1A1B20] group-hover:text-[#5B4FCF]">{alert.text || "Nội dung cảnh báo chưa được cung cấp"}</p>
                      <p className="mt-1 text-xs text-[#787585]">{alert.author || "Người dùng ẩn danh"} · {new Date(alert.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#36323F]"><PlatformLogo platform={alert.source} size="sm" /><span className="capitalize">{alert.source || "Khác"}</span></div>
                  </td>
                  <td className="w-[135px] px-4 py-4">
                    <div className="text-sm font-black text-[#BA1A1A]">{Math.round(severity.score)}/100</div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#EEEAF6]"><div className={cn("h-1.5 rounded-full", severity.bar)} style={{ width: `${severity.score}%` }} /></div>
                  </td>
                  <td className="px-4 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", sla.isOverdue ? "bg-red-100 text-red-700" : "bg-indigo-50 text-indigo-700")}>{sla.label}</span></td>
                  <td className="px-4 py-4"><span className={cn("inline-flex items-center gap-2 text-xs font-bold", status.text)}><span className={cn("h-2 w-2 rounded-full", status.dot)} />{status.label}</span></td>
                  <td className="max-w-[170px] px-4 py-4"><span className={cn("block truncate text-xs font-bold", alert.being_resolved_by ? "text-[#36323F]" : "text-amber-700")}>{alert.being_resolved_by || "Chưa giao"}</span></td>
                  <td className="relative px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {canAssign && (
                        <button type="button" onClick={() => setAssignmentAlertId(assignmentAlertId === alert.id ? null : alert.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4E3] px-3 text-xs font-bold text-[#4234B6] hover:bg-[#F3F0FF]"><UserPlus className="h-4 w-4" />Giao nhiệm vụ</button>
                      )}
                      <button type="button" disabled={!url} onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4E3] px-3 text-xs font-bold text-[#4234B6] hover:bg-[#F3F0FF] disabled:cursor-not-allowed disabled:opacity-45"><ExternalLink className="h-4 w-4" />Mở nguồn</button>
                    </div>
                    {assignmentAlertId === alert.id && (
                      <div className="absolute right-5 top-[58px] z-20 w-64 rounded-xl border border-[#D8D4E3] bg-white p-2 shadow-xl">
                        <div className="px-2 pb-2 text-[11px] font-black uppercase text-[#787585]">Chọn nhân viên xử lý</div>
                        <div className="max-h-56 overflow-y-auto">
                          {staff.length > 0 ? staff.map((item) => (
                            <button key={item.uid} type="button" disabled={assigning === alert.id} onClick={() => void handleAssign(alert, item.uid)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[#F7F5FC] disabled:opacity-50">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECE9FF] text-[10px] font-black text-[#4234B6]">{(item.displayName || item.email).slice(0, 2).toUpperCase()}</span>
                              <span className="min-w-0"><span className="block truncate text-xs font-bold text-[#1A1B20]">{item.displayName || item.email}</span><span className="block truncate text-[10px] text-[#787585]">{item.email}</span></span>
                            </button>
                          )) : <div className="px-2 py-3 text-center text-xs text-[#787585]">Chưa có nhân viên phù hợp.</div>}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {pageAlerts.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-sm font-medium text-[#787585]">Không có sự vụ phù hợp với bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#EEEAF6] px-5 py-4 text-xs font-medium text-[#6E6A7C]">
        <span>{filteredAlerts.length > 0 ? `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredAlerts.length)} trong ${filteredAlerts.length}` : "Không có dữ liệu"}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D4E3] disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-12 text-center font-bold text-[#36323F]">{safePage}/{pageCount}</span>
          <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D4E3] disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {toast && <div className={cn("fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl", toast.error ? "bg-red-700" : "bg-emerald-700")}>{toast.message}</div>}
    </section>
  );
}
