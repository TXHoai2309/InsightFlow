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
  detailPanelOpen?: boolean;
  onSelect: (lead: Lead) => void;
  onStartedAction?: (lead: Lead) => void;
}

const INTENT_STYLE = {
  hot: "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
  warm: "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30",
  cold: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30",
  none: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30",
};

const INTENT_ICON_STYLE = {
  hot: "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-300",
  warm: "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-300",
  cold: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300",
  none: "bg-slate-50 text-slate-500 dark:bg-slate-900/20 dark:text-slate-400",
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

export function LeadWorkbenchRow({
  lead,
  rank,
  nowMs,
  selected = false,
  highlighted = false,
  labelRequest,
  detailPanelOpen = false,
  onSelect,
  onStartedAction,
}: LeadWorkbenchRowProps) {
  const { profile } = useAuth();
  const { updateLeadDetails } = useDashboardStore();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");
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

  const cardStateClass = highlighted
    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] ring-4 ring-[var(--color-brand)]/20"
    : selected
      ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/10"
      : meta.needsResultCapture
        ? "border-amber-400/70 hover:border-amber-500"
        : meta.isOverdue || meta.isUrgent
          ? "border-red-400/70 hover:border-red-500"
          : "border-[var(--color-border)] hover:border-[var(--color-brand-border)]";

  const accentClass = meta.needsResultCapture
    ? "bg-amber-400"
    : meta.isOverdue || meta.isUrgent
      ? "bg-red-500"
      : selected
        ? "bg-[var(--color-brand)]"
        : "bg-slate-200 dark:bg-slate-700";

  const leadTimeAgo = formatLeadTimeAgo(lead.posted_at || lead.created_at, nowMs);
  const intentLabel = lead.intent === "none" ? "N/A" : lead.intent.toUpperCase();

  if (!detailPanelOpen) {
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
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex shrink-0 flex-col items-center justify-center self-center">
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

            <div className="relative h-11 w-11 shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-bold text-[var(--color-brand)]">
                {(lead.author || "KH").slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[var(--color-bg-surface)] shadow-sm dark:border-slate-800">
                <PlatformLogo platform={lead.platform} size="xs" />
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-[var(--color-text-primary)]">
                  {lead.author || "Khách hàng"}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)] dark:bg-slate-800/50">
                  {platformMeta?.label || lead.platform}
                </span>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
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

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100/60 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Lý do ưu tiên: {leadReason}
                </span>
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {lead.content}
              </p>

              {labelRequest && (
                <div className="mt-1 max-w-fit rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs font-semibold text-[var(--color-text-secondary)] dark:border-slate-800/50 dark:bg-slate-900/30">
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
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {meta.needsResultCapture ? "Cần ghi nhận" : "SLA còn lại"}
              </span>
            </div>

            <div className="flex min-w-[130px] items-center gap-2">
              <button
                type="button"
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
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${
                rank === 1
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {rank}
            </span>
          </div>

          <div className="relative h-11 w-11 shrink-0 sm:mt-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-base font-black text-[var(--color-brand)] shadow-inner">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[var(--color-bg-surface)] shadow-sm dark:border-slate-800">
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
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-slate-800/70 dark:text-blue-300">
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
                {labelRequest && (
                  <span
                    className={`min-w-0 truncate rounded-full border px-2.5 py-1 text-xs font-bold ${
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
            </div>

            <div className="flex shrink-0 items-start justify-between gap-2 min-[1180px]:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                  <span className="material-symbols-outlined text-[15px]">error</span>
                  Lý do ưu tiên: {leadReason}
                </span>
              </div>
              <button
                type="button"
                aria-label="Tùy chọn lead"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(lead);
                }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-slate-100 hover:text-[var(--color-text-primary)] dark:hover:bg-slate-800"
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
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                meta.isOverdue || meta.isUrgent
                  ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-300"
                  : "bg-slate-50 text-[var(--color-text-secondary)] dark:bg-slate-900/30"
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {meta.needsResultCapture ? "task_alt" : "schedule"}
                </span>
              </span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${
                  meta.isOverdue || meta.isUrgent ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"
                }`}>
                  {formatLeadSla(meta)}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                  {meta.needsResultCapture ? "Cần ghi nhận kết quả" : "SLA còn lại"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isOpening}
              className={`inline-flex min-h-10 w-full min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg px-2.5 py-2 text-xs font-black tracking-tight shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 ${buttonStyle}`}
            >
              <span className="material-symbols-outlined shrink-0 text-[18px]">{ctaIcon}</span>
              <span className="min-w-0 truncate">{isOpening ? "Đang mở..." : ctaLabel}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-slate-50/90 p-3 dark:bg-slate-900/30 min-[1180px]:flex-row min-[1180px]:items-center min-[1180px]:justify-between">
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
              {sourceAction && (
                <a
                  href={sourceAction.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/20"
                >
                  Xem trên {platformMeta?.label || lead.platform}
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              )}
            </div>
          </div>

          {labelRequest && (
            <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-xs font-bold text-[var(--color-text-primary)]">
              <span>Yêu cầu sửa nhãn:</span>
              <span className="text-[var(--color-brand)]">{getQueueLabel(labelRequest.current_queue)}</span>
              <span className="text-[var(--color-text-muted)]">→</span>
              <span className="text-green-600 dark:text-green-300">{getQueueLabel(labelRequest.requested_queue)}</span>
              {labelRequest.review_note && (
                <span className="min-w-0 text-[var(--color-text-secondary)]">
                  · {labelRequest.review_note}
                </span>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm font-bold text-[var(--color-error)]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
