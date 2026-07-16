type SupabaseRow = Record<string, any>;

export type InteractionSourceType = "alert" | "lead";
export type IdentityConfidence = "high" | "medium";

export interface CustomerHistoryRequester {
  uid: string;
  role: string;
  brandId: string;
  brandName?: string;
}

export interface CustomerInteractionItem {
  id: string;
  sourceId: string;
  contentType: "post" | "comment" | "reply";
  platform: string;
  author: string;
  content: string;
  postedAt: string;
  sourceUrl?: string;
  postId: string;
  commentId?: string;
  parentCommentId?: string;
  parentPostContent?: string;
  sentiment: string;
  intent: string;
  urgency?: string;
  topics: string[];
  classificationStatus: "classified" | "unclassified";
  businessSignals: Array<"lead" | "crisis" | "monitoring">;
  leadStatus?: string;
  crisisStatus?: string;
  isCurrent: boolean;
}

export interface CustomerInteractionHistoryData {
  availability: "available" | "insufficient_identity";
  reason?: string;
  subject?: {
    displayName: string;
    platform: string;
    profileUrl?: string;
    identityMethod: "author_id" | "profile_url";
    identityConfidence: IdentityConfidence;
  };
  summary?: {
    totalInteractions: number;
    firstInteractionAt?: string;
    lastInteractionAt?: string;
    interactionsLast30Days: number;
    sentiment: { positive: number; neutral: number; negative: number; unknown: number };
    leadSignals: number;
    crisisSignals: number;
    latestTransition?: "lead_to_crisis" | "crisis_to_lead";
    truncated: boolean;
  };
  items: CustomerInteractionItem[];
  nextCursor?: string;
}

interface PlatformIdentity {
  platform: string;
  rawPlatform: string;
  method: "author_id" | "profile_url";
  value: string;
  rawContact?: string;
  profileUrl?: string;
  confidence: IdentityConfidence;
}

interface SourceContext {
  sourceType: InteractionSourceType;
  sourceId: string;
  currentItemId: string;
  currentRawId: string;
  platform: string;
  post: SupabaseRow;
  comment?: SupabaseRow;
  author: string;
  brand: string;
  identity: PlatformIdentity | null;
}

const POST_SELECT = [
  "post_id", "platform", "source", "brand", "brand_slug", "author", "contact",
  "posted_at", "created_at", "url", "payload_json",
].join(",");

const COMMENT_SELECT = [
  "comment_id", "post_id", "parent_comment_id", "platform", "username", "contact",
  "text", "posted_at", "created_at", "url", "payload_json",
].join(",");

const ANNOTATION_SELECT = [
  "annotation_id", "entity_key", "platform", "entity_type", "post_id", "comment_id",
  "label", "status", "updated_at", "created_at",
].join(",");

const LEAD_SELECT = [
  "id", "mention_id", "source_mention_id", "post_id", "content_type", "workspace_id",
  "brand", "platform", "source", "author", "social_profile_url", "profile_url", "contact",
  "status", "intent", "labels", "created_at", "updated_at",
].join(",");

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return { url: url.replace(/\/+$/, ""), key };
}

async function supabaseRows(
  table: string,
  params: URLSearchParams,
): Promise<SupabaseRow[]> {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${table} query failed (${response.status}): ${message.slice(0, 300)}`);
  }
  return (await response.json()) as SupabaseRow[];
}

function readPayload(row?: SupabaseRow) {
  return row?.payload_json && typeof row.payload_json === "object" ? row.payload_json : {};
}

function readText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function normalizePlatform(value: unknown) {
  const platform = String(value || "").trim().toLowerCase();
  if (platform === "threads") return "thread";
  if (platform === "befood") return "be";
  return platform;
}

function platformAliases(platform: string) {
  if (platform === "thread") return ["thread", "threads"];
  if (platform === "be") return ["be", "befood"];
  return [platform];
}

export function normalizeBrand(value: unknown) {
  const brand = String(value || "").toLowerCase().replace(/[\s_.-]/g, "").trim();
  if (brand.includes("highland")) return "highlandcoffee";
  if (brand.includes("starbuck")) return "starbucks";
  if (brand.includes("mixue")) return "mixue";
  return brand;
}

export function normalizeProfileUrl(value: unknown, platform: string): string | null {
  const raw = String(value || "").trim();
  if (!/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const allowed =
      (platform === "facebook" && host.includes("facebook.com")) ||
      (platform === "tiktok" && host.includes("tiktok.com")) ||
      (platform === "thread" && (host.includes("threads.net") || host.includes("threads.com"))) ||
      (platform === "youtube" && (host.includes("youtube.com") || host.includes("youtu.be"))) ||
      (platform === "google_maps" && host.includes("google.")) ||
      platform === "be";
    if (!allowed) return null;

    const contentPath = /\/(watch|video|videos|post|posts|reel|reels|shorts|comment|comments)\b/i;
    if (contentPath.test(url.pathname)) return null;
    if (platform === "facebook" && url.pathname.toLowerCase() === "/profile.php") {
      const profileId = url.searchParams.get("id");
      url.search = profileId ? `?id=${encodeURIComponent(profileId)}` : "";
    } else {
      url.search = "";
    }
    url.hash = "";
    url.hostname = host;
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return null;
  }
}

export function resolvePlatformIdentity(row: SupabaseRow): PlatformIdentity | null {
  const payload = readPayload(row);
  const rawPlatform = readText(row.platform, row.source, payload.platform, payload.source);
  const platform = normalizePlatform(rawPlatform);
  const authorId = readText(
    row.platform_author_id,
    payload.author_id,
    payload.channel_id,
  );
  if (authorId) {
    return {
      platform,
      rawPlatform,
      method: "author_id",
      value: authorId,
      confidence: "high",
      profileUrl: normalizeProfileUrl(row.contact || payload.contact, platform) || undefined,
    };
  }

  const rawContact = readText(row.platform_profile_url, row.contact, payload.contact);
  const profileUrl = normalizeProfileUrl(rawContact, platform);
  if (!profileUrl) return null;
  return {
    platform,
    rawPlatform,
    method: "profile_url",
    value: profileUrl,
    rawContact,
    profileUrl,
    confidence: "medium",
  };
}

function inFilter(values: string[]) {
  const unique = Array.from(new Set(values.filter(Boolean)));
  return `in.(${unique.map((value) => `"${value.replace(/"/g, "\\\"")}"`).join(",")})`;
}

async function queryOne(table: string, select: string, column: string, value: string) {
  if (!value) return null;
  const params = new URLSearchParams({ select, limit: "1" });
  params.set(column, `eq.${value}`);
  return (await supabaseRows(table, params))[0] || null;
}

async function queryAnnotation(sourceId: string) {
  for (const column of ["entity_key", "annotation_id", "comment_id"] as const) {
    const row = await queryOne("annotations", ANNOTATION_SELECT, column, sourceId);
    if (row) return row;
  }
  return null;
}

async function findRawSource(ids: string[], preferredType?: string, postId?: string) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (preferredType !== "post") {
    for (const id of uniqueIds) {
      const comment = await queryOne("comments", COMMENT_SELECT, "comment_id", id);
      if (comment) {
        const post = await queryOne("posts", POST_SELECT, "post_id", String(comment.post_id || postId || ""));
        if (post) return { post, comment };
      }
    }
  }
  for (const id of Array.from(new Set([postId, ...uniqueIds].filter(Boolean) as string[]))) {
    const post = await queryOne("posts", POST_SELECT, "post_id", id);
    if (post) return { post, comment: undefined };
  }
  return null;
}

async function resolveSourceContext(sourceType: InteractionSourceType, sourceId: string): Promise<SourceContext | null> {
  let lead: SupabaseRow | null = null;
  let annotation: SupabaseRow | null = null;
  let raw: { post: SupabaseRow; comment?: SupabaseRow } | null = null;

  if (sourceType === "lead") {
    lead = await queryOne("leads", LEAD_SELECT, "id", sourceId);
    const ids = lead
      ? [lead.mention_id, lead.source_mention_id, lead.id].map((value) => String(value || ""))
      : [sourceId];
    raw = await findRawSource(ids, lead?.content_type, lead?.post_id ? String(lead.post_id) : undefined);
    if (!raw) annotation = await queryAnnotation(sourceId);
  } else {
    annotation = await queryAnnotation(sourceId);
  }

  if (!raw && annotation) {
    raw = await findRawSource(
      [String(annotation.comment_id || ""), String(annotation.post_id || "")],
      String(annotation.entity_type || ""),
      String(annotation.post_id || ""),
    );
  }
  if (!raw) raw = await findRawSource([sourceId]);
  if (!raw) return null;

  const sourceRow = raw.comment || raw.post;
  const postPayload = readPayload(raw.post);
  const sourcePayload = readPayload(sourceRow);
  const platform = normalizePlatform(sourceRow.platform || raw.post.platform);
  const currentRawId = String(raw.comment?.comment_id || raw.post.post_id || sourceId);
  const contentType = raw.comment
    ? raw.comment.parent_comment_id ? "reply" : "comment"
    : "post";
  return {
    sourceType,
    sourceId,
    currentRawId,
    currentItemId: `${contentType}:${platform}:${currentRawId}`,
    platform,
    post: raw.post,
    comment: raw.comment,
    author: readText(
      raw.comment?.username,
      sourcePayload.username,
      lead?.author,
      raw.post.author,
      postPayload.author,
      "Ẩn danh",
    ),
    brand: readText(raw.post.brand_slug, raw.post.brand, postPayload.brand, lead?.workspace_id, lead?.brand),
    identity: resolvePlatformIdentity(sourceRow),
  };
}

async function queryIdentityRows(table: "posts" | "comments", identity: PlatformIdentity) {
  const params = new URLSearchParams({
    select: table === "posts" ? POST_SELECT : COMMENT_SELECT,
    order: "posted_at.desc.nullslast",
    limit: "1000",
  });
  params.set("platform", inFilter(platformAliases(identity.platform)));
  if (identity.method === "author_id") {
    params.set("payload_json->>author_id", `eq.${identity.value}`);
  } else {
    const variants = Array.from(new Set([
      identity.rawContact || "",
      identity.profileUrl || "",
      identity.profileUrl ? `${identity.profileUrl}/` : "",
    ].filter(Boolean)));
    params.set("contact", inFilter(variants));
  }
  return supabaseRows(table, params);
}

async function rowsByIds(table: string, select: string, column: string, ids: string[], extra?: Record<string, string>) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const result: SupabaseRow[] = [];
  for (let index = 0; index < uniqueIds.length; index += 40) {
    const batch = uniqueIds.slice(index, index + 40);
    const params = new URLSearchParams({ select, limit: "2000", ...(extra || {}) });
    params.set(column, inFilter(batch));
    result.push(...(await supabaseRows(table, params)));
  }
  return result;
}

function parseLabel(row?: SupabaseRow) {
  if (!row) return {} as SupabaseRow;
  const raw = row.label ?? row.labels ?? row.current_labels;
  if (raw && typeof raw === "object") return raw as SupabaseRow;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as SupabaseRow; } catch { return {} as SupabaseRow; }
  }
  return {} as SupabaseRow;
}

function topicList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizeSentiment(value: unknown) {
  const sentiment = String(value || "").toLowerCase();
  return ["positive", "neutral", "negative"].includes(sentiment) ? sentiment : "unknown";
}

function normalizeIntent(value: unknown) {
  const intent = String(value || "").toLowerCase();
  return ["hot", "warm", "cold"].includes(intent) ? intent : "none";
}

function crisisStatus(label: SupabaseRow) {
  const raw = String(label.status || label.resolution_status || "").toLowerCase();
  if (label.resolved_at || label.monitoring_started_at || ["resolved", "completed", "monitoring", "responded"].includes(raw)) return "resolved";
  if (["contact_failed", "contact_unsuccessful"].includes(raw)) return "contact_failed";
  if (label.being_resolved_by || ["resolving", "processing", "acknowledged", "in_progress", "contact_waiting"].includes(raw)) return raw === "contact_waiting" ? "contact_waiting" : "processing";
  return "new";
}

function encodeCursor(item: CustomerInteractionItem) {
  return Buffer.from(JSON.stringify([item.postedAt, item.id])).toString("base64url");
}

function decodeCursor(value?: string) {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return Array.isArray(decoded) && decoded.length === 2 ? decoded.map(String) : null;
  } catch {
    return null;
  }
}

export async function getCustomerInteractionHistory(options: {
  sourceType: InteractionSourceType;
  sourceId: string;
  requester: CustomerHistoryRequester;
  cursor?: string;
  limit?: number;
}): Promise<CustomerInteractionHistoryData | null> {
  const context = await resolveSourceContext(options.sourceType, options.sourceId);
  if (!context) return null;

  if (normalizeBrand(context.brand) !== normalizeBrand(options.requester.brandId || options.requester.brandName)) {
    const error = new Error("Interaction source is outside the user's brand scope.");
    (error as any).statusCode = 403;
    throw error;
  }

  if (!context.identity) {
    return {
      availability: "insufficient_identity",
      reason: "source_has_no_stable_platform_identity",
      items: [],
    };
  }

  const [postRows, commentRows] = await Promise.all([
    queryIdentityRows("posts", context.identity),
    queryIdentityRows("comments", context.identity),
  ]);
  const relatedPostIds = Array.from(new Set([
    ...postRows.map((row) => String(row.post_id || "")),
    ...commentRows.map((row) => String(row.post_id || "")),
  ].filter(Boolean)));
  const parentPosts = await rowsByIds("posts", POST_SELECT, "post_id", relatedPostIds);
  const postById = new Map(parentPosts.map((row) => [String(row.post_id), row]));
  const scopedPosts = postRows.filter((row) => normalizeBrand(row.brand_slug || row.brand || readPayload(row).brand) === normalizeBrand(context.brand));
  const scopedComments = commentRows.filter((row) => {
    const parent = postById.get(String(row.post_id));
    return parent && normalizeBrand(parent.brand_slug || parent.brand || readPayload(parent).brand) === normalizeBrand(context.brand);
  });

  const scopedPostIds = Array.from(new Set([
    ...scopedPosts.map((row) => String(row.post_id)),
    ...scopedComments.map((row) => String(row.post_id)),
  ]));
  const annotations = await rowsByIds(
    "annotations",
    ANNOTATION_SELECT,
    "post_id",
    scopedPostIds,
    { order: "updated_at.desc.nullslast" },
  );
  const sourceIds = Array.from(new Set([
    ...scopedPosts.map((row) => String(row.post_id)),
    ...scopedComments.map((row) => String(row.comment_id)),
  ]));
  const leadRows = [
    ...(await rowsByIds("leads", LEAD_SELECT, "mention_id", sourceIds)),
    ...(await rowsByIds("leads", LEAD_SELECT, "source_mention_id", sourceIds)),
  ];

  const annotationByComment = new Map<string, SupabaseRow>();
  const annotationByPost = new Map<string, SupabaseRow>();
  annotations.forEach((row) => {
    const commentId = String(row.comment_id || "");
    const postId = String(row.post_id || "");
    if (commentId && !annotationByComment.has(commentId)) annotationByComment.set(commentId, row);
    if (postId && !commentId && !annotationByPost.has(postId)) annotationByPost.set(postId, row);
  });
  const leadBySource = new Map<string, SupabaseRow>();
  leadRows.forEach((row) => {
    [row.id, row.mention_id, row.source_mention_id].map(String).filter(Boolean).forEach((key) => {
      if (!leadBySource.has(key)) leadBySource.set(key, row);
    });
  });

  const buildItem = (row: SupabaseRow, type: "post" | "comment" | "reply"): CustomerInteractionItem => {
    const isPost = type === "post";
    const sourceId = String(isPost ? row.post_id : row.comment_id);
    const postId = String(row.post_id || sourceId);
    const parentPost = isPost ? row : postById.get(postId);
    const payload = readPayload(row);
    const annotation = isPost ? annotationByPost.get(sourceId) : annotationByComment.get(sourceId);
    const label = parseLabel(annotation);
    const lead = leadBySource.get(sourceId);
    const leadLabel = parseLabel(lead);
    const sentiment = normalizeSentiment(label.sentiment ?? row.sentiment ?? payload.sentiment ?? payload.baseline_sentiment);
    const intent = normalizeIntent(label.intent ?? lead?.intent ?? leadLabel.intent ?? payload.intent);
    const urgency = readText(label.urgency, payload.urgency) || undefined;
    const topics = topicList(label.topic ?? payload.topic ?? payload.baseline_topic);
    const businessSignals: Array<"lead" | "crisis" | "monitoring"> = [];
    if (intent !== "none") businessSignals.push("lead");
    if (sentiment === "negative" || ["urgent", "high"].includes(String(urgency || "").toLowerCase())) businessSignals.push("crisis");
    if (businessSignals.length === 0) businessSignals.push("monitoring");
    const platform = normalizePlatform(row.platform || parentPost?.platform);
    const id = `${type}:${platform}:${sourceId}`;
    const parentPayload = readPayload(parentPost);
    return {
      id,
      sourceId,
      contentType: type,
      platform,
      author: readText(row.username, row.author, payload.username, payload.author, context.author, "Ẩn danh"),
      content: readText(row.text, payload.text, payload.comment, payload.content, row.url),
      postedAt: readText(row.posted_at, payload.posted_at, row.created_at, new Date(0).toISOString()),
      sourceUrl: readText(row.url, payload.url, parentPost?.url) || undefined,
      postId,
      commentId: isPost ? undefined : sourceId,
      parentCommentId: isPost ? undefined : readText(row.parent_comment_id, payload.parent_comment_id) || undefined,
      parentPostContent: isPost ? undefined : readText(parentPayload.text, parentPost?.url) || undefined,
      sentiment,
      intent,
      urgency,
      topics,
      classificationStatus: annotation ? "classified" : "unclassified",
      businessSignals,
      leadStatus: lead ? readText(lead.status, "new") : undefined,
      crisisStatus: businessSignals.includes("crisis") ? crisisStatus(label) : undefined,
      isCurrent: id === context.currentItemId || sourceId === context.currentRawId,
    };
  };

  const items = [
    ...scopedPosts.map((row) => buildItem(row, "post")),
    ...scopedComments.map((row) => buildItem(row, row.parent_comment_id ? "reply" : "comment")),
  ].sort((left, right) => {
    const timeDiff = new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
    return timeDiff || right.id.localeCompare(left.id);
  });

  const cursor = decodeCursor(options.cursor);
  const startIndex = cursor
    ? Math.max(0, items.findIndex((item) => item.postedAt === cursor[0] && item.id === cursor[1]) + 1)
    : 0;
  const requestedLimit = Number(options.limit || 20);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, requestedLimit))
    : 20;
  const pageItems = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sentiment = { positive: 0, neutral: 0, negative: 0, unknown: 0 };
  items.forEach((item) => { sentiment[item.sentiment as keyof typeof sentiment] += 1; });
  const chronological = [...items].reverse();
  let latestTransition: "lead_to_crisis" | "crisis_to_lead" | undefined;
  let previousSignal: "lead" | "crisis" | undefined;
  chronological.forEach((item) => {
    const currentSignal = item.businessSignals.includes("crisis")
      ? "crisis"
      : item.businessSignals.includes("lead") ? "lead" : undefined;
    if (previousSignal && currentSignal && previousSignal !== currentSignal) {
      latestTransition = previousSignal === "lead" ? "lead_to_crisis" : "crisis_to_lead";
    }
    if (currentSignal) previousSignal = currentSignal;
  });

  return {
    availability: "available",
    subject: {
      displayName: context.author,
      platform: context.identity.platform,
      profileUrl: context.identity.profileUrl,
      identityMethod: context.identity.method,
      identityConfidence: context.identity.confidence,
    },
    summary: {
      totalInteractions: items.length,
      firstInteractionAt: items.length > 0 ? items[items.length - 1].postedAt : undefined,
      lastInteractionAt: items[0]?.postedAt,
      interactionsLast30Days: items.filter((item) => new Date(item.postedAt).getTime() >= thirtyDaysAgo).length,
      sentiment,
      leadSignals: items.filter((item) => item.businessSignals.includes("lead")).length,
      crisisSignals: items.filter((item) => item.businessSignals.includes("crisis")).length,
      latestTransition,
      truncated: postRows.length >= 1000 || commentRows.length >= 1000,
    },
    items: pageItems,
    nextCursor: hasMore && pageItems.length > 0 ? encodeCursor(pageItems[pageItems.length - 1]) : undefined,
  };
}
