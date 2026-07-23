import type { AlertData } from "@/stores/alert.store";
import { isTerminalAlert } from "./alertWorkflow";

export interface CrisisAssigneeIdentity {
  uid: string;
  email: string;
  displayName?: string;
}

function normalizeIdentity(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function humanizeEmail(value: string) {
  const localPart = value.split("@")[0] || "";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("vi-VN") + part.slice(1))
    .join(" ");
}

export function getCrisisAssigneeDisplayName(
  alert: AlertData,
  staff: CrisisAssigneeIdentity[],
) {
  const latestHistory = [...(alert.resolution_history || [])].reverse().find(
    (entry) => entry.resolved_by_email || entry.resolved_by_name,
  );
  const owner = normalizeIdentity(
    alert.being_resolved_by ||
      alert.resolved_by_email ||
      alert.skipped_by_email ||
      latestHistory?.resolved_by_email,
  );
  const recordedName =
    alert.resolved_by_name?.trim() ||
    alert.skipped_by_name?.trim() ||
    latestHistory?.resolved_by_name?.trim() ||
    "";
  if (!owner) return recordedName || "Chưa giao";

  const staffMember = staff.find(
    (item) =>
      normalizeIdentity(item.uid) === owner ||
      normalizeIdentity(item.email) === owner,
  );
  if (staffMember?.displayName?.trim()) return staffMember.displayName.trim();

  const matchingHistoryName = [...(alert.resolution_history || [])]
    .reverse()
    .find(
      (entry) =>
        normalizeIdentity(entry.resolved_by_email) === owner &&
        Boolean(entry.resolved_by_name?.trim()),
    )?.resolved_by_name;
  if (matchingHistoryName?.trim()) return matchingHistoryName.trim();
  if (recordedName) return recordedName;
  if (owner.includes("@")) return humanizeEmail(owner) || "Nhân viên xử lý";
  return "Nhân viên xử lý";
}

export function formatCompactCrisisDuration(totalMinutes: number) {
  const minutes = Math.max(1, Math.floor(totalMinutes));
  if (minutes < 60) return `${minutes} phút`;

  const totalHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (totalHours < 24) {
    return `${totalHours} giờ${remainingMinutes ? ` ${remainingMinutes} phút` : ""}`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  if (totalDays < 30) {
    return `${totalDays} ngày${remainingHours ? ` ${remainingHours} giờ` : ""}`;
  }

  const months = Math.floor(totalDays / 30);
  const remainingDays = totalDays % 30;
  return `${months} tháng${remainingDays ? ` ${remainingDays} ngày` : ""}`;
}

function normalizeSeverity(value?: string) {
  const severity = String(value || "").toLowerCase();
  if (severity === "critical" || severity === "urgent") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium" || severity === "normal") return "medium";
  return "low";
}

export function getCrisisSlaInfo(alert: AlertData, nowMs = Date.now()) {
  if (isTerminalAlert(alert)) {
    return { isOverdue: false, label: "Đã kết thúc", percent: 100 };
  }

  const severity = normalizeSeverity(alert.severity);
  const limitHours =
    severity === "critical" ? 1 : severity === "high" ? 2 : severity === "medium" ? 4 : 8;
  const createdAt = new Date(alert.detected_at || alert.created_at).getTime();
  if (!Number.isFinite(createdAt)) {
    return { isOverdue: false, label: "Chưa xác định", percent: 0 };
  }

  const usedMinutes = Math.max(0, Math.floor((nowMs - createdAt) / 60000));
  const limitMinutes = limitHours * 60;
  const remainingMinutes = limitMinutes - usedMinutes;
  if (remainingMinutes === 0) {
    return { isOverdue: false, label: "Đến hạn", percent: 100 };
  }
  if (remainingMinutes < 0) {
    return {
      isOverdue: true,
      label: `Quá ${formatCompactCrisisDuration(Math.abs(remainingMinutes))}`,
      percent: 100,
    };
  }

  return {
    isOverdue: false,
    label: `Còn ${formatCompactCrisisDuration(remainingMinutes)}`,
    percent: Math.min(100, Math.round((usedMinutes / limitMinutes) * 100)),
  };
}
