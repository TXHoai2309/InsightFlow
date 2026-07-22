import {
  getLeadWorkbenchMeta,
  type LeadWorkbenchView,
} from "@/lib/lead-workbench";
import type { Lead, Platform } from "@/types/dashboard";

export type LeadPriorityFilter = "all" | "hot" | "warm" | "cold";
export type LeadSlaFilter =
  | "all"
  | "on_time"
  | "due_soon"
  | "overdue"
  | "unknown";
export type LeadOwnershipFilter = "all" | "mine" | "unassigned" | "staff";
export type LeadUpdatedRangeFilter = "all" | "today" | "7d" | "30d" | "custom";
export type LeadDateFilterBasis = "posted" | "follow_up" | "terminal" | "none";

export interface LeadWorkbenchFilters {
  query: string;
  workspaceId: string;
  platform: "all" | Platform;
  priority: LeadPriorityFilter;
  sla: LeadSlaFilter;
  ownership: LeadOwnershipFilter;
  ownerId?: string;
  updatedRange: LeadUpdatedRangeFilter;
  customStartDate?: string;
  customEndDate?: string;
}

export const DEFAULT_LEAD_WORKBENCH_FILTERS: LeadWorkbenchFilters = {
  query: "",
  workspaceId: "all",
  platform: "all",
  priority: "all",
  sla: "all",
  ownership: "all",
  updatedRange: "today",
  customStartDate: undefined,
  customEndDate: undefined,
};

export function getLeadDateFilterBasis(view: LeadWorkbenchView): LeadDateFilterBasis {
  if (view === "closed" || view === "skipped") return "terminal";
  if (view === "follow_up") return "follow_up";
  return "posted";
}

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
  "custom",
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

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function getVietnamDayStartMs(timestamp: number) {
  const vietnamTime = new Date(timestamp + VIETNAM_OFFSET_MS);
  return Date.UTC(
    vietnamTime.getUTCFullYear(),
    vietnamTime.getUTCMonth(),
    vietnamTime.getUTCDate(),
  ) - VIETNAM_OFFSET_MS;
}

function parseVietnamDateStart(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN;
  return new Date(`${value}T00:00:00+07:00`).getTime();
}

function getLeadTerminalTime(lead: Lead) {
  const candidates = lead.status === "skipped"
    ? [
      lead.last_action_type === "skip" ? lead.last_action_at : null,
      lead.closed_at,
      lead.result_recorded_at,
      lead.updated_at,
    ]
    : [lead.closed_at, lead.result_recorded_at, lead.last_action_at, lead.updated_at];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const timestamp = new Date(candidate).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return Number.NaN;
}

function getLeadDateForFilter(lead: Lead, basis: LeadDateFilterBasis) {
  if (basis === "none") return Number.NaN;
  if (basis === "terminal") return getLeadTerminalTime(lead);
  if (basis === "follow_up") {
    return lead.follow_up_at ? new Date(lead.follow_up_at).getTime() : Number.NaN;
  }

  const postedAt = lead.posted_at ? new Date(lead.posted_at).getTime() : Number.NaN;
  if (Number.isFinite(postedAt)) return postedAt;
  return new Date(lead.created_at).getTime();
}

function matchesUpdatedRange(
  lead: Lead,
  filters: LeadWorkbenchFilters,
  nowMs: number,
  basis: LeadDateFilterBasis,
) {
  const range = filters.updatedRange;
  if (basis === "none") return true;
  if (range === "all") return true;
  const leadTime = getLeadDateForFilter(lead, basis);
  if (!Number.isFinite(leadTime)) return false;

  const startOfToday = getVietnamDayStartMs(nowMs);
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

  if (range === "today") {
    return leadTime >= startOfToday && leadTime < endOfToday;
  }

  if (range === "custom") {
    const start = parseVietnamDateStart(filters.customStartDate);
    const end = parseVietnamDateStart(filters.customEndDate);
    if (Number.isFinite(start) && leadTime < start) return false;
    if (Number.isFinite(end) && leadTime >= end + 24 * 60 * 60 * 1000) return false;
    return Number.isFinite(start) || Number.isFinite(end);
  }

  const days = range === "7d" ? 6 : 29;
  return leadTime >= startOfToday - days * 24 * 60 * 60 * 1000 && leadTime < endOfToday;
}

export function filterLeadWorkbenchItems(
  leads: Lead[],
  filters: LeadWorkbenchFilters,
  nowMs = Date.now(),
  currentUserId?: string,
  dateBasis: LeadDateFilterBasis = "posted",
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
    return matchesUpdatedRange(lead, filters, nowMs, dateBasis);
  });
}

export function countActiveLeadFilters(
  filters: LeadWorkbenchFilters,
  includeWorkspace = false,
  defaultDateRange: LeadUpdatedRangeFilter = DEFAULT_LEAD_WORKBENCH_FILTERS.updatedRange,
) {
  return [
    Boolean(filters.query.trim()),
    includeWorkspace && filters.workspaceId !== "all",
    filters.platform !== "all",
    filters.priority !== "all",
    filters.sla !== "all",
    filters.ownership !== "all",
    filters.updatedRange !== defaultDateRange,
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
    customStartDate: params.get("dateFrom") || fallback.customStartDate,
    customEndDate: params.get("dateTo") || fallback.customEndDate,
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
  setOrDelete("updatedRange", filters.updatedRange, DEFAULT_LEAD_WORKBENCH_FILTERS.updatedRange);
  if (filters.updatedRange === "custom" && filters.customStartDate) {
    params.set("dateFrom", filters.customStartDate);
  } else {
    params.delete("dateFrom");
  }
  if (filters.updatedRange === "custom" && filters.customEndDate) {
    params.set("dateTo", filters.customEndDate);
  } else {
    params.delete("dateTo");
  }
  if (filters.ownership === "staff" && filters.ownerId) {
    params.set("ownerId", filters.ownerId);
  } else {
    params.delete("ownerId");
  }
}
