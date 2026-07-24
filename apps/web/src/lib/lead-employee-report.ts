import type { UserRoleProfile } from "@/lib/rbac";
import {
  buildLeadReportData,
  type LeadReportData,
  type LeadReportDetailRow,
} from "@/lib/lead-report";
import {
  filterLeadReportItems,
  type LeadReportFilters,
} from "@/lib/lead-report-filters";
import {
  getLeadExpiryTime,
  getLeadWorkbenchMeta,
  needsLeadResultCapture,
} from "@/lib/lead-workbench";
import type { Lead } from "@/types/dashboard";

export interface LeadEmployeeKpis {
  assignedInPeriod: number;
  contactedInPeriod: number;
  convertedInPeriod: number;
  resultRecordedInPeriod: number;
  conversionRate: number;
  slaOnTimeRate: number;
  avgFirstResponseMinutes: number | null;
  openCurrent: number;
  needResultCurrent: number;
  followUpOverdueCurrent: number;
  claimable: number;
}

export interface LeadPriorityRow extends LeadReportDetailRow {
  urgencyLevel: "urgent" | "attention" | "normal";
  urgencyReasons: string[];
  remainingSlaMinutes: number | null;
  nextActionLabel: string;
}

export interface LeadAttentionItem {
  key: "overdue_hot" | "need_result" | "follow_up" | "claimable";
  title: string;
  description: string;
  count: number;
  href: string;
  tone: "danger" | "warn" | "info";
}

export interface LeadActivityTrendPoint {
  day: string;
  created: number;
  contacted: number;
  converted: number;
}

export interface LeadEmployeeReportData extends LeadReportData {
  personalKpis: LeadEmployeeKpis;
  priorityRows: LeadPriorityRow[];
  attentionItems: LeadAttentionItem[];
  recommendations: string[];
  activityTrend: LeadActivityTrendPoint[];
}

function toTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function isOpen(lead: Lead) {
  return lead.status !== "completed" && lead.status !== "skipped";
}

function isConverted(lead: Lead) {
  return lead.status === "completed" || lead.result_type === "converted";
}

function contactTime(lead: Lead) {
  return lead.first_contacted_at || lead.last_contact_at;
}

function resultTime(lead: Lead) {
  return lead.result_recorded_at || lead.closed_at;
}

function isInSelectedPeriod(
  value: string | null | undefined,
  filters: LeadReportFilters,
  nowMs: number,
) {
  const time = toTime(value);
  if (time === null) return false;
  if (filters.timeRange === "all") return true;
  if (filters.timeRange === "today") {
    const start = new Date(nowMs);
    start.setHours(0, 0, 0, 0);
    const end = new Date(nowMs);
    end.setHours(23, 59, 59, 999);
    return time >= start.getTime() && time <= end.getTime();
  }
  if (filters.timeRange === "7d") return time >= nowMs - 7 * 24 * 60 * 60 * 1000;
  if (filters.timeRange === "30d") return time >= nowMs - 30 * 24 * 60 * 60 * 1000;
  const start = filters.startDate
    ? new Date(`${filters.startDate}T00:00:00`).getTime()
    : null;
  const end = filters.endDate
    ? new Date(`${filters.endDate}T23:59:59`).getTime()
    : null;
  return (start === null || time >= start) && (end === null || time <= end);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function buildPriorityRows(leads: Lead[], report: LeadReportData, nowMs: number) {
  const detailsById = new Map(report.detailRows.map((row) => [row.id, row]));
  const urgencyRank = { urgent: 3, attention: 2, normal: 1 } as const;

  return leads
    .filter(isOpen)
    .map((lead): LeadPriorityRow | null => {
      const row = detailsById.get(lead.id);
      if (!row) return null;
      const meta = getLeadWorkbenchMeta(lead, nowMs);
      const followUpTime = toTime(lead.follow_up_at);
      const isFollowUpOverdue = followUpTime !== null && followUpTime < nowMs;
      const urgencyReasons = [
        ...meta.priorityReasons,
        ...(isFollowUpOverdue ? ["Đã đến hạn follow-up"] : []),
      ].filter((reason, index, items) => items.indexOf(reason) === index);
      const urgencyLevel =
        meta.isOverdue || (lead.intent === "hot" && meta.isUrgent)
          ? "urgent"
          : meta.isUrgent || meta.needsResultCapture || isFollowUpOverdue
            ? "attention"
            : "normal";
      return {
        ...row,
        urgencyLevel,
        urgencyReasons,
        remainingSlaMinutes: Math.round(meta.remainingMs / 60000),
        nextActionLabel: meta.nextActionLabel,
      };
    })
    .filter((row): row is LeadPriorityRow => Boolean(row))
    .sort(
      (a, b) =>
        urgencyRank[b.urgencyLevel] - urgencyRank[a.urgencyLevel] ||
        b.priorityScore - a.priorityScore ||
        (a.remainingSlaMinutes ?? Number.MAX_SAFE_INTEGER) -
          (b.remainingSlaMinutes ?? Number.MAX_SAFE_INTEGER),
    );
}

function buildAttentionItems(
  priorityRows: LeadPriorityRow[],
  claimableCount: number,
): LeadAttentionItem[] {
  const items: LeadAttentionItem[] = [
    {
      key: "overdue_hot",
      title: "Hot lead quá hạn / sắp hạn",
      description: "Ưu tiên liên hệ trước để bảo toàn cơ hội chuyển đổi.",
      count: priorityRows.filter(
        (row) => row.intent === "hot" && row.urgencyLevel === "urgent",
      ).length,
      href: "/leads?reportFilter=urgent",
      tone: "danger",
    },
    {
      key: "need_result",
      title: "Chưa ghi nhận kết quả",
      description: "Đã thao tác liên hệ nhưng chưa cập nhật kết quả xử lý.",
      count: priorityRows.filter((row) => row.nextActionLabel === "Ghi nhận kết quả").length,
      href: "/leads?reportFilter=need_result",
      tone: "warn",
    },
    {
      key: "follow_up",
      title: "Follow-up đã đến hạn",
      description: "Cần tiếp tục tương tác theo lịch đã hẹn với khách hàng.",
      count: priorityRows.filter((row) =>
        row.urgencyReasons.includes("Đã đến hạn follow-up"),
      ).length,
      href: "/leads?reportFilter=follow_up",
      tone: "warn",
    },
    {
      key: "claimable",
      title: "Có thể nhận xử lý",
      description: "Lead chưa phân công, không tính vào hiệu suất cá nhân.",
      count: claimableCount,
      href: "/leads?reportFilter=unassigned",
      tone: "info",
    },
  ];
  return items.filter((item) => item.count > 0);
}

function buildRecommendations(kpis: LeadEmployeeKpis, rows: LeadPriorityRow[]) {
  const recommendations: string[] = [];
  const urgentHot = rows.filter(
    (row) => row.intent === "hot" && row.urgencyLevel === "urgent",
  ).length;
  if (urgentHot > 0) {
    recommendations.push(`Liên hệ ${urgentHot} hot lead quá hạn hoặc sắp hết SLA trước các lead khác.`);
  }
  if (kpis.needResultCurrent > 0) {
    recommendations.push(`Ghi nhận kết quả cho ${kpis.needResultCurrent} lead đã có thao tác liên hệ để dữ liệu không bị gián đoạn.`);
  }
  if (kpis.followUpOverdueCurrent > 0) {
    recommendations.push(`Hoàn tất ${kpis.followUpOverdueCurrent} lịch follow-up đã đến hạn trong ca làm việc hiện tại.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(
      kpis.openCurrent > 0
        ? `Tiếp tục xử lý ${kpis.openCurrent} lead đang mở theo mức độ tiềm năng và hạn SLA.`
        : "Không có tồn đọng nổi bật; duy trì nhịp xử lý hiện tại.",
    );
  }
  return recommendations.slice(0, 3);
}

function buildActivityTrend(leads: Lead[], nowMs: number) {
  const buckets = new Map<string, LeadActivityTrendPoint>();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(nowMs);
    date.setDate(date.getDate() - index);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      day: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      created: 0,
      contacted: 0,
      converted: 0,
    });
  }
  leads.forEach((lead) => {
    const created = toTime(lead.created_at);
    const contacted = toTime(contactTime(lead));
    const converted = isConverted(lead) ? toTime(resultTime(lead)) : null;
    const createdKey = created === null ? "" : new Date(created).toISOString().slice(0, 10);
    const contactedKey = contacted === null ? "" : new Date(contacted).toISOString().slice(0, 10);
    const convertedKey = converted === null ? "" : new Date(converted).toISOString().slice(0, 10);
    if (buckets.has(createdKey)) buckets.get(createdKey)!.created += 1;
    if (buckets.has(contactedKey)) buckets.get(contactedKey)!.contacted += 1;
    if (buckets.has(convertedKey)) buckets.get(convertedKey)!.converted += 1;
  });
  return Array.from(buckets.values());
}

export function buildLeadEmployeeReportData(
  leads: Lead[],
  filters: LeadReportFilters,
  profile?: UserRoleProfile | null,
  nowMs = Date.now(),
): LeadEmployeeReportData {
  const personalLeads = leads.filter((lead) => lead.owner_id === profile?.uid);
  const claimableCount = leads.filter((lead) => !lead.owner_id && isOpen(lead)).length;
  const periodLeads = filterLeadReportItems(personalLeads, filters, profile, nowMs);
  const currentLeads = filterLeadReportItems(
    personalLeads,
    { ...filters, timeRange: "all", startDate: "", endDate: "", owner: "mine" },
    profile,
    nowMs,
  );
  const periodReport = buildLeadReportData(periodLeads, profile, nowMs);
  const currentReport = buildLeadReportData(currentLeads, profile, nowMs);
  const contactedInPeriod = currentLeads.filter((lead) =>
    isInSelectedPeriod(contactTime(lead), filters, nowMs),
  );
  const outcomesInPeriod = currentLeads.filter((lead) =>
    isInSelectedPeriod(resultTime(lead), filters, nowMs),
  );
  const convertedInPeriod = outcomesInPeriod.filter(isConverted).length;
  const responseMinutes = contactedInPeriod
    .map((lead) => {
      const created = toTime(lead.created_at);
      const contacted = toTime(contactTime(lead));
      return created === null || contacted === null || contacted < created
        ? null
        : Math.round((contacted - created) / 60000);
    })
    .filter((value): value is number => value !== null);
  const slaEligibleContacts = contactedInPeriod.filter(
    (lead) => !getLeadWorkbenchMeta(lead, nowMs).wasOverdueOnIngest,
  );
  const slaOnTime = slaEligibleContacts.filter((lead) => {
    const contacted = toTime(contactTime(lead));
    return contacted !== null && contacted <= getLeadExpiryTime(lead);
  }).length;
  const openCurrentLeads = currentLeads.filter(isOpen);
  const followUpOverdueCurrent = openCurrentLeads.filter((lead) => {
    const followUp = toTime(lead.follow_up_at);
    return followUp !== null && followUp < nowMs;
  }).length;
  const priorityRows = buildPriorityRows(currentLeads, currentReport, nowMs);
  const personalKpis: LeadEmployeeKpis = {
    assignedInPeriod: currentLeads.filter((lead) =>
      isInSelectedPeriod(lead.assigned_at || lead.claimed_at, filters, nowMs),
    ).length,
    contactedInPeriod: contactedInPeriod.length,
    convertedInPeriod,
    resultRecordedInPeriod: outcomesInPeriod.length,
    conversionRate: percentage(convertedInPeriod, outcomesInPeriod.length),
    slaOnTimeRate: percentage(slaOnTime, slaEligibleContacts.length),
    avgFirstResponseMinutes: average(responseMinutes),
    openCurrent: openCurrentLeads.length,
    needResultCurrent: openCurrentLeads.filter(needsLeadResultCapture).length,
    followUpOverdueCurrent,
    claimable: claimableCount,
  };

  return {
    ...periodReport,
    personalKpis,
    priorityRows,
    attentionItems: buildAttentionItems(priorityRows, claimableCount),
    recommendations: buildRecommendations(personalKpis, priorityRows),
    activityTrend: buildActivityTrend(currentLeads, nowMs),
  };
}
