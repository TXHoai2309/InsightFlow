export type CustomerInteractionSourceType = "alert" | "lead";

function normalizeEmployeeRole(value: unknown) {
  if (value === "crisis_staff") return "crisis_employee";
  if (value === "lead_staff") return "lead_employee";
  return String(value || "");
}

export function canUseCustomerInteractionSource(options: {
  role: unknown;
  permissions?: unknown;
  sourceType: CustomerInteractionSourceType;
}) {
  const role = normalizeEmployeeRole(options.role);
  if (role === "brand_manager") return true;
  if (role !== "crisis_employee" && role !== "lead_employee") return false;

  const permissions = new Set(
    Array.isArray(options.permissions)
      ? options.permissions.filter(
          (permission): permission is string => typeof permission === "string",
        )
      : [],
  );
  const requiredPermission = options.sourceType === "alert" ? "alerts" : "leads";

  // Explicit operation permissions extend the base role. This is how an
  // employee can safely work in both queues without introducing a third auth
  // role that would break legacy claims and onboarding state.
  if (permissions.has(requiredPermission)) return true;

  // Legacy profiles may not have a permissions array yet.
  return options.sourceType === "alert"
    ? role === "crisis_employee"
    : role === "lead_employee";
}
