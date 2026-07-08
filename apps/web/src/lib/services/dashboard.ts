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
  QueryDocumentSnapshot,
  DocumentData,
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

function inferLeadIntent(...values: unknown[]): Lead["intent"] {
  for (const value of values) {
    const directIntent = mapIntent(value);
    if (directIntent !== "none") return directIntent;

    const normalized = String(value || "")
      .toLowerCase()
      .trim();
    if (!normalized) continue;
    if (normalized.includes("lead_hot") || normalized.includes("hot_lead")) {
      return "hot";
    }
    if (normalized.includes("lead_warm") || normalized.includes("warm_lead")) {
      return "warm";
    }
    if (normalized.includes("lead_cold") || normalized.includes("cold_lead")) {
      return "cold";
    }
  }

  return "none";
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

type SupabaseRow = Record<string, unknown>;

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url.trim() || !anonKey.trim()) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY để tải mentions từ Supabase.");
  }
  return { url: url.trim(), anonKey: anonKey.trim() };
}

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function supabaseEndpoint(config: SupabaseConfig, table: string, requestQuery = "") {
  return `${normalizeSupabaseUrl(config.url)}/rest/v1/${table}${requestQuery ? `?${requestQuery}` : ""}`;
}

async function supabaseRequest<T>(config: SupabaseConfig, table: string, requestQuery: string): Promise<T> {
  const response = await fetch(supabaseEndpoint(config, table, requestQuery), {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${table} ${response.status}: ${message}`);
  }
  return (await response.json()) as T;
}

async function supabaseWrite<T = unknown>(
  config: SupabaseConfig,
  table: string,
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown> | Record<string, unknown>[],
  queryParams = "",
  returnRows = true,
  prefer?: string,
): Promise<T> {
  const url = supabaseEndpoint(config, table, queryParams);
  const headers: Record<string, string> = {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
  };
  headers["Prefer"] = prefer || (returnRows ? "return=representation" : "return=minimal");
  const response = await fetch(url, { method, headers, body: JSON.stringify(body) });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${table} ${method} ${response.status}: ${message}`);
  }
  if (!returnRows) return undefined as T;
  return (await response.json()) as T;
}

async function upsertSupabaseLead(
  config: SupabaseConfig,
  id: string,
  payload: Record<string, unknown>,
) {
  try {
    await supabaseWrite(
      config,
      "leads",
      "POST",
      [stripUndefinedFields({ id, ...payload })],
      "on_conflict=id",
      false,
      "resolution=merge-duplicates,return=minimal",
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("PGRST205") ||
        error.message.includes("public.leads"))
    ) {
      throw new Error(
        "Supabase table public.leads chua ton tai. Hay chay database/supabase_leads_workflow.sql trong Supabase SQL Editor roi reload app.",
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes('"code":"42501"') ||
        error.message.toLowerCase().includes("row-level security"))
    ) {
      throw new Error(
        "Supabase RLS dang chan ghi public.leads. Hay chay lai database/supabase_leads_workflow.sql trong Supabase SQL Editor de tao policy insert/update.",
      );
    }
    throw error;
  }
}

function isSupabaseStatementTimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('"code":"57014"') ||
      error.message.toLowerCase().includes("statement timeout"))
  );
}

function isSupabaseRecoverableReadError(error: unknown, table: string) {
  return (
    isSupabaseStatementTimeout(error) ||
    (error instanceof Error && error.message.includes(`Supabase ${table} 500`))
  );
}

function getMissingSupabaseColumn(error: unknown) {
  if (!(error instanceof Error)) return null;
  const columnMissingMatch = error.message.match(/column\s+\w+\.([A-Za-z0-9_]+)\s+does not exist/);
  if (columnMissingMatch?.[1]) return columnMissingMatch[1];

  const schemaCacheMatch = error.message.match(/Could not find the '([^']+)' column/);
  return schemaCacheMatch?.[1] || null;
}

async function loadSupabaseRows<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  params: Record<string, string>,
  maxRows = 10000,
): Promise<T[]> {
  const pageSize = 100;
  const rows: T[] = [];
  let offset = 0;

  while (rows.length < maxRows) {
    const requestParams = new URLSearchParams({
      ...params,
      limit: String(Math.min(pageSize, maxRows - rows.length)),
      offset: String(offset),
    });
    const page = await supabaseRequest<T[]>(config, table, requestParams.toString());
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += page.length;
  }

  return rows;
}

async function loadSupabaseRowsWithSelectFallback<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  columns: string[],
  params: Record<string, string>,
  maxRows = 10000,
  requiredColumns: string[] = [],
): Promise<T[]> {
  const required = new Set(requiredColumns);
  let selectColumns = [...columns];

  while (selectColumns.length > 0) {
    try {
      return await loadSupabaseRows<T>(
        config,
        table,
        { ...params, select: selectColumns.join(",") },
        maxRows,
      );
    } catch (error) {
      const missingColumn = getMissingSupabaseColumn(error);
      if (
        !missingColumn ||
        !selectColumns.includes(missingColumn) ||
        required.has(missingColumn)
      ) {
        throw error;
      }
      selectColumns = selectColumns.filter((column) => column !== missingColumn);
    }
  }

  return [];
}

function chunkValues<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function loadSupabaseRowsByPostIds<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  postIds: string[],
  params: Record<string, string>,
  maxRows = 10000,
  batchSize = 5,
  tolerateBatchErrors = false,
): Promise<T[]> {
  const rows: T[] = [];
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));

  for (const batch of chunkValues(uniquePostIds, batchSize)) {
    if (rows.length >= maxRows) break;
    try {
      const batchRows = await loadSupabaseRows<T>(
        config,
        table,
        {
          ...params,
          post_id: `in.(${batch.join(",")})`,
        },
        maxRows - rows.length,
      );
      rows.push(...batchRows);
    } catch (error) {
      if (!tolerateBatchErrors) throw error;
      console.warn(`[DashboardService] Skipping Supabase ${table} batch:`, error);
    }
  }

  return rows;
}

async function loadSupabaseRowsByPostIdsWithSelectFallback<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  postIds: string[],
  columns: string[],
  params: Record<string, string>,
  maxRows = 10000,
  requiredColumns: string[] = [],
  batchSize = 5,
  tolerateBatchErrors = false,
): Promise<T[]> {
  const rows: T[] = [];
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));

  for (const batch of chunkValues(uniquePostIds, batchSize)) {
    if (rows.length >= maxRows) break;
    try {
      const batchRows = await loadSupabaseRowsWithSelectFallback<T>(
        config,
        table,
        columns,
        {
          ...params,
          post_id: `in.(${batch.join(",")})`,
        },
        maxRows - rows.length,
        requiredColumns,
      );
      rows.push(...batchRows);
    } catch (error) {
      if (!tolerateBatchErrors) throw error;
      console.warn(`[DashboardService] Skipping Supabase ${table} batch:`, error);
    }
  }

  return rows;
}

function readPayload(row: SupabaseRow): SupabaseRow {
  return row.payload_json && typeof row.payload_json === "object"
    ? (row.payload_json as SupabaseRow)
    : {};
}

function readFirstText(...values: unknown[]): string {
  return normalizeText(values.find((value) => String(value || "").trim()) || "").trim();
}

function parseAnnotationLabel(row: SupabaseRow | undefined): Partial<ClassificationLabel> {
  if (!row) return {};
  const raw = row.label;
  if (!raw) return {};
  try {
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Partial<ClassificationLabel>) : {};
    }
    return raw && typeof raw === "object" ? (raw as Partial<ClassificationLabel>) : {};
  } catch {
    return {};
  }
}

function buildEntityKeys(platform: string, postId: string, commentId?: string | null) {
  const normalizedPlatform = platform === "befood" ? "be" : platform;
  const platforms = Array.from(new Set([platform, normalizedPlatform].filter(Boolean)));
  return platforms.flatMap((item) =>
    commentId
      ? [
        `${item}:${postId}:${commentId}`,
        `${item}:comment:${postId}:${commentId}`,
        `${item}:${postId}:comment:${commentId}`,
      ]
      : [`${item}:${postId}`, `${item}:post:${postId}`],
  );
}

function findAnnotation(
  annotationByKey: Map<string, SupabaseRow>,
  platform: string,
  postId: string,
  commentId?: string | null,
) {
  return buildEntityKeys(platform, postId, commentId)
    .map((key) => annotationByKey.get(key))
    .find(Boolean);
}

function getSupabaseLabel(
  row: SupabaseRow,
  annotation: SupabaseRow | undefined,
  fallback: Partial<ClassificationLabel>,
): ClassificationLabel {
  const payload = readPayload(row);
  const payloadLabels =
    payload.labels && typeof payload.labels === "object"
      ? (payload.labels as SupabaseRow)
      : {};
  const rowLabels = {
    ...payloadLabels,
    ...(row.labels && typeof row.labels === "object" ? (row.labels as SupabaseRow) : {}),
  };
  const annotationLabel = parseAnnotationLabel(annotation);
  const inferredIntent = inferLeadIntent(
    annotationLabel.intent,
    rowLabels.intent,
    row.intent,
    row.lead_intent,
    row.intent_type,
    row.current_label,
    row.label,
    payload.intent,
    payload.lead_intent,
    payload.intent_type,
    payload.current_label,
    payload.label,
  );

  return normalizeClassificationLabel(
    {
      ...rowLabels,
      ...annotationLabel,
      intent:
        annotationLabel.intent ??
        rowLabels.intent ??
        (inferredIntent !== "none" ? inferredIntent : undefined),
      sentiment:
        annotationLabel.sentiment ??
        rowLabels.sentiment ??
        row.baseline_sentiment ??
        row.sentiment ??
        payload.baseline_sentiment ??
        payload.sentiment,
      topic:
        annotationLabel.topic ??
        rowLabels.topic ??
        row.baseline_topic ??
        row.topic ??
        payload.baseline_topic ??
        payload.topic,
    },
    fallback,
  );
}

function supabasePostToMention(row: SupabaseRow, annotationByKey: Map<string, SupabaseRow>): Mention {
  const payload = readPayload(row);
  const platform = String(row.platform || row.source || payload.platform || payload.source || "");
  const postId = String(row.post_id || row.id || payload.post_id || "");
  const annotation = findAnnotation(annotationByKey, platform, postId);
  const postContent = readFirstText(
    row.text,
    payload.text,
    payload.content,
    payload.clean_text,
    payload.processed_text,
    payload.caption,
    payload.title,
  );
  const label = getSupabaseLabel(row, annotation, {
    sentiment: mapSentiment(row.baseline_sentiment ?? row.sentiment ?? payload.sentiment),
    topic: [],
    relevance: true,
  });

  return {
    id: postId,
    parent_id: null,
    workspace_id: String(row.brand || row.brand_slug || payload.brand || payload.workspace_id || ""),
    platform: mapSourceToPlatform(platform),
    content: postContent,
    post_content: postContent,
    content_type: "post",
    original_content: postContent,
    author: readFirstText(row.author, payload.author, payload.tac_gia) || "N/A",
    sentiment: label.sentiment || mapSentiment(row.baseline_sentiment ?? row.sentiment ?? payload.sentiment),
    topic: mapTopic(label.topic?.[0] ?? row.baseline_topic ?? row.topic ?? payload.topic),
    credibility_score:
      typeof row.baseline_confidence === "number"
        ? Math.round(row.baseline_confidence * 100)
        : 100,
    created_at: parseDate(row.updated_at || row.created_at || row.crawled_at || row.posted_at),
    posted_at: parseDate(row.posted_at || payload.thoi_gian_dang || payload.posted_at || row.created_at),
    url: normalizeOptionalUrl(row.url, row.post_url, row.source_url, payload.url),
    labels: label,
  };
}

function supabaseCommentToMention(
  row: SupabaseRow,
  postById: Map<string, Mention>,
  annotationByKey: Map<string, SupabaseRow>,
): Mention {
  const payload = readPayload(row);
  const platform = String(row.platform || payload.platform || "");
  const postId = String(row.post_id || payload.post_id || "");
  const commentId = String(row.comment_id || row.id || payload.comment_id || "");
  const parentCommentId = normalizeOptionalText(row.parent_comment_id || payload.parent_comment_id);
  const post = postById.get(postId);
  const annotation = findAnnotation(annotationByKey, platform, postId, commentId);
  const commentContent = readFirstText(
    row.text,
    payload.text,
    payload.comment,
    payload.clean_text,
    payload.processed_text,
    payload.content,
  );
  const label = getSupabaseLabel(row, annotation, {
    sentiment: mapSentiment(row.baseline_sentiment ?? row.sentiment ?? payload.sentiment),
    topic: [],
    relevance: true,
  });

  return {
    id: commentId,
    parent_id: parentCommentId || postId || null,
    workspace_id: String(row.brand || payload.brand || post?.workspace_id || ""),
    platform: mapSourceToPlatform(platform),
    content: commentContent,
    post_content: post?.post_content,
    comment_content: commentContent,
    content_type: parentCommentId ? "reply" : "comment",
    original_content: commentContent,
    author: readFirstText(row.username, row.author, payload.username, payload.author) || "N/A",
    sentiment: label.sentiment || mapSentiment(row.baseline_sentiment ?? row.sentiment ?? payload.sentiment),
    topic: mapTopic(label.topic?.[0] ?? row.baseline_topic ?? row.topic ?? payload.topic),
    credibility_score:
      typeof row.baseline_confidence === "number"
        ? Math.round(row.baseline_confidence * 100)
        : 100,
    created_at: parseDate(row.updated_at || row.created_at || row.crawled_at || row.posted_at),
    posted_at: parseDate(row.posted_at || payload.gio_comment || payload.posted_at || row.created_at),
    url: normalizeOptionalUrl(row.url, post?.url, payload.url),
    labels: label,
  };
}

async function fetchSupabaseMentions(opts: FetchOptions): Promise<Mention[]> {
  const config = getSupabaseConfig();
  const maxPosts = opts.maxMentions || 200;
  const postColumns = [
    "post_id",
    "platform",
    "source",
    "brand",
    "brand_slug",
    "author",
    "contact",
    "language",
    "posted_at",
    "url",
    "payload_json",
  ];
  const commentColumns = [
    "comment_id",
    "post_id",
    "parent_comment_id",
    "platform",
    "username",
    "contact",
    "text",
    "posted_at",
    "url",
    "payload_json",
  ];

  let postRows: SupabaseRow[];
  try {
    postRows = await loadSupabaseRowsWithSelectFallback(
      config,
      "posts",
      postColumns,
      { order: "posted_at.desc.nullslast" },
      Math.min(maxPosts, 100),
      ["post_id"],
    );
  } catch (error) {
    if (!isSupabaseRecoverableReadError(error, "posts")) throw error;
    console.warn("[DashboardService] Supabase posts sorted fetch failed, retrying without order:", error);
    try {
      postRows = await loadSupabaseRowsWithSelectFallback(
        config,
        "posts",
        postColumns,
        {},
        Math.min(maxPosts, 100),
        ["post_id"],
      );
    } catch (fallbackError) {
      if (!isSupabaseRecoverableReadError(fallbackError, "posts")) throw fallbackError;
      console.warn("[DashboardService] Supabase posts fallback fetch failed, retrying minimal columns:", fallbackError);
      postRows = await loadSupabaseRowsWithSelectFallback(
        config,
        "posts",
        ["post_id", "platform", "brand", "brand_slug", "posted_at", "payload_json"],
        {},
        50,
        ["post_id"],
      ).catch((minimalError) => {
        console.warn("[DashboardService] Supabase posts minimal fetch failed, continuing without posts:", minimalError);
        return [] as SupabaseRow[];
      });
    }
  }
  const postIds = postRows
    .map((row) => String(row.post_id || row.id || "").trim())
    .filter(Boolean);

  const [commentRows, annotationRows] = await Promise.all([
    loadSupabaseRowsByPostIdsWithSelectFallback(
      config,
      "comments",
      postIds,
      commentColumns,
      {},
      500,
      ["post_id", "comment_id"],
      5,
      true,
    ).catch((err) => {
      if (isSupabaseStatementTimeout(err)) {
        return loadSupabaseRowsByPostIdsWithSelectFallback(
          config,
          "comments",
          postIds.slice(0, 100),
          commentColumns,
          {},
          500,
          ["post_id", "comment_id"],
          3,
          true,
        ).catch(() => [] as SupabaseRow[]);
      }
      throw err;
    }),
    loadSupabaseRowsByPostIds(
      config,
      "annotations",
      postIds,
      { select: "entity_key,platform,post_id,comment_id,label,status,updated_at" },
      2000,
      5,
      true,
    ).catch(() => [] as SupabaseRow[]),
  ]);

  const annotationByKey = new Map<string, SupabaseRow>();
  for (const row of annotationRows) {
    const entityKey = String(row.entity_key || "");
    if (entityKey && !annotationByKey.has(entityKey)) annotationByKey.set(entityKey, row);
    const platform = String(row.platform || "");
    const postId = String(row.post_id || "");
    const commentId = normalizeOptionalText(row.comment_id);
    for (const key of buildEntityKeys(platform, postId, commentId)) {
      if (key && !annotationByKey.has(key)) annotationByKey.set(key, row);
    }
  }

  const posts = postRows
    .filter((row) => String(row.post_id || row.id || "").trim())
    .map((row) => supabasePostToMention(row, annotationByKey));
  const postById = new Map(posts.map((post) => [post.id, post]));
  const comments = commentRows
    .filter((row) => String(row.comment_id || row.id || "").trim())
    .map((row) => supabaseCommentToMention(row, postById, annotationByKey));

  return [...posts, ...comments].sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
  );
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

function uniqueRecordsById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (!record.id || seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

function getProfileDisplayName(profile: UserRoleProfile) {
  return profile.displayName || profile.email || "Nhan vien xu ly";
}

function buildLeadWorkflowPayload(
  lead: Lead | undefined,
  data: Partial<Lead>,
  profile: UserRoleProfile,
  auditFields: Record<string, unknown>,
) {
  const mergedLead = { ...(lead || {}), ...data };
  const ownerId = data.owner_id || lead?.owner_id || profile.uid;
  const ownerEmail = data.owner_email || lead?.owner_email || profile.email;
  const ownerName = data.owner_name || lead?.owner_name || getProfileDisplayName(profile);
  const cleanLead = stripUndefinedFields({
    ...mergedLead,
    ...data,
    firebase_uid: ownerId,
    owner_id: ownerId,
    owner_email: ownerEmail,
    owner_name: ownerName,
    ...auditFields,
  });
  const { id: _id, ...payload } = cleanLead;
  return payload;
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
      // ── Mentions ──────────────────────────────────────────────────────────
      // NOTE: No orderBy — avoids Firestore index requirement.
      // We sort in-memory after fetching.
      let mentions = await fetchSupabaseMentions(opts);
      /*
      const legacyFirestoreMentionMapper = (doc: QueryDocumentSnapshot<DocumentData>) => {
        const d = doc.data();
        const labels = d.labels || {};
        const postContent = normalizeOptionalText(
          normalizeText(
            d.post_content ||
              d.post_text ||
              d.post_caption ||
              d.caption ||
              d.title ||
              d.original_post ||
              "",
          ),
        );
        const commentContent = normalizeOptionalText(
          normalizeText(
            d.comment_content ||
              d.comment_text ||
              d.comment ||
              d.clean_text ||
              d.processed_text ||
              d.text ||
              d.content ||
              "",
          ),
        );
        // posted_at = ngày đăng bài thật (post_date → created_at nguồn → fallback crawled_at)
        const postedAtRaw =
          d.post_date ??
          d.posted_at ??
          d.created_at ??
          d.crawled_at ??
          d.uploaded_at;
        const rawBrand = String(d.brand || d.workspace_id || "");
        return {
          id: String(d.id || doc.id),
          parent_id: d.parent_id ? String(d.parent_id) : null,
          workspace_id: rawBrand,
          platform: mapSourceToPlatform(d.source || ""),
          content: commentContent || postContent || "",
          post_content: postContent,
          comment_content: commentContent,
          content_type: ["post", "comment", "reply"].includes(
            String(d.content_type || "").toLowerCase(),
          )
            ? (String(d.content_type).toLowerCase() as Mention["content_type"])
            : undefined,
          original_content: normalizeText(
            d.original_text ||
              d.clean_text ||
              d.processed_text ||
              d.text ||
              d.content ||
              "",
          ),
          author: normalizeText(d.author || d.author_name || "N/A").trim(),
          sentiment: mapSentiment(
            labels.sentiment ?? d.baseline_sentiment ?? d.sentiment,
          ),
          topic: mapTopic(labels.topic ?? d.baseline_topic ?? d.topic),
          credibility_score:
            typeof d.baseline_confidence === "number"
              ? Math.round(d.baseline_confidence * 100)
              : 100,
          created_at: parseDate(
            d.uploaded_at ||
              d.labeled_at ||
              d.crawled_at ||
              d.analyzed_at ||
              d.created_at,
          ),
          posted_at: parseDate(postedAtRaw),
          url: String(d.url || d.post_url || d.source_url || ""),
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
        };
      };
      */

      // Sort in-memory: newest posted_at first
      mentions.sort(
        (a, b) =>
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
      );
      mentions = uniqueRecordsById(mentions);

      const lastMentionDoc = undefined;
      const mentionsSnap = { docs: [] as QueryDocumentSnapshot<DocumentData>[] };

      // ── Workspaces (derived từ brands trong mentions) ─────────────────────
      // Seed với 3 target brands để đảm bảo luôn hiển thị
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

      // ── Leads (Supabase) ────────────────────────────────────────────────
      let leads: Lead[] = [];
      try {
        const sbConfig = getSupabaseConfig();
        const leadsRows = await loadSupabaseRows<Record<string, unknown>>(
          sbConfig,
          "leads",
          { order: "created_at.desc.nullslast", limit: "200" },
          200,
        );
        leads = leadsRows.map((d) => {
          const labels = (d.labels as Record<string, unknown>) || {};
          const intent = mapIntent((d.intent as string) || (labels.intent as string));
          return {
            id: String(d.id),
            mention_id: normalizeOptionalText(d.mention_id || d.source_mention_id),
            source_mention_id: normalizeOptionalText(d.source_mention_id),
            parent_id: d.parent_id ? String(d.parent_id) : null,
            content_type: ["post", "comment", "reply"].includes(
              String(d.content_type || "").toLowerCase(),
            )
              ? (String(d.content_type).toLowerCase() as Lead["content_type"])
              : undefined,
            post_id: normalizeOptionalText(d.post_id),
            workspace_id: String(d.workspace_id || d.brand || ""),
            platform: mapSourceToPlatform(String(d.source || d.platform || "")),
            author: normalizeText(String(d.author || "Khách hàng")).trim(),
            content: String(d.content || d.text || ""),
            intent,
            current_label: d.current_label
              ? mapLabelValue(d.current_label as string)
              : undefined,
            labels: normalizeClassificationLabel(
              (d.labels || d.current_labels || {
                topic: Array.isArray(d.intent_signals) ? d.intent_signals : [],
              }) as Partial<ClassificationLabel>,
              {
                sentiment: (labels.sentiment ?? d.sentiment) as ClassificationLabel["sentiment"],
                relevance:
                  typeof labels.relevance === "boolean"
                    ? labels.relevance
                    : true,
                urgency: labels.urgency as ClassificationLabel["urgency"],
                intent,
              },
            ),
            intent_signals: (d.intent_signals as string[]) || [],
            status: (d.status as Lead["status"]) || "new",
            created_at: parseDate(d.created_at),
            expiry_at: d.expiry_at ? parseDate(d.expiry_at) : undefined,
            url: normalizeOptionalUrl(d.url, d.post_url, d.source_url),
            source_url: normalizeOptionalUrl(d.source_url, d.post_url, d.url),
            label_correction_status: mapLabelCorrectionStatus(
              d.label_correction_status as string | undefined,
            ),
            pending_label_request_id: normalizeOptionalText(
              d.pending_label_request_id,
            ),
            last_label_corrected_at: d.last_label_corrected_at
              ? parseDate(d.last_label_corrected_at)
              : undefined,
            phone: normalizeOptionalText(d.phone),
            email: normalizeOptionalText(d.email),
            zalo_id: normalizeOptionalText(d.zalo_id),
            messenger_id: normalizeOptionalText(d.messenger_id),
            social_profile_url: normalizeOptionalUrl(
              d.social_profile_url,
              d.contact,
              d.profile_url,
            ),
            owner_id: normalizeOptionalText(d.owner_id || d.firebase_uid),
            owner_name: normalizeOptionalText(d.owner_name),
            owner_email: normalizeOptionalText(d.owner_email),
            assigned_at: d.assigned_at ? parseDate(d.assigned_at) : undefined,
            assigned_by: normalizeOptionalText(d.assigned_by),
            claimed_at: d.claimed_at ? parseDate(d.claimed_at) : undefined,
            first_contacted_at: d.first_contacted_at
              ? parseDate(d.first_contacted_at)
              : undefined,
            contact_attempts:
              typeof d.contact_attempts === "number" ? d.contact_attempts : 0,
            last_contact_at: d.last_contact_at
              ? parseDate(d.last_contact_at)
              : undefined,
            pending_result: d.pending_result === true,
            last_action_at: d.last_action_at
              ? parseDate(d.last_action_at)
              : undefined,
            last_action_type: normalizeOptionalText(d.last_action_type) as Lead["last_action_type"],
            last_contact_channel: normalizeOptionalText(d.last_contact_channel),
            result_type: normalizeOptionalText(d.result_type) as Lead["result_type"],
            result_recorded_at: d.result_recorded_at
              ? parseDate(d.result_recorded_at)
              : undefined,
            follow_up_at: d.follow_up_at ? parseDate(d.follow_up_at) : undefined,
            closed_at: d.closed_at ? parseDate(d.closed_at) : undefined,
            sales_status: normalizeOptionalText(d.sales_status) as Lead["sales_status"],
            sales_owner_id: normalizeOptionalText(d.sales_owner_id),
            sales_owner_name: normalizeOptionalText(d.sales_owner_name),
            sales_transferred_at: d.sales_transferred_at
              ? parseDate(d.sales_transferred_at)
              : undefined,
            crm_deal_id: normalizeOptionalText(d.crm_deal_id),
            notes: d.notes ? String(d.notes) : undefined,
            posted_at: d.posted_at ? parseDate(d.posted_at) : undefined,
          };
        });
      } catch {
        // Table chưa tồn tại — bỏ qua
      }

      const persistedLeads = leads;
      const leadById = new Map<string, Lead>();

      mentions.forEach((m) => {
        const labels = m.labels;
        const intent = mapIntent(labels?.intent);
        if (intent === "none" || leadById.has(m.id)) return;

        leadById.set(m.id, {
          id: m.id,
          mention_id: m.id,
          source_mention_id: m.id,
          parent_id: m.parent_id,
          content_type: m.content_type,
          post_id: m.parent_id || m.id,
          workspace_id: m.workspace_id,
          platform: m.platform,
          author: m.author,
          content: m.content,
          intent,
          current_label: undefined,
          labels,
          intent_signals: Array.isArray(labels?.topic) ? labels.topic : (labels?.topic ? [labels.topic] : []),
          status: "new",
          created_at: m.created_at,
          url: m.url,
          source_url: m.url,
          label_correction_status: undefined,
          pending_label_request_id: undefined,
          last_label_corrected_at: undefined,
          phone: undefined,
          email: undefined,
          zalo_id: undefined,
          messenger_id: undefined,
          social_profile_url: undefined,
          owner_id: undefined,
          owner_name: undefined,
          owner_email: undefined,
          assigned_at: undefined,
          assigned_by: undefined,
          claimed_at: undefined,
          first_contacted_at: undefined,
          contact_attempts: 0,
          last_contact_at: undefined,
          pending_result: false,
          last_action_at: undefined,
          last_action_type: undefined,
          last_contact_channel: undefined,
          result_type: undefined,
          result_recorded_at: undefined,
          follow_up_at: undefined,
          closed_at: undefined,
          sales_status: undefined,
          sales_owner_id: undefined,
          sales_owner_name: undefined,
          sales_transferred_at: undefined,
          crm_deal_id: undefined,
          notes: undefined,
          posted_at: m.posted_at,
        });
      });

      persistedLeads.forEach((storedLead) => {
        const mergeKey = [
          storedLead.id,
          storedLead.mention_id,
          storedLead.source_mention_id,
        ].find((key): key is string => Boolean(key && leadById.has(key)));
        const baseLead = mergeKey ? leadById.get(mergeKey) : undefined;

        leadById.set(mergeKey || storedLead.id, {
          ...(baseLead || storedLead),
          ...storedLead,
          id: baseLead?.id || storedLead.id,
          mention_id: storedLead.mention_id || baseLead?.mention_id,
          source_mention_id:
            storedLead.source_mention_id || baseLead?.source_mention_id,
          post_id: storedLead.post_id || baseLead?.post_id,
          workspace_id: storedLead.workspace_id || baseLead?.workspace_id || "",
          platform: storedLead.platform || baseLead?.platform || "news",
          author: storedLead.author || baseLead?.author,
          content: storedLead.content || baseLead?.content || "",
          labels: storedLead.labels || baseLead?.labels,
          intent_signals:
            storedLead.intent_signals.length > 0
              ? storedLead.intent_signals
              : baseLead?.intent_signals || [],
          created_at: storedLead.created_at || baseLead?.created_at || new Date().toISOString(),
          posted_at: storedLead.posted_at || baseLead?.posted_at,
          url: storedLead.url || baseLead?.url,
          source_url: storedLead.source_url || baseLead?.source_url,
        });
      });

      leads = Array.from(leadById.values());
      leads.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      let labelChangeRequests: LabelChangeRequest[] = [];
      try {
        const sbConfig = getSupabaseConfig();
        const requestRows = await loadSupabaseRows<Record<string, unknown>>(
          sbConfig,
          "label_change_requests",
          { order: "requested_at.desc.nullslast" },
          500,
        );
        labelChangeRequests = requestRows.map((d) => {
          const legacyCurrentLabel = mapLabelValue(d.current_label);
          const legacyRequestedLabel = mapLabelValue(d.requested_label);
          const currentLabels = normalizeClassificationLabel(
            d.current_labels as Record<string, unknown> | null | undefined,
            legacyLabelToClassificationLabel(legacyCurrentLabel),
          );
          const requestedLabels = normalizeClassificationLabel(
            d.requested_labels as Record<string, unknown> | null | undefined,
            legacyLabelToClassificationLabel(legacyRequestedLabel),
          );
          return {
            id: String(d.id || ""),
            source_type: ["lead", "mention", "comment", "post"].includes(
              String(d.source_type || "").toLowerCase(),
            )
              ? (String(d.source_type).toLowerCase() as LabelChangeRequest["source_type"])
              : "lead",
            source_id: String(d.source_id || ""),
            lead_id: normalizeOptionalText(d.lead_id),
            mention_id: normalizeOptionalText(d.mention_id),
            workspace_id: String(d.workspace_id || d.brand || ""),
            platform: mapSourceToPlatform(String(d.source || d.platform || "")),
            author: normalizeOptionalText(d.author),
            content_preview: normalizeText(d.content_preview || ""),
            source_url: normalizeOptionalUrl(d.source_url, d.url),
            current_labels: currentLabels,
            requested_labels: requestedLabels,
            changed_fields: mapChangedLabelFields(
              d.changed_fields,
              currentLabels,
              requestedLabels,
            ),
            current_queue:
              d.current_queue !== undefined
                ? mapLabelQueue(d.current_queue)
                : inferQueueFromLabels(currentLabels),
            requested_queue:
              d.requested_queue !== undefined
                ? mapLabelQueue(d.requested_queue)
                : inferQueueFromLabels(requestedLabels),
            current_label: d.current_label ? legacyCurrentLabel : undefined,
            requested_label: d.requested_label ? legacyRequestedLabel : undefined,
            reason_code: String(d.reason_code || "other"),
            reason_note: String(d.reason_note || ""),
            evidence_checked: d.evidence_checked === true,
            status: ["pending", "approved", "rejected", "cancelled"].includes(
              String(d.status || "").toLowerCase(),
            )
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
        labelChangeRequests.sort(
          (a, b) =>
            new Date(b.requested_at).getTime() -
            new Date(a.requested_at).getTime(),
        );
      } catch {
        // Collection chua ton tai - bo qua
      }

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
    lead?: Lead,
  ): Promise<void> {
    if (!profile || !canPerformAction(profile, "update_lead_status")) {
      throw new Error("User is not allowed to update lead status.");
    }
    const auditFields = {
      updated_by: profile.uid,
      updated_by_role: profile.role,
      updated_at: new Date().toISOString(),
    };

    const config = getSupabaseConfig();
    try {
      await upsertSupabaseLead(
        config,
        id,
        buildLeadWorkflowPayload(lead, { status }, profile, auditFields),
      );
    } catch (error) {
      console.error("[DashboardService] updateLeadStatus error:", error);
      throw error;
    }
  }

  /**
   * Cập nhật các thông tin chi tiết nhật ký chăm sóc của lead trên Supabase
   */
  static async updateLeadDetails(
    id: string,
    data: Partial<Lead>,
    profile: UserRoleProfile | null | undefined,
    lead?: Lead,
  ): Promise<void> {
    if (!profile || !canPerformAction(profile, "update_lead_details")) {
      throw new Error("User is not allowed to update lead details.");
    }
    const auditFields = {
      updated_by: profile.uid,
      updated_by_role: profile.role,
      updated_at: new Date().toISOString(),
    };

    const config = getSupabaseConfig();
    try {
      await upsertSupabaseLead(
        config,
        id,
        buildLeadWorkflowPayload(lead, data, profile, auditFields),
      );
    } catch (error) {
      console.error("[DashboardService] updateLeadDetails error:", error);
      throw error;
    }
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
      brand_id: profile.brandId,
      brand_name: profile.brandName,
      status: "pending" as const,
      requested_by: profile.uid,
      requested_by_name: profile.displayName || profile.email,
      requested_by_email: profile.email,
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
