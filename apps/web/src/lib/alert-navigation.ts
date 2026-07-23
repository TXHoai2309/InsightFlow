import type { AlertData } from "@/stores/alert.store";
import {
  appendDashboardReturnParams,
  type DashboardNavigationMode,
  type DashboardReturnOrigin,
} from "@/lib/dashboard-return-context";

function normalizeId(value: unknown) {
  return String(value || "").trim();
}

export function getAlertNavigationIds(alert: AlertData) {
  return Array.from(new Set([
    alert.id,
    alert.source_id,
    alert.comment_id,
    alert.post_id,
    alert.parent_id,
  ].map(normalizeId).filter(Boolean)));
}

export function getAlertMentionId(alert: AlertData) {
  return normalizeId(alert.source_id || alert.comment_id || alert.id);
}

export function createAlertWorkbenchHref(
  alert: AlertData,
  dashboardReturn?: {
    origin: DashboardReturnOrigin;
    token: string;
    mode?: DashboardNavigationMode;
  },
) {
  const params = new URLSearchParams({ alertId: normalizeId(alert.id) });
  const mentionId = getAlertMentionId(alert);
  if (mentionId) params.set("mentionId", mentionId);
  const href = `/alerts?${params.toString()}`;
  return dashboardReturn
    ? appendDashboardReturnParams(
        href,
        dashboardReturn.origin,
        dashboardReturn.token,
        dashboardReturn.mode,
      )
    : href;
}

export function findAlertByNavigationTarget(
  alerts: AlertData[],
  alertId?: string | null,
  mentionId?: string | null,
) {
  const normalizedAlertId = normalizeId(alertId);
  const normalizedMentionId = normalizeId(mentionId);
  const requestedIds = new Set([normalizedAlertId, normalizedMentionId].filter(Boolean));
  if (requestedIds.size === 0) return undefined;

  if (normalizedAlertId) {
    const exactAlert = alerts.find((alert) => normalizeId(alert.id) === normalizedAlertId);
    if (exactAlert) return exactAlert;
  }

  if (normalizedMentionId) {
    const exactMention = alerts.find((alert) =>
      [alert.source_id, alert.comment_id, alert.id]
        .map(normalizeId)
        .includes(normalizedMentionId),
    );
    if (exactMention) return exactMention;
  }

  return alerts.find((alert) =>
    getAlertNavigationIds(alert).some((candidate) => requestedIds.has(candidate)),
  );
}
