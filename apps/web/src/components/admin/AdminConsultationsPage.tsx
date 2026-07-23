"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  Search,
  User,
  Mail,
  Phone,
  Building,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Check,
  Copy,
  Filter,
  AlertTriangle,
  Play,
  RefreshCw,
  KeyRound,
  XCircle,
  Globe2,
  MessageCircle,
  Music2,
  Newspaper,
  SearchCheck,
  Video,
  ChevronDown,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";

interface ConsultationRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  taxId?: string;
  industry?: string;
  need: string;
  companyEmailDomain?: string;
  keywords?: string[];
  platforms?: string[];
  configurationNotes?: string;
  consultationNotes?: string;
  consultationRequested?: boolean;
  requestSource?: string;
  approvedAccountEmail?: string;
  provisionedAccountEmail?: string;
  trialEndsAt?: string;
  provisionedTrialEndsAt?: string;
  decisionEmailStatus?: string;
  decisionEmailSentAt?: string;
  customerActivatedAt?: string;
  accountStatus?: string;
  trialCrawlRunId?: string;
  trialCrawlStatus?: string;
  trialDataStatus?: string;
  trialPublishedAt?: string;
  trialBrandSlug?: string;
  status: "pending" | "contacting" | "completed" | "unreachable" | "not_approved";
  notes?: string;
  contactPlan?: string;
  createdAt: any;
}

type StatusType = "pending" | "contacting" | "completed" | "unreachable" | "not_approved";
type EditableStatus = "" | StatusType;

interface GeneratedCredentials {
  email: string;
  trialEndsAt: string;
  trialDays?: 7 | 14;
  brandName?: string;
  brandSlug?: string;
  role?: string;
  platforms?: string[];
}

const TRIAL_PLATFORM_OPTIONS = ["Facebook", "Threads", "TikTok", "YouTube", "Review", "Tin tức"];

const statusConfig: Record<StatusType, { label: string; bg: string; text: string; border: string; icon: any }> = {
  pending: {
    label: "Chưa xử lý",
    bg: "bg-amber-500/10 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: Clock,
  },
  contacting: {
    label: "Đang liên hệ",
    bg: "bg-blue-500/10 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    icon: Play,
  },
  completed: {
    label: "Được duyệt",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  unreachable: {
    label: "Không liên lạc được",
    bg: "bg-rose-500/10 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    icon: AlertTriangle,
  },
  not_approved: {
    label: "Không được duyệt",
    bg: "bg-rose-500/10 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    icon: XCircle,
  },
};

const prebuiltOutreachPlans = [
  "Gọi điện tư vấn trực tiếp giới thiệu demo phần mềm",
  "Gửi email giới thiệu & kèm Brochure chi tiết sản phẩm",
  "Kết bạn Zalo/Viber gửi tin nhắn đề xuất và tư vấn nhanh",
  "Đặt lịch họp Zoom/Google Meet để demo hệ thống trực tiếp",
  "Gửi email báo giá cụ thể theo quy mô doanh nghiệp",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAutomaticAccountPreview(fullName: string, domain?: string) {
  const localPart = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48) || "brand.manager";
  return domain ? `${localPart}@${domain}` : "Chưa có đuôi email doanh nghiệp";
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboards unavailable
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Sao chép ${label}`}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent bg-white/70 text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand)]/25 hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)] dark:bg-white/5"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function getPlatformVisual(platform: string) {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform.includes("facebook")) {
    return { Icon: MessageCircle, iconClass: "bg-blue-500/10 text-blue-600", label: "Facebook" };
  }
  if (normalizedPlatform.includes("tiktok")) {
    return { Icon: Music2, iconClass: "bg-slate-900 text-white dark:bg-white dark:text-slate-900", label: "TikTok" };
  }
  if (normalizedPlatform.includes("youtube")) {
    return { Icon: Video, iconClass: "bg-red-500/10 text-red-600", label: "YouTube" };
  }
  if (normalizedPlatform.includes("review")) {
    return { Icon: SearchCheck, iconClass: "bg-amber-500/10 text-amber-600", label: "Review" };
  }
  if (normalizedPlatform.includes("tin") || normalizedPlatform.includes("news")) {
    return { Icon: Newspaper, iconClass: "bg-violet-500/10 text-violet-600", label: "Tin tức" };
  }
  return { Icon: Globe2, iconClass: "bg-emerald-500/10 text-emerald-600", label: platform || "Website" };
}

export default function AdminConsultationsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Form edit states (strictly state-controlled)
  const [editStatus, setEditStatus] = useState<EditableStatus>("");
  const [editNotes, setEditNotes] = useState("");
  const [editContactPlan, setEditContactPlan] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [approvalError, setApprovalError] = useState("");
  const [editingConfiguration, setEditingConfiguration] = useState(false);
  const [editCompany, setEditCompany] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editConfigurationNotes, setEditConfigurationNotes] = useState("");
  const [savingConfiguration, setSavingConfiguration] = useState(false);
  const [suggestingKeywords, setSuggestingKeywords] = useState(false);
  const [removingKeyword, setRemovingKeyword] = useState("");
  const [configurationMessage, setConfigurationMessage] = useState("");
  const [sendingAccount, setSendingAccount] = useState(false);
  const [publishingTrial, setPublishingTrial] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showAccountConfirmation, setShowAccountConfirmation] = useState(false);
  const [trialDays, setTrialDays] = useState<7 | 14>(14);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [startingTrialCrawl, setStartingTrialCrawl] = useState(false);
  const [trialCrawlError, setTrialCrawlError] = useState("");
  const [trialCrawlMessage, setTrialCrawlMessage] = useState("");
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const [detailPanelHeight, setDetailPanelHeight] = useState<number | null>(null);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/consultations", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể tải yêu cầu tư vấn.");

      const loaded = (result.consultations || []) as ConsultationRequest[];
      setRequests(loaded);
      setSelectedId((current) => current && loaded.some((item) => item.id === current) ? current : loaded[0]?.id || null);
    } catch (error: any) {
      console.error("Error loading consultations:", error);
      setLoadError(error?.message || "Không thể tải yêu cầu tư vấn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConsultations();
  }, [loadConsultations]);

  // Filter and search computation
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.phone.includes(searchTerm) ||
        req.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.taxId || "").includes(searchTerm) ||
        (req.keywords || []).some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Compute overall stats
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const contacting = requests.filter((r) => r.status === "contacting").length;
    const completed = requests.filter((r) => r.status === "completed").length;
    return { total, pending, contacting, completed };
  }, [requests]);

  // Selected item detail
  const selectedRequest = useMemo(() => {
    return requests.find((req) => req.id === selectedId) || null;
  }, [requests, selectedId]);
  const isFinalDecision = selectedRequest?.status === "completed" || selectedRequest?.status === "not_approved";
  const willApproveRequest = editStatus === "completed" && selectedRequest?.status !== "completed";
  const trialIsComplete = selectedRequest?.trialCrawlStatus === "completed";
  const trialCrawlActive = ["queued", "waiting_resource", "running", "labeling", "syncing"]
    .includes(selectedRequest?.trialCrawlStatus || "");
  const trialNeedsRecrawl = ["partial", "failed", "cancelled"]
    .includes(selectedRequest?.trialCrawlStatus || "");
  const trialIsPublished = selectedRequest?.trialDataStatus === "published" || Boolean(selectedRequest?.trialPublishedAt);
  const accountWasCreated = Boolean(selectedRequest?.provisionedAccountEmail)
    || ["created", "sent", "email_failed", "activated"].includes(selectedRequest?.accountStatus || "");
  const accountWasActivated = selectedRequest?.accountStatus === "activated" || Boolean(selectedRequest?.customerActivatedAt);
  const accountWasSent = selectedRequest?.accountStatus === "sent" || selectedRequest?.decisionEmailStatus === "sent" && Boolean(selectedRequest?.approvedAccountEmail);
  const hasValidTrialConfiguration = Boolean(
    selectedRequest?.company?.trim()
    && (selectedRequest?.keywords || []).some((keyword) => keyword.trim())
    && (selectedRequest?.platforms || []).length > 0,
  );

  // Initialize edit inputs whenever selected item changes
  useEffect(() => {
    if (selectedRequest) {
      setEditStatus(
        selectedRequest.status === "completed" || selectedRequest.status === "not_approved"
          ? selectedRequest.status
          : "",
      );
      setEditNotes(selectedRequest.notes || "");
      setEditContactPlan(selectedRequest.contactPlan || "");
      setEditCompany(selectedRequest.company || "");
      setEditKeywords((selectedRequest.keywords || []).join("\n"));
      setEditPlatforms(selectedRequest.platforms || []);
      setEditConfigurationNotes(selectedRequest.configurationNotes || "");
      setEditingConfiguration(false);
      setConfigurationMessage("");
      setGeneratedCredentials(null);
      setApprovalError("");
      setSaveSuccess(false);
      setTrialCrawlError("");
      setTrialCrawlMessage("");
      setShowAccountConfirmation(false);
      setTrialDays(14);
    }
  }, [selectedRequest]);

  // Keep the request list aligned with the detail workspace at every browser zoom level.
  useEffect(() => {
    const detailPanel = detailPanelRef.current;
    if (!detailPanel) return;

    const updateHeight = () => {
      setDetailPanelHeight(Math.ceil(detailPanel.getBoundingClientRect().height));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(detailPanel);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [loading, selectedRequest]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !selectedRequest) return;
    if (!editStatus) {
      setApprovalError("Vui lòng chọn trạng thái hiện tại trước khi cập nhật yêu cầu.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setApprovalError("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: selectedId,
          status: editStatus,
          notes: editNotes,
          contactPlan: editContactPlan,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật yêu cầu tư vấn.");
      setRequests((current) => current.map((item) => item.id === selectedId ? {
        ...item,
        status: editStatus,
        notes: editNotes.trim(),
        contactPlan: editContactPlan,
        ...(editStatus === "completed" ? { accountStatus: item.accountStatus || "not_created" } : {}),
        ...(editStatus === "not_approved" ? { decisionEmailStatus: "sent" } : {}),
      } : item));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating consultation:", error);
      setApprovalError(error?.message || "Không thể cập nhật yêu cầu tư vấn.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedId) return;
    const keywords = editKeywords.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    if (!editCompany.trim() || keywords.length === 0 || editPlatforms.length === 0) {
      setConfigurationMessage("Cần tên thương hiệu, ít nhất một từ khóa và một kênh theo dõi.");
      return;
    }

    setSavingConfiguration(true);
    setConfigurationMessage("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: selectedId,
          action: "update_trial_configuration",
          company: editCompany,
          keywords,
          platforms: editPlatforms,
          configurationNotes: editConfigurationNotes,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể lưu cấu hình trial.");
      setRequests((current) => current.map((item) => item.id === selectedId ? {
        ...item,
        company: editCompany.trim(),
        keywords,
        platforms: editPlatforms,
        configurationNotes: editConfigurationNotes.trim(),
      } : item));
      setEditingConfiguration(false);
      setConfigurationMessage("Đã lưu cấu hình trial.");
    } catch (error: any) {
      setConfigurationMessage(error?.message || "Không thể lưu cấu hình trial.");
    } finally {
      setSavingConfiguration(false);
    }
  };

  const handleSuggestKeywords = async () => {
    if (!editCompany.trim()) {
      setConfigurationMessage("Hãy nhập tên thương hiệu trước khi dùng AI gợi ý.");
      return;
    }

    setSuggestingKeywords(true);
    setConfigurationMessage("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const token = await user.getIdToken();
      const existingKeywords = editKeywords.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
      const response = await fetch("/api/admin/consultations/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          brandName: editCompany,
          industry: selectedRequest?.industry || "",
          notes: editConfigurationNotes,
          existingKeywords,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể tạo gợi ý từ khóa.");

      const combined: string[] = [];
      const seen = new Set<string>();
      [...existingKeywords, ...(Array.isArray(result.keywords) ? result.keywords : [])].forEach((item) => {
        const keyword = typeof item === "string" ? item.trim() : "";
        const key = keyword.toLocaleLowerCase("vi");
        if (!keyword || seen.has(key)) return;
        seen.add(key);
        combined.push(keyword);
      });
      const added = combined.length - existingKeywords.length;
      setEditKeywords(combined.join("\n"));
      setConfigurationMessage(added > 0
        ? `AI đã thêm ${added} từ khóa. Hãy kiểm tra, chỉnh sửa rồi bấm Lưu cấu hình.`
        : "AI không tìm thấy gợi ý mới ngoài danh sách hiện tại.");
    } catch (error: any) {
      setConfigurationMessage(error?.message || "Không thể tạo gợi ý. Bạn vẫn có thể nhập thủ công.");
    } finally {
      setSuggestingKeywords(false);
    }
  };

  const handleRemoveKeyword = async (keywordToRemove: string) => {
    if (!selectedId || !selectedRequest) return;
    const keywords = (selectedRequest.keywords || []).filter((keyword) => keyword !== keywordToRemove);
    if (keywords.length === 0) {
      setConfigurationMessage("Trial cần ít nhất một từ khóa. Hãy thêm từ khóa mới trước khi xóa từ khóa cuối cùng.");
      return;
    }

    setRemovingKeyword(keywordToRemove);
    setConfigurationMessage("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: selectedId,
          action: "update_trial_configuration",
          company: selectedRequest.company,
          keywords,
          platforms: selectedRequest.platforms || [],
          configurationNotes: selectedRequest.configurationNotes || "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể xóa từ khóa.");
      setRequests((current) => current.map((item) => item.id === selectedId ? { ...item, keywords } : item));
      setEditKeywords(keywords.join("\n"));
      setConfigurationMessage(`Đã xóa từ khóa “${keywordToRemove}”.`);
    } catch (error: any) {
      setConfigurationMessage(error?.message || "Không thể xóa từ khóa.");
    } finally {
      setRemovingKeyword("");
    }
  };

  const callTrialAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selectedId || !selectedRequest) return;
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/consultations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: selectedId, action, notes: editNotes, contactPlan: editContactPlan, ...extra }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không thể cập nhật quy trình trial.");
    return result;
  };

  const handlePublishTrialData = async () => {
    if (!selectedId) return;
    setPublishingTrial(true);
    setTrialCrawlError("");
    setTrialCrawlMessage("");
    try {
      const result = await callTrialAction("publish_trial_data");
      setRequests((current) => current.map((item) => item.id === selectedId ? {
        ...item,
        trialDataStatus: "published",
        trialPublishedAt: result.publishedAt,
        trialBrandSlug: result.brandSlug,
      } : item));
      setTrialCrawlMessage(`Đã xuất bản dữ liệu trial với brand slug ${result.brandSlug}.`);
    } catch (error: any) {
      setTrialCrawlError(error?.message || "Không thể xuất bản dữ liệu trial.");
    } finally {
      setPublishingTrial(false);
    }
  };

  const handleCreateTrialAccount = async () => {
    if (!selectedId) return;
    setCreatingAccount(true);
    setTrialCrawlError("");
    setTrialCrawlMessage("");
    try {
      const result = await callTrialAction("create_trial_account", { trialDays });
      setGeneratedCredentials(result.account as GeneratedCredentials);
      setRequests((current) => current.map((item) => item.id === selectedId ? {
        ...item,
        accountStatus: "created",
        decisionEmailStatus: "not_sent",
        provisionedAccountEmail: result.account?.email,
        provisionedTrialEndsAt: result.account?.trialEndsAt,
      } : item));
      setShowAccountConfirmation(false);
      setTrialCrawlMessage("Đã tạo tài khoản dùng thử. Chưa gửi email cho khách hàng.");
    } catch (error: any) {
      setTrialCrawlError(error?.message || "Không thể tạo tài khoản dùng thử.");
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleSendTrialActivation = async () => {
    if (!selectedId) return;
    setSendingAccount(true);
    setTrialCrawlError("");
    setTrialCrawlMessage("");
    try {
      const result = await callTrialAction("send_trial_activation");
      setRequests((current) => current.map((item) => item.id === selectedId ? {
        ...item,
        accountStatus: "sent",
        decisionEmailStatus: "sent",
        decisionEmailSentAt: result.sentAt,
        approvedAccountEmail: result.account?.email,
        trialEndsAt: result.account?.trialEndsAt,
      } : item));
      setTrialCrawlMessage("Đã gửi link kích hoạt và thiết lập mật khẩu cho khách hàng.");
    } catch (error: any) {
      setTrialCrawlError(error?.message || "Không thể gửi link kích hoạt.");
    } finally {
      setSendingAccount(false);
    }
  };

  const handleStartTrialCrawl = async () => {
    if (!selectedId || !selectedRequest) return;
    if (selectedRequest.status !== "completed") {
      setTrialCrawlError("Hãy duyệt yêu cầu trước khi bắt đầu trial crawl.");
      return;
    }
    if (!hasValidTrialConfiguration) {
      setTrialCrawlError("Hãy bổ sung tên thương hiệu, ít nhất một từ khóa và một kênh theo dõi trước khi bắt đầu.");
      return;
    }

    setStartingTrialCrawl(true);
    setTrialCrawlError("");
    setTrialCrawlMessage("");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/crawl-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ consultationId: selectedId }),
      });
      const result = await response.json();

      if (response.status === 409 && result.run?.id) {
        setRequests((current) => current.map((item) => item.id === selectedId
          ? { ...item, trialCrawlRunId: result.run.id, trialCrawlStatus: result.run.status }
          : item));
        setTrialCrawlMessage("Phiên cào trial của yêu cầu này vẫn đang hoạt động.");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Chưa thể tạo phiên cào trial.");

      setRequests((current) => current.map((item) => item.id === selectedId
        ? {
          ...item,
          trialCrawlRunId: result.runId,
          trialCrawlStatus: result.status,
          trialDataStatus: "pending",
          trialPublishedAt: undefined,
          trialBrandSlug: undefined,
        }
        : item));
      setTrialCrawlMessage("Đã xếp hàng phiên cào trial. VPS sẽ nhận job ở bước tiếp theo.");
    } catch (error: any) {
      console.error("Error starting trial crawl:", error);
      setTrialCrawlError(error?.message || "Chưa thể tạo phiên cào trial.");
    } finally {
      setStartingTrialCrawl(false);
    }
  };

  // Helper for date conversion
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Đang đồng bộ...";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 bg-gradient-to-br from-[var(--color-brand-subtle)]/20 via-transparent to-blue-500/5 p-4 md:p-6 xl:p-8">
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]/80 px-4 py-2.5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[var(--color-brand)]" />
          <span className="text-[12px] font-extrabold text-[var(--color-brand)]">Quản lý Yêu cầu Tư vấn</span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Landing Page
        </span>
      </div>

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600 dark:text-rose-400">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadConsultations()} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-white/60 px-3 py-1.5 font-bold transition hover:bg-white dark:bg-black/10 dark:hover:bg-black/20">
            <RefreshCw className="h-3.5 w-3.5" /> Thử tải lại
          </button>
        </div>
      )}

      {/* Main workspace */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
            <p className="text-[14px] text-[var(--color-text-secondary)]">Đang đồng bộ dữ liệu tư vấn...</p>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* LEFT LIST PANE */}
          <div
            className="flex min-h-[560px] min-w-0 flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]/70 p-3 shadow-sm backdrop-blur"
            style={detailPanelHeight ? { height: `${detailPanelHeight}px` } : undefined}
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-white/75 px-3 py-2 shadow-sm dark:bg-white/5">
                  <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Tổng</span>
                  <span className="text-[15px] font-extrabold text-[var(--color-text-primary)]">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 shadow-sm">
                  <span className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-300/80">Chưa xử lý</span>
                  <span className="text-[15px] font-extrabold text-amber-500">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 shadow-sm">
                  <span className="text-[11px] font-semibold text-blue-700/80 dark:text-blue-300/80">Đang gọi</span>
                  <span className="text-[15px] font-extrabold text-blue-500">{stats.contacting}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 shadow-sm">
                  <span className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80">Đã duyệt</span>
                  <span className="text-[15px] font-extrabold text-emerald-500">{stats.completed}</span>
                </div>
              </div>
            </div>

            {/* Search & filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex min-w-0 flex-1 items-center">
                <Search className="absolute left-3 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên, email, sđt, công ty..."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] py-2.5 pl-9 pr-3 text-[14px] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/10"
                />
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                  aria-expanded={showAdvancedFilters}
                  className={`inline-flex h-[42px] items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/15 ${statusFilter !== "all" ? "border-[var(--color-brand)]/45 bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] text-[var(--color-brand)] hover:border-[var(--color-brand)]/35 hover:bg-[var(--color-brand-subtle)]/45"}`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Lọc nâng cao</span>
                  {statusFilter !== "all" && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] text-white">1</span>}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                </button>

                {showAdvancedFilters && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1.5 shadow-xl">
                    <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Trạng thái</p>
                    {[
                      ["all", "Tất cả"],
                      ["pending", "Chưa xử lý"],
                      ["contacting", "Đang liên hệ"],
                      ["completed", "Yêu cầu được duyệt"],
                      ["unreachable", "Không liên lạc được"],
                      ["not_approved", "Yêu cầu không được duyệt"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(value);
                          setShowAdvancedFilters(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12px] transition hover:bg-[var(--color-brand-subtle)]/60 ${statusFilter === value ? "bg-[var(--color-brand-subtle)] font-bold text-[var(--color-brand)]" : "text-[var(--color-text-secondary)]"}`}
                      >
                        <span>{label}</span>
                        {statusFilter === value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* List entries */}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-[var(--color-text-muted)]">
                    Không tìm thấy yêu cầu tư vấn nào phù hợp.
                  </div>
                ) : (
                  filteredRequests.map((req) => {
                    const status = statusConfig[req.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const isSelected = req.id === selectedId;

                    return (
                      <button
                        key={req.id}
                        onClick={() => setSelectedId(req.id)}
                        className={`group flex w-full gap-3 rounded-xl border bg-[var(--color-bg-surface)] p-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)]/25 hover:shadow-md ${isSelected ? "border-[var(--color-brand)] bg-gradient-to-br from-[var(--color-brand-subtle)]/55 to-[var(--color-bg-surface)] hover:bg-[var(--color-brand-subtle)]/45" : "border-[var(--color-border)]"
                          }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-subtle)] text-[12px] font-extrabold text-[var(--color-brand)]">
                          {getInitials(req.fullName)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="line-clamp-1 text-[14px] font-bold text-[var(--color-text-primary)]">
                                {req.fullName}
                              </h3>
                              <p className="line-clamp-1 text-[12px] font-medium text-[var(--color-text-secondary)]">
                                {req.company || "Chưa cung cấp"}
                              </p>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.text} ${status.border}`}
                            >
                              <StatusIcon className="h-2.5 w-2.5" />
                              {status.label}
                            </span>
                          </div>

                          <p className="line-clamp-2 text-[12px] leading-5 text-[var(--color-text-muted)]">
                            {req.need}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatTimestamp(req.createdAt)}
                            </span>
                            <span className="line-clamp-1">
                              {req.industry || "Chưa có ngành"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT DETAIL PANE */}
          <div ref={detailPanelRef} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
            {selectedRequest ? (
              <div>
                {/* Details Header */}
                <div className="relative flex items-start gap-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-brand-subtle)]/50 via-[var(--color-bg-surface)] to-blue-500/5 p-5">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-brand)] via-blue-500 to-emerald-400" />
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand)] text-[17px] font-extrabold text-white shadow-md shadow-[var(--color-brand)]/20">
                    {getInitials(selectedRequest.fullName)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-1 text-[20px] font-bold text-[var(--color-text-primary)]">
                          {selectedRequest.fullName}
                        </h2>
                        <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-[var(--color-text-secondary)]">
                          <Building className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                          <span className="line-clamp-1">{selectedRequest.company || "Chưa cung cấp công ty"}</span>
                        </p>
                      </div>
                      {(() => {
                        const status = statusConfig[selectedRequest.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold shadow-sm ${status.bg} ${status.text} ${status.border}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 dark:bg-white/5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatTimestamp(selectedRequest.createdAt)}
                      </span>
                      <span className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-1 font-semibold text-[var(--color-brand)]">
                        {selectedRequest.requestSource || "Landing Page"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact and request details */}
                <div className="grid gap-4 p-5">
                  <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white/60 shadow-sm dark:bg-white/5">
                    <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-brand-subtle)]/35 px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                        <User className="h-4 w-4" />
                      </span>
                      <span className="text-[12px] font-extrabold uppercase tracking-wider text-[var(--color-brand)]">Thông tin liên hệ</span>
                    </div>
                    <div className="grid gap-x-5 px-4 sm:grid-cols-2">
                      <div className="flex items-start gap-2.5 border-b border-[var(--color-border)] py-3 sm:border-r sm:pr-4">
                        <Building className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
                        <div className="min-w-0 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Tên công ty</span>
                          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedRequest.company || "Chưa cung cấp"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 border-b border-[var(--color-border)] py-3 sm:pl-4">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Email</span>
                          <div className="flex items-center gap-1.5">
                            <p className="min-w-0 flex-1 break-all text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedRequest.email}</p>
                            <CopyButton value={selectedRequest.email} label="Email" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 border-b border-[var(--color-border)] py-3 sm:border-r sm:pr-4">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Số điện thoại</span>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedRequest.phone}</p>
                            <CopyButton value={selectedRequest.phone} label="SĐT" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 border-b border-[var(--color-border)] py-3 sm:pl-4">
                        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                        <div className="min-w-0 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Ngành hàng</span>
                          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedRequest.industry || "Chưa cung cấp"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 py-3 sm:border-r sm:pr-4">
                        <Building className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div className="min-w-0 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Mã số thuế</span>
                          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedRequest.taxId || "Chưa cung cấp"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 py-3 sm:pl-4">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                        <div className="min-w-0 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Đuôi email</span>
                          <p className="break-all text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedRequest.companyEmailDomain ? `@${selectedRequest.companyEmailDomain}` : "Chưa cung cấp"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white/60 shadow-sm dark:bg-white/5">
                    <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-brand-subtle)]/35 px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                        <Layers className="h-4 w-4" />
                      </span>
                      <span className="text-[12px] font-extrabold uppercase tracking-wider text-[var(--color-brand)]">Chi tiết nhu cầu & cấu hình</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConfiguration((value) => !value);
                          setConfigurationMessage("");
                        }}
                        className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--color-brand)]/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[var(--color-brand)] dark:bg-white/5"
                      >
                        <Pencil className="h-3.5 w-3.5" /> {editingConfiguration ? "Đóng" : "Chỉnh cấu hình"}
                      </button>
                    </div>
                    {editingConfiguration ? (
                      <div className="space-y-4 p-4">
                        <label className="block space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Tên thương hiệu</span>
                          <input value={editCompany} onChange={(event) => setEditCompany(event.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-brand)]" />
                        </label>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Kênh theo dõi</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {TRIAL_PLATFORM_OPTIONS.map((platform) => {
                              const selected = editPlatforms.includes(platform);
                              return (
                                <button
                                  key={platform}
                                  type="button"
                                  onClick={() => setEditPlatforms((current) => selected ? current.filter((item) => item !== platform) : [...current, platform])}
                                  className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition ${selected ? "border-violet-500 bg-violet-500 text-white" : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] dark:bg-white/5"}`}
                                >
                                  {platform}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <label className="block space-y-1.5">
                          <span className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                            <span>Từ khóa (mỗi dòng hoặc phân cách bằng dấu phẩy)</span>
                            <button
                              type="button"
                              onClick={() => void handleSuggestKeywords()}
                              disabled={suggestingKeywords || !editCompany.trim()}
                              className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/25 bg-violet-500/5 px-2.5 py-1.5 normal-case tracking-normal text-violet-600 transition hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-300"
                            >
                              {suggestingKeywords ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                              {suggestingKeywords ? "Đang tạo..." : "Gợi ý bằng AI"}
                            </button>
                          </span>
                          <textarea value={editKeywords} onChange={(event) => setEditKeywords(event.target.value)} rows={3} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-brand)]" />
                        </label>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Có thể sửa khi chưa chạy hoặc job còn ở hàng đợi.</p>
                          <button type="button" onClick={() => void handleSaveConfiguration()} disabled={savingConfiguration} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 text-[12px] font-bold text-white disabled:opacity-50">
                            {savingConfiguration && <Loader2 className="h-4 w-4 animate-spin" />} Lưu cấu hình
                          </button>
                        </div>
                      </div>
                    ) : <div className="space-y-4 p-4">
                      <div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          <Layers className="h-3.5 w-3.5" />
                          Kênh theo dõi
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selectedRequest.platforms || []).length > 0 ? selectedRequest.platforms?.map((platform) => {
                            const { Icon, iconClass, label } = getPlatformVisual(platform);
                            return (
                              <span key={platform} className="group inline-flex min-w-[68px] flex-col items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white/80 px-1.5 py-2 text-[10px] font-bold text-[var(--color-text-secondary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-brand)]/35 hover:shadow-md dark:bg-white/5">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClass}`}><Icon className="h-4 w-4" /></span>
                                <span className="max-w-[68px] truncate">{label}</span>
                              </span>
                            );
                          }) : <span className="text-[12px] text-[var(--color-text-muted)]">Chưa chọn kênh.</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Từ khóa quan trọng</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selectedRequest.keywords || []).length > 0 ? selectedRequest.keywords?.map((keyword) => (
                            <span key={keyword} className="inline-flex items-center gap-1 rounded-full border border-amber-500/15 bg-amber-500/10 py-1 pl-2.5 pr-1 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
                              <span>{keyword}</span>
                              <button
                                type="button"
                                onClick={() => void handleRemoveKeyword(keyword)}
                                disabled={Boolean(removingKeyword)}
                                aria-label={`Xóa từ khóa ${keyword}`}
                                title="Xóa từ khóa"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-700/70 transition hover:bg-amber-500/20 hover:text-rose-600 disabled:cursor-wait disabled:opacity-40 dark:text-amber-300/70"
                              >
                                {removingKeyword === keyword ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              </button>
                            </span>
                          )) : <span className="text-[12px] text-[var(--color-text-muted)]">Chưa nhập từ khóa.</span>}
                        </div>
                      </div>
                    </div>}
                    {configurationMessage && <p className="border-t border-[var(--color-border)] px-4 py-2 text-[11px] font-semibold text-[var(--color-text-secondary)]">{configurationMessage}</p>}
                  </section>
                </div>

                {selectedRequest.status === "completed" && (
                <section className="border-t border-[var(--color-border)] bg-white/50 p-5 dark:bg-white/[0.02]">
                  <div className="flex flex-col gap-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[13px] font-extrabold text-violet-700 dark:text-violet-300">
                        <Play className="h-4 w-4" /> Cào dữ liệu dùng thử
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-[var(--color-text-secondary)]">
                        Tạo một job trial riêng từ thương hiệu, từ khóa và kênh khách hàng đã chọn. Job này không chạy chung tiến trình production.
                      </p>
                      {selectedRequest.trialCrawlRunId && (
                        <p className="mt-2 truncate text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                          Run gần nhất: {selectedRequest.trialCrawlRunId} · {selectedRequest.trialCrawlStatus || "đang đồng bộ"}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {selectedRequest.trialCrawlRunId && (
                        <Link
                          href="/admin/crawl-operations"
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-violet-500/25 bg-white px-3 text-[12px] font-bold text-violet-700 transition hover:bg-violet-50 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-white/10"
                        >
                          Xem tiến trình
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleStartTrialCrawl()}
                        disabled={startingTrialCrawl || trialCrawlActive || accountWasCreated || selectedRequest.status !== "completed" || !hasValidTrialConfiguration}
                        title={accountWasCreated ? "Tài khoản đã gắn với brand slug hiện tại nên không thể tạo run mới." : undefined}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {startingTrialCrawl
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Play className="h-4 w-4" />}
                        {trialNeedsRecrawl ? "Cào lại" : selectedRequest.trialCrawlRunId ? "Tạo lượt cào mới" : "Bắt đầu trial crawl"}
                      </button>
                      {selectedRequest.trialCrawlRunId && trialCrawlActive && (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-400 px-4 text-[12px] font-bold text-white opacity-70"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang thu thập dữ liệu
                        </button>
                      )}
                      {trialIsComplete && !trialIsPublished && (
                        <button
                          type="button"
                          onClick={() => void handlePublishTrialData()}
                          disabled={publishingTrial}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
                        >
                          {publishingTrial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                          Xuất bản dữ liệu trial
                        </button>
                      )}
                      {trialIsPublished && !accountWasCreated && (
                        <button
                          type="button"
                          onClick={() => setShowAccountConfirmation(true)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <KeyRound className="h-4 w-4" /> Tạo tài khoản dùng thử
                        </button>
                      )}
                      {accountWasCreated && !accountWasActivated && (
                        <button
                          type="button"
                          onClick={() => void handleSendTrialActivation()}
                          disabled={sendingAccount}
                          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[12px] font-bold shadow-sm transition disabled:opacity-50 ${accountWasSent
                            ? "border border-emerald-500/30 bg-white text-emerald-700 hover:bg-emerald-50 dark:bg-white/5 dark:text-emerald-300"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {sendingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          {accountWasSent ? "Gửi lại" : "Gửi link kích hoạt"}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedRequest.status !== "completed" && (
                    <p className="mt-2 text-[11px] font-semibold text-amber-600">Cần duyệt yêu cầu trước khi đưa trial vào hàng đợi.</p>
                  )}
                  {selectedRequest.status === "completed" && !hasValidTrialConfiguration && (
                    <p className="mt-2 text-[11px] font-semibold text-amber-600">Cấu hình chưa đủ: cần tên thương hiệu, ít nhất một từ khóa và một kênh theo dõi.</p>
                  )}
                  {selectedRequest.status === "completed" && selectedRequest.trialCrawlRunId && trialCrawlActive && (
                    <p className="mt-2 text-[11px] font-semibold text-[var(--color-text-muted)]">Đang thu thập dữ liệu. Bước xuất bản và tạo tài khoản đang được khóa.</p>
                  )}
                  {trialNeedsRecrawl && (
                    <p className="mt-2 text-[11px] font-semibold text-rose-600">Phiên cào {selectedRequest.trialCrawlStatus}. Hãy kiểm tra tiến trình rồi bấm “Cào lại”.</p>
                  )}
                  {accountWasSent && selectedRequest.decisionEmailSentAt && (
                    <p className="mt-2 text-[11px] font-semibold text-emerald-600">Đã gửi lúc {formatTimestamp(selectedRequest.decisionEmailSentAt)}.</p>
                  )}
                  {accountWasActivated && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Khách đã kích hoạt{selectedRequest.customerActivatedAt ? ` lúc ${formatTimestamp(selectedRequest.customerActivatedAt)}` : ""}.</p>
                  )}
                  {trialCrawlMessage && (
                    <p className="mt-2 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">{trialCrawlMessage}</p>
                  )}
                  {trialCrawlError && (
                    <p className="mt-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{trialCrawlError}</p>
                  )}
                  {generatedCredentials && (
                    <div className="mt-4 space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 dark:bg-emerald-950/20">
                      <p className="flex items-center gap-2 text-[13px] font-extrabold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Tài khoản dùng thử đã được tạo
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-white p-3 dark:bg-black/10">
                          <p className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">Email đăng nhập</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="break-all font-sans text-[13px] font-bold text-[var(--color-text-primary)]">{generatedCredentials.email}</span>
                            <CopyButton value={generatedCredentials.email} label="email tài khoản" />
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-black/10">
                          <p className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">Brand slug / workspace</p>
                          <p className="mt-1 break-all font-sans text-[13px] font-bold text-[var(--color-text-primary)]">{generatedCredentials.brandSlug || selectedRequest.trialBrandSlug}</p>
                        </div>
                      </div>
                      <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                        Quyền mặc định: {generatedCredentials.role || "Brand Manager"}. Hạn dùng thử: {formatTimestamp(generatedCredentials.trialEndsAt)}. Chưa gửi mật khẩu; hãy dùng nút Gửi link kích hoạt.
                      </p>
                    </div>
                  )}
                  {showAccountConfirmation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="trial-account-confirm-title">
                      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 id="trial-account-confirm-title" className="text-[17px] font-extrabold text-[var(--color-text-primary)]">Xác nhận tạo tài khoản dùng thử</h3>
                            <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">Tài khoản được tạo trước; link thiết lập mật khẩu sẽ gửi ở bước riêng.</p>
                          </div>
                          <button type="button" onClick={() => setShowAccountConfirmation(false)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-raised)]" aria-label="Đóng"><X className="h-4 w-4" /></button>
                        </div>
                        <dl className="mt-4 grid gap-3 rounded-xl bg-[var(--color-bg-surface-raised)] p-4 text-[12px] sm:grid-cols-2">
                          <div><dt className="font-bold text-[var(--color-text-muted)]">Email đăng nhập</dt><dd className="mt-1 break-all font-semibold text-[var(--color-text-primary)]">{getAutomaticAccountPreview(selectedRequest.fullName, selectedRequest.companyEmailDomain)}</dd></div>
                          <div><dt className="font-bold text-[var(--color-text-muted)]">Thương hiệu / workspace</dt><dd className="mt-1 font-semibold text-[var(--color-text-primary)]">{selectedRequest.company}</dd></div>
                          <div>
                            <dt className="font-bold text-[var(--color-text-muted)]">Thời hạn dùng thử</dt>
                            <dd className="mt-1">
                              <select
                                value={trialDays}
                                onChange={(event) => setTrialDays(Number(event.target.value) as 7 | 14)}
                                disabled={creatingAccount}
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-2.5 py-2 text-[12px] font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                              >
                                <option value={7}>7 ngày</option>
                                <option value={14}>14 ngày</option>
                              </select>
                            </dd>
                          </div>
                          <div><dt className="font-bold text-[var(--color-text-muted)]">Quyền mặc định</dt><dd className="mt-1 font-semibold text-[var(--color-text-primary)]">Brand Manager</dd></div>
                          <div className="sm:col-span-2"><dt className="font-bold text-[var(--color-text-muted)]">Nền tảng có dữ liệu</dt><dd className="mt-1 font-semibold text-[var(--color-text-primary)]">{(selectedRequest.platforms || []).map((platform) => getPlatformVisual(platform).label).join(", ") || "Chưa xác định"}</dd></div>
                          <div className="sm:col-span-2"><dt className="font-bold text-[var(--color-text-muted)]">Brand slug gắn với dữ liệu</dt><dd className="mt-1 break-all font-mono font-semibold text-[var(--color-text-primary)]">{selectedRequest.trialBrandSlug || "Đang đồng bộ"}</dd></div>
                        </dl>
                        <div className="mt-5 flex justify-end gap-2">
                          <button type="button" onClick={() => setShowAccountConfirmation(false)} disabled={creatingAccount} className="h-10 rounded-lg border border-[var(--color-border)] px-4 text-[12px] font-bold text-[var(--color-text-secondary)]">Hủy</button>
                          <button type="button" onClick={() => void handleCreateTrialAccount()} disabled={creatingAccount} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-[12px] font-bold text-white disabled:opacity-50">
                            {creatingAccount && <Loader2 className="h-4 w-4 animate-spin" />} Xác nhận tạo tài khoản
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
                )}

                {/* Edit Form - Plan and Status */}
                {!isFinalDecision && (
                <form onSubmit={handleSave} className="space-y-4 border-t border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-surface-raised)]/60 to-[var(--color-brand-subtle)]/25 p-5">
                  <h3 className="flex items-center gap-2 rounded-lg border border-[var(--color-brand)]/15 bg-white/70 px-3 py-2 text-[14px] font-extrabold text-[var(--color-brand)] shadow-sm dark:bg-white/5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[var(--color-brand)]" />
                    Lập phương án liên hệ & trạng thái
                  </h3>

                  {saveSuccess && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-[13px] text-emerald-700 dark:text-emerald-400">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>
                        {editStatus === "completed"
                          ? "Đã duyệt yêu cầu. Chưa tạo hoặc gửi tài khoản."
                          : editStatus === "not_approved"
                            ? "Đã từ chối yêu cầu và gửi email thông báo!"
                            : "Cập nhật phương án & trạng thái thành công!"}
                      </span>
                    </div>
                  )}

                  {approvalError && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{approvalError}</span>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-[12px] font-bold text-[var(--color-text-secondary)]">Trạng thái hiện tại</span>
                      <select
                        value={editStatus}
                        onChange={(e) => {
                          setEditStatus(e.target.value as EditableStatus);
                          setApprovalError("");
                          setGeneratedCredentials(null);
                        }}
                        disabled={isFinalDecision}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/10"
                      >
                        {!isFinalDecision && <option value="">-- Chọn trạng thái --</option>}
                        <option value="pending">Chưa xử lý</option>
                        <option value="contacting">Đang liên hệ</option>
                        <option value="completed">Yêu cầu được duyệt</option>
                        <option value="unreachable">Không liên lạc được</option>
                        <option value="not_approved">Yêu cầu không được duyệt</option>
                      </select>
                      {isFinalDecision && <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Quyết định cuối cùng đã được lưu và không thể đổi trạng thái.</p>}
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-[12px] font-bold text-[var(--color-text-secondary)]">Chọn phương án mẫu</span>
                      <select
                        value={editContactPlan}
                        onChange={(e) => setEditContactPlan(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/10"
                      >
                        <option value="">-- Chọn phương án liên hệ --</option>
                        {prebuiltOutreachPlans.map((plan) => (
                          <option key={plan} value={plan}>
                            {plan}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {willApproveRequest && (
                    <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div>
                        <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Bước này chỉ duyệt yêu cầu
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[var(--color-text-secondary)]">
                          Duyệt không tạo tài khoản và không gửi email. Sau khi crawl hoàn tất, admin sẽ xuất bản dữ liệu, tạo tài khoản rồi gửi link kích hoạt ở hai bước riêng.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-500/15 bg-white/60 p-3 dark:bg-black/10">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Email dự kiến</p>
                          <p className="mt-1 break-all text-[13px] font-bold text-[var(--color-text-primary)]">
                            {getAutomaticAccountPreview(selectedRequest.fullName, selectedRequest.companyEmailDomain)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/15 bg-white/60 p-3 dark:bg-black/10">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Thương hiệu & thời hạn</p>
                          <p className="mt-1 text-[13px] font-bold text-[var(--color-text-primary)]">{selectedRequest.company}</p>
                          <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Chọn thời hạn 7 hoặc 14 ngày khi tạo tài khoản</p>
                        </div>
                      </div>
                      <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">
                        Nếu email dự kiến đã tồn tại, hệ thống dùng lại user đó và gắn thêm workspace trial. Hệ thống không tạo hay gửi mật khẩu cố định.
                      </p>
                    </div>
                  )}

                  <label className="block space-y-1.5 md:col-span-2">
                    <span className="text-[12px] font-bold text-[var(--color-text-secondary)]">Ghi chú cuộc gọi / Kế hoạch chi tiết</span>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ghi chú chi tiết nhu cầu hoặc kết quả sau khi trao đổi cụ thể với khách hàng..."
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/10"
                    />
                  </label>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={saving || !editStatus}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-5 text-[13px] font-bold text-white shadow-md shadow-[var(--color-brand)]/25 transition hover:-translate-y-0.5 hover:bg-[var(--color-brand)]/90 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        editStatus === "completed"
                          ? "Duyệt yêu cầu"
                          : editStatus === "not_approved"
                            ? "Từ chối & gửi email"
                            : "Cập nhật yêu cầu"
                      )}
                    </button>
                  </div>
                </form>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center p-6 text-[var(--color-text-muted)] space-y-2">
                <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)]">
                  <User className="h-8 w-8 text-[var(--color-text-muted)]" />
                </div>
                <h3 className="font-bold text-[16px] text-[var(--color-text-primary)]">Chưa chọn yêu cầu</h3>
                <p className="max-w-[280px] text-[13px] leading-relaxed">
                  Chọn một tài khoản ở danh sách bên trái để kiểm tra chi tiết và lưu thông tin liên hệ.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
