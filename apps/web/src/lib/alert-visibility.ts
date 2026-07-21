import { getScopedBrandKey, hasBusinessBrandScope, isRecordInBrandScope } from "@/lib/brandScope";
import { canPerformAction, type UserRoleProfile } from "@/lib/rbac";
import { isResolvedAlert, isSkippedAlert, isTerminalAlert } from "@/lib/alertWorkflow";
import type { AlertData } from "@/stores/alert.store";

function normalizeIdentity(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function getLatestResolutionOwner(alert: AlertData) {
  const history = alert.resolution_history || [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry?.resolved_by_email) return entry.resolved_by_email;
    if (entry?.resolved_by_name) return entry.resolved_by_name;
  }
  return "";
}

export function canAccessAlertQueue(profile?: UserRoleProfile | null) {
  if (!profile || !hasBusinessBrandScope(profile)) return false;
  if (profile.role === "brand_manager") {
    return canPerformAction(profile, "view_crisis_queue");
  }

  const isEmployee = profile.role === "crisis_employee" || profile.role === "lead_employee";
  return isEmployee && canPerformAction(profile, "view_crisis_queue");
}

export function getEffectiveAlertOwner(alert: AlertData) {
  if (isSkippedAlert(alert)) {
    return alert.skipped_by_email || alert.skipped_by_uid || alert.skipped_by_name || getLatestResolutionOwner(alert);
  }
  if (!isResolvedAlert(alert)) return alert.being_resolved_by || "";
  return alert.resolved_by_email || getLatestResolutionOwner(alert) || alert.being_resolved_by || "";
}

export function isAlertOwnedByUser(
  alert: AlertData,
  profile?: UserRoleProfile | null,
) {
  if (!profile) return false;
  const owner = normalizeIdentity(getEffectiveAlertOwner(alert));
  if (!owner) return false;

  return [profile.email, profile.uid, profile.displayName]
    .map(normalizeIdentity)
    .filter(Boolean)
    .includes(owner);
}

export function canAlertBeVisibleToUser(
  alert: AlertData,
  profile?: UserRoleProfile | null,
) {
  if (!canAccessAlertQueue(profile) || !profile) return false;
  if (!isRecordInBrandScope({ brand: alert.brand }, getScopedBrandKey(profile))) return false;
  if (profile.role === "brand_manager") return true;

  const owner = normalizeIdentity(getEffectiveAlertOwner(alert));
  if (!owner) return !isTerminalAlert(alert);
  return isAlertOwnedByUser(alert, profile);
}
