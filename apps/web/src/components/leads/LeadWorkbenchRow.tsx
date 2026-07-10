"use client";

import React, { useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META, normalizeBrandName } from "@/lib/services/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { canPerformAction } from "@/lib/rbac";
import { isSameBrandScope } from "@/lib/brandScope";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import type { LabelChangeRequest, Lead } from "@/types/dashboard";
import {
  getLabelRequestStatusLabel,
  getLabelRequestWorkflowLabel,
  getQueueLabel,
  isPendingLeadRerouteRequest,
} from "@/lib/label-change";
import {
  formatLeadSla,
  getLeadOwnershipMeta,
  getLeadWorkbenchMeta,
  getPrimaryLeadAction,
  getLeadSourceAction,
} from "@/lib/lead-workbench";

interface LeadWorkbenchRowProps {
  lead: Lead;
  rank: number;
  nowMs: number;
  selected?: boolean;
  highlighted?: boolean;
  labelRequest?: LabelChangeRequest;
  staffList?: any[];
  onSelect: (lead: Lead) => void;
  onStartedAction?: (lead: Lead) => void;
}

const INTENT_STYLE = {
  hot: "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
  warm: "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30",
  cold: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30",
  none: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30",
};

export function LeadWorkbenchRow({
  lead,
  rank,
  nowMs,
  selected = false,
  highlighted = false,
  labelRequest,
  staffList = [],
  onSelect,
  onStartedAction,
}: LeadWorkbenchRowProps) {
  const { profile } = useAuth();
  const { updateLeadDetails } = useDashboardStore();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const meta = getLeadWorkbenchMeta(lead, nowMs);
  const ownership = getLeadOwnershipMeta(lead, profile);
  const primaryAction = getPrimaryLeadAction(lead);
  const sourceAction = getLeadSourceAction(lead);
  const platformMeta = PLATFORM_META[lead.platform];
  const isLeadWorkflowBlocked = isPendingLeadRerouteRequest(labelRequest);
  const canEdit =
    isSameBrandScope(profile, lead) &&
    canPerformAction(profile, "update_lead_details");

  const leadReason =
    meta.priorityReasons[0] ||
    lead.intent_signals[0] ||
    "Có tín hiệu quan tâm cần kiểm tra";

  const ownerChipClass =
    ownership.status === "assigned_to_me"
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
      : ownership.status === "unassigned"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300"
        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800/30 dark:bg-slate-900/20 dark:text-slate-400";

  const ctaLabel = isLeadWorkflowBlocked
    ? "Xem trạng thái"
    : ownership.canClaim
    ? "Nhận xử lý"
    : !ownership.canWork
      ? "Xem chi tiết"
      : meta.needsResultCapture
        ? "Ghi nhận kết quả"
        : meta.nextActionLabel;
  const ctaIcon = isLeadWorkflowBlocked
    ? "lock_clock"
    : ownership.canClaim
    ? "person_add"
    : !ownership.canWork
      ? "visibility"
      : meta.needsResultCapture
        ? "task_alt"
        : primaryAction?.icon || sourceAction?.icon || "open_in_new";

  const getOwnerName = () =>
    profile?.displayName || profile?.email || "Nhân viên xử lý";

  const handleClaim = async () => {
    if (!canEdit || !profile) return;
    if (isLeadWorkflowBlocked) {
      onSelect(lead);
      return;
    }
    const nowIso = new Date().toISOString();
    const ownerData: Partial<Lead> = {
      owner_id: profile.uid,
      owner_name: getOwnerName(),
      owner_email: profile.email,
      assigned_at: nowIso,
      assigned_by: profile.uid,
      claimed_at: nowIso,
    };
    await updateLeadDetails(lead.id, ownerData, profile);
    const updatedLead = { ...lead, ...ownerData };
    onStartedAction?.(updatedLead);
    onSelect(updatedLead);
  };

  const handlePrimaryAction = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (isLeadWorkflowBlocked) {
      onSelect(lead);
      return;
    }

    if (ownership.canClaim) {
      try {
        setError("");
        setIsOpening(true);
        await handleClaim();
      } catch (err) {
        console.error(err);
        setError("Không thể nhận xử lý lead này.");
      } finally {
        setIsOpening(false);
      }
      return;
    }

    if (!ownership.canWork || meta.needsResultCapture) {
      onSelect(lead);
      return;
    }

    if (!primaryAction) {
      onSelect(lead);
      return;
    }

    try {
      setError("");
      setIsOpening(true);
 
      const actionData: Partial<Lead> = {
        status: primaryAction.isContact && lead.status === "new" ? "processing" : lead.status,
        last_action_at: new Date().toISOString(),
        last_action_type: primaryAction.actionType,
        last_contact_channel: primaryAction.channel,
        owner_id: lead.owner_id || profile?.uid,
        owner_name: lead.owner_name || getOwnerName(),
        owner_email: lead.owner_email || profile?.email,
        assigned_at: lead.assigned_at || new Date().toISOString(),
        assigned_by: lead.assigned_by || profile?.uid,
      };

      if (primaryAction.isContact) {
        actionData.pending_result = true;
      } else if (lead.pending_result !== undefined) {
        actionData.pending_result = lead.pending_result;
      }

      if (primaryAction.isContact) {
        actionData.contact_attempts = (lead.contact_attempts || 0) + 1;
        actionData.last_contact_at = new Date().toISOString();
        actionData.first_contacted_at =
          lead.first_contacted_at || new Date().toISOString();
      }

      if (canEdit) {
        await updateLeadDetails(lead.id, actionData, profile);
      }

      const updatedLead = { ...lead, ...actionData };
      window.open(primaryAction.href, "_blank", "noopener,noreferrer");
      onStartedAction?.(updatedLead);
      onSelect(updatedLead);
    } catch (err) {
      console.error(err);
      setError("Không thể ghi nhận thao tác trước khi mở liên hệ.");
    } finally {
      setIsOpening(false);
    }
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelect(lead);
  };

  const buttonStyle = isLeadWorkflowBlocked
    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
    : ownership.canClaim
    ? "border border-[var(--color-brand)] text-[var(--color-brand)] bg-transparent hover:bg-[var(--color-brand-subtle)] hover:shadow-sm"
    : meta.needsResultCapture
    ? "bg-amber-500 hover:bg-amber-600 text-white hover:shadow-md"
    : "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] hover:shadow-md";

  return (
    <div
      id={`lead-row-${lead.id}`}
      data-lead-id={lead.id}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(lead)}
      onKeyDown={handleRowKeyDown}
      className={`w-full overflow-hidden rounded-2xl border bg-[var(--color-bg-surface)] p-4 text-left shadow-sm transition-all duration-300 hover:translate-y-[-1px] hover:shadow-md ${
        highlighted
          ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] ring-4 ring-[var(--color-brand)]/20"
          : selected
          ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/10"
          : meta.needsResultCapture
            ? "border-amber-500/60"
            : meta.isOverdue || meta.isUrgent
              ? "border-red-500/50"
              : "border-[var(--color-border)] hover:border-[var(--color-brand-border)]"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Avatar, Name, Metadata, Content */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Rank Badge */}
          <div className="flex flex-col items-center justify-center shrink-0 self-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                rank === 1
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {rank}
            </span>
          </div>

          {/* Avatar and Platform Logo */}
          <div className="relative h-11 w-11 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-bold text-[var(--color-brand)]">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white dark:border-slate-800 bg-[var(--color-bg-surface)] shadow-sm">
              <PlatformLogo platform={lead.platform} size="xs" />
            </span>
          </div>

          {/* Metadata & Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header info */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[15px] text-[var(--color-text-primary)]">
                {lead.author || "Khách hàng"}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded font-semibold">
                {platformMeta?.label || lead.platform}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">
                {normalizeBrandName(lead.workspace_id)}
              </span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${ownerChipClass}`}>
                {ownership.label}
              </span>
              {labelRequest && (
                <span
                  className={`min-w-0 truncate rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                    isLeadWorkflowBlocked
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300"
                      : labelRequest.status === "pending"
                        ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {getLabelRequestStatusLabel(labelRequest.status)} · {getLabelRequestWorkflowLabel(labelRequest)}
                </span>
              )}
            </div>

            {/* Priority Reason pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-100/60 dark:border-red-900/30">
                <span className="material-symbols-outlined text-[14px]">error</span>
                Lý do ưu tiên: {leadReason}
              </span>
            </div>

            {/* Content snippet */}
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {lead.content}
            </p>

            {labelRequest && (
              <div className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)] bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-lg p-2 max-w-fit">
                Yêu cầu sửa nhãn: <span className="text-[var(--color-brand)]">{getQueueLabel(labelRequest.current_queue)}</span> → <span className="text-[var(--color-success)]">{getQueueLabel(labelRequest.requested_queue)}</span>
                {labelRequest.review_note ? ` · ${labelRequest.review_note}` : ""}
              </div>
            )}
            {error && (
              <p className="text-xs font-semibold text-[var(--color-error)]">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Score, SLA, CTA Action */}
        <div className="flex flex-row flex-wrap items-center gap-4 lg:gap-6 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--color-border)]">
          {/* Score & Intent */}
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${INTENT_STYLE[lead.intent]}`}>
              {lead.intent === "none" ? "N/A" : lead.intent}
            </span>
            <div className="text-center">
              <span className="block text-xl font-extrabold text-[var(--color-brand)] leading-none">
                {meta.priorityScore}
              </span>
              <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Độ ưu tiên
              </span>
            </div>
          </div>

          {/* SLA countdown */}
          <div className="flex flex-col gap-0.5 text-left lg:text-right min-w-[100px]">
            <div className="flex items-center lg:justify-end gap-1">
              <span className={`material-symbols-outlined text-[16px] ${
                meta.isOverdue || meta.isUrgent ? "text-[var(--color-error)] animate-pulse" : "text-[var(--color-text-secondary)]"
              }`}>
                {meta.needsResultCapture ? "task_alt" : "schedule"}
              </span>
              <span className={`text-sm font-extrabold tracking-tight ${
                meta.isOverdue || meta.isUrgent ? "text-[var(--color-error)]" : "text-[var(--color-text-secondary)]"
              }`}>
                {formatLeadSla(meta)}
              </span>
            </div>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {meta.needsResultCapture ? "Cần ghi nhận" : "SLA còn lại"}
            </span>
          </div>

          {/* Action Button */}
          <div className="min-w-[130px] flex items-center gap-2 relative">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isOpening}
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold tracking-tight shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none ${buttonStyle}`}
            >
              <span className="material-symbols-outlined text-[16px]">{ctaIcon}</span>
              <span>{isOpening ? "Đang mở..." : ctaLabel}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)] transition-all"
              title="Phân công xử lý"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>

             {showMenu && (
              <div className="absolute right-0 bottom-full mb-2 z-50 w-52 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 border border-[#E9E7EE] max-h-48 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#787585] uppercase tracking-wider border-b border-[#E9E7EE] mb-1">
                  Phân công xử lý
                </div>
                 {canEdit && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      const ownerData: any = {
                        owner_id: null,
                        owner_name: null,
                        owner_email: null,
                        assigned_at: null,
                        assigned_by: null,
                        claimed_at: null,
                      };
                      try {
                        await updateLeadDetails(lead.id, ownerData, profile);
                        showToast("Đã hủy gán việc thành công!", "success");
                        const updatedLead = { ...lead, ...ownerData };
                        onStartedAction?.(updatedLead);
                        onSelect?.(updatedLead);
                      } catch (err: any) {
                        console.error(err);
                        showToast(`Không thể hủy gán việc: ${err?.message || "Lỗi kết nối"}`, "error");
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#BA1A1A] hover:bg-[#FFDAD6]/30 font-bold transition-colors"
                  >
                    -- Hủy gán --
                  </button>
                )}
                {staffList.map((staff: any) => (
                  <button
                    key={staff.uid}
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (!canEdit || !profile) {
                        showToast("Bạn không có quyền thực hiện thao tác này.", "error");
                        return;
                      }
                      const nowIso = new Date().toISOString();
                      const ownerData: any = {
                        owner_id: staff.uid,
                        owner_name: staff.displayName || staff.email || "Nhân viên xử lý",
                        owner_email: staff.email,
                        assigned_at: nowIso,
                        assigned_by: profile.uid,
                        claimed_at: nowIso,
                      };
                      try {
                        await updateLeadDetails(lead.id, ownerData, profile);
                        showToast(`Giao việc thành công cho ${staff.displayName || staff.email}!`, "success");
                        const updatedLead = { ...lead, ...ownerData };
                        onStartedAction?.(updatedLead);
                        onSelect?.(updatedLead);
                      } catch (err: any) {
                        console.error(err);
                        showToast(`Không thể giao việc: ${err?.message || "Lỗi kết nối"}`, "error");
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#1A1B20] hover:bg-[#F4F3FA] font-medium transition-colors border-t border-[#F4F3FA]"
                  >
                    {staff.displayName || staff.email}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3.5 text-sm font-bold shadow-2xl animate-fade-in ${
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
