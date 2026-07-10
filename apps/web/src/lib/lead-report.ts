import type { Lead } from "@/types/dashboard";
import type { UserRoleProfile } from "@/lib/rbac";
import {
  canLeadBeVisibleToUser,
  getLeadExpiryTime,
  getLeadWorkbenchMeta,
  needsLeadResultCapture,
} from "@/lib/lead-workbench";

export interface LeadReportKpi {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  contacted: number;
  uncontacted: number;
  needResult: number;
  followUpDue: number;
  followUpOverdue: number;
  salesHandoff: number;
  converted: number;
  skipped: number;
  slaBreached: number;
  avgFirstResponseMinutes: number | null;
  avgResultMinutes: number | null;
  conversionRate: number;
  contactRate: number;
  slaOnTimeRate: number;
}

export interface LeadReportBucket {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LeadReportTrendPoint {
  day: string;
  created: number;
  contacted: number;
  converted: number;
  avgResponseMinutes: number;
}

export interface LeadStaffPerformanceRow {
  ownerId: string;
  ownerName: string;
  total: number;
  contacted: number;
  converted: number;
  needResult: number;
  overdue: number;
  avgFirstResponseMinutes: number | null;
  conversionRate: number;
}

export interface LeadReportDetailRow {
  id: string;
  customer: string;
  workspaceId: string;
  platform: string;
  intent: Lead["intent"];
  status: Lead["status"];
  ownerName: string;
  createdAt: string;
  firstContactedAt: string;
  responseMinutes: number | null;
  resultType: string;
  resultRecordedAt: string;
  contactAttempts: number;
  followUpAt: string;
  slaStatus: string;
  priorityScore: number;
  content: string;
  url: string;
}

export interface LeadReportData {
  generatedAt: string;
  kpis: LeadReportKpi;
  intentDistribution: LeadReportBucket[];
  sourceDistribution: LeadReportBucket[];
  pipeline: LeadReportBucket[];
  responseTrend: LeadReportTrendPoint[];
  staffPerformance: LeadStaffPerformanceRow[];
  detailRows: LeadReportDetailRow[];
  aiSummary: string;
}

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  thread: "Threads",
  be: "Be / BeFood",
  google_maps: "Google Maps",
  news: "Bao dien tu",
};

const INTENT_LABELS: Record<Lead["intent"], string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  none: "Khong co intent",
};

const INTENT_COLORS: Record<Lead["intent"], string> = {
  hot: "#BA1A1A",
  warm: "#4234B6",
  cold: "#7C6CE0",
  none: "#787585",
};

const PIPELINE_COLORS: Record<string, string> = {
  new: "#BA1A1A",
  processing: "#4234B6",
  follow_up: "#0F766E",
  sales_handoff: "#B45309",
  completed: "#15803D",
  skipped: "#787585",
};

function toTime(value?: string) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function minutesBetween(start?: string, end?: string) {
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

function hasContacted(lead: Lead) {
  return Boolean(lead.first_contacted_at || lead.last_contact_at || (lead.contact_attempts || 0) > 0);
}

function isConverted(lead: Lead) {
  return lead.status === "completed" || lead.result_type === "converted";
}

function isSalesHandoff(lead: Lead) {
  return (
    lead.result_type === "transfer_sales" ||
    lead.sales_status === "ready_to_transfer" ||
    lead.sales_status === "transferred"
  );
}

function getOwnerName(lead: Lead) {
  return lead.owner_name || lead.owner_email || (lead.owner_id ? "Nhan vien chua ro ten" : "Chua phan cong");
}

function getSlaStatus(lead: Lead, nowMs: number) {
  const expiry = getLeadExpiryTime(lead);
  const responseTime = toTime(lead.first_contacted_at || lead.last_contact_at);
  if (responseTime !== null) return responseTime <= expiry ? "Dung SLA" : "Tre SLA";
  if (lead.status === "completed" || lead.status === "skipped") return "Da dong";
  return expiry < nowMs ? "Qua han" : "Trong SLA";
}

function buildDistribution<T extends string>(
  values: T[],
  order: T[],
  labels: Record<string, string>,
  colors: Record<string, string>,
): LeadReportBucket[] {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const total = values.length;
  const keys = [...order, ...Object.keys(counts).filter((key) => !order.includes(key as T))];

  return keys
    .filter((key) => counts[key] || order.includes(key as T))
    .map((key) => ({
      key,
      label: labels[key] || key,
      count: counts[key] || 0,
      percentage: percentage(counts[key] || 0, total),
      color: colors[key] || "#787585",
    }));
}

function buildPipeline(leads: Lead[]): LeadReportBucket[] {
  const pipelineKeys = ["new", "processing", "follow_up", "sales_handoff", "completed", "skipped"];
  const counts = pipelineKeys.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: 0 }), {});
  leads.forEach((lead) => {
    if (lead.status === "completed") counts.completed += 1;
    else if (lead.status === "skipped") counts.skipped += 1;
    else if (isSalesHandoff(lead)) counts.sales_handoff += 1;
    else if (lead.follow_up_at) counts.follow_up += 1;
    else counts[lead.status] = (counts[lead.status] || 0) + 1;
  });

  const labels: Record<string, string> = {
    new: "Moi",
    processing: "Dang xu ly",
    follow_up: "Follow-up",
    sales_handoff: "Cho chuyen sales",
    completed: "Da chuyen doi",
    skipped: "Bo qua",
  };

  return pipelineKeys.map((key) => ({
    key,
    label: labels[key],
    count: counts[key] || 0,
    percentage: percentage(counts[key] || 0, leads.length),
    color: PIPELINE_COLORS[key],
  }));
}

function buildResponseTrend(leads: Lead[], daysCount = 7): LeadReportTrendPoint[] {
  const buckets: Record<string, { created: number; contacted: number; converted: number; responseTotal: number; responseCount: number }> = {};
  for (let index = daysCount - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    buckets[key] = { created: 0, contacted: 0, converted: 0, responseTotal: 0, responseCount: 0 };
  }

  leads.forEach((lead) => {
    const createdTime = toTime(lead.created_at);
    if (createdTime === null) return;
    const key = new Date(createdTime).toISOString().slice(0, 10);
    const bucket = buckets[key];
    if (!bucket) return;
    bucket.created += 1;
    if (hasContacted(lead)) bucket.contacted += 1;
    if (isConverted(lead)) bucket.converted += 1;
    const responseMinutes = minutesBetween(lead.created_at, lead.first_contacted_at || lead.last_contact_at);
    if (responseMinutes !== null) {
      bucket.responseTotal += responseMinutes;
      bucket.responseCount += 1;
    }
  });

  return Object.entries(buckets).map(([key, bucket]) => ({
    day: new Date(`${key}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    created: bucket.created,
    contacted: bucket.contacted,
    converted: bucket.converted,
    avgResponseMinutes:
      bucket.responseCount > 0 ? Math.round(bucket.responseTotal / bucket.responseCount) : 0,
  }));
}

function buildStaffPerformance(leads: Lead[], nowMs: number): LeadStaffPerformanceRow[] {
  const groups = new Map<string, Lead[]>();
  leads.forEach((lead) => {
    const key = lead.owner_id || "unassigned";
    groups.set(key, [...(groups.get(key) || []), lead]);
  });

  return Array.from(groups.entries())
    .map(([ownerId, ownerLeads]) => {
      const total = ownerLeads.length;
      const contacted = ownerLeads.filter(hasContacted).length;
      const converted = ownerLeads.filter(isConverted).length;
      const overdue = ownerLeads.filter((lead) => getSlaStatus(lead, nowMs) === "Qua han").length;
      return {
        ownerId,
        ownerName: getOwnerName(ownerLeads[0]),
        total,
        contacted,
        converted,
        needResult: ownerLeads.filter(needsLeadResultCapture).length,
        overdue,
        avgFirstResponseMinutes: average(
          ownerLeads.map((lead) => minutesBetween(lead.created_at, lead.first_contacted_at || lead.last_contact_at)),
        ),
        conversionRate: percentage(converted, total),
      };
    })
    .sort((a, b) => b.total - a.total || b.conversionRate - a.conversionRate);
}

function buildDetailRows(leads: Lead[], nowMs: number): LeadReportDetailRow[] {
  return leads.map((lead) => {
    const meta = getLeadWorkbenchMeta(lead, nowMs);
    return {
      id: lead.id,
      customer: lead.author || "Khach hang",
      workspaceId: lead.workspace_id,
      platform: SOURCE_LABELS[lead.platform] || lead.platform,
      intent: lead.intent,
      status: lead.status,
      ownerName: getOwnerName(lead),
      createdAt: lead.created_at,
      firstContactedAt: lead.first_contacted_at || lead.last_contact_at || "",
      responseMinutes: minutesBetween(lead.created_at, lead.first_contacted_at || lead.last_contact_at),
      resultType: lead.result_type || "",
      resultRecordedAt: lead.result_recorded_at || "",
      contactAttempts: lead.contact_attempts || 0,
      followUpAt: lead.follow_up_at || "",
      slaStatus: getSlaStatus(lead, nowMs),
      priorityScore: meta.priorityScore,
      content: lead.content,
      url: lead.source_url || lead.url || "",
    };
  });
}

function buildAiSummary(kpis: LeadReportKpi, sources: LeadReportBucket[], staff: LeadStaffPerformanceRow[]) {
  const topSource = sources.find((item) => item.count > 0);
  const topStaff = staff.find((item) => item.ownerId !== "unassigned");
  const parts = [
    `Ky bao cao ghi nhan ${kpis.total} lead, trong do ${kpis.hot} hot lead can uu tien.`,
    `Ty le da lien he dat ${kpis.contactRate}% va ty le chuyen doi dat ${kpis.conversionRate}%.`,
  ];
  if (kpis.needResult > 0) parts.push(`Co ${kpis.needResult} lead da mo lien he nhung chua ghi ket qua.`);
  if (kpis.slaBreached > 0) parts.push(`${kpis.slaBreached} lead dang tre SLA, can xu ly truoc.`);
  if (topSource) parts.push(`Nguon dong gop nhieu nhat la ${topSource.label} (${topSource.count} lead).`);
  if (topStaff) parts.push(`Nhan vien co nhieu lead nhat: ${topStaff.ownerName} (${topStaff.total} lead).`);
  return parts.join(" ");
}

export function buildLeadReportData(
  leads: Lead[],
  profile?: UserRoleProfile | null,
  nowMs = Date.now(),
): LeadReportData {
  const scopedLeads = leads.filter((lead) => canLeadBeVisibleToUser(lead, profile));
  const contacted = scopedLeads.filter(hasContacted).length;
  const converted = scopedLeads.filter(isConverted).length;
  const slaEvaluated = scopedLeads.filter((lead) => hasContacted(lead));
  const slaOnTime = slaEvaluated.filter((lead) => getSlaStatus(lead, nowMs) === "Dung SLA").length;
  const followUpDue = scopedLeads.filter(
    (lead) => lead.follow_up_at && lead.status !== "completed" && lead.status !== "skipped",
  ).length;
  const followUpOverdue = scopedLeads.filter((lead) => {
    const followUpTime = toTime(lead.follow_up_at);
    return followUpTime !== null && followUpTime < nowMs && lead.status !== "completed" && lead.status !== "skipped";
  }).length;

  const kpis: LeadReportKpi = {
    total: scopedLeads.length,
    hot: scopedLeads.filter((lead) => lead.intent === "hot").length,
    warm: scopedLeads.filter((lead) => lead.intent === "warm").length,
    cold: scopedLeads.filter((lead) => lead.intent === "cold").length,
    contacted,
    uncontacted: scopedLeads.length - contacted,
    needResult: scopedLeads.filter(needsLeadResultCapture).length,
    followUpDue,
    followUpOverdue,
    salesHandoff: scopedLeads.filter(isSalesHandoff).length,
    converted,
    skipped: scopedLeads.filter((lead) => lead.status === "skipped").length,
    slaBreached: scopedLeads.filter((lead) => getSlaStatus(lead, nowMs) === "Qua han" || getSlaStatus(lead, nowMs) === "Tre SLA").length,
    avgFirstResponseMinutes: average(
      scopedLeads.map((lead) => minutesBetween(lead.created_at, lead.first_contacted_at || lead.last_contact_at)),
    ),
    avgResultMinutes: average(
      scopedLeads.map((lead) => minutesBetween(lead.created_at, lead.result_recorded_at || lead.closed_at)),
    ),
    conversionRate: percentage(converted, scopedLeads.length),
    contactRate: percentage(contacted, scopedLeads.length),
    slaOnTimeRate: percentage(slaOnTime, slaEvaluated.length),
  };

  const sourceDistribution = buildDistribution(
    scopedLeads.map((lead) => lead.platform),
    ["facebook", "tiktok", "google_maps", "be", "youtube", "thread", "news"],
    SOURCE_LABELS,
    {
      facebook: "#1877F2",
      tiktok: "#111827",
      google_maps: "#16A34A",
      be: "#22C55E",
      youtube: "#DC2626",
      thread: "#4B5563",
      news: "#2563EB",
    },
  );
  const staffPerformance = buildStaffPerformance(scopedLeads, nowMs);

  return {
    generatedAt: new Date(nowMs).toISOString(),
    kpis,
    intentDistribution: buildDistribution(
      scopedLeads.map((lead) => lead.intent),
      ["hot", "warm", "cold", "none"],
      INTENT_LABELS,
      INTENT_COLORS,
    ),
    sourceDistribution,
    pipeline: buildPipeline(scopedLeads),
    responseTrend: buildResponseTrend(scopedLeads),
    staffPerformance,
    detailRows: buildDetailRows(scopedLeads, nowMs),
    aiSummary: buildAiSummary(kpis, sourceDistribution, staffPerformance),
  };
}

export function formatMinutes(value: number | null) {
  if (value === null) return "--";
  if (value < 60) return `${value} phut`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours}g ${minutes}p` : `${hours} gio`;
}
