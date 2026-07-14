"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  getLeadOperationErrorMessage,
  isOperationalRoutingSchemaError,
  PLATFORM_META,
} from "@/lib/services/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { canPerformAction } from "@/lib/rbac";
import { isSameBrandScope } from "@/lib/brandScope";
import { resolveLeadMentionTarget } from "@/lib/mention-navigation";
import {
  LEAD_DETAIL_PANEL_SCROLL_ID,
  createLeadReturnToken,
  saveLeadReturnContext,
  type LeadDetailPanelTab,
} from "@/lib/lead-return-context";
import type {
  DashboardFilters,
  Lead,
  Mention,
} from "@/types/dashboard";
import {
  formatLeadSla,
  getLeadOwnershipMeta,
  getLeadSourceAction,
  getLeadWorkbenchMeta,
  getPrimaryLeadAction,
  type LeadActionLink,
  type LeadWorkbenchView,
} from "@/lib/lead-workbench";

interface LeadDetailPanelProps {
  lead: Lead | null;
  mentions?: Mention[];
  nowMs: number;
  onClose: () => void;
  onAfterResult?: () => void;
  onStartedAction?: (lead: Lead) => void;
  returnContext?: {
    view: LeadWorkbenchView;
    page: number;
    selectedLeadId?: string | null;
    filters?: Partial<DashboardFilters>;
    listScrollTop?: number;
  };
  activeTab?: LeadDetailPanelTab;
  onTabChange?: (tab: LeadDetailPanelTab) => void;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

type PanelTab = LeadDetailPanelTab;
type ResultAction =
  | "positive"
  | "no_response"
  | "follow_up"
  | "not_fit"
  | "converted";

const RESULT_OPTIONS: Array<{
  id: ResultAction;
  label: string;
  icon: string;
  status: Lead["status"];
}> = [
  { id: "positive", label: "Khách phản hồi tích cực", icon: "thumb_up", status: "processing" },
  { id: "no_response", label: "Chưa phản hồi", icon: "schedule", status: "processing" },
  { id: "follow_up", label: "Hẹn lại", icon: "event", status: "processing" },
  { id: "not_fit", label: "Không phù hợp", icon: "block", status: "skipped" },
  { id: "converted", label: "Đã chuyển đổi", icon: "emoji_events", status: "completed" },
];

function toDateInputValue(dateIso?: string) {
  if (!dateIso) return "";
  return new Date(dateIso).toISOString().slice(0, 10);
}

function toTimeInputValue(dateIso?: string) {
  if (!dateIso) return "";
  return new Date(dateIso).toTimeString().slice(0, 5);
}

function appendLeadReturnParams(
  href: string,
  lead: Lead,
  returnContext?: LeadDetailPanelProps["returnContext"],
  token?: string,
) {
  if (!href) return href;

  const [pathAndQuery, hash] = href.split("#");
  const params = new URLSearchParams({
    from: "leads",
    leadId: returnContext?.selectedLeadId || lead.id,
    view: returnContext?.view || "priority",
    page: String(returnContext?.page || 1),
  });
  if (token) params.set("returnToken", token);
  const separator = pathAndQuery.includes("?") ? "&" : "?";

  return `${pathAndQuery}${separator}${params.toString()}${hash ? `#${hash}` : ""}`;
}

function getPanelScrollTop() {
  if (typeof window === "undefined") return 0;
  return document.getElementById(LEAD_DETAIL_PANEL_SCROLL_ID)?.scrollTop || 0;
}

export function LeadDetailPanel({
  lead,
  mentions = [],
  nowMs,
  onClose,
  onAfterResult,
  onStartedAction,
  returnContext,
  activeTab: activeTabProp,
  onTabChange,
  isCollapsed,
  onCollapseToggle,
}: LeadDetailPanelProps) {
  const { profile } = useAuth();
  const { updateLeadDetails } = useDashboardStore();
  const [internalActiveTab, setInternalActiveTab] = useState<PanelTab>("action");
  const [selectedResult, setSelectedResult] = useState<ResultAction | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferReason, setTransferReason] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipNote, setSkipNote] = useState("");
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState("");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState("");
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const activeTab = activeTabProp || internalActiveTab;

  const meta = useMemo(
    () => (lead ? getLeadWorkbenchMeta(lead, nowMs) : null),
    [lead, nowMs],
  );

  const mentionById = useMemo(
    () => new Map(mentions.map((item) => [item.id, item])),
    [mentions],
  );

  const mentionTarget = useMemo(
    () => (lead ? resolveLeadMentionTarget(lead, mentionById) : null),
    [lead, mentionById],
  );

  const returnToken = useMemo(
    () => (lead ? createLeadReturnToken(lead.id) : ""),
    [lead],
  );

  const mentionDetailHref = useMemo(
    () =>
      lead && mentionTarget?.canOpenMentionDetail
        ? appendLeadReturnParams(mentionTarget.href, lead, returnContext, returnToken)
        : "",
    [lead, mentionTarget, returnContext, returnToken],
  );

  if (!lead || !meta) {
    return (
      <aside className="flex min-w-0 shrink-0 flex-col self-start rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] p-[3%] text-sm text-[var(--color-text-secondary)]">
        Chọn một lead để xem thao tác xử lý.
      </aside>
    );
  }

  const canEdit =
    isSameBrandScope(profile, lead) &&
    canPerformAction(profile, "update_lead_details");
  const ownership = getLeadOwnershipMeta(lead, profile);
  const canClaimLead = canEdit;
  const canRecordResult =
    canEdit &&
    ownership.canWork &&
    meta.needsResultCapture;
  const canTransferBusiness =
    canEdit &&
    ownership.canWork &&
    lead.status !== "completed" &&
    lead.status !== "skipped";
  const canSkipLead =
    canEdit &&
    (ownership.canClaim || ownership.canWork) &&
    lead.status !== "completed" &&
    lead.status !== "skipped";
  const sourceAction = getLeadSourceAction(lead);
  const platformMeta = PLATFORM_META[lead.platform];
  const priorityText =
    meta.priorityReasons.join(", ") || "Có tín hiệu quan tâm cần kiểm tra.";

  const getOwnerName = () =>
    profile?.displayName || profile?.email || "Nhân viên xử lý";

  const handleTabChange = (tab: PanelTab) => {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    setInternalActiveTab(tab);
  };

  const handleOpenMentionDetail = () => {
    if (!returnToken) return;

    saveLeadReturnContext({
      token: returnToken,
      leadId: lead.id,
      selectedLeadId: returnContext?.selectedLeadId || lead.id,
      view: returnContext?.view || "priority",
      page: returnContext?.page || 1,
      filters: returnContext?.filters || {},
      panelTab: activeTab,
      listScrollTop: returnContext?.listScrollTop || 0,
      panelScrollTop: getPanelScrollTop(),
      openedAt: new Date().toISOString(),
    });
  };

  const handleOpenTransferForm = () => {
    setShowTransferForm(true);
    setShowSkipForm(false);
    setTransferError("");
  };

  const handleTransferToCrisis = async () => {
    if (!profile || !canTransferBusiness) {
      setTransferError(
        ownership.canClaim
          ? "Hãy nhận xử lý trước khi chuyển nghiệp vụ."
          : "Chỉ người đang phụ trách mới có thể chuyển nghiệp vụ.",
      );
      return;
    }
    if (!transferReason) {
      setTransferError("Vui lòng chọn lý do chuyển nghiệp vụ.");
      return;
    }

    try {
      setIsTransferring(true);
      setTransferError("");
      const nowIso = new Date().toISOString();
      const transferEvent: NonNullable<Lead["transfer_history"]>[number] = {
        from: lead.operational_queue || "lead",
        to: "crisis",
        reason: transferReason,
        note: transferNote.trim() || undefined,
        transferred_by: profile.uid,
        transferred_by_name: getOwnerName(),
        transferred_at: nowIso,
        owner_before: lead.owner_name || lead.owner_email || undefined,
        owner_after: undefined,
      };
      const transferData: Partial<Lead> = {
        operational_queue: "crisis",
        previous_operational_queue: lead.operational_queue || "lead",
        transfer_reason: transferReason,
        transfer_note: transferNote.trim() || undefined,
        transferred_by: profile.uid,
        transferred_by_name: getOwnerName(),
        transferred_at: nowIso,
        transfer_count: (lead.transfer_count || 0) + 1,
        transfer_history: [...(lead.transfer_history || []), transferEvent],
        last_action_at: nowIso,
        last_action_type: "transfer_business",
        pending_result: false,
        owner_id: null,
        owner_name: null,
        owner_email: null,
        assigned_at: null,
        assigned_by: null,
        claimed_at: null,
      };

      await updateLeadDetails(lead.id, transferData, profile);
      onStartedAction?.({ ...lead, ...transferData });
      setShowTransferForm(false);
      setTransferReason("");
      setTransferNote("");
      showToast("Đã chuyển item sang nghiệp vụ khủng hoảng.", "success");
      window.setTimeout(() => {
        window.location.assign("/alerts?tab=priority");
      }, 700);
    } catch (error: any) {
      console.error(error);
      if (isOperationalRoutingSchemaError(error)) {
        setTransferError(
          "Hệ thống chưa hoàn tất cấu hình chuyển nghiệp vụ. Vui lòng liên hệ quản trị viên.",
        );
        return;
      }
      setTransferError(
        getLeadOperationErrorMessage(
          error,
          "Không thể chuyển nghiệp vụ. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSkipLead = async () => {
    if (!profile || !canSkipLead) {
      setSkipError("Bạn không có quyền bỏ qua item này.");
      return;
    }
    if (!skipReason) {
      setSkipError("Vui lòng chọn lý do bỏ qua.");
      return;
    }

    try {
      setIsSkipping(true);
      setSkipError("");
      const nowIso = new Date().toISOString();
      const reasonLabel =
        {
          not_relevant: "Không liên quan",
          spam: "Spam/quảng cáo",
          duplicate: "Trùng lặp",
          not_a_lead: "Không phải khách hàng tiềm năng",
          other: "Lý do khác",
        }[skipReason] || skipReason;
      const nextNote = [
        lead.notes,
        `[Bỏ qua] ${new Date().toLocaleString("vi-VN")} - ${reasonLabel}${skipNote.trim() ? `: ${skipNote.trim()}` : ""}`,
      ]
        .filter(Boolean)
        .join("\n");
      const skipData: Partial<Lead> = {
        status: "skipped",
        result_type: "not_fit",
        notes: nextNote,
        pending_result: false,
        result_recorded_at: nowIso,
        closed_at: nowIso,
        last_action_at: nowIso,
        last_action_type: "skip",
        owner_id: lead.owner_id || profile.uid,
        owner_name: lead.owner_name || getOwnerName(),
        owner_email: lead.owner_email || profile.email,
      };

      await updateLeadDetails(lead.id, skipData, profile);
      onStartedAction?.({ ...lead, ...skipData });
      setShowSkipForm(false);
      setSkipReason("");
      setSkipNote("");
      onAfterResult?.();
      showToast("Đã bỏ qua item và lưu lý do.", "success");
    } catch (error) {
      console.error(error);
      setSkipError(
        getLeadOperationErrorMessage(
          error,
          "Không thể bỏ qua item này. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSkipping(false);
    }
  };

  const handleClaim = async () => {
    if (!canEdit || !profile) return;

    try {
      setSaveError("");
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
      onStartedAction?.({ ...lead, ...ownerData });
      showToast("Nhận xử lý lead thành công!", "success");
    } catch (error: any) {
      console.error(error);
      const message = getLeadOperationErrorMessage(
        error,
        "Không thể nhận xử lý lead này.",
      );
      setSaveError(message);
      showToast(message, "error");
    }
  };

  const handleOpenAction = async (
    action: LeadActionLink,
    countAsContact = action.isContact,
  ) => {
    if (!ownership.canWork) {
      setSaveError(
        ownership.canClaim
          ? "Hãy nhận xử lý lead này trước khi liên hệ."
          : "Lead này đang do người khác phụ trách.",
      );
      return;
    }

    try {
      setSaveError("");
      setIsOpening(action.label);

      const actionData: Partial<Lead> = {
        status: countAsContact && lead.status === "new" ? "processing" : lead.status,
        last_action_at: new Date().toISOString(),
        last_action_type: action.actionType,
        last_contact_channel: action.channel,
      };

      if (countAsContact) {
        actionData.pending_result = true;
      } else if (lead.pending_result !== undefined) {
        actionData.pending_result = lead.pending_result;
      }

      if (countAsContact) {
        actionData.contact_attempts = (lead.contact_attempts || 0) + 1;
        actionData.last_contact_at = new Date().toISOString();
        actionData.first_contacted_at =
          lead.first_contacted_at || new Date().toISOString();
      }

      if (canEdit) {
        await updateLeadDetails(lead.id, actionData, profile);
      }

      const updatedLead = { ...lead, ...actionData };
      onStartedAction?.(updatedLead);
      window.open(action.href, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setSaveError(
        getLeadOperationErrorMessage(
          error,
          "Không thể ghi nhận thao tác trước khi mở nguồn/liên hệ.",
        ),
      );
    } finally {
      setIsOpening("");
    }
  };

  const handleSaveResult = async () => {
    if (!selectedResult) return;
    const option = RESULT_OPTIONS.find((item) => item.id === selectedResult);
    if (!option) return;

    if (!canRecordResult) {
      setSaveError("Hãy liên hệ khách trước khi ghi nhận kết quả.");
      return;
    }

    if (selectedResult === "follow_up" && (!followUpDate || !followUpTime)) {
      setSaveError("Vui lòng chọn ngày giờ follow-up.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");
      const nowIso = new Date().toISOString();
      const followUpAt =
        selectedResult === "follow_up"
          ? new Date(`${followUpDate}T${followUpTime}:00`).toISOString()
          : undefined;
      const nextNote = [
        lead.notes,
        `[Kết quả] ${new Date().toLocaleString("vi-VN")} - ${option.label}${note ? `: ${note}` : ""}`,
      ]
        .filter(Boolean)
        .join("\n");
      const resultData: Partial<Lead> = {
        status: option.status,
        notes: nextNote,
        pending_result: false,
        result_type: selectedResult,
        result_recorded_at: nowIso,
        last_contact_at: lead.last_contact_at || nowIso,
      };

      if (followUpAt) {
        resultData.follow_up_at = followUpAt;
      }

      if (selectedResult === "not_fit" || selectedResult === "converted") {
        resultData.closed_at = nowIso;
      }

      await updateLeadDetails(
        lead.id,
        resultData,
        profile,
      );

      setSelectedResult(null);
      setNote("");
      setFollowUpDate("");
      setFollowUpTime("");
      onAfterResult?.();
      showToast("Ghi nhận kết quả thành công!", "success");
    } catch (error: any) {
      console.error(error);
      const message = getLeadOperationErrorMessage(
        error,
        "Không thể lưu kết quả xử lý.",
      );
      setSaveError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{ id: PanelTab; label: string }> = [
    { id: "action", label: "Xử lý" },
    { id: "profile", label: "Hồ sơ" },
    { id: "history", label: "Lịch sử" },
  ];

  return (
    <aside
      data-tour="lead-detail-panel"
      className="flex min-w-0 shrink-0 flex-col self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm"
    >
      <div className="shrink-0 border-b border-[var(--color-border)] p-[2%]">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-bold text-[var(--color-brand)]">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-base font-bold text-[var(--color-text-primary)]">
                  {lead.author || "Khách hàng"}
                </h3>
                <span className="shrink-0 rounded-md border border-[#FFB4B4] bg-[#FFE5E5] px-2 py-0.5 text-xs font-bold uppercase text-[#D92D20]">
                  {lead.intent}
                </span>
              </div>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">
                {platformMeta?.label || lead.platform} · {formatLeadSla(meta)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onCollapseToggle && (
              <button
                type="button"
                onClick={onCollapseToggle}
                className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]"
                title="Thu gọn panel"
                aria-label="Thu gọn panel"
              >
                <span className="material-symbols-outlined text-[18px]">
                  dock_to_right
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]"
              aria-label="Đóng chi tiết lead"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-tour={tab.id === "action" ? "lead-detail-tab-action" : undefined}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id={LEAD_DETAIL_PANEL_SCROLL_ID}
        className="flex-1 p-[2%]"
      >
        {activeTab === "action" && (
          <div className="space-y-2.5">
            <section data-tour="lead-detail-owner" className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Người phụ trách</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">{ownership.ownerName}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                  ownership.status === "assigned_to_me"
                    ? "border-[var(--color-success)]/30 bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                    : ownership.status === "unassigned"
                      ? "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                }`}>{ownership.label}</span>
              </div>
              {ownership.canClaim && (
                <button type="button" data-tour="lead-detail-claim-button" onClick={handleClaim} disabled={!canClaimLead} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Nhận xử lý lead này
                </button>
              )}
            </section>

            <section className="rounded-lg border border-amber-300 bg-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-xl text-amber-500">star</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Lý do ưu tiên</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{priorityText}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-[var(--color-brand)]">chat_bubble</span>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Nội dung cần xử lý</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm leading-6 text-[var(--color-text-primary)]">{lead.content}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{new Date(lead.created_at).toLocaleString("vi-VN")}</p>
            </section>

            <section data-tour="lead-detail-source-actions" className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/20 p-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-[var(--color-brand)]">call</span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Cách thức liên hệ / xử lý</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Mở đúng nguồn để xử lý, hoặc xem thêm bối cảnh của khách hàng.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {sourceAction ? (
                  <button type="button" disabled={!ownership.canWork || Boolean(isOpening)} onClick={() => handleOpenAction(sourceAction, true)} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-2 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                    <span className="material-symbols-outlined shrink-0 text-lg">open_in_new</span>
                    <span className="truncate">{isOpening === sourceAction.label ? "Đang mở..." : "Mở nguồn"}</span>
                  </button>
                ) : mentionDetailHref ? (
                  <Link href={mentionDetailHref} onClick={handleOpenMentionDetail} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-2 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)]">
                    <span className="material-symbols-outlined shrink-0 text-lg">open_in_new</span>
                    <span className="truncate">Mở nguồn</span>
                  </Link>
                ) : (
                  <button type="button" disabled className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-2 py-2.5 text-sm font-bold text-white opacity-40">
                    <span className="material-symbols-outlined shrink-0 text-lg">open_in_new</span>
                    <span className="truncate">Mở nguồn</span>
                  </button>
                )}
                <button type="button" onClick={() => handleTabChange("profile")} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] px-2 py-2.5 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]">
                  <span className="material-symbols-outlined shrink-0 text-lg">person</span>
                  <span className="truncate">Xem hồ sơ</span>
                </button>
                <button type="button" onClick={() => handleTabChange("history")} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] px-2 py-2.5 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]">
                  <span className="material-symbols-outlined shrink-0 text-lg">history</span>
                  <span className="truncate">Xem lịch sử</span>
                </button>
              </div>
              {!ownership.canWork && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Hãy nhận xử lý item trước khi mở nguồn.</p>
              )}
            </section>

            <section data-tour="lead-detail-result-actions" className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Ghi nhận kết quả nhanh</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Chọn kết quả sau khi đã xử lý yêu cầu của khách hàng.</p>
                </div>
                {meta.needsResultCapture && <span className="rounded-full bg-[var(--color-brand-subtle)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-brand)]">Chờ kết quả</span>}
              </div>
              {!canRecordResult && <p className="mt-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-2.5 text-xs text-[var(--color-text-secondary)]">Hãy nhận xử lý và mở nguồn trước khi ghi nhận kết quả.</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
                {RESULT_OPTIONS.map((option) => (
                  <button key={option.id} type="button" disabled={!canRecordResult} onClick={() => {
                    setSelectedResult(option.id);
                    if (option.id === "follow_up" && !followUpDate) {
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                      setFollowUpDate(toDateInputValue(tomorrow.toISOString()));
                      setFollowUpTime(toTimeInputValue(tomorrow.toISOString()) || "09:00");
                    }
                  }} className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                    selectedResult === option.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
                  }`}>
                    <span className="material-symbols-outlined shrink-0 text-base">{option.icon}</span>
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
              {selectedResult === "follow_up" && (
                <div data-tour="lead-detail-followup" className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Ngày follow-up<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]" /></label>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Giờ follow-up<input type="time" value={followUpTime} onChange={(event) => setFollowUpTime(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]" /></label>
                </div>
              )}
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú nhanh..." className="mt-3 min-h-[72px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]" />
              {saveError && <p className="mt-2 text-xs font-semibold text-[var(--color-error)]">{saveError}</p>}
              <button type="button" disabled={!selectedResult || isSaving || !canRecordResult} onClick={handleSaveResult} className="mt-3 w-full rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Đang lưu..." : "Lưu kết quả"}</button>
            </section>

            <section className="rounded-lg border border-[var(--color-brand-border)] p-3">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-xl text-[var(--color-brand)]">swap_horiz</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Chuyển nghiệp vụ</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">Chuyển cho đội khủng hoảng khi item vượt phạm vi xử lý tiềm năng.</p>
                </div>
              </div>
              {!showTransferForm ? (
                <button type="button" onClick={handleOpenTransferForm} disabled={!canTransferBusiness} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)] disabled:cursor-not-allowed disabled:opacity-50">Chuyển sang xử lý khủng hoảng<span className="material-symbols-outlined text-lg">arrow_forward</span></button>
              ) : (
                <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">Lý do chuyển<select value={transferReason} onChange={(event) => setTransferReason(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"><option value="">Chọn lý do</option><option value="crisis_signal">Có dấu hiệu khủng hoảng/khiếu nại</option><option value="reputation_risk">Có nguy cơ ảnh hưởng uy tín thương hiệu</option><option value="urgent_escalation">Cần đội khủng hoảng xử lý khẩn cấp</option><option value="wrong_workflow">Không thuộc nghiệp vụ tiềm năng</option></select></label>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">Ghi chú bàn giao <span className="font-normal">(không bắt buộc)</span><textarea value={transferNote} onChange={(event) => setTransferNote(event.target.value)} placeholder="Bổ sung bối cảnh để đội tiếp nhận xử lý nhanh hơn..." className="mt-1 min-h-[72px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]" /></label>
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">Item sẽ rời hàng chờ Tiềm năng và trở về trạng thái chưa phân công tại hàng chờ Khủng hoảng.</p>
                  {transferError && <p className="text-xs font-semibold text-[var(--color-error)]">{transferError}</p>}
                  <div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowTransferForm(false); setTransferError(""); }} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]">Hủy</button><button type="button" onClick={handleTransferToCrisis} disabled={isTransferring || !transferReason} className="rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isTransferring ? "Đang chuyển..." : "Xác nhận chuyển"}</button></div>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-red-200 bg-red-50/40 p-3 dark:border-red-900/40 dark:bg-red-950/10">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-xl text-red-500">block</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[var(--color-text-primary)]">Bỏ qua / Không liên quan</p><p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">Đóng item không thuộc phạm vi xử lý và lưu lý do để tra cứu.</p></div>
              </div>
              {!showSkipForm ? (
                <button type="button" onClick={() => { setShowSkipForm(true); setShowTransferForm(false); setSkipError(""); }} disabled={!canSkipLead} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Bỏ qua item này<span className="material-symbols-outlined text-lg">arrow_forward</span></button>
              ) : (
                <div className="mt-3 space-y-3 border-t border-red-200 pt-3">
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">Lý do bỏ qua<select value={skipReason} onChange={(event) => setSkipReason(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-red-400"><option value="">Chọn lý do</option><option value="not_relevant">Không liên quan</option><option value="spam">Spam/quảng cáo</option><option value="duplicate">Trùng lặp</option><option value="not_a_lead">Không phải khách hàng tiềm năng</option><option value="other">Lý do khác</option></select></label>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">Ghi chú <span className="font-normal">(không bắt buộc)</span><textarea value={skipNote} onChange={(event) => setSkipNote(event.target.value)} placeholder="Bổ sung lý do để tra cứu sau..." className="mt-1 min-h-[64px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-red-400" /></label>
                  {skipError && <p className="text-xs font-semibold text-[var(--color-error)]">{skipError}</p>}
                  <div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowSkipForm(false); setSkipError(""); }} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]">Hủy</button><button type="button" onClick={handleSkipLead} disabled={isSkipping || !skipReason} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSkipping ? "Đang xử lý..." : "Xác nhận bỏ qua"}</button></div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-3">
            <section className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Thông tin cơ bản
              </p>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-secondary)]">Tên</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)]">
                    {lead.author || "Khách hàng"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-secondary)]">Kênh</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)]">
                    {platformMeta?.label || lead.platform}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-secondary)]">Liên hệ</dt>
                  <dd className="text-right font-semibold text-[var(--color-text-primary)]">
                    {lead.phone || lead.email || lead.social_profile_url || "Chưa có"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-secondary)]">Score</dt>
                  <dd className="font-bold text-[var(--color-brand)]">
                    {meta.priorityScore}/100
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <section className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Timeline tương tác
              </p>
              <div className="mt-3 space-y-3 border-l border-[var(--color-border)] pl-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(lead.created_at).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {lead.content}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Intent: {lead.intent} · Kênh: {platformMeta?.label || lead.platform}
                  </p>
                </div>
                {lead.last_action_at && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(lead.last_action_at).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Đã mở {lead.last_contact_channel || "nguồn/liên hệ"}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Activity log xử lý
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                {lead.notes || "Chưa có ghi chú xử lý."}
              </p>
            </section>
          </div>
        )}

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
    </aside>
  );
}
