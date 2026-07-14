"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  ExternalLink,
  Filter,
  MessageSquare,
  HelpCircle,
  Users,
  AlertTriangle,
  Play
} from "lucide-react";

interface ConsultationRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  industry?: string;
  channels?: string;
  need: string;
  teamSize?: string;
  status: "pending" | "contacting" | "completed" | "unreachable";
  notes?: string;
  contactPlan?: string;
  createdAt: any;
}

type StatusType = "pending" | "contacting" | "completed" | "unreachable";

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
    label: "Đã xử lý",
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
      className="inline-flex items-center gap-1 rounded bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Đã chép" : "Sao chép"}
    </button>
  );
}

export default function AdminConsultationsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form edit states (strictly state-controlled)
  const [editStatus, setEditStatus] = useState<StatusType>("pending");
  const [editNotes, setEditNotes] = useState("");
  const [editContactPlan, setEditContactPlan] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load consultations from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "consultations"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ConsultationRequest[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            company: data.company || "",
            industry: data.industry || "",
            channels: data.channels || "",
            need: data.need || "",
            teamSize: data.teamSize || "",
            status: data.status || "pending",
            notes: data.notes || "",
            contactPlan: data.contactPlan || "",
            createdAt: data.createdAt,
          } as ConsultationRequest;
        });
        setRequests(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading consultations:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter and search computation
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.phone.includes(searchTerm) ||
        req.company.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Initialize edit inputs whenever selected item changes
  useEffect(() => {
    if (selectedRequest) {
      setEditStatus(selectedRequest.status);
      setEditNotes(selectedRequest.notes || "");
      setEditContactPlan(selectedRequest.contactPlan || "");
      setSaveSuccess(false);
    }
  }, [selectedRequest]);

  // Save updates to Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, "consultations", selectedId);
      await updateDoc(docRef, {
        status: editStatus,
        notes: editNotes.trim(),
        contactPlan: editContactPlan,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating consultation:", error);
    } finally {
      setSaving(false);
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
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-8">
      {/* Header section */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 md:p-7 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-brand)]/60 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)]">
              Admin Console
            </p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight text-[var(--color-text-primary)] md:text-[28px]">
              Yêu cầu tư vấn nhận từ Landing Page
            </h1>
            <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
              Tổng hợp, phân loại các yêu cầu hỗ trợ, nhận tư vấn và thiết lập phương án tiếp cận cụ thể.
            </p>
          </div>

          {/* Overall counters */}
          <div className="grid grid-cols-4 gap-2 md:shrink-0">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-center min-w-[70px]">
              <p className="text-[18px] font-extrabold text-[var(--color-text-primary)]">{stats.total}</p>
              <p className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">Tổng số</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-center min-w-[70px]">
              <p className="text-[18px] font-extrabold text-amber-500">{stats.pending}</p>
              <p className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">Chưa xử lý</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-center min-w-[70px]">
              <p className="text-[18px] font-extrabold text-blue-500">{stats.contacting}</p>
              <p className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">Đang gọi</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-center min-w-[70px]">
              <p className="text-[18px] font-extrabold text-emerald-500">{stats.completed}</p>
              <p className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">Đã xử lý</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main workspace */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
            <p className="text-[14px] text-[var(--color-text-secondary)]">Đang đồng bộ dữ liệu tư vấn...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* LEFT LIST PANE */}
          <div className="flex flex-col gap-4">
            {/* Search & filters */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên, email, sđt, công ty..."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] pl-9 pr-3 py-2 text-[14px] outline-none transition focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chưa xử lý</option>
                  <option value="contacting">Đang liên hệ</option>
                  <option value="completed">Đã xử lý</option>
                  <option value="unreachable">Không liên lạc được</option>
                </select>
              </div>
            </div>

            {/* List entries */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto divide-y divide-[var(--color-border)]">
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
                        className={`w-full text-left p-4 transition-colors flex flex-col gap-2 hover:bg-[var(--color-bg-surface-raised)] ${
                          isSelected ? "bg-[var(--color-brand-subtle)]/30 hover:bg-[var(--color-brand-subtle)]/40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[14px] text-[var(--color-text-primary)] line-clamp-1">
                            {req.fullName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text} ${status.border}`}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {status.label}
                          </span>
                        </div>

                        <div className="text-[12px] text-[var(--color-text-secondary)] space-y-0.5">
                          <p className="font-medium line-clamp-1">{req.company}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {req.need}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTimestamp(req.createdAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT DETAIL PANE */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm flex flex-col justify-between">
            {selectedRequest ? (
              <div className="space-y-6">
                {/* Details Header */}
                <div className="flex items-start gap-4 pb-5 border-b border-[var(--color-border)]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand)] text-white text-[16px] font-extrabold shadow-sm">
                    {getInitials(selectedRequest.fullName)}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">
                      {selectedRequest.fullName}
                    </h2>
                    <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      {selectedRequest.company}
                    </p>
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[var(--color-text-primary)] break-all select-all">
                        {selectedRequest.email}
                      </span>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <CopyButton value={selectedRequest.email} label="Email" />
                        <a
                          href={`mailto:${selectedRequest.email}`}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-[var(--color-brand)]"
                          title="Gửi Email trực tiếp"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <Phone className="h-3.5 w-3.5" />
                      Số điện thoại
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[var(--color-text-primary)] select-all">
                        {selectedRequest.phone}
                      </span>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <CopyButton value={selectedRequest.phone} label="SĐT" />
                        <a
                          href={`tel:${selectedRequest.phone}`}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-[var(--color-brand)]"
                          title="Gọi điện trực tiếp"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <Layers className="h-3.5 w-3.5" />
                      Ngành hàng
                    </span>
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      {selectedRequest.industry || "Chưa cung cấp"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <Users className="h-3.5 w-3.5" />
                      Quy mô đội ngũ
                    </span>
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      {selectedRequest.teamSize ? `${selectedRequest.teamSize} người` : "Chưa cung cấp"}
                    </p>
                  </div>

                  <div className="rounded-xl border border(--color-border) bg-[var(--color-bg-surface-raised)] p-3 space-y-1 sm:col-span-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Nhu cầu chính
                    </span>
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {selectedRequest.need}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-3 space-y-1 sm:col-span-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Kênh muốn giám sát
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedRequest.channels ? (
                        selectedRequest.channels.split(",").filter(Boolean).map((ch) => (
                          <span key={ch} className="text-[11px] px-2 py-0.5 rounded-md font-bold border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                            {ch}
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-[var(--color-text-muted)] font-medium">Chưa gán kênh nào</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Form - Plan and Status */}
                <form onSubmit={handleSave} className="space-y-4 pt-5 border-t border-[var(--color-border)]">
                  <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[var(--color-brand)]" />
                    Lập phương án liên hệ & trạng thái
                  </h3>

                  {saveSuccess && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-[13px] text-emerald-700 dark:text-emerald-400">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Cập nhật phương án & trạng thái thành công!</span>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-[12px] font-bold text-[var(--color-text-secondary)]">Trạng thái hiện tại</span>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as StatusType)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]/15"
                      >
                        <option value="pending">Chưa xử lý</option>
                        <option value="contacting">Đang liên hệ</option>
                        <option value="completed">Đã xử lý xong</option>
                        <option value="unreachable">Không liên lạc được</option>
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-[12px] font-bold text-[var(--color-text-secondary)]">Chọn phương án mẫu</span>
                      <select
                        value={editContactPlan}
                        onChange={(e) => setEditContactPlan(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]/15"
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

                  <label className="block space-y-1.5">
                    <span className="text-[12px] font-bold text-[var(--color-text-secondary)]">Ghi chú cuộc gọi / Kế hoạch chi tiết</span>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ghi chú chi tiết nhu cầu hoặc kết quả sau khi trao đổi cụ thể với khách hàng..."
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]/15"
                    />
                  </label>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/90 px-4 text-[13px] font-bold text-white shadow-sm transition disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        "Cập nhật yêu cầu"
                      )}
                    </button>
                  </div>
                </form>
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
