"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard.store";
import { PLATFORM_META } from "@/lib/services/dashboard";
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
import {
  LABEL_CHANGE_REASON_OPTIONS,
  LABEL_TOPICS,
  SENTIMENT_LABELS,
  TOPIC_LABELS,
  URGENCY_LABELS,
  INTENT_LABELS,
  EMPTY_CLASSIFICATION_LABEL,
  areClassificationLabelsEqual,
  formatClassificationLabelSummary,
  getLabelRequestStatusLabel,
  getLabelRequestWorkflowLabel,
  getPendingRerouteMessage,
  getChangedLabelFields,
  getLeadCurrentLabels,
  getQueueLabel,
  inferQueueFromLabels,
  isPendingLeadRerouteRequest,
  isClassificationLabelComplete,
} from "@/lib/label-change";
import type {
  ClassificationLabel,
  DashboardFilters,
  LabelIntent,
  LabelSentiment,
  LabelUrgency,
  Lead,
  Mention,
} from "@/types/dashboard";
import {
  formatFollowUpTime,
  formatLeadSla,
  getLeadContactActions,
  getLeadOwnershipMeta,
  getLeadSourceAction,
  getLeadWorkbenchMeta,
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
}

type PanelTab = LeadDetailPanelTab;
type ResultAction =
  | "positive"
  | "no_response"
  | "follow_up"
  | "not_fit"
  | "converted"
  | "transfer_sales";

const RESULT_OPTIONS: Array<{
  id: ResultAction;
  label: string;
  icon: string;
  status: Lead["status"];
}> = [
  { id: "positive", label: "Khách phản hồi tích cực", icon: "thumb_up", status: "processing" },
  { id: "no_response", label: "Chưa phản hồi", icon: "schedule", status: "processing" },
  { id: "follow_up", label: "Hẹn lại", icon: "event", status: "processing" },
  { id: "transfer_sales", label: "Chuyển sales", icon: "move_up", status: "processing" },
  { id: "not_fit", label: "Không phù hợp", icon: "block", status: "skipped" },
  { id: "converted", label: "Đã chuyển đổi", icon: "emoji_events", status: "completed" },
];

function getPipelineLabel(lead: Lead, needsResult: boolean) {
  if (needsResult) return "Cần ghi nhận kết quả";
  if (lead.sales_status === "ready_to_transfer") return "Chờ chuyển sales";
  if (lead.follow_up_at) return `Follow-up ${formatFollowUpTime(lead)}`;
  if (lead.status === "new") return "Mới phát hiện";
  if (lead.status === "processing") return "Đang tiếp cận";
  if (lead.status === "completed") return "Đã chuyển đổi";
  return "Không tiềm năng";
}

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
}: LeadDetailPanelProps) {
  const { profile } = useAuth();
  const {
    updateLeadDetails,
    createLabelChangeRequest,
    updateLabelChangeRequest,
    cancelLabelChangeRequest,
    labelChangeRequests,
  } = useDashboardStore();
  const [internalActiveTab, setInternalActiveTab] = useState<PanelTab>("action");
  const [selectedResult, setSelectedResult] = useState<ResultAction | null>(null);
  const [showLabelRequestForm, setShowLabelRequestForm] = useState(false);
  const [requestedLabels, setRequestedLabels] =
    useState<ClassificationLabel>(EMPTY_CLASSIFICATION_LABEL);
  const [labelReason, setLabelReason] = useState("wrong_queue");
  const [labelReasonNote, setLabelReasonNote] = useState("");
  const [hasCheckedOriginal, setHasCheckedOriginal] = useState(false);
  const [isSubmittingLabelRequest, setIsSubmittingLabelRequest] = useState(false);
  const [cancelLabelRequestReason, setCancelLabelRequestReason] = useState("");
  const [isCancellingLabelRequest, setIsCancellingLabelRequest] = useState(false);
  const [showCancelLabelRequest, setShowCancelLabelRequest] = useState(false);
  const [labelRequestMessage, setLabelRequestMessage] = useState("");
  const [labelRequestError, setLabelRequestError] = useState("");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState("");
  const [saveError, setSaveError] = useState("");
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

  const currentLabels = useMemo(
    () =>
      lead
        ? getLeadCurrentLabels(lead, mentionTarget?.matchedMention)
        : EMPTY_CLASSIFICATION_LABEL,
    [lead, mentionTarget?.matchedMention],
  );

  useEffect(() => {
    if (!lead) return;
    setRequestedLabels(currentLabels);
    setShowLabelRequestForm(false);
    setShowCancelLabelRequest(false);
    setCancelLabelRequestReason("");
    setLabelReason("wrong_queue");
    setLabelReasonNote("");
    setHasCheckedOriginal(false);
    setLabelRequestMessage("");
    setLabelRequestError("");
  }, [currentLabels, lead?.id]);

  const currentQueue = useMemo(
    () => inferQueueFromLabels(currentLabels),
    [currentLabels],
  );
  const requestedQueue = useMemo(
    () => inferQueueFromLabels(requestedLabels),
    [requestedLabels],
  );
  const changedLabelFields = useMemo(
    () => getChangedLabelFields(currentLabels, requestedLabels),
    [currentLabels, requestedLabels],
  );

  if (!lead || !meta) {
    return (
      <aside className="sticky top-[88px] hidden h-[calc(100vh-104px)] min-h-0 shrink-0 flex-col rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 text-sm text-[var(--color-text-secondary)] xl:flex">
        Chọn một lead để xem thao tác xử lý.
      </aside>
    );
  }

  const pendingLabelRequest = labelChangeRequests.find(
    (request) =>
      request.status === "pending" &&
      (request.lead_id === lead.id ||
        request.source_id === lead.id ||
        request.id === lead.pending_label_request_id ||
        Boolean(
          lead.mention_id && request.mention_id === lead.mention_id,
        ) ||
        Boolean(
          lead.source_mention_id &&
            request.mention_id === lead.source_mention_id,
        )),
  );
  const latestRejectedLabelRequest = labelChangeRequests.find(
    (request) =>
      request.status === "rejected" &&
      (request.lead_id === lead.id || request.source_id === lead.id),
  );
  const canCreateLabelRequestForBrand =
    canPerformAction(profile, "create_label_request") &&
    isSameBrandScope(profile, lead);
  const canEdit =
    isSameBrandScope(profile, lead) &&
    canPerformAction(profile, "update_lead_details");
  const ownership = getLeadOwnershipMeta(lead, profile);
  const canRequestLabelChange =
    canCreateLabelRequestForBrand && ownership.canWork;
  const canRevisePendingLabelRequest =
    canRequestLabelChange && pendingLabelRequest?.requested_by === profile?.uid;
  const labelRequestUnavailableMessage = !canCreateLabelRequestForBrand
    ? "Vai trò hiện tại chưa được cấp quyền gửi yêu cầu sửa nhãn."
    : ownership.canClaim
      ? "Hãy nhận xử lý lead này trước khi gửi yêu cầu sửa nhãn."
      : "Chỉ người đang phụ trách lead này mới được gửi yêu cầu sửa nhãn.";
  const isLeadWorkflowBlocked = isPendingLeadRerouteRequest(pendingLabelRequest);
  const leadWorkflowBlockMessage =
    getPendingRerouteMessage(pendingLabelRequest);
  const canClaimLead = canEdit && !isLeadWorkflowBlocked;
  const canOpenContactAction = ownership.canWork && !isLeadWorkflowBlocked;
  const canRecordResult =
    canEdit &&
    ownership.canWork &&
    meta.needsResultCapture &&
    !isLeadWorkflowBlocked;
  const contactActions = getLeadContactActions(lead);
  const sourceAction = getLeadSourceAction(lead);
  const platformMeta = PLATFORM_META[lead.platform];
  const priorityText =
    meta.priorityReasons.join(", ") || "Có tín hiệu quan tâm cần kiểm tra.";
  const pendingLabelRequestKeepsLeadQueue =
    Boolean(pendingLabelRequest) && !isLeadWorkflowBlocked;
  const labelRequestPreview =
    pendingLabelRequest && !showLabelRequestForm
      ? pendingLabelRequest.requested_labels
      : requestedLabels;
  const labelRequestPreviewQueue =
    pendingLabelRequest && !showLabelRequestForm
      ? pendingLabelRequest.requested_queue
      : requestedQueue;

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

  const updateRequestedLabels = <K extends keyof ClassificationLabel>(
    key: K,
    value: ClassificationLabel[K],
  ) => {
    setRequestedLabels((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleRequestedTopic = (topic: ClassificationLabel["topic"][number]) => {
    setRequestedLabels((current) => ({
      ...current,
      topic: current.topic.includes(topic)
        ? current.topic.filter((item) => item !== topic)
        : [...current.topic, topic],
    }));
  };

  const openCreateLabelRequestForm = () => {
    setRequestedLabels(currentLabels);
    setLabelReason("wrong_queue");
    setLabelReasonNote("");
    setHasCheckedOriginal(false);
    setShowCancelLabelRequest(false);
    setLabelRequestError("");
    setLabelRequestMessage("");
    setShowLabelRequestForm(true);
  };

  const openEditLabelRequestForm = () => {
    if (!pendingLabelRequest) return;
    setRequestedLabels(pendingLabelRequest.requested_labels);
    setLabelReason(pendingLabelRequest.reason_code || "wrong_queue");
    setLabelReasonNote(pendingLabelRequest.reason_note || "");
    setHasCheckedOriginal(pendingLabelRequest.evidence_checked);
    setShowCancelLabelRequest(false);
    setLabelRequestError("");
    setLabelRequestMessage("");
    setShowLabelRequestForm(true);
  };

  const closeLabelRequestForm = () => {
    setShowLabelRequestForm(false);
    setRequestedLabels(pendingLabelRequest?.requested_labels || currentLabels);
    setLabelReason(pendingLabelRequest?.reason_code || "wrong_queue");
    setLabelReasonNote(pendingLabelRequest?.reason_note || "");
    setHasCheckedOriginal(Boolean(pendingLabelRequest?.evidence_checked));
  };

  const handleSubmitLabelRequest = async () => {
    if (!canCreateLabelRequestForBrand || !profile) {
      setLabelRequestError("Bạn không có quyền gửi yêu cầu sửa nhãn.");
      return;
    }

    if (!ownership.canWork) {
      setLabelRequestError(labelRequestUnavailableMessage);
      return;
    }

    if (pendingLabelRequest && !canRevisePendingLabelRequest) {
      setLabelRequestError("Lead này đang có yêu cầu sửa nhãn chờ duyệt.");
      return;
    }

    if (areClassificationLabelsEqual(currentLabels, requestedLabels)) {
      setLabelRequestError("Vui lòng thay đổi ít nhất một trường nhãn.");
      return;
    }

    if (!isClassificationLabelComplete(requestedLabels)) {
      setLabelRequestError("Vui lòng chọn đủ cảm xúc, liên quan, mức độ và intent.");
      return;
    }

    if (!hasCheckedOriginal) {
      setLabelRequestError("Vui lòng xác nhận đã kiểm tra bài viết gốc.");
      return;
    }

    if (labelReason === "other" && labelReasonNote.trim().length < 8) {
      setLabelRequestError("Vui lòng mô tả rõ lý do sửa nhãn.");
      return;
    }

    try {
      setIsSubmittingLabelRequest(true);
      setLabelRequestError("");
      setLabelRequestMessage("");

      if (pendingLabelRequest) {
        await updateLabelChangeRequest(
          pendingLabelRequest.id,
          {
            requested_labels: requestedLabels,
            changed_fields: changedLabelFields,
            requested_queue: requestedQueue,
            reason_code: labelReason,
            reason_note: labelReasonNote.trim(),
            evidence_checked: true,
          },
          profile,
        );
      } else {
        await createLabelChangeRequest(
          {
            source_type: "lead",
            source_id: lead.id,
            lead_id: lead.id,
            mention_id:
              mentionTarget?.matchedMention?.id ||
              lead.mention_id ||
              lead.source_mention_id ||
              mentionTarget?.detailId ||
              undefined,
            workspace_id: lead.workspace_id,
            platform: lead.platform,
            author: lead.author,
            content_preview: lead.content.slice(0, 300),
            source_url:
              lead.source_url ||
              lead.url ||
              mentionTarget?.fallbackUrl ||
              undefined,
            current_labels: currentLabels,
            requested_labels: requestedLabels,
            changed_fields: changedLabelFields,
            current_queue: currentQueue,
            requested_queue: requestedQueue,
            reason_code: labelReason,
            reason_note: labelReasonNote.trim(),
            evidence_checked: true,
          },
          profile,
        );
      }

      setShowLabelRequestForm(false);
      setHasCheckedOriginal(false);
      setLabelReasonNote("");
      setLabelRequestMessage(
        pendingLabelRequest
          ? "Đã cập nhật yêu cầu sửa nhãn đang chờ duyệt."
          : requestedQueue !== currentQueue
          ? "Đã gửi yêu cầu sửa nhãn. Nếu quản lý duyệt, item sẽ được chuyển sang queue phù hợp."
          : "Đã gửi yêu cầu sửa nhãn cho quản lý duyệt.",
      );
    } catch (error) {
      console.error(error);
      setLabelRequestError("Không thể gửi yêu cầu sửa nhãn. Vui lòng thử lại.");
    } finally {
      setIsSubmittingLabelRequest(false);
    }
  };

  const handleCancelLabelRequest = async () => {
    if (!pendingLabelRequest || !profile) return;
    if (!canRevisePendingLabelRequest) {
      setLabelRequestError("Chỉ người tạo yêu cầu mới được gỡ yêu cầu này.");
      return;
    }
    if (cancelLabelRequestReason.trim().length < 5) {
      setLabelRequestError("Vui lòng nhập lý do gỡ yêu cầu.");
      return;
    }

    try {
      setIsCancellingLabelRequest(true);
      setLabelRequestError("");
      setLabelRequestMessage("");
      await cancelLabelChangeRequest(
        pendingLabelRequest.id,
        cancelLabelRequestReason.trim(),
        profile,
      );
      setShowCancelLabelRequest(false);
      setShowLabelRequestForm(false);
      setCancelLabelRequestReason("");
      setRequestedLabels(currentLabels);
      setLabelRequestMessage("Đã gỡ yêu cầu sửa nhãn.");
    } catch (error) {
      console.error(error);
      setLabelRequestError("Không thể gỡ yêu cầu sửa nhãn. Vui lòng thử lại.");
    } finally {
      setIsCancellingLabelRequest(false);
    }
  };

  const handleClaim = async () => {
    if (!canEdit || !profile) return;
    if (isLeadWorkflowBlocked) {
      setSaveError(leadWorkflowBlockMessage);
      return;
    }

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
    } catch (error) {
      console.error(error);
      setSaveError("Không thể nhận xử lý lead này.");
    }
  };

  const handleOpenAction = async (action: LeadActionLink) => {
    if (isLeadWorkflowBlocked) {
      if (action.isContact) {
        setSaveError(leadWorkflowBlockMessage);
        return;
      }

      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }

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
        status: action.isContact && lead.status === "new" ? "processing" : lead.status,
        last_action_at: new Date().toISOString(),
        last_action_type: action.actionType,
        last_contact_channel: action.channel,
      };

      if (action.isContact) {
        actionData.pending_result = true;
      } else if (lead.pending_result !== undefined) {
        actionData.pending_result = lead.pending_result;
      }

      if (action.isContact) {
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
      setSaveError("Không thể ghi nhận thao tác trước khi mở nguồn/liên hệ.");
    } finally {
      setIsOpening("");
    }
  };

  const handleSaveResult = async () => {
    if (!selectedResult) return;
    const option = RESULT_OPTIONS.find((item) => item.id === selectedResult);
    if (!option) return;

    if (!canRecordResult) {
      setSaveError(
        isLeadWorkflowBlocked
          ? leadWorkflowBlockMessage
          : "Hãy liên hệ khách trước khi ghi nhận kết quả.",
      );
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

      if (selectedResult === "transfer_sales") {
        resultData.sales_status = "ready_to_transfer";
        resultData.sales_transferred_at = nowIso;
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
    } catch (error) {
      console.error(error);
      setSaveError("Không thể lưu kết quả xử lý.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{ id: PanelTab; label: string }> = [
    { id: "action", label: "Xử lý" },
    { id: "profile", label: "Hồ sơ" },
    { id: "history", label: "Lịch sử" },
    { id: "suggestion", label: "Gợi ý" },
  ];

  return (
    <aside className="sticky top-[88px] hidden h-[calc(100vh-104px)] min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm xl:flex">
      <div className="shrink-0 border-b border-[var(--color-border)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-base font-bold text-[var(--color-brand)]">
              {(lead.author || "KH").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-lg font-bold text-[var(--color-text-primary)]">
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]"
            aria-label="Đóng chi tiết lead"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
      >
        {activeTab === "action" && (
          <div className="space-y-4">
            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    Người phụ trách
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {ownership.ownerName}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    ownership.status === "assigned_to_me"
                      ? "border-[var(--color-success)]/30 bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                      : ownership.status === "unassigned"
                        ? "border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {ownership.label}
                </span>
              </div>
              {ownership.canClaim && (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={!canClaimLead}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">
                    person_add
                  </span>
                  Nhận xử lý lead này
                </button>
              )}
            </section>

            {isLeadWorkflowBlocked && (
              <section className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[var(--color-warning)]">
                    lock_clock
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      Tạm khóa xử lý lead
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {leadWorkflowBlockMessage}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Bạn vẫn có thể xem chi tiết đề cập, mở bài gốc và theo dõi lịch sử duyệt nhãn.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {pendingLabelRequestKeepsLeadQueue && (
              <section className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/30 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[var(--color-brand)]">
                    pending_actions
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      Có yêu cầu sửa nhãn chờ duyệt
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                      Request này vẫn giữ item trong queue tiềm năng, nên bạn có thể tiếp tục chăm sóc và ghi nhận kết quả.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {meta.needsResultCapture && (
              <section className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[var(--color-brand)]">
                    assignment_turned_in
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      Đang chờ ghi nhận kết quả
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                      Bạn đã mở nguồn/liên hệ với khách này. Hãy chọn kết quả bên dưới để hệ thống chuyển lead sang đúng nhóm.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Lý do ưu tiên
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {priorityText}
              </p>
            </section>

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    Kiểm tra nhãn
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Gửi yêu cầu cho quản lý khi phát hiện sai nhãn hoặc sai queue.
                  </p>
                </div>
                {pendingLabelRequest ? (
                  <span className="rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] px-3 py-1 text-xs font-bold text-[var(--color-warning)]">
                    Chờ duyệt
                  </span>
                ) : (
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
                    {canRequestLabelChange ? "Có thể yêu cầu" : "Cần nhận xử lý"}
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[var(--color-bg-surface-raised)] p-3">
                  <p className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                    Nhãn hiện tại
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                    {formatClassificationLabelSummary(currentLabels)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Queue: {getQueueLabel(currentQueue)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--color-bg-surface-raised)] p-3">
                  <p className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                    Nếu duyệt
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                    {formatClassificationLabelSummary(labelRequestPreview)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Queue: {getQueueLabel(labelRequestPreviewQueue)}
                  </p>
                </div>
              </div>

              {pendingLabelRequest && (
                <div className="mt-3 rounded-lg bg-[var(--color-warning-subtle)] p-3 text-sm text-[var(--color-text-primary)]">
                  <p>
                    {isLeadWorkflowBlocked
                      ? leadWorkflowBlockMessage
                      : `Yêu cầu sửa thành ${formatClassificationLabelSummary(pendingLabelRequest.requested_labels)} đang chờ quản lý duyệt. Lead vẫn có thể được xử lý vì queue không đổi khỏi tiềm năng.`}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="font-bold text-[var(--color-text-muted)]">
                        Trạng thái
                      </dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
                        {getLabelRequestStatusLabel(pendingLabelRequest.status)} · {getLabelRequestWorkflowLabel(pendingLabelRequest)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-[var(--color-text-muted)]">
                        Queue
                      </dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
                        {getQueueLabel(pendingLabelRequest.current_queue)} → {getQueueLabel(pendingLabelRequest.requested_queue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-[var(--color-text-muted)]">
                        Người gửi
                      </dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
                        {pendingLabelRequest.requested_by_name || "Không rõ"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-[var(--color-text-muted)]">
                        Thời điểm gửi
                      </dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
                        {new Date(pendingLabelRequest.requested_at).toLocaleString("vi-VN")}
                      </dd>
                    </div>
                  </dl>
                  {canRevisePendingLabelRequest && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={openEditLabelRequestForm}
                        className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]"
                      >
                        Chỉnh sửa yêu cầu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLabelRequestForm(false);
                          setShowCancelLabelRequest((current) => !current);
                          setLabelRequestError("");
                          setLabelRequestMessage("");
                        }}
                        className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-error)] transition hover:bg-[var(--color-error-subtle)]"
                      >
                        Gỡ yêu cầu
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showCancelLabelRequest && pendingLabelRequest && canRevisePendingLabelRequest && (
                <div className="mt-3 space-y-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error-subtle)]/40 p-3">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    Gỡ yêu cầu sửa nhãn
                  </p>
                  <textarea
                    value={cancelLabelRequestReason}
                    onChange={(event) => setCancelLabelRequestReason(event.target.value)}
                    placeholder="Nhập lý do gỡ yêu cầu, ví dụ: gửi nhầm lead hoặc đã kiểm tra lại bài gốc..."
                    className="min-h-[72px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-error)]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelLabelRequest(false);
                        setCancelLabelRequestReason("");
                      }}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"
                    >
                      Không gỡ
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelLabelRequest}
                      disabled={isCancellingLabelRequest}
                      className="rounded-lg bg-[var(--color-error)] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCancellingLabelRequest ? "Đang gỡ..." : "Xác nhận gỡ"}
                    </button>
                  </div>
                </div>
              )}

              {!pendingLabelRequest && latestRejectedLabelRequest && (
                <p className="mt-3 rounded-lg bg-[var(--color-error-subtle)] p-3 text-sm text-[var(--color-text-primary)]">
                  Yêu cầu gần nhất đã bị từ chối{latestRejectedLabelRequest.review_note ? `: ${latestRejectedLabelRequest.review_note}` : "."}
                </p>
              )}

              {labelRequestMessage && (
                <p className="mt-3 rounded-lg bg-[var(--color-success-subtle)] p-3 text-sm font-semibold text-[var(--color-success)]">
                  {labelRequestMessage}
                </p>
              )}

              {labelRequestError && (
                <p className="mt-3 rounded-lg bg-[var(--color-error-subtle)] p-3 text-sm font-semibold text-[var(--color-error)]">
                  {labelRequestError}
                </p>
              )}

              {!pendingLabelRequest && canRequestLabelChange && !showLabelRequestForm && (
                <button
                  type="button"
                  onClick={openCreateLabelRequestForm}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]"
                >
                  <span className="material-symbols-outlined text-base">
                    new_label
                  </span>
                  Yêu cầu sửa nhãn
                </button>
              )}

              {!pendingLabelRequest && !canRequestLabelChange && (
                <p className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-secondary)]">
                  {labelRequestUnavailableMessage}
                </p>
              )}

              {showLabelRequestForm && (!pendingLabelRequest || canRevisePendingLabelRequest) && (
                <div className="mt-3 space-y-3 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/20 p-3">
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                    Cảm xúc
                    <select
                      value={requestedLabels.sentiment || ""}
                      onChange={(event) =>
                        updateRequestedLabels(
                          "sentiment",
                          (event.target.value || null) as LabelSentiment | null,
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    >
                      <option value="">-- Cảm xúc</option>
                      {Object.entries(SENTIMENT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                      Chủ đề
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {LABEL_TOPICS.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleRequestedTopic(topic)}
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            requestedLabels.topic.includes(topic)
                              ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                              : "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {TOPIC_LABELS[topic]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                    Liên quan thương hiệu
                    <select
                      value={
                        requestedLabels.relevance === null
                          ? ""
                          : requestedLabels.relevance
                            ? "yes"
                            : "no"
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        updateRequestedLabels(
                          "relevance",
                          value === "" ? null : value === "yes",
                        );
                      }}
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    >
                      <option value="">-- Liên quan</option>
                      <option value="yes">Có</option>
                      <option value="no">Không</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                    Mức độ
                    <select
                      value={requestedLabels.urgency || ""}
                      onChange={(event) =>
                        updateRequestedLabels(
                          "urgency",
                          (event.target.value || null) as LabelUrgency | null,
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    >
                      <option value="">-- Mức độ</option>
                      {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                    Intent
                    <select
                      value={requestedLabels.intent || ""}
                      onChange={(event) =>
                        updateRequestedLabels(
                          "intent",
                          (event.target.value || null) as LabelIntent | null,
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    >
                      <option value="">-- Intent</option>
                      {Object.entries(INTENT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {changedLabelFields.length > 0 && (
                    <p className="rounded-lg bg-[var(--color-bg-surface)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                      Trường đã sửa: {changedLabelFields.join(", ")}
                    </p>
                  )}

                  <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                    Lý do
                    <select
                      value={labelReason}
                      onChange={(event) => setLabelReason(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    >
                      {LABEL_CHANGE_REASON_OPTIONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <textarea
                    value={labelReasonNote}
                    onChange={(event) => setLabelReasonNote(event.target.value)}
                    placeholder="Mô tả ngắn căn cứ sửa nhãn..."
                    className="min-h-[72px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                  />

                  <label className="flex items-start gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                    <input
                      type="checkbox"
                      checked={hasCheckedOriginal}
                      onChange={(event) =>
                        setHasCheckedOriginal(event.target.checked)
                      }
                      className="mt-1"
                    />
                    <span>
                      Tôi đã kiểm tra bài viết gốc/chi tiết đề cập trước khi gửi yêu cầu.
                    </span>
                  </label>

                  {requestedQueue !== currentQueue && (
                    <p className="rounded-lg bg-[var(--color-warning-subtle)] p-3 text-xs leading-5 text-[var(--color-text-primary)]">
                      Yêu cầu này có thể chuyển item từ queue {getQueueLabel(currentQueue)} sang {getQueueLabel(requestedQueue)} sau khi quản lý duyệt.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={closeLabelRequestForm}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-primary)]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitLabelRequest}
                      disabled={isSubmittingLabelRequest}
                      className="rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingLabelRequest
                        ? "Đang gửi..."
                        : pendingLabelRequest
                          ? "Cập nhật yêu cầu"
                          : "Gửi quản lý"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Nội dung gần nhất
              </p>
              <p className="mt-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm leading-6 text-[var(--color-text-primary)]">
                {lead.content}
              </p>
            </section>

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Nguồn lead
              </p>
              {mentionTarget?.canOpenMentionDetail && mentionDetailHref ? (
                <Link
                  href={mentionDetailHref}
                  onClick={handleOpenMentionDetail}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)]"
                >
                  <span className="material-symbols-outlined text-base">
                    article
                  </span>
                  Xem chi tiết đề cập
                </Link>
              ) : (
                <p className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-secondary)]">
                  Chưa tìm thấy bản ghi đề cập trong hệ thống.
                </p>
              )}

              {sourceAction ? (
                <button
                  type="button"
                  onClick={() => handleOpenAction(sourceAction)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-subtle)]"
                >
                  <span className="material-symbols-outlined text-base">
                    {sourceAction.icon}
                  </span>
                  {isOpening === sourceAction.label ? "Đang mở..." : "Mở nguồn bên ngoài"}
                </button>
              ) : (
                !mentionTarget?.canOpenMentionDetail && (
                  <p className="mt-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-secondary)]">
                    Lead này chưa có đường dẫn nguồn.
                  </p>
                )
              )}
            </section>

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Kênh liên hệ
              </p>
              {contactActions.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {contactActions.map((action, index) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={!canOpenContactAction}
                      onClick={() => handleOpenAction(action)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                        index === 0
                          ? "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
                          : "border border-[var(--color-border)] text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {action.icon}
                      </span>
                      {isOpening === action.label ? "Đang mở..." : action.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-secondary)]">
                  Chưa có kênh liên hệ trực tiếp. Hãy mở nguồn lead để kiểm tra thêm.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Trạng thái hiện tại
              </p>
              <div className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)]">
                {getPipelineLabel(lead, meta.needsResultCapture)}
              </div>
            </section>

            <section className="rounded-xl border border-[var(--color-brand-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Ghi nhận kết quả nhanh
              </p>
              {!canRecordResult && (
                <p className="mt-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-secondary)]">
                  {isLeadWorkflowBlocked
                    ? leadWorkflowBlockMessage
                    : "Hãy nhận xử lý và liên hệ khách trước khi ghi nhận kết quả."}
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {RESULT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!canRecordResult}
                    onClick={() => {
                      setSelectedResult(option.id);
                      if (option.id === "follow_up" && !followUpDate) {
                        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        setFollowUpDate(toDateInputValue(tomorrow.toISOString()));
                        setFollowUpTime(toTimeInputValue(tomorrow.toISOString()) || "09:00");
                      }
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      selectedResult === option.id
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {option.icon}
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedResult === "follow_up" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Ngày follow-up
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(event) => setFollowUpDate(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    />
                  </label>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Giờ follow-up
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(event) => setFollowUpTime(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                    />
                  </label>
                </div>
              )}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isLeadWorkflowBlocked}
                placeholder="Ghi chú nhanh..."
                className="mt-3 min-h-[76px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
              {saveError && (
                <p className="mt-2 text-xs font-semibold text-[var(--color-error)]">
                  {saveError}
                </p>
              )}
              <button
                type="button"
                disabled={!selectedResult || isSaving || !canRecordResult}
                onClick={handleSaveResult}
                className="mt-3 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </section>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Thông tin cơ bản
              </p>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-secondary)]">Tên</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)]">
                    {lead.author || "Khách hàng"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-secondary)]">Kênh</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)]">
                    {platformMeta?.label || lead.platform}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-secondary)]">Liên hệ</dt>
                  <dd className="text-right font-semibold text-[var(--color-text-primary)]">
                    {lead.phone || lead.email || lead.social_profile_url || "Chưa có"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
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
          <div className="space-y-4">
            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Timeline tương tác
              </p>
              <div className="mt-4 space-y-4 border-l border-[var(--color-border)] pl-4">
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

            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Activity log xử lý
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                {lead.notes || "Chưa có ghi chú xử lý."}
              </p>
            </section>
          </div>
        )}

        {activeTab === "suggestion" && (
          <div className="space-y-4">
            <section className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/30 p-4">
              <p className="text-sm font-bold text-[var(--color-brand)]">
                Gợi ý hành động tiếp theo
              </p>
              <p className="mt-3 text-base font-bold leading-7 text-[var(--color-text-primary)]">
                {meta.nextActionLabel} vì {priorityText.toLowerCase()}.
              </p>
            </section>
            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Gợi ý nội dung phản hồi
              </p>
              <p className="mt-3 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm leading-6 text-[var(--color-text-primary)]">
                Chào anh/chị {lead.author || ""}, em thấy mình đang quan tâm đến thông tin sản phẩm/dịch vụ. Em có thể hỗ trợ tư vấn nhanh theo nhu cầu của mình ngay tại đây ạ.
              </p>
            </section>
            <section className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Căn cứ đưa ra gợi ý
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--color-text-secondary)]">
                {meta.priorityReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
                <li>Lead score hiện tại {meta.priorityScore}/100.</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
