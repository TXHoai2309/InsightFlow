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
