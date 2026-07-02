export type UserRole = "admin" | "brand_manager" | "crisis_staff" | "lead_staff";

export interface UserRoleProfile {
  uid: string;
  email: string;
  role: UserRole;
  companyDomain: string;
  brandId?: string;
  brandName?: string;
  displayName?: string;
  photoURL?: string;
  permissions: string[];
  defaultRoute: string;
}

interface RoleConfig {
  label: string;
  permissions: string[];
  defaultRoute: string;
  deniedRoutes?: string[];
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    label: "Admin",
    permissions: ["admin_panel", "dashboard", "mentions", "alerts", "leads", "reports", "brand_settings"],
    defaultRoute: "/admin",
  },
  brand_manager: {
    label: "Quan ly thuong hieu",
    permissions: ["dashboard", "mentions", "alerts", "leads", "reports", "brand_settings", "staff_management"],
    defaultRoute: "/dashboard",
  },
  crisis_staff: {
    label: "Nhan vien xu ly khung hoang",
    permissions: ["dashboard", "mentions", "alerts", "reports", "brand_settings"],
    defaultRoute: "/alerts",
    deniedRoutes: ["/leads"],
  },
  lead_staff: {
    label: "Nhan vien xu ly khach hang tiem nang",
    permissions: ["dashboard", "mentions", "leads", "reports", "brand_settings"],
    defaultRoute: "/leads",
    deniedRoutes: ["/alerts"],
  },
};

const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin",
  "/team",
  "/mentions",
  "/alerts",
  "/leads",
  "/reports",
  "/settings",
];

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/nganh", "/ve-chung-toi"];

const PATH_PERMISSIONS: Array<{ route: string; permission: string }> = [
  { route: "/admin", permission: "admin_panel" },
  { route: "/team", permission: "staff_management" },
  { route: "/dashboard", permission: "dashboard" },
  { route: "/mentions", permission: "mentions" },
  { route: "/alerts", permission: "alerts" },
  { route: "/leads", permission: "leads" },
  { route: "/reports", permission: "reports" },
  { route: "/settings", permission: "brand_settings" },
];

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && role in ROLE_CONFIG;
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function getDefaultRouteForRole(role?: UserRole | null) {
  return role ? ROLE_CONFIG[role].defaultRoute : "/login";
}

export function inferRoleFromEmail(email?: string | null): UserRole {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const [localPart = "", domain = ""] = normalizedEmail.split("@");

  if (/^[a-z0-9._%+-]*admin@insightflow\.com$/i.test(normalizedEmail)) {
    return "admin";
  }

  const employeeSignals = ["_", "lead", "sales", "khach", "tiem", "crisis", "alert", "khung", "hoang"];
  const looksLikeEmployee = employeeSignals.some((signal) => localPart.includes(signal));

  if (looksLikeEmployee) {
    const leadSignals = ["lead", "sales", "khach", "tiem", "potential"];
    return leadSignals.some((signal) => localPart.includes(signal)) ? "lead_staff" : "crisis_staff";
  }

  if (domain && domain !== "insightflow.com") {
    return "brand_manager";
  }

  return "brand_manager";
}

export function buildUserRoleProfile(params: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  storedRole?: unknown;
  storedBrandId?: unknown;
  storedBrandName?: unknown;
  storedPermissions?: unknown;
}): UserRoleProfile {
  const email = (params.email || "").trim().toLowerCase();
  const role = isValidRole(params.storedRole) ? params.storedRole : inferRoleFromEmail(email);
  const companyDomain = email.includes("@") ? email.split("@")[1] : "";
  const permissions = Array.isArray(params.storedPermissions)
    ? params.storedPermissions.filter((permission): permission is string => typeof permission === "string")
    : ROLE_CONFIG[role].permissions;

  return {
    uid: params.uid,
    email,
    role,
    companyDomain,
    brandId: typeof params.storedBrandId === "string" ? params.storedBrandId : undefined,
    brandName: typeof params.storedBrandName === "string" ? params.storedBrandName : undefined,
    displayName: params.displayName || "",
    photoURL: params.photoURL || "",
    permissions,
    defaultRoute: ROLE_CONFIG[role].defaultRoute,
  };
}

export function canAccessPath(role: UserRole | null | undefined, pathname: string, permissions?: string[] | null) {
  if (!isProtectedPath(pathname) || pathname === "/profile") return true;
  if (!role) return false;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return role === "admin";
  }

  const matchedPermission = PATH_PERMISSIONS.find(
    (item) => pathname === item.route || pathname.startsWith(`${item.route}/`),
  )?.permission;

  if (permissions && matchedPermission && !permissions.includes(matchedPermission)) {
    return false;
  }

  const deniedRoutes = ROLE_CONFIG[role].deniedRoutes || [];
  return !deniedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
