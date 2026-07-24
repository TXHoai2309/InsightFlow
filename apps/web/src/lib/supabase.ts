import type { AlertData, ResolutionAttempt, InternalNote } from "@/stores/alert.store";
import { calculateNegativityScore } from "@/lib/negativityScore";
import { getPersistedAlertStatus } from "@/lib/alertWorkflow";

const supabaseUrl = process.env.NEXT_PUBLIC_VPS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_VPS_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function normalizeUrl(url: string): string {
  const trimmed = url.trim().replace(/\/rest\/v1\/?$/, "");
  return trimmed.replace(/\/$/, "");
}

function getEndpoint(table: string, query = ""): string {
  const base = normalizeUrl(supabaseUrl);
  return `${base}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

export async function supabaseRequest<T>(
  table: string,
  query: string,
  init: RequestInit = {}
): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured in environment variables.");
  }
  const response = await fetch(getEndpoint(table, query), {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${table} request failed: ${response.status} - ${text}`);
  }

  if (response.status === 204) return undefined as unknown as T;
  const text = await response.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

function parseDate(field: unknown): string {
  if (!field) return "1970-01-01T00:00:00Z";
  if (field instanceof Date) return field.toISOString();
  const value = String(field).trim();
  if (!value) return "1970-01-01T00:00:00Z";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
  return value.includes("+") || value.endsWith("Z") ? value : `${value}Z`;
}

function toIsoDate(value: string | Date | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizeBrandKey(brand: string): string {
  const normalized = String(brand || "")
    .toLowerCase()
    .replace(/[\s\-_.]/g, "")
    .trim();

  if (normalized.includes("highland")) return "highlandcoffee";
  if (normalized.includes("starbuck")) return "starbucks";
  if (normalized.includes("mixue")) return "mixue";
  return normalized;
}

function extractBrandFromKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const lower = key.toLowerCase();
  if (lower.includes("highland")) return "Highlands Coffee";
  if (lower.includes("starbuck")) return "Starbucks";
  if (lower.includes("mixue")) return "Mixue";
  return null;
}

function formatBrandName(brand: string): string {
  const key = normalizeBrandKey(brand);
  if (key === "highlandcoffee") return "Highlands Coffee";
  if (key === "starbucks") return "Starbucks";
  if (key === "mixue") return "Mixue";
  return brand || "Unknown";
}

function normalizeSource(source: string): string {
  const normalized = String(source || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("google")) return "google_maps";
  if (normalized.includes("befood") || normalized.includes("be")) return "befood";
  if (normalized.includes("thread")) return "thread";
  if (normalized.includes("bao") || normalized.includes("news")) return "news";
  return normalized || "news";
}

function normalizeTopic(topic: unknown): string {
  const firstTopic = Array.isArray(topic) ? topic[0] : topic;
  const normalized = String(firstTopic || "other").toLowerCase().trim();
  const validTopics = new Set([
    "quality",
    "price",
    "service",
    "staff",
    "delivery",
    "experience",
    "legal",
    "operation",
    "competitor",
    "other",
  ]);

  return validTopics.has(normalized) ? normalized : "other";
}

function resolveAlertStatusFromLabel(labelObj: any): string {
  return getPersistedAlertStatus(labelObj);
}

function computeNegativity(params: {
  labelObj: any;
  text: string;
  platform: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}): { severity: string; negativity_score: number } {
  const result = calculateNegativityScore({
    sentiment: String(params.labelObj.sentiment || "neutral").toLowerCase(),
    topic: normalizeTopic(params.labelObj.topic),
    urgency: String(params.labelObj.urgency || "normal").toLowerCase(),
    likeCount: params.likeCount,
    commentCount: params.commentCount,
    shareCount: params.shareCount,
    platform: params.platform,
    text: params.text,
  });
  return { severity: result.severity, negativity_score: result.score };
}

interface SupabaseAnnotationRow {
  annotation_id: string;
  entity_key: string;
  platform: string;
  entity_type: "post" | "comment";
  post_id: string;
  comment_id: string | null;
  assignee: string;
  label: string | Record<string, any> | null;
  note: string | null;
  status: string;
  labeled_version: number;
  content_hash: string | null;
  needs_review: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabasePostRow {
  platform: string;
  post_id: string;
  url: string | null;
  source: string | null;
  brand_slug: string | null;
  brand: string | null;
  author: string | null;
  contact: string | null;
  language: string | null;
  posted_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  view_count: number | null;
  reply_count: number | null;
  star_count: number | null;
  payload_json: Record<string, any> | null;
}

interface SupabaseCommentRow {
  platform: string;
  post_id: string;
  comment_id: string;
  parent_comment_id: string | null;
  url: string | null;
  username: string | null;
  contact: string | null;
  text: string | null;
  posted_at: string | null;
  like_count: number | null;
  reply_count: number | null;
  star_count: number | null;
  comment_level: number;
  payload_json: Record<string, any> | null;
}

function pickBestAnnotationMatch(
  rows: SupabaseAnnotationRow[],
  lookupKey: string
): SupabaseAnnotationRow | null {
  if (rows.length === 0) return null;
  return (
    rows.find((row) => row.entity_key === lookupKey) ||
    rows.find((row) => row.annotation_id === lookupKey) ||
    rows.find((row) => row.comment_id === lookupKey) ||
    rows.find((row) => row.post_id === lookupKey && row.entity_type === "post") ||
    rows[0]
  );
}

async function fetchAnnotationByAnyKey(key: string): Promise<SupabaseAnnotationRow | null> {
  let normalizedKey = key;
  try {
    if (normalizedKey.includes("%")) {
      normalizedKey = decodeURIComponent(normalizedKey);
    }
  } catch {
    // Keep the original value if it is not a valid encoded URI component.
  }

  const lookupKeys = Array.from(new Set([key, normalizedKey].filter(Boolean)));
  const exactColumns = ["entity_key", "annotation_id", "comment_id"] as const;

  for (const lookupKey of lookupKeys) {
    const encodedKey = encodeURIComponent(lookupKey);
    for (const column of exactColumns) {
      const annotations = await supabaseRequest<SupabaseAnnotationRow[]>(
        "annotations",
        `${column}=eq.${encodedKey}&order=updated_at.desc.nullslast&limit=1`
      );
      const match = pickBestAnnotationMatch(annotations || [], lookupKey);
      if (match) return match;
    }

    const postMatches = await supabaseRequest<SupabaseAnnotationRow[]>(
      "annotations",
      `post_id=eq.${encodedKey}&entity_type=eq.post&order=updated_at.desc.nullslast&limit=1`
    );
    const postMatch = pickBestAnnotationMatch(postMatches || [], lookupKey);
    if (postMatch) return postMatch;
  }

  return null;
}

const ALERT_POST_SELECT = [
  "platform",
  "post_id",
  "url",
  "source",
  "brand_slug",
  "brand",
  "author",
  "contact",
  "language",
  "posted_at",
  "like_count",
  "comment_count",
  "share_count",
  "view_count",
  "reply_count",
  "star_count",
  "payload_json",
].join(",");

const ALERT_COMMENT_SELECT = [
  "platform",
  "post_id",
  "comment_id",
  "parent_comment_id",
  "url",
  "username",
  "contact",
  "text",
  "posted_at",
  "like_count",
  "reply_count",
  "star_count",
  "comment_level",
  "payload_json",
].join(",");

const ALERT_BATCH_SELECT: Record<string, string> = {
  posts: ALERT_POST_SELECT,
  comments: ALERT_COMMENT_SELECT,
};

// Fetch rows in batches to avoid URL length limits on in.(...) queries
async function batchFetch<T>(
  table: string,
  column: string,
  ids: string[],
  batchSize = 10
): Promise<T[]> {
  if (ids.length === 0) return [];
  const results: T[] = [];
  const select = ALERT_BATCH_SELECT[table];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const inClause = batch.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
    const query = `${select ? `select=${select}&` : ""}${column}=in.(${inClause})`;
    const rows = await supabaseRequest<T[]>(table, query).catch((err) => {
      console.error(`Failed to fetch batch from ${table}:`, err);
      return [] as T[];
    });
    results.push(...rows);
  }
  return results;
}

export async function fetchSupabaseAlerts(options: {
  since?: string | Date;
  perPlatform?: number;
} = {}): Promise<AlertData[]> {
  const PLATFORMS = ["google_maps", "facebook", "befood", "tiktok", "threads", "news_html"];
  const PER_PLATFORM = options.perPlatform ?? 100;
  const negFilter = encodeURIComponent('"sentiment":"negative"');
  const sinceIso = toIsoDate(options.since);
  const sinceTime = sinceIso ? new Date(sinceIso).getTime() : null;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoISO = threeMonthsAgo.toISOString();

  const effectiveSinceIso = sinceIso || threeMonthsAgoISO;
  const sinceQuery = `&updated_at=gte.${encodeURIComponent(effectiveSinceIso)}`;

  const platformBatches = await Promise.all(
    PLATFORMS.map((p) =>
      supabaseRequest<SupabaseAnnotationRow[]>(
        "annotations",
        `status=eq.completed&platform=eq.${p}&label=like.*${negFilter}*${sinceQuery}&order=updated_at.desc&limit=${PER_PLATFORM}`
      ).catch(() => [] as SupabaseAnnotationRow[])
    )
  );

  const annotations = platformBatches.flat();

  if (annotations.length === 0) {
    return [];
  }

  // Collect unique post ids and comment ids
  const postIds = Array.from(new Set(annotations.map((a) => a.post_id).filter(Boolean)));
  const commentIds = Array.from(
    new Set(annotations.map((a) => a.comment_id).filter(Boolean))
  ) as string[];

  // Fetch posts and comments in batches to avoid URL length limits
  const postsList = await batchFetch<SupabasePostRow>("posts", "post_id", postIds);
  const commentsList = await batchFetch<SupabaseCommentRow>("comments", "comment_id", commentIds);

  const postMap = new Map<string, SupabasePostRow>();
  postsList.forEach((p) => postMap.set(p.post_id, p));

  const commentMap = new Map<string, SupabaseCommentRow>();
  commentsList.forEach((c) => commentMap.set(c.comment_id, c));

  const alerts: AlertData[] = [];

  for (const anno of annotations) {
    try {
      const labelObj = typeof anno.label === "string" ? JSON.parse(anno.label) : anno.label || {};
      const post = postMap.get(anno.post_id);
      const comment = anno.comment_id ? commentMap.get(anno.comment_id) : null;

      const postPayload = post?.payload_json || {};
      const commentPayload = comment?.payload_json || {};

      const brand = formatBrandName(
        String(
          post?.brand ||
          postPayload.brand ||
          extractBrandFromKey(anno.post_id) ||
          extractBrandFromKey(anno.entity_key) ||
          anno.platform ||
          ""
        )
      );
      const source = normalizeSource(
        String(post?.source || postPayload.source || anno.platform || "")
      );

      // Determine text of the alert
      let text = "";
      if (anno.entity_type === "post") {
        text = String(post?.payload_json?.text || post?.url || "");
      } else {
        text = String(comment?.text || commentPayload.text || "");
      }

      const sentiment = String(labelObj.sentiment || "neutral").toLowerCase();
      const topic = normalizeTopic(labelObj.topic);

      const postLikes = Number(post?.like_count || postPayload.like_count || 0);
      const postComments = Number(post?.comment_count || postPayload.comment_count || 0);
      const postShares = Number(post?.share_count || postPayload.share_count || 0);

      const { severity, negativity_score } = computeNegativity({
        labelObj,
        text,
        platform: source,
        likeCount: postLikes,
        commentCount: postComments,
        shareCount: postShares,
      });

      // Parent ID is the post ID for a comment
      const parent_id = anno.entity_type === "comment" ? anno.post_id : null;

      const post_content = String(post?.payload_json?.text || post?.url || "");
      const comment_content = anno.entity_type === "comment" ? text : "";

      const postedAtStr = comment?.posted_at || commentPayload.posted_at || post?.posted_at || postPayload.posted_at || anno.updated_at;
      if (postedAtStr) {
        const postedDate = new Date(postedAtStr);
        const limitDate = new Date();
        limitDate.setMonth(limitDate.getMonth() - 3);
        if (postedDate.getTime() < limitDate.getTime()) {
          continue; // Skip if the original post/comment was published more than 3 months ago
        }
      }

      const alert: AlertData = {
        id: anno.entity_key, // Use entity_key as ID
        annotation_id: anno.annotation_id,
        brand,
        source,
        text,
        sentiment,
        topic,
        severity,
        negativity_score,
        created_at: parseDate(postedAtStr),
        updated_at: parseDate(labelObj.updated_at || anno.updated_at),
        status: resolveAlertStatusFromLabel(labelObj),
        resolved_at: labelObj.resolved_at ? parseDate(labelObj.resolved_at) : undefined,
        collectionName: "annotations",
        url: String(comment?.url || commentPayload.url || post?.url || postPayload.url || ""),
        reach: Number(post?.like_count || postPayload.like_count || 0),
        likes: Number(comment?.like_count || commentPayload.like_count || post?.like_count || postPayload.like_count || 0),
        comments: Number(post?.comment_count || postPayload.comment_count || 0),
        shares: Number(post?.share_count || postPayload.share_count || 0),
        author: String(
          comment?.username || commentPayload.username || post?.author || postPayload.author || "Ẩn danh"
        ),
        title: text.slice(0, 120),
        being_resolved_by: labelObj.being_resolved_by || null,
        being_resolved_at: labelObj.being_resolved_at || null,
        resolution_history: Array.isArray(labelObj.resolution_history)
          ? labelObj.resolution_history
          : undefined,
        resolved_by_email: labelObj.resolved_by_email || null,
        resolved_by_name: labelObj.resolved_by_name || null,
        skipped_at: labelObj.skipped_at || null,
        skipped_by_uid: labelObj.skipped_by_uid || null,
        skipped_by_email: labelObj.skipped_by_email || null,
        skipped_by_name: labelObj.skipped_by_name || null,
        post_content,
        comment_content,
        parent_id,
        content_type: anno.entity_type,
        internal_notes: Array.isArray(labelObj.internal_notes) ? labelObj.internal_notes : undefined,
        post_id: anno.post_id,
        post_url: String(post?.url || postPayload.url || ""),
        post_like_count: postLikes,
        post_comment_count: postComments,
        post_share_count: postShares,
        relevance: typeof labelObj.relevance === "boolean" ? labelObj.relevance : null,
        urgency: labelObj.urgency || null,
        intent: labelObj.intent || null,
        escalation: labelObj.escalation ?? null,
        monitoring_started_at: labelObj.monitoring_started_at || undefined,
        monitoring_duration_hours: labelObj.monitoring_duration_hours || undefined,
        monitoring_initial_comments: labelObj.monitoring_initial_comments || undefined,
        monitoring_initial_likes: labelObj.monitoring_initial_likes || undefined,
        monitoring_initial_shares: labelObj.monitoring_initial_shares || undefined,
        customer_contact_opened_at: labelObj.customer_contact_opened_at || undefined,
        customer_contact_opened_by: labelObj.customer_contact_opened_by || undefined,
        customer_contact_template: labelObj.customer_contact_template || undefined,
        customer_contact_note: labelObj.customer_contact_note || undefined,
        customer_contact_evidence_image: labelObj.customer_contact_evidence_image || undefined,
        customer_response_result: labelObj.customer_response_result || undefined,
        customer_contact_history: Array.isArray(labelObj.customer_contact_history) ? labelObj.customer_contact_history : [],
      };

      alerts.push(alert);
    } catch (e) {
      console.error("Failed to map annotation to AlertData:", anno, e);
    }
  }

  return alerts.filter((a) => {
    if (a.sentiment !== "negative") return false;
    if (sinceTime === null) return true;
    const createdTime = new Date(a.created_at).getTime();
    return Number.isFinite(createdTime) && createdTime >= sinceTime;
  });
}

export async function fetchSingleSupabaseAlert(entityKey: string): Promise<AlertData | null> {
  const anno = await fetchAnnotationByAnyKey(entityKey);
  if (!anno) return null;

  const labelObj = typeof anno.label === "string" ? JSON.parse(anno.label) : anno.label || {};

  const [postsList, commentsList] = await Promise.all([
    anno.post_id
      ? supabaseRequest<SupabasePostRow[]>(
        "posts",
        `post_id=eq.${encodeURIComponent(anno.post_id)}&limit=1`
      ).catch(() => [])
      : Promise.resolve([]),
    anno.comment_id
      ? supabaseRequest<SupabaseCommentRow[]>(
        "comments",
        `comment_id=eq.${encodeURIComponent(anno.comment_id)}&limit=1`
      ).catch(() => [])
      : Promise.resolve([]),
  ]);

  const post = postsList?.[0] || null;
  const comment = commentsList?.[0] || null;

  const postPayload = post?.payload_json || {};
  const commentPayload = comment?.payload_json || {};

  const brand = formatBrandName(
    String(
      post?.brand ||
      postPayload.brand ||
      extractBrandFromKey(anno.post_id) ||
      extractBrandFromKey(anno.entity_key) ||
      anno.platform ||
      ""
    )
  );
  const source = normalizeSource(String(post?.source || postPayload.source || anno.platform || ""));

  let text = "";
  if (anno.entity_type === "post") {
    text = String(post?.payload_json?.text || post?.url || "");
  } else {
    text = String(comment?.text || commentPayload.text || "");
  }

  const sentiment = String(labelObj.sentiment || "neutral").toLowerCase();
  const topic = normalizeTopic(labelObj.topic);

  const singlePostLikes = Number(post?.like_count || postPayload.like_count || 0);
  const singlePostComments = Number(post?.comment_count || postPayload.comment_count || 0);
  const singlePostShares = Number(post?.share_count || postPayload.share_count || 0);

  const { severity, negativity_score } = computeNegativity({
    labelObj,
    text,
    platform: source,
    likeCount: singlePostLikes,
    commentCount: singlePostComments,
    shareCount: singlePostShares,
  });

  const parent_id = anno.entity_type === "comment" ? anno.post_id : null;
  const post_content = String(post?.payload_json?.text || post?.url || "");
  const comment_content = anno.entity_type === "comment" ? text : "";

  return {
    id: anno.entity_key,
    annotation_id: anno.annotation_id,
    brand,
    source,
    text,
    sentiment,
    topic,
    severity,
    negativity_score,
    created_at: parseDate(comment?.posted_at || commentPayload.posted_at || post?.posted_at || postPayload.posted_at || anno.updated_at),
    updated_at: parseDate(labelObj.updated_at || anno.updated_at),
    status: resolveAlertStatusFromLabel(labelObj),
    resolved_at: labelObj.resolved_at ? parseDate(labelObj.resolved_at) : undefined,
    collectionName: "annotations",
    url: String(comment?.url || commentPayload.url || post?.url || postPayload.url || ""),
    reach: Number(post?.like_count || postPayload.like_count || 0),
    likes: Number(comment?.like_count || commentPayload.like_count || post?.like_count || postPayload.like_count || 0),
    comments: Number(post?.comment_count || postPayload.comment_count || 0),
    shares: Number(post?.share_count || postPayload.share_count || 0),
    author: String(
      comment?.username || commentPayload.username || post?.author || postPayload.author || "Ẩn danh"
    ),
    title: text.slice(0, 120),
    being_resolved_by: labelObj.being_resolved_by || null,
    being_resolved_at: labelObj.being_resolved_at || null,
    resolution_history: Array.isArray(labelObj.resolution_history)
      ? labelObj.resolution_history
      : undefined,
    resolved_by_email: labelObj.resolved_by_email || null,
    resolved_by_name: labelObj.resolved_by_name || null,
    skipped_at: labelObj.skipped_at || null,
    skipped_by_uid: labelObj.skipped_by_uid || null,
    skipped_by_email: labelObj.skipped_by_email || null,
    skipped_by_name: labelObj.skipped_by_name || null,
    post_content,
    comment_content,
    parent_id,
    content_type: anno.entity_type,
    internal_notes: Array.isArray(labelObj.internal_notes) ? labelObj.internal_notes : undefined,
    post_id: anno.post_id,
    post_url: String(post?.url || postPayload.url || ""),
    post_like_count: singlePostLikes,
    post_comment_count: singlePostComments,
    post_share_count: singlePostShares,
    relevance: typeof labelObj.relevance === "boolean" ? labelObj.relevance : null,
    urgency: labelObj.urgency || null,
    intent: labelObj.intent || null,
    escalation: labelObj.escalation ?? null,
    monitoring_started_at: labelObj.monitoring_started_at || undefined,
    monitoring_duration_hours: labelObj.monitoring_duration_hours || undefined,
    monitoring_initial_comments: labelObj.monitoring_initial_comments || undefined,
    monitoring_initial_likes: labelObj.monitoring_initial_likes || undefined,
    monitoring_initial_shares: labelObj.monitoring_initial_shares || undefined,
    customer_contact_opened_at: labelObj.customer_contact_opened_at || undefined,
    customer_contact_opened_by: labelObj.customer_contact_opened_by || undefined,
    customer_contact_template: labelObj.customer_contact_template || undefined,
    customer_contact_note: labelObj.customer_contact_note || undefined,
    customer_contact_evidence_image: labelObj.customer_contact_evidence_image || undefined,
    customer_response_result: labelObj.customer_response_result || undefined,
    customer_contact_history: Array.isArray(labelObj.customer_contact_history) ? labelObj.customer_contact_history : [],
  };
}

export async function updateSupabaseAlertLabel(
  entityKey: string,
  updateFn: (existingLabel: any) => any
): Promise<void> {
  const anno = await fetchAnnotationByAnyKey(entityKey);
  if (!anno) {
    throw new Error(`Annotation with entity key ${entityKey} not found.`);
  }

  const existingLabel = typeof anno.label === "string" ? JSON.parse(anno.label) : anno.label || {};
  const updatedLabel = updateFn(existingLabel);

  await supabaseRequest<void>("annotations", `annotation_id=eq.${anno.annotation_id}`, {
    method: "PATCH",
    body: JSON.stringify({
      label: JSON.stringify(updatedLabel),
      updated_at: new Date().toISOString(),
    }),
  });
}

export interface PostComment {
  comment_id: string;
  post_id: string;
  parent_comment_id: string | null;
  username: string;
  text: string;
  posted_at: string;
  like_count: number;
  reply_count: number;
  comment_level: number;
  url: string | null;
  platform: string;
}

export async function fetchCommentsForPost(
  postId: string
): Promise<PostComment[]> {
  if (!postId) return [];

  const encodedPostId = encodeURIComponent(postId);
  const rows = await supabaseRequest<SupabaseCommentRow[]>(
    "comments",
    `post_id=eq.${encodedPostId}&order=posted_at.asc&limit=200`
  ).catch((err) => {
    console.warn("[fetchCommentsForPost] error:", err?.message || err);
    return [] as SupabaseCommentRow[];
  });

  return rows.map((c) => ({
    comment_id: c.comment_id,
    post_id: c.post_id,
    parent_comment_id: c.parent_comment_id || null,
    username: c.username || c.payload_json?.username || "Ẩn danh",
    text: c.text || c.payload_json?.text || "",
    posted_at: c.posted_at || "",
    like_count: Number(c.like_count || 0),
    reply_count: Number(c.reply_count || 0),
    comment_level: Number(c.comment_level || 0),
    url: c.url || c.payload_json?.url || null,
    platform: c.platform || "",
  }));
}
