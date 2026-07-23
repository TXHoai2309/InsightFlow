"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { getLeadWorkbenchMeta, sortLeadsForWorkbench } from "@/lib/lead-workbench";
import type { Lead } from "@/types/dashboard";
import { useLeadMonitoringLeads } from "./useLeadMonitoringLeads";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/stores/dashboard.store";
import { getLeadOperationErrorMessage } from "@/lib/services/dashboard";
import { createLeadWorkbenchHref } from "@/lib/mention-navigation";
import {
  DASHBOARD_RETURN_CONFIG,
  createDashboardReturnHref,
  getAppScrollTop,
  loadDashboardReturnContext,
  removeDashboardReturnTokenFromCurrentUrl,
  saveDashboardReturnContext,
  type DashboardReturnContext,
} from "@/lib/dashboard-return-context";
import { isDemoPath } from "@/lib/demo-navigation";
import { dummyStaff } from "@/lib/demoData";

const filterChips = [
  { id: "all", label: "Tất cả" },
  { id: "hot", label: "Hot" },
  { id: "overdue", label: "Quá SLA" },
  { id: "unassigned", label: "Chưa gán" },
  { id: "uncontacted", label: "Chưa phản hồi" },
] as const;

type FilterChip = (typeof filterChips)[number]["id"];

function getAvatarInitials(name?: string) {
  if (!name) return "KH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getScoreInfo(lead: Lead) {
  const meta = getLeadWorkbenchMeta(lead);
  const score = meta.priorityScore;
  const intent = lead.intent;

  if (intent === "hot") {
    return {
      score,
      label: "Hot",
      color: "text-[#BA1A1A]",
      bar: "#BA1A1A",
      tag: "bg-[#FFDAD6] text-[#410002]",
    };
  }
  if (intent === "warm") {
    return {
      score,
      label: "Warm",
      color: "text-[#A14A00]",
      bar: "#D97706",
      tag: "bg-[#FFE2C7] text-[#5B2A00]",
    };
  }
  return {
    score,
    label: "Cold",
    color: "text-[#4234B6]",
    bar: "#5B4FCF",
    tag: "bg-[#E2DFFF] text-[#0F0069]",
  };
}

function getStatusInfo(status: Lead["status"]) {
  switch (status) {
    case "new":
      return { label: "Chưa phản hồi", dot: "bg-[#BA1A1A]", text: "text-[#BA1A1A]" };
    case "processing":
      return { label: "Đang tư vấn", dot: "bg-[#D97706]", text: "text-[#A14A00]" };
    case "completed":
      return { label: "Đã chốt", dot: "bg-[#22C55E]", text: "text-[#147A3F]" };
    case "skipped":
      return { label: "Bỏ qua", dot: "bg-[#787585]", text: "text-[#474554]" };
    default:
      return { label: "Chưa rõ", dot: "bg-[#787585]", text: "text-[#474554]" };
  }
}

function formatSla(lead: Lead) {
  const meta = getLeadWorkbenchMeta(lead);
  if (!meta.isPending) return { label: "Đã xử lý", tone: "bg-[#D7F4E2] text-[#147A3F]" };
  if (meta.isOverdue) {
    const minutes = Math.max(1, Math.ceil(Math.abs(meta.remainingMs) / 60000));
    return { label: `Quá ${minutes}p`, tone: "bg-[#FFDAD6] text-[#BA1A1A]" };
  }
  const minutes = Math.max(1, Math.ceil(meta.remainingMs / 60000));
  if (minutes < 60) return { label: `Còn ${minutes}p`, tone: "bg-[#FFF1D6] text-[#A14A00]" };
  const hours = Math.ceil(minutes / 60);
  return { label: `Còn ${hours}g`, tone: "bg-[#E2DFFF] text-[#4234B6]" };
}

function getLeadSignal(lead: Lead) {
  const signals = lead.intent_signals?.filter(Boolean).slice(0, 2) || [];
  if (signals.length > 0) return signals.join(", ");

  const content = lead.content.toLowerCase();
  if (/giá|gia|sỉ|si|order|mua|đặt|dat/.test(content)) return "Hỏi mua / hỏi giá";
  if (/ship|giao|còn hàng|con hang/.test(content)) return "Hỏi giao hàng / tồn kho";
  return "Cần kiểm tra thêm";
}

function calculateResponseTime(created: string, firstContacted?: string) {
  if (!firstContacted) return "Chưa phản hồi";
  const diff = new Date(firstContacted).getTime() - new Date(created).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} phút`;
  return `${Math.floor(mins / 60)} giờ`;
}

export function LeadTable() {
  const pathname = usePathname();
  const monitoringLeads = useLeadMonitoringLeads();
  const { profile } = useAuth();
  const { updateLeadDetails } = useDashboardStore();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      if (isDemoPath(pathname)) {
        setStaffList(dummyStaff.filter((item) => item.permissions.includes("leads")).map((item) => ({ ...item })));
        return;
      }
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStaffList(data.data || []);
        }
      } catch (e) {
        console.warn("Failed to fetch staff list:", e);
      }
    };
    fetchStaff();
  }, [pathname]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAssign = async (lead: Lead, staff: any | null) => {
    if (!profile) return;
    const nowIso = new Date().toISOString();
    const ownerData: any = staff
      ? {
          owner_id: staff.uid,
          owner_name: staff.displayName || staff.email || "Nhân viên xử lý",
          owner_email: staff.email,
          assigned_at: nowIso,
          assigned_by: profile.uid,
          claimed_at: nowIso,
        }
      : {
          owner_id: null,
          owner_name: null,
          owner_email: null,
          assigned_at: null,
          assigned_by: null,
          claimed_at: null,
        };
    try {
      await updateLeadDetails(lead.id, ownerData, profile);
      showToast(
        staff
          ? `Giao việc thành công cho ${staff.displayName || staff.email}!`
          : "Đã hủy gán việc thành công!",
        "success"
      );
    } catch (err: any) {
      console.error("[LeadTable] Failed to assign lead:", err);
      showToast(
        getLeadOperationErrorMessage(
          err,
          "Giao việc thất bại. Không thể lưu thông tin vào cơ sở dữ liệu.",
        ),
        "error"
      );
    }
  };

  const rawLeads = useMemo(
    () => sortLeadsForWorkbench(monitoringLeads),
    [monitoringLeads],
  );
  const [activeFilter, setActiveFilter] = useState<FilterChip>("hot");
  const [page, setPage] = useState(1);
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  const pendingRestoreContext = useRef<DashboardReturnContext | null>(null);
  const itemsPerPage = 8;
  const dashboardReturnToken = DASHBOARD_RETURN_CONFIG["lead-monitoring"].token;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const context = loadDashboardReturnContext(params.get("dashboardReturnToken"));
    if (!context || context.origin !== "lead-monitoring") return;
    if (filterChips.some((chip) => chip.id === context.filter)) {
      setActiveFilter(context.filter as FilterChip);
    }
    setPage(Math.max(1, Math.floor(context.page || 1)));
    setHighlightedLeadId(context.selectedItemId || null);
    pendingRestoreContext.current = context;
    removeDashboardReturnTokenFromCurrentUrl();
  }, []);

  const filteredLeads = useMemo(() => {
    if (activeFilter === "all") return rawLeads;
    return rawLeads.filter((lead) => {
      const meta = getLeadWorkbenchMeta(lead);
      if (activeFilter === "hot") return lead.intent === "hot";
      if (activeFilter === "overdue") return meta.isOverdue;
      if (activeFilter === "unassigned") return !lead.owner_id && meta.isPending;
      if (activeFilter === "uncontacted") return lead.status === "new" && !lead.first_contacted_at;
      return true;
    });
  }, [activeFilter, rawLeads]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));
  const leads = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, page, totalPages]);

  useEffect(() => {
    if (rawLeads.length === 0) return;
    setPage((current) => Math.min(Math.max(1, current), totalPages));
  }, [rawLeads.length, totalPages]);

  useEffect(() => {
    const context = pendingRestoreContext.current;
    if (!context || rawLeads.length === 0) return;
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`dashboard-lead-row-${context.selectedItemId}`);
      if (row) {
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        const scrollRoot = document.querySelector<HTMLElement>('[data-app-scroll-root="true"]');
        if (scrollRoot) scrollRoot.scrollTo({ top: Math.max(0, context.scrollTop), behavior: "smooth" });
        else window.scrollTo({ top: Math.max(0, context.scrollTop), behavior: "smooth" });
      }
      pendingRestoreContext.current = null;
    }, 160);
    const highlightTimer = window.setTimeout(() => setHighlightedLeadId(null), 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(highlightTimer);
    };
  }, [activeFilter, leads, page, rawLeads.length]);

  const rememberDashboardContext = (lead: Lead) => {
    saveDashboardReturnContext({
      token: dashboardReturnToken,
      origin: "lead-monitoring",
      returnPath: DASHBOARD_RETURN_CONFIG["lead-monitoring"].path,
      filter: activeFilter,
      page: Math.min(page, totalPages),
      selectedItemId: lead.id,
      scrollTop: getAppScrollTop(),
      savedAt: new Date().toISOString(),
    });
    window.history.replaceState(
      window.history.state,
      "",
      createDashboardReturnHref("lead-monitoring", dashboardReturnToken),
    );
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#E9E7EE] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#E9E7EE] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-sans text-[18px] font-bold text-[#1A1B20]">
            Danh sách lead ưu tiên ({filteredLeads.length})
          </h2>
          <p className="mt-1 text-[13px] text-[#787585]">
            Mặc định hiển thị hot lead để khớp KPI tổng quan; chọn Tất cả để xem toàn bộ lead
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setActiveFilter(chip.id);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                activeFilter === chip.id
                  ? "border-[#4234B6] bg-[#4234B6] text-white"
                  : "border-[#E9E7EE] bg-white text-[#474554] hover:bg-[#F4F3FA]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left font-sans">
          <thead className="sticky top-0 z-10 bg-[#F4F3FA]">
            <tr>
              {["Khách hàng", "Tín hiệu mua hàng", "Điểm", "SLA", "Trạng thái", "Phụ trách", "Phản hồi", "Hành động"].map((head) => (
                <th key={head} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#474554]">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7EE]">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[14px] text-[#787585]">
                  Không có lead phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const scoreInfo = getScoreInfo(lead);
                const statusInfo = getStatusInfo(lead.status);
                const sla = formatSla(lead);
                const sourceHref = lead.url || lead.source_url;
                const leadHref = createLeadWorkbenchHref(lead, {
                  origin: "lead-monitoring",
                  token: dashboardReturnToken,
                });

                return (
                  <tr id={`dashboard-lead-row-${lead.id}`} key={lead.id} className={`transition-colors hover:bg-[#FAF8FF] ${highlightedLeadId === lead.id ? "bg-[#EEEBFF] ring-2 ring-inset ring-[#5B4FCF]" : ""}`}>
                    <td className="px-5 py-4 align-top">
                      <Link href={leadHref} onClick={() => rememberDashboardContext(lead)} onAuxClick={() => rememberDashboardContext(lead)} onContextMenu={() => rememberDashboardContext(lead)} className="flex items-center gap-3 rounded-lg outline-none transition hover:text-[#4234B6] focus-visible:ring-2 focus-visible:ring-[#4234B6]/30" title="Xem mention tại trang Khách hàng">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDF4] text-[13px] font-bold text-[#4234B6]">
                          {getAvatarInitials(lead.author)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#1A1B20]">
                            {lead.author || "Khách hàng"}
                          </p>
                          <p className="mt-0.5 text-[12px] capitalize text-[#787585]">
                            {lead.platform} · {lead.id.substring(0, 8)}
                          </p>
                        </div>
                      </Link>
                    </td>

                    <td className="max-w-[340px] px-5 py-4 align-top">
                      <Link href={leadHref} onClick={() => rememberDashboardContext(lead)} onAuxClick={() => rememberDashboardContext(lead)} onContextMenu={() => rememberDashboardContext(lead)} className="block rounded-lg outline-none transition hover:bg-[#F4F3FA] focus-visible:ring-2 focus-visible:ring-[#4234B6]/30" title="Xem mention tại trang Khách hàng">
                        <p className="text-[13px] font-bold text-[#1A1B20]">
                          {getLeadSignal(lead)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#474554]">
                          “{lead.content}”
                        </p>
                      </Link>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex min-w-[90px] flex-col gap-2">
                        <span className={`text-[14px] font-bold ${scoreInfo.color}`}>
                          {scoreInfo.score}/100
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EEEDF4]">
                          <div className="h-full rounded-full" style={{ width: `${scoreInfo.score}%`, backgroundColor: scoreInfo.bar }} />
                        </div>
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${scoreInfo.tag}`}>
                          {scoreInfo.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold ${sla.tone}`}>
                        {sla.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dot}`} />
                        <span className={`text-[13px] font-bold ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {lead.owner_name ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E2DFFF] text-[11px] font-bold text-[#4234B6]">
                            {getAvatarInitials(lead.owner_name)}
                          </div>
                          <span className="text-[13px] font-semibold text-[#1A1B20]">
                            {lead.owner_name}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-[#FFF1D6] px-2.5 py-1 text-[12px] font-bold text-[#A14A00]">
                          Chưa gán
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className="text-[13px] font-semibold text-[#474554]">
                        {calculateResponseTime(lead.created_at, lead.first_contacted_at)}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2 relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigningLeadId(assigningLeadId === lead.id ? null : lead.id);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E9E7EE] hover:bg-[#F4F3FA] transition-all ${
                            lead.owner_id ? "text-[#4234B6] bg-[#F4F3FA]" : "text-[#787585]"
                          }`}
                          title="Gán nhân sự"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>

                        {assigningLeadId === lead.id && (
                          <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 border border-[#E9E7EE] max-h-48 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-[#787585] uppercase tracking-wider border-b border-[#E9E7EE] mb-1">
                              Chọn nhân sự phụ trách
                            </div>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setAssigningLeadId(null);
                                await handleAssign(lead, null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#BA1A1A] hover:bg-[#FFDAD6]/30 font-bold transition-colors"
                            >
                              -- Hủy gán --
                            </button>
                            {staffList.map((staff) => (
                              <button
                                key={staff.uid}
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setAssigningLeadId(null);
                                  await handleAssign(lead, staff);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-[#1A1B20] hover:bg-[#F4F3FA] font-medium transition-colors border-t border-[#F4F3FA]"
                              >
                                {staff.displayName || staff.email}
                              </button>
                            ))}
                          </div>
                        )}

                        {sourceHref ? (
                          <a href={sourceHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E9E7EE] text-[#474554] hover:bg-[#F4F3FA] transition-all" title="Mở bài gốc">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <Link href={leadHref} onClick={() => rememberDashboardContext(lead)} onAuxClick={() => rememberDashboardContext(lead)} onContextMenu={() => rememberDashboardContext(lead)} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E9E7EE] text-[#787585] hover:bg-[#F4F3FA]" title="Xem tại trang Khách hàng">
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#E9E7EE] px-5 py-4">
        <span className="text-[13px] text-[#787585]">
          Hiển thị {leads.length > 0 ? (Math.min(page, totalPages) - 1) * itemsPerPage + 1 : 0} đến {Math.min(Math.min(page, totalPages) * itemsPerPage, filteredLeads.length)} trong {filteredLeads.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#474554] transition-colors hover:bg-[#EEEDF4] disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#474554] transition-colors hover:bg-[#EEEDF4] disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-bold shadow-2xl animate-fade-in ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
