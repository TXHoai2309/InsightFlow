import { getAlertWorkflowStatus } from "@/lib/alertWorkflow";
import { canAlertBeVisibleToUser } from "@/lib/alert-visibility";
import { isIntentLead } from "@/lib/lead-intent";
import {
  canLeadBeVisibleToUser,
  getLeadExpiryTime,
} from "@/lib/lead-workbench";
import type { UserRoleProfile } from "@/lib/rbac";
import type { AlertData } from "@/stores/alert.store";
import type { Lead } from "@/types/dashboard";

export type EmployeeOperationsRole = "crisis_employee" | "lead_employee";
export type EmployeeTaskStatus = "urgent" | "processing" | "waiting" | "completed";

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

interface BuildEmployeeOperationsDataParams {
  profile: UserRoleProfile;
  role?: EmployeeOperationsRole;
  alerts?: AlertData[];
  leads?: Lead[];
  nowMs?: number;
}

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const STATUS_ORDER: Record<EmployeeTaskStatus, number> = {
  urgent: 0,
  processing: 1,
  waiting: 2,
  completed: 3,
};

function toTime(value: unknown) {
  if (!value) return null;
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
  const followUpAt = toIso(lead.follow_up_at);
  if (followUpAt) return followUpAt;
  const expiryTime = getLeadExpiryTime(lead);
  return Number.isFinite(expiryTime) ? new Date(expiryTime).toISOString() : undefined;
}

function getLeadTaskStatus(lead: Lead, nowMs: number): EmployeeTaskStatus {
  if (lead.status === "completed" || lead.status === "skipped") return "completed";

  const followUpTime = toTime(lead.follow_up_at);
  const dueTime = toTime(getLeadDueAt(lead));
  if ((followUpTime !== null && followUpTime <= nowMs) || (dueTime !== null && dueTime <= nowMs)) {
    return "urgent";
  }

  const isWaiting =
    lead.result_type === "no_response" ||
    lead.result_type === "follow_up" ||
    (followUpTime !== null && followUpTime > nowMs);
  if (isWaiting) return "waiting";
  if (lead.status === "processing") return "processing";
  return "urgent";
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
    dueAt,
    completedAt,
    isOverdue: status !== "completed" && dueTime !== null && dueTime <= nowMs,
    href: `/leads?leadId=${encodeURIComponent(lead.id)}`,
  };
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
}: BuildEmployeeOperationsDataParams): EmployeeOperationsData {
  const role = requestedRole || (profile.role as EmployeeOperationsRole);
  let tasks: EmployeeOperationsTask[];

  if (role === "crisis_employee") {
    tasks = alerts
      .filter((alert) => canAlertBeVisibleToUser(alert, profile))
      .map((alert) => alertToTask(alert, nowMs));
  } else {
    tasks = leads
      .filter(isIntentLead)
      .filter((lead) => canLeadBeVisibleToUser(lead, profile))
      .map((lead) => leadToTask(lead, nowMs));
  }

  // Keep a useful 30-day completion log in the board. Daily progress and KPI
  // counters are still calculated from items completed today only.
  const historyCutoff = nowMs - 30 * 24 * 60 * 60 * 1000;
  tasks = tasks
    .filter((task) => {
      if (task.status !== "completed") return true;
      const completedTime = toTime(task.completedAt);
      return completedTime !== null && completedTime >= historyCutoff;
    })
    .sort(compareTasks);

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
