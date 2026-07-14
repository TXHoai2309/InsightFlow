import type { CrisisReportData, CrisisReportDetailRow } from "@/lib/crisis-report";
import type { LeadReportData, LeadReportDetailRow } from "@/lib/lead-report";

export interface DualOperationsKpi {
  totalTasks: number;
  leadTotal: number;
  crisisTotal: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  priorityTasks: number;
  leadConversionRate: number;
  crisisResolvedRate: number;
  slaOnTimeRate: number;
}

export interface DualOperationsBucket {
  key: "lead" | "crisis";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DualOperationsPriorityRow {
  id: string;
  type: "lead" | "crisis";
  typeLabel: string;
  title: string;
  priority: string;
  status: string;
  slaStatus: string;
  ownerName: string;
  content: string;
  href: string;
  score: number;
}

export interface DualOperationsReportData {
  generatedAt: string;
  lead: LeadReportData;
  crisis: CrisisReportData;
  kpis: DualOperationsKpi;
  workloadDistribution: DualOperationsBucket[];
  priorityRows: DualOperationsPriorityRow[];
  aiSummary: string;
}

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function averagePercent(values: Array<{ rate: number; total: number }>) {
  const total = values.reduce((sum, item) => sum + item.total, 0);
  if (total <= 0) return 0;
  const weighted = values.reduce((sum, item) => sum + item.rate * item.total, 0);
  return Math.round(weighted / total);
}

function isBadSla(status: string) {
  return status === "Qua han" || status === "Tre SLA";
}

function mapLeadPriorityRow(row: LeadReportDetailRow): DualOperationsPriorityRow {
  const slaScore = isBadSla(row.slaStatus) ? 55 : row.slaStatus === "Trong SLA" ? 8 : 0;
  const intentScore = row.intent === "hot" ? 45 : row.intent === "warm" ? 25 : row.intent === "cold" ? 8 : 0;
  const resultScore = !row.resultType && row.contactAttempts > 0 && row.status === "processing" ? 25 : 0;

  return {
    id: row.id,
    type: "lead",
    typeLabel: "Lead",
    title: row.customer || "Khach hang",
    priority: row.intent.toUpperCase(),
    status: row.status,
    slaStatus: row.slaStatus,
    ownerName: row.ownerName,
    content: row.content,
    href: `/leads?leadId=${encodeURIComponent(row.id)}`,
    score: row.priorityScore + slaScore + intentScore + resultScore,
  };
}

function mapCrisisPriorityRow(row: CrisisReportDetailRow): DualOperationsPriorityRow {
  const severityScore = row.severity === "critical" ? 90 : row.severity === "high" ? 60 : row.severity === "medium" ? 25 : 8;
  const slaScore = isBadSla(row.slaStatus) ? 70 : row.slaStatus === "Trong SLA" ? 15 : 0;
  const escalationScore = row.escalated ? 35 : 0;

  return {
    id: row.id,
    type: "crisis",
    typeLabel: "Khung hoang",
    title: row.topic || "Case khung hoang",
    priority: row.severity.toUpperCase(),
    status: row.status,
    slaStatus: row.slaStatus,
    ownerName: row.assigneeName,
    content: row.content,
    href: `/alerts?alertId=${encodeURIComponent(row.id)}`,
    score: row.negativityScore + severityScore + slaScore + escalationScore,
  };
}

function buildPriorityRows(lead: LeadReportData, crisis: CrisisReportData) {
  const leadRows = lead.detailRows
    .filter((row) => row.status !== "completed" && row.status !== "skipped")
    .map(mapLeadPriorityRow);
  const crisisRows = crisis.detailRows
    .filter((row) => row.status !== "resolved")
    .map(mapCrisisPriorityRow);

  return [...leadRows, ...crisisRows]
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);
}

function buildAiSummary(report: {
  lead: LeadReportData;
  crisis: CrisisReportData;
  kpis: DualOperationsKpi;
  priorityRows: DualOperationsPriorityRow[];
}) {
  const parts = [
    `Ky bao cao ghi nhan ${report.kpis.totalTasks} viec trong pham vi cua nhan vien, gom ${report.kpis.leadTotal} lead va ${report.kpis.crisisTotal} case khung hoang.`,
    `Da hoan tat ${report.kpis.completedTasks} viec; con ${report.kpis.pendingTasks} viec can tiep tuc xu ly.`,
    `Ty le dung SLA tong hop dat ${report.kpis.slaOnTimeRate}%.`,
  ];

  if (report.kpis.priorityTasks > 0) {
    parts.push(`Co ${report.kpis.priorityTasks} viec uu tien cao, trong do can xem truoc cac dong dau danh sach uu tien.`);
  }
  if (report.kpis.overdueTasks > 0) {
    parts.push(`${report.kpis.overdueTasks} viec dang qua han hoac tre SLA, nen xu ly truoc khi mo rong sang viec moi.`);
  }
  if (report.lead.kpis.needResult > 0) {
    parts.push(`${report.lead.kpis.needResult} lead da mo lien he nhung chua ghi ket qua.`);
  }
  if (report.crisis.kpis.escalated > 0) {
    parts.push(`${report.crisis.kpis.escalated} case khung hoang da escalate/cho duyet, can theo doi quyet dinh tiep theo.`);
  }

  return parts.join(" ");
}

export function buildDualOperationsReportData(
  lead: LeadReportData,
  crisis: CrisisReportData,
): DualOperationsReportData {
  const leadTotal = lead.kpis.total;
  const crisisTotal = crisis.kpis.total;
  const totalTasks = leadTotal + crisisTotal;
  const completedTasks = lead.kpis.converted + lead.kpis.skipped + crisis.kpis.resolved;
  const overdueTasks = lead.kpis.slaBreached + crisis.kpis.overdue;
  const priorityTasks = lead.kpis.hot + crisis.kpis.critical + crisis.kpis.high;
  const priorityRows = buildPriorityRows(lead, crisis);

  const kpis: DualOperationsKpi = {
    totalTasks,
    leadTotal,
    crisisTotal,
    completedTasks,
    pendingTasks: Math.max(0, totalTasks - completedTasks),
    overdueTasks,
    priorityTasks,
    leadConversionRate: lead.kpis.conversionRate,
    crisisResolvedRate: crisis.kpis.resolvedRate,
    slaOnTimeRate: averagePercent([
      { rate: lead.kpis.slaOnTimeRate, total: leadTotal },
      { rate: crisis.kpis.slaOnTimeRate, total: crisisTotal },
    ]),
  };

  return {
    generatedAt: new Date(
      Math.max(new Date(lead.generatedAt).getTime(), new Date(crisis.generatedAt).getTime()),
    ).toISOString(),
    lead,
    crisis,
    kpis,
    workloadDistribution: [
      {
        key: "lead",
        label: "Lead",
        count: leadTotal,
        percentage: percentage(leadTotal, totalTasks),
        color: "#4234B6",
      },
      {
        key: "crisis",
        label: "Khung hoang",
        count: crisisTotal,
        percentage: percentage(crisisTotal, totalTasks),
        color: "#BA1A1A",
      },
    ],
    priorityRows,
    aiSummary: buildAiSummary({ lead, crisis, kpis, priorityRows }),
  };
}
