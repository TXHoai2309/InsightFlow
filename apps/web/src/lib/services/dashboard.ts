/**
 * DashboardService
 * Service layer cho tất cả Firestore queries và data aggregation.
 *
 * Thiết kế để dễ nâng cấp:
 *  - Thay collection name → chỉ sửa COLLECTION_NAMES
 *  - Thêm filter/pagination → sửa fetchRawData()
 *  - Thay Firestore bằng REST API → thay getDocs() bằng fetch() tại đây
 */

import { dbData } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import type {
  Mention,
  Alert,
  Lead,
  LabelChangeRequest,
  ClassificationLabel,
  LabelQueue,
  LabelValue,
  Workspace,
  DashboardStats,
  TopSource,
  TopTopic,
  SentimentTrendPoint,
  Platform,
  DashboardFilters,
} from "@/types/dashboard";
import { canPerformAction, type UserRoleProfile } from "@/lib/rbac";
import {
  getChangedLabelFields,
  inferQueueFromLabels,
  normalizeClassificationLabel,
} from "@/lib/label-change";

// ─── Collection names ────────────────────────────────────────────────────────
export const COLLECTION_NAMES = {
  mentions: "insightflow_labels",
  alerts: "alerts",
  leads: "leads",
  labelChangeRequests: "label_change_requests",
} as const;

// ─── Platform mapping: source crawl → Platform type ──────────────────────────
const SOURCE_TO_PLATFORM: Record<string, Platform> = {
  // Social media
  facebook: "facebook",
  tiktok: "tiktok",
  youtube: "youtube",
  thread: "thread",
  threads: "thread",
  // Food / map review
  be: "be",
  befood: "be",
  google_maps: "google_maps",
  googlemap: "google_maps",
  // Báo điện tử / tin tức
  news: "news",
};

export function mapSourceToPlatform(source: string): Platform {
  const normalized = source
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]/g, "_");
  return SOURCE_TO_PLATFORM[normalized] ?? "news";
}

/**
 * Chuẩn hoá tên thương hiệu → tên hiển thị đẹp cho 3 target brand.
 * Fallback: capitalize from raw string.
 */
export function normalizeBrandName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[\s\-_.]/g, "") // bỏ dấu cách, gạch ngang, gạch dưới, dấu chấm
    .trim();

  if (normalized.includes("highland")) return "highlandcoffee";
  if (normalized.includes("starbuck")) return "starbucks";
  if (normalized.includes("mixue")) return "mixue";

  return normalized;
}

/** Map raw brand string → display name */
export function formatBrandDisplayName(raw: string): string {
  if (!raw) return "";
  const b = raw.toLowerCase().trim();
  if (b.includes("highland")) return "Highland Coffee";
  if (b.includes("starbuck")) return "Starbucks";
  if (b.includes("mixue")) return "Mixue";
  // fallback: capitalize words
  return raw
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ─── Platform display info (dùng cho TopSources và DashboardFilters) ─────────
export const PLATFORM_META: Record<Platform, { label: string; color: string; icon?: string }> =
  {
    facebook: { label: "Facebook", color: "var(--color-platform-facebook)", icon: "ti-brand-facebook" },
    tiktok: { label: "TikTok", color: "var(--color-platform-tiktok)", icon: "ti-brand-tiktok" },
    youtube: { label: "YouTube", color: "var(--color-platform-youtube)", icon: "ti-brand-youtube" },
    thread: { label: "Threads", color: "var(--color-platform-thread)", icon: "ti-brand-threads" },
    be: { label: "Be / BeFood", color: "var(--color-platform-be)", icon: "ti-car" },
    google_maps: {
      label: "Google Maps",
      color: "var(--color-platform-google-maps)",
      icon: "ti-map-pin"
    },
    news: { label: "Báo điện tử", color: "var(--color-platform-news)", icon: "ti-world" },
  };

// ─── Topic whitelist ─────────────────────────────────────────────────────────
type TopicType = Mention["topic"];
const VALID_TOPICS = new Set<string>([
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
]);
function mapTopic(raw: unknown): TopicType {
  const firstTopic = Array.isArray(raw) ? raw[0] : raw;
  const topic = String(firstTopic || "")
    .toLowerCase()
    .trim();
  if (VALID_TOPICS.has(topic)) {
    return topic as TopicType;
  }
  return "other";
}

function mapSentiment(raw: unknown): Mention["sentiment"] {
  const sentiment = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["positive", "negative", "neutral"].includes(sentiment)
      ? sentiment
      : "neutral"
  ) as Mention["sentiment"];
}

function mapIntent(raw: unknown): Lead["intent"] {
  const intent = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["hot", "warm", "cold", "none"].includes(intent) ? intent : "none"
  ) as Lead["intent"];
}

function mapLeadStatus(raw: unknown): Lead["status"] {
  const status = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["new", "processing", "completed", "skipped"].includes(status)
      ? status
      : "new"
  ) as Lead["status"];
}

function mapLabelValue(raw: unknown): LabelValue {
  const label = String(raw || "")
    .toLowerCase()
    .trim();
  const values: LabelValue[] = [
    "lead_hot",
    "lead_warm",
    "lead_cold",
    "not_lead",
    "crisis_complaint",
    "crisis_negative_high_risk",
    "crisis_legal",
    "spam",
    "irrelevant",
    "monitoring",
    "needs_review",
  ];
  return values.includes(label as LabelValue)
    ? (label as LabelValue)
    : "needs_review";
}

function mapLabelQueue(raw: unknown): LabelQueue {
  const queue = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["lead", "crisis", "monitoring", "none", "review"].includes(queue)
      ? queue
      : "review"
  ) as LabelQueue;
}

function legacyLabelToClassificationLabel(label: LabelValue): ClassificationLabel {
  if (label === "lead_hot") {
    return {
      sentiment: "positive",
      topic: [],
      relevance: true,
      urgency: "normal",
      intent: "hot",
    };
  }
  if (label === "lead_warm") {
    return {
      sentiment: "positive",
      topic: [],
      relevance: true,
      urgency: "normal",
      intent: "warm",
    };
  }
  if (label === "lead_cold") {
    return {
      sentiment: "neutral",
      topic: [],
      relevance: true,
      urgency: "normal",
      intent: "cold",
    };
  }
  if (label === "crisis_complaint" || label === "crisis_negative_high_risk") {
    return {
      sentiment: "negative",
      topic: ["service"],
      relevance: true,
      urgency: "crisis",
      intent: "none",
    };
  }
  if (label === "crisis_legal") {
    return {
      sentiment: "negative",
      topic: ["other"],
      relevance: true,
      urgency: "crisis",
      intent: "none",
    };
  }
  if (label === "monitoring") {
    return {
      sentiment: "neutral",
      topic: [],
      relevance: true,
      urgency: "notable",
      intent: "none",
    };
  }
  return {
    sentiment: "neutral",
    topic: [],
    relevance: false,
    urgency: "normal",
    intent: "none",
  };
}

const CLASSIFICATION_LABEL_FIELDS = new Set<keyof ClassificationLabel>([
  "sentiment",
  "topic",
  "relevance",
  "urgency",
  "intent",
]);

function mapChangedLabelFields(
  raw: unknown,
  currentLabels: ClassificationLabel,
  requestedLabels: ClassificationLabel,
): Array<keyof ClassificationLabel> {
  if (!Array.isArray(raw)) {
    return getChangedLabelFields(currentLabels, requestedLabels);
  }

  const fields = raw.filter(
    (field): field is keyof ClassificationLabel =>
      CLASSIFICATION_LABEL_FIELDS.has(field as keyof ClassificationLabel),
  );

  return fields.length > 0
    ? fields
    : getChangedLabelFields(currentLabels, requestedLabels);
}

function mapLabelCorrectionStatus(
  raw: unknown,
): Lead["label_correction_status"] {
  const status = String(raw || "")
    .toLowerCase()
    .trim();
  return (
    ["none", "pending", "approved", "rejected"].includes(status)
      ? status
      : undefined
  ) as Lead["label_correction_status"];
}

function normalizeText(value: unknown): string {
  const text = String(value || "");
  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n");
}

function normalizeOptionalUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    const url = String(value || "").trim();
    if (url) return url;
  }
  return undefined;
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = String(value || "").trim();
  return text || undefined;
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}

// ─── Date parser ─────────────────────────────────────────────────────────────
function parseDate(field: unknown): string {
  if (!field) return new Date().toISOString();
  if (typeof (field as any).toDate === "function") {
    return (field as any).toDate().toISOString();
  }
  if (field instanceof Date) return field.toISOString();
  const s = String(field).trim();
  if (!s) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00Z`;

  // Thử parse định dạng Việt Nam thông dụng như "HH:mm DD/MM/YYYY" hoặc "DD/MM/YYYY"
  // ví dụ: "22:21 18/05/2025"
  const dmyRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const match = s.match(dmyRegex);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];

    // Tìm phần giờ phút nếu có
    const timeRegex = /(\d{1,2}):(\d{2})/;
    const timeMatch = s.match(timeRegex);
    const hour = timeMatch ? timeMatch[1].padStart(2, "0") : "00";
    const minute = timeMatch ? timeMatch[2].padStart(2, "0") : "00";

    return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
  }

  // "2026-06-18T15:06:16.555779" — no timezone → assume UTC
  return s.includes("+") || s.endsWith("Z") ? s : s + "Z";
}

// ─── Fetch options ────────────────────────────────────────────────────────────
export interface FetchOptions {
  /** Pagination cursor */
  after?: QueryDocumentSnapshot<DocumentData>;
  /** Set a max limit (default: no limit — fetches ALL records) */
  maxMentions?: number;
}

// ─── Supabase Fetch Helper ───────────────────────────────────────────────────
async function supabaseFetch<T = any>(table: string, queryStr: string = "", method = "GET", body?: any): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const endpoint = `${url}/rest/v1/${table}${queryStr ? "?" + queryStr : ""}`;
  const res = await fetch(endpoint, {
    method,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" || method === "PATCH" ? "return=minimal" : "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 406) return null; // Table not found
    console.warn(`Supabase fetch failed for ${table}:`, await res.text());
    return null;
  }
  
  if (res.status === 204) return null; // No content
  return res.json();
}

// ─── Main service ─────────────────────────────────────────────────────────────
export class DashboardService {
  /**
   * Fetch raw data from Firestore.
   * Mapping field names Firestore → internal types happens here.
   */
  static async fetchRawData(opts: FetchOptions = {}): Promise<{
    workspaces: Workspace[];
    mentions: Mention[];
    alerts: Alert[];
    leads: Lead[];
    labelChangeRequests: LabelChangeRequest[];
    lastMentionDoc?: QueryDocumentSnapshot<DocumentData>;
  }> {
    try {
      const limitCount = opts.maxMentions || 500;
      
      // 1. Fetch raw annotations (limit to maxMentions to get a good dataset)
      const [annotationsData, leadsData, requestsData] = await Promise.all([
        supabaseFetch<any[]>("annotations", `limit=${limitCount}&order=created_at.desc`),
        supabaseFetch<any[]>("leads", `limit=200&order=created_at.desc`),
        supabaseFetch<any[]>("label_change_requests", `limit=100&order=requested_at.desc`)
      ]);

      const rawAnnotations = annotationsData || [];
      const rawLeads = leadsData || [];
      const rawRequests = requestsData || [];

      // 2. Extract IDs to fetch posts and comments
      const postIds = Array.from(new Set(rawAnnotations.filter(a => a.entity_type === 'post').map(a => a.post_id)));
      const commentIds = Array.from(new Set(rawAnnotations.filter(a => a.entity_type === 'comment').map(a => a.comment_id)));

      // Helper to fetch in chunks to avoid URL length limits
      const fetchInChunks = async (table: string, idField: string, ids: string[]) => {
        if (!ids || ids.length === 0) return [];
        const unique = Array.from(new Set(ids.filter(Boolean)));
        const results: any[] = [];
        for (let i = 0; i < unique.length; i += 50) {
           const chunk = unique.slice(i, i + 50);
           const query = `${idField}=in.(${encodeURIComponent(chunk.join(','))})`;
           const data = await supabaseFetch<any[]>(table, query);
           if (data) results.push(...data);
        }
        return results;
      };

      // 3. Fetch corresponding posts and comments
      const [postsData, commentsData] = await Promise.all([
        fetchInChunks("posts", "post_id", postIds),
        fetchInChunks("comments", "comment_id", commentIds)
      ]);

      const postsMap = new Map();
      postsData.forEach(p => postsMap.set(p.post_id, p));

      const commentsMap = new Map();
      commentsData.forEach(c => commentsMap.set(c.comment_id, c));

      // ── Mentions (Only from annotations) ──────────────────────────────────────────────────────────
      const mentions: Mention[] = [];

      rawAnnotations.forEach(a => {
        const isPost = a.entity_type === 'post';
        const row = isPost ? postsMap.get(a.post_id) : commentsMap.get(a.comment_id);
        if (!row) return; // If content is missing, we skip

        let labelObj: Partial<ClassificationLabel> = {};
        if (a.label) {
          try {
             const parsed = typeof a.label === 'string' ? JSON.parse(a.label) : a.label;
             labelObj = parsed;
          } catch (e) {}
        }

        const payload = row.payload_json || {};
        const id = isPost ? row.post_id : row.comment_id;
        const parentId = isPost ? null : row.parent_comment_id || row.post_id;
        let brand = row.brand || row.brand_slug || payload.brand || "";
        
        let mappedWorkspaceId = String(brand);
        const lowerBrand = mappedWorkspaceId.toLowerCase();
        if (lowerBrand.includes("highland")) {
           mappedWorkspaceId = "highland-coffee";
        } else if (lowerBrand.includes("starbuck")) {
           mappedWorkspaceId = "starbucks";
        } else if (lowerBrand.includes("mixue")) {
           mappedWorkspaceId = "mixue";
        }

        const content = isPost ? payload.text || row.text || "" : row.text || payload.text || "";
        const author = isPost ? row.author || payload.author : row.username || payload.username;
        const url = row.url || payload.url;
        
        const postedAt = parseDate(row.posted_at || payload.posted_at || payload.thoi_gian_dang || payload.gio_comment || row.created_at);
        const createdAt = parseDate(row.created_at || row.posted_at);

        mentions.push({
          id: String(id),
          parent_id: parentId ? String(parentId) : null,
          workspace_id: mappedWorkspaceId,
          platform: mapSourceToPlatform(row.platform || payload.platform || ""),
          content: normalizeText(content),
          post_content: isPost ? normalizeText(content) : undefined,
          comment_content: !isPost ? normalizeText(content) : undefined,
          content_type: isPost ? "post" : "comment" as any,
          original_content: normalizeText(content),
          author: normalizeText(author || "N/A").trim(),
          sentiment: mapSentiment(labelObj.sentiment),
          topic: mapTopic(labelObj.topic),
          credibility_score: 100,
          created_at: createdAt,
          posted_at: postedAt,
          url: String(url || ""),
          labels: normalizeClassificationLabel(
            { topic: labelObj.topic },
            {
              sentiment: mapSentiment(labelObj.sentiment),
              relevance: typeof labelObj.relevance === "boolean" ? labelObj.relevance : true,
              urgency: labelObj.urgency as any,
              intent: labelObj.intent as any,
            }
          ),
        });
      });

      mentions.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());

      // ── Workspaces ────────────────────────────────────────────────────────
      const TARGET_BRAND_MAP: Record<string, string> = {
        "highland-coffee": "Highland Coffee",
        starbucks: "Starbucks",
        mixue: "Mixue",
      };
      const brandMap = new Map<string, Workspace>();

      Object.entries(TARGET_BRAND_MAP).forEach(([id, name]) => {
        brandMap.set(normalizeBrandName(name), {
          id,
          brand_name: name,
          scale: "medium",
          keywords: [id],
          synonyms: [],
          priority: true,
          created_at: new Date().toISOString(),
        });
      });

      mentions.forEach((m) => {
        if (!m.workspace_id) return;
        const displayName = formatBrandDisplayName(m.workspace_id);
        const key = normalizeBrandName(displayName);
        if (!brandMap.has(key)) {
          brandMap.set(key, {
            id: m.workspace_id,
            brand_name: displayName,
            scale: "medium",
            keywords: [],
            synonyms: [],
            priority: false,
            created_at: m.created_at,
          });
        }
      });
      const workspaces = Array.from(brandMap.values()).sort((a, b) =>
        a.brand_name.localeCompare(b.brand_name)
      );

      // ── Alerts (Bảng không tồn tại trên Supabase, sinh tự động từ mention tiêu cực) ────────────────
      const alerts: Alert[] = [];
      const negativeMentions = mentions.filter((m) => m.sentiment === "negative");
      if (negativeMentions.length > 0) {
        alerts.push({
          id: "generated-alert-spike-1",
          workspace_id: negativeMentions[0].workspace_id || "highland-coffee",
          severity: negativeMentions.length > 10 ? "critical" : negativeMentions.length > 5 ? "high" : "medium",
          signal_type: "mention_spike",
          message: `Phát hiện ${negativeMentions.length} bình luận/bài đăng tiêu cực gần đây.`,
          affected_mentions_count: negativeMentions.length,
          created_at: negativeMentions[0].created_at || new Date().toISOString(),
          status: "new",
        });
      }

      const legalMentions = mentions.filter((m) => m.topic === "legal" || m.topic === "operation");
      if (legalMentions.length > 0) {
        alerts.push({
          id: "generated-alert-sensitive-1",
          workspace_id: legalMentions[0].workspace_id || "highland-coffee",
          severity: "critical",
          signal_type: "sensitive_topic",
          message: `Cảnh báo rủi ro về dịch vụ/pháp lý từ ${legalMentions.length} bài đăng.`,
          affected_mentions_count: legalMentions.length,
          created_at: legalMentions[0].created_at || new Date().toISOString(),
          status: "new",
        });
      }

      // ── Leads ─────────────────────────────────────────────────────────────
      const leads: Lead[] = rawLeads.map((d: any) => {
        const labels = d.labels || {};
        const intent = mapIntent(d.intent || labels.intent);
        
        let leadWorkspaceId = String(d.workspace_id || d.brand || "");
        const lowerBrand = leadWorkspaceId.toLowerCase();
        if (lowerBrand.includes("highland")) leadWorkspaceId = "highland-coffee";
        else if (lowerBrand.includes("starbuck")) leadWorkspaceId = "starbucks";
        else if (lowerBrand.includes("mixue")) leadWorkspaceId = "mixue";

        return {
          id: d.id,
          mention_id: normalizeOptionalText(d.mention_id || d.source_mention_id),
          source_mention_id: normalizeOptionalText(d.source_mention_id),
          parent_id: d.parent_id ? String(d.parent_id) : null,
          content_type: ["post", "comment", "reply"].includes(String(d.content_type || "").toLowerCase())
            ? (String(d.content_type).toLowerCase() as Lead["content_type"])
            : undefined,
          post_id: normalizeOptionalText(d.post_id),
          workspace_id: leadWorkspaceId,
          platform: mapSourceToPlatform(d.source || d.platform || ""),
          author: normalizeText(d.author || "Khách hàng").trim(),
          content: String(d.content || d.text || ""),
          intent,
          current_label: d.current_label ? mapLabelValue(d.current_label) : undefined,
          labels: normalizeClassificationLabel(
            d.labels || d.current_labels || { topic: Array.isArray(d.intent_signals) ? d.intent_signals : [] },
            {
              sentiment: labels.sentiment ?? d.sentiment,
              relevance: typeof labels.relevance === "boolean" ? labels.relevance : true,
              urgency: labels.urgency,
              intent,
            }
          ),
          intent_signals: d.intent_signals || [],
          statusLabel: "new",
          status: d.status || "new",
          created_at: parseDate(d.created_at),
          expiry_at: d.expiry_at ? parseDate(d.expiry_at) : undefined,
          url: normalizeOptionalUrl(d.url, d.post_url, d.source_url),
          source_url: normalizeOptionalUrl(d.source_url, d.post_url, d.url),
          label_correction_status: mapLabelCorrectionStatus(d.label_correction_status),
          pending_label_request_id: normalizeOptionalText(d.pending_label_request_id),
          last_label_corrected_at: d.last_label_corrected_at ? parseDate(d.last_label_corrected_at) : undefined,
          phone: normalizeOptionalText(d.phone),
          email: normalizeOptionalText(d.email),
          zalo_id: normalizeOptionalText(d.zalo_id),
          messenger_id: normalizeOptionalText(d.messenger_id),
          social_profile_url: normalizeOptionalUrl(d.social_profile_url, d.contact, d.profile_url),
          owner_id: normalizeOptionalText(d.owner_id),
          owner_name: normalizeOptionalText(d.owner_name),
          owner_email: normalizeOptionalText(d.owner_email),
          assigned_at: d.assigned_at ? parseDate(d.assigned_at) : undefined,
          assigned_by: normalizeOptionalText(d.assigned_by),
          claimed_at: d.claimed_at ? parseDate(d.claimed_at) : undefined,
          first_contacted_at: d.first_contacted_at ? parseDate(d.first_contacted_at) : undefined,
          contact_attempts: typeof d.contact_attempts === "number" ? d.contact_attempts : 0,
          last_contact_at: d.last_contact_at ? parseDate(d.last_contact_at) : undefined,
          pending_result: d.pending_result === true,
          last_action_at: d.last_action_at ? parseDate(d.last_action_at) : undefined,
          last_action_type: normalizeOptionalText(d.last_action_type) as Lead["last_action_type"],
          last_contact_channel: normalizeOptionalText(d.last_contact_channel),
          result_type: normalizeOptionalText(d.result_type) as Lead["result_type"],
          result_recorded_at: d.result_recorded_at ? parseDate(d.result_recorded_at) : undefined,
          follow_up_at: d.follow_up_at ? parseDate(d.follow_up_at) : undefined,
          closed_at: d.closed_at ? parseDate(d.closed_at) : undefined,
          sales_status: normalizeOptionalText(d.sales_status) as Lead["sales_status"],
          sales_owner_id: normalizeOptionalText(d.sales_owner_id),
          sales_owner_name: normalizeOptionalText(d.sales_owner_name),
          sales_transferred_at: d.sales_transferred_at ? parseDate(d.sales_transferred_at) : undefined,
          crm_deal_id: normalizeOptionalText(d.crm_deal_id),
          notes: d.notes ? String(d.notes) : undefined,
          posted_at: d.posted_at ? parseDate(d.posted_at) : undefined,
        };
      });
      leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // ── Label Change Requests ─────────────────────────────────────────────
      const labelChangeRequests: LabelChangeRequest[] = rawRequests.map((d: any) => {
        const legacyCurrentLabel = mapLabelValue(d.current_label);
        const legacyRequestedLabel = mapLabelValue(d.requested_label);
        const currentLabels = normalizeClassificationLabel(d.current_labels, legacyLabelToClassificationLabel(legacyCurrentLabel));
        const requestedLabels = normalizeClassificationLabel(d.requested_labels, legacyLabelToClassificationLabel(legacyRequestedLabel));
        return {
          id: d.id || d.request_id,
          source_type: ["lead", "mention", "comment", "post"].includes(String(d.source_type || "").toLowerCase())
            ? (String(d.source_type).toLowerCase() as LabelChangeRequest["source_type"])
            : "lead",
          source_id: String(d.source_id || ""),
          lead_id: normalizeOptionalText(d.lead_id),
          mention_id: normalizeOptionalText(d.mention_id),
          workspace_id: String(d.workspace_id || d.brand || ""),
          platform: mapSourceToPlatform(d.source || d.platform || ""),
          author: normalizeOptionalText(d.author),
          content_preview: normalizeText(d.content_preview || ""),
          source_url: normalizeOptionalUrl(d.source_url, d.url),
          current_labels: currentLabels,
          requested_labels: requestedLabels,
          changed_fields: mapChangedLabelFields(d.changed_fields, currentLabels, requestedLabels),
          current_queue: d.current_queue !== undefined ? mapLabelQueue(d.current_queue) : inferQueueFromLabels(currentLabels),
          requested_queue: d.requested_queue !== undefined ? mapLabelQueue(d.requested_queue) : inferQueueFromLabels(requestedLabels),
          current_label: d.current_label ? legacyCurrentLabel : undefined,
          requested_label: d.requested_label ? legacyRequestedLabel : undefined,
          reason_code: String(d.reason_code || "other"),
          reason_note: String(d.reason_note || ""),
          evidence_checked: d.evidence_checked === true,
          status: ["pending", "approved", "rejected", "cancelled"].includes(String(d.status || "").toLowerCase())
            ? (String(d.status).toLowerCase() as LabelChangeRequest["status"])
            : "pending",
          requested_by: String(d.requested_by || ""),
          requested_by_name: String(d.requested_by_name || ""),
          requested_by_role: String(d.requested_by_role || ""),
          requested_at: parseDate(d.requested_at || d.created_at),
          reviewed_by: normalizeOptionalText(d.reviewed_by),
          reviewed_by_name: normalizeOptionalText(d.reviewed_by_name),
          reviewed_at: d.reviewed_at ? parseDate(d.reviewed_at) : undefined,
          review_note: normalizeOptionalText(d.review_note),
          applied_at: d.applied_at ? parseDate(d.applied_at) : undefined,
          audit_log_id: normalizeOptionalText(d.audit_log_id),
        };
      });
      labelChangeRequests.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());

      return {
        workspaces,
        mentions,
        alerts,
        leads,
        labelChangeRequests,
      };
    } catch (error) {
      console.error("[DashboardService] fetchRawData error:", error);
      throw error;
    }
  }

  static async updateLeadStatus(
    id: string,
    status: Lead["status"],
    profile: UserRoleProfile | null | undefined,
  ): Promise<void> {
    if (!profile || !canPerformAction(profile, "update_lead_status")) {
      throw new Error("User is not allowed to update lead status.");
    }
    const auditFields = {
      updated_by: profile.uid,
      updated_by_role: profile.role,
      updated_at: new Date().toISOString(),
    };
    await supabaseFetch("leads", `id=eq.${id}`, "PATCH", { status, ...auditFields });
  }

  static async updateLeadDetails(
    id: string,
    data: Partial<Lead>,
    profile: UserRoleProfile | null | undefined,
  ): Promise<void> {
    if (!profile || !canPerformAction(profile, "update_lead_details")) {
      throw new Error("User is not allowed to update lead details.");
    }
    const auditFields = {
      updated_by: profile.uid,
      updated_by_role: profile.role,
      updated_at: new Date().toISOString(),
    };
    const cleanData = { ...data };
    delete cleanData.id;
    await supabaseFetch("leads", `id=eq.${id}`, "PATCH", { ...cleanData, ...auditFields });
  }

  static async createLabelChangeRequest(
    data: Omit<LabelChangeRequest, "id" | "status" | "requested_by" | "requested_by_name" | "requested_by_role" | "requested_at">,
    profile: UserRoleProfile | null | undefined,
  ): Promise<LabelChangeRequest> {
    if (!profile || !canPerformAction(profile, "create_label_request")) {
      throw new Error("User is not allowed to create label change requests.");
    }
    const nowIso = new Date().toISOString();
    const requestData = stripUndefinedFields({
      ...data,
      status: "pending" as const,
      requested_by: profile.uid,
      requested_by_name: profile.displayName || profile.email,
      requested_by_role: profile.role,
      requested_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      updated_by: profile.uid,
      updated_by_role: profile.role,
    });
    const res = await supabaseFetch("label_change_requests", "", "POST", [requestData]);
    return { ...requestData, id: (res && res[0]?.id) || String(Date.now()) } as LabelChangeRequest;
  }

  static async fetchLabelChangeRequests(opts: { limit?: number; status?: LabelChangeRequest["status"] } = {}): Promise<LabelChangeRequest[]> {
    const rawRequests = await supabaseFetch<any[]>("label_change_requests", `limit=${opts.limit || 50}${opts.status ? `&status=eq.${opts.status}` : ""}&order=requested_at.desc`);
    return (rawRequests || []).map((d: any) => d as any);
  }

  static async updateLabelChangeRequestStatus(id: string, status: "approved" | "rejected", profile: UserRoleProfile | null | undefined, reviewNote?: string): Promise<void> {
    if (!profile || !canPerformAction(profile, "label_request_review")) {
      throw new Error("User is not allowed to review label change requests.");
    }
    await supabaseFetch("label_change_requests", `id=eq.${id}`, "PATCH", {
      status,
      reviewed_by: profile.uid,
      reviewed_by_name: profile.displayName || profile.email,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
    });
  }

  static async deleteLead(id: string, profile: UserRoleProfile | null | undefined): Promise<void> {
    if (!profile || !canPerformAction(profile, "update_lead_details")) {
      throw new Error("User is not allowed to delete lead.");
    }
    await supabaseFetch("leads", `id=eq.${id}`, "DELETE");
  }

  static calculateStats(
    mentions: Mention[],
    alerts: Alert[],
    leads: Lead[],
  ): DashboardStats {
    const total = mentions.length;
    let positive = 0,
      negative = 0,
      neutral = 0;
    mentions.forEach((m) => {
      if (m.sentiment === "positive") positive++;
      else if (m.sentiment === "negative") negative++;
      else neutral++;
    });

    const netSentiment =
      total > 0 ? Math.round(((positive - negative) / total) * 100) : 0;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneDayAgo = now - oneDayMs;
    const twoDaysAgo = now - 2 * oneDayMs;

    const hotLeadsToday = leads.filter((l) => l.intent === "hot").length;

    const alertsToday = alerts.length;

    const last24h = mentions.filter(
      (m) => new Date(m.posted_at).getTime() >= oneDayAgo,
    ).length;
    const prev24h = mentions.filter((m) => {
      const t = new Date(m.posted_at).getTime();
      return t >= twoDaysAgo && t < oneDayAgo;
    }).length;

    const trendingSpike =
      prev24h > 0 ? parseFloat((last24h / prev24h).toFixed(1)) : last24h;

    return {
      total_mentions: total,
      positive_count: positive,
      negative_count: negative,
      neutral_count: neutral,
      net_sentiment: netSentiment,
      hot_leads_today: hotLeadsToday,
      alerts_today: alertsToday,
      trending_spike: trendingSpike,
    };
  }

  // ── Top sources (group by platform) ──────────────────────────────────────

  static calculateTopSources(mentions: Mention[]): TopSource[] {
    const total = mentions.length || 1;
    const counts: Partial<Record<Platform, number>> = {};

    mentions.forEach((m) => {
      counts[m.platform] = (counts[m.platform] ?? 0) + 1;
    });

    return (Object.entries(counts) as [Platform, number][])
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Top topics (group by topic → sentiment breakdown) ─────────────────────

  static calculateTopTopics(mentions: Mention[]): TopTopic[] {
    const groups: Record<
      string,
      { count: number; positive: number; negative: number; neutral: number }
    > = {};

    mentions.forEach((m) => {
      const t = m.topic || "other";
      if (!groups[t])
        groups[t] = { count: 0, positive: 0, negative: 0, neutral: 0 };
      groups[t].count++;
      groups[t][m.sentiment]++;
    });

    return Object.entries(groups)
      .map(([name, g]) => ({
        name,
        count: g.count,
        sentiment_breakdown: {
          positive: g.positive,
          negative: g.negative,
          neutral: g.neutral,
        },
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Sentiment trend (time-bucketed) ──────────────────────────────────────

  /**
   * Tính toán dữ liệu xu hướng cảm xúc theo ngày/giờ từ mentions thật.
   * - "24h": 24 điểm theo giờ
   * - "7d": 7 điểm theo ngày
   * - "30d": 30 điểm theo ngày
   */
  static calculateSentimentTrend(
    mentions: Mention[],
    timeRange: DashboardFilters["time_range"],
  ): SentimentTrendPoint[] {
    const now = Date.now();

    if (timeRange === "24h") {
      const result: SentimentTrendPoint[] = [];
      for (let i = 23; i >= 0; i--) {
        const slotEnd = now - i * 60 * 60 * 1000;
        const slotStart = slotEnd - 60 * 60 * 1000;
        const slot = mentions.filter((m) => {
          // Dùng posted_at (ngày đăng bài) để vẽ biểu đồ
          const t = new Date(m.posted_at).getTime();
          return t >= slotStart && t < slotEnd;
        });
        const d = new Date(slotEnd);
        result.push({
          date: `${String(d.getHours()).padStart(2, "0")}:00`,
          positive: slot.filter((m) => m.sentiment === "positive").length,
          negative: slot.filter((m) => m.sentiment === "negative").length,
          neutral: slot.filter((m) => m.sentiment === "neutral").length,
        });
      }
      return result;
    }

    // Group theo ngày đăng bài (posted_at)
    let days = timeRange === "7d" ? 7 : 30;
    if (timeRange === "all") {
      if (mentions.length === 0) {
        return [];
      }
      const timestamps = mentions.map((m) => new Date(m.posted_at).getTime());
      const minTimestamp = Math.min(...timestamps);
      const diffMs = now - minTimestamp;
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      // Giới hạn tối thiểu 1 ngày, tối đa 90 ngày để tránh render quá tải
      days = Math.max(1, Math.min(90, diffDays));
    }

    const result: SentimentTrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const slot = mentions.filter((m) => {
        // Dùng posted_at (ngày đăng bài thật) thay vì created_at (ngày cào)
        const t = new Date(m.posted_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });

      result.push({
        date: dayStart.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        positive: slot.filter((m) => m.sentiment === "positive").length,
        negative: slot.filter((m) => m.sentiment === "negative").length,
        neutral: slot.filter((m) => m.sentiment === "neutral").length,
      });
    }
    return result;
  }
}
