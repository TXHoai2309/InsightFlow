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

function getCommentId(alert: AlertSourceFields): string {
  if (alert.comment_id) return String(alert.comment_id).trim();
  if (["comment", "reply"].includes(String(alert.content_type || "").toLowerCase())) {
    return String(alert.source_id || "").trim();
  }
  return "";
}

function getTextFragment(text: string): string {
  const cleaned = text.replace(/["'“”`\[\]()]/g, "").replace(/\s+/g, " ").trim();
  const sentence = cleaned.split(/[.!?]/)[0]?.trim() || cleaned;
  return sentence.slice(0, 80).trim();
}

function appendTextFragment(url: string, text: string): string {
  const fragment = getTextFragment(text);
  if (!fragment || url.includes(":~:text=")) return url;

  const cleanUrl = url.replace(/#.*$/, "");
  return `${cleanUrl}#:~:text=${encodeURIComponent(fragment)}`;
}

function setQueryParam(url: string, name: string, value: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.set(name, value);
    return parsed.toString();
  } catch {
    const cleanUrl = url.replace(/#.*$/, "");
    return `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}${name}=${encodeURIComponent(value)}`;
  }
}

function samePlatformUrl(url: string, platform: string): boolean {
  const normalizedPlatform = platform.toLowerCase();
  const normalizedUrl = url.toLowerCase();
  if (normalizedPlatform.includes("facebook")) {
    return normalizedUrl.includes("facebook.com") || normalizedUrl.includes("fb.com");
  }
  if (normalizedPlatform.includes("tiktok")) {
    return normalizedUrl.includes("tiktok.com");
  }
  if (normalizedPlatform.includes("youtube")) {
    return normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be");
  }
  return true;
}

/**
 * Returns the post URL with the strongest available locator for the alert's
 * exact comment. Native comment parameters are preferred; a text fragment is
 * used for platforms that do not expose a stable public comment permalink.
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

  const commentId = getCommentId(alert);
  const lowerUrl = baseUrl.toLowerCase();
  const text = alert.comment_content || alert.text || "";

  if (
    directCommentUrl &&
    samePlatformUrl(directCommentUrl, platform) &&
    (directCommentUrl.includes(commentId) || !postUrl)
  ) {
    return directCommentUrl;
  }

  if (!commentId) return baseUrl;

  if (platform.includes("youtube") || lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return setQueryParam(baseUrl, "lc", commentId);
  }

  if (platform.includes("facebook") || lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) {
    return setQueryParam(baseUrl, "comment_id", commentId);
  }

  if (platform.includes("tiktok") || lowerUrl.includes("tiktok.com")) {
    return `${baseUrl.replace(/#.*$/, "")}#comment-${encodeURIComponent(commentId)}`;
  }

  // Keep an explicit comment permalink when the source provides one.
  if (isUsableUrl(alert.comment_url)) return alert.comment_url;

  return appendTextFragment(baseUrl, text);
}

