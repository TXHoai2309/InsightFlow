import type { AlertData } from "@/stores/alert.store";

type AlertSourceFields = Pick<
  AlertData,
  | "url"
  | "post_url"
  | "comment_url"
  | "source_url"
  | "comment_id"
  | "source_id"
  | "content_type"
  | "source"
  | "text"
  | "comment_content"
>;

function isUsableUrl(value?: string | null): value is string {
  return Boolean(value && value.trim() && value.trim() !== "#");
}

function safeEncodeURIComponent(str: string): string {
  try {
    return encodeURIComponent(str);
  } catch {
    try {
      // Remove lone surrogate pairs that cause URIError: URI malformed
      return encodeURIComponent(str.replace(/[\uD800-\uDFFF]/g, ""));
    } catch {
      return "";
    }
  }
}

function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function getTextFragment(text: string): string {
  if (!text) return "";
  const cleaned = text.replace(/["'“”`\[\]()]/g, "").replace(/\s+/g, " ").trim();
  const sentence = cleaned.split(/[.!?]/)[0]?.trim() || cleaned;
  return sentence.slice(0, 80).trim();
}

function appendTextFragment(url: string, text: string): string {
  const fragment = getTextFragment(text);
  if (!fragment || url.includes(":~:text=")) return url;
  const encoded = safeEncodeURIComponent(fragment);
  if (!encoded) return url;
  return `${url}#:~:text=${encoded}`;
}

function setQueryParam(urlStr: string, name: string, value: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.searchParams.set(name, value);
    return parsed.toString();
  } catch {
    const cleanUrl = urlStr.replace(/#.*$/, "");
    return `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}${name}=${safeEncodeURIComponent(value)}`;
  }
}

function removeHash(urlStr: string): string {
  return urlStr.replace(/#.*$/, "");
}

/**
 * Encodes numeric TikTok comment ID into base64 format for the native TikTok ?cid= parameter.
 * Example: 7656316583040795399 -> NzY1NjMxNjU4MzA0MDc5NTM5OQ%3D%3D
 */
function toTikTokCid(commentId: string): string {
  const cleanId = String(commentId).trim();
  if (!cleanId) return "";
  if (cleanId.includes("%3D") || cleanId.endsWith("==") || cleanId.includes("==")) {
    return cleanId;
  }
  try {
    if (typeof btoa === "function" && /^\d+$/.test(cleanId)) {
      return safeEncodeURIComponent(btoa(cleanId));
    }
  } catch {
    // Fallback if btoa fails
  }
  return safeEncodeURIComponent(cleanId);
}

/**
 * Strips Facebook composite IDs (e.g. "1458649602954711_1712731953333813") down to clean numeric comment IDs.
 * Facebook Web fails to locate comments when passed composite "POSTID_COMMENTID" in ?comment_id=.
 */
function formatFacebookCommentUrl(cleanUrl: string, rawCid: string): string {
  const cid = String(rawCid).trim();
  if (!cid) return cleanUrl;

  if (cid.includes("_")) {
    const parts = cid.split("_").filter(Boolean);
    if (parts.length >= 2) {
      const parentId = parts[0];
      const targetId = parts[parts.length - 1];
      let res = setQueryParam(cleanUrl, "comment_id", targetId);
      if (parentId !== targetId) {
        res = setQueryParam(res, "reply_comment_id", targetId);
      }
      return res;
    }
    if (parts.length === 1) {
      return setQueryParam(cleanUrl, "comment_id", parts[0]);
    }
  }

  return setQueryParam(cleanUrl, "comment_id", cid);
}

/**
 * Extracts a numeric or base64 comment ID from explicit fields or URL candidate strings.
 */
function extractCommentId(alert: AlertSourceFields, candidateUrls: string[]): string {
  // 1. Check explicit comment_id field
  if (alert.comment_id) {
    const cid = String(alert.comment_id).trim();
    if (cid && cid !== "#") return cid;
  }

  // 2. Check source_id if content_type is comment or reply
  if (
    ["comment", "reply"].includes(String(alert.content_type || "").toLowerCase()) &&
    alert.source_id
  ) {
    const sid = String(alert.source_id).trim();
    if (sid && sid !== "#") return sid;
  }

  // 3. Regex match comment ID or cid from candidate URLs
  for (const rawUrl of candidateUrls) {
    if (!rawUrl) continue;
    const match =
      rawUrl.match(/(?:cid|comment_id|lc|modal_id)=([a-zA-Z0-9_\-%]+)/i) ||
      rawUrl.match(/#comment-([a-zA-Z0-9_\-]+)/i);
    if (match && match[1]) {
      const val = safeDecodeURIComponent(match[1]).trim();
      // If base64 encoded string, attempt atob decoding to numeric ID
      try {
        if (typeof atob === "function" && /^[A-Za-z0-9+/=]+$/.test(val) && val.length >= 8) {
          const decoded = atob(val);
          if (/^\d+$/.test(decoded)) return decoded;
        }
      } catch {
        // Keep original val if atob fails
      }
      return val;
    }
  }

  return "";
}

/**
 * Returns the post/comment URL with the strongest available locator for the alert's
 * exact comment across TikTok, Facebook, YouTube, and generic platforms.
 */
export function getAlertSourceUrl(alert: AlertSourceFields): string | null {
  const platform = String(alert.source || "").toLowerCase();
  const directCommentUrl = [alert.comment_url, alert.url].find(isUsableUrl);
  const postUrl = [alert.post_url, alert.source_url, alert.url].find((url) => {
    if (!isUsableUrl(url)) return false;
    if (directCommentUrl && url === directCommentUrl) return false;
    return true;
  });

  const baseUrl = postUrl || directCommentUrl;
  if (!baseUrl) return null;

  const candidateUrls = [alert.comment_url, alert.url, alert.post_url, alert.source_url].filter(isUsableUrl);
  const commentId = extractCommentId(alert, candidateUrls);
  const text = alert.comment_content || alert.text || "";
  const lowerUrl = baseUrl.toLowerCase();

  // If no comment ID could be identified, fallback to base URL + text fragment
  if (!commentId) {
    return appendTextFragment(baseUrl, text);
  }

  // --- Platform-specific deep link parameter formatting ---

  // 1. TikTok Web: requires ?cid=BASE64_COMMENT_ID (and ?comment_id=ID) in query params for native comment navigation
  if (platform.includes("tiktok") || lowerUrl.includes("tiktok.com")) {
    let cleanUrl = removeHash(baseUrl);
    const tikTokCid = toTikTokCid(commentId);
    if (tikTokCid) {
      cleanUrl = setQueryParam(cleanUrl, "cid", tikTokCid);
    }
    cleanUrl = setQueryParam(cleanUrl, "comment_id", commentId);
    cleanUrl = setQueryParam(cleanUrl, "modal_id", commentId);
    cleanUrl = `${cleanUrl}#comment-${safeEncodeURIComponent(commentId)}`;
    return appendTextFragment(cleanUrl, text);
  }

  // 2. Facebook Web: requires clean comment_id without composite POSTID_ prefix
  if (platform.includes("facebook") || lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) {
    let cleanUrl = removeHash(baseUrl);
    cleanUrl = formatFacebookCommentUrl(cleanUrl, commentId);
    return appendTextFragment(cleanUrl, text);
  }

  // 3. YouTube Web: requires ?lc=ID in query params
  if (platform.includes("youtube") || lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    let cleanUrl = removeHash(baseUrl);
    cleanUrl = setQueryParam(cleanUrl, "lc", commentId);
    return appendTextFragment(cleanUrl, text);
  }

  // 4. Other / Generic platforms
  let cleanUrl = removeHash(baseUrl);
  cleanUrl = setQueryParam(cleanUrl, "comment_id", commentId);
  return appendTextFragment(cleanUrl, text);
}
