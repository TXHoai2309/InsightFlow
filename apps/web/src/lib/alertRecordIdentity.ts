export interface AlertRecordIdentity {
  id: string;
  source_id?: string | null;
  post_id?: string | null;
  comment_id?: string | null;
  content_type?: string | null;
}

function normalizeRecordId(value: unknown): string {
  return String(value || "").trim();
}

export function isCommentLevelAlert(alert: AlertRecordIdentity): boolean {
  const contentType = normalizeRecordId(alert.content_type).toLowerCase();
  return Boolean(normalizeRecordId(alert.comment_id)) || contentType === "comment" || contentType === "reply";
}

/**
 * Match one workflow record without treating every comment below the same post
 * as the same alert. post_id is an identity only for a post-level alert.
 */
export function isSameAlertRecord(alert: AlertRecordIdentity, candidateId: unknown): boolean {
  const target = normalizeRecordId(candidateId);
  if (!target) return false;

  const exactIds = [alert.id, alert.source_id, alert.comment_id]
    .map(normalizeRecordId)
    .filter(Boolean);
  if (exactIds.includes(target)) return true;

  return !isCommentLevelAlert(alert) && normalizeRecordId(alert.post_id) === target;
}
