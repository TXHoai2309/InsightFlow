"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAlertStore, type AlertData, type EscalationData } from "@/stores/alert.store";
import { useAuth } from "@/hooks/useAuth";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { dbSecond } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore";
import { canPerformAction } from "@/lib/rbac";
import { fetchSingleSupabaseAlert, updateSupabaseAlertLabel, fetchCommentsForPost, type PostComment } from "@/lib/supabase";
import { supabaseClient } from "@/lib/supabaseClient";
// Helper function to format brand display names
function formatBrandName(brand: string): string {
  if (!brand) return "";
  const lower = brand.toLowerCase();
  if (lower === "mixue") return "Mixue";
  if (lower.includes("starbuck")) return "Starbucks";
  if (lower.includes("highland")) return "Highland Coffee";
  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Inline helper for calculating relative time
function getRelativeTime(isoString: string | undefined): string {
  if (!isoString) return "Không rõ";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Không rõ";

    // Format helper: dd/mm/yyyy
    const formatted = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Future date → show formatted date
    if (diffMs < 0) return formatted;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} tháng trước`;

    // Older than a year → show formatted date
    return formatted;
  } catch (e) {
    return "Không rõ";
  }
}

// ── Incident Report Modal (Escalate) ──
interface IncidentReportModalProps {
  item: AlertData;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

function IncidentReportModal({ item, onClose, triggerToast }: IncidentReportModalProps) {
  const [impactAssessment, setImpactAssessment] = useState(
    `Sự việc liên quan đến ${formatBrandName(item.brand)} trên nguồn ${(item.source || "").toUpperCase()} đang thu hút phản hồi tiêu cực từ dư luận. Nguy cơ gây tổn hại uy tín thương hiệu trung/dài hạn nếu không được giải quyết ngay.`
  );

  const [sopActions, setSopActions] = useState(
    `1. Tiếp cận trực tiếp chủ sở hữu bài đăng để đối thoại giải quyết mâu thuẫn.\n2. Báo cáo Ban Giám đốc tình hình diễn biến và kịch bản ứng phó.\n3. Rà soát chất lượng vận hành nội bộ tại điểm chạm phát sinh sự cố.`
  );

  const brandName = formatBrandName(item.brand);
  const sourceName = (item.source || "unknown").toUpperCase();
  const severityText = (item.severity || "high").toUpperCase();
  const dateStr = new Date(item.created_at || Date.now()).toLocaleString("vi-VN");

  const handleExport = () => {
    const reportData = {
      title: `Báo cáo Sự cố Khẩn cấp - ${brandName} - ${sourceName}`,
      brand: brandName,
      source: sourceName,
      severity: severityText,
      created_at: dateStr,
      reporter: item.author || "Ẩn danh",
      description: item.text || "",
      impact_assessment: impactAssessment,
      recommended_sop_actions: sopActions,
      status: "pending",
      generated_at: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Incident_Report_${brandName.replace(/\s+/g, "_")}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSend = () => {
    triggerToast("Đã gửi báo cáo khẩn cấp đến Ban giám đốc!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden p-6 z-10 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Báo cáo sự cố khẩn cấp (Escalate)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-xs space-y-1.5 text-[var(--color-text-secondary)] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-[var(--color-border)]/50">
          <p><strong>Thương hiệu:</strong> {brandName}</p>
          <p><strong>Nguồn phát hiện:</strong> {sourceName}</p>
          <p><strong>Mức độ:</strong> <span className="text-red-500 font-bold">{severityText}</span></p>
          <p><strong>Thời gian:</strong> {dateStr}</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
            Đánh giá tác động ảnh hưởng
          </label>
          <textarea
            value={impactAssessment}
            onChange={(e) => setImpactAssessment(e.target.value)}
            className="w-full text-xs p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
            Biện pháp ứng phó khuyến nghị (SOP)
          </label>
          <textarea
            value={sopActions}
            onChange={(e) => setSopActions(e.target.value)}
            className="w-full text-xs p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-24"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[var(--color-text-primary)] border border-[var(--color-border)] transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">download</span> Xuất Báo Cáo
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all cursor-pointer"
          >
            Gửi Escalate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Monitoring Transition Modal ──
interface MonitoringTransitionModalProps {
  onClose: () => void;
  onConfirm: (note: string, durationHours: number) => Promise<void>;
}

function MonitoringTransitionModal({ onClose, onConfirm }: MonitoringTransitionModalProps) {
  const [note, setNote] = useState("Đã hoàn tất các bước xử lý theo SOP. Chuyển sang trạng thái theo dõi thêm.");
  const [duration, setDuration] = useState("72");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!note.trim()) {
      setError("Vui lòng nhập ghi chú hoàn tất.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(note.trim(), parseFloat(duration));
      onClose();
    } catch (e: any) {
      setError("Lỗi: " + (e.message || "Không thể chuyển trạng thái."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-2xl shadow-xl max-w-md w-full p-6 z-10 space-y-4 text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Hoàn tất xử lý &amp; Bắt đầu theo dõi
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-[var(--color-text-secondary)] uppercase text-[10px]">
            Ghi chú xử lý / Bằng chứng
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="font-bold text-[var(--color-text-secondary)] uppercase text-[10px]">
            Thời gian theo dõi thêm
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] focus:outline-none"
          >
            <option value="72">72 giờ (Khuyên dùng)</option>
            <option value="24">24 giờ</option>
            <option value="1">1 giờ</option>
            <option value="0.166">10 phút</option>
            <option value="0.033">2 phút (Để test nhanh)</option>
            <option value="0">Đóng ngay (Không theo dõi)</option>
          </select>
        </div>

        {error && <p className="text-red-500 font-bold">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[var(--color-text-primary)] border border-[var(--color-border)] transition-all font-bold cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold transition-all shadow-sm cursor-pointer"
          >
            {busy ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: map email/uid to display name for resolvers
const getResolverName = (emailOrId: string | null | undefined): string => {
  if (!emailOrId) return "";
  if (!emailOrId.includes("@")) return emailOrId;
  const e = emailOrId.toLowerCase();
  if (e.includes("crisis")) return "Nguyen Van Crisis";
  if (e.includes("lead")) return "Tran Thi Lead";
  if (e.includes("admin")) return "InsightFlow Admin";
  if (e.includes("manager")) {
    if (e.includes("highland")) return "Highlands Brand Manager";
    if (e.includes("starbuck")) return "Starbucks Brand Manager";
    if (e.includes("mixue")) return "Mixue Brand Manager";
    return "Brand Manager";
  }
  const local = emailOrId.split("@")[0];
  return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const getSentimentLabel = (val: string) => {
  if (val === "positive" || val === "tích cực") return "Tích cực";
  if (val === "negative" || val === "tiêu cực") return "Tiêu cực";
  return "Trung lập";
};

const getSeverityLabel = (val: string) => {
  if (val === "low") return "Thấp";
  if (val === "medium") return "Trung bình";
  if (val === "high") return "Cao";
  if (val === "critical") return "Khẩn cấp";
  return val || "Trung bình";
};

const getTopicLabel = (val: string) => {
  const map: Record<string, string> = {
    quality: "Chất lượng",
    price: "Giá cả",
    service: "Dịch vụ",
    staff: "Nhân viên",
    delivery: "Giao hàng",
    experience: "Trải nghiệm",
    legal: "Pháp lý",
    operation: "Vận hành",
    competitor: "Đối thủ",
    other: "Khác",
    "chất lượng dịch vụ": "Dịch vụ",
    "chất lượng sản phẩm": "Chất lượng",
    "truyền thông & pr": "Truyền thông & PR",
    "pháp lý": "Pháp lý",
  };
  return map[String(val).toLowerCase()] || val || "Khác";
};

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (() => {
    const raw = params?.id as string;
    try { return decodeURIComponent(raw); } catch { return raw; }
  })();

  const { profile } = useAuth();
  const isManager = profile?.role === "admin" || profile?.role === "brand_manager";
  const {
    updateAlertStatus,
    lockAlertForResolution,
    unlockAlertForResolution,
    createCorrectionRequest,
    fetchCorrectionRequests,
    correctionRequests,
    resolveCorrectionRequest,
  } = useAlertStore();

  const [alert, setAlert] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Post comments state (for post-type alerts)
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Note text input states
  const [timelineNote, setTimelineNote] = useState("");
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [newActivityDetails, setNewActivityDetails] = useState<{ comments: number; likes: number; shares: number } | null>(null);

  // Edit severity mode states
  const [editSeverityMode, setEditSeverityMode] = useState(false);
  const [newSeverity, setNewSeverity] = useState("");
  const [severityReason, setSeverityReason] = useState("");

  // Correction request states
  const [correctionSentiment, setCorrectionSentiment] = useState("neutral");
  const [correctionSeverity, setCorrectionSeverity] = useState("medium");
  const [correctionTopic, setCorrectionTopic] = useState("other");
  const [correctionRelevance, setCorrectionRelevance] = useState<boolean | null>(null);
  const [correctionIntent, setCorrectionIntent] = useState<string | null>("none");
  const [correctionReason, setCorrectionReason] = useState("");

  // Tab state inside Merged Label Card
  const [labelTab, setLabelTab] = useState<"edit" | "pending" | "history">("edit");

  useEffect(() => {
    if (isManager) {
      setLabelTab("pending");
    } else {
      setLabelTab("edit");
    }
  }, [isManager]);

  const lastAlertIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (alert && alert.id !== lastAlertIdRef.current) {
      lastAlertIdRef.current = alert.id;
      setCorrectionSentiment(alert.sentiment || "neutral");
      setCorrectionSeverity(alert.severity || alert.urgency || "medium");
      const currentTopic = Array.isArray(alert.topic)
        ? alert.topic[0]
        : (alert.topic || "other");
      setCorrectionTopic(currentTopic);
      setCorrectionRelevance(alert.relevance !== undefined ? alert.relevance : null);
      setCorrectionIntent(alert.intent || "none");
    }
  }, [alert]);

  useEffect(() => {
    if (!alert || alert.status !== "monitoring") {
      setTimeLeftStr("");
      setNewActivityDetails(null);
      return;
    }

    const timer = setInterval(() => {
      const startedAt = alert.monitoring_started_at ? new Date(alert.monitoring_started_at).getTime() : new Date(alert.created_at).getTime();
      const durationMs = (alert.monitoring_duration_hours ?? 72) * 60 * 60 * 1000;
      const now = Date.now();
      const diff = startedAt + durationMs - now;

      // Check if new activity has occurred
      const initialComments = alert.monitoring_initial_comments ?? 0;
      const initialLikes = alert.monitoring_initial_likes ?? 0;
      const initialShares = alert.monitoring_initial_shares ?? 0;

      const currentComments = alert.comments ?? 0;
      const currentLikes = alert.likes ?? 0;
      const currentShares = alert.shares ?? 0;

      const deltaComments = currentComments - initialComments;
      const deltaLikes = currentLikes - initialLikes;
      const deltaShares = currentShares - initialShares;

      if (deltaComments > 0 || deltaLikes > 5 || deltaShares > 0) {
        setNewActivityDetails({
          comments: Math.max(0, deltaComments),
          likes: Math.max(0, deltaLikes),
          shares: Math.max(0, deltaShares),
        });
      } else {
        setNewActivityDetails(null);
      }

      if (diff <= 0) {
        setTimeLeftStr("Hết thời gian theo dõi");
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (3600 * 1000));
        const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setTimeLeftStr(`${hours} giờ ${mins} phút ${secs} giây`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alert]);

  useEffect(() => {
    fetchCorrectionRequests();
  }, [fetchCorrectionRequests]);

  const alertCorrectionRequests = useMemo(() => {
    if (!alert) return [];
    return correctionRequests.filter(req => req.alert_id === alert.id);
  }, [correctionRequests, alert]);

  const pendingRequests = useMemo(() => {
    return alertCorrectionRequests.filter(req => req.status === "pending");
  }, [alertCorrectionRequests]);

  const historyRequests = useMemo(() => {
    return alertCorrectionRequests.filter(req => req.status !== "pending");
  }, [alertCorrectionRequests]);

  // Toast status states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [draftResponse, setDraftResponse] = useState("");
  const [proposedCompensation, setProposedCompensation] = useState("");
  const [approvalResponse, setApprovalResponse] = useState("");
  const [approvalCompensation, setApprovalCompensation] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [escalationBusy, setEscalationBusy] = useState(false);

  const riskScore = useMemo(() => {
    if (!alert) return 0;
    return (alert as any).negativity_score ?? 0;
  }, [alert]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (!alert?.escalation) return;
    setDraftResponse(alert.escalation.draft_response || "");
    setProposedCompensation(alert.escalation.compensation || "");
    setApprovalResponse(alert.escalation.approved_response || alert.escalation.draft_response || "");
    setApprovalCompensation(alert.escalation.compensation_approved || alert.escalation.compensation || "");
    setApprovalNote(alert.escalation.approval_note || "");
  }, [alert?.id, alert?.escalation]);

  const createEscalationNotification = async (payload: {
    title: string;
    message: string;
    recipient_role: "brand_manager" | "crisis_employee";
    recipient_email?: string | null;
  }) => {
    if (!dbSecond || !alert) return;

    await addDoc(collection(dbSecond, "notifications"), {
      title: payload.title,
      message: payload.message,
      type: "escalation",
      alert_id: alert.id,
      brand: alert.brand,
      created_at: new Date().toISOString(),
      read: false,
      recipient_role: payload.recipient_role,
      recipient_email: payload.recipient_email || null,
      sender_email: profile?.email || "",
    });
  };

  const handleSubmitEscalation = async () => {
    if (!alert || !draftResponse.trim() || !proposedCompensation.trim()) {
      triggerToast("Vui lòng nhập dự thảo phản hồi và mức đền bù đề xuất.");
      return;
    }

    const escalation: EscalationData = {
      draft_response: draftResponse.trim(),
      compensation: proposedCompensation.trim(),
      submitted_by_email: profile?.email || "unknown",
      submitted_by_name: profile?.displayName || getResolverName(profile?.email) || "Crisis Officer",
      submitted_at: new Date().toISOString(),
      status: "pending",
      approved_by_email: null,
      approved_by_name: null,
      approved_at: null,
      approved_response: null,
      compensation_approved: null,
      approval_note: "",
    };

    setEscalationBusy(true);
    try {
      await updateAlertStatus(alert.id, "pending_approval", profile, {
        note: "Đã gửi phương án phản hồi và đền bù lên Brand Manager duyệt.",
        escalation,
      }, alert.brand);
      await createEscalationNotification({
        title: `Yêu cầu duyệt phương án: Vụ việc #${alert.id.slice(-4)}`,
        message: `${escalation.submitted_by_name} đã gửi phương án phản hồi cho ${formatBrandName(alert.brand)}.`,
        recipient_role: "brand_manager",
      });
      setAlert({ ...alert, status: "pending_approval", escalation });
      triggerToast("Đã gửi phương án lên Brand Manager duyệt.");
    } catch (e) {
      console.error(e);
      triggerToast("Không thể gửi duyệt phương án: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setEscalationBusy(false);
    }
  };

  const handleResolveEscalation = async (decision: "approved" | "rejected") => {
    if (!alert?.escalation) return;

    const nextStatus = decision === "approved" ? "responded" : "resolving";
    const escalation: EscalationData = {
      ...alert.escalation,
      status: decision,
      approved_by_email: profile?.email || null,
      approved_by_name: profile?.displayName || getResolverName(profile?.email) || null,
      approved_at: new Date().toISOString(),
      approved_response: approvalResponse.trim() || alert.escalation.draft_response,
      compensation_approved: approvalCompensation.trim() || alert.escalation.compensation,
      approval_note: approvalNote.trim(),
    };

    setEscalationBusy(true);
    try {
      await updateAlertStatus(alert.id, nextStatus, profile, {
        note: decision === "approved"
          ? "Brand Manager đã phê duyệt phương án phản hồi."
          : `Brand Manager yêu cầu chỉnh sửa phương án.${approvalNote.trim() ? ` Ghi chú: ${approvalNote.trim()}` : ""}`,
        escalation,
      }, alert.brand);
      await createEscalationNotification({
        title: decision === "approved" ? `Phương án đã được duyệt: #${alert.id.slice(-4)}` : `Cần chỉnh sửa phương án: #${alert.id.slice(-4)}`,
        message: decision === "approved"
          ? "Brand Manager đã duyệt phương án phản hồi và mức đền bù."
          : "Brand Manager yêu cầu chỉnh sửa phương án phản hồi.",
        recipient_role: "crisis_employee",
        recipient_email: alert.escalation.submitted_by_email,
      });
      setAlert({ ...alert, status: nextStatus, escalation });
      triggerToast(decision === "approved" ? "Đã phê duyệt phương án." : "Đã gửi yêu cầu chỉnh sửa.");
    } catch (e) {
      console.error(e);
      triggerToast("Không thể xử lý phê duyệt: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setEscalationBusy(false);
    }
  };

  const loadAlertDetail = useCallback(async (showGlobalLoading = false) => {
    if (!id) return;
    if (showGlobalLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      let detail = await fetchSingleSupabaseAlert(id);
      if (!detail) {
        const storeAlert = useAlertStore.getState().rawAlerts.find(a => a.id === id);
        if (storeAlert) detail = storeAlert;
      }
      if (detail) {
        setAlert(detail);
        setNewSeverity(detail.severity || "medium");

        // Sync to alert store to ensure store actions work correctly
        const storeRawAlerts = useAlertStore.getState().rawAlerts;
        const existsIndex = storeRawAlerts.findIndex(a => a.id === detail.id);
        if (existsIndex === -1) {
          useAlertStore.setState({
            rawAlerts: [...storeRawAlerts, detail]
          });
        } else {
          const updatedRawAlerts = [...storeRawAlerts];
          updatedRawAlerts[existsIndex] = detail;
          useAlertStore.setState({
            rawAlerts: updatedRawAlerts
          });
        }
      } else {
        setAlert(null);
      }
    } catch (err) {
      console.error("Error loading alert document details from Supabase:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Real-time detail sync: Supabase Realtime (push) + manual refresh
  useEffect(() => {
    if (!id) return;

    // Initial load with global loading state
    loadAlertDetail(true);

    const cleanupFns: (() => void)[] = [];

    // Strategy 1: Supabase Realtime — push updates when this specific annotation changes
    if (supabaseClient) {
      try {
        const channelName = `alert-detail-${id.replace(/[^a-zA-Z0-9]/g, "-")}`;
        const channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "annotations" },
            () => {
              // Any annotation update — reload this detail
              loadAlertDetail(false);
            }
          )
          .subscribe();

        cleanupFns.push(() => { if (supabaseClient) supabaseClient.removeChannel(channel); });
      } catch (err) {
        console.warn("[AlertDetail] Realtime subscription failed:", err);
      }
    }

    // Strategy 2: Fallback polling is disabled to reduce server load.
    // Relying on manual "Làm mới" button and realtime push instead.

    return () => cleanupFns.forEach((fn) => fn());
  }, [id, loadAlertDetail]);


  // Fetch comments when alert is a post
  useEffect(() => {
    if (!alert || alert.content_type !== "post" || !alert.post_id) return;
    setLoadingComments(true);
    fetchCommentsForPost(alert.post_id)
      .then(setPostComments)
      .catch(() => setPostComments([]))
      .finally(() => setLoadingComments(false));
  }, [alert?.post_id, alert?.content_type]);

  // NOTE: Detail page does NOT auto-lock on mount.
  // Locking only happens when the Crisis Officer clicks "Nhận xử lý" on the list page.
  // This prevents Brand Managers or observers from accidentally overwriting the lock.

  const handleAddTimelineNote = async () => {
    if (!alert || !timelineNote.trim()) return;
    const noteText = timelineNote.trim();
    try {
      await updateAlertStatus(
        alert.id,
        alert.status,
        profile,
        {
          note: noteText
        },
        alert.brand
      );
      
      const nextHistory = alert.resolution_history ? [...alert.resolution_history] : [];
      const authorName = profile?.displayName || getResolverName(profile?.email) || "Nhân viên trực";
      nextHistory.push({
        attempt_number: nextHistory.length + 1,
        timestamp: new Date().toISOString(),
        note: noteText,
        resolved_by_email: profile?.email || undefined,
        resolved_by_name: authorName
      });
      setAlert({
        ...alert,
        resolution_history: nextHistory
      });

      setTimelineNote("");
      triggerToast("Đã thêm ghi chú xử lý!");
    } catch (e) {
      console.error(e);
      triggerToast("Lỗi thêm ghi chú. Vui lòng thử lại!");
    }
  };

  // Handler: Add Internal Note
  const handleAddInternalNote = async () => {
    if (!alert || !internalNoteInput.trim()) return;
    try {
      const authorName = profile?.displayName || getResolverName(profile?.email) || "Admin Officer";
      const newNote = {
        note: internalNoteInput.trim(),
        author: authorName,
        timestamp: new Date().toISOString()
      };
      await updateSupabaseAlertLabel(alert.id, (existingLabel) => {
        const notes = existingLabel.internal_notes ? [...existingLabel.internal_notes] : [];
        notes.push(newNote);
        return {
          ...existingLabel,
          internal_notes: notes
        };
      });
      setInternalNoteInput("");
      triggerToast("Đã thêm ghi chú nội bộ!");
    } catch (e) {
      console.error(e);
      triggerToast("Không thể lưu ghi chú nội bộ!");
    }
  };

  // Handler: Save modified severity
  const handleSaveSeverity = async () => {
    if (!alert) return;
    if (!severityReason.trim()) {
      triggerToast("Vui lòng điền lý do thay đổi mức độ!");
      return;
    }

    try {
      const authorName = profile?.displayName || getResolverName(profile?.email) || "Admin Officer";

      // Add custom entry to resolution attempt log
      const nextHistory = alert.resolution_history ? [...alert.resolution_history] : [];
      nextHistory.push({
        attempt_number: nextHistory.length + 1,
        timestamp: new Date().toISOString(),
        note: `Thay đổi mức độ rủi ro thành ${newSeverity.toUpperCase()}. Lý do: ${severityReason.trim()}`,
        resolved_by_email: profile?.email || "unknown",
        resolved_by_name: authorName
      } as any);

      await updateSupabaseAlertLabel(alert.id, (existingLabel) => {
        return {
          ...existingLabel,
          severity: newSeverity,
          urgency: newSeverity,
          resolution_history: nextHistory
        };
      });

      setEditSeverityMode(false);
      setSeverityReason("");
      triggerToast("Cập nhật mức độ rủi ro thành công!");
    } catch (e) {
      console.error(e);
      triggerToast("Không thể cập nhật mức độ rủi ro.");
    }
  };

  // Handler: Submit Correction Request (Gửi yêu cầu chỉnh sửa)
  const handleSendCorrectionRequest = async () => {
    if (!alert || !correctionReason.trim()) {
      triggerToast("Vui lòng điền nội dung yêu cầu chỉnh sửa!");
      return;
    }

    try {
      const currentTopic = Array.isArray(alert.topic)
        ? alert.topic[0]
        : (alert.topic || "other");

      const payload: any = {
        alert_id: alert.id,
        brand: alert.brand,
        requester_uid: profile?.uid || "unknown",
        requester_email: profile?.email || "unknown",
        original_sentiment: alert.sentiment || "neutral",
        new_sentiment: correctionSentiment || "neutral",
        original_severity: alert.severity || "medium",
        new_severity: correctionSeverity || "medium",
        original_topic: currentTopic,
        new_topic: correctionTopic || "other",
        original_relevance: alert.relevance !== undefined ? alert.relevance : null,
        new_relevance: correctionRelevance,
        original_urgency: alert.urgency || alert.severity || "medium",
        new_urgency: correctionSeverity || "medium",
        original_intent: alert.intent || "none",
        new_intent: correctionIntent || "none",
        reason: correctionReason.trim(),
        alert_text: alert.text || "",
        alert_full: alert,
      };

      await createCorrectionRequest(payload);
      setCorrectionReason("");
      setLabelTab("pending");
      triggerToast("Gửi yêu cầu chỉnh sửa thành công!");
    } catch (e) {
      console.error(e);
      triggerToast("Gửi yêu cầu thất bại. Vui lòng thử lại!");
    }
  };

  // Handle template selection
  const selectTemplateText = (text: string) => {
    setTimelineNote(text);
    setDraftResponse(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <svg className="animate-spin h-10 w-10 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-[var(--color-text-secondary)] font-bold">Đang tải chi tiết vụ việc...</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <span className="material-symbols-outlined text-red-500 text-6xl">warning</span>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Vụ việc không tồn tại</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Tài liệu cảnh báo này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
        <button
          onClick={() => router.push("/alerts")}
          className="px-6 py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all text-xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isLockedByOthers = alert.being_resolved_by && alert.being_resolved_by !== profile?.email;
  const isMine = alert.being_resolved_by === profile?.email;

  // Sentiment Color Mapping
  let sentimentBadge = "bg-slate-50 text-slate-600 border-slate-100";
  if (alert.sentiment === "negative" || alert.sentiment === "tiêu cực") {
    sentimentBadge = "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30";
  } else if (alert.sentiment === "positive" || alert.sentiment === "tích cực") {
    sentimentBadge = "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30";
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] animate-fade-in pb-16">

      {/* Dynamic Header Block */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 md:px-8 py-4 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/alerts")}
            className="p-2 hover:bg-[var(--color-bg-surface-raised)] rounded-xl border border-[var(--color-border)] text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-[var(--color-text-primary)] uppercase flex items-center gap-2">
              Vụ việc #{alert.id.slice(-4)}
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm flex items-center gap-1 ${alert.severity === "critical" ? "bg-red-600" :
                alert.severity === "high" ? "bg-orange-500" :
                  alert.severity === "medium" ? "bg-yellow-500" : "bg-slate-500"
                }`}>
                {riskScore} - {
                  alert.severity === "critical" ? "Khẩn cấp" :
                    alert.severity === "high" ? "Rủi ro cao" :
                      alert.severity === "medium" ? "Trung bình" : "Thấp"
                }
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--color-text-muted)] font-semibold">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${alert.status === "new" ? "bg-blue-100 text-blue-600 dark:bg-blue-950/20" :
                alert.status === "resolving" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/20" :
                  alert.status === "pending_approval" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/20 animate-pulse" :
                    alert.status === "responded" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20" :
                      alert.status === "monitoring" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800" :
                        alert.status === "resolved" ? "bg-green-100 text-green-600 dark:bg-green-950/20" : "bg-slate-100 text-slate-600"
                }`}>
                {
                  alert.status === "new" ? "Mới phát hiện" :
                    alert.status === "resolving" ? "Đang xử lý" :
                      alert.status === "pending_approval" ? "Chờ duyệt phương án" :
                        alert.status === "responded" ? "Đã phản hồi" :
                          alert.status === "monitoring" ? "Theo dõi thêm" :
                            alert.status === "resolved" ? "Đã đóng" : "Đã đóng"
                }
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">person</span>
                Phụ trách: {alert.being_resolved_by ? getResolverName(alert.being_resolved_by) : "Chưa có"}
              </span>
              {isLockedByOthers && (
                <span className="text-red-500 font-bold bg-red-50 dark:bg-red-950/10 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 flex items-center gap-1 animate-pulse">
                  ⚠️ Nhân viên khác đang xử lý
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              loadAlertDetail(false);
              triggerToast("Đã làm mới dữ liệu!");
            }}
            disabled={refreshing}
            className="flex items-center gap-1 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs rounded-xl hover:bg-[var(--color-bg-surface-raised)] transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            Làm mới
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              triggerToast("Đã sao chép liên kết chia sẻ!");
            }}
            className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs rounded-xl hover:bg-[var(--color-bg-surface-raised)] transition-all cursor-pointer"
          >
            Chia sẻ
          </button>

          {!isMine && !isLockedByOthers && (
            <button
              onClick={() => {
                lockAlertForResolution(alert.id, profile);
                triggerToast("Đã nhận xử lý vụ việc này!");
              }}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Nhận xử lý
            </button>
          )}

          {isMine && alert.status !== "resolved" && alert.status !== "monitoring" && (
            <button
              onClick={() => setShowMonitoringModal(true)}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Hoàn tất xử lý
            </button>
          )}

          {isMine && alert.status === "monitoring" && (
            <button
              onClick={async () => {
                try {
                  await updateAlertStatus(alert.id, "resolved", profile, {
                    note: "Đã xác nhận đóng hẳn vụ việc sau thời gian theo dõi."
                  }, alert.brand);
                  setAlert({ ...alert, status: "resolved" });
                  triggerToast("Vụ việc đã được đóng hẳn!");
                } catch (e) {
                  triggerToast("Lỗi đóng vụ việc. Vui lòng thử lại!");
                }
              }}
              className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Đóng hẳn vụ việc
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">

        {/* LEFT COLUMN: 60% Width */}
        <div className="lg:col-span-7 space-y-6">

          {/* Widget: Real-time Monitoring Countdown & Activity Alert */}
          {alert.status === "monitoring" && (
            <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 animate-pulse text-lg">visibility</span>
                  <span className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                    Giai đoạn theo dõi khủng hoảng
                  </span>
                </div>
                <span className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Real-time Countdown
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-xl p-4 text-center space-y-1">
                <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Thời gian theo dõi còn lại</p>
                <p className="text-lg md:text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                  {timeLeftStr || "Đang tính toán..."}
                </p>
              </div>

              {/* Activity / Abnormality alert banner */}
              {newActivityDetails ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>CẢNH BÁO HOẠT ĐỘNG BẤT THƯỜNG</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    Hệ thống ghi nhận có tương tác mới phát sinh so với thời điểm bắt đầu theo dõi:
                  </p>
                  <div className="flex gap-4 text-[10px] font-bold text-red-600 dark:text-red-400 pt-1">
                    {newActivityDetails.likes > 0 && (
                      <span>+ {newActivityDetails.likes} Likes (Ngưỡng an toàn: &le; 5)</span>
                    )}
                    {newActivityDetails.comments > 0 && (
                      <span>+ {newActivityDetails.comments} Comments</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm mt-0.5">verified_user</span>
                  <div className="space-y-0.5">
                    <p className="text-green-700 dark:text-green-400 font-bold text-xs">Trạng thái an toàn</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
                      Chưa phát hiện hành vi tương tác đột biến nào. Hệ thống sẽ tự động đóng vụ việc khi hết thời gian.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Original Post Card (shown when alert is a comment) */}
          {alert.content_type === "comment" && alert.post_content && alert.post_content !== alert.text && (
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-base">article</span>
                  <h3 className="font-black text-xs text-indigo-700 dark:text-indigo-400 uppercase">Bài viết gốc</h3>
                </div>
                {alert.post_url && alert.post_url !== "#" && alert.post_url.trim() !== "" && (
                  <a
                    href={alert.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline text-[11px] font-bold flex items-center gap-1"
                  >
                    Truy cập bài viết
                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  </a>
                )}
              </div>
              <div className="p-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-[var(--color-border)]/60 text-xs md:text-sm text-[var(--color-text-primary)] leading-relaxed font-medium whitespace-pre-line">
                  {alert.post_content}
                </div>
                {(alert.post_like_count || alert.post_comment_count || alert.post_share_count) ? (
                  <div className="flex items-center gap-5 mt-4 text-[11px] text-[var(--color-text-muted)] font-bold">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-slate-400 text-sm">thumb_up</span>
                      <span>{(alert.post_like_count || 0).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-slate-400 text-sm">chat_bubble</span>
                      <span>{(alert.post_comment_count || 0).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-slate-400 text-sm">share</span>
                      <span>{(alert.post_share_count || 0).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Alert Content Card */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex flex-wrap justify-between items-center bg-slate-50/50 dark:bg-slate-800/10 gap-3">
              <div className="flex items-center gap-3">
                <PlatformLogo platform={alert.source} size="sm" />
                <div>
                  <h3 className="font-black text-xs text-[var(--color-text-primary)] uppercase">
                    {alert.content_type === "comment" ? "Bình luận cảnh báo" : "Bài viết cảnh báo"} — {alert.source ? String(alert.source).toUpperCase() : "Không rõ"}
                  </h3>
                  <a
                    href={alert.url !== "#" ? alert.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline text-[11px] font-bold flex items-center gap-1 mt-0.5"
                  >
                    Xem trên nền tảng gốc
                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  </a>
                </div>
              </div>
              <div className="text-right text-[10px] text-[var(--color-text-muted)] font-semibold">
                <p>Đăng: {getRelativeTime(alert.created_at)}</p>
                <p className="text-red-500 font-bold mt-0.5">Phát hiện: {getRelativeTime(alert.created_at)}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--color-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {alert.social_profile_url && alert.social_profile_url !== "#" ? (
                    <img src={alert.social_profile_url} alt={alert.author} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-500">
                      {String(alert.author || "A").substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text-primary)]">@{alert.author || "Ẩn danh"}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {alert.reach && alert.reach > 50000 ? (
                      <span className="bg-pink-50 dark:bg-pink-950/20 text-pink-600 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-pink-100 dark:border-pink-900/30">
                        KOL lớn
                      </span>
                    ) : null}
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                      {(alert.reach || 0).toLocaleString("vi-VN")} lượt tiếp cận
                    </span>
                  </div>
                </div>
              </div>

              {/* Text content container */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-[var(--color-border)]/60 text-xs md:text-sm text-[var(--color-text-primary)] leading-relaxed font-medium whitespace-pre-line">
                {alert.text}
              </div>

              {/* Engagement statistics bar */}
              <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[var(--color-border)]/60 text-xs text-[var(--color-text-secondary)] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-400 text-sm">thumb_up</span>
                  <span>{(alert.likes || 0).toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-400 text-sm">chat_bubble</span>
                  <span>{(alert.comments || 0).toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-400 text-sm">share</span>
                  <span>{(alert.shares || 0).toLocaleString("vi-VN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section (shown when alert is a post) */}
          {alert.content_type === "post" && (
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-base">forum</span>
                  <h3 className="font-black text-xs text-[var(--color-text-primary)] uppercase">
                    Bình luận ({postComments.length})
                  </h3>
                </div>
              </div>

              <div className="p-5">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <svg className="animate-spin h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-xs text-[var(--color-text-secondary)] font-bold">Đang tải bình luận...</span>
                  </div>
                ) : postComments.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-slate-300 text-4xl">chat_bubble_outline</span>
                    <p className="text-xs text-[var(--color-text-muted)] font-bold mt-2">Chưa có bình luận nào.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {postComments.map((cmt) => (
                      <div
                        key={cmt.comment_id}
                        className={`p-4 rounded-xl border border-[var(--color-border)]/60 text-xs ${cmt.comment_level > 0
                            ? "ml-6 bg-slate-50/50 dark:bg-slate-800/10"
                            : "bg-white dark:bg-[var(--color-bg-surface-raised)]"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-bold text-slate-500">
                                {cmt.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-bold text-[var(--color-text-primary)]">
                              {cmt.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
                            {cmt.like_count > 0 && (
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">thumb_up</span>
                                {cmt.like_count}
                              </span>
                            )}
                            <span>{getRelativeTime(cmt.posted_at)}</span>
                          </div>
                        </div>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                          {cmt.text}
                        </p>
                        {cmt.url && (
                          <a
                            href={cmt.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-500 hover:underline text-[10px] font-bold mt-2 inline-flex items-center gap-0.5"
                          >
                            Xem gốc <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Analysis Card */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <h3 className="font-black text-xs md:text-sm text-[var(--color-text-primary)] uppercase tracking-wider">
                Phân tích rủi ro &amp; Sắc thái
              </h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sentimentBadge}`}>
                {alert.sentiment === "negative" ? "Tiêu cực (88%)" :
                  alert.sentiment === "positive" ? "Tích cực" : "Trung lập"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-[var(--color-text-secondary)]">
                  <span>LAN TRUYỀN NHANH</span>
                  <span className="text-red-500 font-black">{(riskScore * 0.9).toFixed(0)} pts</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${riskScore * 0.9}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-[var(--color-text-secondary)]">
                  <span>TỪ KHÓA NHẠY CẢM</span>
                  <span className="text-orange-500 font-black">{(riskScore * 0.75).toFixed(0)} pts</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${riskScore * 0.75}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-[var(--color-text-secondary)]">
                  <span>ẢNH HƯỞNG CỦA KOL</span>
                  <span className="text-purple-500 font-black">{(riskScore * 0.6).toFixed(0)} pts</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${riskScore * 0.6}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Processing History (Timeline Log) */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-6">
            <h3 className="font-black text-xs md:text-sm text-[var(--color-text-primary)] uppercase tracking-wider pb-3 border-b border-[var(--color-border)]">
              Lịch sử xử lý sự vụ
            </h3>

            <div className="relative space-y-6 pl-6 before:absolute before:inset-y-1 before:left-[11px] before:w-0.5 before:bg-[var(--color-border)]">
              {/* Event: initial detection */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-[14px] h-[14px] bg-indigo-600 rounded-full border-4 border-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)]"></div>
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-bold text-[var(--color-text-primary)]">Hệ thống phát hiện tự động</p>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">{getRelativeTime(alert.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                    Hệ thống đã tự động gán nhãn rủi ro khẩn cấp dựa trên từ khóa nhạy cảm.
                  </p>
                </div>
              </div>

              {/* Event: locked / resolution history logs */}
              {alert.resolution_history?.map((h, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-[14px] h-[14px] bg-purple-500 rounded-full border-4 border-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)]"></div>
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <p className="font-bold text-[var(--color-text-primary)]">
                        {h.resolved_by_name || getResolverName(h.resolved_by_email) || "Nhân viên trực"}
                      </p>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">{getRelativeTime(h.timestamp)}</span>
                    </div>
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {h.note}
                      {h.image_url && (
                        <div className="mt-2.5 max-w-[200px] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-sm">
                          <img src={h.image_url} alt="Bằng chứng xử lý" className="w-full h-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add processing log (timeline note) */}
            {isMine && alert.status !== "resolved" && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập ghi chú xử lý mới vào timeline..."
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] font-medium"
                />
                <button
                  onClick={handleAddTimelineNote}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 40% Width - Sticky Widget Group */}
        <div className="lg:col-span-5 space-y-6">

          <div className="sticky top-[80px] space-y-6 pb-20">

            {/* Widget: Severity Label Dropdown */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Mức độ rủi ro thương hiệu
                </label>
                {!editSeverityMode && isManager && (
                  <button
                    onClick={() => setEditSeverityMode(true)}
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span> Sửa nhãn
                  </button>
                )}
              </div>

              {!editSeverityMode ? (
                <div className={`w-full text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm ${alert.severity === "critical" ? "bg-red-600" :
                  alert.severity === "high" ? "bg-orange-500" :
                    alert.severity === "medium" ? "bg-yellow-500" : "bg-slate-500"
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">priority_high</span>
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {alert.severity === "critical" ? "Khẩn cấp" :
                      alert.severity === "high" ? "Rủi ro cao" :
                        alert.severity === "medium" ? "Trung bình" : "Thấp"}
                  </span>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-[var(--color-border)]/50">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "low", label: "Thấp", class: "border-slate-500 text-slate-600", activeClass: "bg-slate-500 text-white" },
                      { key: "medium", label: "Trung bình", class: "border-yellow-500 text-yellow-600", activeClass: "bg-yellow-500 text-white" },
                      { key: "high", label: "Cao", class: "border-orange-500 text-orange-600", activeClass: "bg-orange-500 text-white" },
                      { key: "critical", label: "Khẩn cấp", class: "border-red-600 text-red-600", activeClass: "bg-red-600 text-white" }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setNewSeverity(btn.key)}
                        className={`py-2 text-[10px] font-bold rounded border transition-all cursor-pointer ${newSeverity === btn.key ? btn.activeClass : `${btn.class} bg-white dark:bg-slate-800 hover:bg-slate-50`
                          }`}
                      >
                        {btn.label.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Lý do thay đổi</label>
                    <textarea
                      value={severityReason}
                      onChange={(e) => setSeverityReason(e.target.value)}
                      placeholder="Nhập lý do đổi mức độ rủi ro..."
                      className="w-full text-xs p-2 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-16"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSeverity}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setEditSeverityMode(false);
                        setSeverityReason("");
                      }}
                      className="px-4 py-2 text-[var(--color-text-secondary)] text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Widget: Crisis Escalation Approval */}
            <div className="bg-[var(--color-bg-surface)] border border-orange-200/70 dark:border-orange-900/30 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                    Crisis Escalation & Approval
                  </label>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                    De xuat phuong an phan hoi va den bu cho vu viec nghiem trong.
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black ${alert.escalation?.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : alert.escalation?.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : alert.status === "pending_approval"
                        ? "bg-orange-100 text-orange-700 animate-pulse"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                  {alert.escalation?.status === "approved"
                    ? "APPROVED"
                    : alert.escalation?.status === "rejected"
                      ? "NEEDS REVISION"
                      : alert.status === "pending_approval"
                        ? "PENDING"
                        : "DRAFT"}
                </span>
              </div>

              {!isManager && alert.status === "resolving" && (
                <div className="space-y-3">
                  {alert.escalation?.status === "rejected" && alert.escalation.approval_note && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300">
                      <strong>Ghi chu tu Brand Manager:</strong> {alert.escalation.approval_note}
                    </div>
                  )}
                  <textarea
                    value={draftResponse}
                    onChange={(e) => setDraftResponse(e.target.value)}
                    placeholder="Nhap du thao phan hoi cong khai..."
                    className="w-full text-xs p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-[var(--color-text-primary)] h-28 resize-none"
                  />
                  <input
                    value={proposedCompensation}
                    onChange={(e) => setProposedCompensation(e.target.value)}
                    placeholder="Muc den bu de xuat, vi du: Voucher Highlands 200,000 VND"
                    className="w-full text-xs p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-[var(--color-text-primary)]"
                  />
                  <button
                    disabled={escalationBusy}
                    onClick={handleSubmitEscalation}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">outgoing_mail</span>
                    Gui duyet phuong an
                  </button>
                </div>
              )}

              {!isManager && alert.status === "pending_approval" && (
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-xs text-orange-700 dark:text-orange-300 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  Dang cho Brand Manager duyet phuong an.
                </div>
              )}

              {isManager && alert.status === "pending_approval" && alert.escalation && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--color-border)]">
                      <p className="font-black text-[10px] uppercase text-[var(--color-text-muted)] mb-1">Du thao de xuat</p>
                      <p className="whitespace-pre-wrap text-[var(--color-text-primary)]">{alert.escalation.draft_response}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--color-border)]">
                      <p className="font-black text-[10px] uppercase text-[var(--color-text-muted)] mb-1">Den bu de xuat</p>
                      <p className="text-[var(--color-text-primary)]">{alert.escalation.compensation}</p>
                    </div>
                  </div>
                  <textarea
                    value={approvalResponse}
                    onChange={(e) => setApprovalResponse(e.target.value)}
                    className="w-full text-xs p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] h-24 resize-none"
                    placeholder="Noi dung phat ngon duyet..."
                  />
                  <input
                    value={approvalCompensation}
                    onChange={(e) => setApprovalCompensation(e.target.value)}
                    className="w-full text-xs p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)]"
                    placeholder="Muc den bu duyet..."
                  />
                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    className="w-full text-xs p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] h-16 resize-none"
                    placeholder="Ghi chu phan hoi neu can..."
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={escalationBusy}
                      onClick={() => handleResolveEscalation("rejected")}
                      className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                    >
                      Yeu cau chinh sua
                    </button>
                    <button
                      disabled={escalationBusy}
                      onClick={() => handleResolveEscalation("approved")}
                      className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                    >
                      Dong y phe duyet
                    </button>
                  </div>
                </div>
              )}

              {alert.status === "responded" && alert.escalation?.status === "approved" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-xs">
                    <p className="font-black text-green-700 dark:text-green-300 mb-1">Phuong an da duoc duyet</p>
                    <p className="whitespace-pre-wrap text-[var(--color-text-primary)]">{alert.escalation.approved_response}</p>
                    <p className="mt-2 font-bold text-[var(--color-text-primary)]">Den bu: {alert.escalation.compensation_approved}</p>
                  </div>
                  {!isManager && (
                    <button
                      disabled={escalationBusy}
                      onClick={() => setShowMonitoringModal(true)}
                      className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                    >
                      Đăng phản hồi &amp; Hoàn tất
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Widget: Status Stepper */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Trạng thái vụ việc
              </label>

              <div className="relative flex justify-between px-2 pt-6 pb-2">
                {/* Connector line */}
                <div className="absolute top-8 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0"></div>
                <div
                  className="absolute top-8 left-4 h-0.5 bg-indigo-600 transition-all duration-300 -z-0"
                  style={{
                    width:
                      alert.status === "new" ? "0%" :
                        alert.status === "resolving" ? "20%" :
                          alert.status === "pending_approval" ? "40%" :
                            alert.status === "responded" ? "60%" :
                              alert.status === "monitoring" ? "80%" : "100%"
                  }}
                ></div>

                {/* Steps */}
                {[
                  { key: "new", label: "Mới" },
                  { key: "resolving", label: "Đang xử lý" },
                  { key: "pending_approval", label: "Chờ duyệt" },
                  { key: "responded", label: "Đã phản hồi" },
                  { key: "monitoring", label: "Theo dõi" },
                  { key: "resolved", label: "Đã đóng" }
                ].map((step, index) => {
                  const statuses = ["new", "resolving", "pending_approval", "responded", "monitoring", "resolved"];
                  const currentIdx = statuses.indexOf(alert.status);
                  const isCompleted = index <= currentIdx;
                  const isCurrent = alert.status === step.key;

                  return (
                    <button
                      key={step.key}
                      disabled={!isMine}
                      onClick={async () => {
                        if (step.key === "monitoring" || step.key === "resolved") {
                          setShowMonitoringModal(true);
                          return;
                        }
                        try {
                          await updateAlertStatus(alert.id, step.key, profile, {
                            note: `Thay đổi trạng thái xử lý thành: ${step.label}`
                          }, alert.brand);
                          setAlert({ ...alert, status: step.key });
                          triggerToast(`Chuyển trạng thái thành ${step.label}!`);
                        } catch (e) {
                          triggerToast("Không thể thay đổi trạng thái.");
                        }
                      }}
                      className={`relative flex flex-col items-center z-10 focus:outline-none ${isMine ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full border-4 border-[var(--color-bg-surface)] ring-2 transition-all ${isCurrent ? "bg-indigo-600 ring-indigo-600 scale-110" :
                        isCompleted ? "bg-indigo-500 ring-indigo-500" : "bg-slate-200 dark:bg-slate-700 ring-slate-200 dark:ring-slate-700"
                        }`} />
                      <span className={`text-[10px] mt-2 font-bold transition-colors ${isCurrent ? "text-indigo-600" :
                        isCompleted ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                        }`}>
                        {step.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget: Merged Label Management Widget (Gộp trong 1 form có Tab) */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">

              {/* Header with Tabs */}
              <div className="border-b border-[var(--color-border)] pb-2">
                <h4 className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2 uppercase tracking-wider mb-3">
                  <span className="material-symbols-outlined text-base text-indigo-600">sell</span>
                  Quản lý &amp; Sửa nhãn vụ việc
                </h4>

                {/* Tab buttons */}
                <div className="flex gap-2 text-xs font-bold">
                  {!isManager && (
                    <button
                      onClick={() => setLabelTab("edit")}
                      className={`pb-2 px-1 border-b-2 transition-all cursor-pointer ${labelTab === "edit"
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                    >
                      Sửa nhãn
                    </button>
                  )}
                  <button
                    onClick={() => setLabelTab("pending")}
                    className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${labelTab === "pending"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      }`}
                  >
                    Chờ duyệt
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${labelTab === "pending" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                      {pendingRequests.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setLabelTab("history")}
                    className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${labelTab === "history"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      }`}
                  >
                    Lịch sử
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${labelTab === "history" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                      {historyRequests.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab contents */}

              {/* Tab 1: Sửa nhãn (Edit Form) */}
              {!isManager && labelTab === "edit" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-[var(--color-border)]/50">

                    {/* Sentiment */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">1. Cảm xúc (Sentiment)</label>
                      <select
                        value={correctionSentiment}
                        onChange={(e) => setCorrectionSentiment(e.target.value)}
                        className="w-full text-xs p-2 border border-[var(--color-border)] rounded-lg bg-white dark:bg-slate-800 text-[var(--color-text-primary)] font-bold focus:outline-none"
                      >
                        <option value="positive">🟢 Tích cực</option>
                        <option value="neutral">🟡 Trung tính</option>
                        <option value="negative">🔴 Tiêu cực</option>
                      </select>
                    </div>

                    {/* Severity / Urgency */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">2. Mức độ (Urgency)</label>
                      <select
                        value={correctionSeverity}
                        onChange={(e) => setCorrectionSeverity(e.target.value)}
                        className="w-full text-xs p-2 border border-[var(--color-border)] rounded-lg bg-white dark:bg-slate-800 text-[var(--color-text-primary)] font-bold focus:outline-none"
                      >
                        <option value="none">⚪ None</option>
                        <option value="low">🟢 Thấp</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="high">🟠 Cao</option>
                        <option value="critical">🔴 Khẩn cấp</option>
                      </select>
                    </div>

                    {/* Topic */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">3. Chủ đề (Topic)</label>
                      <select
                        value={correctionTopic}
                        onChange={(e) => setCorrectionTopic(e.target.value)}
                        className="w-full text-xs p-2 border border-[var(--color-border)] rounded-lg bg-white dark:bg-slate-800 text-[var(--color-text-primary)] font-bold focus:outline-none"
                      >
                        <option value="quality">Chất lượng</option>
                        <option value="price">Giá cả</option>
                        <option value="service">Dịch vụ</option>
                        <option value="location">Vị trí</option>
                        <option value="promotion">Khuyến mãi</option>
                        <option value="recruitment">Tuyển dụng</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    {/* Relevance */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">4. Liên quan (Relevance)</label>
                      <select
                        value={correctionRelevance === null ? "" : correctionRelevance ? "yes" : "no"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCorrectionRelevance(val === "" ? null : val === "yes");
                        }}
                        className="w-full text-xs p-2 border border-[var(--color-border)] rounded-lg bg-white dark:bg-slate-800 text-[var(--color-text-primary)] font-bold focus:outline-none"
                      >
                        <option value="">-- Chọn --</option>
                        <option value="yes">🔵 Có</option>
                        <option value="no">⚪ Không</option>
                      </select>
                    </div>

                    {/* Intent */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">5. Ý định mua hàng (Intent)</label>
                      <select
                        value={correctionIntent || ""}
                        onChange={(e) => setCorrectionIntent(e.target.value || null)}
                        className="w-full text-xs p-2 border border-[var(--color-border)] rounded-lg bg-white dark:bg-slate-800 text-[var(--color-text-primary)] font-bold focus:outline-none"
                      >
                        <option value="">-- Chọn --</option>
                        <option value="hot">🔴 Hot</option>
                        <option value="warm">🟡 Warm</option>
                        <option value="cold">🔵 Cold</option>
                        <option value="none">⚪ None</option>
                      </select>
                    </div>

                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">Lý do gửi yêu cầu điều chỉnh</label>
                    <textarea
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="Nhập lý do chi tiết để gửi lên quản lý..."
                      className="w-full text-xs p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-16 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSendCorrectionRequest}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">send</span> Gửi yêu cầu sửa nhãn
                  </button>
                </div>
              )}

              {/* Tab 2: Chờ xử lý (Pending) */}
              {labelTab === "pending" && (
                <div className="space-y-3 animate-fade-in">
                  {pendingRequests.length === 0 ? (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic text-center py-6">
                      Không có yêu cầu nào đang chờ duyệt.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {pendingRequests.map((req) => {
                        const sentimentChanged = req.original_sentiment !== req.new_sentiment;
                        const severityChanged = req.original_severity !== req.new_severity;
                        const topicChanged = req.original_topic !== req.new_topic;
                        const relevanceChanged = req.original_relevance !== req.new_relevance;
                        const intentChanged = req.original_intent !== req.new_intent;

                        return (
                          <div
                            key={req.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-[var(--color-border)]/50 rounded-xl space-y-2.5"
                          >
                            <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)]">
                              <span className="font-bold text-[var(--color-text-primary)]">
                                Gửi bởi: {getResolverName(req.requester_email)}
                              </span>
                              <span>{getRelativeTime(req.created_at)}</span>
                            </div>

                            <div className="text-[10px] space-y-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-[var(--color-border)]/50">
                              {/* Sentiment */}
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Cảm xúc:</span>
                                <span>
                                  {getSentimentLabel(req.original_sentiment)} ➔ <strong className={sentimentChanged ? "text-indigo-600 dark:text-indigo-400" : ""}>{getSentimentLabel(req.new_sentiment)}</strong>
                                </span>
                              </div>
                              {/* Severity / Urgency */}
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Mức độ:</span>
                                <span>
                                  {getSeverityLabel(req.original_severity)} ➔ <strong className={severityChanged ? "text-indigo-600 dark:text-indigo-400" : ""}>{getSeverityLabel(req.new_severity)}</strong>
                                </span>
                              </div>
                              {/* Topic */}
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Chủ đề:</span>
                                <span>
                                  {getTopicLabel(req.original_topic)} ➔ <strong className={topicChanged ? "text-indigo-600 dark:text-indigo-400" : ""}>{getTopicLabel(req.new_topic)}</strong>
                                </span>
                              </div>
                              {/* Relevance */}
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Liên quan:</span>
                                <span>
                                  {req.original_relevance === null ? "Chưa rõ" : req.original_relevance ? "Có" : "Không"} ➔ <strong className={relevanceChanged ? "text-indigo-600 dark:text-indigo-400" : ""}>{req.new_relevance === null ? "Chưa rõ" : req.new_relevance ? "Có" : "Không"}</strong>
                                </span>
                              </div>
                              {/* Intent */}
                              <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Ý định:</span>
                                <span>
                                  {req.original_intent || "None"} ➔ <strong className={intentChanged ? "text-indigo-600 dark:text-indigo-400" : ""}>{req.new_intent || "None"}</strong>
                                </span>
                              </div>
                            </div>

                            {req.reason && (
                              <p className="text-[10px] text-[var(--color-text-secondary)] italic bg-amber-500/5 p-2 rounded border border-amber-500/10">
                                <strong>Lý do:</strong> {req.reason}
                              </p>
                            )}

                            {isManager ? (
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={async () => {
                                    try {
                                      await resolveCorrectionRequest(req.id, alert.id, "approved", profile);
                                      triggerToast("Đã duyệt yêu cầu sửa nhãn!");
                                    } catch (err) {
                                      triggerToast("Duyệt thất bại. Vui lòng thử lại!");
                                    }
                                  }}
                                  className="flex-1 py-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center justify-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-[12px]">check</span> Duyệt
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await resolveCorrectionRequest(req.id, alert.id, "rejected", profile);
                                      triggerToast("Đã từ chối yêu cầu sửa nhãn!");
                                    } catch (err) {
                                      triggerToast("Từ chối thất bại. Vui lòng thử lại!");
                                    }
                                  }}
                                  className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center justify-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-[12px]">close</span> Từ chối
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] py-1 bg-amber-100/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-center font-bold border border-amber-200/50">
                                Đang chờ quản lý duyệt
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Lịch sử xử lý nhãn (History) */}
              {labelTab === "history" && (
                <div className="space-y-3 animate-fade-in">
                  {historyRequests.length === 0 ? (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic text-center py-6">
                      Chưa có lịch sử điều chỉnh nhãn.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {historyRequests.map((req) => {
                        const isApproved = req.status === "approved";

                        return (
                          <div
                            key={req.id}
                            className={`p-3 border rounded-xl space-y-2 transition-all ${isApproved
                                ? "bg-green-50/50 dark:bg-green-950/5 border-green-200/50"
                                : "bg-red-50/50 dark:bg-red-950/5 border-red-200/50"
                              }`}
                          >
                            <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)]">
                              <span className="font-bold text-[var(--color-text-primary)]">
                                Gửi bởi: {getResolverName(req.requester_email)}
                              </span>
                              <span>{getRelativeTime(req.created_at)}</span>
                            </div>

                            <div className="text-[10px] space-y-0.5 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-[var(--color-border)]/40">
                              <div>Cảm xúc: {getSentimentLabel(req.original_sentiment)} ➔ <strong>{getSentimentLabel(req.new_sentiment)}</strong></div>
                              <div>Mức độ: {getSeverityLabel(req.original_severity)} ➔ <strong>{getSeverityLabel(req.new_severity)}</strong></div>
                              <div>Chủ đề: {getTopicLabel(req.original_topic)} ➔ <strong>{getTopicLabel(req.new_topic)}</strong></div>
                              <div>Liên quan: {req.original_relevance === null ? "Chưa rõ" : req.original_relevance ? "Có" : "Không"} ➔ <strong>{req.new_relevance === null ? "Chưa rõ" : req.new_relevance ? "Có" : "Không"}</strong></div>
                              <div>Ý định: {req.original_intent || "None"} ➔ <strong>{req.new_intent || "None"}</strong></div>
                            </div>

                            {req.reason && (
                              <p className="text-[10px] text-[var(--color-text-secondary)] italic border-l-2 border-slate-300 dark:border-slate-700 pl-1.5">
                                Lý do: {req.reason}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-[var(--color-border)]/40">
                              <span className={`font-bold px-2 py-0.5 rounded-full ${isApproved
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                }`}>
                                {isApproved ? "Đã duyệt" : "Đã từ chối"}
                              </span>
                              {req.resolved_by && (
                                <span className="text-[9px] text-[var(--color-text-muted)] italic">
                                  Duyệt bởi Ban quản lý
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Widget: Internal Notes */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Ghi chú nội bộ dành cho team
              </label>

              {/* Render existing internal notes list */}
              {alert.internal_notes && alert.internal_notes.length > 0 && (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {alert.internal_notes.map((noteObj: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-[var(--color-border)]/50 rounded-xl text-[11px] space-y-1">
                      <div className="flex justify-between font-bold text-[var(--color-text-primary)]">
                        <span>{noteObj.author}</span>
                        <span className="text-[9px] text-[var(--color-text-muted)]">{getRelativeTime(noteObj.timestamp)}</span>
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-normal">{noteObj.note}</p>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={internalNoteInput}
                onChange={(e) => setInternalNoteInput(e.target.value)}
                placeholder="Nhập ghi chú quan trọng cho team..."
                className="w-full text-xs p-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-20"
              />

              <button
                onClick={handleAddInternalNote}
                className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Lưu ghi chú nội bộ
              </button>
            </div>

            {/* Widget: Escalate Button */}
            {isMine && (
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">bolt</span>
                ESCALATE (BÁO CÁO CẤP CAO)
              </button>
            )}

            {/* Widget: Suggestion Templates */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                <span className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                  Mẫu phản hồi gợi ý (SOP)
                </span>
                <span className="material-symbols-outlined text-slate-400 text-base">quickreply</span>
              </div>
              <div className="p-4 space-y-3">
                <div
                  onClick={() => selectTemplateText("Chào bạn, chúng tôi rất tiếc về sự cố này. Vui lòng inbox để được hỗ trợ ngay...")}
                  className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-[var(--color-border)]/50 rounded-xl cursor-pointer hover:border-purple-500 transition-all text-left"
                >
                  <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">Xác nhận &amp; Xin lỗi</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)] italic line-clamp-2">
                    "Chào bạn, chúng tôi rất tiếc về sự cố này. Vui lòng inbox để được hỗ trợ ngay..."
                  </p>
                </div>
                <div
                  onClick={() => selectTemplateText("Cảm ơn bạn đã phản hồi. Để giải quyết nhanh nhất, bạn cho mình xin mã đơn hàng...")}
                  className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-[var(--color-border)]/50 rounded-xl cursor-pointer hover:border-purple-500 transition-all text-left"
                >
                  <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">Cần thêm thông tin</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)] italic line-clamp-2">
                    "Cảm ơn bạn đã phản hồi. Để giải quyết nhanh nhất, bạn cho mình xin mã đơn hàng..."
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modals rendering at root level */}
      {showReportModal && (
        <IncidentReportModal
          item={alert}
          onClose={() => setShowReportModal(false)}
          triggerToast={triggerToast}
        />
      )}
      {showMonitoringModal && alert && (
        <MonitoringTransitionModal
          onClose={() => setShowMonitoringModal(false)}
          onConfirm={async (note, durationHours) => {
            const finalStatus = durationHours > 0 ? "monitoring" : "resolved";
            await updateAlertStatus(
              alert.id,
              finalStatus,
              profile,
              {
                note,
                monitoring_duration_hours: durationHours > 0 ? durationHours : undefined
              },
              alert.brand
            );
            setAlert({
              ...alert,
              status: finalStatus,
              monitoring_started_at: durationHours > 0 ? new Date().toISOString() : undefined,
              monitoring_duration_hours: durationHours > 0 ? durationHours : undefined,
              monitoring_initial_comments: alert.comments || 0,
              monitoring_initial_likes: alert.likes || 0,
              monitoring_initial_shares: alert.shares || 0,
            });
            triggerToast(durationHours > 0 ? "Vụ việc đã được chuyển sang theo dõi thêm!" : "Đã hoàn tất và đóng vụ việc!");
          }}
        />
      )}

      {/* Floating Status Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-green-500 animate-slide-up">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
