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
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { useAlertStore, type AlertData } from "@/stores/alert.store";
import { useAuth } from "@/hooks/useAuth";
import { AlertContactWorkflow } from "./AlertContactWorkflow";
import { CustomerInteractionHistoryPanel } from "@/components/customer-interactions/CustomerInteractionHistoryPanel";

export type AlertDetailPanelTab = "action" | "profile" | "interactions" | "history";

interface AlertDetailPanelProps {
  alert: AlertData;
  activeTab: AlertDetailPanelTab;
  onTabChange: (tab: AlertDetailPanelTab) => void;
  profileEmail?: string | null;
  canUpdate: boolean;
  getResolverName: (value: string | null | undefined) => string;
  onClose: () => void;
  onClaim: (alert: AlertData) => Promise<void>;
  onRecordResult: (alert: AlertData) => Promise<void>;
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
  if (status === "resolved") return "Đã giải quyết";
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
  onTabChange,
  profileEmail,
  canUpdate,
  getResolverName,
  onClose,
  onClaim,
  onRecordResult,
  onOpenSource,
}: AlertDetailPanelProps) {
  const workflowStatus = getAlertWorkflowStatus(alert);
  const [optimisticClaimId, setOptimisticClaimId] = useState<string | null>(null);
  const [isRecordingResult, setIsRecordingResult] = useState(false);
  const [previewHistoryImage, setPreviewHistoryImage] = useState<string | null>(null);
  const claimedOptimistically = optimisticClaimId === alert.id;
  const normalizedOwner = String(alert.being_resolved_by || "").trim().toLowerCase();
  const normalizedProfileEmail = String(profileEmail || "").trim().toLowerCase();
  const isMine = claimedOptimistically || Boolean(normalizedProfileEmail && normalizedOwner === normalizedProfileEmail);
  const effectiveWorkflowStatus = claimedOptimistically ? "processing" : workflowStatus;
  const effectiveOwner = claimedOptimistically ? profileEmail : alert.being_resolved_by;
  const ownerName = getResolverName(effectiveOwner) || "Chưa có người phụ trách";
  const canClaim = canUpdate && !claimedOptimistically && workflowStatus === "pending" && !alert.being_resolved_by;
  const canRecord = canUpdate && isMine && (effectiveWorkflowStatus === "processing" || effectiveWorkflowStatus === "contact_failed");
  const hasRequiredResultEvidence = Boolean(
    alert.customer_contact_opened_at &&
    alert.customer_contact_note?.trim() &&
    alert.customer_contact_evidence_image &&
    alert.customer_response_result
  );

  const { role, profile, user } = useAuth();
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
      entries.push({
        key: `resolution-${entry.timestamp}-${index}`,
        timestamp: entry.timestamp,
        title: entry.resolved_by_name || getResolverName(entry.resolved_by_email) || "Nhân viên xử lý",
        detail: entry.note || "Đã cập nhật trạng thái xử lý.",
        badge: `Cập nhật ${entry.attempt_number || index + 1}`,
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
    setIsRecordingResult(false);
    setPreviewHistoryImage(null);
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

    if (!canRecord || !hasRequiredResultEvidence || isRecordingResult) return;
    setIsRecordingResult(true);
    try {
      await onRecordResult(alert);
    } catch {
      // The page-level handler already reports the failure to the user.
    } finally {
      setIsRecordingResult(false);
    }
  };
  const tabs: Array<{ id: AlertDetailPanelTab; label: string }> = [
    { id: "action", label: "Xử lý" },
    { id: "profile", label: "Hồ sơ" },
    { id: "interactions", label: "Tương tác" },
    { id: "history", label: "Lịch sử" },
  ];

  return (
    <aside data-tour="alert-detail-panel" className="min-w-0 self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
      <header className="border-b border-[var(--color-border)] p-[2%]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-black text-[var(--color-brand)]">{(alert.author || "CB").slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-[var(--color-text-primary)]">{alert.author || "Người dùng ẩn danh"}</h2>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">{alert.severity || "unknown"}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <PlatformLogo platform={alert.source} size="sm" />
                <span>{alert.source || "Nền tảng khác"}</span><span>·</span><span>{claimedOptimistically ? "Đang xử lý" : getStatusLabel(alert)}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]" title="Thu gọn panel" aria-label="Thu gọn panel">
            <PanelRightClose size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold transition ${activeTab === tab.id ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)]"}`}>{tab.label}</button>
          ))}
        </div>
      </header>

      <div className="p-[2%]">
        {activeTab === "action" && (
          <div className="space-y-3">
            <div className={canClaim || canRecord ? "grid gap-3 md:grid-cols-[0.96fr_1.04fr]" : "block"}>
              <section className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">Người phụ trách</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-sm font-black text-[var(--color-brand)]">{effectiveOwner ? ownerName.slice(0, 2).toUpperCase() : "--"}</span>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{ownerName}</p><p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Đội xử lý khủng hoảng</p></div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{isMine ? "Của tôi" : workflowStatus === "pending" ? "Chưa phân công" : getStatusLabel(alert)}</span>
                </div>
              </section>

              {(canClaim || canRecord) && (
                <section className="flex flex-col justify-between rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/20 p-3">
                  <div className="flex items-start gap-2.5"><ShieldAlert className="mt-0.5 shrink-0 text-[var(--color-brand)]" size={19} /><div><p className="text-sm font-bold text-[var(--color-brand)]">Hành động chính</p><p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">{canClaim ? "Nhận cảnh báo để bắt đầu xử lý." : hasRequiredResultEvidence ? "Đã đủ minh chứng và kết quả phản hồi để hoàn tất." : "Cần lưu minh chứng liên hệ và kết quả phản hồi trước."}</p></div></div>
                  {canClaim ? (
                    <div className="mt-3 flex w-full flex-row gap-2" ref={dropdownRef}>
                      {role === "brand_manager" ? (
                        <>
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                              disabled={!canUpdate || loadingStaff}
                              className="inline-flex w-full items-center justify-between rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                            >
                              <div className="flex items-center gap-2">
                                <UserPlus size={18} />
                                Giao việc cho nhân viên
                              </div>
                              <ChevronDown size={18} className={`transition-transform duration-200 ${isAssignDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isAssignDropdownOpen && (
                              <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1 shadow-lg">
                                {loadingStaff ? (
                                  <div className="p-2 text-center text-sm text-[var(--color-text-secondary)]">
                                    Đang tải...
                                  </div>
                                ) : staffList.length === 0 ? (
                                  <div className="p-2 text-center text-sm text-[var(--color-text-secondary)]">
                                    Không có nhân viên xử lý
                                  </div>
                                ) : (
                                  staffList.map((staff) => (
                                    <button
                                      key={staff.uid}
                                      type="button"
                                      onClick={() => void handleAssignTo(staff.uid)}
                                      disabled={assigningUid !== null}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-[var(--color-bg-surface-raised)] disabled:opacity-50"
                                    >
                                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[10px] font-bold text-[var(--color-brand)]">
                                        {staff.displayName?.slice(0, 2).toUpperCase() || "NV"}
                                      </div>
                                      <div className="flex-1 truncate">
                                        <p className="truncate text-sm text-[var(--color-text-primary)]">
                                          {staff.displayName || "Nhân viên"}
                                        </p>
                                        <p className="truncate text-[10px] text-[var(--color-text-secondary)]">
                                          {staff.email}
                                        </p>
                                      </div>
                                      {assigningUid === staff.uid && (
                                        <span className="shrink-0 text-xs text-[var(--color-brand)]">
                                          Đang giao...
                                        </span>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => void handlePrimaryAction()}
                            disabled={!canUpdate || assigningUid !== null}
                            title="Tự nhận xử lý"
                            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nhận xử lý
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handlePrimaryAction()}
                          disabled={!canUpdate}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          <UserPlus size={18} />
                          Nhận xử lý
                        </button>
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => void handlePrimaryAction()} disabled={canRecord && (!hasRequiredResultEvidence || isRecordingResult)} title={canRecord && !hasRequiredResultEvidence ? "Cần có ghi chú, ảnh minh chứng và kết quả phản hồi của khách hàng" : undefined} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
                      <CheckCircle2 size={18} />{isRecordingResult ? "Đang ghi nhận..." : "Ghi nhận kết quả"}
                    </button>
                  )}
                </section>
              )}
            </div>

            <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-2.5"><ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={18} /><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Lý do ưu tiên</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{getPriorityReason(alert)}</p></div></div>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-2"><MessageSquareText size={17} className="text-[var(--color-brand)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Nội dung cần xử lý</h3></div>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--color-bg-surface-raised)] p-3 text-sm leading-6 text-[var(--color-text-secondary)]">{alert.text || alert.comment_content || "Không có nội dung hiển thị."}</p>
              <p className="mt-2 text-[10px] font-medium text-[var(--color-text-muted)]">Phát hiện lúc {formatDate(alert.created_at)}</p>
            </section>

            {isMine && (effectiveWorkflowStatus === "processing" || effectiveWorkflowStatus === "contact_failed") && (
              <AlertContactWorkflow alert={alert} getResolverName={getResolverName} />
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-3">
            <section className="grid gap-3 rounded-lg border border-[var(--color-border)] p-3 md:grid-cols-[1fr_0.8fr_1fr_auto] md:items-center">
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Nền tảng</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{alert.source || "Không rõ"}</p></div>
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Điểm rủi ro</p><p className="mt-1 text-sm font-black text-[var(--color-brand)]">{Math.round(alert.negativity_score || 0)}/100</p></div>
              <div><p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Phạm vi tiếp cận</p><p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{(alert.reach || 0).toLocaleString("vi-VN")}</p></div>
              <button type="button" onClick={() => onOpenSource(alert)} disabled={!alert.url || alert.url === "#"} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-brand-border)] px-3 py-2 text-xs font-bold text-[var(--color-brand)] disabled:opacity-40">Mở nguồn gốc<ExternalLink size={15} /></button>
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
          className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3.5 text-sm font-bold shadow-2xl animate-fade-in ${
            toast.type === "success"
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
