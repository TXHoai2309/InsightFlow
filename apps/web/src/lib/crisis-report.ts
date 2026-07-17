import type { AlertData } from "@/stores/alert.store";
import type { UserRoleProfile } from "@/lib/rbac";
import { canAlertBeVisibleToUser } from "@/lib/alert-visibility";

export interface CrisisReportKpi {
  total: number;
  new: number;
  resolving: number;
  monitoring: number;
  pendingApproval: number;
  resolved: number;
  overdue: number;
  escalated: number;
  critical: number;
  high: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  resolvedRate: number;
  slaOnTimeRate: number;
}

export interface CrisisReportBucket {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CrisisReportTrendPoint {
  day: string;
  created: number;
  resolved: number;
  escalated: number;
  avgResponseMinutes: number;
}

export interface CrisisStaffPerformanceRow {
  ownerId: string;
  ownerName: string;
  total: number;
  resolved: number;
  overdue: number;
  escalated: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  resolvedRate: number;
}

export interface CrisisReportDetailRow {
  id: string;
  brand: string;
  platform: string;
  topic: string;
  severity: string;
  sentiment: string;
  status: string;
  assigneeName: string;
  createdAt: string;
  firstResponseAt: string;
  resolvedAt: string;
  responseMinutes: number | null;
  resolutionMinutes: number | null;
  slaStatus: string;
  negativityScore: number;
  reach: number;
  engagement: number;
  escalated: boolean;
  notesCount: number;
  content: string;
  url: string;
}

export interface CrisisReportData {
  generatedAt: string;
  kpis: CrisisReportKpi;
  severityDistribution: CrisisReportBucket[];
  statusDistribution: CrisisReportBucket[];
  sourceDistribution: CrisisReportBucket[];
  topicDistribution: CrisisReportBucket[];
  responseTrend: CrisisReportTrendPoint[];
  staffPerformance: CrisisStaffPerformanceRow[];
  overdueRows: CrisisReportDetailRow[];
  escalationRows: CrisisReportDetailRow[];
  detailRows: CrisisReportDetailRow[];
  aiSummary: string;
}

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  thread: "Threads",
  threads: "Threads",
  google_maps: "Google Maps",
  news: "Bao dien tu",
  be: "Be / BeFood",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Nguy cap",
  high: "Cao",
  urgent: "Cao",
  medium: "Trung binh",
  normal: "Trung binh",
  low: "Thap",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#BA1A1A",
  high: "#DC2626",
  urgent: "#DC2626",
  medium: "#B45309",
  normal: "#B45309",
  low: "#2563EB",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Moi",
  resolving: "Dang xu ly",
  pending_approval: "Cho duyet",
  monitoring: "Dang theo doi",
  resolved: "Da xu ly",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#BA1A1A",
  resolving: "#4234B6",
  pending_approval: "#B45309",
  monitoring: "#0F766E",
  resolved: "#15803D",
};

function toTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function minutesBetween(start?: string | null, end?: string | null) {
  const startTime = toTime(start);
  const endTime = toTime(end);
  if (startTime === null || endTime === null || endTime < startTime) return null;
  return Math.round((endTime - startTime) / 60000);
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSource(source: string) {
  const normalized = normalizeText(source)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  const normalized = normalizeText(severity);
  if (normalized === "urgent") return "high";
  if (normalized === "normal") return "medium";
  return normalized || "medium";
}

function normalizeStatus(status: string) {
  return normalizeText(status) || "new";
}

function getSlaDurationMinutes(alert: AlertData) {
  const severity = normalizeSeverity(alert.severity || alert.urgency || "");
  if (severity === "critical") return 2 * 60;
  if (severity === "high") return 4 * 60;
  if (severity === "medium") return 24 * 60;
  return 72 * 60;
}

function getDueTime(alert: AlertData) {
  const created = toTime(alert.created_at);
  if (created === null) return null;
  return created + getSlaDurationMinutes(alert) * 60 * 1000;
}

function getFirstResponseAt(alert: AlertData) {
  const candidates = [
    alert.being_resolved_at,
    alert.resolution_history?.[0]?.timestamp,
    alert.resolved_at,
  ].filter(Boolean) as string[];
  return candidates.sort((a, b) => (toTime(a) || 0) - (toTime(b) || 0))[0] || "";
}

function isEscalated(alert: AlertData) {
  return Boolean(alert.escalation) || normalizeStatus(alert.status) === "pending_approval";
}

function getAssigneeKey(alert: AlertData) {
  return (
    alert.resolved_by_email ||
    alert.being_resolved_by ||
    alert.resolution_history?.[alert.resolution_history.length - 1]?.resolved_by_email ||
    "unassigned"
  );
}

function getAssigneeName(alert: AlertData) {
  return (
    alert.resolved_by_name ||
    alert.resolution_history?.[alert.resolution_history.length - 1]?.resolved_by_name ||
    alert.being_resolved_by ||
    "Chua phan cong"
  );
}

function getSlaStatus(alert: AlertData, nowMs: number) {
  const due = getDueTime(alert);
  if (due === null) return "Khong du ngay tao";
  const resolvedTime = toTime(alert.resolved_at);
  if (resolvedTime !== null) return resolvedTime <= due ? "Dung SLA" : "Tre SLA";
  if (normalizeStatus(alert.status) === "resolved") return "Da dong";
  return due < nowMs ? "Qua han" : "Trong SLA";
}

function buildDistribution(
  values: string[],
  order: string[],
  labels: Record<string, string>,
  colors: Record<string, string>,
): CrisisReportBucket[] {
  const counts = values.reduce<Record<string, number>>((acc, raw) => {
    const key = raw || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const total = values.length;
  const keys = [...order, ...Object.keys(counts).filter((key) => !order.includes(key))];

  return keys
    .filter((key) => counts[key] || order.includes(key))
    .map((key) => ({
      key,
      label: labels[key] || key,
      count: counts[key] || 0,
      percentage: percentage(counts[key] || 0, total),
      color: colors[key] || "#787585",
    }));
}

function buildResponseTrend(alerts: AlertData[], daysCount = 7): CrisisReportTrendPoint[] {
  const buckets: Record<string, { created: number; resolved: number; escalated: number; responseTotal: number; responseCount: number }> = {};
  for (let index = daysCount - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    buckets[key] = { created: 0, resolved: 0, escalated: 0, responseTotal: 0, responseCount: 0 };
  }

  alerts.forEach((alert) => {
    const createdTime = toTime(alert.created_at);
    if (createdTime !== null) {
      const key = new Date(createdTime).toISOString().slice(0, 10);
      const bucket = buckets[key];
      if (bucket) {
        bucket.created += 1;
        if (isEscalated(alert)) bucket.escalated += 1;
        const responseMinutes = minutesBetween(alert.created_at, getFirstResponseAt(alert));
        if (responseMinutes !== null) {
          bucket.responseTotal += responseMinutes;
          bucket.responseCount += 1;
        }
      }
    }

    const resolvedTime = toTime(alert.resolved_at);
    if (resolvedTime !== null) {
      const key = new Date(resolvedTime).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].resolved += 1;
    }
  });

  return Object.entries(buckets).map(([key, bucket]) => ({
    day: new Date(`${key}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    created: bucket.created,
    resolved: bucket.resolved,
    escalated: bucket.escalated,
    avgResponseMinutes: bucket.responseCount > 0 ? Math.round(bucket.responseTotal / bucket.responseCount) : 0,
  }));
}

function buildDetailRows(alerts: AlertData[], nowMs: number): CrisisReportDetailRow[] {
  return alerts.map((alert) => {
    const firstResponseAt = getFirstResponseAt(alert);
    const likes = alert.likes ?? alert.post_like_count ?? 0;
    const comments = alert.comments ?? alert.post_comment_count ?? 0;
    const shares = alert.shares ?? alert.post_share_count ?? 0;
    return {
      id: alert.id,
      brand: alert.brand,
      platform: SOURCE_LABELS[normalizeSource(alert.source)] || alert.source || "Unknown",
      topic: alert.topic || "other",
      severity: normalizeSeverity(alert.severity || alert.urgency || ""),
      sentiment: alert.sentiment || "negative",
      status: normalizeStatus(alert.status),
      assigneeName: getAssigneeName(alert),
      createdAt: alert.created_at,
      firstResponseAt,
      resolvedAt: alert.resolved_at || "",
      responseMinutes: minutesBetween(alert.created_at, firstResponseAt),
      resolutionMinutes: minutesBetween(alert.created_at, alert.resolved_at),
      slaStatus: getSlaStatus(alert, nowMs),
      negativityScore: alert.negativity_score || 0,
      reach: alert.reach || 0,
      engagement: likes + comments + shares,
      escalated: isEscalated(alert),
      notesCount: alert.internal_notes?.length || 0,
      content: alert.text || alert.comment_content || alert.post_content || "",
      url: alert.url || alert.post_url || "",
    };
  });
}

function buildStaffPerformance(rows: CrisisReportDetailRow[]) {
  const groups = new Map<string, CrisisReportDetailRow[]>();
  rows.forEach((row) => {
    const key = row.assigneeName || "Chua phan cong";
    groups.set(key, [...(groups.get(key) || []), row]);
  });

  return Array.from(groups.entries())
    .map(([ownerName, ownerRows]) => {
      const total = ownerRows.length;
      const resolved = ownerRows.filter((row) => row.status === "resolved").length;
      return {
        ownerId: ownerName,
        ownerName,
        total,
        resolved,
        overdue: ownerRows.filter((row) => row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA").length,
        escalated: ownerRows.filter((row) => row.escalated).length,
        avgFirstResponseMinutes: average(ownerRows.map((row) => row.responseMinutes)),
        avgResolutionMinutes: average(ownerRows.map((row) => row.resolutionMinutes)),
        resolvedRate: percentage(resolved, total),
      };
    })
    .sort((a, b) => b.total - a.total || b.resolvedRate - a.resolvedRate);
}

function buildAiSummary(kpis: CrisisReportKpi, severity: CrisisReportBucket[], source: CrisisReportBucket[]) {
  const topSeverity = severity.find((item) => item.count > 0);
  const topSource = source.find((item) => item.count > 0);
  const parts = [
    `Ky bao cao ghi nhan ${kpis.total} canh bao khung hoang, trong do ${kpis.critical + kpis.high} case muc cao/nguy cap.`,
    `Ty le da xu ly dat ${kpis.resolvedRate}% va ty le dung SLA dat ${kpis.slaOnTimeRate}%.`,
  ];
  if (kpis.overdue > 0) parts.push(`Co ${kpis.overdue} case qua han hoac tre SLA can uu tien xu ly.`);
  if (kpis.escalated > 0) parts.push(`${kpis.escalated} case da duoc escalate/cho duyet, can theo doi quyet dinh tiep theo.`);
  if (topSeverity) parts.push(`Muc do xuat hien nhieu nhat la ${topSeverity.label} (${topSeverity.count} case).`);
  if (topSource) parts.push(`Nguon phat sinh nhieu nhat la ${topSource.label} (${topSource.count} case).`);
  return parts.join(" ");
}

export function buildCrisisReportData(
  alerts: AlertData[],
  profile?: UserRoleProfile | null,
  nowMs = Date.now(),
): CrisisReportData {
  const scopedAlerts = alerts
    .filter((alert) => canAlertBeVisibleToUser(alert, profile))
    .sort((a, b) => (toTime(b.created_at) || 0) - (toTime(a.created_at) || 0));
  const detailRows = buildDetailRows(scopedAlerts, nowMs);
  const resolved = detailRows.filter((row) => row.status === "resolved").length;
  const slaEvaluated = detailRows.filter((row) => row.slaStatus === "Dung SLA" || row.slaStatus === "Tre SLA");
  const slaOnTime = slaEvaluated.filter((row) => row.slaStatus === "Dung SLA").length;

  const kpis: CrisisReportKpi = {
    total: detailRows.length,
    new: detailRows.filter((row) => row.status === "new").length,
    resolving: detailRows.filter((row) => row.status === "resolving").length,
    monitoring: detailRows.filter((row) => row.status === "monitoring").length,
    pendingApproval: detailRows.filter((row) => row.status === "pending_approval").length,
    resolved,
    overdue: detailRows.filter((row) => row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA").length,
    escalated: detailRows.filter((row) => row.escalated).length,
    critical: detailRows.filter((row) => row.severity === "critical").length,
    high: detailRows.filter((row) => row.severity === "high").length,
    avgFirstResponseMinutes: average(detailRows.map((row) => row.responseMinutes)),
    avgResolutionMinutes: average(detailRows.map((row) => row.resolutionMinutes)),
    resolvedRate: percentage(resolved, detailRows.length),
    slaOnTimeRate: percentage(slaOnTime, slaEvaluated.length),
  };

  const severityDistribution = buildDistribution(
    detailRows.map((row) => row.severity),
    ["critical", "high", "medium", "low"],
    SEVERITY_LABELS,
    SEVERITY_COLORS,
  );
  const sourceDistribution = buildDistribution(
    scopedAlerts.map((alert) => normalizeSource(alert.source)),
    ["facebook", "tiktok", "youtube", "thread", "google_maps", "news", "be"],
    SOURCE_LABELS,
    {
      facebook: "#1877F2",
      tiktok: "#111827",
      youtube: "#DC2626",
      thread: "#4B5563",
      google_maps: "#16A34A",
      news: "#2563EB",
      be: "#22C55E",
    },
  );

  return {
    generatedAt: new Date(nowMs).toISOString(),
    kpis,
    severityDistribution,
    statusDistribution: buildDistribution(
      detailRows.map((row) => row.status),
      ["new", "resolving", "pending_approval", "monitoring", "resolved"],
      STATUS_LABELS,
      STATUS_COLORS,
    ),
    sourceDistribution,
    topicDistribution: buildDistribution(
      detailRows.map((row) => row.topic),
      ["service", "quality", "staff", "price", "delivery", "experience", "legal", "operation", "other"],
      {},
      {},
    ),
    responseTrend: buildResponseTrend(scopedAlerts),
    staffPerformance: buildStaffPerformance(detailRows),
    overdueRows: detailRows.filter((row) => row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA"),
    escalationRows: detailRows.filter((row) => row.escalated),
    detailRows,
    aiSummary: buildAiSummary(kpis, severityDistribution, sourceDistribution),
  };
}

export function formatCrisisMinutes(value: number | null) {
  if (value === null) return "--";
  if (value < 60) return `${value} phut`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours}g ${minutes}p` : `${hours} gio`;
}
