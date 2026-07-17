import type { UserRoleProfile } from "@/lib/rbac";
import {
  buildCrisisReportData,
  type CrisisReportData,
  type CrisisReportDetailRow,
} from "@/lib/crisis-report";
import {
  filterCrisisReportItems,
  type CrisisReportFilters,
} from "@/lib/crisis-report-filters";
import {
  canAlertBeVisibleToUser,
  getEffectiveAlertOwner,
  isAlertOwnedByUser,
} from "@/lib/alert-visibility";
import { isResolvedAlert } from "@/lib/alertWorkflow";
import type { AlertData } from "@/stores/alert.store";

export interface CrisisEmployeeKpis {
  createdInPeriod: number;
  resolvedInPeriod: number;
  slaOnTimeRate: number;
  avgFirstResponseMinutes: number | null;
  openCurrent: number;
  criticalHighOpen: number;
  pendingApproval: number;
  claimable: number;
}

export interface CrisisPriorityRow extends CrisisReportDetailRow {
  urgencyLevel: "urgent" | "attention" | "normal";
  urgencyReasons: string[];
  dueAt: string;
  remainingSlaMinutes: number | null;
}

export interface CrisisAttentionItem {
  key: "overdue" | "near_due" | "pending_approval" | "claimable";
  title: string;
  description: string;
  count: number;
  href: string;
  tone: "danger" | "warn" | "info";
}

export interface CrisisActivityTrendPoint {
  day: string;
  created: number;
  resolved: number;
  overdue: number;
}

export interface CrisisEmployeeReportData extends CrisisReportData {
  personalKpis: CrisisEmployeeKpis;
  priorityRows: CrisisPriorityRow[];
  attentionItems: CrisisAttentionItem[];
  recommendations: string[];
  activityTrend: CrisisActivityTrendPoint[];
}

function toTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function isInSelectedPeriod(
  value: string | null | undefined,
  filters: CrisisReportFilters,
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

function slaDurationMinutes(severity: string) {
  if (severity === "critical") return 2 * 60;
  if (severity === "high") return 4 * 60;
  if (severity === "medium") return 24 * 60;
  return 72 * 60;
}

function buildPriorityRows(rows: CrisisReportDetailRow[], nowMs: number) {
  const urgencyRank = { urgent: 3, attention: 2, normal: 1 } as const;
  return rows
    .filter((row) => row.status !== "resolved")
    .map<CrisisPriorityRow>((row) => {
      const createdAt = toTime(row.createdAt);
      const duration = slaDurationMinutes(row.severity);
      const dueTime = createdAt === null ? null : createdAt + duration * 60 * 1000;
      const remainingSlaMinutes = dueTime === null
        ? null
        : Math.round((dueTime - nowMs) / 60000);
      const isOverdue = row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA";
      const isNearDue =
        !isOverdue &&
        remainingSlaMinutes !== null &&
        remainingSlaMinutes >= 0 &&
        remainingSlaMinutes <= Math.max(30, Math.round(duration * 0.2));
      const urgencyReasons = [
        ...(isOverdue
          ? [row.slaStatus === "Qua han" ? "Quá hạn" : "Trễ SLA"]
          : []),
        ...(row.severity === "critical" ? ["Cảnh báo mức nguy cấp"] : []),
        ...(row.severity === "high" ? ["Cảnh báo mức cao"] : []),
        ...(isNearDue ? ["Sắp hết thời gian SLA"] : []),
        ...(row.status === "pending_approval" ? ["Đang chờ duyệt"] : []),
        ...(row.escalated && row.status !== "pending_approval" ? ["Đã escalation"] : []),
      ];
      const urgencyLevel =
        isOverdue || row.severity === "critical"
          ? "urgent"
          : row.severity === "high" || isNearDue || row.escalated
            ? "attention"
            : "normal";
      return {
        ...row,
        urgencyLevel,
        urgencyReasons,
        dueAt: dueTime === null ? "" : new Date(dueTime).toISOString(),
        remainingSlaMinutes,
      };
    })
    .sort(
      (a, b) =>
        urgencyRank[b.urgencyLevel] - urgencyRank[a.urgencyLevel] ||
        (a.remainingSlaMinutes ?? Number.MAX_SAFE_INTEGER) -
          (b.remainingSlaMinutes ?? Number.MAX_SAFE_INTEGER),
    );
}

function buildAttentionItems(
  priorityRows: CrisisPriorityRow[],
  claimableCount: number,
): CrisisAttentionItem[] {
  const overdue = priorityRows.filter(
    (row) => row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA",
  ).length;
  const nearDue = priorityRows.filter((row) =>
    row.urgencyReasons.includes("Sắp hết thời gian SLA"),
  ).length;
  const pendingApproval = priorityRows.filter(
    (row) => row.status === "pending_approval",
  ).length;
  const items: CrisisAttentionItem[] = [
    {
      key: "overdue",
      title: "Case quá hạn SLA",
      description: "Cần xử lý hoặc rà soát nguyên nhân trễ ngay.",
      count: overdue,
      href: "/alerts?reportFilter=overdue",
      tone: "danger",
    },
    {
      key: "near_due",
      title: "Sắp hết SLA",
      description: "Case còn dưới 20% thời gian xử lý cho phép.",
      count: nearDue,
      href: "/alerts?reportFilter=near_due",
      tone: "warn",
    },
    {
      key: "pending_approval",
      title: "Đang chờ duyệt",
      description: "Cần theo dõi quyết định hoặc phản hồi tiếp theo.",
      count: pendingApproval,
      href: "/alerts?reportFilter=pending_approval",
      tone: "warn",
    },
    {
      key: "claimable",
      title: "Có thể nhận xử lý",
      description: "Case chưa phân công, không tính vào hiệu suất cá nhân.",
      count: claimableCount,
      href: "/alerts?reportFilter=unassigned",
      tone: "info",
    },
  ];
  return items.filter((item) => item.count > 0);
}

function buildRecommendations(
  kpis: CrisisEmployeeKpis,
  priorityRows: CrisisPriorityRow[],
) {
  const recommendations: string[] = [];
  const overdue = priorityRows.filter(
    (row) => row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA",
  ).length;
  if (overdue > 0) {
    recommendations.push(`Ưu tiên xử lý ${overdue} case quá hạn trước khi nhận thêm case mới.`);
  }
  if (kpis.pendingApproval > 0) {
    recommendations.push(`Theo dõi ${kpis.pendingApproval} case đang chờ duyệt để tránh gián đoạn.`);
  }
  if (kpis.criticalHighOpen > 0) {
    recommendations.push(`Rà soát ${kpis.criticalHighOpen} case Critical/High còn mở theo hạn SLA gần nhất.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(
      kpis.openCurrent > 0
        ? `Tiếp tục xử lý ${kpis.openCurrent} case còn mở theo thứ tự SLA.`
        : "Không có rủi ro nổi bật; duy trì nhịp xử lý hiện tại.",
    );
  }
  return recommendations.slice(0, 3);
}

function buildActivityTrend(rows: CrisisReportDetailRow[], nowMs: number) {
  const buckets = new Map<string, CrisisActivityTrendPoint>();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(nowMs);
    date.setDate(date.getDate() - index);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      day: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      created: 0,
      resolved: 0,
      overdue: 0,
    });
  }
  rows.forEach((row) => {
    const createdTime = toTime(row.createdAt);
    const resolvedTime = toTime(row.resolvedAt);
    const createdKey = createdTime === null
      ? ""
      : new Date(createdTime).toISOString().slice(0, 10);
    const resolvedKey = resolvedTime === null
      ? ""
      : new Date(resolvedTime).toISOString().slice(0, 10);
    if (buckets.has(createdKey)) buckets.get(createdKey)!.created += 1;
    if (buckets.has(resolvedKey)) buckets.get(resolvedKey)!.resolved += 1;
    if (
      buckets.has(createdKey) &&
      (row.slaStatus === "Qua han" || row.slaStatus === "Tre SLA")
    ) {
      buckets.get(createdKey)!.overdue += 1;
    }
  });
  return Array.from(buckets.values());
}

export function buildCrisisEmployeeReportData(
  alerts: AlertData[],
  filters: CrisisReportFilters,
  profile?: UserRoleProfile | null,
  nowMs = Date.now(),
): CrisisEmployeeReportData {
  const accessibleAlerts = alerts.filter((alert) =>
    canAlertBeVisibleToUser(alert, profile),
  );
  const personalAlerts = accessibleAlerts.filter((alert) =>
    isAlertOwnedByUser(alert, profile),
  );
  const claimableCount = accessibleAlerts.filter(
    (alert) => !getEffectiveAlertOwner(alert) && !isResolvedAlert(alert),
  ).length;
  const periodAlerts = filterCrisisReportItems(personalAlerts, filters, nowMs);
  const filteredPersonalAlerts = filterCrisisReportItems(
    personalAlerts,
    {
      ...filters,
      timeRange: "all",
      startDate: "",
      endDate: "",
    },
    nowMs,
  );
  const periodReport = buildCrisisReportData(periodAlerts, profile, nowMs);
  const currentReport = buildCrisisReportData(filteredPersonalAlerts, profile, nowMs);
  const resolvedInPeriodRows = currentReport.detailRows.filter(
    (row) => row.status === "resolved" && isInSelectedPeriod(row.resolvedAt, filters, nowMs),
  );
  const slaEvaluated = resolvedInPeriodRows.filter(
    (row) => row.slaStatus === "Dung SLA" || row.slaStatus === "Tre SLA",
  );
  const priorityRows = buildPriorityRows(currentReport.detailRows, nowMs);
  const openRows = currentReport.detailRows.filter((row) => row.status !== "resolved");
  const personalKpis: CrisisEmployeeKpis = {
    createdInPeriod: periodReport.kpis.total,
    resolvedInPeriod: resolvedInPeriodRows.length,
    slaOnTimeRate:
      slaEvaluated.length === 0
        ? 0
        : Math.round(
            (slaEvaluated.filter((row) => row.slaStatus === "Dung SLA").length /
              slaEvaluated.length) *
              100,
          ),
    avgFirstResponseMinutes: periodReport.kpis.avgFirstResponseMinutes,
    openCurrent: openRows.length,
    criticalHighOpen: openRows.filter(
      (row) => row.severity === "critical" || row.severity === "high",
    ).length,
    pendingApproval: openRows.filter((row) => row.status === "pending_approval").length,
    claimable: claimableCount,
  };

  return {
    ...periodReport,
    personalKpis,
    priorityRows,
    attentionItems: buildAttentionItems(priorityRows, claimableCount),
    recommendations: buildRecommendations(personalKpis, priorityRows),
    activityTrend: buildActivityTrend(currentReport.detailRows, nowMs),
  };
}
