import { getLeadWorkbenchMeta } from "@/lib/lead-workbench";
import type { Lead, Platform } from "@/types/dashboard";

export type LeadPriorityFilter = "all" | "hot" | "warm" | "cold";
export type LeadSlaFilter =
  | "all"
  | "on_time"
  | "due_soon"
  | "overdue"
  | "unknown";
export type LeadOwnershipFilter = "all" | "mine" | "unassigned" | "staff";
export type LeadUpdatedRangeFilter = "all" | "today" | "7d" | "30d";

export interface LeadWorkbenchFilters {
  query: string;
  workspaceId: string;
  platform: "all" | Platform;
  priority: LeadPriorityFilter;
  sla: LeadSlaFilter;
  ownership: LeadOwnershipFilter;
  ownerId?: string;
  updatedRange: LeadUpdatedRangeFilter;
}

export const DEFAULT_LEAD_WORKBENCH_FILTERS: LeadWorkbenchFilters = {
  query: "",
  workspaceId: "all",
  platform: "all",
  priority: "all",
  sla: "all",
  ownership: "all",
  updatedRange: "all",
};

const KNOWN_PLATFORMS = new Set([
  "facebook",
  "tiktok",
  "youtube",
  "thread",
  "be",
  "google_maps",
  "news",
]);
const PRIORITIES = new Set<LeadPriorityFilter>(["all", "hot", "warm", "cold"]);
const SLA_STATES = new Set<LeadSlaFilter>([
  "all",
  "on_time",
  "due_soon",
  "overdue",
  "unknown",
]);
const OWNERSHIP_STATES = new Set<LeadOwnershipFilter>([
  "all",
  "mine",
  "unassigned",
  "staff",
]);
const UPDATED_RANGES = new Set<LeadUpdatedRangeFilter>([
  "all",
  "today",
  "7d",
  "30d",
]);

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function normalizeWorkspaceKey(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[\s\-_.]/g, "")
    .trim();

  if (normalized.includes("highland")) return "highlandcoffee";
  if (normalized.includes("starbuck")) return "starbucks";
  if (normalized.includes("mixue")) return "mixue";
  return normalized;
}

function matchesQuery(lead: Lead, rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  return normalizeSearchText(
    [
      lead.author,
      lead.content,
      lead.phone,
      lead.email,
      lead.zalo_id,
      lead.messenger_id,
      lead.owner_name,
      lead.owner_email,
      ...(lead.intent_signals || []),
    ].join(" "),
  ).includes(query);
}

function matchesSla(lead: Lead, sla: LeadSlaFilter, nowMs: number) {
  if (sla === "all") return true;
  const meta = getLeadWorkbenchMeta(lead, nowMs);

  if (!Number.isFinite(meta.expiryTime)) return sla === "unknown";
  if (sla === "unknown") return false;
  if (sla === "overdue") return meta.isOverdue;
  if (sla === "due_soon") return meta.isUrgent;
  return meta.isPending && !meta.isOverdue && !meta.isUrgent;
}

function matchesOwnership(
  lead: Lead,
  filters: LeadWorkbenchFilters,
  currentUserId?: string,
) {
  const ownerId = (lead.owner_id || "").trim();
  if (filters.ownership === "all") return true;
  if (filters.ownership === "unassigned") return !ownerId;
  if (filters.ownership === "mine") {
    return Boolean(currentUserId && ownerId === currentUserId);
  }
  return Boolean(filters.ownerId && ownerId === filters.ownerId);
}

function matchesUpdatedRange(
  lead: Lead,
  range: LeadUpdatedRangeFilter,
  nowMs: number,
) {
  if (range === "all") return true;
  const leadTime = new Date(lead.updated_at || lead.created_at).getTime();
  if (!Number.isFinite(leadTime)) return false;

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);

  if (range === "today") {
    return leadTime >= startOfToday.getTime();
  }

  const days = range === "7d" ? 6 : 29;
  return leadTime >= startOfToday.getTime() - days * 24 * 60 * 60 * 1000;
}

export function filterLeadWorkbenchItems(
  leads: Lead[],
  filters: LeadWorkbenchFilters,
  nowMs = Date.now(),
  currentUserId?: string,
) {
  const workspaceKey =
    filters.workspaceId === "all"
      ? ""
      : normalizeWorkspaceKey(filters.workspaceId);

  return leads.filter((lead) => {
    if (
      workspaceKey &&
      normalizeWorkspaceKey(lead.workspace_id) !== workspaceKey
    ) {
      return false;
    }
    if (filters.platform !== "all" && lead.platform !== filters.platform) {
      return false;
    }
    if (filters.priority !== "all" && lead.intent !== filters.priority) {
      return false;
    }
    if (!matchesQuery(lead, filters.query)) return false;
    if (!matchesSla(lead, filters.sla, nowMs)) return false;
    if (!matchesOwnership(lead, filters, currentUserId)) return false;
    return matchesUpdatedRange(lead, filters.updatedRange, nowMs);
  });
}

export function countActiveLeadFilters(
  filters: LeadWorkbenchFilters,
  includeWorkspace = false,
) {
  return [
    Boolean(filters.query.trim()),
    includeWorkspace && filters.workspaceId !== "all",
    filters.platform !== "all",
    filters.priority !== "all",
    filters.sla !== "all",
    filters.ownership !== "all",
    filters.updatedRange !== "all",
  ].filter(Boolean).length;
}

export function readLeadWorkbenchFilters(
  params: URLSearchParams,
  fallback: LeadWorkbenchFilters = DEFAULT_LEAD_WORKBENCH_FILTERS,
): LeadWorkbenchFilters {
  const platform = params.get("platform") || fallback.platform;
  const priority = params.get("priority") || fallback.priority;
  const sla = params.get("sla") || fallback.sla;
  const ownership = params.get("ownership") || fallback.ownership;
  const updatedRange = params.get("updatedRange") || fallback.updatedRange;
  const ownerId = params.get("ownerId") || undefined;

  return {
    query: params.get("q") || fallback.query,
    workspaceId: params.get("workspace") || fallback.workspaceId,
    platform:
      platform === "all" || KNOWN_PLATFORMS.has(platform)
        ? platform
        : fallback.platform,
    priority: PRIORITIES.has(priority as LeadPriorityFilter)
      ? (priority as LeadPriorityFilter)
      : fallback.priority,
    sla: SLA_STATES.has(sla as LeadSlaFilter)
      ? (sla as LeadSlaFilter)
      : fallback.sla,
    ownership: OWNERSHIP_STATES.has(ownership as LeadOwnershipFilter)
      ? (ownership as LeadOwnershipFilter)
      : fallback.ownership,
    ownerId: ownership === "staff" ? ownerId : undefined,
    updatedRange: UPDATED_RANGES.has(updatedRange as LeadUpdatedRangeFilter)
      ? (updatedRange as LeadUpdatedRangeFilter)
      : fallback.updatedRange,
  };
}

export function writeLeadWorkbenchFilters(
  params: URLSearchParams,
  filters: LeadWorkbenchFilters,
) {
  const setOrDelete = (key: string, value: string, defaultValue: string) => {
    if (value && value !== defaultValue) params.set(key, value);
    else params.delete(key);
  };

  setOrDelete("q", filters.query.trim(), "");
  setOrDelete("workspace", filters.workspaceId, "all");
  setOrDelete("platform", filters.platform, "all");
  setOrDelete("priority", filters.priority, "all");
  setOrDelete("sla", filters.sla, "all");
  setOrDelete("ownership", filters.ownership, "all");
  setOrDelete("updatedRange", filters.updatedRange, "all");
  if (filters.ownership === "staff" && filters.ownerId) {
    params.set("ownerId", filters.ownerId);
  } else {
    params.delete("ownerId");
  }
}
