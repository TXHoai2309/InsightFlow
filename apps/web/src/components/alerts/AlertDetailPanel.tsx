"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageSquareText,
  PanelRightClose,
  ShieldAlert,
  UserPlus,
  UserRound,
  ChevronDown,
} from "lucide-react";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { canRestoreAlert, canSkipAlert, getAlertWorkflowStatus, type AlertWorkflowStatus } from "@/lib/alertWorkflow";
import { useAlertStore, type AlertData } from "@/stores/alert.store";
import { useAuth } from "@/hooks/useAuth";
import { AlertContentContext } from "./AlertContentContext";
import {
  AlertContactWorkflow,
  createDefaultContactTemplate,
  type AlertContactResultDraft,
} from "./AlertContactWorkflow";
import { CustomerInteractionHistoryPanel } from "@/components/customer-interactions/CustomerInteractionHistoryPanel";

export type AlertDetailPanelTab = "action" | "profile" | "interactions" | "history";

interface AlertDetailPanelProps {
  alert: AlertData;
  activeTab: AlertDetailPanelTab;
  statusFilter: AlertWorkflowStatus | "all";
  onTabChange: (tab: AlertDetailPanelTab) => void;
  profileEmail?: string | null;
  canUpdate: boolean;
  getResolverName: (value: string | null | undefined) => string;
  onClose: () => void;
  onClaim: (alert: AlertData) => Promise<void>;
  onRecordResult: (alert: AlertData, draft: AlertContactResultDraft) => Promise<void>;
  onSkip: (alert: AlertData) => Promise<void>;
  onRestore: (alert: AlertData) => Promise<void>;
  onOpenSource: (alert: AlertData) => void;
}

function formatDate(value?: string) {
  if (!value) return "Không rõ";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Không rõ";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function getStatusLabel(alert: AlertData) {
  const status = getAlertWorkflowStatus(alert);
  if (status === "resolved") return "Đã đóng";
  if (status === "skipped") return "Đã bỏ qua";
  if (status === "contact_failed") return "Liên hệ không thành";
  if (status === "processing") return alert.status === "contact_waiting" ? "Đã liên hệ, chờ phản hồi" : "Đang xử lý";
  return "Chưa phân công";
}

function getPriorityReason(alert: AlertData) {
  const reasons: string[] = [];
  const severity = String(alert.severity || "").toLowerCase();
  if (severity === "critical") reasons.push("Mức độ nghiêm trọng đặc biệt cao");
  else if (severity === "high") reasons.push("Nguy cơ ảnh hưởng hình ảnh thương hiệu");
  if ((alert.negativity_score || 0) >= 70) reasons.push("Điểm tiêu cực cao");
  if ((alert.reach || 0) >= 10000) reasons.push("Phạm vi tiếp cận lớn");
  return reasons.length > 0 ? reasons.join(" · ") : "Nội dung tiêu cực cần nhân viên đánh giá và xử lý.";
}

type AlertHistoryViewEntry = {
  key: string;
  timestamp: string;
  title: string;
  detail: string;
  badge?: string;
  imageUrl?: string;
  kind: "detected" | "resolution" | "contact" | "note" | "escalation";
};

const CONTACT_RESULT_LABELS: Record<string, string> = {
  positive: "Khách hàng phản hồi tích cực",
  no_response: "Chưa phản hồi",
  still_upset: "Khách hàng vẫn bức xúc",
  not_suitable: "Không phù hợp",
};

const CONTACT_OUTCOME_LABELS: Record<string, string> = {
  resolved: "Đã giải quyết",
  contact_waiting: "Đã liên hệ – Chờ phản hồi",
  contact_failed: "Giải quyết thất bại",
};

export function AlertDetailPanel({
  alert,
  activeTab,
  statusFilter,
  onTabChange,
  profileEmail,
  canUpdate,
  getResolverName,
  onClose,
  onClaim,
  onRecordResult,
  onSkip,
  onRestore,
  onOpenSource,
}: AlertDetailPanelProps) {
  const { role, profile, user } = useAuth();
  const workflowStatus = getAlertWorkflowStatus(alert);
  const isTerminal = workflowStatus === "resolved" || workflowStatus === "skipped";
  const [optimisticClaimId, setOptimisticClaimId] = useState<string | null>(null);
  const [isOpeningContact, setIsOpeningContact] = useState(false);
  const [previewHistoryImage, setPreviewHistoryImage] = useState<string | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [skipError, setSkipError] = useState("");
  const claimedOptimistically = optimisticClaimId === alert.id;
  const normalizedOwner = String(alert.being_resolved_by || "").trim().toLowerCase();
  const normalizedProfileEmail = String(profileEmail || "").trim().toLowerCase();
  const isMine = claimedOptimistically || Boolean(normalizedProfileEmail && normalizedOwner === normalizedProfileEmail);
  const effectiveWorkflowStatus = claimedOptimistically ? "processing" : workflowStatus;
  const effectiveOwner = claimedOptimistically
    ? profileEmail
    : workflowStatus === "skipped"
      ? alert.skipped_by_name || alert.skipped_by_email || alert.skipped_by_uid
      : workflowStatus === "resolved"
        ? alert.resolved_by_name || alert.resolved_by_email || alert.resolved_by
        : alert.being_resolved_by;
  const ownerName = getResolverName(effectiveOwner) || "Chưa có người phụ trách";
  const canClaim = canUpdate && !claimedOptimistically && workflowStatus === "pending" && !alert.being_resolved_by;
  const canRecord = canUpdate && isMine && (effectiveWorkflowStatus === "processing" || effectiveWorkflowStatus === "contact_failed");
  const canSkip =
    canUpdate &&
    statusFilter === "processing" &&
    canSkipAlert(alert, profileEmail) &&
    !claimedOptimistically;
  const sourceUrl = [alert.url, alert.post_url].find((url) => Boolean(url && url !== "#"));
  const contactUrl = [alert.social_profile_url, sourceUrl]
    .find((url) => Boolean(url && url !== "#"));
  const canOpenContact = canRecord && !alert.customer_contact_opened_at;
  const showTerminalActions = isTerminal && (statusFilter === "resolved" || statusFilter === "skipped");
  const canRestore =
    canUpdate &&
    showTerminalActions &&
    canRestoreAlert(alert, profile, role === "brand_manager");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningUid, setAssigningUid] = useState<string | null>(null);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssignDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (role === "brand_manager") {
      const loadStaff = async () => {
        setLoadingStaff(true);
        try {
          const token = await user?.getIdToken();
          const res = await fetch("/api/staff", { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok && data.data) {
            setStaffList(data.data.filter((s: any) => !s.disabled && (s.permissions || []).includes("alerts")));
          }
        } catch (e) {
          console.error(e);
        }
        setLoadingStaff(false);
      };
      loadStaff();
    }
  }, [role, user]);

  const handleAssignTo = async (uid: string) => {
    if (!uid || !canUpdate || !profile) return;
    const selectedStaff = staffList.find(s => s.uid === uid);
    if (!selectedStaff) return;

    try {
      setAssigningUid(uid);
      await useAlertStore.getState().lockAlertForResolution(alert.id, {
        email: selectedStaff.email,
        displayName: selectedStaff.displayName,
        uid: selectedStaff.uid
      } as any);
      showToast(`Đã giao việc cho ${selectedStaff.displayName || selectedStaff.email}`, "success");
      setIsAssignDropdownOpen(false);
    } catch (error: any) {
      console.error(error);
      showToast("Không thể giao việc cho nhân viên.", "error");
    } finally {
      setAssigningUid(null);
    }
  };

  const handleOpenCustomerContact = async () => {
    if (!canOpenContact || isOpeningContact) return;
    if (!contactUrl) {
      showToast("Cảnh báo này chưa có liên kết để liên hệ khách hàng.", "error");
      return;
    }

    const template = createDefaultContactTemplate(alert.author || "Anh/Chị", alert.brand);
    const openedAt = new Date().toISOString();
    window.open(contactUrl, "_blank", "noopener,noreferrer");

    try {
      await navigator.clipboard.writeText(template);
    } catch (error) {
      console.warn("Could not copy the default contact template:", error);
    }

    setIsOpeningContact(true);
    try {
      await useAlertStore.getState().updateAlertStatus(alert.id, "resolving", profile, {
        note: "Đã mở liên kết liên hệ khách hàng và tạo mẫu phản hồi xin lỗi mặc định.",
        customer_contact_opened_at: openedAt,
        customer_contact_opened_by: profile?.email || profile?.uid || "unknown",
        customer_contact_template: template,
      }, alert.brand);
      showToast("Đã sao chép mẫu xin lỗi và mở liên kết liên hệ.");
    } catch (error) {
      console.error(error);
      showToast("Đã mở liên kết nhưng chưa lưu được dấu vết liên hệ.", "error");
    } finally {
      setIsOpeningContact(false);
    }
  };
  const historyEntries = useMemo<AlertHistoryViewEntry[]>(() => {
    const entries: AlertHistoryViewEntry[] = [
      {
        key: `detected-${alert.id}`,
        timestamp: alert.created_at,
        title: "Hệ thống phát hiện cảnh báo",
        detail: "Nội dung được đưa vào hàng chờ xử lý khủng hoảng.",
        badge: "Khởi tạo",
        kind: "detected",
      },
    ];

    (alert.resolution_history || []).forEach((entry, index) => {
      const actor = entry.resolved_by_name || getResolverName(entry.resolved_by_email) || "Nhân viên xử lý";
      const isSkipEntry = entry.action_type === "skip";
      const isRestoreEntry = entry.action_type === "restore";
      entries.push({
        key: `resolution-${entry.timestamp}-${index}`,
        timestamp: entry.timestamp,
        title: isSkipEntry ? "Đã bỏ qua cảnh báo" : isRestoreEntry ? "Đã khôi phục cảnh báo" : actor,
        detail: isSkipEntry
          ? `${actor}\n${entry.note || "Cảnh báo được xác định là không liên quan."}`
          : isRestoreEntry
            ? `${actor}\n${entry.note || "Chuyển cảnh báo về trạng thái Đang xử lý."}`
            : entry.note || "Đã cập nhật trạng thái xử lý.",
        badge: isSkipEntry ? "Bỏ qua" : isRestoreEntry ? "Khôi phục" : `Cập nhật ${entry.attempt_number || index + 1}`,
        imageUrl: entry.image_url,
        kind: "resolution",
      });
    });

    (alert.customer_contact_history || []).forEach((entry, index) => {
      const detail = [
        entry.note,
        entry.template ? `Mẫu liên hệ: ${entry.template}` : "",
      ].filter(Boolean).join("\n\n");
      entries.push({
        key: `contact-${entry.completed_at}-${index}`,
        timestamp: entry.completed_at,
        title: `Liên hệ khách hàng lần ${index + 1} · ${getResolverName(entry.opened_by) || "Nhân viên xử lý"}`,
        detail,
        badge: `${CONTACT_OUTCOME_LABELS[entry.outcome_status] || entry.outcome_status} · ${CONTACT_RESULT_LABELS[entry.response_result] || entry.response_result}`,
        imageUrl: entry.evidence_image,
        kind: "contact",
      });
    });

    const currentContactAlreadyArchived = (alert.customer_contact_history || []).some((entry) =>
      entry.opened_at === alert.customer_contact_opened_at &&
      entry.note === alert.customer_contact_note &&
      entry.evidence_image === alert.customer_contact_evidence_image
    );
    if (
      alert.customer_contact_opened_at &&
      !currentContactAlreadyArchived &&
      (alert.customer_contact_note || alert.customer_contact_evidence_image || alert.customer_response_result)
    ) {
      const currentResult = alert.customer_response_result
        ? CONTACT_RESULT_LABELS[alert.customer_response_result] || alert.customer_response_result
        : "Chưa chọn kết quả phản hồi";
      entries.push({
        key: `contact-current-${alert.customer_contact_opened_at}`,
        timestamp: alert.customer_contact_opened_at,
        title: `Lần liên hệ đang xử lý · ${getResolverName(alert.customer_contact_opened_by) || "Nhân viên xử lý"}`,
        detail: alert.customer_contact_note || "Đã mở nguồn liên hệ, chưa bổ sung ghi chú.",
        badge: `Đang ghi nhận · ${currentResult}`,
        imageUrl: alert.customer_contact_evidence_image,
        kind: "contact",
      });
    }

    (alert.internal_notes || []).forEach((entry, index) => {
      entries.push({
        key: `note-${entry.timestamp}-${index}`,
        timestamp: entry.timestamp,
        title: entry.author || "Ghi chú nội bộ",
        detail: entry.note,
        badge: "Ghi chú nội bộ",
        kind: "note",
      });
    });

    if (alert.escalation) {
      const escalationDetail = [
        alert.escalation.draft_response ? `Phản hồi đề xuất: ${alert.escalation.draft_response}` : "",
        alert.escalation.compensation ? `Phương án bồi thường: ${alert.escalation.compensation}` : "",
        alert.escalation.approval_note ? `Ghi chú duyệt: ${alert.escalation.approval_note}` : "",
      ].filter(Boolean).join("\n\n");
      entries.push({
        key: `escalation-${alert.escalation.submitted_at}`,
        timestamp: alert.escalation.submitted_at,
        title: `Escalation bởi ${alert.escalation.submitted_by_name || getResolverName(alert.escalation.submitted_by_email) || "Nhân viên xử lý"}`,
        detail: escalationDetail || "Đã gửi yêu cầu escalation.",
        badge: alert.escalation.status === "approved" ? "Đã duyệt" : alert.escalation.status === "rejected" ? "Từ chối" : "Chờ duyệt",
        kind: "escalation",
      });
    }

    return entries.sort((left, right) => {
      const leftTime = new Date(left.timestamp).getTime();
      const rightTime = new Date(right.timestamp).getTime();
      return (Number.isFinite(leftTime) ? leftTime : 0) - (Number.isFinite(rightTime) ? rightTime : 0);
    });
  }, [alert, getResolverName]);

  useEffect(() => {
    setOptimisticClaimId(null);
    setIsOpeningContact(false);
    setPreviewHistoryImage(null);
    setShowSkipConfirmation(false);
    setSkipError("");
  }, [alert.id]);

  useEffect(() => {
    if (claimedOptimistically && workflowStatus !== "pending" && normalizedOwner === normalizedProfileEmail) {
      setOptimisticClaimId(null);
    }
  }, [claimedOptimistically, normalizedOwner, normalizedProfileEmail, workflowStatus]);

  const handlePrimaryAction = async () => {
    if (canClaim) {
      setOptimisticClaimId(alert.id);
      try {
        await onClaim(alert);
      } catch {
        setOptimisticClaimId(null);
      }
      return;
    }
  };

  const handleSkip = async () => {
    if (!canSkip || isSkipping) return;

    try {
      setIsSkipping(true);
      setSkipError("");
      await onSkip(alert);
      setShowSkipConfirmation(false);
      showToast("Đã chuyển cảnh báo sang Đã bỏ qua.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể bỏ qua cảnh báo này.";
      setSkipError(message);
      showToast(message, "error");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleRestore = async () => {
    if (!canRestore || isRestoring) return;

    try {
      setIsRestoring(true);
      await onRestore(alert);
      showToast("Cảnh báo đã được khôi phục và chuyển về Đang xử lý.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể khôi phục cảnh báo này.", "error");
    } finally {
      setIsRestoring(false);
    }
  };
  const tabs: Array<{ id: AlertDetailPanelTab; label: string }> = [
    { id: "action", label: "Xử lý" },
    { id: "profile", label: "Hồ sơ" },
    { id: "interactions", label: "Tương tác" },
    { id: "history", label: "Lịch sử" },
  ];
  const workflowSteps = [
    { label: "Đã chọn", complete: true, active: false },
    { label: "Nhận xử lý", complete: Boolean(effectiveOwner), active: !effectiveOwner },
    {
      label: "Mở nguồn",
      complete: Boolean(alert.customer_contact_opened_at) || effectiveWorkflowStatus === "resolved",
      active: Boolean(effectiveOwner) && !alert.customer_contact_opened_at && !isTerminal,
    },
    {
      label: "Ghi nhận kết quả",
      complete: effectiveWorkflowStatus === "resolved",
      active: Boolean(alert.customer_contact_opened_at) && !isTerminal,
    },
  ];

  return (
    <aside data-tour="alert-detail-panel" className="flex min-w-0 shrink-0 flex-col self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm min-[1100px]:sticky min-[1100px]:top-3 min-[1100px]:h-[calc(100vh-88px)] min-[1100px]:max-h-[calc(100vh-88px)]">
      <header className="shrink-0 border-b border-[var(--color-border)] px-3 pb-0 pt-2.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-xs font-black text-[var(--color-brand)]">{(alert.author || "CB").slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-sm font-black text-[var(--color-text-primary)]">{alert.author || "Người dùng ẩn danh"}</h2>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">{alert.severity || "unknown"}</span>
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <PlatformLogo platform={alert.source} size="sm" />
                <span className="truncate">{alert.source || "Nền tảng khác"} · {claimedOptimistically ? "Đang xử lý" : getStatusLabel(alert)} · {ownerName}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showTerminalActions ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenSource(alert)}
                  disabled={!sourceUrl}
                  title={sourceUrl ? "Mở nội dung trên nền tảng nguồn" : "Không có liên kết nguồn"}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink size={16} />
                  <span className="hidden sm:inline">Mở nguồn</span>
                </button>
                {canRestore && (
                  <button
                    type="button"
                    onClick={() => void handleRestore()}
                    disabled={isRestoring}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-lg">restore</span>
                    <span className="hidden sm:inline">{isRestoring ? "Đang khôi phục..." : "Khôi phục"}</span>
                  </button>
                )}
              </>
            ) : canClaim ? (
              role === "brand_manager" ? (
                <div className="flex items-center gap-2" ref={dropdownRef}>
                  <div className="relative">
                    <button type="button" onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)} disabled={!canUpdate || loadingStaff} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                      <UserPlus size={16} />
                      <span className="hidden min-[1350px]:inline">Giao việc cho nhân viên</span>
                      <ChevronDown size={14} className={`transition-transform ${isAssignDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isAssignDropdownOpen && (
                      <div className="absolute right-0 top-full z-50 mt-1 max-h-60 w-64 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1 shadow-xl">
                        {loadingStaff ? (
                          <div className="p-2 text-center text-sm text-[var(--color-text-secondary)]">Đang tải...</div>
                        ) : staffList.length === 0 ? (
                          <div className="p-2 text-center text-sm text-[var(--color-text-secondary)]">Không có nhân viên xử lý</div>
                        ) : (
                          staffList.map((staff) => (
                            <button key={staff.uid} type="button" onClick={() => void handleAssignTo(staff.uid)} disabled={assigningUid !== null} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-bg-surface-raised)] disabled:opacity-50">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[10px] font-bold text-[var(--color-brand)]">{staff.displayName?.slice(0, 2).toUpperCase() || "NV"}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{staff.displayName || "Nhân viên"}</span>
                                <span className="block truncate text-[10px] text-[var(--color-text-secondary)]">{staff.email}</span>
                              </span>
                              {assigningUid === staff.uid && <span className="text-[10px] text-[var(--color-brand)]">Đang giao...</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => void handlePrimaryAction()} disabled={!canUpdate || assigningUid !== null} title="Tự nhận xử lý" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)] disabled:opacity-50">
                    <span className="hidden sm:inline">Nhận xử lý</span>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => void handlePrimaryAction()} disabled={!canUpdate} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">Nhận xử lý</span>
                </button>
              )
            ) : canOpenContact ? (
              <button type="button" onClick={() => void handleOpenCustomerContact()} disabled={!contactUrl || isOpeningContact} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50" title={!contactUrl ? "Cảnh báo chưa có liên kết nguồn" : undefined}>
                <ExternalLink size={16} />
                <span className="hidden sm:inline">{isOpeningContact ? "Đang mở..." : "Mở nguồn"}</span>
              </button>
            ) : null}
            {canSkip && (
              <button
                type="button"
                onClick={() => {
                  setSkipError("");
                  setShowSkipConfirmation(true);
                }}
                disabled={isSkipping}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-error)]/35 bg-[var(--color-bg-surface)] px-3 text-[13px] font-semibold text-[var(--color-error)] transition hover:bg-[var(--color-error-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error)]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">block</span>
                <span className="hidden sm:inline">Bỏ qua</span>
              </button>
            )}
            <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]" title="Thu gọn panel" aria-label="Thu gọn panel">
              <PanelRightClose size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <ol aria-label="Tiến trình xử lý cảnh báo" className="mt-2 grid grid-cols-4 gap-1 rounded-lg bg-[var(--color-bg-surface-raised)] p-1.5">
          {workflowSteps.map((step, index) => (
            <li key={step.label} className="flex min-w-0 items-center">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${step.complete ? "bg-[var(--color-success)] text-white" : step.active ? "bg-[var(--color-brand)] text-white ring-2 ring-[var(--color-brand)]/20" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}>
                  {step.complete ? <span className="material-symbols-outlined text-xs">check</span> : index + 1}
                </span>
                <span className={`truncate text-[11px] font-bold ${step.active ? "text-[var(--color-brand)]" : step.complete ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{step.label}</span>
              </div>
              {index < workflowSteps.length - 1 && <span className="mx-1 h-px w-3 shrink-0 bg-[var(--color-border)]" />}
            </li>
          ))}
        </ol>

        <div className="mt-1.5 flex gap-4 overflow-x-auto" role="tablist" aria-label="Chi tiết cảnh báo">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} role="tab" aria-selected={activeTab === tab.id} className={`relative min-h-8 shrink-0 border-b-2 px-1 text-xs font-semibold transition ${activeTab === tab.id ? "border-[var(--color-brand)] text-[var(--color-brand)]" : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"}`}>{tab.label}</button>
          ))}
        </div>
      </header>

      <div className={`min-h-0 flex-1 p-2.5 [scrollbar-gutter:stable] ${
        activeTab === "action"
          ? "overflow-y-auto min-[1280px]:overflow-hidden"
          : "overflow-y-auto"
      }`}>
        {activeTab === "action" && (
          <div className="grid items-start gap-2 min-[1280px]:h-full min-[1280px]:min-h-0 min-[1280px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-[1280px]:items-stretch">
            <div className="min-w-0 space-y-2 min-[1280px]:min-h-0 min-[1280px]:overflow-y-auto min-[1280px]:pr-1 min-[1280px]:[scrollbar-gutter:stable]">
              <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={18} />
                  <div>
                    <h3 className="text-sm font-black text-[var(--color-text-primary)]">Lý do ưu tiên</h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{getPriorityReason(alert)}</p>
                  </div>
                </div>
              </section>
              <AlertContentContext alert={alert} />
            </div>

            <aside className="space-y-2 min-[1280px]:min-h-0 min-[1280px]:overflow-y-auto min-[1280px]:pl-1 min-[1280px]:[scrollbar-gutter:stable]" aria-label="Công cụ xử lý cảnh báo">
              {/* <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Người phụ trách</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-xs font-black text-[var(--color-brand)]">{effectiveOwner ? ownerName.slice(0, 2).toUpperCase() : "--"}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{ownerName}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">Đội xử lý khủng hoảng</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-secondary)]">{isMine ? "Của tôi" : workflowStatus === "pending" ? "Chưa phân công" : getStatusLabel(alert)}</span>
                </div>
              </section> */}

              {isMine && (effectiveWorkflowStatus === "processing" || effectiveWorkflowStatus === "contact_failed") ? (
                <AlertContactWorkflow
                  alert={alert}
                  getResolverName={getResolverName}
                  onRecordResult={(draft) => onRecordResult(alert, draft)}
                />
              ) : (
                <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 shadow-sm">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Xử lý cảnh báo</h3>
                  <p className="mt-2 rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                    {effectiveWorkflowStatus === "resolved"
                      ? "Cảnh báo đã được hoàn tất. Bạn có thể xem lại toàn bộ lịch sử xử lý."
                      : effectiveWorkflowStatus === "skipped"
                        ? "Cảnh báo đã được bỏ qua và không được tính là đã giải quyết."
                      : canClaim
                        ? "Sử dụng nút Nhận xử lý ở đầu panel để bắt đầu nghiệp vụ."
                        : "Cảnh báo đang do nhân viên khác phụ trách hoặc nằm ngoài quyền cập nhật của bạn."}
                  </p>
                </section>
              )}
            </aside>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-3">
            <section className="grid gap-3 rounded-lg border border-[var(--color-border)] p-3 md:grid-cols-[1fr_0.8fr_1fr_auto] md:items-center">
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Nền tảng</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{alert.source || "Không rõ"}</p></div>
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Điểm rủi ro</p><p className="mt-1 text-sm font-black text-[var(--color-brand)]">{Math.round(alert.negativity_score || 0)}/100</p></div>
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Phạm vi tiếp cận</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{(alert.reach || 0).toLocaleString("vi-VN")}</p></div>
              <button type="button" onClick={() => onOpenSource(alert)} disabled={!sourceUrl} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-xs font-bold text-[var(--color-brand)] disabled:opacity-40">Mở nguồn gốc<ExternalLink size={15} /></button>
            </section>
            <div className="grid gap-3 lg:grid-cols-2">
              <InfoSection title="Thông tin cơ bản" rows={[["Tên hiển thị", alert.author || "Ẩn danh"], ["Thương hiệu", alert.brand], ["Chủ đề", alert.topic || "Chưa xác định"], ["Loại nội dung", alert.content_type || "mention"]]} />
              <InfoSection title="Thông tin xử lý" rows={[["Người phụ trách", ownerName], ["Trạng thái", getStatusLabel(alert)], ["Mức độ", String(alert.severity || "Không rõ").toUpperCase()], ["Nghiệp vụ", "Khủng hoảng"]]} />
            </div>
          </div>
        )}

        {activeTab === "interactions" && (
          <CustomerInteractionHistoryPanel sourceType="alert" sourceId={alert.id} />
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <section className="grid gap-3 sm:grid-cols-3">
              <Metric icon={<Clock3 size={18} />} label="Phát hiện" value={formatDate(alert.created_at)} />
              <Metric icon={<MessageSquareText size={18} />} label="Lần liên hệ" value={String(alert.customer_contact_history?.length || 0)} />
              <Metric icon={<CheckCircle2 size={18} />} label="Trạng thái" value={getStatusLabel(alert)} />
            </section>
            <section className="rounded-lg border border-[var(--color-border)] p-3">
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">Timeline xử lý</h3>
              <div className="mt-3">
                {historyEntries.map((entry) => (
                  <TimelineRow
                    key={entry.key}
                    time={formatDate(entry.timestamp)}
                    icon={entry.kind === "detected" ? <Activity size={12} /> : entry.kind === "contact" ? <MessageSquareText size={12} /> : entry.kind === "escalation" ? <ShieldAlert size={12} /> : <UserRound size={12} />}
                    title={entry.title}
                    detail={entry.detail}
                    badge={entry.badge}
                    imageUrl={entry.imageUrl}
                    onPreviewImage={setPreviewHistoryImage}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {showSkipConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="skip-alert-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => !isSkipping && setShowSkipConfirmation(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-error-subtle)] text-[var(--color-error)]">
                <span className="material-symbols-outlined">block</span>
              </span>
              <div>
                <h3 id="skip-alert-title" className="text-base font-black text-[var(--color-text-primary)]">Bỏ qua cảnh báo này?</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                  Cảnh báo sẽ chuyển sang “Đã bỏ qua” và không được tính là đã giải quyết.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[var(--color-bg-surface-raised)] p-3">
              <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{alert.author || "Người dùng ẩn danh"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{alert.text || alert.comment_content || "Không có nội dung xem trước."}</p>
            </div>
            {skipError && <p className="mt-3 rounded-lg bg-[var(--color-error-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-error)]">{skipError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSkipConfirmation(false)} disabled={isSkipping} className="min-h-10 rounded-lg border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] disabled:opacity-60">Quay lại</button>
              <button type="button" onClick={() => void handleSkip()} disabled={isSkipping} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-error)] px-4 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                <span className="material-symbols-outlined text-base">block</span>
                {isSkipping ? "Đang bỏ qua..." : "Xác nhận bỏ qua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewHistoryImage && (
        <div role="dialog" aria-modal="true" aria-label="Xem ảnh minh chứng lịch sử" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setPreviewHistoryImage(null)}>
          <button type="button" onClick={() => setPreviewHistoryImage(null)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Đóng ảnh minh chứng">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={previewHistoryImage} alt="Ảnh minh chứng trong lịch sử xử lý" className="max-h-[90vh] max-w-[92vw] rounded-xl bg-white object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3.5 text-sm font-bold shadow-2xl animate-fade-in ${toast.type === "success"
              ? "border-emerald-200 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "border-red-200 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </aside>
  );
}

function InfoSection({ title, rows }: { title: string; rows: string[][] }) {
  return <section className="rounded-lg border border-[var(--color-border)] p-3"><h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3><dl className="mt-3 space-y-2 text-xs">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-[var(--color-text-muted)]">{label}</dt><dd className="text-right font-bold text-[var(--color-text-primary)]">{value}</dd></div>)}</dl></section>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--color-border)] p-3"><span className="text-[var(--color-brand)]">{icon}</span><p className="mt-2 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">{label}</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{value}</p></div>;
}

function TimelineRow({ time, icon, title, detail, badge, imageUrl, onPreviewImage }: { time: string; icon: React.ReactNode; title: string; detail: string; badge?: string; imageUrl?: string; onPreviewImage: (imageUrl: string) => void }) {
  return <article className="grid grid-cols-[72px_24px_minmax(0,1fr)] gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0"><time className="text-[10px] font-semibold text-[var(--color-text-muted)]">{time}</time><span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">{icon}</span><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-xs font-bold text-[var(--color-text-primary)]">{title}</p>{badge && <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[9px] font-bold text-[var(--color-text-secondary)]">{badge}</span>}</div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--color-text-secondary)]">{detail}</p>{imageUrl && <button type="button" onClick={() => onPreviewImage(imageUrl)} className="mt-2 block w-full cursor-zoom-in overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-1 text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30" title="Bấm để xem ảnh đầy đủ"><img src={imageUrl} alt={`Minh chứng: ${title}`} className="max-h-64 w-full rounded-md object-contain" /></button>}</div></article>;
}
