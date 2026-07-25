import type { Lead } from "@/types/dashboard";

function isUsableUrl(value?: string | null): value is string {
  return Boolean(value && value.trim() && value.trim() !== "#");
}

function contentTypeOf(lead: Lead) {
  return String(lead.content_type || "").toLowerCase();
}

export function getLeadSourceUrl(lead: Lead): string | null {
  const contentType = contentTypeOf(lead);
  const isCommentLike = contentType === "comment" || contentType === "reply";

  const commentUrl = [
    lead.comment_url,
    lead.source_comment_url,
    lead.original_comment_url,
    isCommentLike ? lead.url : undefined,
  ].find(isUsableUrl);

  if (commentUrl) return commentUrl;

  return (
    [
      lead.post_url,
      lead.source_url,
      lead.url,
      lead.social_profile_url,
    ].find(isUsableUrl) || null
  );
}

export function getLeadPostUrl(lead: Lead): string | null {
  return (
    [
      lead.post_url,
      lead.source_url,
      contentTypeOf(lead) === "post" ? lead.url : undefined,
    ].find(isUsableUrl) || null
  );
}
