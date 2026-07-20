export type AlertWorkflowStatus = "pending" | "processing" | "contact_failed" | "resolved" | "skipped";

type AlertStatusSource = {
  status?: string | null;
  resolution_status?: string | null;
  resolved_at?: string | null;
  monitoring_started_at?: string | null;
  being_resolved_by?: string | null;
  skipped_at?: string | null;
  skipped_by_uid?: string | null;
  skipped_by_email?: string | null;
  skipped_by_name?: string | null;
  resolved_by?: string | null;
  resolved_by_email?: string | null;
  resolved_by_name?: string | null;
};

const RESOLVED_STATUSES = new Set(["resolved", "completed", "monitoring", "responded"]);
const SKIPPED_STATUSES = new Set(["skipped", "ignored", "dismissed"]);
const PROCESSING_STATUSES = new Set([
  "resolving",
  "processing",
  "acknowledged",
  "in_progress",
  "pending_approval",
  "waiting_approval",
  "awaiting_approval",
  "contact_waiting",
]);
const CONTACT_FAILED_STATUSES = new Set(["contact_failed", "contact_unsuccessful"]);

/**
 * Legacy statuses are normalized here so every screen uses the same rule.
 */
export function getAlertWorkflowStatus(alert: AlertStatusSource): AlertWorkflowStatus {
  const rawStatus = String(alert.status || alert.resolution_status || "")
    .trim()
    .toLowerCase();

  // A deliberate skip wins over stale ownership/completion evidence.
  if (alert.skipped_at || SKIPPED_STATUSES.has(rawStatus)) return "skipped";
  // Completion evidence wins over a stale status saved by older clients.
  if (alert.resolved_at || alert.monitoring_started_at || RESOLVED_STATUSES.has(rawStatus)) return "resolved";
  if (CONTACT_FAILED_STATUSES.has(rawStatus)) return "contact_failed";
  if (alert.being_resolved_by || PROCESSING_STATUSES.has(rawStatus)) return "processing";
  return "pending";
}

export function getPersistedAlertStatus(alert: AlertStatusSource): "new" | "resolving" | "contact_waiting" | "contact_failed" | "resolved" | "skipped" {
  const rawStatus = String(alert.status || alert.resolution_status || "").trim().toLowerCase();
  const workflowStatus = getAlertWorkflowStatus(alert);
  if (workflowStatus === "skipped") return "skipped";
  if (workflowStatus === "resolved") return "resolved";
  if (rawStatus === "contact_waiting") return "contact_waiting";
  if (CONTACT_FAILED_STATUSES.has(rawStatus)) return "contact_failed";
  if (workflowStatus === "processing") return "resolving";
  return "new";
}

export function isResolvedAlert(alert: AlertStatusSource): boolean {
  return getAlertWorkflowStatus(alert) === "resolved";
}

export function isSkippedAlert(alert: AlertStatusSource): boolean {
  return getAlertWorkflowStatus(alert) === "skipped";
}

export function isTerminalAlert(alert: AlertStatusSource): boolean {
  const status = getAlertWorkflowStatus(alert);
  return status === "resolved" || status === "skipped";
}

export function canSkipAlert(
  alert: AlertStatusSource,
  actorEmail: string | null | undefined,
): boolean {
  const owner = String(alert.being_resolved_by || "").trim().toLowerCase();
  const actor = String(actorEmail || "").trim().toLowerCase();
  return getAlertWorkflowStatus(alert) === "processing" && Boolean(owner && actor && owner === actor);
}

export function canRestoreAlert(
  alert: AlertStatusSource,
  actor: { uid?: string | null; email?: string | null; displayName?: string | null } | null | undefined,
  managerOverride = false,
): boolean {
  if (!isTerminalAlert(alert) || !actor) return false;
  if (managerOverride) return true;

  const actorIdentities = [actor.uid, actor.email, actor.displayName]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  const previousOwnerIdentities = [
    alert.skipped_by_uid,
    alert.skipped_by_email,
    alert.skipped_by_name,
    alert.resolved_by,
    alert.resolved_by_email,
    alert.resolved_by_name,
    alert.being_resolved_by,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  return actorIdentities.some((identity) => previousOwnerIdentities.includes(identity));
}
