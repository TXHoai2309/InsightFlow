"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  getLeadOperationErrorMessage,
  PLATFORM_META,
  normalizeBrandName,
} from "@/lib/services/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { canPerformAction } from "@/lib/rbac";
import { isSameBrandScope } from "@/lib/brandScope";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import type { Lead } from "@/types/dashboard";
import {
  formatLeadSla,
  getLeadFollowUpMeta,
  getLeadOwnershipMeta,
  getLeadWorkbenchMeta,
  getPrimaryLeadAction,
} from "@/lib/lead-workbench";
import type { AlertViewer } from "@/hooks/useAlertViewPresence";

interface LeadWorkbenchRowProps {
  lead: Lead;
  rank: number;
  nowMs: number;
  selected?: boolean;
  highlighted?: boolean;
  staffList?: any[];
  detailPanelOpen?: boolean;
  compact?: boolean;
  pinned?: boolean;
  canPin?: boolean;
  pinDisabled?: boolean;
  onSelect: (lead: Lead) => void;
  onTogglePin?: (lead: Lead) => void;
  onStartedAction?: (lead: Lead) => void;
  viewers?: AlertViewer[];
  currentViewerId?: string | null;
}

const INTENT_STYLE = {
  hot: "border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] text-[var(--color-error)]",
  warm: "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
  cold: "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]",
  none: "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]",
};

const INTENT_ICON_STYLE = {
  hot: "bg-[var(--color-error-subtle)] text-[var(--color-error)]",
  warm: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
  cold: "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]",
  none: "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]",
};

function formatLeadTimeAgo(value: string | undefined, nowMs: number) {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";

  const diffMinutes = Math.max(0, Math.floor((nowMs - time) / 60000));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCompletedTime(lead: Lead, nowMs: number) {
  const completedTimeStr = lead.closed_at || lead.result_recorded_at || lead.updated_at || lead.created_at;
  if (!completedTimeStr) return "";
  return formatLeadTimeAgo(completedTimeStr, nowMs).toLowerCase();
}

export function LeadWorkbenchRow({
  lead,
  rank,
  nowMs,
  selected = false,
  highlighted = false,
  staffList = [],
  detailPanelOpen = false,
  compact = false,
  pinned = false,
  canPin = false,
  pinDisabled = false,
  onSelect,
  onTogglePin,
  onStartedAction,
  viewers = [],
  currentViewerId,
}: LeadWorkbenchRowProps) {
  const { profile } = useAuth();
  const { updateLeadDetails, claimLead } = useDashboardStore();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const viewerTriggerRef = useRef<HTMLButtonElement>(null);
  const viewerPopoverRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const meta = getLeadWorkbenchMeta(lead, nowMs);
  const followUpMeta = getLeadFollowUpMeta(lead, nowMs);
  const isActiveFollowUp = followUpMeta.isActive;
  const isActionableFollowUp = followUpMeta.isDueToday;
  const isUrgentFollowUp = followUpMeta.isOverdue || followUpMeta.isDueSoon;
  const timingLabel = isActiveFollowUp
    ? followUpMeta.relativeLabel
    : formatLeadSla(meta);
  const timingCaption = isActiveFollowUp
    ? "Lịch follow-up"
    : meta.needsResultCapture
      ? "Cần ghi nhận kết quả"
      : "SLA còn lại";
  const ownership = getLeadOwnershipMeta(lead, profile);

  useEffect(() => {
    if (!showViewers) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        viewerTriggerRef.current?.contains(target) ||
        viewerPopoverRef.current?.contains(target)
      ) {
        return;
      }
      setShowViewers(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [showViewers]);

  useEffect(() => {
    if (!selected || ownership.status !== "unassigned") {
      setShowViewers(false);
    }
  }, [ownership.status, selected]);

  const primaryAction = getPrimaryLeadAction(lead);
  const platformMeta = PLATFORM_META[lead.platform];
  const canEdit =
    isSameBrandScope(profile, lead) &&
    canPerformAction(profile, "update_lead_details");

  const leadReason =
    meta.priorityReasons[0] ||
    lead.intent_signals[0] ||
    "Có tín hiệu quan tâm cần kiểm tra";

  const ownerChipClass =
    ownership.status === "assigned_to_me"
      ? "border-[var(--color-success)]/30 bg-[var(--color-success-subtle)] text-[var(--color-success)]"
      : ownership.status === "unassigned"
        ? "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
        : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]";

  const ctaLabel = ownership.canClaim
      ? "Nhận xử lý"
      : !ownership.canWork
        ? "Xem chi tiết"
        : meta.needsResultCapture
          ? "Ghi nhận kết quả"
          : isActionableFollowUp
            ? "Thực hiện follow-up"
            : meta.nextActionLabel;
  const ctaIcon = ownership.canClaim
      ? "person_add"
      : !ownership.canWork
        ? "visibility"
        : meta.needsResultCapture
          ? "task_alt"
          : isActionableFollowUp
            ? "event_upcoming"
            : primaryAction?.icon || "open_in_new";

  const getOwnerName = () =>
    profile?.displayName || profile?.email || "Nhân viên xử lý";

  const handleClaim = async () => {
    if (!canEdit || !profile) return;
    const claimData = await claimLead(lead.id, profile);
    const updatedLead = { ...lead, ...claimData };
    onStartedAction?.(updatedLead);
    onSelect(updatedLead);
  };

  const handlePrimaryAction = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (ownership.canClaim) {
      try {
        setError("");
        setIsOpening(true);
        await handleClaim();
      } catch (err) {
        console.error(err);
        setError(
          getLeadOperationErrorMessage(
            err,
            "Không thể nhận xử lý lead này.",
          ),
        );
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
      setError(
        getLeadOperationErrorMessage(
          err,
          "Không thể ghi nhận thao tác trước khi mở liên hệ.",
        ),
      );
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

  const buttonStyle = ownership.canClaim
      ? "border border-[var(--color-brand)] text-[var(--color-brand)] bg-transparent hover:bg-[var(--color-brand-subtle)] hover:shadow-sm"
      : meta.needsResultCapture
        ? "bg-[var(--color-warning)] text-white hover:brightness-95 hover:shadow-md"
        : isActionableFollowUp && followUpMeta.isOverdue
          ? "bg-[var(--color-error)] text-white hover:brightness-95 hover:shadow-md"
          : "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] hover:shadow-md";

  const cardStateClass = pinned
    ? "border-l-2 border-l-orange-500 border-[var(--color-brand)] p-3 shadow-xs ring-2 ring-[var(--color-brand)]/20 transition-colors"
    : highlighted
    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] ring-4 ring-[var(--color-brand)]/20"
    : selected
      ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]/55 ring-2 ring-[var(--color-brand)]/15"
      : meta.needsResultCapture
        ? "border-[var(--color-border)] hover:border-[var(--color-warning)]"
        : isActiveFollowUp
          ? "border-[var(--color-info)]/50 hover:border-[var(--color-info)]"
          : meta.isOverdue || meta.isUrgent
            ? "border-[var(--color-border)] hover:border-[var(--color-error)]"
            : "border-[var(--color-border)] hover:border-[var(--color-brand-border)]";

  const accentClass = pinned
    ? "bg-orange-500"
    : selected || highlighted
    ? "bg-[var(--color-brand)]"
    : isActiveFollowUp
      ? followUpMeta.isOverdue ? "bg-[var(--color-error)]" : "bg-[var(--color-info)]"
      : "bg-[var(--color-border-strong)]";

  const isCompleted = lead.status === "completed";
  const postedTime = lead.posted_at || lead.created_at;
  const leadTimeAgo = isCompleted
    ? `Đã xử lý ${formatCompletedTime(lead, nowMs)}`
    : postedTime
      ? `Được đăng ${formatLeadTimeAgo(postedTime, nowMs).toLowerCase()}`
      : "";
  const intentLabel = lead.intent === "none" ? "N/A" : lead.intent.toUpperCase();

  const renderPinButton = () => canPin ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onTogglePin?.(lead);
      }}
      disabled={pinDisabled && !pinned}
      aria-pressed={pinned}
      aria-label={pinned ? "Bỏ ghim khách hàng" : "Ghim khách hàng"}
      title={pinDisabled && !pinned ? "Chỉ được ghim tối đa 3 khách hàng" : pinned ? "Bỏ ghim" : "Ghim lên đầu"}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pinned ? "border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300" : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"}`}
    >
      <span className="material-symbols-outlined text-[17px]">push_pin</span>
    </button>
  ) : null;

  if (compact) {
    return (
      <div
        id={`lead-row-${lead.id}`}
        data-lead-id={lead.id}
        data-tour={rank === 1 ? "lead-row-first" : undefined}
        role="button"
        tabIndex={0}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(lead)}
        onKeyDown={handleRowKeyDown}
        className={`relative w-full cursor-pointer overflow-visible rounded-lg border bg-[var(--color-bg-surface)] p-3 text-left transition duration-200 hover:bg-[var(--color-bg-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 ${cardStateClass}`}
      >
        <span className={`absolute inset-y-0 left-0 w-1 ${accentClass}`} />

        <div className="flex min-w-0 items-start gap-3 pl-1">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-black text-[var(--color-brand)]">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-bg-surface)] bg-[var(--color-bg-surface)] shadow-sm">
              <PlatformLogo platform={lead.platform} size="xs" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--color-text-primary)]">
                  {lead.author || "Khách hàng"}
                </p>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-[var(--color-bg-surface-high)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--color-brand)]">
                    {platformMeta?.label || lead.platform}
                  </span>
                  <span className={`max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] font-bold ${ownerChipClass}`}>
                    {ownership.label}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {renderPinButton()}
                {selected && ownership.status === "unassigned" && (
                  <button
                    ref={viewerTriggerRef}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowViewers((value) => !value);
                    }}
                    aria-expanded={showViewers}
                    aria-label={`${viewers.length} người đang xem khách hàng`}
                    title={`${viewers.length} người đang xem`}
                    className="inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-1.5 text-[10px] font-black text-[var(--color-text-muted)] transition hover:border-violet-300 hover:text-violet-600"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>{viewers.length}</span>
                  </button>
                )}
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${INTENT_STYLE[lead.intent]}`}>
                  {intentLabel}
                </span>
              </div>
            </div>

            {selected && ownership.status === "unassigned" && showViewers && (
              <div
                ref={viewerPopoverRef}
                role="dialog"
                aria-label="Danh sách người đang xem khách hàng"
                onClick={(event) => event.stopPropagation()}
                className="absolute right-3 top-12 z-50 w-[min(18rem,calc(100%-1.5rem))] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-left shadow-xl"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2">
                  <p className="text-sm font-black text-[var(--color-text-primary)]">Người đang xem ({viewers.length})</p>
                  <button type="button" onClick={() => setShowViewers(false)} className="grid h-7 w-7 place-items-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]" aria-label="Đóng danh sách người xem">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                {viewers.length === 0 ? (
                  <p className="py-3 text-xs text-[var(--color-text-secondary)]">Chưa có người nào đang xem.</p>
                ) : (
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {viewers.map((viewer) => (
                      <li key={viewer.uid} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[var(--color-bg-surface-raised)]">
                        {viewer.photoURL ? (
                          <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(viewer.photoURL).slice(1, -1)})` }} />
                        ) : (
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                            {(viewer.displayName || viewer.email || "ND").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-[var(--color-text-primary)]">
                            {viewer.displayName || viewer.email || "Người dùng"}{viewer.uid === currentViewerId ? " (Bạn)" : ""}
                          </p>
                          {viewer.email && <p className="truncate text-[10px] text-[var(--color-text-muted)]">{viewer.email}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="mt-2 line-clamp-1 text-[13px] font-semibold leading-5 text-[var(--color-text-primary)]">
              {leadReason}
            </p>
            <p className="mt-1 line-clamp-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              {lead.content}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-2.5">
              <div className="min-w-0 flex-1">
                <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black transition-all ${
                  isUrgentFollowUp || meta.isOverdue || meta.isUrgent
                    ? "bg-red-500/10 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20"
                    : isActiveFollowUp
                      ? "bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/20"
                      : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
                }`}>
                  {!isCompleted && (isActiveFollowUp || meta.isOverdue || meta.isUrgent) && (
                    <span className={`material-symbols-outlined text-[15px] ${meta.isOverdue || meta.isUrgent ? "animate-pulse" : ""}`}>
                      {isActiveFollowUp ? "event_upcoming" : "schedule"}
                    </span>
                  )}
                  <span className="truncate">{isCompleted ? `Đã xử lý ${formatCompletedTime(lead, nowMs)}` : timingLabel}</span>
                </div>
                {!isCompleted && (
                  <p className="mt-1 truncate text-[11px] font-medium text-[var(--color-text-muted)]">
                    {isActiveFollowUp
                      ? timingCaption
                      : meta.wasOverdueOnIngest
                        ? "Quá hạn trước khi hệ thống ghi nhận"
                        : meta.needsResultCapture
                          ? "Cần ghi nhận kết quả"
                          : leadTimeAgo || "SLA xử lý"}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right bg-[var(--color-brand-subtle)]/70 border border-[var(--color-brand-border)]/40 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center">
                <p className="text-base font-black leading-none text-[var(--color-brand)]">
                  {meta.priorityScore}
                </p>
                <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Điểm ưu tiên
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-xs font-semibold text-[var(--color-error)]">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!detailPanelOpen) {
    return (
      <div
        id={`lead-row-${lead.id}`}
        data-lead-id={lead.id}
        data-tour={rank === 1 ? "lead-row-first" : undefined}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(lead)}
        onKeyDown={handleRowKeyDown}
        className={`w-full overflow-hidden rounded-2xl border bg-[var(--color-bg-surface)] p-4 text-left shadow-sm transition-all duration-300 hover:translate-y-[-1px] hover:shadow-md ${highlighted
            ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] ring-4 ring-[var(--color-brand)]/20"
            : selected
              ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/10"
              : meta.needsResultCapture
                ? "border-[var(--color-warning)]/50"
                : meta.isOverdue || meta.isUrgent
                  ? "border-[var(--color-error)]/45"
                  : "border-[var(--color-border)] hover:border-[var(--color-brand-border)]"
          } ${pinned ? "border-l-4 border-l-orange-500 border-[var(--color-brand)] p-[4%] ring-2 ring-[var(--color-brand)]/25 transition-colors" : ""}`}
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex shrink-0 flex-col items-center justify-center self-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${rank === 1
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]"
                  }`}
              >
                {rank}
              </span>
            </div>

            <div className="relative h-11 w-11 shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-bold text-[var(--color-brand)]">
                {(lead.author || "KH").slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-bg-surface)] bg-[var(--color-bg-surface)] shadow-sm">
                <PlatformLogo platform={lead.platform} size="xs" />
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-[var(--color-text-primary)]">
                  {lead.author || "Khách hàng"}
                </span>
                <span className="rounded bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                  {platformMeta?.label || lead.platform}
                </span>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  {normalizeBrandName(lead.workspace_id)}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${ownerChipClass}`}>
                  {ownership.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <span className="material-symbols-outlined text-[14px] text-[var(--color-brand)]">priority_high</span>
                  Lý do ưu tiên: {leadReason}
                </span>
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {lead.content}
              </p>

              {error && (
                <p className="text-xs font-semibold text-[var(--color-error)]">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-3 lg:justify-end lg:gap-6 lg:border-t-0 lg:pt-0">
            <div className="flex items-center gap-3">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${INTENT_STYLE[lead.intent]}`}>
                {lead.intent === "none" ? "N/A" : lead.intent}
              </span>
              <div className="text-center">
                <span className="block text-xl font-extrabold leading-none text-[var(--color-brand)]">
                  {meta.priorityScore}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Độ ưu tiên
                </span>
              </div>
            </div>

            <div className="flex min-w-[100px] flex-col gap-0.5 text-left lg:text-right">
              <div className="flex items-center gap-1 lg:justify-end">
                {!isCompleted && (
                  <span className={`material-symbols-outlined text-[16px] ${meta.isOverdue || meta.isUrgent ? "text-[var(--color-error)] animate-pulse" : "text-[var(--color-text-secondary)]"
                    }`}>
                    {isActiveFollowUp ? "event_upcoming" : meta.needsResultCapture ? "task_alt" : "schedule"}
                  </span>
                )}
                <span className={`text-sm font-extrabold tracking-tight ${meta.isOverdue || meta.isUrgent ? "text-[var(--color-error)]" : "text-[var(--color-text-secondary)]"
                  }`}>
                  {isCompleted ? `Đã xử lý ${formatCompletedTime(lead, nowMs)}` : timingLabel}
                </span>
              </div>
              {!isCompleted && (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${meta.wasOverdueOnIngest ? "text-[var(--color-error)]" : "text-[var(--color-text-muted)]"}`}
                >
                  {meta.wasOverdueOnIngest
                    ? "Quá hạn trước khi hệ thống ghi nhận"
                    : timingCaption}
                </span>
              )}
            </div>

            <div className="flex min-w-[130px] items-center gap-2">
              {renderPinButton()}
              <button
                type="button"
                data-tour={rank === 1 ? "lead-row-primary-action" : undefined}
                onClick={handlePrimaryAction}
                disabled={isOpening}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold tracking-tight shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 ${buttonStyle}`}
              >
                <span className="material-symbols-outlined text-[16px]">{ctaIcon}</span>
                <span>{isOpening ? "Đang mở..." : ctaLabel}</span>
              </button>
              <span className="material-symbols-outlined cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                more_vert
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`lead-row-${lead.id}`}
      data-lead-id={lead.id}
      data-tour={rank === 1 ? "lead-row-first" : undefined}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(lead)}
      onKeyDown={handleRowKeyDown}
      className={`relative w-full overflow-hidden rounded-lg border bg-[var(--color-bg-surface)] p-3 text-left shadow-sm transition-all duration-300 hover:translate-y-[-1px] hover:shadow-md ${cardStateClass}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${accentClass}`} />

      <div className="grid gap-3 pl-2 min-[900px]:grid-cols-[10%_minmax(0,90%)]">
        <div className="flex items-center gap-3 sm:block">
          <div className="sm:absolute sm:left-5 sm:top-1/2 sm:-translate-y-1/2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${rank === 1
                  ? "bg-[var(--color-brand)] text-white"
                  : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                }`}
            >
              {rank}
            </span>
          </div>

          <div className="relative h-11 w-11 shrink-0 sm:mt-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-base font-black text-[var(--color-brand)] shadow-inner">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-bg-surface)] bg-[var(--color-bg-surface)] shadow-sm">
              <PlatformLogo platform={lead.platform} size="xs" />
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 min-[1180px]:flex-row min-[1180px]:items-start min-[1180px]:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 truncate text-[15px] font-black text-[var(--color-text-primary)]">
                  {lead.author || "Khách hàng"}
                </span>
                <span className="rounded-md bg-[var(--color-bg-surface-high)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-brand)]">
                  {platformMeta?.label || lead.platform}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {normalizeBrandName(lead.workspace_id)}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${ownerChipClass}`}>
                  {ownership.label}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-start justify-between gap-2 min-[1180px]:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
                  <span className="material-symbols-outlined text-[15px] text-[var(--color-brand)]">priority_high</span>
                  Lý do ưu tiên: {leadReason}
                </span>
              </div>
              {renderPinButton()}
              <button
                type="button"
                aria-label="Tùy chọn lead"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(lead);
                }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)]"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2 shadow-[0_10px_22px_rgba(15,23,42,0.04)] min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(4.5rem,0.7fr)_minmax(0,1.45fr)_minmax(0,1.15fr)] min-[1180px]:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${INTENT_ICON_STYLE[lead.intent]}`}>
                <span className="material-symbols-outlined text-[20px]">
                  {lead.intent === "cold" ? "ac_unit" : "local_fire_department"}
                </span>
              </span>
              <div className="min-w-0">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-black uppercase ${INTENT_STYLE[lead.intent]}`}>
                  {intentLabel}
                </span>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                  Mức độ ưu tiên
                </p>
              </div>
            </div>

            <div className="min-w-0 text-left md:text-center">
              <div className="inline-flex items-center gap-2">
                <span className="text-2xl font-black leading-none text-[var(--color-brand)]">
                  {meta.priorityScore}
                </span>
                <span className="material-symbols-outlined text-[15px] text-[var(--color-text-muted)]">
                  info
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                Điểm ưu tiên
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              {!isCompleted && (
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.isOverdue || meta.isUrgent
                    ? "bg-[var(--color-error-subtle)] text-[var(--color-error)]"
                    : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                  }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {isActiveFollowUp ? "event_upcoming" : meta.needsResultCapture ? "task_alt" : "schedule"}
                  </span>
                </span>
              )}
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${meta.isOverdue || meta.isUrgent ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"
                  }`}>
                  {isCompleted ? `Đã xử lý ${formatCompletedTime(lead, nowMs)}` : timingLabel}
                </p>
                {!isCompleted && (
                  <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                    {timingCaption}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 relative min-w-0 w-full">
              <button
                type="button"
                data-tour={rank === 1 ? "lead-row-primary-action" : undefined}
                onClick={handlePrimaryAction}
                disabled={isOpening}
                className={`inline-flex min-h-10 w-full min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg px-2.5 py-2 text-xs font-black tracking-tight shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 ${buttonStyle}`}
              >
                <span className="material-symbols-outlined shrink-0 text-[18px]">{ctaIcon}</span>
                <span className="min-w-0 truncate">{isOpening ? "Đang mở..." : ctaLabel}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)] hover:text-[var(--color-text-primary)] transition-all"
                title="Phân công xử lý"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>

              {showMenu && (
                <div className="absolute bottom-full right-0 z-50 mb-2 max-h-48 w-52 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-1.5 shadow-xl">
                  <div className="mb-1 border-b border-[var(--color-border)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                          showToast(
                            getLeadOperationErrorMessage(
                              err,
                              "Không thể hủy gán việc.",
                            ),
                            "error",
                          );
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error-subtle)]"
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
                          showToast(
                            getLeadOperationErrorMessage(
                              err,
                              "Không thể giao việc.",
                            ),
                            "error",
                          );
                        }
                      }}
                      className="w-full border-t border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-surface-raised)]"
                    >
                      {staff.displayName || staff.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 min-[1180px]:flex-row min-[1180px]:items-center min-[1180px]:justify-between">
            <div className="flex min-w-0 items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              </span>
              <p className="line-clamp-2 min-w-0 text-sm font-bold leading-relaxed text-[var(--color-text-primary)]">
                {lead.content}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-bold">
              {leadTimeAgo && (
                <span className="text-[var(--color-text-muted)]">
                  {leadTimeAgo}
                </span>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm font-bold text-[var(--color-error)]">
              {error}
            </p>
          )}
        </div>
      </div>



      {
    toast && (
      <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border bg-[var(--color-bg-surface)] px-4 py-3.5 text-sm font-bold shadow-2xl animate-fade-in ${toast.type === "success"
          ? "border-[var(--color-success)]/30 bg-[var(--color-success-subtle)] text-[var(--color-success)]"
          : "border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] text-[var(--color-error)]"
        }`}>
        <span className="material-symbols-outlined text-[18px]">
          {toast.type === "success" ? "check_circle" : "error"}
        </span>
        <span>{toast.message}</span>
      </div>
    )
  }
    </div >
  );
}
