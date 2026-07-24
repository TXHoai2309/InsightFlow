import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { canAlertBeVisibleToUser } from "@/lib/alert-visibility";
import { isIntentLead } from "@/lib/lead-intent";
import {
  canLeadBeVisibleToUser,
  getLeadExpiryTime,
  getLeadFollowUpMeta,
} from "@/lib/lead-workbench";
import {
  getAlertCompletenessScore,
  getAlertDeduplicationKey,
} from "@/lib/operational-metrics";
import type { UserRoleProfile } from "@/lib/rbac";
import type { AlertData } from "@/stores/alert.store";
import type { Lead } from "@/types/dashboard";

export type EmployeeOperationsRole = "crisis_employee" | "lead_employee";
export type EmployeeTaskStatus = "urgent" | "processing" | "waiting" | "completed";
export type EmployeeOperationsPeriod = "today" | "yesterday" | "last7Days" | "last30Days" | "all";

export interface EmployeeOperationsTask {
  id: string;
  role: EmployeeOperationsRole;
  status: EmployeeTaskStatus;
  title: string;
  detail: string;
  brand: string;
  customer: string;
  source: string;
  priority: string;
  createdAt: string;
  /** Business timestamp used by the operations period filter. */
  periodAt?: string;
  dueAt?: string;
  completedAt?: string;
  isOverdue: boolean;
  href: string;
}

export interface EmployeeOperationsStats {
  todo: number;
  urgent: number;
  processing: number;
  waiting: number;
  overdue: number;
  completedToday: number;
  totalToday: number;
  completionRate: number;
}

export interface EmployeeOperationsNotification {
  id: string;
  status: Exclude<EmployeeTaskStatus, "completed">;
  title: string;
  description: string;
  createdAt: string;
  href: string;
}

export interface EmployeeOperationsData {
  role: EmployeeOperationsRole;
  tasks: EmployeeOperationsTask[];
  notifications: EmployeeOperationsNotification[];
  stats: EmployeeOperationsStats;
}

export type DateRangeOption = "today" | "7d" | "30d" | "all";

interface BuildEmployeeOperationsDataParams {
  profile: UserRoleProfile;
  role?: EmployeeOperationsRole;
  alerts?: AlertData[];
  leads?: Lead[];
  nowMs?: number;
  dateRange?: DateRangeOption;
}

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_ORDER: Record<EmployeeTaskStatus, number> = {
  urgent: 0,
  processing: 1,
  waiting: 2,
  completed: 3,
};

function toTime(value: unknown) {
  if (!value) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const time = new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : null;
}

function toIso(value: unknown) {
  const time = toTime(value);
  return time === null ? undefined : new Date(time).toISOString();
}

function vietnamDateKey(value: unknown) {
  const time = toTime(value);
  if (time === null) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(time));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function isToday(value: unknown, nowMs: number) {
  return Boolean(value) && vietnamDateKey(value) === vietnamDateKey(nowMs);
}

function getVietnamDayStart(nowMs: number) {
  const dateKey = vietnamDateKey(nowMs);
  return dateKey ? Date.parse(`${dateKey}T00:00:00+07:00`) : Number.NaN;
}

function truncate(value: unknown, maxLength = 96) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getAlertDueAt(alert: AlertData) {
  const createdAt = toTime(alert.created_at);
  if (createdAt === null) return undefined;
  const severity = normalize(alert.severity || alert.urgency);
  const durationMinutes =
    severity === "critical"
      ? 2 * 60
      : severity === "high" || severity === "urgent"
        ? 4 * 60
        : severity === "medium" || severity === "normal"
          ? 24 * 60
          : 72 * 60;
  return new Date(createdAt + durationMinutes * 60 * 1000).toISOString();
}

function getAlertCompletedAt(alert: AlertData) {
  const history = Array.isArray(alert.resolution_history) ? alert.resolution_history : [];
  return toIso(
    alert.resolved_at ||
    alert.monitoring_started_at ||
    history[history.length - 1]?.timestamp,
  );
}

function getAlertTaskStatus(alert: AlertData): EmployeeTaskStatus {
  const workflowStatus = getAlertWorkflowStatus(alert);
  const rawStatus = normalize(alert.status);

  if (workflowStatus === "resolved") return "completed";
  // A failed contact attempt is still active work and belongs with the
  // processing queue, not the new/urgent or customer-waiting queues.
  if (workflowStatus === "contact_failed") return "processing";
  if (rawStatus === "contact_waiting" || alert.customer_response_result === "no_response") {
    return "waiting";
  }
  if (workflowStatus === "processing") return "processing";
  return "urgent";
}

function alertToTask(alert: AlertData, nowMs: number): EmployeeOperationsTask {
  const status = getAlertTaskStatus(alert);
  const dueAt = getAlertDueAt(alert);
  const dueTime = toTime(dueAt);
  const completedAt = getAlertCompletedAt(alert);
  const severity = normalize(alert.severity || alert.urgency) || "medium";

  return {
    id: alert.id,
    role: "crisis_employee",
    status,
    title: truncate(alert.text || alert.comment_content || alert.post_content) || "Cảnh báo cần xử lý",
    detail: `${severity.toUpperCase()} · ${alert.topic || "other"}`,
    brand: alert.brand || "",
    customer: alert.author || "Không rõ tác giả",
    source: alert.source || "unknown",
    priority: severity,
    createdAt: toIso(alert.created_at) || new Date(nowMs).toISOString(),
    dueAt,
    completedAt,
    isOverdue: status !== "completed" && dueTime !== null && dueTime <= nowMs,
    href: `/alerts?alertId=${encodeURIComponent(alert.id)}`,
  };
}

function getLeadCompletedAt(lead: Lead) {
  return toIso(
    lead.closed_at ||
    lead.result_recorded_at ||
    lead.updated_at ||
    lead.last_action_at,
  );
}

function getLeadDueAt(lead: Lead) {
  const followUp = getLeadFollowUpMeta(lead);
  if (followUp.isActive && followUp.scheduledAt !== null) {
    return new Date(followUp.scheduledAt).toISOString();
  }
  const expiryTime = getLeadExpiryTime(lead);
  return Number.isFinite(expiryTime) ? new Date(expiryTime).toISOString() : undefined;
}

function getLeadTaskStatus(lead: Lead, nowMs: number): EmployeeTaskStatus {
  if (lead.status === "completed") return "completed";

  const followUp = getLeadFollowUpMeta(lead, nowMs);
  const followUpTime = followUp.isActive ? followUp.scheduledAt : null;
  const dueTime = toTime(getLeadDueAt(lead));
  if ((followUpTime !== null && followUpTime <= nowMs) || (dueTime !== null && dueTime <= nowMs)) {
    return "urgent";
  }

  // A scheduled follow-up is work that remains in progress. Only a lead for
  // which the employee is actually waiting for a customer response belongs
  // in the waiting column.
  if (followUp.isActive) return "processing";
  if (lead.result_type === "no_response") return "waiting";
  if (lead.status === "processing") return "processing";
  return "urgent";
}

function getLeadPeriodAt(
  lead: Lead,
  status: EmployeeTaskStatus,
  nowMs: number,
  dueAt?: string,
) {
  if (status === "completed") return getLeadCompletedAt(lead);

  const dueTime = toTime(dueAt);
  // An overdue Lead belongs to the period in which its SLA/follow-up expired.
  // A later sync or action must not pull an old overdue Lead into "7 days".
  if (dueTime !== null && dueTime <= nowMs) return dueAt;

  const followUp = getLeadFollowUpMeta(lead, nowMs);
  if (followUp.isActive && followUp.scheduledAt !== null) {
    return new Date(followUp.scheduledAt).toISOString();
  }

  if (lead.result_type === "no_response") {
    return toIso(
      lead.result_recorded_at ||
      lead.last_contact_at ||
      lead.last_action_at ||
      lead.updated_at ||
      lead.created_at,
    );
  }

  // Keep the latest workflow activity as the filter timestamp even when an
  // overdue processing Lead is promoted to the urgent display column.
  if (lead.status === "processing") {
    return toIso(
      lead.last_action_at ||
      lead.last_contact_at ||
      lead.claimed_at ||
      lead.assigned_at ||
      lead.updated_at ||
      lead.posted_at ||
      lead.created_at,
    );
  }

  // New work is scoped by publication time, matching the Lead workbench.
  return toIso(lead.posted_at || lead.created_at);
}

function leadToTask(lead: Lead, nowMs: number): EmployeeOperationsTask {
  const status = getLeadTaskStatus(lead, nowMs);
  const dueAt = getLeadDueAt(lead);
  const dueTime = toTime(dueAt);
  const completedAt = getLeadCompletedAt(lead);
  const intent = normalize(lead.intent) || "cold";

  return {
    id: lead.id,
    role: "lead_employee",
    status,
    title: truncate(lead.content) || `Khách hàng tiềm năng: ${lead.author || "Chưa rõ tên"}`,
    detail: `${intent.toUpperCase()} · ${lead.platform || "unknown"}`,
    brand: lead.workspace_id || "",
    customer: lead.author || lead.phone || lead.email || "Chưa có thông tin liên hệ",
    source: String(lead.platform || "unknown"),
    priority: intent,
    createdAt: toIso(lead.created_at) || new Date(nowMs).toISOString(),
    periodAt: getLeadPeriodAt(lead, status, nowMs, dueAt),
    dueAt,
    completedAt,
    isOverdue: status !== "completed" && dueTime !== null && dueTime <= nowMs,
    href: `/leads?leadId=${encodeURIComponent(lead.id)}`,
  };
}

export function filterEmployeeOperationsTasks(
  tasks: EmployeeOperationsTask[],
  period: EmployeeOperationsPeriod,
  nowMs = Date.now(),
) {
  if (period === "all") return tasks;

  const todayStart = getVietnamDayStart(nowMs);
  if (!Number.isFinite(todayStart)) return [];

  let startTime = todayStart;
  let endTime = todayStart + DAY_MS;

  if (period === "yesterday") {
    startTime -= DAY_MS;
    endTime = todayStart;
  } else if (period === "last7Days") {
    startTime -= 6 * DAY_MS;
  } else if (period === "last30Days") {
    startTime -= 29 * DAY_MS;
  }

  return tasks.filter((task) => {
    const activityTime = toTime(
      task.periodAt ||
      (task.status === "completed" ? task.completedAt : task.createdAt),
    );
    return activityTime !== null && activityTime >= startTime && activityTime < endTime;
  });
}

function compareTasks(a: EmployeeOperationsTask, b: EmployeeOperationsTask) {
  const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (statusDiff !== 0) return statusDiff;

  if (a.status === "completed" && b.status === "completed") {
    return (toTime(b.completedAt) || 0) - (toTime(a.completedAt) || 0);
  }

  const aDue = toTime(a.dueAt) ?? Number.MAX_SAFE_INTEGER;
  const bDue = toTime(b.dueAt) ?? Number.MAX_SAFE_INTEGER;
  if (aDue !== bDue) return aDue - bDue;
  return (toTime(b.createdAt) || 0) - (toTime(a.createdAt) || 0);
}

function calculateStats(
  tasks: EmployeeOperationsTask[],
  nowMs: number,
): EmployeeOperationsStats {
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedToday = tasks.filter(
    (task) => task.status === "completed" && isToday(task.completedAt, nowMs),
  );
  const totalToday = activeTasks.length + completedToday.length;

  return {
    todo: activeTasks.length,
    urgent: activeTasks.filter((task) => task.status === "urgent").length,
    processing: activeTasks.filter((task) => task.status === "processing").length,
    waiting: activeTasks.filter((task) => task.status === "waiting").length,
    overdue: activeTasks.filter((task) => task.isOverdue).length,
    completedToday: completedToday.length,
    totalToday,
    completionRate: totalToday > 0 ? Math.round((completedToday.length / totalToday) * 100) : 0,
  };
}

function buildNotifications(
  role: EmployeeOperationsRole,
  tasks: EmployeeOperationsTask[],
): EmployeeOperationsNotification[] {
  return tasks
    .filter((task): task is EmployeeOperationsTask & { status: Exclude<EmployeeTaskStatus, "completed"> } =>
      task.status !== "completed",
    )
    .slice(0, 6)
    .map((task) => ({
      id: `${task.status}:${task.id}`,
      status: task.status,
      title:
        task.status === "urgent"
          ? role === "crisis_employee"
            ? "Cảnh báo cần ưu tiên"
            : "Lead cần ưu tiên"
          : task.status === "waiting"
            ? "Đang chờ phản hồi"
            : "Đang xử lý",
      description: task.title,
      createdAt: task.createdAt,
      href: task.href,
    }));
}

export function buildEmployeeOperationsData({
  profile,
  role: requestedRole,
  alerts = [],
  leads = [],
  nowMs = Date.now(),
  dateRange = "30d",
}: BuildEmployeeOperationsDataParams): EmployeeOperationsData {
  const role = requestedRole || (profile.role as EmployeeOperationsRole);
  let tasks: EmployeeOperationsTask[];

  if (role === "crisis_employee") {
    // 1. Chỉ lấy cảnh báo tiêu cực (khớp với mặc định alertScope của trang quản lý)
    const negativeAlerts = alerts.filter((alert) => alert.sentiment === "negative");

    // 2. Lọc quyền xem của user
    const visibleAlerts = negativeAlerts.filter((alert) => canAlertBeVisibleToUser(alert, profile));

    // 3. Khử trùng lặp theo key (khớp với trang quản lý /alerts)
    const deduplicated = new Map<string, AlertData>();
    visibleAlerts.forEach((alert) => {
      const key = getAlertDeduplicationKey(alert);
      const existing = deduplicated.get(key);
      if (!existing || getAlertCompletenessScore(alert) > getAlertCompletenessScore(existing)) {
        deduplicated.set(key, alert);
      }
    });

    tasks = Array.from(deduplicated.values()).map((alert) => alertToTask(alert, nowMs));
  } else {
    tasks = leads
      .filter(isIntentLead)
      .filter((lead) => canLeadBeVisibleToUser(lead, profile))
      .filter((lead) => lead.status !== "skipped")
      .map((lead) => leadToTask(lead, nowMs));
  }

  // ── Date range filter ────────────────────────────────────────────────────
  // Tính mốc bắt đầu ngày giống hệt trang quản lý (/alerts page)
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  let startDateMs: number | null = null;
  if (dateRange === "today") {
    startDateMs = startOfTodayMs;
  } else if (dateRange === "7d") {
    startDateMs = startOfTodayMs - 6 * 24 * 60 * 60 * 1000; // 7 ngày gần nhất (bao gồm hôm nay)
  } else if (dateRange === "30d") {
    startDateMs = startOfTodayMs - 29 * 24 * 60 * 60 * 1000; // 30 ngày gần nhất (bao gồm hôm nay)
  }
  // "all" → startDateMs = null

  if (startDateMs !== null) {
    tasks = tasks.filter((task) => {
      const createdTime = toTime(task.createdAt);
      return createdTime !== null && createdTime >= startDateMs!;
    });
  }

  // Đối với chế độ "Tất cả", giới hạn việc đã đóng ở mốc 30 ngày để tránh quá tải DOM
  if (dateRange === "all") {
    const historyCutoff = nowMs - 30 * 24 * 60 * 60 * 1000;
    tasks = tasks.filter((task) => {
      if (task.status !== "completed") return true;
      const completedTime = toTime(task.completedAt);
      return completedTime !== null && completedTime >= historyCutoff;
    });
  }

  tasks.sort(compareTasks);

  return {
    role,
    tasks,
    notifications: buildNotifications(role, tasks),
    stats: calculateStats(tasks, nowMs),
  };
}

export function formatOperationsTime(value: string | undefined) {
  const time = toTime(value);
  if (time === null) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(time));
}

export function formatOperationsRelativeTime(value: string | undefined, nowMs = Date.now()) {
  const time = toTime(value);
  if (time === null) return "Không rõ thời gian";
  const diffMinutes = Math.round((time - nowMs) / 60000);
  const absoluteMinutes = Math.abs(diffMinutes);

  if (absoluteMinutes < 1) return "Vừa xong";
  if (diffMinutes > 0) {
    if (absoluteMinutes < 60) return `Còn ${absoluteMinutes} phút`;
    if (absoluteMinutes < 24 * 60) return `Còn ${Math.ceil(absoluteMinutes / 60)} giờ`;
    return `Hạn ${formatOperationsTime(value)}`;
  }
  if (absoluteMinutes < 60) return `${absoluteMinutes} phút trước`;
  if (absoluteMinutes < 24 * 60) return `${Math.floor(absoluteMinutes / 60)} giờ trước`;
  return formatOperationsTime(value);
}

export function formatOperationsDueTime(value: string | undefined, nowMs = Date.now()) {
  const dueTime = toTime(value);
  if (dueTime === null) return "Chưa xác định thời hạn";
  if (dueTime > nowMs) return formatOperationsRelativeTime(value, nowMs);

  const overdueMinutes = Math.max(1, Math.ceil((nowMs - dueTime) / 60000));
  const days = Math.floor(overdueMinutes / (24 * 60));
  const hours = Math.floor((overdueMinutes % (24 * 60)) / 60);
  const minutes = overdueMinutes % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} phút`);

  return `Quá hạn ${parts.join(" ") || "1 phút"}`;
}
