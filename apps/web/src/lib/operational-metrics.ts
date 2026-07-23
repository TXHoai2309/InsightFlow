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

export function buildAlertOperationalMetrics(alerts: AlertData[]): AlertOperationalMetrics {
  const statuses = alerts.map(getAlertWorkflowStatus);
  const activeAlerts = alerts.filter((alert) => !isTerminalAlert(alert));
  const highActive = activeAlerts.filter((alert) => {
    const severity = String(alert.severity || alert.urgency || "").toLowerCase();
    return severity === "critical" || severity === "high" || severity === "urgent";
  }).length;

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
