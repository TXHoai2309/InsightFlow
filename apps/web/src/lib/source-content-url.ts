export type SourceContentUrlFields = {
  platform?: string | null;
  source?: string | null;
  content_type?: string | null;
  url?: string | null;
  post_url?: string | null;
  comment_url?: string | null;
  source_comment_url?: string | null;
  original_comment_url?: string | null;
  source_url?: string | null;
  permalink?: string | null;
  original_url?: string | null;
  social_profile_url?: string | null;
};

export type CanonicalSourcePlatform =
  | "facebook"
  | "threads"
  | "tiktok"
  | "youtube"
  | "google_maps"
  | "befood"
  | "news"
  | "unknown";

/** Keep aliases aligned with the seven sources shown by Labeling Tool. */
export function normalizeSourcePlatform(value?: string | null): CanonicalSourcePlatform {
  const platform = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (platform === "facebook" || platform === "fb") return "facebook";
  if (platform === "thread" || platform === "threads") return "threads";
  if (platform === "tiktok" || platform === "tik_tok") return "tiktok";
  if (platform === "youtube" || platform === "yt") return "youtube";
  if (["google_maps", "google_map", "googlemaps", "maps"].includes(platform)) {
    return "google_maps";
  }
  if (["be", "befood", "be_food"].includes(platform)) return "befood";
  if (["news", "news_html", "news_rss", "rss"].includes(platform)) return "news";
  return "unknown";
}

function canonicalHttpUrl(value?: string | null): string | null {
  const raw = String(value || "").trim();
  if (!raw || raw === "#") return null;

  const candidate = raw.startsWith("//") ? `https:${raw}` : raw;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    // Do not serialize via URL: that can alter valid platform deep-link params.
    return candidate;
  } catch {
    return null;
  }
}

function firstCanonical(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const url = canonicalHttpUrl(value);
    if (url) return url;
  }
  return null;
}

function isCommentContent(contentType?: string | null): boolean {
  const value = String(contentType || "").trim().toLowerCase();
  return value === "comment" || value === "reply";
}

/**
 * Resolve source URL with the same contract as Labeling Tool:
 * posts.url / comments.url are canonical and are opened verbatim.
 */
export function getSourceContentUrl(fields: SourceContentUrlFields): string | null {
  const commentContent =
    isCommentContent(fields.content_type) ||
    Boolean(fields.comment_url || fields.source_comment_url || fields.original_comment_url);

  if (commentContent) {
    const directCommentUrl = firstCanonical([
      fields.comment_url,
      fields.source_comment_url,
      fields.original_comment_url,
      fields.url,
    ]);
    if (directCommentUrl) return directCommentUrl;
  }

  const directPostUrl = firstCanonical([
    fields.post_url,
    commentContent ? undefined : fields.url,
    fields.source_url,
    fields.permalink,
    fields.original_url,
  ]);
  if (directPostUrl) return directPostUrl;

  return firstCanonical([fields.social_profile_url]);
}

export function getSourcePostUrl(fields: SourceContentUrlFields): string | null {
  return firstCanonical([
    fields.post_url,
    isCommentContent(fields.content_type) ? undefined : fields.url,
    fields.source_url,
    fields.permalink,
    fields.original_url,
  ]);
}
