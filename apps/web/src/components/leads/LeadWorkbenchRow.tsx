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
  onSelect: (lead: Lead) => void;
  onStartedAction?: (lead: Lead) => void;
}

const INTENT_STYLE = {
  hot: "bg-[#FFE5E5] text-[#D92D20] border-[#FFB4B4]",
  warm: "bg-[#FFF3E0] text-[#F97316] border-[#FFD7A8]",
  cold: "bg-[#E6F7ED] text-[#059669] border-[#B7E6CC]",
  none: "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

export function LeadWorkbenchRow({
  lead,
  rank,
  nowMs,
  selected = false,
  highlighted = false,
  labelRequest,
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
      ? "border-[var(--color-success)]/30 bg-[var(--color-success-subtle)] text-[var(--color-success)]"
      : ownership.status === "unassigned"
        ? "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
        : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]";

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

  return (
    <div
      id={`lead-row-${lead.id}`}
      data-lead-id={lead.id}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(lead)}
      onKeyDown={handleRowKeyDown}
      className={`w-full rounded-xl border bg-[var(--color-bg-surface)] p-3 text-left shadow-sm transition hover:border-[var(--color-brand-border)] hover:shadow-md ${
        highlighted
          ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] ring-4 ring-[var(--color-brand)]/20"
          : selected
          ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/10"
          : meta.needsResultCapture
            ? "border-[var(--color-brand)]/60"
            : meta.isOverdue || meta.isUrgent
              ? "border-[var(--color-error)]/50"
              : "border-[var(--color-border)]"
      }`}
    >
      <div className="grid gap-3 xl:grid-cols-[34px_52px_minmax(220px,1fr)_116px_126px_138px] xl:items-center">
        <div className="flex xl:block">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
              rank === 1
                ? "bg-[var(--color-error)] text-white"
                : "bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
            }`}
          >
            {rank}
          </span>
        </div>

        <div className="flex items-center">
          <div className="relative h-12 w-12 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-bold text-[var(--color-brand)]">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
              <PlatformLogo platform={lead.platform} size="xs" />
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="max-w-full truncate font-bold text-[var(--color-text-primary)]">
              {lead.author || "Khách hàng"}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {platformMeta?.label || lead.platform}
            </span>
            <span className="max-w-[160px] truncate text-xs text-[var(--color-text-muted)]">
              {normalizeBrandName(lead.workspace_id)}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${ownerChipClass}`}>
              {ownership.label}
            </span>
            {labelRequest && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                  isLeadWorkflowBlocked
                    ? "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                    : labelRequest.status === "pending"
                      ? "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                }`}
              >
                {getLabelRequestStatusLabel(labelRequest.status)} · {getLabelRequestWorkflowLabel(labelRequest)}
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-bold text-[var(--color-error)]">
              Lý do ưu tiên:
            </span>
            <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
              {leadReason}
            </span>
          </div>
          <p className="truncate text-sm text-[var(--color-text-secondary)]">
            {lead.content}
          </p>
          {labelRequest && (
            <p className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">
              Sửa nhãn: {getQueueLabel(labelRequest.current_queue)} → {getQueueLabel(labelRequest.requested_queue)}
              {labelRequest.review_note ? ` · ${labelRequest.review_note}` : ""}
            </p>
          )}
          {error && (
            <p className="text-xs font-semibold text-[var(--color-error)]">
              {error}
            </p>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${
              INTENT_STYLE[lead.intent]
            }`}
          >
            {lead.intent === "none" ? "N/A" : lead.intent}
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tabular-nums text-[var(--color-error)]">
              {meta.priorityScore}
            </p>
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)]">
              priority
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p
            className={`truncate text-sm font-bold ${
              meta.isOverdue || meta.isUrgent
                ? "text-[var(--color-error)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            {formatLeadSla(meta)}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {meta.needsResultCapture ? "Cần ghi nhận" : "SLA còn lại"}
          </p>
        </div>

        <div className="flex items-center gap-2 xl:justify-end">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isOpening}
            className="inline-flex min-w-[124px] max-w-[150px] items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold leading-tight text-white shadow-sm transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">{ctaIcon}</span>
            <span className="line-clamp-2">{isOpening ? "Đang xử lý..." : ctaLabel}</span>
          </button>
          <span className="material-symbols-outlined text-[var(--color-text-muted)]">
            more_vert
          </span>
        </div>
      </div>
    </div>
  );
}
