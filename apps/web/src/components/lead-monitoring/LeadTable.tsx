"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
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
      color: "text-[#BA1A1A] dark:text-red-400",
      bar: "#BA1A1A",
      tag: "bg-[#FFDAD6] text-[#410002] dark:bg-red-500/20 dark:text-red-400",
    };
  }
  if (intent === "warm") {
    return {
      score,
      label: "Warm",
      color: "text-[#A14A00] dark:text-orange-400",
      bar: "#D97706",
      tag: "bg-[#FFE2C7] text-[#5B2A00] dark:bg-orange-500/20 dark:text-orange-400",
    };
  }
  return {
    score,
    label: "Cold",
    color: "text-[#4234B6] dark:text-[#9B8CFF]",
    bar: "#5B4FCF",
    tag: "bg-[#E2DFFF] text-[#0F0069] dark:bg-[#4234B6]/30 dark:text-[#9B8CFF]",
  };
}

function getStatusInfo(status: Lead["status"]) {
  switch (status) {
    case "new":
      return { label: "Chưa phản hồi", dot: "bg-[#BA1A1A]", text: "text-[#BA1A1A] dark:text-red-400" };
    case "processing":
      return { label: "Đang tư vấn", dot: "bg-[#D97706]", text: "text-[#A14A00] dark:text-orange-400" };
    case "completed":
      return { label: "Đã chốt", dot: "bg-[#22C55E]", text: "text-[#147A3F] dark:text-green-400" };
    case "skipped":
      return { label: "Bỏ qua", dot: "bg-[#787585]", text: "text-[#474554] dark:text-gray-400" };
    default:
      return { label: "Chưa rõ", dot: "bg-[#787585]", text: "text-[#474554] dark:text-gray-400" };
  }
}

function formatSla(lead: Lead) {
  const meta = getLeadWorkbenchMeta(lead);
  if (!meta.isPending) return { label: "Đã xử lý", tone: "bg-[#D7F4E2] text-[#147A3F] dark:bg-green-500/20 dark:text-green-400" };
  if (meta.isOverdue) {
    const minutes = Math.max(1, Math.ceil(Math.abs(meta.remainingMs) / 60000));
    return { label: `Quá ${minutes}p`, tone: "bg-[#FFDAD6] text-[#BA1A1A] dark:bg-red-500/20 dark:text-red-400" };
  }
  const minutes = Math.max(1, Math.ceil(meta.remainingMs / 60000));
  if (minutes < 60) return { label: `Còn ${minutes}p`, tone: "bg-[#FFF1D6] text-[#A14A00] dark:bg-orange-500/20 dark:text-orange-400" };
  const hours = Math.ceil(minutes / 60);
  return { label: `Còn ${hours}g`, tone: "bg-[#E2DFFF] text-[#4234B6] dark:bg-[#4234B6]/30 dark:text-[#9B8CFF]" };
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
  const monitoringLeads = useLeadMonitoringLeads();
  const { profile } = useAuth();
  const { updateLeadDetails } = useDashboardStore();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
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
  }, []);

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
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

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

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-[#1A1B20] shadow-sm dark:shadow-none">
      <div className="flex flex-col gap-4 border-b border-[#E9E7EE] dark:border-white/10 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-sans text-[18px] font-bold text-[#1A1B20] dark:text-white">
            Danh sách lead ưu tiên ({filteredLeads.length})
          </h2>
          <p className="mt-1 text-[13px] text-[#787585] dark:text-gray-400">
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
                  ? "border-[#4234B6] bg-[#4234B6] text-white dark:border-[#9B8CFF] dark:bg-[#9B8CFF] dark:text-[#1A1B20]"
                  : "border-[#E9E7EE] dark:border-white/20 bg-white dark:bg-transparent text-[#474554] dark:text-gray-300 hover:bg-[#F4F3FA] dark:hover:bg-white/10"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left font-sans">
          <thead className="sticky top-0 z-10 bg-[#F4F3FA] dark:bg-white/5">
            <tr>
              {["Khách hàng", "Tín hiệu mua hàng", "Điểm", "SLA", "Trạng thái", "Phụ trách", "Phản hồi", "Hành động"].map((head) => (
                <th key={head} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#474554] dark:text-gray-400">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E7EE] dark:divide-white/10">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[14px] text-[#787585] dark:text-gray-400">
                  Không có lead phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const scoreInfo = getScoreInfo(lead);
                const statusInfo = getStatusInfo(lead.status);
                const sla = formatSla(lead);
                const sourceHref = lead.url || lead.source_url;
                const leadHref = createLeadWorkbenchHref(lead);

                return (
                  <tr key={lead.id} className="transition-colors hover:bg-[#FAF8FF] dark:hover:bg-white/5">
                    <td className="px-5 py-4 align-top">
                      <Link href={leadHref} className="flex items-center gap-3 rounded-lg outline-none transition hover:text-[#4234B6] dark:hover:text-[#9B8CFF] focus-visible:ring-2 focus-visible:ring-[#4234B6]/30" title="Xem mention tại trang Khách hàng">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDF4] dark:bg-[#4234B6]/30 text-[13px] font-bold text-[#4234B6] dark:text-[#9B8CFF]">
                          {getAvatarInitials(lead.author)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#1A1B20] dark:text-gray-200">
                            {lead.author || "Khách hàng"}
                          </p>
                          <p className="mt-0.5 text-[12px] capitalize text-[#787585] dark:text-gray-400">
                            {lead.platform} · {lead.id.substring(0, 8)}
                          </p>
                        </div>
                      </Link>
                    </td>

                    <td className="max-w-[340px] px-5 py-4 align-top">
                      <Link href={leadHref} className="block rounded-lg outline-none transition hover:bg-[#F4F3FA] dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#4234B6]/30" title="Xem mention tại trang Khách hàng">
                        <p className="text-[13px] font-bold text-[#1A1B20] dark:text-gray-200">
                          {getLeadSignal(lead)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#474554] dark:text-gray-400">
                          “{lead.content}”
                        </p>
                      </Link>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex min-w-[90px] flex-col gap-2">
                        <span className={`text-[14px] font-bold ${scoreInfo.color}`}>
                          {scoreInfo.score}/100
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EEEDF4] dark:bg-white/10">
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
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E2DFFF] dark:bg-[#4234B6]/30 text-[11px] font-bold text-[#4234B6] dark:text-[#9B8CFF]">
                            {getAvatarInitials(lead.owner_name)}
                          </div>
                          <span className="text-[13px] font-semibold text-[#1A1B20] dark:text-gray-200">
                            {lead.owner_name}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-[#FFF1D6] dark:bg-orange-500/20 px-2.5 py-1 text-[12px] font-bold text-[#A14A00] dark:text-orange-400">
                          Chưa gán
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className="text-[13px] font-semibold text-[#474554] dark:text-gray-400">
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
                          className={`flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E9E7EE] dark:border-white/20 hover:bg-[#F4F3FA] dark:hover:bg-white/10 transition-all ${
                            lead.owner_id ? "text-[#4234B6] dark:text-[#9B8CFF] bg-[#F4F3FA] dark:bg-white/5" : "text-[#787585] dark:text-gray-400"
                          }`}
                          title="Gán nhân sự"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>

                        {assigningLeadId === lead.id && (
                          <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl bg-white dark:bg-[#2A2B35] py-1.5 shadow-xl ring-1 ring-black/5 border border-[#E9E7EE] dark:border-white/10 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-[#787585] dark:text-gray-400 uppercase tracking-wider border-b border-[#E9E7EE] dark:border-white/10 mb-1">
                              Chọn nhân sự phụ trách
                            </div>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setAssigningLeadId(null);
                                await handleAssign(lead, null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#BA1A1A] dark:text-red-400 hover:bg-[#FFDAD6]/30 dark:hover:bg-red-500/10 font-bold transition-colors"
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
                                className="w-full text-left px-3 py-2 text-xs text-[#1A1B20] dark:text-white hover:bg-[#F4F3FA] dark:hover:bg-white/10 font-medium transition-colors border-t border-[#F4F3FA] dark:border-white/10"
                              >
                                {staff.displayName || staff.email}
                              </button>
                            ))}
                          </div>
                        )}

                        {sourceHref ? (
                          <a href={sourceHref} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E9E7EE] dark:border-white/20 text-[#474554] dark:text-gray-400 hover:bg-[#F4F3FA] dark:hover:bg-white/10 transition-all" title="Mở bài gốc">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <Link href={leadHref} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E9E7EE] dark:border-white/20 text-[#787585] dark:text-gray-400 hover:bg-[#F4F3FA] dark:hover:bg-white/10" title="Xem tại trang Khách hàng">
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

      <div className="flex items-center justify-between border-t border-[#E9E7EE] dark:border-white/10 px-5 py-4">
        <span className="text-[13px] text-[#787585] dark:text-gray-400">
          Hiển thị {leads.length > 0 ? (Math.min(page, totalPages) - 1) * itemsPerPage + 1 : 0} đến {Math.min(Math.min(page, totalPages) * itemsPerPage, filteredLeads.length)} trong {filteredLeads.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#474554] dark:text-gray-400 transition-colors hover:bg-[#EEEDF4] dark:hover:bg-white/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#474554] dark:text-gray-400 transition-colors hover:bg-[#EEEDF4] dark:hover:bg-white/10 disabled:opacity-40"
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
