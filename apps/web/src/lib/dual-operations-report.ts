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
  priorityOpen: DualOperationsKpiBreakdown;
  leadConversionRate: number;
  crisisResolvedRate: number;
  slaOnTimeRate: number;
  workflow: {
    unassigned: DualOperationsKpiBreakdown;
    inProgress: DualOperationsKpiBreakdown;
    completed: DualOperationsKpiBreakdown;
    completionRate: DualOperationsKpiBreakdown;
    overdueOpen: DualOperationsKpiBreakdown;
  };
}

export interface DualOperationsKpiBreakdown {
  total: number;
  lead: number;
  crisis: number;
}

export interface DualOperationsBucket {
  key: "lead" | "crisis";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DualOperationsAttentionItem {
  key:
    | "crisis_overdue"
    | "crisis_high_priority"
    | "lead_overdue"
    | "lead_follow_up"
    | "lead_need_result"
    | "crisis_pending";
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
  attentionItems: DualOperationsAttentionItem[];
  managementInsights: string[];
  recommendations: string[];
  aiSummary: string;
}

export type DualOperationsReportScope = "all" | "lead" | "crisis";

export function buildDualOperationsAIRequestData(
  report: DualOperationsReportData,
  scope: DualOperationsReportScope,
  brandName: string,
) {
  const leadSamples = scope === "crisis"
    ? []
    : report.lead.detailRows.map((row) => ({
        content: `LEAD | ${row.customer} | ${row.content}`,
        sentiment: "positive",
        topic: "lead",
        source: row.platform || "system",
        priority: row.priorityScore,
      }));
  const crisisSamples = scope === "lead"
    ? []
    : report.crisis.detailRows.map((row) => ({
        content: `CRISIS | ${row.topic || row.brand} | ${row.content}`,
        sentiment: row.sentiment || "negative",
        topic: row.topic || "crisis",
        source: row.platform || "system",
        priority:
          row.severity === "critical" ? 100 : row.severity === "high" ? 75 : row.negativityScore,
      }));
  const mentions = [...crisisSamples, ...leadSamples]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 20)
    .map(({ priority: _priority, ...row }) => row);

  const basePrompt = `Báo cáo tác nghiệp cho ${brandName}. Đã hoàn tất: ${report.kpis.completedTasks}, Đúng SLA: ${report.kpis.slaOnTimeRate}%, Còn mở: ${report.kpis.pendingTasks}, Quá hạn: ${report.kpis.overdueTasks}. Đưa ra đánh giá sức khỏe thương hiệu, điểm nóng dư luận/SLA và 3 khuyến nghị hành động ưu tiên.`;
  if (scope === "all") return { mentions, prompt: basePrompt };

  const scopeInstruction = scope === "lead"
    ? "Phạm vi báo cáo chỉ gồm Khách hàng tiềm năng (Lead). Chỉ phân tích dữ liệu Lead được cung cấp, không đưa nhận định hoặc số liệu về Cảnh báo/Khủng hoảng."
    : "Phạm vi báo cáo chỉ gồm Cảnh báo/Khủng hoảng. Chỉ phân tích dữ liệu Cảnh báo được cung cấp, không đưa nhận định hoặc số liệu về Lead.";

  return { mentions, prompt: `${basePrompt} ${scopeInstruction}` };
}
function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isOpenOverdueSla(status: string) {
  return normalizeLabel(status) === "qua han";
}

function getLeadWorkflowStatus(row: LeadReportDetailRow) {
  if (row.workflowStatus) return row.workflowStatus;
  if (row.status === "completed") return "completed";
  if (row.status === "skipped") return "skipped";
  const owner = row.ownerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return owner === "chua phan cong" ? "unassigned" : "processing";
}

function getCrisisWorkflowStatus(row: CrisisReportDetailRow) {
  if (row.workflowStatus) return row.workflowStatus;
  const status = row.status.trim().toLowerCase();
  if (["resolved", "completed", "monitoring", "responded"].includes(status)) return "resolved";
  if (["skipped", "ignored", "dismissed"].includes(status)) return "skipped";
  if (["contact_failed", "contact_unsuccessful"].includes(status)) return "contact_failed";
  if ([
    "resolving",
    "processing",
    "acknowledged",
    "in_progress",
    "pending_approval",
    "waiting_approval",
    "awaiting_approval",
    "contact_waiting",
  ].includes(status)) return "processing";
  return "pending";
}

function toBreakdown(lead: number, crisis: number): DualOperationsKpiBreakdown {
  return { total: lead + crisis, lead, crisis };
}

function isCrisisPendingApproval(row: CrisisReportDetailRow) {
  return [
    "pending_approval",
    "waiting_approval",
    "awaiting_approval",
  ].includes(row.status.trim().toLowerCase());
}

function buildAttentionItems(
  lead: LeadReportData,
  crisis: CrisisReportData,
): DualOperationsAttentionItem[] {
  const leadOverdueOpen = lead.detailRows.filter(
    (row) => !["completed", "skipped"].includes(getLeadWorkflowStatus(row)) && isOpenOverdueSla(row.slaStatus),
  ).length;
  const crisisOverdueOpen = crisis.detailRows.filter(
    (row) => !["resolved", "skipped"].includes(getCrisisWorkflowStatus(row)) && isOpenOverdueSla(row.slaStatus),
  ).length;
  const crisisHighPriorityOpen = crisis.detailRows.filter(
    (row) =>
      !["resolved", "skipped"].includes(getCrisisWorkflowStatus(row)) &&
      ["critical", "high"].includes(row.severity),
  ).length;
  const crisisPendingApproval = crisis.detailRows.filter(
    (row) =>
      !["resolved", "skipped"].includes(getCrisisWorkflowStatus(row)) &&
      isCrisisPendingApproval(row),
  ).length;
  const items: DualOperationsAttentionItem[] = [
    {
      key: "crisis_overdue",
      title: "Cảnh báo quá hạn",
      description: "Case khủng hoảng cần được xử lý hoặc rà soát SLA ngay.",
      count: crisisOverdueOpen,
      href: "/alerts",
      tone: "danger",
    },
    {
      key: "crisis_high_priority",
      title: "Cảnh báo Critical/High còn mở",
      description: "Nhóm rủi ro cao cần được quản lý theo dõi đến khi đóng.",
      count: crisisHighPriorityOpen,
      href: "/alerts",
      tone: "danger",
    },
    {
      key: "lead_overdue",
      title: "Lead trễ SLA",
      description: "Khách hàng tiềm năng có nguy cơ mất cơ hội chuyển đổi.",
      count: leadOverdueOpen,
      href: "/leads?sla=overdue",
      tone: "warn",
    },
    {
      key: "lead_follow_up",
      title: "Follow-up đã đến hạn",
      description: "Lịch liên hệ lại đã đến hạn nhưng chưa hoàn tất.",
      count: lead.kpis.followUpOverdue,
      href: "/leads?view=follow_up&sla=overdue",
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
      count: crisisPendingApproval,
      href: "/alerts",
      tone: "warn",
    },
  ];
  return items
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      const toneRank = { danger: 3, warn: 2, info: 1 } as const;
      return toneRank[b.tone] - toneRank[a.tone] || b.count - a.count;
    });
}

function buildAiSummary(report: {
  lead: LeadReportData;
  crisis: CrisisReportData;
  kpis: DualOperationsKpi;
}) {
  const parts = [
    `Ky bao cao ghi nhan ${report.kpis.totalTasks} viec trong pham vi thuong hieu, gom ${report.kpis.leadTotal} lead va ${report.kpis.crisisTotal} case khung hoang.`,
    `Da hoan tat ${report.kpis.completedTasks} viec; con ${report.kpis.pendingTasks} viec can tiep tuc xu ly.`,
    `Ty le dung SLA tong hop dat ${report.kpis.slaOnTimeRate}%.`,
  ];

  if (report.kpis.priorityTasks > 0) {
    parts.push(`Co ${report.kpis.priorityTasks} viec uu tien cao con mo can duoc theo doi.`);
  }
  if (report.kpis.overdueTasks > 0) {
    parts.push(`${report.kpis.overdueTasks} viec con mo da qua han SLA, nen xu ly truoc khi mo rong sang viec moi.`);
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
  const crisisPendingApproval = crisis.detailRows.filter(
    (row) =>
      !["resolved", "skipped"].includes(getCrisisWorkflowStatus(row)) &&
      isCrisisPendingApproval(row),
  ).length;
  if (kpis.workflow.overdueOpen.crisis > 0) {
    recommendations.push(
      `Ưu tiên xử lý ${kpis.workflow.overdueOpen.crisis} cảnh báo còn mở đã quá hạn trước khi nhận thêm case mới.`,
    );
  }
  if (kpis.workflow.overdueOpen.lead > 0) {
    recommendations.push(
      `Liên hệ lại ${kpis.workflow.overdueOpen.lead} Lead còn mở đã quá hạn để giảm nguy cơ mất cơ hội.`,
    );
  }
  if (lead.kpis.needResult > 0) {
    recommendations.push(
      `Hoàn tất ghi nhận kết quả cho ${lead.kpis.needResult} Lead đã được liên hệ.`,
    );
  }
  if (lead.kpis.followUpOverdue > 0) {
    recommendations.push(
      `Yêu cầu đội phụ trách hoàn tất ${lead.kpis.followUpOverdue} lịch Follow-up đã quá hạn trong kỳ gần nhất.`,
    );
  }
  if (crisisPendingApproval > 0) {
    recommendations.push(
      `Theo dõi ${crisisPendingApproval} case đang chờ duyệt để không gián đoạn xử lý.`,
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

function buildManagementInsights(
  lead: LeadReportData,
  kpis: DualOperationsKpi,
) {
  const insights: string[] = [];

  if (kpis.priorityOpen.crisis > 0) {
    insights.push(
      `${kpis.priorityOpen.crisis} cảnh báo Critical/High còn mở là nhóm có mức ảnh hưởng thương hiệu cao nhất cần được theo dõi.`,
    );
  }
  if (kpis.workflow.overdueOpen.total > 0) {
    insights.push(
      `${kpis.workflow.overdueOpen.total} công việc còn mở đã quá hạn; dữ liệu cho thấy tồn đọng tập trung ở ${kpis.workflow.overdueOpen.crisis} cảnh báo và ${kpis.workflow.overdueOpen.lead} Lead.`,
    );
  }
  if (kpis.totalTasks > 0 && kpis.workflow.completionRate.total < 70) {
    insights.push(
      `Tỷ lệ hoàn thành hiện đạt ${kpis.workflow.completionRate.total}%, trong khi còn ${kpis.pendingTasks} công việc chưa đóng trong phạm vi báo cáo.`,
    );
  }
  if (lead.kpis.followUpOverdue > 0) {
    insights.push(
      `${lead.kpis.followUpOverdue} lịch Follow-up đã quá hạn có thể làm chậm khả năng chuyển đổi khách hàng tiềm năng.`,
    );
  }
  if (lead.kpis.needResult > 0) {
    insights.push(
      `${lead.kpis.needResult} Lead đã liên hệ nhưng chưa ghi nhận kết quả, làm giảm độ đầy đủ của dữ liệu quản trị.`,
    );
  }

  if (insights.length === 0) {
    insights.push("Không ghi nhận rủi ro quản trị nổi bật trong phạm vi và bộ lọc hiện tại.");
  }
  return insights.slice(0, 3);
}

export function buildDualOperationsReportData(
  lead: LeadReportData,
  crisis: CrisisReportData,
): DualOperationsReportData {
  const leadUnassigned = lead.detailRows.filter((row) => getLeadWorkflowStatus(row) === "unassigned").length;
  const leadInProgress = lead.detailRows.filter((row) =>
    ["processing", "follow_up"].includes(getLeadWorkflowStatus(row)),
  ).length;
  const leadCompleted = lead.detailRows.filter((row) => getLeadWorkflowStatus(row) === "completed").length;
  const leadOverdueOpen = lead.detailRows.filter(
    (row) => !["completed", "skipped"].includes(getLeadWorkflowStatus(row)) && isOpenOverdueSla(row.slaStatus),
  ).length;

  const crisisUnassigned = crisis.detailRows.filter((row) => getCrisisWorkflowStatus(row) === "pending").length;
  const crisisInProgress = crisis.detailRows.filter((row) =>
    ["processing", "contact_failed"].includes(getCrisisWorkflowStatus(row)),
  ).length;
  const crisisCompleted = crisis.detailRows.filter((row) => getCrisisWorkflowStatus(row) === "resolved").length;
  const crisisOverdueOpen = crisis.detailRows.filter(
    (row) => !["resolved", "skipped"].includes(getCrisisWorkflowStatus(row)) && isOpenOverdueSla(row.slaStatus),
  ).length;
  const leadPriorityOpen = lead.detailRows.filter(
    (row) =>
      !["completed", "skipped"].includes(getLeadWorkflowStatus(row)) &&
      row.intent === "hot",
  ).length;
  const crisisPriorityOpen = crisis.detailRows.filter(
    (row) =>
      !["resolved", "skipped"].includes(getCrisisWorkflowStatus(row)) &&
      ["critical", "high"].includes(row.severity),
  ).length;

  const workflow = {
    unassigned: toBreakdown(leadUnassigned, crisisUnassigned),
    inProgress: toBreakdown(leadInProgress, crisisInProgress),
    completed: toBreakdown(leadCompleted, crisisCompleted),
    completionRate: toBreakdown(0, 0),
    overdueOpen: toBreakdown(leadOverdueOpen, crisisOverdueOpen),
  };
  const leadTotal = lead.detailRows.filter((row) => getLeadWorkflowStatus(row) !== "skipped").length;
  const crisisTotal = crisis.detailRows.filter((row) => getCrisisWorkflowStatus(row) !== "skipped").length;
  const totalTasks = leadTotal + crisisTotal;
  const slaStatuses = [
    ...lead.detailRows.map((row) => normalizeLabel(row.slaStatus)),
    ...crisis.detailRows.map((row) => normalizeLabel(row.slaStatus)),
  ];
  const slaEvaluated = slaStatuses.filter((status) => status === "dung sla" || status === "tre sla");
  const slaOnTime = slaEvaluated.filter((status) => status === "dung sla").length;
  workflow.completionRate = {
    total: percentage(workflow.completed.total, totalTasks),
    lead: percentage(leadCompleted, leadTotal),
    crisis: percentage(crisisCompleted, crisisTotal),
  };
  const completedTasks = workflow.completed.total;
  const overdueTasks = workflow.overdueOpen.total;
  const priorityOpen = toBreakdown(leadPriorityOpen, crisisPriorityOpen);
  const priorityTasks = priorityOpen.total;

  const kpis: DualOperationsKpi = {
    totalTasks,
    leadTotal,
    crisisTotal,
    completedTasks,
    pendingTasks: Math.max(0, totalTasks - completedTasks),
    overdueTasks,
    priorityTasks,
    priorityOpen,
    leadConversionRate: lead.kpis.conversionRate,
    crisisResolvedRate: percentage(crisisCompleted, crisisTotal),
    slaOnTimeRate: percentage(slaOnTime, slaEvaluated.length),
    workflow,
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
    managementInsights: buildManagementInsights(lead, kpis),
    attentionItems: buildAttentionItems(lead, crisis),
    recommendations: buildRecommendations(lead, crisis, kpis),
    aiSummary: buildAiSummary({ lead, crisis, kpis }),
  };
}
