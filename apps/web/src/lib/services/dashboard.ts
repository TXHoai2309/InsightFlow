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
  getDoc,
  getDocs,
  query,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  deleteField,
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
import { filterByBrandScope } from "@/lib/brandScope";

// ─── Collection names ────────────────────────────────────────────────────────
export const COLLECTION_NAMES = {
  mentions: "insightflow_labels",
  alerts: "alerts",
  leads: "leads",
  labelChangeRequests: "label_change_requests",
  labelChangeHistory: "label_change_history",
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
    .replace(/[-\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");
  if (!normalized) return "unknown";
  return SOURCE_TO_PLATFORM[normalized] ?? (normalized as Platform);
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
export const PLATFORM_META: Record<string, { label: string; color: string; icon?: string }> =
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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");
  if (VALID_TOPICS.has(topic)) {
    return topic as TopicType;
  }
  return (topic || "other") as TopicType;
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
      urgency: "low",
      intent: "hot",
    };
  }
  if (label === "lead_warm") {
    return {
      sentiment: "positive",
      topic: [],
      relevance: true,
      urgency: "low",
      intent: "warm",
    };
  }
  if (label === "lead_cold") {
    return {
      sentiment: "neutral",
      topic: [],
      relevance: true,
      urgency: "low",
      intent: "cold",
    };
  }
  if (label === "crisis_complaint" || label === "crisis_negative_high_risk") {
    return {
      sentiment: "negative",
      topic: ["service"],
      relevance: true,
      urgency: "urgent",
      intent: "none",
    };
  }
  if (label === "crisis_legal") {
    return {
      sentiment: "negative",
      topic: ["other"],
      relevance: true,
      urgency: "urgent",
      intent: "none",
    };
  }
  if (label === "monitoring") {
    return {
      sentiment: "neutral",
      topic: [],
      relevance: true,
      urgency: "medium",
      intent: "none",
    };
  }
  return {
    sentiment: "neutral",
    topic: [],
    relevance: false,
    urgency: "low",
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

interface ParsedContact {
  phone?: string;
  email?: string;
  zalo_id?: string;
  messenger_id?: string;
  social_profile_url?: string;
}

const RE_PHONE_VN = /(?:\+?84|0)\d{9,10}/;
const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const RE_ZALO = /zalo\s*[:\-–]?\s*(\+?84|0)\d{9,10}/i;
const RE_MESSENGER = /(?:m\.me\/[\w.]+|(?:facebook|fb)\.com\/messages\/t\/[\w.]+|messenger\s*[:\-–]?\s*([\w.]+))/i;
const RE_SOCIAL_URL = /https?:\/\/(?:www\.)?(?:facebook|fb|tiktok|youtube|threads\.net|instagram)[\w./-]*/i;

function parseContactString(raw: string | undefined): ParsedContact {
  if (!raw) return {};
  const text = raw.trim();
  if (!text) return {};

  const result: ParsedContact = {};

  const zaloMatch = text.match(RE_ZALO);
  if (zaloMatch) {
    const zaloPhone = text.slice(zaloMatch.index!).match(RE_PHONE_VN);
    if (zaloPhone) result.zalo_id = zaloPhone[0];
  }

  const messengerMatch = text.match(RE_MESSENGER);
  if (messengerMatch) {
    result.messenger_id = messengerMatch[1] || messengerMatch[0];
  }

  const emailMatch = text.match(RE_EMAIL);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = text.match(RE_PHONE_VN);
  if (phoneMatch && !result.zalo_id) {
    result.phone = phoneMatch[0];
  } else if (phoneMatch && result.zalo_id) {
    const allPhones = text.match(new RegExp(RE_PHONE_VN.source, "g")) || [];
    const otherPhone = allPhones.find((p) => p !== result.zalo_id);
    if (otherPhone) result.phone = otherPhone;
  }

  const urlMatch = text.match(RE_SOCIAL_URL);
  if (urlMatch) result.social_profile_url = urlMatch[0];

  if (!result.phone && !result.email && !result.zalo_id && !result.messenger_id && !result.social_profile_url) {
    result.social_profile_url = text;
  }

  return result;
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
  await supabaseWrite(
    config,
    "leads",
    "POST",
    [stripUndefinedFields({ id, ...payload })],
    "on_conflict=id",
    false,
    "resolution=merge-duplicates,return=minimal",
  );
}

async function upsertSupabaseAnnotation(
  config: SupabaseConfig,
  entityKey: string,
  platform: string,
  postId: string,
  commentId: string | null,
  label: ClassificationLabel,
) {
  await supabaseWrite(
    config,
    "annotations",
    "POST",
    [stripUndefinedFields({
      entity_key: entityKey,
      platform,
      post_id: postId,
      comment_id: commentId,
      label: JSON.stringify(label),
      status: "approved",
      updated_at: new Date().toISOString(),
    })],
    "on_conflict=entity_key",
    false,
    "resolution=merge-duplicates,return=minimal",
  );
}

function isSupabaseStatementTimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('"code":"57014"') ||
      error.message.toLowerCase().includes("statement timeout"))
  );
}

function getMissingSupabaseColumn(error: unknown) {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/column\s+\w+\.([A-Za-z0-9_]+)\s+does not exist/);
  return match?.[1] || null;
}

async function loadSupabaseRows<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  params: Record<string, string>,
  maxRows = 10000,
): Promise<T[]> {
  const pageSize = 1000;
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
): Promise<T[]> {
  const rows: T[] = [];
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));

  for (const batch of chunkValues(uniquePostIds, 50)) {
    if (rows.length >= maxRows) break;
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
  }

  return rows;
}

async function loadSupabaseRowsByIds<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  idField: string,
  ids: string[],
  columns: string[],
  extraParams: Record<string, string> = {},
  maxRows = 10000,
): Promise<T[]> {
  if (!ids || ids.length === 0) return [];
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const pageSize = 100;
  const promises: Promise<T[]>[] = [];

  const isAnnotationTable = table === "annotations";
  for (let i = 0; i < unique.length; i += pageSize) {
    if (isAnnotationTable && i >= 1000) break; // Limit to top 1000 IDs to avoid excessive parallel queries
    const chunk = unique.slice(i, i + pageSize);
    const formattedIds = chunk.map((id) => `"${id.replace(/"/g, '\\"')}"`);
    const requestParams = new URLSearchParams({
      ...extraParams,
      [idField]: `in.(${formattedIds.join(",")})`,
      select: columns.join(","),
      limit: String(maxRows), // Fetch up to maxRows to ensure complete candidate list
    });
    promises.push(supabaseRequest<T[]>(config, table, requestParams.toString()));
  }

  const results = await Promise.all(promises);
  let finalResults = results.flat();

  // If order is updated_at desc, sort in JS to ensure true top results across chunks
  if (extraParams.order && extraParams.order.includes("updated_at.desc")) {
    finalResults.sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at as string).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at as string).getTime() : 0;
      return bTime - aTime;
    });
  }

  return finalResults.slice(0, maxRows);
}

async function loadSupabaseRowsByPostIdsWithSelectFallback<T extends SupabaseRow>(
  config: SupabaseConfig,
  table: string,
  postIds: string[],
  columns: string[],
  params: Record<string, string>,
  maxRows = 10000,
  requiredColumns: string[] = [],
): Promise<T[]> {
  const rows: T[] = [];
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));

  for (const batch of chunkValues(uniquePostIds, 20)) {
    if (rows.length >= maxRows) break;
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
  const rowLabels = row.labels && typeof row.labels === "object" ? (row.labels as SupabaseRow) : {};
  const annotationLabel = parseAnnotationLabel(annotation);
  const inferredIntent = inferLeadIntent(
    annotationLabel.intent,
    rowLabels.intent,
    row.intent,
    row.lead_intent,
    row.intent_type,
  );

  return normalizeClassificationLabel(
    {
      ...rowLabels,
      ...annotationLabel,
      intent:
        inferredIntent !== "none"
          ? inferredIntent
          : annotationLabel.intent ?? rowLabels.intent,
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
    contact: normalizeOptionalText(row.contact || payload.contact),
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
    contact: normalizeOptionalText(row.contact || payload.contact),
    labels: label,
  };
}

async function fetchSupabaseMentions(opts: FetchOptions): Promise<Mention[]> {
  const config = getSupabaseConfig();
  const maxMentions = opts.maxMentions || 30000;
  const brandKey = opts.brandKey ? opts.brandKey.toLowerCase().replace(/[\s\-_.]/g, "").trim() : "";
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
    "created_at",
    "url",
    "payload_json",
  ];
  const commentColumns = [
    "comment_id",
    "post_id",
    "platform",
    "username",
    "contact",
    "text",
    "posted_at",
    "created_at",
    "url",
    "payload_json",
  ];
  const annotationColumns = [
    "annotation_id",
    "entity_key",
    "platform",
    "entity_type",
    "post_id",
    "comment_id",
    "assignee",
    "label",
    "status",
    "updated_at",
    "created_at",
  ];

  let annotationRows: SupabaseRow[] = [];
  
  if (brandKey) {
    // ── Brand-First Strategy ──────────────────────────────────────────
    // 1. Fetch posts matching the brand key
    let postIds: string[] = [];
    try {
      let searchTerm = brandKey;
      let displayBrandName = brandKey;
      if (brandKey.includes("highland")) {
        searchTerm = "highlandcoffee";
        displayBrandName = "Highland Coffee";
      } else if (brandKey.includes("starbuck")) {
        searchTerm = "starbucks";
        displayBrandName = "Starbucks";
      } else if (brandKey.includes("mixue")) {
        searchTerm = "mixue";
        displayBrandName = "Mixue";
      }
      const query = new URLSearchParams({
        or: `(brand_slug.eq.${searchTerm},brand.eq.${encodeURIComponent(displayBrandName)})`,
        select: "post_id",
        order: "posted_at.desc.nullslast",
        limit: "1000",
      });
      const brandPosts = await supabaseRequest<SupabaseRow[]>(config, "posts", query.toString());
      postIds = brandPosts.map((p) => String(p.post_id || "").trim()).filter(Boolean);
    } catch (err: any) {
      console.error("[DashboardService] Failed to fetch brand posts:", err);
    }

    if (postIds.length === 0) return [];

    // 2. Fetch completed annotations corresponding to these post IDs per platform
    try {
      const platforms = ["facebook", "tiktok", "youtube", "thread", "be", "google_maps", "news"];
      const perPlatformLimit = Math.max(500, Math.floor(maxMentions / platforms.length));
      const promises = platforms.map((p) =>
        loadSupabaseRowsByIds<SupabaseRow>(
          config,
          "annotations",
          "post_id",
          postIds,
          annotationColumns,
          { platform: p === "be" ? "in.(be,befood)" : (p === "thread" ? "in.(thread,threads)" : `eq.${p}`), status: "eq.completed", order: "updated_at.desc.nullslast" },
          perPlatformLimit,
        ).catch((err: any) => {
          console.warn(`[DashboardService] Failed to fetch annotations for platform ${p}:`, err);
          return [] as SupabaseRow[];
        })
      );
      const results = await Promise.all(promises);
      annotationRows = results.flat();
    } catch (error: any) {
      console.error("[DashboardService] Failed to fetch annotations for brand:", error);
      return [];
    }
  } else {
    // ── Global Strategy (Fallback) ───────────────────────────────────
    try {
      const platforms = ["facebook", "tiktok", "youtube", "thread", "be", "google_maps", "news"];
      const perPlatformLimit = Math.max(500, Math.floor(maxMentions / platforms.length));
      const promises = platforms.map((p) =>
        loadSupabaseRows<SupabaseRow>(
          config,
          "annotations",
          { platform: p === "be" ? "in.(be,befood)" : (p === "thread" ? "in.(thread,threads)" : `eq.${p}`), status: "eq.completed", order: "updated_at.desc.nullslast" },
          perPlatformLimit,
        ).catch((err: any) => {
          console.warn(`[DashboardService] Failed to fetch annotations for platform ${p}:`, err);
          return [] as SupabaseRow[];
        })
      );
      const results = await Promise.all(promises);
      annotationRows = results.flat();
    } catch (error: any) {
      console.error("[DashboardService] Failed to fetch annotations:", error);
      return [];
    }
  }

  const postIds = Array.from(
    new Set(annotationRows.map((row: SupabaseRow) => String(row.post_id || "").trim())),
  ).filter(Boolean);

  const commentIds = Array.from(
    new Set(
      annotationRows
        .filter((row: SupabaseRow) => row.entity_type === "comment")
        .map((row: SupabaseRow) => String(row.comment_id || "").trim()),
    ),
  ).filter(Boolean);

  const [postRows, commentRows] = await Promise.all([
    loadSupabaseRowsByIds<SupabaseRow>(config, "posts", "post_id", postIds, postColumns).catch((err: any) => {
      console.warn("[DashboardService] Failed to fetch post details:", err);
      return [] as SupabaseRow[];
    }),
    loadSupabaseRowsByIds<SupabaseRow>(config, "comments", "comment_id", commentIds, commentColumns).catch((err: any) => {
      console.warn("[DashboardService] Failed to fetch comment details:", err);
      return [] as SupabaseRow[];
    }),
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
    .filter((row: SupabaseRow) => String(row.post_id || row.id || "").trim())
    .map((row: SupabaseRow) => supabasePostToMention(row, annotationByKey));
  const postById = new Map<string, Mention>(posts.map((post: Mention) => [post.id, post] as [string, Mention]));
  const comments = commentRows
    .filter((row: SupabaseRow) => String(row.comment_id || row.id || "").trim())
    .map((row: SupabaseRow) => supabaseCommentToMention(row, postById, annotationByKey));

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
  /** Optional normalized brand scope key passed by dashboard hooks */
  brandKey?: string;
  /** Set a max limit (default: no limit — fetches ALL records) */
  maxMentions?: number;
}

// ─── Main service ─────────────────────────────────────────────────────────────
export class DashboardService {
  /**
   * Fetch raw data from Firestore.
   * Mapping field names Firestore → internal types happens here.
   */
  static async fetchRawData(opts: FetchOptions = {}, profile?: UserRoleProfile | null): Promise<{
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
          labels: normalizeClassificationLabel(
            {
              ...labels,
              topic: labels.topic ?? d.baseline_topic ?? d.topic,
            },
            {
            sentiment: mapSentiment(
              labels.sentiment ?? d.baseline_sentiment ?? d.sentiment,
            ),
            relevance:
              typeof labels.relevance === "boolean" ? labels.relevance : true,
            urgency: labels.urgency,
            intent: labels.intent,
            },
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

      // Pre-seed 3 target brands
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

      // Add brands found in data
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
        a.brand_name.localeCompare(b.brand_name),
      );

      // ── Alerts ────────────────────────────────────────────────────────────
      let alerts: Alert[] = [];
      try {
        const alertsSnap = await getDocs(
          query(collection(dbData, COLLECTION_NAMES.alerts), limit(200)),
        );
        alerts = alertsSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            workspace_id: String(d.workspace_id || d.brand || ""),
            severity: d.severity || "medium",
            signal_type: d.signal_type || "mention_spike",
            message: String(d.message || ""),
            spike_multiplier: d.spike_multiplier,
            affected_mentions_count: d.affected_mentions_count,
            created_at: parseDate(d.created_at),
            status: d.status || "new",
          };
        });
        alerts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } catch {
        // Collection chưa tồn tại — bỏ qua
      }

      // ── Leads: Hybrid Merge ──────────────────────────────────────────────
      // Bước 1: Lấy bản ghi trạng thái xử lý từ Supabase leads table (nếu có)
      const sbLeadsById = new Map<string, Record<string, unknown>>();
      try {
        const sbConfig = getSupabaseConfig();
        const leadsRows = await loadSupabaseRows<Record<string, unknown>>(
          sbConfig,
          "leads",
          { order: "created_at.desc.nullslast" },
          500,
        );
        for (const row of leadsRows) {
          const rowId = String(row.id || row.mention_id || "");
          if (rowId) sbLeadsById.set(rowId, row);
        }
      } catch {
        // Bảng chưa tồn tại hoặc lỗi — bỏ qua, derive từ mentions
      }

      // Bước 2: Luôn derive leads từ Supabase mentions thật (có intent label)
      // rồi merge trạng thái xử lý giao dịch từ Supabase leads table
      const derivedLeadById = new Map<string, Lead>();
      mentions.forEach((m) => {
        const labels = m.labels;
        const intent = inferLeadIntent(
          labels?.intent,
          labels,
          m.labels,
        );
        if (intent === "none" || derivedLeadById.has(m.id)) return;

        const parsed = parseContactString(m.contact);
        const baseLead: Lead = {
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
          intent_signals: Array.isArray(labels?.topic)
            ? labels.topic
            : labels?.topic
              ? [labels.topic]
              : [],
          status: "new",
          created_at: m.created_at,
          url: m.url,
          source_url: m.url,
          label_correction_status: undefined,
          pending_label_request_id: undefined,
          last_label_corrected_at: undefined,
          phone: parsed.phone,
          email: parsed.email,
          zalo_id: parsed.zalo_id,
          messenger_id: parsed.messenger_id,
          social_profile_url: parsed.social_profile_url,
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
        };

        // Merge trạng thái xử lý từ Supabase leads nếu có
        const d = sbLeadsById.get(m.id);
        if (d) {
          const rawCurrentLabels = d.current_labels || d.labels;
          let mergedLabels = baseLead.labels;
          if (rawCurrentLabels) {
            try {
              const parsed = typeof rawCurrentLabels === "string" ? JSON.parse(rawCurrentLabels) : rawCurrentLabels;
              if (parsed && typeof parsed === "object") {
                mergedLabels = normalizeClassificationLabel(parsed);
              }
            } catch (e) {
              console.warn("Failed to parse lead labels:", e);
            }
          }

          derivedLeadById.set(m.id, {
            ...baseLead,
            labels: mergedLabels,
            intent: (mergedLabels?.intent as any) || "none",
            status: (d.status as Lead["status"]) ?? baseLead.status,
            expiry_at: d.expiry_at ? parseDate(d.expiry_at) : undefined,
            label_correction_status: mapLabelCorrectionStatus(d.label_correction_status as string | undefined),
            pending_label_request_id: normalizeOptionalText(d.pending_label_request_id),
            last_label_corrected_at: d.last_label_corrected_at ? parseDate(d.last_label_corrected_at) : undefined,
            phone: normalizeOptionalText(d.phone) || parsed.phone,
            email: normalizeOptionalText(d.email) || parsed.email,
            zalo_id: normalizeOptionalText(d.zalo_id) || parsed.zalo_id,
            messenger_id: normalizeOptionalText(d.messenger_id) || parsed.messenger_id,
            social_profile_url: normalizeOptionalUrl(d.social_profile_url, d.contact, d.profile_url) || parsed.social_profile_url,
            owner_id: normalizeOptionalText(d.owner_id || d.firebase_uid),
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
          });
        } else {
          derivedLeadById.set(m.id, baseLead);
        }
      });

      let leads: Lead[] = Array.from(derivedLeadById.values());
      leads.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      let labelChangeRequests: LabelChangeRequest[] = [];
      try {
        labelChangeRequests = await DashboardService.fetchLabelChangeRequestsFromSupabase(profile);
      } catch (error) {
        console.error("Failed to load label requests for fetchRawData:", error);
      }

      return {
        workspaces,
        mentions,
        alerts,
        leads,
        labelChangeRequests,
        lastMentionDoc,
      };
    } catch (error) {
      console.error("[DashboardService] fetchRawData error:", error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái của lead trên Supabase
   */
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

    if (data.status && !canPerformAction(profile, "update_lead_status")) {
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
        buildLeadWorkflowPayload(lead, data, profile, auditFields),
      );
    } catch (error) {
      console.error("[DashboardService] updateLeadDetails error:", error);
      throw error;
    }
  }

  // ── Stats aggregation ─────────────────────────────────────────────────────

  static async fetchLabelChangeRequestsFromSupabase(
    profile?: UserRoleProfile | null,
  ): Promise<LabelChangeRequest[]> {
    const config = getSupabaseConfig();
    try {
      const rows = await loadSupabaseRows<SupabaseRow>(
        config,
        "label_change_requests",
        {},
        500,
      );
      const mapped = rows.map((d) => {
        const legacyCurrentLabel = mapLabelValue(d.current_label);
        const legacyRequestedLabel = mapLabelValue(d.requested_label);
        const currentLabels = normalizeClassificationLabel(
          d.current_labels as any,
          legacyLabelToClassificationLabel(legacyCurrentLabel),
        );
        const requestedLabels = normalizeClassificationLabel(
          d.requested_labels as any,
          legacyLabelToClassificationLabel(legacyRequestedLabel),
        );
        return {
          id: String(d.id),
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
          updated_at: d.updated_at ? parseDate(d.updated_at) : undefined,
          updated_by: normalizeOptionalText(d.updated_by),
          updated_by_name: normalizeOptionalText(d.updated_by_name),
          updated_by_role: normalizeOptionalText(d.updated_by_role),
          reviewed_by: normalizeOptionalText(d.reviewed_by),
          reviewed_by_name: normalizeOptionalText(d.reviewed_by_name),
          reviewed_at: d.reviewed_at ? parseDate(d.reviewed_at) : undefined,
          review_note: normalizeOptionalText(d.review_note),
          cancelled_at: d.cancelled_at ? parseDate(d.cancelled_at) : undefined,
          cancelled_by: normalizeOptionalText(d.cancelled_by),
          cancelled_by_name: normalizeOptionalText(d.cancelled_by_name),
          cancel_reason: normalizeOptionalText(d.cancel_reason),
          applied_at: d.applied_at ? parseDate(d.applied_at) : undefined,
          audit_log_id: normalizeOptionalText(d.audit_log_id),
          revision_count:
            typeof d.revision_count === "number" ? d.revision_count : undefined,
        } satisfies LabelChangeRequest;
      });

      const scoped = filterByBrandScope(mapped, profile);
      return scoped.sort(
        (a, b) =>
          new Date(b.requested_at).getTime() -
          new Date(a.requested_at).getTime(),
      );
    } catch (error) {
      console.error("Failed to fetch label requests from Supabase:", error);
      return [];
    }
  }

  static async createLabelChangeRequest(
    data: Omit<
      LabelChangeRequest,
      | "id"
      | "status"
      | "requested_by"
      | "requested_by_name"
      | "requested_by_role"
      | "requested_at"
    >,
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
      requested_by_role: profile.role,
      requested_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      updated_by: profile.uid,
      updated_by_role: profile.role,
    });

    const config = getSupabaseConfig();
    const insertedRows = await supabaseWrite<any[]>(
      config,
      "label_change_requests",
      "POST",
      requestData,
    );
    const inserted = insertedRows[0] || { id: "" };
    const newId = inserted.id || "";

    const request: LabelChangeRequest = {
      ...requestData,
      id: newId,
    };

    const correctionData = stripUndefinedFields({
      label_correction_status: "pending",
      pending_label_request_id: newId,
      label_correction_requested_at: nowIso,
      label_correction_requested_by: profile.uid,
      updated_by: profile.uid,
      updated_by_role: profile.role,
      updated_at: nowIso,
    });

    const leadId = data.lead_id || data.source_id;
    try {
      const config = getSupabaseConfig();
      await supabaseWrite(config, "leads", "PATCH", correctionData, `id=eq.${encodeURIComponent(leadId)}`, false);
    } catch {
      // Lead row may not exist yet — ignore
    }

    return request;
  }

  static async updateLabelChangeRequest(
    request: LabelChangeRequest,
    data: Pick<
      LabelChangeRequest,
      | "requested_labels"
      | "changed_fields"
      | "requested_queue"
      | "reason_code"
      | "reason_note"
      | "evidence_checked"
    >,
    profile: UserRoleProfile | null | undefined,
  ): Promise<LabelChangeRequest> {
    if (!profile || !canPerformAction(profile, "create_label_request")) {
      throw new Error("User is not allowed to update label change requests.");
    }
    if (request.status !== "pending") {
      throw new Error("Only pending label change requests can be updated.");
    }
    if (request.requested_by !== profile.uid) {
      throw new Error("Only the requester can update this label change request.");
    }

    const nowIso = new Date().toISOString();
    const updatedRequest: LabelChangeRequest = {
      ...request,
      ...data,
      updated_at: nowIso,
      updated_by: profile.uid,
      updated_by_name: profile.displayName || profile.email,
      updated_by_role: profile.role,
      revision_count: (request.revision_count || 0) + 1,
    };

    const updateData = stripUndefinedFields({
      requested_labels: data.requested_labels,
      changed_fields: data.changed_fields,
      requested_queue: data.requested_queue,
      reason_code: data.reason_code,
      reason_note: data.reason_note,
      evidence_checked: data.evidence_checked,
      updated_at: updatedRequest.updated_at,
      updated_by: updatedRequest.updated_by,
      updated_by_name: updatedRequest.updated_by_name,
      updated_by_role: updatedRequest.updated_by_role,
      revision_count: updatedRequest.revision_count,
    });

    const config = getSupabaseConfig();
    await supabaseWrite(
      config,
      "label_change_requests",
      "PATCH",
      updateData,
      `id=eq.${encodeURIComponent(request.id)}`,
      false,
    );

    await addDoc(
      collection(dbData, COLLECTION_NAMES.labelChangeHistory),
      stripUndefinedFields({
        request_id: request.id,
        action: "updated",
        status: "pending",
        source_type: request.source_type,
        source_id: request.source_id,
        lead_id: request.lead_id,
        mention_id: request.mention_id,
        workspace_id: request.workspace_id,
        platform: request.platform,
        author: request.author,
        content_preview: request.content_preview,
        source_url: request.source_url,
        current_labels: request.current_labels,
        previous_requested_labels: request.requested_labels,
        requested_labels: data.requested_labels,
        changed_fields: data.changed_fields,
        current_queue: request.current_queue,
        requested_queue: data.requested_queue,
        reason_code: data.reason_code,
        reason_note: data.reason_note,
        evidence_checked: data.evidence_checked,
        changed_by: profile.uid,
        changed_by_name: profile.displayName || profile.email,
        changed_by_role: profile.role,
        changed_at: nowIso,
        source: "lead_detail_panel",
      }),
    );

    return updatedRequest;
  }

  static async cancelLabelChangeRequest(
    request: LabelChangeRequest,
    cancelReason: string,
    profile: UserRoleProfile | null | undefined,
  ): Promise<LabelChangeRequest> {
    if (!profile || !canPerformAction(profile, "create_label_request")) {
      throw new Error("User is not allowed to cancel label change requests.");
    }
    if (request.status !== "pending") {
      throw new Error("Only pending label change requests can be cancelled.");
    }
    if (request.requested_by !== profile.uid) {
      throw new Error("Only the requester can cancel this label change request.");
    }

    const nowIso = new Date().toISOString();
    const cancelledRequest: LabelChangeRequest = {
      ...request,
      status: "cancelled",
      updated_at: nowIso,
      updated_by: profile.uid,
      updated_by_name: profile.displayName || profile.email,
      updated_by_role: profile.role,
      cancelled_at: nowIso,
      cancelled_by: profile.uid,
      cancelled_by_name: profile.displayName || profile.email,
      cancel_reason: cancelReason.trim(),
    };

    const cancelData = stripUndefinedFields({
      status: "cancelled",
      cancel_reason: cancelledRequest.cancel_reason,
      cancelled_at: nowIso,
      cancelled_by: profile.uid,
      cancelled_by_name: profile.displayName || profile.email,
      updated_at: nowIso,
      updated_by: profile.uid,
      updated_by_name: profile.displayName || profile.email,
      updated_by_role: profile.role,
    });

    const config = getSupabaseConfig();
    await supabaseWrite(
      config,
      "label_change_requests",
      "PATCH",
      cancelData,
      `id=eq.${encodeURIComponent(request.id)}`,
      false,
    );

    const leadTargetId = request.lead_id || request.source_id;
    try {
      await supabaseWrite(
        config,
        "leads",
        "PATCH",
        {
          label_correction_status: "none",
          pending_label_request_id: null,
          label_correction_requested_at: null,
          label_correction_requested_by: null,
          updated_by: profile.uid,
          updated_by_role: profile.role,
          updated_at: nowIso,
        },
        `id=eq.${encodeURIComponent(leadTargetId)}`,
        false,
      );
    } catch {
      // ignore
    }

    await addDoc(
      collection(dbData, COLLECTION_NAMES.labelChangeHistory),
      stripUndefinedFields({
        request_id: request.id,
        action: "cancelled",
        status: "cancelled",
        source_type: request.source_type,
        source_id: request.source_id,
        lead_id: request.lead_id,
        mention_id: request.mention_id,
        workspace_id: request.workspace_id,
        platform: request.platform,
        author: request.author,
        content_preview: request.content_preview,
        source_url: request.source_url,
        current_labels: request.current_labels,
        requested_labels: request.requested_labels,
        changed_fields: request.changed_fields,
        current_queue: request.current_queue,
        requested_queue: request.requested_queue,
        cancel_reason: cancelledRequest.cancel_reason,
        changed_by: profile.uid,
        changed_by_name: profile.displayName || profile.email,
        changed_by_role: profile.role,
        changed_at: nowIso,
        source: "lead_detail_panel",
      }),
    );

    return cancelledRequest;
  }

  static async approveLabelChangeRequest(
    requestId: string,
    status: "approved" | "edited",
    finalLabel: Record<string, unknown>,
    mentionData: {
      mentionId: string;
      platform: string;
      contentType: string;
      parentId?: string | null;
    },
    leadId: string | undefined,
    reviewer: { uid: string; displayName?: string; email?: string },
    oldLabel?: Record<string, unknown>,
    nextHistory?: any[],
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    const normalizedLabel = normalizeClassificationLabel(finalLabel);

    const config = getSupabaseConfig();
    await supabaseWrite(
      config,
      "label_change_requests",
      "PATCH",
      stripUndefinedFields({
        status,
        final_label: finalLabel,
        reviewed_by: reviewer.uid,
        reviewed_by_name: reviewer.displayName || reviewer.email || "",
        reviewed_at: nowIso,
        applied_at: nowIso,
        updated_at: nowIso,
        history: nextHistory,
      }),
      `id=eq.${encodeURIComponent(requestId)}`,
      false,
    );

    const isComment = mentionData.contentType === "comment" || mentionData.contentType === "reply";
    const postId = isComment ? (mentionData.parentId || "") : mentionData.mentionId;
    const commentId = isComment ? mentionData.mentionId : null;
    const entityKeys = buildEntityKeys(mentionData.platform, postId, commentId);
    if (entityKeys.length > 0) {
      try {
        await upsertSupabaseAnnotation(
          config,
          entityKeys[0],
          mentionData.platform,
          postId,
          commentId,
          normalizedLabel,
        );
      } catch {
        // annotations table may not support on_conflict — ignore
      }
    }

    if (leadId) {
      try {
        await upsertSupabaseLead(config, leadId, {
          labels: normalizedLabel,
          current_labels: normalizedLabel,
          label_correction_status: "approved",
          pending_label_request_id: null,
          last_label_corrected_at: nowIso,
          updated_by: reviewer.uid,
          updated_at: nowIso,
        });
      } catch {
        // Lead row may not exist yet — ignore
      }
    }

    await addDoc(
      collection(dbData, COLLECTION_NAMES.labelChangeHistory),
      stripUndefinedFields({
        request_id: requestId,
        action: status,
        status,
        mention_id: mentionData.mentionId,
        reviewed_by_uid: reviewer.uid,
        reviewed_by_name: reviewer.displayName || reviewer.email || "",
        reviewed_by_email: reviewer.email || "",
        changed_at: nowIso,
        created_at: nowIso,
        source: "brand_manager_review",
        old_label: oldLabel,
        new_label: finalLabel,
      }),
    );
  }

  static async fetchLabelChangeRequests(workspaceId?: string): Promise<{
    requests: Record<string, unknown>[];
    history: Record<string, unknown>[];
  }> {
    const config = getSupabaseConfig();
    const requestsQuery = workspaceId
      ? `workspace_id=eq.${encodeURIComponent(workspaceId)}&order=created_at.desc&limit=200`
      : `order=created_at.desc&limit=200`;
    const historyQuery = workspaceId
      ? `workspace_id=eq.${encodeURIComponent(workspaceId)}&order=created_at.desc&limit=400`
      : `order=created_at.desc&limit=400`;

    const [requests, history] = await Promise.all([
      supabaseRequest<Record<string, unknown>[]>(config, "label_change_requests", requestsQuery),
      supabaseRequest<Record<string, unknown>[]>(config, "label_change_history", historyQuery).catch(() => [] as Record<string, unknown>[]),
    ]);

    return { requests: requests ?? [], history: history ?? [] };
  }

  static async rejectLabelChangeRequest(
    requestId: string,
    status: "rejected" | "cancelled",
    reviewer: { uid: string; displayName?: string; email?: string },
    extra?: { reason?: string; finalLabel?: Record<string, unknown>; oldLabel?: Record<string, unknown>; mentionId?: string; nextHistory?: unknown[] },
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    const config = getSupabaseConfig();

    await supabaseWrite(
      config,
      "label_change_requests",
      "PATCH",
      stripUndefinedFields({
        status,
        reviewed_by: reviewer.uid,
        reviewed_by_name: reviewer.displayName || reviewer.email || "",
        reviewed_at: nowIso,
        updated_at: nowIso,
        history: extra?.nextHistory,
        cancel_reason: extra?.reason,
      }),
      `id=eq.${encodeURIComponent(requestId)}`,
      false,
    );

    await supabaseWrite(
      config,
      "label_change_history",
      "POST",
      [stripUndefinedFields({
        request_id: requestId,
        action: status,
        status,
        mention_id: extra?.mentionId,
        old_label: extra?.oldLabel,
        new_label: extra?.finalLabel,
        reviewed_by_uid: reviewer.uid,
        reviewed_by_name: reviewer.displayName || reviewer.email || "",
        reviewed_by_email: reviewer.email || "",
        note: extra?.reason,
        source: "brand_manager_review",
        changed_at: nowIso,
        created_at: nowIso,
      })],
      "",
      false,
      "return=minimal",
    );
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
    const counts: Record<string, number> = {};

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
    let days = 30;
    if (timeRange === "2d") {
      days = 2;
    } else if (timeRange === "3d") {
      days = 3;
    } else if (timeRange === "5d") {
      days = 5;
    } else if (timeRange === "7d") {
      days = 7;
    } else if (timeRange === "30d") {
      days = 30;
    } else if (timeRange === "all") {
      if (mentions.length === 0) {
        return [];
      }
      const timestamps = mentions.map((m) => new Date(m.posted_at).getTime());
      const minTimestamp = Math.min(...timestamps);
      const diffMs = now - minTimestamp;
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      // Giới hạn tối thiểu 1 ngày, tối đa 90 ngày để tránh render quá tải
      days = Math.max(1, Math.min(90, diffDays));
    } else if (timeRange === "custom") {
      if (mentions.length > 0) {
        const timestamps = mentions.map((m) => new Date(m.posted_at).getTime());
        const minTimestamp = Math.min(...timestamps);
        const maxTimestamp = Math.max(...timestamps, now);
        const diffMs = maxTimestamp - minTimestamp;
        days = Math.max(1, Math.min(90, Math.ceil(diffMs / (24 * 60 * 60 * 1000))));
      } else {
        days = 30;
      }
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
