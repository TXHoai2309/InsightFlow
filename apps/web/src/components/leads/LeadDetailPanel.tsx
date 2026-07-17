"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCheck, Sparkles, UserPlus, ShieldAlert, ChevronDown } from "lucide-react";
import { LeadHistoryTab } from "@/components/leads/LeadHistoryTab";
import { LeadProfileTab } from "@/components/leads/LeadProfileTab";
import { LeadContentContext } from "@/components/leads/LeadContentContext";
import { CustomerInteractionHistoryPanel } from "@/components/customer-interactions/CustomerInteractionHistoryPanel";
import { useDashboardStore } from "@/stores/dashboard.store";
import {
  getLeadOperationErrorMessage,
  PLATFORM_META,
} from "@/lib/services/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { canPerformAction } from "@/lib/rbac";
import { isSameBrandScope } from "@/lib/brandScope";
import {
  LEAD_DETAIL_PANEL_SCROLL_ID,
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
  workbenchView: LeadWorkbenchView;
  onClose: () => void;
  onAfterResult?: () => void;
  onStartedAction?: (lead: Lead, preventJump?: boolean) => void;
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
  description: string;
}> = [
  { id: "positive", label: "Khách phản hồi tích cực", icon: "thumb_up", status: "processing", description: "Khách hàng có quan tâm và tương tác tốt." },
  { id: "no_response", label: "Chưa phản hồi", icon: "schedule", status: "processing", description: "Đã liên hệ nhưng khách chưa trả lời." },
  { id: "follow_up", label: "Hẹn lại", icon: "event", status: "processing", description: "Khách hẹn liên hệ lại vào thời gian khác." },
  { id: "not_fit", label: "Không phù hợp", icon: "block", status: "skipped", description: "Khách không có nhu cầu hoặc sai đối tượng." },
  { id: "converted", label: "Đã chuyển đổi", icon: "emoji_events", status: "completed", description: "Khách hàng đã đồng ý chốt deal/đăng ký." },
];

function toDateInputValue(dateIso?: string) {
  if (!dateIso) return "";
  return new Date(dateIso).toISOString().slice(0, 10);
}

function toTimeInputValue(dateIso?: string) {
  if (!dateIso) return "";
  return new Date(dateIso).toTimeString().slice(0, 5);
}

export function LeadDetailPanel({
  lead,
  mentions = [],
  nowMs,
  workbenchView,
  onClose,
  onAfterResult,
  onStartedAction,
  activeTab: activeTabProp,
  onTabChange,
  isCollapsed,
  onCollapseToggle,
}: LeadDetailPanelProps) {
  const { profile, role, user } = useAuth();
  const { updateLeadDetails, claimLead } = useDashboardStore();
  const [internalActiveTab, setInternalActiveTab] = useState<PanelTab>("action");
  const [staffList, setStaffList] = useState<{uid: string, displayName: string, email: string}[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningUid, setAssigningUid] = useState<string | null>(null);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isResultDropdownOpen, setIsResultDropdownOpen] = useState(false);
  const resultDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssignDropdownOpen(false);
      }
      if (resultDropdownRef.current && !resultDropdownRef.current.contains(event.target as Node)) {
        setIsResultDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (role === 'brand_manager' && workbenchView === "unassigned") {
      const loadStaff = async () => {
        setLoadingStaff(true);
        try {
          const token = await user?.getIdToken();
          const res = await fetch("/api/staff", { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok && data.data) {
            setStaffList(data.data.filter((s: any) => !s.disabled && (s.permissions || []).includes("leads")));
          }
        } catch (e) {
          console.error(e);
        }
        setLoadingStaff(false);
      };
      loadStaff();
    }
  }, [role, workbenchView, user]);

  const handleAssignTo = async (uid: string) => {
    if (!uid || !canEdit || !profile) return;
    const selectedStaff = staffList.find(s => s.uid === uid);
    if (!selectedStaff) return;
    
    try {
      setAssigningUid(uid);
      setSaveError("");
      const nowIso = new Date().toISOString();
      const ownerData: Partial<Lead> = {
        owner_id: selectedStaff.uid,
        owner_name: selectedStaff.displayName || selectedStaff.email || "Nhân viên",
        owner_email: selectedStaff.email,
        assigned_at: nowIso,
        assigned_by: profile.uid,
        claimed_at: nowIso,
      };

      await updateLeadDetails(lead.id, ownerData, profile);
      onStartedAction?.({ ...lead, ...ownerData }, true);
      showToast(`Đã giao việc cho ${ownerData.owner_name}`, "success");
    } catch (error: any) {
      console.error(error);
      const message = getLeadOperationErrorMessage(
        error,
        "Không thể giao việc cho nhân viên.",
      );
      setSaveError(message);
      showToast(message, "error");
    } finally {
      setAssigningUid(null);
    }
  };
  const [selectedResult, setSelectedResult] = useState<ResultAction | null>(null);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipNote, setSkipNote] = useState("");
  const [isSkipping, setIsSkipping] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [skipError, setSkipError] = useState("");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [isOpening, setIsOpening] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isResultSectionHighlighted, setIsResultSectionHighlighted] = useState(false);
  const resultSectionRef = useRef<HTMLElement | null>(null);
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
  const canSkipLead =
    canEdit &&
    (ownership.canClaim || ownership.canWork) &&
    lead.status !== "completed" &&
    lead.status !== "skipped";
  const sourceAction = getLeadSourceAction(lead);
  const profileSourceHref = sourceAction?.href || "";
  const canOpenProfileSource = Boolean(sourceAction && ownership.canWork);
  const platformMeta = PLATFORM_META[lead.platform];


  const getOwnerName = () =>
    profile?.displayName || profile?.email || "Nhân viên xử lý";

  const handleTabChange = (tab: PanelTab) => {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    setInternalActiveTab(tab);
  };

  const handleScrollToResult = () => {
    const resultSection = resultSectionRef.current;
    if (!resultSection) return;

    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => resultSection.focus({ preventScroll: true }), 350);
    setIsResultSectionHighlighted(true);
    window.setTimeout(() => setIsResultSectionHighlighted(false), 1800);
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
    if (!canEdit || !profile || isClaiming || !ownership.canClaim) return;

    try {
      setIsClaiming(true);
      setSaveError("");
      const claimData = await claimLead(lead.id, profile);
      onStartedAction?.({ ...lead, ...claimData });
      showToast("Nhận xử lý lead thành công!", "success");
    } catch (error: any) {
      console.error(error);
      const message = getLeadOperationErrorMessage(
        error,
        "Không thể nhận xử lý lead này.",
      );
      setSaveError(message);
      showToast(message, "error");
    } finally {
      setIsClaiming(false);
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

  const handleProfileOpenSource = () => {
    if (sourceAction) {
      void handleOpenAction(sourceAction, true);
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

      setIsSaveSuccess(true);
      showToast("Ghi nhận kết quả thành công!", "success");
      setTimeout(() => {
        setIsSaveSuccess(false);
        setSelectedResult(null);
        setNote("");
        setFollowUpDate("");
        setFollowUpTime("");
        onAfterResult?.();
      }, 2000);
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
    { id: "interactions", label: "Tương tác" },
    { id: "history", label: "Lịch sử" },
  ];

  return (
    <aside
      data-tour="lead-detail-panel"
      className="flex min-w-0 shrink-0 flex-col self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm min-[1100px]:sticky min-[1100px]:top-4 min-[1100px]:max-h-[calc(100vh-100px)]"
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
              <p className="truncate text-xs text-[var(--color-text-secondary)] mt-0.5">
                Người xử lý: {ownership.ownerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!lead.owner_id ? (
              role === "brand_manager" ? (
                <div className="flex items-center gap-2" ref={dropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                      disabled={!canEdit || loadingStaff}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-[13px] font-semibold text-white shadow-md shadow-[var(--color-brand)]/20 transition hover:shadow-[var(--color-brand)]/40 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserPlus size={16} />
                      <span className="hidden sm:inline">Giao việc cho nhân viên</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isAssignDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isAssignDropdownOpen && (
                      <div className="absolute right-0 top-full z-50 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1 shadow-lg">
                        {loadingStaff ? (
                          <div className="p-2 text-center text-sm text-[var(--color-text-secondary)]">Đang tải...</div>
                        ) : staffList.length === 0 ? (
                          <div className="p-2 text-center text-sm text-[var(--color-text-secondary)]">Không có nhân viên xử lý</div>
                        ) : (
                          staffList.map((staff) => (
                            <button
                              key={staff.uid}
                              type="button"
                              onClick={() => { void handleAssignTo(staff.uid); setIsAssignDropdownOpen(false); }}
                              disabled={assigningUid !== null}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-[var(--color-bg-surface-raised)] disabled:opacity-50"
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[10px] font-bold text-[var(--color-brand)]">
                                {staff.displayName?.slice(0, 2).toUpperCase() || "NV"}
                              </div>
                              <div className="flex-1 truncate">
                                <p className="truncate text-sm text-[var(--color-text-primary)]">{staff.displayName || "Nhân viên"}</p>
                                <p className="truncate text-[10px] text-[var(--color-text-secondary)]">{staff.email}</p>
                              </div>
                              {assigningUid === staff.uid && <span className="shrink-0 text-xs text-[var(--color-brand)]">Đang giao...</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleClaim()}
                    disabled={!canEdit || isClaiming || assigningUid !== null}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">{isClaiming ? "Đang nhận..." : "Nhận xử lý"}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleClaim()}
                  disabled={!canEdit || isClaiming}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-[13px] font-semibold text-white shadow-md shadow-[var(--color-brand)]/20 transition hover:shadow-[var(--color-brand)]/40 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">{isClaiming ? "Đang nhận..." : "Nhận xử lý"}</span>
                </button>
              )
            ) : (
              <>
                {sourceAction ? (
                  <button
                    type="button"
                    disabled={!ownership.canWork || Boolean(isOpening)}
                    onClick={() => handleOpenAction(sourceAction, true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    <span className="hidden sm:inline">{isOpening === sourceAction.label ? "Đang mở..." : "Mở nguồn"}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleScrollToResult}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-[13px] font-semibold text-white shadow-md shadow-[var(--color-brand)]/20 transition hover:shadow-[var(--color-brand)]/40 hover:opacity-90"
                >
                  <ClipboardCheck size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">Ghi nhận kết quả</span>
                </button>
              </>
            )}
            <div className="h-6 w-px bg-gray-200 mx-1.5" />
            {onCollapseToggle && (
              <button
                type="button"
                onClick={onCollapseToggle}
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                title="Thu gọn panel"
                aria-label="Thu gọn panel"
              >
                <span className="material-symbols-outlined text-[20px]">
                  dock_to_right
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Đóng chi tiết lead"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1 p-1 rounded-full bg-gray-50/50 border border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-tour={tab.id === "action" ? "lead-detail-tab-action" : undefined}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full rounded-full px-2 py-1.5 text-xs font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id={LEAD_DETAIL_PANEL_SCROLL_ID}
        className="flex-1 overflow-y-auto p-[2%] min-h-0"
      >
        {activeTab === "action" && (
          <div className="space-y-2.5">


            <LeadContentContext lead={lead} mentions={mentions} />



            <section
              ref={resultSectionRef}
              tabIndex={-1}
              data-tour="lead-detail-result-actions"
              className={`scroll-mt-4 rounded-xl border p-5 outline-none transition-shadow duration-300 shadow-sm ${
                isResultSectionHighlighted
                  ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/25 bg-white"
                  : "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]/30"
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">Ghi nhận kết quả nhanh</h4>
                {meta.needsResultCapture && <span className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">Chờ kết quả</span>}
              </div>
              {!canRecordResult && <p className="mb-4 rounded-lg bg-white p-3 text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] shadow-sm">Hãy nhận xử lý và mở nguồn trước khi ghi nhận kết quả.</p>}
              
              <div className="grid gap-4 md:grid-cols-[2fr_3fr] items-start">
                <div className="relative min-w-0" ref={resultDropdownRef}>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]">Kết quả xử lý</label>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!canRecordResult) {
                        showToast("Vui lòng nhận xử lý và mở nguồn trước khi ghi nhận kết quả.", "error");
                        return;
                      }
                      setIsResultDropdownOpen(!isResultDropdownOpen);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text-primary)] shadow-sm outline-none transition ${
                      canRecordResult 
                        ? "hover:border-[var(--color-brand)] focus:border-[var(--color-brand)]"
                        : "cursor-not-allowed bg-gray-50 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedResult ? (
                        <>
                          <span className="material-symbols-outlined shrink-0 text-[18px] text-[var(--color-brand)]">
                            {RESULT_OPTIONS.find(o => o.id === selectedResult)?.icon}
                          </span>
                          <span className="truncate font-semibold">{RESULT_OPTIONS.find(o => o.id === selectedResult)?.label}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Chọn kết quả xử lý</span>
                      )}
                    </div>
                    <span className="material-symbols-outlined shrink-0 text-[20px] text-gray-400">
                      {isResultDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  
                  {isResultDropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl animate-in fade-in slide-in-from-top-2">
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        {RESULT_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setSelectedResult(option.id);
                              setIsResultDropdownOpen(false);
                              if (option.id === "follow_up" && !followUpDate) {
                                const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                                setFollowUpDate(toDateInputValue(tomorrow.toISOString()));
                                setFollowUpTime(toTimeInputValue(tomorrow.toISOString()) || "09:00");
                              }
                            }}
                            className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                              selectedResult === option.id 
                                ? "bg-[var(--color-brand-subtle)]" 
                                : "hover:bg-[var(--color-bg-surface-raised)]"
                            }`}
                          >
                            <span className={`material-symbols-outlined mt-0.5 shrink-0 text-[20px] ${
                              selectedResult === option.id ? "text-[var(--color-brand)]" : "text-gray-500"
                            }`}>
                              {option.icon}
                            </span>
                            <div>
                              <p className={`text-sm font-semibold ${
                                selectedResult === option.id ? "text-[var(--color-brand)]" : "text-[var(--color-text-primary)]"
                              }`}>
                                {option.label}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{option.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedResult === "follow_up" && (
                    <div data-tour="lead-detail-followup" className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--color-text-secondary)]">Ngày follow-up</label>
                        <input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] shadow-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--color-text-secondary)]">Giờ follow-up</label>
                        <input type="time" value={followUpTime} onChange={(event) => setFollowUpTime(event.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] shadow-sm" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <label className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]">Ghi chú</label>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhập kết quả trao đổi với khách hàng...&#10;Ví dụ: khách hẹn liên hệ lại vào tuần sau." className="flex-1 min-h-[120px] w-full rounded-lg border border-[var(--color-border)] bg-white p-3.5 text-sm leading-relaxed text-[var(--color-text-primary)] shadow-sm outline-none transition focus:border-[var(--color-brand)] resize-y" />
                </div>
              </div>
              
              {saveError && <p className="mt-3 text-xs font-semibold text-[var(--color-error)]">{saveError}</p>}
              
              <div className="mt-5 flex justify-end">
                <button type="button" disabled={!selectedResult || isSaving || isSaveSuccess || !canRecordResult} onClick={handleSaveResult} className={`inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${isSaveSuccess ? "bg-emerald-500 shadow-emerald-500/20" : "bg-[var(--color-brand)] hover:shadow-[var(--color-brand)]/40 hover:scale-[1.02]"}`}>
                  {isSaveSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-bounce">check_circle</span>
                      <span>Lưu thành công!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck size={18} />
                      <span>{isSaving ? "Đang lưu..." : "Lưu kết quả"}</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-red-200 bg-red-50/40 p-3 dark:border-red-900/40 dark:bg-red-950/10">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-xl text-red-500">block</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[var(--color-text-primary)]">Bỏ qua / Không liên quan</p><p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">Đóng item không thuộc phạm vi xử lý và lưu lý do để tra cứu.</p></div>
              </div>
              {!showSkipForm ? (
                <button type="button" onClick={() => { setShowSkipForm(true); setSkipError(""); }} disabled={!canSkipLead} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Bỏ qua item này<span className="material-symbols-outlined text-lg">arrow_forward</span></button>
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
          <LeadProfileTab
            lead={lead}
            meta={meta}
            ownership={ownership}
            platformLabel={platformMeta?.label || lead.platform}
            slaLabel={formatLeadSla(meta)}
            sourceHref={profileSourceHref}
            canOpenSource={canOpenProfileSource}
            onOpenSource={handleProfileOpenSource}
            onFeedback={showToast}
          />
        )}

        {activeTab === "interactions" && (
          <CustomerInteractionHistoryPanel sourceType="lead" sourceId={lead.id} />
        )}

        {activeTab === "history" && (
          <LeadHistoryTab
            lead={lead}
            meta={meta}
            slaLabel={formatLeadSla(meta)}
          />
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
