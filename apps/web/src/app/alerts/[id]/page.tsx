"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAlertStore, type AlertData, type EscalationData, type CustomerContactAttempt } from "@/stores/alert.store";

type CustomerResponseResult = NonNullable<AlertData["customer_response_result"]>;

const CUSTOMER_RESPONSE_OPTIONS: Array<{
  value: CustomerResponseResult;
  label: string;
  icon: string;
  tone: string;
}> = [
  { value: "positive", label: "Khách hàng phản hồi tích cực", icon: "sentiment_satisfied", tone: "border-green-300 bg-green-50 text-green-700" },
  { value: "no_response", label: "Chưa phản hồi", icon: "schedule", tone: "border-blue-300 bg-blue-50 text-blue-700" },
  { value: "still_upset", label: "Khách hàng vẫn bức xúc", icon: "sentiment_dissatisfied", tone: "border-red-300 bg-red-50 text-red-700" },
  { value: "not_suitable", label: "Không phù hợp", icon: "block", tone: "border-slate-300 bg-slate-50 text-slate-700" },
];

function createDefaultContactTemplate(customerName: string, brand: string): string {
  return `Xin chào ${customerName || "Anh/Chị"}, ${formatBrandName(brand)} thành thật xin lỗi về trải nghiệm chưa tốt của Anh/Chị. Anh/Chị vui lòng nhắn tin trực tiếp hoặc để lại thông tin liên hệ để chúng tôi kiểm tra và hỗ trợ giải quyết vấn đề sớm nhất. Cảm ơn Anh/Chị đã phản hồi.`;
}

import { useAuth } from "@/hooks/useAuth";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { dbSecond, auth } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore";
import { canPerformAction } from "@/lib/rbac";
import { getScopedBrandKey } from "@/lib/brandScope";
import { fetchSingleSupabaseAlert, updateSupabaseAlertLabel, fetchCommentsForPost, type PostComment } from "@/lib/supabase";
import { supabaseClient } from "@/lib/supabaseClient";
import { QuickReplyHelper } from "@/components/ui/QuickReplyHelper";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
// Helper function to format brand display names
function formatBrandName(brand: string): string {
  if (!brand) return "";
  const lower = brand.toLowerCase();
  if (lower === "mixue") return "Mixue";
  if (lower.includes("starbuck")) return "Starbucks";
  if (lower.includes("highland")) return "Highlands Coffee";
  return brand
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Inline helper for calculating relative time
function getRelativeTime(isoString: string | undefined): string {
  if (!isoString) return "Kh├┤ng r├╡";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Kh├┤ng r├╡";

    // Format helper: dd/mm/yyyy
    const formatted = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Future date ΓåÆ show formatted date
    if (diffMs < 0) return formatted;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vß╗½a xong";
    if (diffMins < 60) return `${diffMins} ph├║t tr╞░ß╗¢c`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giß╗¥ tr╞░ß╗¢c`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ng├áy tr╞░ß╗¢c`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} th├íng tr╞░ß╗¢c`;

    // Older than a year ΓåÆ show formatted date
    return formatted;
  } catch (e) {
    return "Kh├┤ng r├╡";
  }
}

// ΓöÇΓöÇ Incident Report Modal (Escalate) ΓöÇΓöÇ
interface IncidentReportModalProps {
  item: AlertData;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

function IncidentReportModal({ item, onClose, triggerToast }: IncidentReportModalProps) {
  const [impactAssessment, setImpactAssessment] = useState(
    `Sß╗▒ viß╗çc li├¬n quan ─æß║┐n ${formatBrandName(item.brand)} tr├¬n nguß╗ôn ${(item.source || "").toUpperCase()} ─æang thu h├║t phß║ún hß╗ôi ti├¬u cß╗▒c tß╗½ d╞░ luß║¡n. Nguy c╞í g├óy tß╗òn hß║íi uy t├¡n th╞░╞íng hiß╗çu trung/d├ái hß║ín nß║┐u kh├┤ng ─æ╞░ß╗úc giß║úi quyß║┐t ngay.`
  );

  const [sopActions, setSopActions] = useState(
    `1. Tiß║┐p cß║¡n trß╗▒c tiß║┐p chß╗º sß╗ƒ hß╗»u b├ái ─æ─âng ─æß╗â ─æß╗æi thoß║íi giß║úi quyß║┐t m├óu thuß║½n.\n2. B├ío c├ío Ban Gi├ím ─æß╗æc t├¼nh h├¼nh diß╗àn biß║┐n v├á kß╗ïch bß║ún ß╗⌐ng ph├│.\n3. R├á so├ít chß║Ñt l╞░ß╗úng vß║¡n h├ánh nß╗Öi bß╗Ö tß║íi ─æiß╗âm chß║ím ph├ít sinh sß╗▒ cß╗æ.`
  );

  const brandName = formatBrandName(item.brand);
  const sourceName = (item.source || "unknown").toUpperCase();
  const severityText = (item.severity || "high").toUpperCase();
  const dateStr = new Date(item.created_at || Date.now()).toLocaleString("vi-VN");

  const handleExport = () => {
    const reportData = {
      title: `B├ío c├ío Sß╗▒ cß╗æ Khß║⌐n cß║Ñp - ${brandName} - ${sourceName}`,
      brand: brandName,
      source: sourceName,
      severity: severityText,
      created_at: dateStr,
      reporter: item.author || "ß║¿n danh",
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
    triggerToast("─É├ú gß╗¡i b├ío c├ío khß║⌐n cß║Ñp ─æß║┐n Ban gi├ím ─æß╗æc!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden p-6 z-10 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            B├ío c├ío sß╗▒ cß╗æ khß║⌐n cß║Ñp (Escalate)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-xs space-y-1.5 text-[var(--color-text-secondary)] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-[var(--color-border)]/50">
          <p><strong>Th╞░╞íng hiß╗çu:</strong> {brandName}</p>
          <p><strong>Nguß╗ôn ph├ít hiß╗çn:</strong> {sourceName}</p>
          <p><strong>Mß╗⌐c ─æß╗Ö:</strong> <span className="text-red-500 font-bold">{severityText}</span></p>
          <p><strong>Thß╗¥i gian:</strong> {dateStr}</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
            ─É├ính gi├í t├íc ─æß╗Öng ß║únh h╞░ß╗ƒng
          </label>
          <textarea
            value={impactAssessment}
            onChange={(e) => setImpactAssessment(e.target.value)}
            className="w-full text-xs p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
            Biß╗çn ph├íp ß╗⌐ng ph├│ khuyß║┐n nghß╗ï (SOP)
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
            <span className="material-symbols-outlined text-sm">download</span> Xuß║Ñt B├ío C├ío
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all cursor-pointer"
          >
            Gß╗¡i Escalate
          </button>
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇ Monitoring Transition Modal ΓöÇΓöÇ
interface MonitoringTransitionModalProps {
  onClose: () => void;
  onConfirm: (note: string, durationHours: number) => Promise<void>;
}

function MonitoringTransitionModal({ onClose, onConfirm }: MonitoringTransitionModalProps) {
  const [note, setNote] = useState("─É├ú ho├án tß║Ñt c├íc b╞░ß╗¢c xß╗¡ l├╜ theo SOP. Chuyß╗ân sang trß║íng th├íi theo d├╡i th├¬m.");
  const [duration, setDuration] = useState("72");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!note.trim()) {
      setError("Vui l├▓ng nhß║¡p ghi ch├║ ho├án tß║Ñt.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(note.trim(), parseFloat(duration));
      onClose();
    } catch (e: any) {
      setError("Lß╗ùi: " + (e.message || "Kh├┤ng thß╗â chuyß╗ân trß║íng th├íi."));
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
            Ho├án tß║Ñt xß╗¡ l├╜ &amp; Bß║»t ─æß║ºu theo d├╡i
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-[var(--color-text-secondary)] uppercase text-[10px]">
            Ghi ch├║ xß╗¡ l├╜ / Bß║▒ng chß╗⌐ng
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
            Thß╗¥i gian theo d├╡i th├¬m
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2.5 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] focus:outline-none"
          >
            <option value="72">72 giß╗¥ (Khuy├¬n d├╣ng)</option>
            <option value="24">24 giß╗¥</option>
            <option value="1">1 giß╗¥</option>
            <option value="0.166">10 ph├║t</option>
            <option value="0.033">2 ph├║t (─Éß╗â test nhanh)</option>
            <option value="0">─É├│ng ngay (Kh├┤ng theo d├╡i)</option>
          </select>
        </div>

        {error && <p className="text-red-500 font-bold">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[var(--color-text-primary)] border border-[var(--color-border)] transition-all font-bold cursor-pointer"
          >
            Hß╗ºy
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold transition-all shadow-sm cursor-pointer"
          >
            {busy ? "─Éang xß╗¡ l├╜..." : "X├íc nhß║¡n"}
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
  if (val === "positive" || val === "t├¡ch cß╗▒c") return "T├¡ch cß╗▒c";
  if (val === "negative" || val === "ti├¬u cß╗▒c") return "Ti├¬u cß╗▒c";
  return "Trung lß║¡p";
};

const getSeverityLabel = (val: string) => {
  if (val === "low") return "Thß║Ñp";
  if (val === "medium") return "Trung b├¼nh";
  if (val === "high") return "Cao";
  if (val === "critical") return "Khß║⌐n cß║Ñp";
  return val || "Trung b├¼nh";
};

const getTopicLabel = (val: string) => {
  const map: Record<string, string> = {
    quality: "Chß║Ñt l╞░ß╗úng",
    price: "Gi├í cß║ú",
    service: "Dß╗ïch vß╗Ñ",
    staff: "Nh├ón vi├¬n",
    delivery: "Giao h├áng",
    experience: "Trß║úi nghiß╗çm",
    legal: "Ph├íp l├╜",
    operation: "Vß║¡n h├ánh",
    competitor: "─Éß╗æi thß╗º",
    other: "Kh├íc",
    "chß║Ñt l╞░ß╗úng dß╗ïch vß╗Ñ": "Dß╗ïch vß╗Ñ",
    "chß║Ñt l╞░ß╗úng sß║ún phß║⌐m": "Chß║Ñt l╞░ß╗úng",
    "truyß╗ün th├┤ng & pr": "Truyß╗ün th├┤ng & PR",
    "ph├íp l├╜": "Ph├íp l├╜",
  };
  return map[String(val).toLowerCase()] || val || "Kh├íc";
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
    correctionRequests,
  } = useAlertStore();

  const [alert, setAlert] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const [contactEvidenceNote, setContactEvidenceNote] = useState("");
  const [contactEvidenceImage, setContactEvidenceImage] = useState<string | null>(null);
  const [previewEvidenceImage, setPreviewEvidenceImage] = useState<string | null>(null);
  const [savingContactEvidence, setSavingContactEvidence] = useState(false);

  // Left column active tab state ("content" | "history")
  const [activeLeftTab, setActiveLeftTab] = useState<"content" | "history">("content");
  const [brandTemplates, setBrandTemplates] = useState<any[]>([]);

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
    if (!alert || (alert.status !== "monitoring" && !alert.monitoring_started_at)) {
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
        setTimeLeftStr("Hß║┐t thß╗¥i gian theo d├╡i");
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (3600 * 1000));
        const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setTimeLeftStr(`${hours} giß╗¥ ${mins} ph├║t ${secs} gi├óy`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alert]);

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


  const handleOpenCustomerContact = async () => {
    if (!alert) return;
    const contactUrl = [alert.social_profile_url, alert.url, alert.post_url]
      .find((url) => Boolean(url && url !== "#"));
    if (!contactUrl) {
      triggerToast("Cảnh báo này chưa có liên kết để liên hệ khách hàng.");
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

    try {
      await updateAlertStatus(alert.id, "resolving", profile, {
        note: "Đã mở liên kết liên hệ khách hàng và tạo mẫu phản hồi xin lỗi mặc định.",
        customer_contact_opened_at: openedAt,
        customer_contact_opened_by: profile?.email || profile?.uid || "unknown",
        customer_contact_template: template,
      }, alert.brand);
      setAlert({
        ...alert,
        status: "resolving",
        customer_contact_opened_at: openedAt,
        customer_contact_opened_by: profile?.email || profile?.uid || "unknown",
        customer_contact_template: template,
      });
      triggerToast("Đã sao chép mẫu xin lỗi và mở liên kết liên hệ.");
    } catch (error) {
      triggerToast("Đã mở liên kết nhưng chưa lưu được dấu vết liên hệ.");
      console.error(error);
    }
  };

  const handleCustomerResponseResult = async (result: CustomerResponseResult) => {
    if (!alert?.customer_contact_opened_at || !alert.customer_contact_note || !alert.customer_contact_evidence_image) return;
    const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find((option) => option.value === result)?.label || result;
    try {
      await updateAlertStatus(alert.id, "resolving", profile, {
        note: `Đã ghi nhận kết quả liên hệ: ${resultLabel}.`,
        customer_response_result: result,
      }, alert.brand);
      setAlert({ ...alert, status: "resolving", customer_response_result: result });
      triggerToast(`Đã lưu: ${resultLabel}.`);
    } catch (error) {
      triggerToast("Không thể lưu kết quả phản hồi. Vui lòng thử lại.");
      console.error(error);
    }
  };

  const handleContactEvidenceImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerToast("Vui lòng chọn một tệp hình ảnh.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      triggerToast("Ảnh minh chứng phải nhỏ hơn 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        setContactEvidenceImage(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveContactEvidence = async () => {
    if (!alert?.customer_contact_opened_at) {
      triggerToast("Hãy bấm ‘Xem trên nền tảng’ trước.");
      return;
    }
    if (!contactEvidenceNote.trim() || !contactEvidenceImage) {
      triggerToast("Cần nhập ghi chú và thêm ảnh minh chứng.");
      return;
    }

    setSavingContactEvidence(true);
    try {
      await updateAlertStatus(alert.id, "resolving", profile, {
        note: `Đã bổ sung minh chứng liên hệ: ${contactEvidenceNote.trim()}`,
        customer_contact_note: contactEvidenceNote.trim(),
        customer_contact_evidence_image: contactEvidenceImage,
      }, alert.brand);
      setAlert({
        ...alert,
        status: "resolving",
        customer_contact_note: contactEvidenceNote.trim(),
        customer_contact_evidence_image: contactEvidenceImage,
      });
      triggerToast("Đã lưu minh chứng liên hệ.");
    } catch (error) {
      triggerToast("Không thể lưu minh chứng. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setSavingContactEvidence(false);
    }
  };

  const buildContactHistory = (
    outcomeStatus: CustomerContactAttempt["outcome_status"]
  ): CustomerContactAttempt[] => {
    if (!alert?.customer_contact_opened_at || !alert.customer_contact_note || !alert.customer_contact_evidence_image || !alert.customer_response_result) {
      return alert?.customer_contact_history || [];
    }
    return [
      ...(alert.customer_contact_history || []),
      {
        opened_at: alert.customer_contact_opened_at,
        opened_by: alert.customer_contact_opened_by,
        template: alert.customer_contact_template,
        note: alert.customer_contact_note,
        evidence_image: alert.customer_contact_evidence_image,
        response_result: alert.customer_response_result,
        completed_at: new Date().toISOString(),
        outcome_status: outcomeStatus,
      },
    ];
  };

  const handleCompleteAction = async () => {
    if (!alert) return;
    if (!alert.customer_contact_opened_at || !alert.customer_contact_note || !alert.customer_contact_evidence_image || !alert.customer_response_result) {
      triggerToast("Chưa đủ liên kết, ghi chú, ảnh minh chứng và kết quả phản hồi.");
      return;
    }

    const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find(
      (option) => option.value === alert.customer_response_result
    )?.label;
    const contactEvidencePayload = {
      customer_contact_opened_at: alert.customer_contact_opened_at,
      customer_contact_opened_by: alert.customer_contact_opened_by,
      customer_contact_template: alert.customer_contact_template,
      customer_contact_note: alert.customer_contact_note,
      customer_contact_evidence_image: alert.customer_contact_evidence_image,
      customer_response_result: alert.customer_response_result,
    };

    try {
      if (alert.customer_response_result === "no_response") {
        await updateAlertStatus(alert.id, "contact_waiting", profile, {
          note: `Đã liên hệ khách hàng nhưng chưa nhận được phản hồi.${resultLabel ? ` Kết quả: ${resultLabel}.` : ""}`,
          ...contactEvidencePayload,
          customer_contact_history: buildContactHistory("contact_waiting"),
          reset_customer_contact: true,
        }, alert.brand);
        router.push("/alerts");
        return;
      }

      if (alert.customer_response_result === "still_upset") {
        await updateAlertStatus(alert.id, "contact_failed", profile, {
          note: `Liên hệ trao đổi không thành; khách hàng vẫn bức xúc.${resultLabel ? ` Kết quả: ${resultLabel}.` : ""}`,
          ...contactEvidencePayload,
          customer_contact_history: buildContactHistory("contact_failed"),
          reset_customer_contact: true,
        }, alert.brand);
        router.push("/alerts");
        return;
      }

      await updateAlertStatus(alert.id, "resolved", profile, {
        note: resultLabel
          ? `Hoàn tất xử lý sau khi liên hệ khách hàng. Kết quả: ${resultLabel}.`
          : "Hoàn tất xử lý sau khi liên hệ khách hàng.",
        ...contactEvidencePayload,
        customer_contact_history: buildContactHistory("resolved"),
      }, alert.brand);
      router.push("/alerts");
    } catch (error) {
      triggerToast("Không thể cập nhật trạng thái liên hệ. Vui lòng thử lại.");
      console.error(error);
    }
  };


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
      triggerToast("Vui l├▓ng nhß║¡p dß╗▒ thß║úo phß║ún hß╗ôi v├á mß╗⌐c ─æß╗ün b├╣ ─æß╗ü xuß║Ñt.");
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
        note: "─É├ú gß╗¡i ph╞░╞íng ├ín phß║ún hß╗ôi v├á ─æß╗ün b├╣ l├¬n Brand Manager duyß╗çt.",
        escalation,
      }, alert.brand);
      await createEscalationNotification({
        title: `Y├¬u cß║ºu duyß╗çt ph╞░╞íng ├ín: Vß╗Ñ viß╗çc #${alert.id.slice(-4)}`,
        message: `${escalation.submitted_by_name} ─æ├ú gß╗¡i ph╞░╞íng ├ín phß║ún hß╗ôi cho ${formatBrandName(alert.brand)}.`,
        recipient_role: "brand_manager",
      });
      setAlert({ ...alert, status: "pending_approval", escalation });
      triggerToast("─É├ú gß╗¡i ph╞░╞íng ├ín l├¬n Brand Manager duyß╗çt.");
    } catch (e) {
      console.error(e);
      triggerToast("Kh├┤ng thß╗â gß╗¡i duyß╗çt ph╞░╞íng ├ín: " + (e instanceof Error ? e.message : String(e)));
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
          ? "Brand Manager ─æ├ú ph├¬ duyß╗çt ph╞░╞íng ├ín phß║ún hß╗ôi."
          : `Brand Manager y├¬u cß║ºu chß╗ënh sß╗¡a ph╞░╞íng ├ín.${approvalNote.trim() ? ` Ghi ch├║: ${approvalNote.trim()}` : ""}`,
        escalation,
      }, alert.brand);
      await createEscalationNotification({
        title: decision === "approved" ? `Ph╞░╞íng ├ín ─æ├ú ─æ╞░ß╗úc duyß╗çt: #${alert.id.slice(-4)}` : `Cß║ºn chß╗ënh sß╗¡a ph╞░╞íng ├ín: #${alert.id.slice(-4)}`,
        message: decision === "approved"
          ? "Brand Manager ─æ├ú duyß╗çt ph╞░╞íng ├ín phß║ún hß╗ôi v├á mß╗⌐c ─æß╗ün b├╣."
          : "Brand Manager y├¬u cß║ºu chß╗ënh sß╗¡a ph╞░╞íng ├ín phß║ún hß╗ôi.",
        recipient_role: "crisis_employee",
        recipient_email: alert.escalation.submitted_by_email,
      });
      setAlert({ ...alert, status: nextStatus, escalation });
      triggerToast(decision === "approved" ? "─É├ú ph├¬ duyß╗çt ph╞░╞íng ├ín." : "─É├ú gß╗¡i y├¬u cß║ºu chß╗ënh sß╗¡a.");
    } catch (e) {
      console.error(e);
      triggerToast("Kh├┤ng thß╗â xß╗¡ l├╜ ph├¬ duyß╗çt: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setEscalationBusy(false);
    }
  };

  const loadAlertDetail = useCallback(async (showGlobalLoading = false) => {
    if (!id) return;

    const readStoreAlert = () => useAlertStore.getState().rawAlerts.find((a) =>
      a.id === id ||
      a.source_id === id ||
      a.post_id === id ||
      a.comment_id === id
    );
    let storeAlert = readStoreAlert();
    if (!storeAlert) {
      await useAlertStore.getState().fetchAlerts(getScopedBrandKey(profile));
      storeAlert = readStoreAlert();
    }

    if (storeAlert) {
      setAlert(storeAlert);
      setNewSeverity(storeAlert.severity || "medium");
      setLoading(false);
      setRefreshing(true);
    } else if (showGlobalLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const detail = await fetchSingleSupabaseAlert(id);
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
      } else if (!storeAlert) {
        setAlert(null);
      }
    } catch (err) {
      console.error("Error loading alert document details from Supabase:", err);
      if (!storeAlert) {
        setAlert(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, profile]);

  // Real-time detail sync: Supabase Realtime (push) + manual refresh
  useEffect(() => {
    if (!id) return;

    // Initial load with global loading state
    loadAlertDetail(true);

    const cleanupFns: (() => void)[] = [];

    // Strategy 1: Supabase Realtime ΓÇö push updates when this specific annotation changes
    if (supabaseClient) {
      try {
        const channelName = `alert-detail-${id.replace(/[^a-zA-Z0-9]/g, "-")}`;
        const channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "annotations" },
            () => {
              // Any annotation update ΓÇö reload this detail
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
    // Relying on manual "L├ám mß╗¢i" button and realtime push instead.

    return () => cleanupFns.forEach((fn) => fn());
  }, [id, loadAlertDetail]);


  // Fetch brand response templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/templates", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter by active and category === "crisis"
          const list = (data.data || []).filter((t: any) => t.isActive && t.category === "crisis");
          setBrandTemplates(list);
        }
      } catch (err) {
        console.error("Error loading brand templates:", err);
      }
    };
    if (alert) {
      loadTemplates();
    }
  }, [alert]);

  // NOTE: Detail page does NOT auto-lock on mount.
  // Locking only happens when the Crisis Officer clicks "Nhß║¡n xß╗¡ l├╜" on the list page.
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
      const authorName = profile?.displayName || getResolverName(profile?.email) || "Nh├ón vi├¬n trß╗▒c";
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
      triggerToast("─É├ú th├¬m ghi ch├║ xß╗¡ l├╜!");
    } catch (e) {
      console.error(e);
      triggerToast("Lß╗ùi th├¬m ghi ch├║. Vui l├▓ng thß╗¡ lß║íi!");
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
      triggerToast("─É├ú th├¬m ghi ch├║ nß╗Öi bß╗Ö!");
    } catch (e) {
      console.error(e);
      triggerToast("Kh├┤ng thß╗â l╞░u ghi ch├║ nß╗Öi bß╗Ö!");
    }
  };

  // Handler: Save modified severity
  const handleSaveSeverity = async () => {
    if (!alert) return;
    if (!severityReason.trim()) {
      triggerToast("Vui l├▓ng ─æiß╗ün l├╜ do thay ─æß╗òi mß╗⌐c ─æß╗Ö!");
      return;
    }

    try {
      const authorName = profile?.displayName || getResolverName(profile?.email) || "Admin Officer";

      // Add custom entry to resolution attempt log
      const nextHistory = alert.resolution_history ? [...alert.resolution_history] : [];
      nextHistory.push({
        attempt_number: nextHistory.length + 1,
        timestamp: new Date().toISOString(),
        note: `Thay ─æß╗òi mß╗⌐c ─æß╗Ö rß╗ºi ro th├ánh ${newSeverity.toUpperCase()}. L├╜ do: ${severityReason.trim()}`,
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
      triggerToast("Cß║¡p nhß║¡t mß╗⌐c ─æß╗Ö rß╗ºi ro th├ánh c├┤ng!");
    } catch (e) {
      console.error(e);
      triggerToast("Kh├┤ng thß╗â cß║¡p nhß║¡t mß╗⌐c ─æß╗Ö rß╗ºi ro.");
    }
  };

  // Handler: Submit Correction Request (Gß╗¡i y├¬u cß║ºu chß╗ënh sß╗¡a)
  const handleSendCorrectionRequest = async () => {
    if (!alert || !correctionReason.trim()) {
      triggerToast("Vui l├▓ng ─æiß╗ün nß╗Öi dung y├¬u cß║ºu chß╗ënh sß╗¡a!");
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
      triggerToast("Gß╗¡i y├¬u cß║ºu chß╗ënh sß╗¡a th├ánh c├┤ng!");
    } catch (e) {
      console.error(e);
      triggerToast("Gß╗¡i y├¬u cß║ºu thß║Ñt bß║íi. Vui l├▓ng thß╗¡ lß║íi!");
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
        <p className="text-sm text-[var(--color-text-secondary)] font-bold">─Éang tß║úi chi tiß║┐t vß╗Ñ viß╗çc...</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <span className="material-symbols-outlined text-red-500 text-6xl">warning</span>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Vß╗Ñ viß╗çc kh├┤ng tß╗ôn tß║íi</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">T├ái liß╗çu cß║únh b├ío n├áy c├│ thß╗â ─æ├ú bß╗ï x├│a hoß║╖c bß║ín kh├┤ng c├│ quyß╗ün truy cß║¡p.</p>
        <button
          onClick={() => router.push("/alerts")}
          className="px-6 py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all text-xs"
        >
          Quay lß║íi danh s├ích
        </button>
      </div>
    );
  }

  const isLockedByOthers = alert.being_resolved_by && alert.being_resolved_by !== profile?.email;
  const isMine = alert.being_resolved_by === profile?.email;

  const workflowStatus = getAlertWorkflowStatus(alert);
  const hasContactProof = Boolean(
    alert.customer_contact_opened_at &&
    alert.customer_contact_note?.trim() &&
    alert.customer_contact_evidence_image
  );
  const canComplete = Boolean(hasContactProof && alert.customer_response_result);


  // Sentiment Color Mapping
  let sentimentBadge = "bg-slate-50 text-slate-600 border-slate-100";
  if (alert.sentiment === "negative" || alert.sentiment === "ti├¬u cß╗▒c") {
    sentimentBadge = "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30";
  } else if (alert.sentiment === "positive" || alert.sentiment === "t├¡ch cß╗▒c") {
    sentimentBadge = "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30";
  }

  // Progress step helpers
  const statusSteps = ["new", "resolving", "pending_approval", "responded", "monitoring", "resolved"];
  const statusLabels: Record<string, string> = {
    new: "Mß╗¢i",
    resolving: "─Éang xß╗¡ l├╜",
    pending_approval: "Chß╗¥ duyß╗çt",
    responded: "─É├ú phß║ún hß╗ôi",
    monitoring: "Theo d├╡i",
    resolved: "─É├ú ─æ├│ng",
  };
  const currentStepIdx = statusSteps.indexOf(alert.status ?? "new");
  const progressPct = Math.round((currentStepIdx / (statusSteps.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] animate-fade-in pb-16">

      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[var(--color-border)] z-30">
        <div className="px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/alerts")}
              className="p-1.5 hover:bg-[var(--color-bg-surface-raised)] rounded-xl border border-[var(--color-border)] text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-black text-[var(--color-text-primary)] uppercase flex items-center gap-2 flex-wrap">
                Vß╗Ñ viß╗çc #{alert.id.slice(-4)}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 flex-shrink-0 ${
                  alert.severity === "critical" ? "bg-red-600" :
                  alert.severity === "high" ? "bg-orange-500" :
                  alert.severity === "medium" ? "bg-yellow-500" : "bg-slate-500"
                }`}>
                  {riskScore} ┬╖ {
                    alert.severity === "critical" ? "Khß║⌐n cß║Ñp" :
                    alert.severity === "high" ? "Rß╗ºi ro cao" :
                    alert.severity === "medium" ? "Trung b├¼nh" : "Thß║Ñp"
                  }
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                  alert.status === "new" ? "bg-blue-100 text-blue-600" :
                  alert.status === "resolving" ? "bg-amber-100 text-amber-600" :
                  alert.status === "pending_approval" ? "bg-orange-100 text-orange-700 animate-pulse" :
                  alert.status === "responded" ? "bg-indigo-100 text-indigo-700" :
                  alert.status === "monitoring" ? "bg-cyan-100 text-cyan-700" :
                  alert.status === "resolved" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                }`}>
                  {
                    alert.status === "new" ? "Mß╗¢i ph├ít hiß╗çn" :
                    alert.status === "resolving" ? "─Éang xß╗¡ l├╜" :
                    alert.status === "pending_approval" ? "Chß╗¥ duyß╗çt" :
                    alert.status === "responded" ? "─É├ú phß║ún hß╗ôi" :
                    alert.status === "monitoring" ? "Theo d├╡i th├¬m" :
                    "─É├ú ─æ├│ng"
                  }
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-text-muted)] font-semibold">
                <span className="material-symbols-outlined text-[11px]">person</span>
                {alert.being_resolved_by ? getResolverName(alert.being_resolved_by) : "Ch╞░a c├│ ng╞░ß╗¥i phß╗Ñ tr├ích"}
                {isLockedByOthers && (
                  <span className="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5 animate-pulse">
                    ΓÜá∩╕Å ─Éang ─æ╞░ß╗úc xß╗¡ l├╜
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => { loadAlertDetail(false); triggerToast("─É├ú l├ám mß╗¢i!"); }}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs rounded-xl hover:bg-[var(--color-bg-surface-raised)] transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              <span className="hidden sm:inline">L├ám mß╗¢i</span>
            </button>

            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); triggerToast("─É├ú sao ch├⌐p!"); }}
              className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs rounded-xl hover:bg-[var(--color-bg-surface-raised)] transition-all cursor-pointer"
            >
              Chia sß║╗
            </button>

            {!isMine && !isLockedByOthers && (
              <button
                onClick={() => { lockAlertForResolution(alert.id, profile); triggerToast("─É├ú nhß║¡n xß╗¡ l├╜!"); }}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Nhß║¡n xß╗¡ l├╜
              </button>
            )}

            {isMine && alert.status !== "resolved" && alert.status !== "monitoring" && (
              <button
                onClick={() => setShowMonitoringModal(true)}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Ho├án tß║Ñt
              </button>
            )}

            {isMine && alert.status === "monitoring" && (
              <button
                onClick={async () => {
                  try {
                    await updateAlertStatus(alert.id, "resolved", profile, { note: "─É├ú ─æ├│ng hß║│n vß╗Ñ viß╗çc." }, alert.brand);
                    setAlert({ ...alert, status: "resolved" });
                    triggerToast("─É├ú ─æ├│ng hß║│n!");
                  } catch (e) { triggerToast("Lß╗ùi!"); }
                }}
                className="px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                ─É├│ng hß║│n
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar ΓÇö tiß║┐n ─æß╗Ö xß╗¡ l├╜ */}
        <div className="px-4 md:px-8 pb-3">
          <div className="flex items-center gap-1.5">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = alert.status === step;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                      isCurrent ? "bg-indigo-600 border-indigo-600 scale-125 shadow shadow-indigo-200" :
                      isCompleted ? "bg-indigo-400 border-indigo-400" :
                      "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    }`} />
                    <span className={`text-[8px] font-bold mt-0.5 whitespace-nowrap hidden md:block ${
                      isCurrent ? "text-indigo-600 dark:text-indigo-400" :
                      isCompleted ? "text-[var(--color-text-secondary)]" :
                      "text-[var(--color-text-muted)]"
                    }`}>{statusLabels[step]}</span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 transition-all duration-500 ${
                      idx < currentStepIdx ? "bg-indigo-400" : "bg-slate-200 dark:bg-slate-700"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
            <span className="text-[10px] font-black text-indigo-600 ml-1 flex-shrink-0">{progressPct}%</span>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">

        {/* LEFT COLUMN: 60% Width */}
        <div className="lg:col-span-7 space-y-6">

          {/* Tabs Selector */}
          <div className="flex border-b border-[var(--color-border)]">
            <button
              onClick={() => setActiveLeftTab("content")}
              className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
                activeLeftTab === "content"
                  ? "text-purple-600 dark:text-purple-400 font-extrabold"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Nß╗Öi dung cß║únh b├ío
              {activeLeftTab === "content" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveLeftTab("history")}
              className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
                activeLeftTab === "history"
                  ? "text-purple-600 dark:text-purple-400 font-extrabold"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              Lß╗ïch sß╗¡ xß╗¡ l├╜ ({alert.resolution_history?.length || 0})
              {activeLeftTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Contents */}
          {activeLeftTab === "content" && (
            <div className="space-y-6">
              {/* Widget: Real-time Monitoring Countdown & Activity Alert */}
              {alert.status === "monitoring" && (
                <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 animate-pulse text-lg">visibility</span>
                      <span className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                        Giai ─æoß║ín theo d├╡i khß╗ºng hoß║úng
                      </span>
                    </div>
                    <span className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Real-time Countdown
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-xl p-4 text-center space-y-1">
                    <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Thß╗¥i gian theo d├╡i c├▓n lß║íi</p>
                    <p className="text-lg md:text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                      {timeLeftStr || "─Éang t├¡nh to├ín..."}
                    </p>
                  </div>

                  {/* Activity / Abnormality alert banner */}
                  {newActivityDetails ? (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl space-y-2 animate-pulse">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        <span>Cß║óNH B├üO HOß║áT ─Éß╗ÿNG Bß║ñT TH╞»ß╗£NG</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        Hß╗ç thß╗æng ghi nhß║¡n c├│ t╞░╞íng t├íc mß╗¢i ph├ít sinh so vß╗¢i thß╗¥i ─æiß╗âm bß║»t ─æß║ºu theo d├╡i:
                      </p>
                      <div className="flex gap-4 text-[10px] font-bold text-red-600 dark:text-red-400 pt-1">
                        {newActivityDetails.likes > 0 && (
                          <span>+ {newActivityDetails.likes} Likes (Ng╞░ß╗íng an to├án: &le; 5)</span>
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
                        <p className="text-green-700 dark:text-green-400 font-bold text-xs">Trß║íng th├íi an to├án</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
                          Ch╞░a ph├ít hiß╗çn h├ánh vi t╞░╞íng t├íc ─æß╗Öt biß║┐n n├áo. Hß╗ç thß╗æng sß║╜ tß╗▒ ─æß╗Öng ─æ├│ng vß╗Ñ viß╗çc khi hß║┐t thß╗¥i gian.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Unified Alert & Context Card */}
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
                
                {/* Header section with platform, content type and original link */}
                <div className="flex flex-wrap justify-between items-center border-b border-[var(--color-border)]/50 pb-3 gap-3">
                  <div className="flex items-center gap-2">
                    <PlatformLogo platform={alert.source} size="sm" />
                    <div>
                      <h3 className="font-black text-xs text-[var(--color-text-primary)] uppercase leading-none">
                        {alert.content_type === "comment" ? "B├¼nh luß║¡n cß║únh b├ío" : "B├ái viß║┐t cß║únh b├ío"}
                      </h3>
                      <div className="flex items-center gap-3.5 mt-1">
                        <a
                          href={alert.url !== "#" ? alert.url : undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline text-[10px] font-bold flex items-center gap-0.5"
                        >
                          Xem tr├¬n {alert.source ? String(alert.source).toUpperCase() : "nß╗ün tß║úng gß╗æc"}
                          <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </a>
                        {alert.url && alert.url !== "#" && (
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(alert.text || "");
                                triggerToast("─É├ú sao ch├⌐p nß╗Öi dung cß║únh b├ío!");
                                window.open(alert.url, "_blank", "noopener,noreferrer");
                              } catch (err) {
                                console.warn("Failed to copy source text:", err);
                              }
                            }}
                            className="text-purple-600 hover:underline text-[10px] font-bold flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                          >
                            <span className="material-symbols-outlined text-[11px]">content_copy</span>
                            Sao ch├⌐p &amp; Mß╗ƒ nguß╗ôn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-[var(--color-text-muted)] font-semibold">
                    <p>─É─âng: {getRelativeTime(alert.created_at)}</p>
                    <p className="text-red-500 font-bold mt-0.5">Ph├ít hiß╗çn: {getRelativeTime(alert.created_at)}</p>
                  </div>
                </div>

                {/* Nested Original Post (only if this is a comment and has original post content) */}
                {alert.content_type === "comment" && alert.post_content && alert.post_content !== alert.text && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/10 border border-[var(--color-border)]/50 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">article</span> B├ái viß║┐t gß╗æc
                      </span>
                      {alert.post_url && alert.post_url !== "#" && (
                        <a
                          href={alert.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          Truy cß║¡p b├ái gß╗æc <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">{alert.post_content}</p>
                    
                    {/* Original post stats */}
                    {(alert.post_like_count || alert.post_comment_count || alert.post_share_count) ? (
                      <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-muted)] font-bold pt-1 border-t border-[var(--color-border)]/30 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-slate-400 text-xs">thumb_up</span>
                          <span>{(alert.post_like_count || 0).toLocaleString("vi-VN")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-slate-400 text-xs">chat_bubble</span>
                          <span>{(alert.post_comment_count || 0).toLocaleString("vi-VN")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-slate-400 text-xs">share</span>
                          <span>{(alert.post_share_count || 0).toLocaleString("vi-VN")}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Main Warning Comment or Post Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--color-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {alert.social_profile_url && alert.social_profile_url !== "#" ? (
                        <img src={alert.social_profile_url} alt={alert.author} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {String(alert.author || "A").substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--color-text-primary)]">@{alert.author || "ß║¿n danh"}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {alert.reach && alert.reach > 50000 && (
                          <span className="bg-pink-50 dark:bg-pink-950/20 text-pink-600 text-[9px] font-bold px-1.5 py-0.2 rounded-lg border border-pink-100 dark:border-pink-900/30">
                            KOL lß╗¢n
                          </span>
                        )}
                        <span className="text-[9px] text-[var(--color-text-secondary)] font-medium">
                          {(alert.reach || 0).toLocaleString("vi-VN")} l╞░ß╗út tiß║┐p cß║¡n
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Text content of alert */}
                  <div className="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 rounded-xl text-xs md:text-sm text-[var(--color-text-primary)] leading-relaxed font-semibold whitespace-pre-line">
                    {alert.text}
                  </div>

                  {/* Post Engagement Bar (only show if alert is a post) */}
                  {alert.content_type === "post" && (alert.likes || alert.comments || alert.shares) ? (
                    <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-secondary)] font-bold pt-1">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-slate-400 text-xs">thumb_up</span>
                        <span>{(alert.likes || 0).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-slate-400 text-xs">chat_bubble</span>
                        <span>{(alert.comments || 0).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-slate-400 text-xs">share</span>
                        <span>{(alert.shares || 0).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Quick case details strip (metadata badge block) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--color-border)]/50 text-[10px] text-[var(--color-text-secondary)] font-semibold">
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Chß╗º ─æß╗ü</span>
                    <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded">
                      {getTopicLabel(Array.isArray(alert.topic) ? alert.topic[0] : alert.topic)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Cß║úm x├║c</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded border ${
                      alert.sentiment === "negative" ? "bg-red-50 text-red-600 border-red-100" :
                      alert.sentiment === "positive" ? "bg-green-50 text-green-600 border-green-100" :
                      "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {alert.sentiment === "negative" ? "Ti├¬u cß╗▒c" : alert.sentiment === "positive" ? "T├¡ch cß╗▒c" : "Trung lß║¡p"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Th╞░╞íng hiß╗çu</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                      {formatBrandName(alert.brand)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Ng╞░ß╗¥i xß╗¡ l├╜</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {alert.being_resolved_by ? getResolverName(alert.being_resolved_by) : <span className="text-slate-400 italic">Ch╞░a c├│</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeLeftTab === "history" && (
            <div className="space-y-6">
              {/* Processing History (Timeline Log) */}
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-6">
                <h3 className="font-black text-xs md:text-sm text-[var(--color-text-primary)] uppercase tracking-wider pb-3 border-b border-[var(--color-border)]">
                  Lß╗ïch sß╗¡ xß╗¡ l├╜ sß╗▒ vß╗Ñ
                </h3>

                <div className="relative space-y-6 pl-6 before:absolute before:inset-y-1 before:left-[11px] before:w-0.5 before:bg-[var(--color-border)]">
                  {/* Event: initial detection */}
                  <div className="relative">
                     <div className="absolute -left-[23px] top-0.5 w-[14px] h-[14px] bg-indigo-600 rounded-full border-4 border-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)]"></div>
                     <div>
                       <div className="flex items-center justify-between text-xs">
                         <p className="font-bold text-[var(--color-text-primary)]">Hß╗ç thß╗æng ph├ít hiß╗çn tß╗▒ ─æß╗Öng</p>
                         <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">{getRelativeTime(alert.created_at)}</span>
                       </div>
                       <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                         Hß╗ç thß╗æng ─æ├ú tß╗▒ ─æß╗Öng g├ín nh├ún rß╗ºi ro khß║⌐n cß║Ñp dß╗▒a tr├¬n tß╗½ kh├│a nhß║íy cß║úm.
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
                            {h.resolved_by_name || getResolverName(h.resolved_by_email) || "Nh├ón vi├¬n trß╗▒c"}
                          </p>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">{getRelativeTime(h.timestamp)}</span>
                        </div>
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                          {h.note}
                          {h.image_url && (
                            <div className="mt-2.5 max-w-[200px] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-sm">
                              <img src={h.image_url} alt="Bß║▒ng chß╗⌐ng xß╗¡ l├╜" className="w-full h-auto" />
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
                      placeholder="Nhß║¡p ghi ch├║ xß╗¡ l├╜ mß╗¢i v├áo timeline..."
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
          )}
        </div>

        {/* RIGHT COLUMN: simplified */}
        <div className="lg:col-span-5 space-y-5">
          <div className="sticky top-[140px] space-y-5 pb-20">



            {/* Widget: Quick Reply + Draft (khi ─æang xß╗¡ l├╜ v├á l├á ng╞░ß╗¥i phß╗Ñ tr├ích) */}
                        {isMine && (workflowStatus === "processing" || workflowStatus === "contact_failed") && (
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-purple-500 text-base">support_agent</span>
                    Li├¬n hß╗ç v├á ghi nhß║¡n phß║ún hß╗ôi
                  </h3>
                  <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                    Phß║úi mß╗ƒ li├¬n kß║┐t li├¬n hß╗ç v├á chß╗ìn kß║┐t quß║ú tr╞░ß╗¢c khi ho├án tß║Ñt vß╗Ñ viß╗çc.
                  </p>
                </div>

                {alert.customer_contact_history && alert.customer_contact_history.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Lß╗ïch sß╗¡ li├¬n hß╗ç tr╞░ß╗¢c ({alert.customer_contact_history.length})
                    </p>
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {[...alert.customer_contact_history].reverse().map((contactAttempt, reverseIndex) => {
                        const attemptNumber = alert.customer_contact_history!.length - reverseIndex;
                        const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find(
                          (option) => option.value === contactAttempt.response_result
                        )?.label || contactAttempt.response_result;
                        const outcomeLabel = contactAttempt.outcome_status === "resolved"
                          ? "─É├ú giß║úi quyß║┐t"
                          : contactAttempt.outcome_status === "contact_waiting"
                            ? "─É├ú li├¬n hß╗ç ΓÇô Chß╗¥ phß║ún hß╗ôi"
                            : "Li├¬n hß╗ç kh├┤ng th├ánh";
                        return (
                          <article key={`${contactAttempt.completed_at}-${attemptNumber}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-black text-[var(--color-text-primary)]">Lß║ºn li├¬n hß╗ç {attemptNumber}</p>
                                <p className="text-[9px] text-[var(--color-text-muted)]">
                                  {new Date(contactAttempt.completed_at).toLocaleString("vi-VN")}
                                </p>
                              </div>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-700">
                                {outcomeLabel}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap">
                              {contactAttempt.note}
                            </p>
                            <p className="text-[10px] font-bold text-purple-700">Kß║┐t quß║ú: {resultLabel}</p>
                            <button
                              type="button"
                              onClick={() => setPreviewEvidenceImage(contactAttempt.evidence_image)}
                              className="block w-full cursor-zoom-in rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                              title="Bß║Ñm ─æß╗â xem ß║únh lß╗¢n ngay trong InsightFlow"
                            >
                              <img
                                src={contactAttempt.evidence_image}
                                alt={`Minh chß╗⌐ng lß║ºn li├¬n hß╗ç ${attemptNumber}`}
                                className="max-h-52 w-full rounded-lg border border-[var(--color-border)] object-contain bg-slate-50"
                              />
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={`rounded-xl border p-3 text-[11px] font-bold flex items-start gap-2 ${
                  alert.customer_contact_opened_at
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  <span className="material-symbols-outlined text-base">
                    {alert.customer_contact_opened_at ? "check_circle" : "info"}
                  </span>
                  <span>
                    {alert.customer_contact_opened_at
                      ? "─É├ú mß╗ƒ nguß╗ôn ─æß╗â li├¬n hß╗ç. H├úy bß╗ò sung ghi ch├║ v├á ß║únh minh chß╗⌐ng b├¬n d╞░ß╗¢i."
                      : "H├úy bß║Ñm ΓÇÿXem tr├¬n nß╗ün tß║úngΓÇÖ tß║íi nß╗Öi dung cß║únh b├ío tr╞░ß╗¢c."}
                  </span>
                </div>

                {alert.customer_contact_opened_at && (
                  <div className="rounded-xl border border-green-200 bg-green-50/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-green-700">Mß║½u ─æ├ú sao ch├⌐p</p>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(alert.customer_contact_template || createDefaultContactTemplate(alert.author || "Anh/Chß╗ï", alert.brand));
                          triggerToast("─É├ú sao ch├⌐p lß║íi mß║½u phß║ún hß╗ôi.");
                        }}
                        className="text-[10px] font-bold text-green-700 hover:underline"
                      >
                        Sao ch├⌐p lß║íi
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                      {alert.customer_contact_template || createDefaultContactTemplate(alert.author || "Anh/Chß╗ï", alert.brand)}
                    </p>
                  </div>
                )}

                <div className={`space-y-3 rounded-xl border border-[var(--color-border)] p-3 ${!alert.customer_contact_opened_at ? "opacity-50" : ""}`}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Minh chß╗⌐ng li├¬n hß╗ç <span className="text-red-500">*</span>
                  </p>
                  <textarea
                    value={contactEvidenceNote}
                    onChange={(event) => setContactEvidenceNote(event.target.value)}
                    disabled={!alert.customer_contact_opened_at}
                    rows={3}
                    placeholder="Ghi r├╡ ─æ├ú phß║ún hß╗ôi ß╗ƒ ─æ├óu, nß╗Öi dung trao ─æß╗òi v├á thß╗¥i ─æiß╗âm li├¬n hß╗ç..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed"
                  />
                  <div className="space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-700 hover:bg-purple-100">
                      <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                      {contactEvidenceImage ? "─Éß╗òi ß║únh minh chß╗⌐ng" : "Th├¬m ß║únh minh chß╗⌐ng"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!alert.customer_contact_opened_at}
                        onChange={(event) => handleContactEvidenceImage(event.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                    {contactEvidenceImage && (
                      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-slate-50 p-2">
                        <img src={contactEvidenceImage} alt="Minh chß╗⌐ng li├¬n hß╗ç kh├ích h├áng" className="max-h-44 w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setContactEvidenceImage(null)}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!alert.customer_contact_opened_at || !contactEvidenceNote.trim() || !contactEvidenceImage || savingContactEvidence}
                    onClick={handleSaveContactEvidence}
                    className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {savingContactEvidence ? "─Éang l╞░u..." : hasContactProof ? "Cß║¡p nhß║¡t minh chß╗⌐ng" : "L╞░u minh chß╗⌐ng"}
                  </button>
                </div>

                <fieldset disabled={!hasContactProof} className="space-y-2 disabled:opacity-50">
                  <legend className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Kß║┐t quß║ú phß║ún hß╗ôi cß╗ºa kh├ích h├áng
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CUSTOMER_RESPONSE_OPTIONS.map((option) => {
                      const selected = alert.customer_response_result === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          disabled={!hasContactProof}
                          onClick={() => handleCustomerResponseResult(option.value)}
                          aria-pressed={selected}
                          className={`rounded-xl border p-2.5 text-left text-[11px] font-bold flex items-center gap-2 transition-all disabled:cursor-not-allowed ${
                            selected ? `${option.tone} ring-2 ring-offset-1 ring-current` : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] hover:border-purple-300"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{option.icon}</span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {/* Widget: Severity Label Dropdown */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Mß╗⌐c ─æß╗Ö rß╗ºi ro th╞░╞íng hiß╗çu
                </label>
                {!editSeverityMode && isManager && (
                  <button
                    onClick={() => setEditSeverityMode(true)}
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span> Sß╗¡a nh├ún
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
                    {alert.severity === "critical" ? "Khß║⌐n cß║Ñp" :
                      alert.severity === "high" ? "Rß╗ºi ro cao" :
                        alert.severity === "medium" ? "Trung b├¼nh" : "Thß║Ñp"}
                  </span>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-[var(--color-border)]/50">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "low", label: "Thß║Ñp", class: "border-slate-500 text-slate-600", activeClass: "bg-slate-500 text-white" },
                      { key: "medium", label: "Trung b├¼nh", class: "border-yellow-500 text-yellow-600", activeClass: "bg-yellow-500 text-white" },
                      { key: "high", label: "Cao", class: "border-orange-500 text-orange-600", activeClass: "bg-orange-500 text-white" },
                      { key: "critical", label: "Khß║⌐n cß║Ñp", class: "border-red-600 text-red-600", activeClass: "bg-red-600 text-white" }
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
                    <label className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">L├╜ do thay ─æß╗òi</label>
                    <textarea
                      value={severityReason}
                      onChange={(e) => setSeverityReason(e.target.value)}
                      placeholder="Nhß║¡p l├╜ do ─æß╗òi mß╗⌐c ─æß╗Ö rß╗ºi ro..."
                      className="w-full text-xs p-2 border border-[var(--color-border)] rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-16"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSeverity}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      L╞░u
                    </button>
                    <button
                      onClick={() => {
                        setEditSeverityMode(false);
                        setSeverityReason("");
                      }}
                      className="px-4 py-2 text-[var(--color-text-secondary)] text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                    >
                      Hß╗ºy
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
                  <QuickReplyHelper
                    mentionContent={alert.text || ""}
                    customerName={alert.author || "Kh├ích h├áng"}
                    sentiment={(alert.sentiment === "positive" || alert.sentiment === "negative") ? alert.sentiment : "neutral"}
                    category="crisis"
                    onSelectReply={(text) => {
                      setDraftResponse(text);
                    }}
                  />
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
                      ─É─âng phß║ún hß╗ôi &amp; Ho├án tß║Ñt
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Widget: Status Stepper */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Trß║íng th├íi vß╗Ñ viß╗çc
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
                  { key: "new", label: "Mß╗¢i" },
                  { key: "resolving", label: "─Éang xß╗¡ l├╜" },
                  { key: "pending_approval", label: "Chß╗¥ duyß╗çt" },
                  { key: "responded", label: "─É├ú phß║ún hß╗ôi" },
                  { key: "monitoring", label: "Theo d├╡i" },
                  { key: "resolved", label: "─É├ú ─æ├│ng" }
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
                            note: `Thay ─æß╗òi trß║íng th├íi xß╗¡ l├╜ th├ánh: ${step.label}`
                          }, alert.brand);
                          setAlert({ ...alert, status: step.key });
                          triggerToast(`Chuyß╗ân trß║íng th├íi th├ánh ${step.label}!`);
                        } catch (e) {
                          triggerToast("Kh├┤ng thß╗â thay ─æß╗òi trß║íng th├íi.");
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

            {/* Widget: Internal Notes */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-base">sticky_note_2</span>
                Ghi ch├║ nß╗Öi bß╗Ö
              </h3>

              {alert.internal_notes && alert.internal_notes.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                placeholder="Nhß║¡p ghi ch├║ quan trß╗ìng cho team..."
                className="w-full text-xs p-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface-raised)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-[var(--color-text-primary)] h-20"
              />
              <button
                onClick={handleAddInternalNote}
                className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                L╞░u ghi ch├║ nß╗Öi bß╗Ö
              </button>
            </div>

            {/* Widget: Escalate Button (B├ío c├ío cß║Ñp cao) */}
            {isMine && (
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">bolt</span>
                ESCALATE ΓÇö B├ío c├ío cß║Ñp cao
              </button>
            )}

          </div>
        </div>
      </div>

      
      {previewEvidenceImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh minh chứng"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewEvidenceImage(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-slate-950 p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={previewEvidenceImage}
              alt="Ảnh minh chứng xử lý"
              className="max-h-[86vh] max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewEvidenceImage(null)}
              aria-label="Đóng ảnh minh chứng"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showReportModal && (
        <IncidentReportModal item={alert} onClose={() => setShowReportModal(false)} triggerToast={triggerToast} />
      )}
      {showMonitoringModal && alert && (
        <MonitoringTransitionModal
          onClose={() => setShowMonitoringModal(false)}
          onConfirm={async (note, durationHours) => {
            const finalStatus = durationHours > 0 ? "monitoring" : "resolved";
            await updateAlertStatus(alert.id, finalStatus, profile, {
              note,
              monitoring_duration_hours: durationHours > 0 ? durationHours : undefined
            }, alert.brand);
            setAlert({
              ...alert,
              status: finalStatus,
              monitoring_started_at: durationHours > 0 ? new Date().toISOString() : undefined,
              monitoring_duration_hours: durationHours > 0 ? durationHours : undefined,
              monitoring_initial_comments: alert.comments || 0,
              monitoring_initial_likes: alert.likes || 0,
              monitoring_initial_shares: alert.shares || 0,
            });
            triggerToast(durationHours > 0 ? "─É├ú chuyß╗ân sang theo d├╡i th├¬m!" : "─É├ú ho├án tß║Ñt!");
          }}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-green-500 animate-slide-up">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
