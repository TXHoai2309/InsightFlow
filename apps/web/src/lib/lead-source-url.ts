import type { Lead } from "@/types/dashboard";
import { getSourceContentUrl, getSourcePostUrl } from "./source-content-url";

export function getLeadSourceUrl(lead: Lead): string | null {
  return getSourceContentUrl({
    platform: lead.platform,
    source: lead.platform,
    content_type: lead.content_type,
    url: lead.url,
    post_url: lead.post_url,
    comment_url: lead.comment_url,
    source_comment_url: lead.source_comment_url,
    original_comment_url: lead.original_comment_url,
    source_url: lead.source_url,
    social_profile_url: lead.social_profile_url,
  });
}

export function getLeadPostUrl(lead: Lead): string | null {
  return getSourcePostUrl({
    platform: lead.platform,
    content_type: lead.content_type,
    url: lead.url,
    post_url: lead.post_url,
    source_url: lead.source_url,
  });
}
