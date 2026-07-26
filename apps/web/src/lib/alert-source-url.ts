import type { AlertData } from "@/stores/alert.store";
import { getSourceContentUrl } from "./source-content-url";

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

/**
 * Use the crawler/database URL verbatim, matching Labeling Tool behavior.
 * Platform IDs must not be reconstructed in the UI.
 */
export function getAlertSourceUrl(alert: AlertSourceFields): string | null {
  return getSourceContentUrl({
    platform: alert.source,
    source: alert.source,
    content_type: alert.content_type,
    url: alert.url,
    post_url: alert.post_url,
    comment_url: alert.comment_url,
    source_url: alert.source_url,
  });
}
