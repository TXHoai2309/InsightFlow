export type UserRole =
  | "admin"
  | "brand_manager"
  | "crisis_employee"
  | "lead_employee";

type LegacyUserRole = "crisis_staff" | "lead_staff";
type RoleInput = UserRole | LegacyUserRole;

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
}

interface RoutePolicy {
  route: string;
  roles: UserRole[];
  permission?: string;
}

const LEGACY_ROLE_MAP: Record<LegacyUserRole, UserRole> = {
  crisis_staff: "crisis_employee",
  lead_staff: "lead_employee",
};

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    label: "Admin",
    permissions: [
      "admin_panel",
      "admin_user_management",
      "admin_label_review",
      "admin_crawler_health",
      "admin_audit",
    ],
    defaultRoute: "/admin",
  },
  brand_manager: {
    label: "Quan ly thuong hieu",
    permissions: [
      "dashboard",
      "mentions",
      "alerts",
      "leads",
      "reports",
      "staff_management",
      "brand_settings",
      "label_request_review",
      "response_settings",
    ],
    defaultRoute: "/dashboard",
  },
  crisis_employee: {
    label: "Nhan vien xu ly khung hoang",
    permissions: [
      "dashboard",
      "mentions",
      "alerts",
      "reports",
      "label_request_create",
    ],
    defaultRoute: "/alerts",
  },
  lead_employee: {
    label: "Nhan vien xu ly khach hang tiem nang",
    permissions: ["dashboard", "mentions", "leads", "reports"],
    defaultRoute: "/leads",
  },
};

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/nganh",
  "/ve-chung-toi",
  "/profile",
];

const ROUTE_POLICIES: RoutePolicy[] = [
  { route: "/admin", roles: ["admin"], permission: "admin_panel" },
  { route: "/team", roles: ["brand_manager"], permission: "staff_management" },
  {
    route: "/dashboard",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "dashboard",
  },
  {
    route: "/mentions",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "mentions",
  },
  {
    route: "/alerts",
    roles: ["brand_manager", "crisis_employee"],
    permission: "alerts",
  },
  {
    route: "/leads",
    roles: ["brand_manager", "lead_employee"],
    permission: "leads",
  },
  {
    route: "/reports",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "reports",
  },
  {
    route: "/settings",
    roles: ["brand_manager"],
    permission: "brand_settings",
  },
];

export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") return null;
  if (role in ROLE_CONFIG) return role as UserRole;
  if (role in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[role as LegacyUserRole];
  return null;
}

export function isValidRole(role: unknown): role is UserRole {
  return normalizeRole(role) === role;
}

function pathMatchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathMatchesRoute(pathname, route));
}

export function isProtectedPath(pathname: string) {
  if (isPublicPath(pathname)) return false;
  return ROUTE_POLICIES.some((policy) => pathMatchesRoute(pathname, policy.route));
}

export function getDefaultRouteForRole(role?: RoleInput | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? ROLE_CONFIG[normalizedRole].defaultRoute : "/login";
}

// Deprecated: only for legacy/dev fallback. Production auth must use users/{uid}.role.
export function inferRoleFromEmail(email?: string | null): UserRole {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const [localPart = "", domain = ""] = normalizedEmail.split("@");

  if (/^[a-z0-9._%+-]*admin@insightflow\.com$/i.test(normalizedEmail)) {
    return "admin";
  }

  const employeeSignals = [
    "_",
    "lead",
    "sales",
    "khach",
    "tiem",
    "crisis",
    "alert",
    "khung",
    "hoang",
  ];
  const looksLikeEmployee = employeeSignals.some((signal) =>
    localPart.includes(signal),
  );

  if (looksLikeEmployee) {
    const leadSignals = ["lead", "sales", "khach", "tiem", "potential"];
    return leadSignals.some((signal) => localPart.includes(signal))
      ? "lead_employee"
      : "crisis_employee";
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
  const role = normalizeRole(params.storedRole) || inferRoleFromEmail(email);
  const companyDomain = email.includes("@") ? email.split("@")[1] : "";
  const permissions = Array.isArray(params.storedPermissions)
    ? params.storedPermissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : ROLE_CONFIG[role].permissions;

  return {
    uid: params.uid,
    email,
    role,
    companyDomain,
    brandId:
      typeof params.storedBrandId === "string"
        ? params.storedBrandId
        : undefined,
    brandName:
      typeof params.storedBrandName === "string"
        ? params.storedBrandName
        : undefined,
    displayName: params.displayName || "",
    photoURL: params.photoURL || "",
    permissions,
    defaultRoute: ROLE_CONFIG[role].defaultRoute,
  };
}

export function canAccessPath(
  role: UserRole | LegacyUserRole | null | undefined,
  pathname: string,
  permissions?: string[] | null,
) {
  if (isPublicPath(pathname)) return true;

  const matchedPolicy = ROUTE_POLICIES.find((policy) =>
    pathMatchesRoute(pathname, policy.route),
  );

  if (!matchedPolicy) return false;

  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  if (!matchedPolicy.roles.includes(normalizedRole)) return false;

  if (
    permissions &&
    matchedPolicy.permission &&
    !permissions.includes(matchedPolicy.permission)
  ) {
    return false;
  }

  return true;
}
