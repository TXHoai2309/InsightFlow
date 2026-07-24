import type { AlertData } from "@/stores/alert.store";
import { getAlertOperationalSlaBucket } from "@/lib/operational-metrics";

export type CrisisReportTimeRange = "all" | "today" | "7d" | "30d" | "custom";
export type CrisisReportSlaFilter = "all" | "in_sla" | "overdue" | "late" | "closed";
export type CrisisReportEscalationFilter = "all" | "yes" | "no";
export type CrisisReportSeverityFilter = "all" | "critical" | "high" | "high_critical" | "medium" | "low";

export interface CrisisReportFilters {
  timeRange: CrisisReportTimeRange;
  startDate: string;
  endDate: string;
  status: string;
  severity: CrisisReportSeverityFilter;
  sla: CrisisReportSlaFilter;
  escalation: CrisisReportEscalationFilter;
  source: string;
  topic: string;
  keyword: string;
}

export const DEFAULT_CRISIS_REPORT_FILTERS: CrisisReportFilters = {
  timeRange: "all",
  startDate: "",
  endDate: "",
  status: "all",
  severity: "all",
  sla: "all",
  escalation: "all",
  source: "all",
  topic: "all",
  keyword: "",
};

function toTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function normalizeSource(source: string) {
  const normalized = normalize(source);
  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("thread")) return "thread";
  if (normalized.includes("google")) return "google_maps";
  if (normalized.includes("be")) return "be";
  if (normalized.includes("news") || normalized.includes("bao")) return "news";
  return normalized || "unknown";
}

function normalizeSeverity(severity: string) {
  const normalized = normalize(severity);
  if (normalized === "urgent") return "high";
  if (normalized === "normal") return "medium";
  return normalized || "medium";
}

function normalizeStatus(status: string) {
  return normalize(status) || "new";
}

function matchesTimeRange(alert: AlertData, filters: CrisisReportFilters, nowMs: number) {
  if (filters.timeRange === "all") return true;
  const createdAt = toTime(alert.created_at);
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

function getSlaDurationMinutes(alert: AlertData) {
  const severity = normalizeSeverity(alert.severity || alert.urgency || "");
  if (severity === "critical") return 2 * 60;
  if (severity === "high") return 4 * 60;
  if (severity === "medium") return 24 * 60;
  return 72 * 60;
}

function getCrisisSlaBucket(alert: AlertData, nowMs: number): CrisisReportSlaFilter {
  return getAlertOperationalSlaBucket(alert, nowMs);
}
function isEscalated(alert: AlertData) {
  return Boolean(alert.escalation) || normalizeStatus(alert.status) === "pending_approval";
}

function matchesKeyword(alert: AlertData, keyword: string) {
  const query = normalize(keyword);
  if (!query) return true;
  const haystack = normalize([
    alert.id,
    alert.topic,
    alert.source,
    alert.status,
    alert.severity,
    alert.text,
    alert.comment_content,
    alert.post_content,
    alert.author,
  ].join(" "));
  return haystack.includes(query);
}

export function countActiveCrisisReportFilters(filters: CrisisReportFilters) {
  return [
    filters.timeRange !== "all",
    filters.status !== "all",
    filters.severity !== "all",
    filters.sla !== "all",
    filters.escalation !== "all",
    filters.source !== "all",
    filters.topic !== "all",
    Boolean(filters.keyword.trim()),
  ].filter(Boolean).length;
}

export function filterCrisisReportItems(
  alerts: AlertData[],
  filters: CrisisReportFilters,
  nowMs = Date.now(),
) {
  return alerts.filter((alert) => {
    const severity = normalizeSeverity(alert.severity || alert.urgency || "");
    if (!matchesTimeRange(alert, filters, nowMs)) return false;
    if (filters.status !== "all" && normalizeStatus(alert.status) !== filters.status) return false;
    if (filters.severity === "high_critical" && severity !== "high" && severity !== "critical") return false;
    if (filters.severity !== "all" && filters.severity !== "high_critical" && severity !== filters.severity) return false;
    if (filters.source !== "all" && normalizeSource(alert.source) !== filters.source) return false;
    if (filters.topic !== "all" && normalize(alert.topic) !== normalize(filters.topic)) return false;
    if (filters.sla !== "all" && getCrisisSlaBucket(alert, nowMs) !== filters.sla) return false;
    if (filters.escalation === "yes" && !isEscalated(alert)) return false;
    if (filters.escalation === "no" && isEscalated(alert)) return false;
    if (!matchesKeyword(alert, filters.keyword)) return false;
    return true;
  });
}
