import { canAlertBeVisibleToUser } from "@/lib/alert-visibility";
import { getAlertWorkflowStatus, isTerminalAlert } from "@/lib/alertWorkflow";
import { getScopedBrandKey, isRecordInBrandScope } from "@/lib/brandScope";
import { isWithinCalendarPeriod } from "@/lib/dashboard-display";
import { isIntentLead } from "@/lib/lead-intent";
import { isCrisisClassificationLabel } from "@/lib/label-change";
import {
  canLeadBeVisibleToUser,
  getLeadWorkbenchMeta,
  matchesLeadWorkbenchView,
} from "@/lib/lead-workbench";
import { normalizeBrandName } from "@/lib/brand-normalization";
import type { UserRoleProfile } from "@/lib/rbac";
import type { AlertData } from "@/stores/alert.store";
import type { Lead } from "@/types/dashboard";
import {
  deduplicateSourceRecords,
  getSourceRecordTypedKey,
} from "@/lib/source-content-identity";

export const ALERT_REVIEW_WINDOW_DAYS = 30;

interface OperationalScopeOptions {
  profile?: UserRoleProfile | null;
  workspaceId?: string | null;
  platform?: string | null;
}

export interface LeadOperationalMetrics {
  total: number;
  unassigned: number;
  priority: number;
  active: number;
  followUp: number;
  closed: number;
  skipped: number;
  needResult: number;
  hotPending: number;
  overdue: number;
}

export interface AlertOperationalMetrics {
  total: number;
  active: number;
  pending: number;
  processing: number;
  contactFailed: number;
  resolved: number;
  skipped: number;
  highActive: number;
  unassignedActive: number;
}

function matchesSelectedWorkspace(
  record: { workspace_id?: string; brand?: string },
  workspaceId?: string | null,
) {
  if (!workspaceId || workspaceId === "all") return true;
  const recordBrand = record.workspace_id || record.brand || "";
  return normalizeBrandName(recordBrand) === normalizeBrandName(workspaceId);
}

export function filterOperationalLeads(
  leads: Lead[],
  { profile, workspaceId = "all", platform = "all" }: OperationalScopeOptions,
) {
  const profileBrand = getScopedBrandKey(profile);
  return leads.filter((lead) => {
    if (!isIntentLead(lead)) return false;
    if (!isRecordInBrandScope(lead, profileBrand)) return false;
    if (!matchesSelectedWorkspace(lead, workspaceId)) return false;
    if (platform && platform !== "all" && lead.platform !== platform) return false;
    return canLeadBeVisibleToUser(lead, profile);
  });
}

export function buildLeadOperationalMetrics(
  leads: Lead[],
  profile?: UserRoleProfile | null,
  nowMs = Date.now(),
): LeadOperationalMetrics {
  const countView = (view: Parameters<typeof matchesLeadWorkbenchView>[1]) =>
    leads.filter((lead) => matchesLeadWorkbenchView(lead, view, nowMs, profile)).length;
  const pending = leads.filter((lead) => lead.status === "new" || lead.status === "processing");

  return {
    total: leads.length,
    unassigned: countView("unassigned"),
    priority: countView("priority"),
    active: countView("active"),
    followUp: countView("follow_up"),
    closed: countView("closed"),
    skipped: countView("skipped"),
    needResult: countView("need_result"),
    hotPending: pending.filter((lead) => lead.intent === "hot").length,
    overdue: pending.filter((lead) => getLeadWorkbenchMeta(lead, nowMs).isOverdue).length,
  };
}

export function getAlertRelevantAt(alert: AlertData) {
  if (!isTerminalAlert(alert)) return alert.created_at;
  const history = alert.resolution_history || [];
  const latestHistoryAt = history.length > 0 ? history[history.length - 1]?.timestamp : undefined;
  return (
    alert.resolved_at ||
    alert.skipped_at ||
    alert.monitoring_started_at ||
    latestHistoryAt ||
    alert.created_at
  );
}

export function isAlertInReviewWindow(
  alert: AlertData,
  nowMs = Date.now(),
  reviewWindowDays = ALERT_REVIEW_WINDOW_DAYS,
) {
  const relevantAtMs = new Date(getAlertRelevantAt(alert) || "").getTime();
  const cutoffMs = nowMs - reviewWindowDays * 24 * 60 * 60 * 1000;
  return Number.isFinite(relevantAtMs) && relevantAtMs >= cutoffMs && relevantAtMs <= nowMs;
}

export function getAlertDeduplicationKey(alert: AlertData) {
  return getSourceRecordTypedKey(alert);
}

export type CanonicalAlertSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export function normalizeAlertSeverity(
  value: unknown,
): CanonicalAlertSeverity {
  const severity = String(value || "").trim().toLowerCase();
  if (severity === "critical" || severity === "urgent") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium" || severity === "normal") return "medium";
  return "low";
}

export function getAlertCanonicalSeverity(
  alert: Pick<AlertData, "severity" | "urgency">,
) {
  const severityRank: Record<CanonicalAlertSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const severity = normalizeAlertSeverity(alert.severity);
  const urgency = normalizeAlertSeverity(alert.urgency);
  return severityRank[urgency] > severityRank[severity] ? urgency : severity;
}

export function isHighPriorityAlert(
  alert: Pick<AlertData, "severity" | "urgency">,
) {
  const severity = getAlertCanonicalSeverity(alert);
  return severity === "critical" || severity === "high";
}

export function isAlertWithinTimeScope(
  alert: Pick<AlertData, "created_at">,
  {
    timeRange,
    singleDate = "",
    customStartDate = "",
    customEndDate = "",
    nowMs = Date.now(),
  }: {
    timeRange: string;
    singleDate?: string;
    customStartDate?: string;
    customEndDate?: string;
    nowMs?: number;
  },
) {
  if (timeRange === "all") return true;

  const eventMs = new Date(alert.created_at || "").getTime();
  if (!Number.isFinite(eventMs)) return false;

  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  let startMs: number | null = null;
  let endMs: number | null = null;

  const calendarDays: Record<string, number> = {
    "24h": 1,
    "2d": 2,
    "3d": 3,
    "5d": 5,
    "7d": 7,
    "30d": 30,
  };
  const dayCount = calendarDays[timeRange];

  if (dayCount) {
    startMs = today.getTime() - (dayCount - 1) * 24 * 60 * 60 * 1000;
    endMs = today.getTime() + 24 * 60 * 60 * 1000;
  } else if (timeRange === "this_month") {
    startMs = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    endMs = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();
  } else if (timeRange === "last_month") {
    startMs = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
    endMs = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  } else if (timeRange === "single" && singleDate) {
    startMs = new Date(`${singleDate}T00:00:00`).getTime();
    endMs = new Date(`${singleDate}T00:00:00`).getTime() + 24 * 60 * 60 * 1000;
  } else if (timeRange === "custom") {
    if (customStartDate) {
      startMs = new Date(`${customStartDate}T00:00:00`).getTime();
    }
    if (customEndDate) {
      endMs =
        new Date(`${customEndDate}T00:00:00`).getTime() +
        24 * 60 * 60 * 1000;
    }
  } else if (/^\d{4}-\d{2}$/.test(timeRange)) {
    const [year, month] = timeRange.split("-").map(Number);
    startMs = new Date(year, month - 1, 1).getTime();
    endMs = new Date(year, month, 1).getTime();
  }

  if (startMs !== null && (!Number.isFinite(startMs) || eventMs < startMs)) {
    return false;
  }
  if (endMs !== null && (!Number.isFinite(endMs) || eventMs >= endMs)) {
    return false;
  }
  return true;
}

export function getAlertCompletenessScore(alert: AlertData) {
  const workflowStatus = getAlertWorkflowStatus(alert);
  return (
    (workflowStatus === "pending" ? 0 : 20) +
    (alert.being_resolved_by ? 10 : 0) +
    (alert.customer_contact_opened_at ? 5 : 0) +
    (alert.resolution_history?.length || 0) +
    (alert.customer_contact_history?.length || 0)
  );
}

function getOperationalAlertSlaHours(alert: AlertData) {
  const severity = getAlertCanonicalSeverity(alert);
  if (severity === "critical") return 1;
  if (severity === "high") return 2;
  if (severity === "medium") return 4;
  return 8;
}

export function getAlertOperationalDueAt(alert: AlertData) {
  const startedAt = new Date(alert.detected_at || alert.created_at || "").getTime();
  if (!Number.isFinite(startedAt)) return null;
  return startedAt + getOperationalAlertSlaHours(alert) * 60 * 60 * 1000;
}

export function getAlertOperationalSlaBucket(
  alert: AlertData,
  nowMs = Date.now(),
): "in_sla" | "overdue" | "closed" {
  if (isTerminalAlert(alert)) return "closed";
  const dueAt = getAlertOperationalDueAt(alert);
  return dueAt !== null && dueAt <= nowMs ? "overdue" : "in_sla";
}
export function filterOperationalAlerts(
  alerts: AlertData[],
  {
    profile,
    workspaceId = "all",
    platform = "all",
    nowMs = Date.now(),
    reviewWindowDays = ALERT_REVIEW_WINDOW_DAYS,
    crisisOnly = false,
    dateBasis = "relevant_at",
  }: OperationalScopeOptions & {
    nowMs?: number;
    reviewWindowDays?: number;
    crisisOnly?: boolean;
    dateBasis?: "created_at" | "relevant_at";
  },
) {
  const scopedAlerts: AlertData[] = [];

  alerts.forEach((alert) => {
    const isInWindow = dateBasis === "created_at"
      ? isWithinCalendarPeriod(alert.created_at, reviewWindowDays, new Date(nowMs))
      : isAlertInReviewWindow(alert, nowMs, reviewWindowDays);
    if (!isInWindow) return;
    if (
      crisisOnly &&
      !isCrisisClassificationLabel({
        sentiment: alert.sentiment as any,
        relevance: alert.relevance,
        urgency: alert.urgency as any,
        intent: alert.intent as any,
      })
    ) return;
    if (!matchesSelectedWorkspace(alert, workspaceId)) return;
    if (platform && platform !== "all" && alert.source !== platform) return;
    if (!canAlertBeVisibleToUser(alert, profile)) return;

    scopedAlerts.push(alert);
  });

  return deduplicateSourceRecords(scopedAlerts, {
    selectPreferred: (existing, candidate) =>
      getAlertCompletenessScore(candidate) > getAlertCompletenessScore(existing)
        ? candidate
        : existing,
  });
}

export function filterNegativeOperationalAlerts(
  alerts: AlertData[],
  options: Parameters<typeof filterOperationalAlerts>[1],
) {
  return filterOperationalAlerts(
    alerts.filter((alert) => alert.sentiment === "negative"),
    options,
  );
}
export function buildAlertOperationalMetrics(alerts: AlertData[]): AlertOperationalMetrics {
  const statuses = alerts.map(getAlertWorkflowStatus);
  const activeAlerts = alerts.filter((alert) => !isTerminalAlert(alert));
  const highActive = activeAlerts.filter(isHighPriorityAlert).length;

  return {
    total: alerts.length,
    active: activeAlerts.length,
    pending: statuses.filter((status) => status === "pending").length,
    processing: statuses.filter((status) => status === "processing").length,
    contactFailed: statuses.filter((status) => status === "contact_failed").length,
    resolved: statuses.filter((status) => status === "resolved").length,
    skipped: statuses.filter((status) => status === "skipped").length,
    highActive,
    unassignedActive: activeAlerts.filter((alert) => !alert.being_resolved_by).length,
  };
}
