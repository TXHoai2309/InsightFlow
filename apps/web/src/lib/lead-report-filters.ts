import type { Lead } from "@/types/dashboard";
import type { UserRoleProfile } from "@/lib/rbac";
import { getLeadExpiryTime } from "@/lib/lead-workbench";

export type LeadReportTimeRange = "all" | "today" | "7d" | "30d" | "custom";
export type LeadReportSlaFilter = "all" | "in_sla" | "overdue" | "late" | "closed";
export type LeadReportOwnerFilter = "all" | "mine" | "unassigned";

export interface LeadReportFilters {
  timeRange: LeadReportTimeRange;
  startDate: string;
  endDate: string;
  status: "all" | Lead["status"];
  intent: "all" | Lead["intent"];
  sla: LeadReportSlaFilter;
  source: string;
  owner: LeadReportOwnerFilter;
  keyword: string;
}

export const DEFAULT_LEAD_REPORT_FILTERS: LeadReportFilters = {
  timeRange: "all",
  startDate: "",
  endDate: "",
  status: "all",
  intent: "all",
  sla: "all",
  source: "all",
  owner: "all",
  keyword: "",
};

function toTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function matchesTimeRange(lead: Lead, filters: LeadReportFilters, nowMs: number) {
  if (filters.timeRange === "all") return true;
  const createdAt = toTime(lead.created_at || lead.posted_at);
  if (createdAt === null) return false;

  const { start: startOfToday, end: endOfToday } = getDayBounds(new Date(nowMs));

  if (filters.timeRange === "today") {
    return createdAt >= startOfToday && createdAt <= endOfToday;
  }

  if (filters.timeRange === "7d") {
    return createdAt >= startOfToday - 6 * 24 * 60 * 60 * 1000;
  }

  if (filters.timeRange === "30d") {
    return createdAt >= startOfToday - 29 * 24 * 60 * 60 * 1000;
  }

  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`).getTime() : null;
  if (start !== null && createdAt < start) return false;
  if (end !== null && createdAt > end) return false;
  return true;
}

function getLeadSlaBucket(lead: Lead, nowMs: number): LeadReportSlaFilter {
  if (lead.status === "completed" || lead.status === "skipped") return "closed";

  const expiry = getLeadExpiryTime(lead);
  const responseTime = toTime(lead.first_contacted_at || lead.last_contact_at);
  if (responseTime !== null) return responseTime <= expiry ? "in_sla" : "late";
  return expiry < nowMs ? "overdue" : "in_sla";
}

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesKeyword(lead: Lead, keyword: string) {
  const query = normalize(keyword);
  if (!query) return true;
  const haystack = normalize([
    lead.id,
    lead.author,
    lead.content,
    lead.platform,
    lead.intent,
    lead.status,
    lead.owner_name,
    lead.owner_email,
  ].join(" "));
  return haystack.includes(query);
}

export function countActiveLeadReportFilters(filters: LeadReportFilters) {
  return [
    filters.timeRange !== "all",
    filters.status !== "all",
    filters.intent !== "all",
    filters.sla !== "all",
    filters.source !== "all",
    filters.owner !== "all",
    Boolean(filters.keyword.trim()),
  ].filter(Boolean).length;
}

export function filterLeadReportItems(
  leads: Lead[],
  filters: LeadReportFilters,
  profile?: UserRoleProfile | null,
  nowMs = Date.now(),
) {
  return leads.filter((lead) => {
    if (!matchesTimeRange(lead, filters, nowMs)) return false;
    if (filters.status !== "all" && lead.status !== filters.status) return false;
    if (filters.intent !== "all" && lead.intent !== filters.intent) return false;
    if (filters.source !== "all" && normalize(lead.platform) !== normalize(filters.source)) return false;
    if (filters.sla !== "all" && getLeadSlaBucket(lead, nowMs) !== filters.sla) return false;
    if (filters.owner === "mine" && lead.owner_id !== profile?.uid) return false;
    if (filters.owner === "unassigned" && lead.owner_id) return false;
    if (!matchesKeyword(lead, filters.keyword)) return false;
    return true;
  });
}
