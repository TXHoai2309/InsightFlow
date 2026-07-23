export type AlertWorkflowStatus = "pending" | "processing" | "contact_failed" | "resolved" | "skipped";

type AlertStatusSource = {
  status?: string | null;
  resolution_status?: string | null;
  resolved_at?: string | null;
  monitoring_started_at?: string | null;
  being_resolved_by?: string | null;
  being_resolved_at?: string | null;
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

function getTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * Legacy statuses are normalized here so every screen uses the same rule.
 */
export function getAlertWorkflowStatus(alert: AlertStatusSource): AlertWorkflowStatus {
  const rawStatus = String(alert.status || alert.resolution_status || "")
    .trim()
    .toLowerCase();

  // An explicit persisted status is authoritative. Metadata is only used as a
  // compatibility fallback for old annotations that did not persist a status.
  if (SKIPPED_STATUSES.has(rawStatus)) return "skipped";
  if (RESOLVED_STATUSES.has(rawStatus)) return "resolved";
  if (CONTACT_FAILED_STATUSES.has(rawStatus)) return "contact_failed";

  if (PROCESSING_STATUSES.has(rawStatus)) {
    const activeAt = getTimestamp(alert.being_resolved_at);
    const terminalAt = Math.max(
      getTimestamp(alert.skipped_at),
      getTimestamp(alert.resolved_at),
      getTimestamp(alert.monitoring_started_at),
    );

    // A new claim must win over terminal evidence left by an older workflow
    // cycle. Otherwise the alert briefly reappears as Closed.
    if (!terminalAt || (activeAt && activeAt >= terminalAt)) return "processing";
  }

  if (alert.skipped_at) return "skipped";
  if (alert.resolved_at || alert.monitoring_started_at) return "resolved";
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

/**
 * Annotation rows have a top-level `status` for the classification pipeline
 * (normally "completed"). It is not the crisis workflow status. Realtime
 * consumers must read the workflow fields stored in the annotation label.
 */
export function getRealtimeAlertWorkflowStatus(
  row: Record<string, unknown>,
  label: Record<string, unknown>,
): ReturnType<typeof getPersistedAlertStatus> {
  const resolutionStatus =
    row.resolution_status ??
    label.resolution_status ??
    label.status;

  return getPersistedAlertStatus({
    ...label,
    resolution_status: typeof resolutionStatus === "string" ? resolutionStatus : null,
  });
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
