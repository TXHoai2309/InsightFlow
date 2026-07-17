import type { StaffBusinessRole, StaffRoleValue } from "./types";
import { getEmployeeBusinessScope } from "@/lib/rbac";

export function formatStaffDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getPermissionLabelKey(permission: string): string {
  return `team.operations.${permission}`;
}

export function getRoleLabel(role: string): string {
  if (role === "crisis_employee" || role === "crisis_staff") return "Crisis";
  if (role === "lead_employee" || role === "lead_staff") return "Lead";
  return role;
}

export function getStaffBusinessRole(
  permissions?: string[] | null,
  fallbackRole?: StaffRoleValue | null,
): StaffBusinessRole {
  const scope = getEmployeeBusinessScope({
    role: fallbackRole,
    permissions,
  });
  if (scope === "dual") return "dual_employee";
  if (scope === "crisis") return "crisis_employee";
  if (scope === "lead") return "lead_employee";
  return "unassigned";
}

export function getBusinessRoleLabel(role: StaffBusinessRole) {
  if (role === "dual_employee") return "Xử lý khủng hoảng & tiềm năng";
  if (role === "crisis_employee") return "Xử lý khủng hoảng";
  if (role === "lead_employee") return "Xử lý khách hàng tiềm năng";
  return "Chưa phân quyền";
}

export function getBusinessRoleBadgeClass(role: StaffBusinessRole) {
  if (role === "dual_employee") return "bg-violet-50 text-violet-700 border-violet-200";
  if (role === "crisis_employee") return "bg-orange-50 text-orange-700 border-orange-100";
  if (role === "lead_employee") return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-gray-100 text-gray-700 border-gray-200";
}
