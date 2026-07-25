import type { Lead } from "@/types/dashboard";
import { getAlertSourceUrl } from "./alert-source-url";

function isUsableUrl(value?: string | null): value is string {
  return Boolean(value && value.trim() && value.trim() !== "#");
}

function contentTypeOf(lead: Lead) {
  return String(lead.content_type || "").toLowerCase();
}

export function getLeadSourceUrl(lead: Lead): string | null {
  const result = getAlertSourceUrl({
    url: lead.url,
    post_url: lead.post_url,
    comment_url: lead.comment_url || lead.source_comment_url || lead.original_comment_url,
    source_url: lead.source_url,
    comment_id: (lead as any).comment_id,
    source_id: (lead as any).source_id || lead.post_id,
    content_type: lead.content_type,
    source: lead.platform,
    text: lead.content,
    comment_content: lead.content,
  });

  if (result) return result;

  return (
    [
      lead.comment_url,
      lead.source_comment_url,
      lead.original_comment_url,
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
