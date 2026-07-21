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
  urgencyLevel: "urgent" | "attention" | "normal";
  urgencyReasons: string[];
}

export interface DualOperationsAttentionItem {
  key: "crisis_overdue" | "lead_overdue" | "lead_need_result" | "crisis_pending";
  title: string;
  description: string;
  count: number;
  href: string;
  tone: "danger" | "warn" | "info";
}

export interface DualOperationsReportData {
  generatedAt: string;
  lead: LeadReportData;
  crisis: CrisisReportData;
  kpis: DualOperationsKpi;
  workloadDistribution: DualOperationsBucket[];
  priorityRows: DualOperationsPriorityRow[];
  attentionItems: DualOperationsAttentionItem[];
  recommendations: string[];
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
  const urgencyReasons = [
    ...(isBadSla(row.slaStatus) ? [row.slaStatus] : []),
    ...(row.intent === "hot" ? ["Hot Lead cần phản hồi sớm"] : []),
    ...(resultScore > 0 ? ["Đã liên hệ nhưng chưa ghi nhận kết quả"] : []),
  ];

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
    urgencyLevel: isBadSla(row.slaStatus)
      ? "urgent"
      : row.intent === "hot" || resultScore > 0
        ? "attention"
        : "normal",
    urgencyReasons,
  };
}

function mapCrisisPriorityRow(row: CrisisReportDetailRow): DualOperationsPriorityRow {
  const severityScore = row.severity === "critical" ? 90 : row.severity === "high" ? 60 : row.severity === "medium" ? 25 : 8;
  const slaScore = isBadSla(row.slaStatus) ? 70 : row.slaStatus === "Trong SLA" ? 15 : 0;
  const escalationScore = row.escalated ? 35 : 0;
  const urgencyReasons = [
    ...(isBadSla(row.slaStatus) ? [row.slaStatus] : []),
    ...(row.severity === "critical" ? ["Cảnh báo mức nguy cấp"] : []),
    ...(row.severity === "high" ? ["Cảnh báo mức cao"] : []),
    ...(row.escalated ? ["Đang escalation hoặc chờ duyệt"] : []),
  ];

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
    urgencyLevel:
      isBadSla(row.slaStatus) || row.severity === "critical"
        ? "urgent"
        : row.severity === "high" || row.escalated
          ? "attention"
          : "normal",
    urgencyReasons,
  };
}

function buildPriorityRows(lead: LeadReportData, crisis: CrisisReportData) {
  const leadRows = lead.detailRows
    .filter((row) => row.status !== "completed" && row.status !== "skipped")
    .map(mapLeadPriorityRow);
  const crisisRows = crisis.detailRows
    .filter((row) => row.status !== "resolved")
    .map(mapCrisisPriorityRow);

  const urgencyRank = { urgent: 3, attention: 2, normal: 1 } as const;
  return [...leadRows, ...crisisRows]
    .sort(
      (a, b) =>
        urgencyRank[b.urgencyLevel] - urgencyRank[a.urgencyLevel] ||
        b.score - a.score,
    )
    .slice(0, 80);
}

function buildAttentionItems(
  lead: LeadReportData,
  crisis: CrisisReportData,
): DualOperationsAttentionItem[] {
  const items: DualOperationsAttentionItem[] = [
    {
      key: "crisis_overdue",
      title: "Cảnh báo quá hạn",
      description: "Case khủng hoảng cần được xử lý hoặc rà soát SLA ngay.",
      count: crisis.kpis.overdue,
      href: "/alerts?sla=overdue",
      tone: "danger",
    },
    {
      key: "lead_overdue",
      title: "Lead trễ SLA",
      description: "Khách hàng tiềm năng có nguy cơ mất cơ hội chuyển đổi.",
      count: lead.kpis.slaBreached,
      href: "/leads?sla=overdue",
      tone: "warn",
    },
    {
      key: "lead_need_result",
      title: "Chưa ghi nhận kết quả",
      description: "Lead đã mở liên hệ nhưng chưa hoàn tất kết quả xử lý.",
      count: lead.kpis.needResult,
      href: "/leads?view=active",
      tone: "info",
    },
    {
      key: "crisis_pending",
      title: "Đang chờ duyệt",
      description: "Case cần theo dõi quyết định hoặc phản hồi tiếp theo.",
      count: crisis.kpis.pendingApproval,
      href: "/alerts?status=pending_approval",
      tone: "warn",
    },
  ];
  return items
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
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

function buildRecommendations(
  lead: LeadReportData,
  crisis: CrisisReportData,
  kpis: DualOperationsKpi,
) {
  const recommendations: string[] = [];
  if (crisis.kpis.overdue > 0) {
    recommendations.push(
      `Ưu tiên xử lý ${crisis.kpis.overdue} cảnh báo quá hạn trước khi nhận thêm case mới.`,
    );
  }
  if (lead.kpis.slaBreached > 0) {
    recommendations.push(
      `Liên hệ lại ${lead.kpis.slaBreached} Lead trễ SLA để giảm nguy cơ mất cơ hội.`,
    );
  }
  if (lead.kpis.needResult > 0) {
    recommendations.push(
      `Hoàn tất ghi nhận kết quả cho ${lead.kpis.needResult} Lead đã được liên hệ.`,
    );
  }
  if (crisis.kpis.pendingApproval > 0) {
    recommendations.push(
      `Theo dõi ${crisis.kpis.pendingApproval} case đang chờ duyệt để không gián đoạn xử lý.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      kpis.pendingTasks > 0
        ? `Tiếp tục xử lý ${kpis.pendingTasks} công việc còn mở theo hạn SLA gần nhất.`
        : "Không có rủi ro nổi bật trong kỳ; duy trì nhịp xử lý hiện tại.",
    );
  }
  return recommendations.slice(0, 3);
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
    attentionItems: buildAttentionItems(lead, crisis),
    recommendations: buildRecommendations(lead, crisis, kpis),
    aiSummary: buildAiSummary({ lead, crisis, kpis, priorityRows }),
  };
}
