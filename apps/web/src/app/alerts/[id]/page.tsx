"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAlertStore, type AlertData, type CustomerContactAttempt } from "@/stores/alert.store";
import { useAuth } from "@/hooks/useAuth";
import { PlatformLogo } from "@/components/platform/PlatformLogo";
import { getScopedBrandKey } from "@/lib/brandScope";
import { fetchSingleSupabaseAlert, updateSupabaseAlertLabel, fetchCommentsForPost, type PostComment } from "@/lib/supabase";
import { supabaseClient } from "@/lib/supabaseClient";
import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { canAccessAlertQueue, canAlertBeVisibleToUser } from "@/lib/alert-visibility";

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

  const { profile, loading: authLoading } = useAuth();
  const isManager = profile?.role === "brand_manager";
  const {
    updateAlertStatus,
    createCorrectionRequest,
    fetchCorrectionRequests,
    correctionRequests,
    resolveCorrectionRequest,
  } = useAlertStore();

  const [alert, setAlert] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Left column active tab state ("content" | "history")
  const [activeLeftTab, setActiveLeftTab] = useState<"content" | "history">("content");

  // Note text input states
  const [timelineNote, setTimelineNote] = useState("");
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [newActivityDetails, setNewActivityDetails] = useState<{ comments: number; likes: number; shares: number } | null>(null);
  const [contactEvidenceNote, setContactEvidenceNote] = useState("");
  const [contactEvidenceImage, setContactEvidenceImage] = useState<string | null>(null);
  const [selectedCustomerResponseResult, setSelectedCustomerResponseResult] = useState<CustomerResponseResult | null>(null);
  const [previewEvidenceImage, setPreviewEvidenceImage] = useState<string | null>(null);
  const [isRecordingContactResult, setIsRecordingContactResult] = useState(false);

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

  const storedContactAlertId = alert?.id;
  const storedContactNote = alert?.customer_contact_note;
  const storedContactImage = alert?.customer_contact_evidence_image;
  const storedResponseResult = alert?.customer_response_result;

  useEffect(() => {
    if (!storedContactAlertId) return;
    setContactEvidenceNote(storedContactNote || "");
    setContactEvidenceImage(storedContactImage || null);
    setSelectedCustomerResponseResult(storedResponseResult || null);
  }, [storedContactAlertId, storedContactNote, storedContactImage, storedResponseResult]);

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

  const riskScore = useMemo(() => {
    if (!alert) return 0;
    return (alert as any).negativity_score ?? 0;
  }, [alert]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

    // Open immediately from the click event so browsers do not block the tab.
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

  const buildContactHistory = (
    outcomeStatus: CustomerContactAttempt["outcome_status"],
    note: string,
    evidenceImage: string,
    responseResult: CustomerResponseResult,
  ): CustomerContactAttempt[] => {
    if (!alert?.customer_contact_opened_at) {
      return alert?.customer_contact_history || [];
    }
    return [
      ...(alert.customer_contact_history || []),
      {
        opened_at: alert.customer_contact_opened_at,
        opened_by: alert.customer_contact_opened_by,
        template: alert.customer_contact_template,
        note,
        evidence_image: evidenceImage,
        response_result: responseResult,
        completed_at: new Date().toISOString(),
        outcome_status: outcomeStatus,
      },
    ];
  };

  const handleCompleteAction = async () => {
    if (!alert) return;
    const normalizedNote = contactEvidenceNote.trim();
    if (!alert.customer_contact_opened_at || !normalizedNote || !contactEvidenceImage || !selectedCustomerResponseResult) {
      triggerToast("Chưa đủ liên kết, ghi chú, ảnh minh chứng và kết quả phản hồi.");
      return;
    }

    const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find(
      (option) => option.value === selectedCustomerResponseResult
    )?.label;
    const contactEvidencePayload = {
      customer_contact_opened_at: alert.customer_contact_opened_at,
      customer_contact_opened_by: alert.customer_contact_opened_by,
      customer_contact_template: alert.customer_contact_template,
      customer_contact_note: normalizedNote,
      customer_contact_evidence_image: contactEvidenceImage,
      customer_response_result: selectedCustomerResponseResult,
    };

    setIsRecordingContactResult(true);
    try {
      if (selectedCustomerResponseResult === "no_response") {
        await updateAlertStatus(alert.id, "contact_waiting", profile, {
          note: `Đã liên hệ khách hàng nhưng chưa nhận được phản hồi.${resultLabel ? ` Kết quả: ${resultLabel}.` : ""}`,
          ...contactEvidencePayload,
          customer_contact_history: buildContactHistory("contact_waiting", normalizedNote, contactEvidenceImage, selectedCustomerResponseResult),
          reset_customer_contact: true,
        }, alert.brand);
        router.push("/alerts");
        return;
      }

      if (selectedCustomerResponseResult === "still_upset") {
        await updateAlertStatus(alert.id, "contact_failed", profile, {
          note: `Liên hệ trao đổi không thành; khách hàng vẫn bức xúc.${resultLabel ? ` Kết quả: ${resultLabel}.` : ""}`,
          ...contactEvidencePayload,
          customer_contact_history: buildContactHistory("contact_failed", normalizedNote, contactEvidenceImage, selectedCustomerResponseResult),
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
        customer_contact_history: buildContactHistory("resolved", normalizedNote, contactEvidenceImage, selectedCustomerResponseResult),
      }, alert.brand);
      router.push("/alerts");
    } catch (error) {
      triggerToast("Không thể cập nhật trạng thái liên hệ. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setIsRecordingContactResult(false);
    }
  };


  const loadAlertDetail = useCallback(async (showGlobalLoading = false) => {
    if (!id || authLoading) return;
    if (!canAccessAlertQueue(profile)) {
      setAlert(null);
      setAccessDenied(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setAccessDenied(false);

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
      if (!canAlertBeVisibleToUser(storeAlert, profile)) {
        setAlert(null);
        setAccessDenied(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }
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
        if (!canAlertBeVisibleToUser(detail, profile)) {
          setAlert(null);
          setAccessDenied(true);
          return;
        }
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
  }, [authLoading, id, profile]);

  // Real-time detail sync: Supabase Realtime (push) + manual refresh
  useEffect(() => {
    if (!id || authLoading) return;

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
  }, [authLoading, id, loadAlertDetail]);


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

  if (authLoading || loading) {
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

  if (accessDenied) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <span className="material-symbols-outlined text-red-500 text-6xl">lock</span>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Không có quyền truy cập</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Cảnh báo này không thuộc phạm vi thương hiệu hoặc không được phân công cho bạn.
        </p>
        <button
          onClick={() => router.push(profile?.role === "admin" ? "/admin" : "/alerts")}
          className="px-6 py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all text-xs"
        >
          Quay lại
        </button>
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
  const workflowStatus = getAlertWorkflowStatus(alert);
  const hasCompleteContactDraft = Boolean(
    alert.customer_contact_opened_at &&
    contactEvidenceNote.trim() &&
    contactEvidenceImage &&
    selectedCustomerResponseResult
  );

  // Sentiment Color Mapping
  let sentimentBadge = "bg-slate-50 text-slate-600 border-slate-100";
  if (alert.sentiment === "negative" || alert.sentiment === "tiêu cực") {
    sentimentBadge = "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30";
  } else if (alert.sentiment === "positive" || alert.sentiment === "tích cực") {
    sentimentBadge = "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30";
  }

  // Progress step helpers
  const statusSteps = ["new", "resolving", "resolved"];
  const statusLabels: Record<string, string> = {
    new: "Mới",
    resolving: "Đang xử lý",
    resolved: "Đã giải quyết",
  };
  const normalizedStatus = workflowStatus === "pending"
    ? "new"
    : workflowStatus === "processing" || workflowStatus === "contact_failed"
      ? "resolving"
      : "resolved";
  const currentStepIdx = Math.max(0, statusSteps.indexOf(normalizedStatus));
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
                Vụ việc #{alert.id.slice(-4)}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 flex-shrink-0 ${
                  alert.severity === "critical" ? "bg-red-600" :
                  alert.severity === "high" ? "bg-orange-500" :
                  alert.severity === "medium" ? "bg-yellow-500" : "bg-slate-500"
                }`}>
                  {riskScore} · {
                    alert.severity === "critical" ? "Khẩn cấp" :
                    alert.severity === "high" ? "Rủi ro cao" :
                    alert.severity === "medium" ? "Trung bình" : "Thấp"
                  }
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                  workflowStatus === "pending" ? "bg-blue-100 text-blue-600" :
                  workflowStatus === "contact_failed" ? "bg-red-100 text-red-700" :
                  workflowStatus === "processing" ? "bg-amber-100 text-amber-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {
                    workflowStatus === "pending" ? "Chờ xử lý" :
                    workflowStatus === "contact_failed" ? "Liên hệ không thành" :
                    alert.status === "contact_waiting" ? "Đã liên hệ – Chờ phản hồi" :
                    workflowStatus === "processing" ? "Đang xử lý" :
                    "Đã giải quyết"
                  }
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-text-muted)] font-semibold">
                <span className="material-symbols-outlined text-[11px]">person</span>
                {alert.being_resolved_by ? getResolverName(alert.being_resolved_by) : "Chưa có người phụ trách"}
                {isLockedByOthers && (
                  <span className="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5 animate-pulse">
                    ⚠️ Đang được xử lý
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => { loadAlertDetail(false); triggerToast("Đã làm mới!"); }}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs rounded-xl hover:bg-[var(--color-bg-surface-raised)] transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); triggerToast("Đã sao chép!"); }}
              className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs rounded-xl hover:bg-[var(--color-bg-surface-raised)] transition-all cursor-pointer"
            >
              Chia sẻ
            </button>

            {workflowStatus !== "resolved" && !isMine && !isLockedByOthers && (
              <button
                onClick={async () => {
                  try {
                    await updateAlertStatus(alert.id, "resolving", profile, { note: "Đã tiếp nhận xử lý" }, alert.brand);
                    setAlert({
                      ...alert,
                      status: "resolving",
                      being_resolved_by: profile?.email || null,
                      being_resolved_at: new Date().toISOString(),
                    });
                    triggerToast("Đã tiếp nhận và chuyển sang Đang xử lý.");
                  } catch (error) {
                    triggerToast("Không thể tiếp nhận: " + (error instanceof Error ? error.message : String(error)));
                  }
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Nhận xử lý
              </button>
            )}

          </div>
        </div>

        {/* Progress Bar — tiến độ xử lý */}
        <div className="px-4 md:px-8 pb-3">
          <div className="flex items-center gap-1.5">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = normalizedStatus === step;
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
              Nội dung cảnh báo
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
              Lịch sử xử lý ({alert.resolution_history?.length || 0})
              {activeLeftTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Contents */}
          {activeLeftTab === "content" && (
            <div className="space-y-6">
              {/* Widget: Real-time Monitoring Countdown & Activity Alert */}
              {(alert.status === "monitoring" || alert.monitoring_started_at) && (
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
                    <p className="text-lg md:text-xl font-black text-cyan-600 dark:text-cyan-400 font-sans tracking-tight">
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

              {/* Unified Alert & Context Card */}
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
                
                {/* Header section with platform, content type and original link */}
                <div className="flex flex-wrap justify-between items-center border-b border-[var(--color-border)]/50 pb-3 gap-3">
                  <div className="flex items-center gap-2">
                    <PlatformLogo platform={alert.source} size="sm" />
                    <div>
                      <h3 className="font-black text-xs text-[var(--color-text-primary)] uppercase leading-none">
                        {alert.content_type === "comment" ? "Bình luận cảnh báo" : "Bài viết cảnh báo"}
                      </h3>
                      <div className="flex items-center gap-3.5 mt-1">
                        <button
                          type="button"
                          onClick={handleOpenCustomerContact}
                          disabled={![alert.social_profile_url, alert.url, alert.post_url].some((url) => Boolean(url && url !== "#"))}
                          className="text-indigo-600 hover:underline text-[10px] font-bold flex items-center gap-0.5 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Xem trên {alert.source ? String(alert.source).toUpperCase() : "nền tảng gốc"}
                          <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-[var(--color-text-muted)] font-semibold">
                    <p>Đăng: {getRelativeTime(alert.created_at)}</p>
                    <p className="text-red-500 font-bold mt-0.5">Phát hiện: {getRelativeTime(alert.created_at)}</p>
                  </div>
                </div>

                {/* Nested Original Post (only if this is a comment and has original post content) */}
                {alert.content_type === "comment" && alert.post_content && alert.post_content !== alert.text && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/10 border border-[var(--color-border)]/50 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">article</span> Bài viết gốc
                      </span>
                      {alert.post_url && alert.post_url !== "#" && (
                        <a
                          href={alert.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          Truy cập bài gốc <span className="material-symbols-outlined text-[10px]">open_in_new</span>
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
                      <h4 className="font-bold text-xs text-[var(--color-text-primary)]">@{alert.author || "Ẩn danh"}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {alert.reach && alert.reach > 50000 && (
                          <span className="bg-pink-50 dark:bg-pink-950/20 text-pink-600 text-[9px] font-bold px-1.5 py-0.2 rounded-lg border border-pink-100 dark:border-pink-900/30">
                            KOL lớn
                          </span>
                        )}
                        <span className="text-[9px] text-[var(--color-text-secondary)] font-medium">
                          {(alert.reach || 0).toLocaleString("vi-VN")} lượt tiếp cận
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
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Chủ đề</span>
                    <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded">
                      {getTopicLabel(Array.isArray(alert.topic) ? alert.topic[0] : alert.topic)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Cảm xúc</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded border ${
                      alert.sentiment === "negative" ? "bg-red-50 text-red-600 border-red-100" :
                      alert.sentiment === "positive" ? "bg-green-50 text-green-600 border-green-100" :
                      "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {alert.sentiment === "negative" ? "Tiêu cực" : alert.sentiment === "positive" ? "Tích cực" : "Trung lập"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Thương hiệu</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                      {formatBrandName(alert.brand)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[9px] uppercase tracking-wider mb-0.5">Người xử lý</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {alert.being_resolved_by ? getResolverName(alert.being_resolved_by) : <span className="text-slate-400 italic">Chưa có</span>}
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

                  {/* Completed customer-contact attempts with their own proof */}
                  {alert.customer_contact_history?.map((contactAttempt, index) => {
                    const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find(
                      (option) => option.value === contactAttempt.response_result
                    )?.label || contactAttempt.response_result;
                    const outcomeLabel = contactAttempt.outcome_status === "resolved"
                      ? "Đã giải quyết"
                      : contactAttempt.outcome_status === "contact_waiting"
                        ? "Đã liên hệ – Chờ phản hồi"
                        : "Liên hệ không thành";
                    return (
                      <div key={`contact-history-${contactAttempt.completed_at}-${index}`} className="relative">
                        <div className="absolute -left-[23px] top-0.5 h-[14px] w-[14px] rounded-full border-4 border-[var(--color-bg-surface)] bg-green-500 ring-1 ring-[var(--color-border)]" />
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                            <div>
                              <p className="font-bold text-[var(--color-text-primary)]">
                                Liên hệ khách hàng lần {index + 1}
                              </p>
                              <p className="mt-0.5 text-[9px] text-[var(--color-text-muted)]">
                                {contactAttempt.opened_by ? getResolverName(contactAttempt.opened_by) : "Nhân viên xử lý"}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                              {getRelativeTime(contactAttempt.completed_at)}
                            </span>
                          </div>
                          <div className="mt-2 space-y-2 rounded-xl border border-green-200 bg-green-50/50 p-3 text-[11px] text-[var(--color-text-secondary)]">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-green-700 border border-green-200">
                                {outcomeLabel}
                              </span>
                              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-purple-700 border border-purple-200">
                                {resultLabel}
                              </span>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">Ghi chú</p>
                              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{contactAttempt.note}</p>
                            </div>
                            <div>
                              <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">Ảnh minh chứng</p>
                              <button
                                type="button"
                                onClick={() => setPreviewEvidenceImage(contactAttempt.evidence_image)}
                                className="block max-w-sm cursor-zoom-in overflow-hidden rounded-lg border border-[var(--color-border)] bg-white p-1 shadow-sm"
                                title="Bấm để xem ảnh đầy đủ"
                              >
                                <img
                                  src={contactAttempt.evidence_image}
                                  alt={`Minh chứng liên hệ lần ${index + 1}`}
                                  className="max-h-64 w-full object-contain"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          )}
        </div>

        {/* RIGHT COLUMN: simplified */}
        <div className="lg:col-span-5 space-y-5">
          <div className="sticky top-[140px] space-y-5 pb-20">



            {/* Customer contact and response result */}
            {isMine && (workflowStatus === "processing" || workflowStatus === "contact_failed") && (
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-purple-500 text-base">support_agent</span>
                    Liên hệ và ghi nhận phản hồi
                  </h3>
                  <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                    Phải mở liên kết liên hệ và chọn kết quả trước khi hoàn tất vụ việc.
                  </p>
                </div>

                {alert.customer_contact_history && alert.customer_contact_history.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Lịch sử liên hệ trước ({alert.customer_contact_history.length})
                    </p>
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {[...alert.customer_contact_history].reverse().map((contactAttempt, reverseIndex) => {
                        const attemptNumber = alert.customer_contact_history!.length - reverseIndex;
                        const resultLabel = CUSTOMER_RESPONSE_OPTIONS.find(
                          (option) => option.value === contactAttempt.response_result
                        )?.label || contactAttempt.response_result;
                        const outcomeLabel = contactAttempt.outcome_status === "resolved"
                          ? "Đã giải quyết"
                          : contactAttempt.outcome_status === "contact_waiting"
                            ? "Đã liên hệ – Chờ phản hồi"
                            : "Liên hệ không thành";
                        return (
                          <article key={`${contactAttempt.completed_at}-${attemptNumber}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-3 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-black text-[var(--color-text-primary)]">Lần liên hệ {attemptNumber}</p>
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
                            <p className="text-[10px] font-bold text-purple-700">Kết quả: {resultLabel}</p>
                            <button
                              type="button"
                              onClick={() => setPreviewEvidenceImage(contactAttempt.evidence_image)}
                              className="block w-full cursor-zoom-in rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                              title="Bấm để xem ảnh lớn ngay trong InsightFlow"
                            >
                              <img
                                src={contactAttempt.evidence_image}
                                alt={`Minh chứng lần liên hệ ${attemptNumber}`}
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
                      ? "Đã mở nguồn để liên hệ. Hãy bổ sung ghi chú và ảnh minh chứng bên dưới."
                      : "Hãy bấm ‘Xem trên nền tảng’ tại nội dung cảnh báo trước."}
                  </span>
                </div>

                {alert.customer_contact_opened_at && (
                  <div className="rounded-xl border border-green-200 bg-green-50/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-green-700">Mẫu đã sao chép</p>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(alert.customer_contact_template || createDefaultContactTemplate(alert.author || "Anh/Chị", alert.brand));
                          triggerToast("Đã sao chép lại mẫu phản hồi.");
                        }}
                        className="text-[10px] font-bold text-green-700 hover:underline"
                      >
                        Sao chép lại
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                      {alert.customer_contact_template || createDefaultContactTemplate(alert.author || "Anh/Chị", alert.brand)}
                    </p>
                  </div>
                )}

                <div className={`space-y-3 rounded-xl border border-[var(--color-border)] p-3 ${!alert.customer_contact_opened_at ? "opacity-50" : ""}`}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Minh chứng liên hệ <span className="text-red-500">*</span>
                  </p>
                  <textarea
                    value={contactEvidenceNote}
                    onChange={(event) => setContactEvidenceNote(event.target.value)}
                    disabled={!alert.customer_contact_opened_at}
                    rows={3}
                    placeholder="Ghi rõ đã phản hồi ở đâu, nội dung trao đổi và thời điểm liên hệ..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed"
                  />
                  <div className="space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-700 hover:bg-purple-100">
                      <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                      {contactEvidenceImage ? "Đổi ảnh minh chứng" : "Thêm ảnh minh chứng"}
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
                        <img src={contactEvidenceImage} alt="Minh chứng liên hệ khách hàng" className="max-h-44 w-full object-contain" />
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
                </div>

                <fieldset disabled={!alert.customer_contact_opened_at} className="space-y-2 disabled:opacity-50">
                  <legend className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Kết quả phản hồi của khách hàng
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CUSTOMER_RESPONSE_OPTIONS.map((option) => {
                      const selected = selectedCustomerResponseResult === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          disabled={!alert.customer_contact_opened_at}
                          onClick={() => setSelectedCustomerResponseResult(option.value)}
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

                {hasCompleteContactDraft && (
                  <button
                    type="button"
                    onClick={() => void handleCompleteAction()}
                    disabled={isRecordingContactResult}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-lg">task_alt</span>
                    {isRecordingContactResult ? "Đang ghi nhận..." : "Ghi nhận kết quả"}
                  </button>
                )}
              </div>
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
