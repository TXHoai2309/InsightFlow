"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { filterByBrandScope } from "@/lib/brandScope";
import { auth } from "@/lib/firebase";
import { DashboardService } from "@/lib/services/dashboard";
import { supabaseClient } from "@/lib/supabaseClient";
import { useDashboardStore } from "@/stores/dashboard.store";

type Sentiment = "positive" | "negative" | "neutral" | null;
type Urgency = "none" | "low" | "medium" | "high" | "urgent" | null;
type Intent = "hot" | "warm" | "cold" | "none" | null;

interface LabelValue {
  sentiment?: Sentiment;
  topic?: string;
  relevance?: boolean | null;
  urgency?: Urgency;
  intent?: Intent;
}

interface LabelHistoryItem {
  action: string;
  by_name?: string;
  by_email?: string;
  at?: string;
  note?: string;
  from?: LabelValue;
  to?: LabelValue;
}

interface LabelRequest {
  id: string;
  status: "pending" | "approved" | "rejected" | "edited" | "cancelled";
  brand_id?: string;
  brand_name?: string;
  workspace_id?: string;
  source_id?: string;
  lead_id?: string;
  mention_id: string;
  requested_by_name: string;
  requested_by_email?: string;
  requested_by_role?: string;
  reason?: string;
  old_label: LabelValue;
  proposed_label: LabelValue;
  final_label?: LabelValue;
  mention: {
    id: string;
    entity_key?: string | null;
    post_id?: string | null;
    comment_id?: string | null;
    parent_id?: string | null;
    platform: string;
    content_type: "post" | "comment" | "reply";
    content: string;
    post_content?: string;
    comment_content?: string;
    author?: string;
    posted_at?: string;
    created_at?: string;
    url?: string;
  };
  history?: LabelHistoryItem[];
  created_at?: unknown;
  isDemo?: boolean;
}

interface LabelAuditEntry {
  id: string;
  request_id?: string;
  brand_id?: string;
  brand_name?: string;
  workspace_id?: string;
  mention_id: string;
  mention_content?: string;
  action: LabelRequest["status"] | "created" | "updated" | "note_added";
  status: LabelRequest["status"] | "pending";
  old_label: LabelValue;
  new_label: LabelValue;
  requested_by_name: string;
  requested_by_email?: string;
  requested_by_role?: string;
  reviewed_by_name?: string;
  reviewed_by_email?: string;
  changed_at: unknown;
  source?: string;
  note?: string;
  isDemo?: boolean;
}

interface HistoryFilters {
  fromDate: string;
  toDate: string;
  labelType: "all" | "sentiment" | "topic" | "relevance" | "urgency" | "intent";
  requester: string;
  status: "all" | LabelRequest["status"] | "created" | "updated" | "note_added";
}

type RequestTimeRange = "today" | "7d" | "30d" | "all";

const TOPIC_OPTIONS = [
  "quality",
  "price",
  "service",
  "staff",
  "delivery",
  "experience",
  "legal",
  "operation",
  "marketing",
  "competitor",
  "other",
];

const SENTIMENT_LABELS: Record<NonNullable<Sentiment>, string> = {
  positive: "Tích cực",
  neutral: "Trung tính",
  negative: "Tiêu cực",
};

const TOPIC_LABELS: Record<string, string> = {
  quality: "Chất lượng",
  price: "Giá",
  service: "Dịch vụ",
  staff: "Nhân viên",
  delivery: "Giao hàng",
  experience: "Trải nghiệm",
  legal: "Pháp lý",
  operation: "Vận hành",
  marketing: "Marketing",
  competitor: "Đối thủ",
  other: "Khác",
};

const URGENCY_LABELS: Record<string, string> = {
  none: "None",
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

const INTENT_LABELS: Record<string, { label: string; emoji: string }> = {
  hot: { label: "Hot", emoji: "🔥" },
  warm: { label: "Warm", emoji: "🌡️" },
  cold: { label: "Cold", emoji: "🧊" },
  none: { label: "None", emoji: "➖" },
};

function normalizeLabel(value: unknown, fallback: LabelValue): LabelValue {
  if (!value || typeof value !== "object") return fallback;
  const row = value as Partial<LabelValue> & { topic?: string | string[]; topics?: string[] };
  const legacyUrgencyMap: Record<string, NonNullable<Urgency>> = {
    normal: "low",
    notable: "medium",
    crisis: "urgent",
  };
  const rawUrgency = typeof row.urgency === "string" ? row.urgency : "";
  const normalizedUrgency =
    rawUrgency in legacyUrgencyMap ? legacyUrgencyMap[rawUrgency] : row.urgency;
  const topic = Array.isArray(row.topic)
    ? row.topic[0]
    : typeof row.topic === "string"
      ? row.topic
      : Array.isArray(row.topics)
        ? row.topics[0]
        : fallback.topic;
  return {
    sentiment:
      row.sentiment === "positive" || row.sentiment === "negative" || row.sentiment === "neutral"
        ? row.sentiment
        : fallback.sentiment,
    topic: typeof topic === "string" ? topic : fallback.topic,
    relevance: typeof row.relevance === "boolean" ? row.relevance : fallback.relevance,
    urgency: normalizedUrgency || fallback.urgency,
    intent: row.intent || fallback.intent,
  };
}

function normalizeRequestStatus(value: unknown): LabelRequest["status"] {
  const status = String(value || "pending").toLowerCase();
  if (status === "approved" || status === "rejected" || status === "edited" || status === "cancelled") {
    return status;
  }
  return "pending";
}

function normalizeContentType(value: unknown): LabelRequest["mention"]["content_type"] {
  const sourceType = String(value || "").toLowerCase();
  if (sourceType === "comment" || sourceType === "reply") return sourceType;
  return "post";
}

function formatDate(value: unknown) {
  if (!value) return "Chưa rõ thời gian";
  const maybeTimestamp = value as { toDate?: () => Date };
  const date = typeof maybeTimestamp.toDate === "function" ? maybeTimestamp.toDate() : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toDateValue(value: unknown): Date | null {
  if (!value) return null;
  const maybeTimestamp = value as { toDate?: () => Date };
  const date = typeof maybeTimestamp.toDate === "function" ? maybeTimestamp.toDate() : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRequestDate(request: LabelRequest): Date | null {
  return toDateValue(request.created_at || request.history?.[0]?.at);
}

function isWithinRequestTimeRange(request: LabelRequest, range: RequestTimeRange) {
  if (range === "all") return true;
  const date = getRequestDate(request);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }

  const days = range === "7d" ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  return date >= start && date <= now;
}

function compareRequests(a: LabelRequest, b: LabelRequest) {
  if (a.status === "pending" && b.status !== "pending") return -1;
  if (a.status !== "pending" && b.status === "pending") return 1;
  return (getRequestDate(b)?.getTime() || 0) - (getRequestDate(a)?.getTime() || 0);
}

function hasLabelTypeChanged(oldLabel: LabelValue, newLabel: LabelValue, labelType: HistoryFilters["labelType"]) {
  if (labelType === "all") return true;
  return JSON.stringify(oldLabel[labelType]) !== JSON.stringify(newLabel[labelType]);
}

function requestToAuditEntries(request: LabelRequest): LabelAuditEntry[] {
  const history = request.history || [];
  if (history.length === 0) {
    return [
      {
        id: `${request.id}-created`,
        request_id: request.id,
        brand_id: request.brand_id,
        brand_name: request.brand_name,
        workspace_id: request.workspace_id || request.brand_id || request.brand_name,
        mention_id: request.mention_id,
        mention_content: request.mention.content,
        action: "created",
        status: request.status,
        old_label: request.old_label,
        new_label: request.proposed_label,
        requested_by_name: request.requested_by_name,
        requested_by_email: request.requested_by_email,
        requested_by_role: request.requested_by_role,
        changed_at: request.created_at,
        source: "request",
        note: request.reason,
        isDemo: request.isDemo,
      },
    ];
  }

  return history.map((item, index) => ({
    id: `${request.id}-history-${index}`,
    request_id: request.id,
    brand_id: request.brand_id,
    brand_name: request.brand_name,
    workspace_id: request.workspace_id || request.brand_id || request.brand_name,
    mention_id: request.mention_id,
    mention_content: request.mention.content,
    action: item.action as LabelAuditEntry["action"],
    status: request.status,
    old_label: item.from || request.old_label,
    new_label: item.to || request.final_label || request.proposed_label,
    requested_by_name: request.requested_by_name,
    requested_by_email: request.requested_by_email,
    requested_by_role: request.requested_by_role,
    reviewed_by_name: item.by_name,
    reviewed_by_email: item.by_email,
    changed_at: item.at || request.created_at,
    source: "request_history",
    note: item.note || request.reason,
    isDemo: request.isDemo,
  }));
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  thread: "Threads",
  google_maps: "Google Maps",
  unknown: "Không rõ nguồn",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: "Bài viết",
  comment: "Bình luận",
  reply: "Phản hồi",
};

function sentimentTone(sentiment: Sentiment) {
  if (sentiment === "negative")
    return {
      text: "text-[var(--color-error)]",
      bg: "bg-[var(--color-error-subtle)]",
      border: "border-[var(--color-error)]/30",
      solidBg: "bg-[var(--color-error)]",
    };
  if (sentiment === "positive")
    return {
      text: "text-[var(--color-success)]",
      bg: "bg-[var(--color-success-subtle)]",
      border: "border-[var(--color-success)]/30",
      solidBg: "bg-[var(--color-success)]",
    };
  return {
    text: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-subtle)]",
    border: "border-[var(--color-info)]/30",
    solidBg: "bg-[var(--color-info)]",
  };
}

function LabelPill({ label, size = "md" }: { label: LabelValue; size?: "sm" | "md" }) {
  const tone = sentimentTone(label.sentiment as Sentiment);
  const padding = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs";
  return (
    <div className="flex flex-wrap gap-1.5">
      {label.sentiment && (
        <span className={`rounded-full font-semibold tracking-wide ${padding} ${tone.bg} ${tone.text}`}>
          {SENTIMENT_LABELS[label.sentiment as NonNullable<Sentiment>] || label.sentiment}
        </span>
      )}
      {label.topic && (
        <span
          className={`rounded-full border font-semibold tracking-wide text-[var(--color-text-secondary)] border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] ${padding}`}
        >
          {TOPIC_LABELS[label.topic] || label.topic}
        </span>
      )}
      {label.relevance !== undefined && label.relevance !== null && (
        <span
          className={`rounded-full border font-semibold tracking-wide text-[var(--color-text-secondary)] border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] ${padding}`}
        >
          {label.relevance ? "Có liên quan" : "Không liên quan"}
        </span>
      )}
      {label.urgency && (
        <span
          className={`rounded-full border font-semibold tracking-wide text-[var(--color-text-secondary)] border-[var(--color-border)] bg-[var(--color-warning-subtle)] ${padding}`}
        >
          {URGENCY_LABELS[label.urgency] || label.urgency}
        </span>
      )}
      {label.intent && (
        <span
          className={`rounded-full border font-semibold tracking-wide text-[var(--color-text-secondary)] border-[var(--color-border)] bg-[var(--color-info-subtle)] ${padding}`}
        >
          {INTENT_LABELS[label.intent]?.emoji} {INTENT_LABELS[label.intent]?.label || label.intent}
        </span>
      )}
    </div>
  );
}

/** Signature element: an editorial "track-changes" strip that reads left-to-right
 *  like a proofreader's redline — cũ → đề xuất → cuối cùng — the same motion a
 *  Brand Manager makes when deciding whether to accept an edit. */
function LabelDiffStrip({
  oldLabel,
  proposedLabel,
  finalLabel,
}: {
  oldLabel: LabelValue;
  proposedLabel: LabelValue;
  finalLabel: LabelValue;
}) {
  const stops: { key: string; caption: string; value: LabelValue; emphasis?: boolean }[] = [
    { key: "old", caption: "Nhãn cũ", value: oldLabel },
    { key: "proposed", caption: "Nhân viên đề xuất", value: proposedLabel },
    { key: "final", caption: "Nhãn cuối cùng", value: finalLabel, emphasis: true },
  ];

  return (
    <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
      {stops.map((stop, index) => (
        <div key={stop.key} className="flex flex-1 items-stretch">
          <div
            className={`flex flex-1 flex-col gap-3 rounded-2xl border px-5 py-4 ${stop.emphasis
              ? "border-[var(--color-brand)]/40 bg-[var(--color-brand-subtle)]/30"
              : "border-[var(--color-border)] bg-[var(--color-bg-surface)]"
              }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {String(index + 1).padStart(2, "0")} · {stop.caption}
            </p>
            <LabelPill label={stop.value} />
          </div>
          {index < stops.length - 1 && (
            <div className="hidden shrink-0 items-center px-2 sm:flex">
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" className="text-[var(--color-text-muted)]">
                <path d="M1 8H20M20 8L14 2M20 8L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BrandLabelHistoryPanel({
  entries,
  filters,
  requesterOptions,
  statusLabels,
  onFiltersChange,
}: {
  entries: LabelAuditEntry[];
  filters: HistoryFilters;
  requesterOptions: string[];
  statusLabels: Record<string, string>;
  onFiltersChange: (filters: HistoryFilters) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4">
        <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Lịch sử chỉnh sửa nhãn theo thương hiệu
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Tổng hợp {entries.length} bản ghi từ request của thương hiệu hiện tại.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onFiltersChange({
                fromDate: "",
                toDate: "",
                labelType: "all",
                requester: "all",
                status: "all",
              })
            }
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-surface)]"
          >
            Xóa lọc
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Từ ngày</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => onFiltersChange({ ...filters, fromDate: event.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Đến ngày</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => onFiltersChange({ ...filters, toDate: event.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Loại nhãn</span>
            <select
              value={filters.labelType}
              onChange={(event) =>
                onFiltersChange({ ...filters, labelType: event.target.value as HistoryFilters["labelType"] })
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="sentiment">Sắc thái</option>
              <option value="topic">Chủ đề</option>
              <option value="relevance">Liên quan</option>
              <option value="urgency">Urgency</option>
              <option value="intent">Intent</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Người yêu cầu</span>
            <select
              value={filters.requester}
              onChange={(event) => onFiltersChange({ ...filters, requester: event.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
            >
              <option value="all">Tất cả</option>
              {requesterOptions.map((requester) => (
                <option key={requester} value={requester}>
                  {requester}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Trạng thái</span>
            <select
              value={filters.status}
              onChange={(event) =>
                onFiltersChange({ ...filters, status: event.target.value as HistoryFilters["status"] })
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="created">Tạo yêu cầu</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="edited">Đã sửa & duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="cancelled">Đã hủy</option>
              <option value="updated">Đã chỉnh yêu cầu</option>
            </select>
          </label>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          Không có lịch sử chỉnh sửa nhãn phù hợp với bộ lọc.
        </p>
      ) : (
        entries.map((item, index) => {
          const isLast = index === entries.length - 1;
          return (
            <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                {!isLast && <span className="w-px flex-1 bg-[var(--color-border)]" />}
              </div>
              <div className="flex-1 rounded-xl border border-[var(--color-border)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[var(--color-text-primary)]">
                        {statusLabels[item.action] || item.action}
                      </p>
                      <span className="rounded-full bg-[var(--color-bg-surface-raised)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                        {statusLabels[item.status] || item.status}
                      </span>
                      {item.isDemo && (
                        <span className="rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-brand)]">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      Người yêu cầu: {item.requested_by_name}
                    </p>
                    {item.reviewed_by_name && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Người xử lý: {item.reviewed_by_name}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {formatDate(item.changed_at)}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                  #{item.mention_id} · {item.mention_content || "Không có nội dung mention"}
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Nhãn cũ
                    </p>
                    <LabelPill label={item.old_label} size="sm" />
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Nhãn mới
                    </p>
                    <LabelPill label={item.new_label} size="sm" />
                  </div>
                </div>

                {item.note && (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function LabelRequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LabelRequest[]>([]);
  const [auditEntries, setAuditEntries] = useState<LabelAuditEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"detail" | "compare" | "history">("detail");
  const [requestTimeRange, setRequestTimeRange] = useState<RequestTimeRange>("today");
  const [draftLabel, setDraftLabel] = useState<LabelValue>({ sentiment: "neutral", topic: "other" });
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({
    fromDate: "",
    toDate: "",
    labelType: "all",
    requester: "all",
    status: "all",
  });
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadStaff() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const response = await fetch("/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const names = data.data?.map((s: any) => s.displayName || s.email).filter(Boolean) || [];
        if (active) {
          setStaffNames(names);
        }
      } catch (error) {
        console.error("Failed to load staff:", error);
      }
    }
    loadStaff();
    return () => {
      active = false;
    };
  }, [auth.currentUser]);

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      try {
        const { requests: rawRequests, history: rawHistory } =
          await DashboardService.fetchLabelChangeRequests(
            profile?.brandName || profile?.brandId || undefined,
          );

        const mapLabelField = (raw: unknown, fallback: LabelValue): LabelValue => {
          if (!raw || typeof raw !== "object") return fallback;
          const r = raw as Record<string, unknown>;
          const rawTopic = Array.isArray(r.topic) ? r.topic[0] : r.topic;
          return {
            sentiment: (r.sentiment as Sentiment) ?? fallback.sentiment ?? null,
            topic: (rawTopic as string) ?? fallback.topic ?? "other",
            relevance: r.relevance !== undefined ? (r.relevance as boolean | null) : (fallback.relevance ?? null),
            urgency: (r.urgency as Urgency) ?? fallback.urgency ?? null,
            intent: (r.intent as Intent) ?? fallback.intent ?? null,
          };
        };

        const rows: LabelRequest[] = rawRequests.map((data) => {
          const id = String(data.id || "");
          const fallbackLabel: LabelValue = { sentiment: "neutral", topic: "other", relevance: null, urgency: null, intent: null };
          const oldLabel = mapLabelField(
            data.old_label || data.current_labels || data.current_label,
            fallbackLabel,
          );
          const proposedLabel = mapLabelField(
            data.proposed_label || data.requested_labels || data.requested_label,
            oldLabel,
          );
          const mentionRaw = (data.mention ?? {}) as Record<string, unknown>;
          const content = String(
            mentionRaw.content ||
            data.content_preview ||
            data.mention_content ||
            data.content ||
            "",
          );
          const contentType = normalizeContentType(mentionRaw.content_type || data.source_type);

          return {
            id,
            status: normalizeRequestStatus(data.status),
            brand_id: String(data.brand_id || data.workspace_id || ""),
            brand_name: String(data.brand_name || data.workspace_name || data.workspace_id || ""),
            workspace_id: String(data.workspace_id || data.brand_id || data.brand_name || data.workspace_name || ""),
            source_id: data.source_id ? String(data.source_id) : undefined,
            lead_id: data.lead_id ? String(data.lead_id) : undefined,
            mention_id: String(data.mention_id || data.source_id || mentionRaw.id || id),
            requested_by_name: String(data.requested_by_name || data.requested_by_email || "Nhân viên"),
            requested_by_email: data.requested_by_email ? String(data.requested_by_email) : undefined,
            requested_by_role: data.requested_by_role ? String(data.requested_by_role) : undefined,
            reason: data.reason || data.reason_note || data.reason_code
              ? String(data.reason || data.reason_note || data.reason_code)
              : undefined,
            old_label: oldLabel,
            proposed_label: proposedLabel,
            final_label: data.final_label ? mapLabelField(data.final_label, proposedLabel) : undefined,
            mention: {
              id: String(mentionRaw.id || data.mention_id || data.source_id || id),
              entity_key: (mentionRaw.entity_key || data.mention_id || data.source_id)
                ? String(mentionRaw.entity_key || data.mention_id || data.source_id)
                : null,
              post_id: (mentionRaw.post_id || data.post_id)
                ? String(mentionRaw.post_id || data.post_id)
                : null,
              comment_id: (mentionRaw.comment_id || data.comment_id)
                ? String(mentionRaw.comment_id || data.comment_id)
                : null,
              parent_id: (mentionRaw.parent_id as string) || null,
              platform: String(mentionRaw.platform || data.platform || data.source || "unknown"),
              content_type: contentType,
              content,
              post_content: String(mentionRaw.post_content || (contentType === "post" ? content : "")),
              comment_content: String(mentionRaw.comment_content || (contentType !== "post" ? content : "")),
              author: String(mentionRaw.author || data.author || ""),
              posted_at: String(mentionRaw.posted_at || mentionRaw.created_at || ""),
              url: String(mentionRaw.url || data.source_url || data.url || ""),
            },
            history: Array.isArray(data.history) ? data.history : [],
            created_at: data.requested_at || data.created_at,
          };
        });

        const scopedRows = filterByBrandScope(rows, profile);

        const persistedAuditEntries: LabelAuditEntry[] = rawHistory.map((data) => {
          const fallbackLabel: LabelValue = { sentiment: "neutral", topic: "other" };
          const mapLbl = (raw: unknown) => {
            if (!raw || typeof raw !== "object") return fallbackLabel;
            const r = raw as Record<string, unknown>;
            const rawTopic = Array.isArray(r.topic) ? r.topic[0] : r.topic;
            return {
              sentiment: (r.sentiment as Sentiment) ?? fallbackLabel.sentiment,
              topic: (rawTopic as string) ?? fallbackLabel.topic,
              relevance: r.relevance !== undefined ? (r.relevance as boolean | null) : null,
              urgency: (r.urgency as Urgency) ?? null,
              intent: (r.intent as Intent) ?? null,
            };
          };
          const oldLbl = mapLbl(data.old_label || data.current_labels);
          const newLbl = mapLbl(data.new_label || data.requested_labels);
          return {
            id: String(data.id || `${data.request_id}-${data.action}-${data.created_at}`),
            request_id: String(data.request_id || ""),
            brand_id: String(data.brand_id || data.workspace_id || ""),
            brand_name: String(data.brand_name || data.workspace_id || ""),
            workspace_id: String(data.workspace_id || data.brand_id || data.brand_name || ""),
            mention_id: String(data.mention_id || ""),
            mention_content: data.mention_content || data.content_preview
              ? String(data.mention_content || data.content_preview)
              : undefined,
            action: (data.action || data.status || "edited") as LabelAuditEntry["action"],
            status: normalizeRequestStatus(data.status || data.action),
            old_label: oldLbl,
            new_label: newLbl,
            requested_by_name: String(
              data.requested_by_name || data.changed_by_name || data.requested_by_email || "Nhân viên",
            ),
            requested_by_email: data.requested_by_email ? String(data.requested_by_email) : undefined,
            requested_by_role: data.requested_by_role ? String(data.requested_by_role) : undefined,
            reviewed_by_name: data.reviewed_by_name || data.changed_by_name
              ? String(data.reviewed_by_name || data.changed_by_name)
              : undefined,
            reviewed_by_email: data.reviewed_by_email ? String(data.reviewed_by_email) : undefined,
            changed_at: data.changed_at || data.created_at,
            source: String(data.source || "label_change_history"),
            note: data.note || data.reason_note || data.cancel_reason
              ? String(data.note || data.reason_note || data.cancel_reason)
              : undefined,
          } satisfies LabelAuditEntry;
        }).filter((item) => filterByBrandScope([item], profile).length > 0);

        if (active) {
          setRequests(scopedRows);
          setSelectedId((current) =>
            current && scopedRows.some((item) => item.id === current)
              ? current
              : scopedRows[0]?.id || null,
          );
          setAuditEntries([
            ...persistedAuditEntries,
            ...scopedRows.flatMap(requestToAuditEntries),
          ]);
        }
      } catch (error) {
        console.error("Failed to load label requests:", error);
        if (active) {
          setRequests([]);
          setSelectedId(null);
          setAuditEntries([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRequests();
    return () => {
      active = false;
    };
  }, [profile?.brandId, profile?.brandName, reloadToken]);

  useEffect(() => {
    const refresh = () => setReloadToken((current) => current + 1);
    const interval = window.setInterval(refresh, 8000);
    let channel: ReturnType<NonNullable<typeof supabaseClient>["channel"]> | null = null;

    if (supabaseClient) {
      const ch = supabaseClient.channel(`label-requests-review-${profile?.brandId || "all"}`);
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "label_change_requests" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "label_change_history" },
        refresh,
      )
      .subscribe();
      channel = ch;
    }

    return () => {
      window.clearInterval(interval);
      if (channel && supabaseClient) supabaseClient.removeChannel(channel);
    };
  }, [profile?.brandId]);

  const displayedRequests = useMemo(
    () => requests.filter((item) => isWithinRequestTimeRange(item, requestTimeRange)).sort(compareRequests),
    [requests, requestTimeRange],
  );

  useEffect(() => {
    if (loading) return;
    if (displayedRequests.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!selectedId || !displayedRequests.some((item) => item.id === selectedId)) {
      setSelectedId(displayedRequests[0].id);
    }
  }, [displayedRequests, loading, selectedId]);

  const selectedRequest = useMemo(
    () => displayedRequests.find((item) => item.id === selectedId) || displayedRequests[0],
    [displayedRequests, selectedId],
  );

  useEffect(() => {
    if (selectedRequest) {
      setDraftLabel(selectedRequest.final_label || selectedRequest.proposed_label);
    }
  }, [selectedRequest]);

  const pendingCount = requests.filter((item) => item.status === "pending").length;
  const canApproveSelectedRequest =
    selectedRequest &&
    (selectedRequest.status === "pending" ||
      selectedRequest.status === "approved" ||
      selectedRequest.status === "edited");
  const canRejectSelectedRequest = selectedRequest?.status === "pending";
  const requesterOptions = useMemo(
    () => Array.from(new Set([...staffNames, ...auditEntries.map((item) => item.requested_by_name).filter(Boolean)])).sort(),
    [auditEntries, staffNames],
  );
  const filteredAuditEntries = useMemo(() => {
    return auditEntries
      .filter((item) => {
        const changedDate = toDateValue(item.changed_at);
        if (historyFilters.fromDate) {
          const fromTime = new Date(`${historyFilters.fromDate}T00:00:00`).getTime();
          if (!changedDate || changedDate.getTime() < fromTime) return false;
        }
        if (historyFilters.toDate) {
          const toTime = new Date(`${historyFilters.toDate}T23:59:59.999`).getTime();
          if (!changedDate || changedDate.getTime() > toTime) return false;
        }
        if (historyFilters.requester !== "all" && item.requested_by_name !== historyFilters.requester) return false;
        if (historyFilters.status !== "all" && item.status !== historyFilters.status && item.action !== historyFilters.status) return false;
        if (!hasLabelTypeChanged(item.old_label, item.new_label, historyFilters.labelType)) return false;
        return true;
      })
      .sort((a, b) => (toDateValue(b.changed_at)?.getTime() || 0) - (toDateValue(a.changed_at)?.getTime() || 0));
  }, [auditEntries, historyFilters]);

  const updateRequestStatus = async (status: LabelRequest["status"], finalLabel = draftLabel) => {
    if (!selectedRequest) return;
    setSaving(true);
    const changedAt = new Date().toISOString();
    const resolvedStatus: LabelRequest["status"] = status === "edited" ? "approved" : status;

    const nextHistory = [
      ...(selectedRequest.history || []),
      {
        action: resolvedStatus,
        by_name: profile?.displayName || profile?.email || "Brand Manager",
        by_email: profile?.email,
        at: changedAt,
        from: selectedRequest.old_label,
        to: finalLabel,
      },
    ];

    const nextAuditEntry: LabelAuditEntry = {
      id: `${selectedRequest.id}-${resolvedStatus}-${Date.now()}`,
      request_id: selectedRequest.id,
      brand_id: selectedRequest.brand_id || profile?.brandId,
      brand_name: selectedRequest.brand_name || profile?.brandName,
      mention_id: selectedRequest.mention_id,
      mention_content: selectedRequest.mention.content,
      action: resolvedStatus,
      status: resolvedStatus,
      old_label: selectedRequest.old_label,
      new_label: finalLabel,
      requested_by_name: selectedRequest.requested_by_name,
      requested_by_email: selectedRequest.requested_by_email,
      requested_by_role: selectedRequest.requested_by_role,
      reviewed_by_name: profile?.displayName || profile?.email || "Brand Manager",
      reviewed_by_email: profile?.email,
      changed_at: changedAt,
      source: "brand_manager_review",
      note: selectedRequest.reason,
      isDemo: selectedRequest.isDemo,
    };

    try {
      if (!selectedRequest.isDemo) {
        if (resolvedStatus === "approved") {
          await DashboardService.approveLabelChangeRequest(
            selectedRequest.id,
            "approved",
            finalLabel as Record<string, unknown>,
            {
              mentionId: selectedRequest.mention_id,
              platform: selectedRequest.mention.platform,
              contentType: selectedRequest.mention.content_type,
              parentId: selectedRequest.mention.parent_id,
              entityKey: selectedRequest.mention.entity_key || selectedRequest.mention_id,
              postId: selectedRequest.mention.post_id,
              commentId: selectedRequest.mention.comment_id,
            },
            selectedRequest.lead_id || selectedRequest.source_id || selectedRequest.mention_id,
            {
              uid: profile?.uid || "",
              displayName: profile?.displayName,
              email: profile?.email,
            },
            selectedRequest.old_label as Record<string, unknown>,
            nextHistory,
          );

          useDashboardStore.getState().approveLabelChangeRequestInStore(
            selectedRequest.id,
            finalLabel as Record<string, unknown>,
            "approved",
            nextHistory,
          );
        } else {
          // reject / cancel — uses Supabase
          await DashboardService.rejectLabelChangeRequest(
            selectedRequest.id,
            resolvedStatus as "rejected" | "cancelled",
            {
              uid: profile?.uid || "",
              displayName: profile?.displayName,
              email: profile?.email,
            },
            {
              reason: selectedRequest.reason,
              finalLabel: finalLabel as Record<string, unknown>,
              oldLabel: selectedRequest.old_label as Record<string, unknown>,
              mentionId: selectedRequest.mention_id,
              nextHistory,
            },
          );

          useDashboardStore.getState().setLabelChangeRequests(
            useDashboardStore.getState().labelChangeRequests.map((req: any) =>
              req.id === selectedRequest.id
                ? { ...req, status: resolvedStatus as any, history: nextHistory }
                : req
            )
          );
          useDashboardStore.getState().setLeads(
            useDashboardStore.getState().leads.map((lead: any) =>
              lead.id === selectedRequest.id ||
                lead.id === selectedRequest.mention_id ||
                lead.pending_label_request_id === selectedRequest.id
                ? {
                  ...lead,
                  label_correction_status: "none",
                  pending_label_request_id: undefined,
                }
                : lead
            )
          );
        }
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? { ...item, status: resolvedStatus, final_label: finalLabel, history: nextHistory }
            : item,
        ),
      );
      setAuditEntries((current) => [nextAuditEntry, ...current]);
    } catch (error) {
      console.error("Failed to update label request:", error);
    } finally {
      setSaving(false);
    }
  };

  const STATUS_LABELS: Record<LabelRequest["status"], string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    edited: "Đã sửa & duyệt",
    cancelled: "Đã hủy",
  };
  const HISTORY_STATUS_LABELS: Record<string, string> = {
    ...STATUS_LABELS,
    created: "Tạo yêu cầu",
    updated: "Đã chỉnh yêu cầu",
    note_added: "Ghi chú",
  };

  return (
    <div className="p-4 md:p-8">


      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand)]">
            Quản lý thương hiệu · Bàn duyệt nhãn
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-[2.5rem]">
            Duyệt yêu cầu gắn lại nhãn
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Xem các đề xuất sửa nhãn từ nhân viên, so sánh nhãn cũ với nhãn mới, duyệt hoặc chỉnh lại
            nhãn trước khi đẩy xuống dữ liệu sử dụng.
          </p>
        </div>
        <div className="relative shrink-0 self-start rounded-2xl border border-[var(--color-warning)]/40 bg-[var(--color-warning-subtle)] px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Chờ duyệt
          </p>
          <p className="mt-0.5 text-3xl font-semibold text-[var(--color-warning)]">
            {pendingCount}
          </p>
        </div>
      </div>
      <div data-tour="label-request-workbench" className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Request list */}
        <section data-tour="label-request-list" className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div className="border-b border-[var(--color-border)] px-4 py-3.5">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Danh sách yêu cầu
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {loading ? "Đang tải…" : `${displayedRequests.length}/${requests.length} yêu cầu`}
            </p>
            <label className="mt-3 block">
              <span className="sr-only">Lọc thời gian</span>
              <select
                value={requestTimeRange}
                onChange={(event) => setRequestTimeRange(event.target.value as RequestTimeRange)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] outline-none"
              >
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày</option>
                <option value="30d">30 ngày</option>
                <option value="all">Tất cả</option>
              </select>
            </label>
          </div>
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {displayedRequests.map((item) => {
              const tone = sentimentTone(item.old_label.sentiment ?? null);
              const isActive = selectedRequest?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setMode("detail");
                  }}
                  className={`flex w-full gap-3 border-b border-[var(--color-border)] px-4 py-4 text-left transition hover:bg-[var(--color-bg-surface-raised)] ${isActive ? "bg-[var(--color-brand-subtle)]/40" : ""
                    }`}
                >
                  <span className={`w-1 shrink-0 self-stretch rounded-full ${tone.solidBg}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-[var(--color-text-primary)]">
                        {item.mention.author || "Không rõ tác giả"}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${item.status === "pending"
                          ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                          : "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                          }`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                      {item.mention.content}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span className="truncate">{item.requested_by_name}</span>
                      <span className="shrink-0">{formatDate(item.created_at || item.history?.[0]?.at)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {!loading && displayedRequests.length === 0 && (
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)]">
              inventory_2
            </span>
            <h2 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
              Chưa có yêu cầu gắn lại nhãn
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Khi nhân viên xử lý khủng hoảng hoặc tiềm năng gửi đề xuất sửa nhãn từ trang Mentions, yêu
              cầu sẽ xuất hiện tại đây để Brand Manager xem, so sánh và duyệt.
            </p>
          </section>
        )}

        {selectedRequest && (
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  {PLATFORM_LABELS[selectedRequest.mention.platform] || selectedRequest.mention.platform} ·{" "}
                  {CONTENT_TYPE_LABELS[selectedRequest.mention.content_type] || selectedRequest.mention.content_type}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
                  Yêu cầu #{selectedRequest.mention_id}
                </h2>
              </div>
              <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-1">
                {[
                  { key: "detail", label: "Xem & duyệt" },
                  { key: "compare", label: "So sánh nhãn" },
                  { key: "history", label: "Lịch sử sửa nhãn" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMode(item.key as typeof mode)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${mode === item.key
                      ? "bg-[var(--color-brand)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {mode === "detail" && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        Bài viết gốc
                      </p>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] p-4">
                        <p className="text-sm leading-6 text-[var(--color-text-primary)]">
                          {selectedRequest.mention.post_content || selectedRequest.mention.content}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.mention.content_type !== "post" && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          Nội dung cần duyệt
                        </p>
                        <div className="rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-brand-subtle)]/30 p-4">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {selectedRequest.mention.author || "Khách hàng"}
                          </p>
                          <p className="mt-2 text-lg leading-7 text-[var(--color-text-primary)]">
                            {selectedRequest.mention.comment_content || selectedRequest.mention.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.reason && (
                      <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          Lý do nhân viên gửi
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                          {selectedRequest.reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <aside className="space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        Nhãn sẽ áp dụng
                      </p>
                      <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-4">
                        <label className="block space-y-2">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Sắc thái</span>
                          <select
                            value={draftLabel.sentiment || ""}
                            onChange={(event) =>
                              setDraftLabel((current) => ({
                                ...current,
                                sentiment: (event.target.value || null) as Sentiment,
                              }))
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
                          >
                            <option value="">-- Cảm xúc --</option>
                            {Object.entries(SENTIMENT_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Chủ đề</span>
                          <select
                            value={draftLabel.topic || ""}
                            onChange={(event) =>
                              setDraftLabel((current) => ({ ...current, topic: event.target.value }))
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
                          >
                            <option value="">-- Chủ đề --</option>
                            {TOPIC_OPTIONS.map((topic) => (
                              <option key={topic} value={topic}>
                                {TOPIC_LABELS[topic] || topic}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Liên quan</span>
                          <select
                            value={draftLabel.relevance === null || draftLabel.relevance === undefined ? "" : draftLabel.relevance ? "yes" : "no"}
                            onChange={(event) => {
                              const val = event.target.value;
                              setDraftLabel((current) => ({ ...current, relevance: val === "" ? null : val === "yes" }));
                            }}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
                          >
                            <option value="">-- Liên quan --</option>
                            <option value="yes">Có</option>
                            <option value="no">Không</option>
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Mức độ (Urgency)</span>
                          <select
                            value={draftLabel.urgency || ""}
                            onChange={(event) =>
                              setDraftLabel((current) => ({
                                ...current,
                                urgency: (event.target.value || null) as Urgency,
                              }))
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
                          >
                            <option value="">-- Mức độ --</option>
                            {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Ý định (Intent)</span>
                          <select
                            value={draftLabel.intent || ""}
                            onChange={(event) =>
                              setDraftLabel((current) => ({
                                ...current,
                                intent: (event.target.value || null) as Intent,
                              }))
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
                          >
                            <option value="">-- Ý định --</option>
                            {Object.entries(INTENT_LABELS).map(([value, { label, emoji }]) => (
                              <option key={value} value={value}>
                                {emoji} {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={saving || !canApproveSelectedRequest}
                        onClick={() => updateRequestStatus("approved", draftLabel)}
                        className="rounded-lg bg-[var(--color-success)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Duyệt yêu cầu
                      </button>
                      <button
                        type="button"
                        disabled={saving || !canRejectSelectedRequest}
                        onClick={() => updateRequestStatus("rejected", selectedRequest.old_label)}
                        className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Không duyệt
                      </button>
                    </div>
                  </aside>
                </div>
              )}

              {mode === "compare" && (
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    Đường đi của nhãn — từ lúc gắn ban đầu đến khi Brand Manager chốt
                  </p>
                  <LabelDiffStrip
                    oldLabel={selectedRequest.old_label}
                    proposedLabel={selectedRequest.proposed_label}
                    finalLabel={selectedRequest.final_label || draftLabel}
                  />
                </div>
              )}

              {mode === "history" && (
                <div className="space-y-0">
                  <BrandLabelHistoryPanel
                    entries={filteredAuditEntries}
                    filters={historyFilters}
                    requesterOptions={requesterOptions}
                    statusLabels={HISTORY_STATUS_LABELS}
                    onFiltersChange={setHistoryFilters}
                  />
                  <div className="hidden">
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      Lịch sử riêng của yêu cầu đang chọn
                    </p>
                    {(selectedRequest.history || []).length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
                        Chưa có lịch sử sửa nhãn.
                      </p>
                    ) : (
                      selectedRequest.history?.map((item, index) => {
                        const isLast = index === (selectedRequest.history?.length || 0) - 1;
                        return (
                          <div key={`${item.action}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                            <div className="flex flex-col items-center">
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                              {!isLast && <span className="w-px flex-1 bg-[var(--color-border)]" />}
                            </div>
                            <div className="flex-1 rounded-xl border border-[var(--color-border)] p-4">
                              <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-base font-semibold capitalize text-[var(--color-text-primary)]">
                                    {item.action}
                                  </p>
                                  <p className="text-sm text-[var(--color-text-secondary)]">
                                    {item.by_name || item.by_email || "Hệ thống"}
                                  </p>
                                </div>
                                <span className="text-[11px] text-[var(--color-text-muted)]">
                                  {formatDate(item.at)}
                                </span>
                              </div>
                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                {item.from && (
                                  <div>
                                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                                      Từ
                                    </p>
                                    <LabelPill label={item.from} size="sm" />
                                  </div>
                                )}
                                {item.to && (
                                  <div>
                                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                                      Thành
                                    </p>
                                    <LabelPill label={item.to} size="sm" />
                                  </div>
                                )}
                              </div>
                              {item.note && (
                                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
