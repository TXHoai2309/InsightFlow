export type UserRole =
  | "admin"
  | "brand_manager"
  | "crisis_employee"
  | "lead_employee";

type LegacyUserRole = "crisis_staff" | "lead_staff";
type RoleInput = UserRole | LegacyUserRole;

export type EmployeeBusinessScope =
  | "crisis"
  | "lead"
  | "dual"
  | "unassigned";

export interface UserRoleProfile {
  uid: string;
  email: string;
  role: UserRole;
  companyDomain: string;
  brandId?: string;
  brandName?: string;
  brandIds?: string[];
  workspaceIds?: string[];
  displayName?: string;
  photoURL?: string;
  permissions: string[];
  defaultRoute: string;
  temporaryPasswordIssued?: boolean;
  trialAccount?: boolean;
  trialDays?: number;
  trialStartAt?: string;
  trialEndsAt?: string;
  onboarding?: Partial<Record<UserRole, RoleOnboardingState>>;
}

export interface RoleOnboardingState {
  completedAt?: string;
  lastSeenAt?: string;
  version?: string;
}

export type BusinessAction =
  | "view_dashboard"
  | "view_mentions"
  | "view_crisis_queue"
  | "update_crisis_status"
  | "view_leads"
  | "update_lead_status"
  | "update_lead_details"
  | "view_reports"
  | "manage_staff"
  | "manage_brand_settings"
  | "review_labels"
  | "create_label_request"
  | "admin_panel"
  | "admin_user_management"
  | "admin_audit"
  | "admin_crawler_health"
  | "admin_label_tool"
  | "label_request_review";

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

const ROLE_BUSINESS_ACTIONS: Record<UserRole, BusinessAction[]> = {
  admin: [
    "admin_panel",
    "admin_user_management",
    "admin_audit",
    "admin_crawler_health",
    "review_labels",
    "admin_label_tool",
  ],
  brand_manager: [
    "view_dashboard",
    "view_mentions",
    "view_crisis_queue",
    "update_crisis_status",
    "view_leads",
    "update_lead_status",
    "update_lead_details",
    "view_reports",
    "manage_staff",
    "manage_brand_settings",
    "create_label_request",
    "label_request_review",
  ],
  crisis_employee: [
    "view_mentions",
    "view_crisis_queue",
    "update_crisis_status",
    "view_reports",
  ],
  lead_employee: [
    "view_mentions",
    "view_leads",
    "update_lead_status",
    "update_lead_details",
    "view_reports",
  ],
};

const ACTION_PERMISSION_MAP: Partial<Record<BusinessAction, string>> = {
  view_dashboard: "dashboard",
  view_mentions: "mentions",
  view_crisis_queue: "alerts",
  update_crisis_status: "alerts",
  view_leads: "leads",
  update_lead_status: "leads",
  update_lead_details: "leads",
  view_reports: "reports",
  manage_staff: "staff_management",
  manage_brand_settings: "brand_settings",
  review_labels: "label_request_review",
  create_label_request: "label_request_create",
  label_request_review: "label_request_review",
};

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    label: "Admin",
    permissions: [
      "admin_panel",
      "admin_user_management",
      "admin_label_review",
      "admin_label_tool",
      "admin_crawler_health",
      "admin_audit",
    ],
    defaultRoute: "/admin",
  },
  brand_manager: {
    label: "Quản lý thương hiệu",
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
    label: "Nhân viên xử lý khủng hoảng",
    permissions: [
      "mentions",
      "alerts",
      "reports",
    ],
    defaultRoute: "/alerts",
  },
  lead_employee: {
    label: "Nhân viên xử lý khách hàng tiềm năng",
    permissions: ["mentions", "leads", "reports"],
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
  "/huong-dan",
];

const ROUTE_POLICIES: RoutePolicy[] = [
  {
    route: "/change-password",
    roles: ["admin", "brand_manager", "crisis_employee", "lead_employee"],
  },
  { route: "/admin", roles: ["admin"], permission: "admin_panel" },
  { route: "/labeling_tool", roles: ["admin"] },
  {
    route: "/overview",
    roles: ["crisis_employee", "lead_employee"],
  },
  { route: "/team", roles: ["brand_manager"], permission: "staff_management" },
  { route: "/label-requests", roles: ["brand_manager"] },
  {
    route: "/dashboard/agent",
    roles: ["crisis_employee", "lead_employee"],
  },
  {
    route: "/dashboard",
    roles: ["brand_manager"],
    permission: "dashboard",
  },
  {
    route: "/mentions",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "mentions",
  },
  {
    route: "/alerts",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "alerts",
  },
  {
    route: "/crisis-monitoring",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "alerts",
  },
  {
    route: "/leads",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "leads",
  },
  {
    route: "/lead-monitoring",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "leads",
  },
  {
    route: "/reports",
    roles: ["brand_manager", "crisis_employee", "lead_employee"],
    permission: "reports",
  },
  {
    route: "/operations",
    roles: ["crisis_employee", "lead_employee"],
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

export function getEmployeeBusinessScope(profile?: {
  role?: unknown;
  permissions?: string[] | null;
} | null): EmployeeBusinessScope {
  if (!profile) return "unassigned";
  const permissions = new Set(
    Array.isArray(profile.permissions)
      ? profile.permissions.filter((permission) => typeof permission === "string")
      : [],
  );
  const hasCrisis = permissions.has("alerts");
  const hasLead = permissions.has("leads");

  if (hasCrisis && hasLead) return "dual";
  if (hasCrisis) return "crisis";
  if (hasLead) return "lead";

  const role = normalizeRole(profile.role);
  if (role === "crisis_employee") return "crisis";
  if (role === "lead_employee") return "lead";
  return "unassigned";
}

export function getProfileRoleLabel(profile?: {
  role?: unknown;
  permissions?: string[] | null;
} | null) {
  const role = normalizeRole(profile?.role);
  if (!role) return "Khách";
  if (role === "admin" || role === "brand_manager") {
    return ROLE_CONFIG[role].label;
  }

  const scope = getEmployeeBusinessScope(profile);
  if (scope === "dual") {
    return "Nhân viên xử lý khủng hoảng & khách hàng tiềm năng";
  }
  if (scope === "crisis") return ROLE_CONFIG.crisis_employee.label;
  if (scope === "lead") return ROLE_CONFIG.lead_employee.label;
  return ROLE_CONFIG[role].label;
}

function pathMatchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathMatchesRoute(pathname, route));
}

export function isProtectedPath(pathname: string) {
  if (isPublicPath(pathname)) return false;
  return ROUTE_POLICIES.some((policy) =>
    pathMatchesRoute(pathname, policy.route),
  );
}

export function getDefaultRouteForRole(role?: RoleInput | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? ROLE_CONFIG[normalizedRole].defaultRoute : "/login";
}

export function canPerformAction(
  profile: Pick<UserRoleProfile, "role" | "permissions"> | null | undefined,
  action: BusinessAction,
) {
  if (!profile) return false;
  const permission = ACTION_PERMISSION_MAP[action];
  if (permission && profile.permissions?.includes(permission)) return true;
  return ROLE_BUSINESS_ACTIONS[profile.role]?.includes(action) ?? false;
}

export function getBusinessActionsForRole(role?: RoleInput | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? ROLE_BUSINESS_ACTIONS[normalizedRole] : [];
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
  storedBrandIds?: unknown;
  storedWorkspaceIds?: unknown;
  storedPermissions?: unknown;
  storedDefaultRoute?: unknown;
  storedTemporaryPasswordIssued?: unknown;
  storedTrialAccount?: unknown;
  storedTrialDays?: unknown;
  storedTrialStartAt?: unknown;
  storedTrialEndsAt?: unknown;
  storedOnboarding?: unknown;
}): UserRoleProfile {
  const email = (params.email || "").trim().toLowerCase();
  const role = normalizeRole(params.storedRole);
  if (!role) {
    throw new Error("User is not provisioned with a valid InsightFlow role.");
  }

  const companyDomain = email.includes("@") ? email.split("@")[1] : "";
  const permissions = Array.isArray(params.storedPermissions)
    ? params.storedPermissions.filter(
      (permission): permission is string => typeof permission === "string",
    )
    : ROLE_CONFIG[role].permissions;
  const onboarding =
    params.storedOnboarding &&
    typeof params.storedOnboarding === "object" &&
    !Array.isArray(params.storedOnboarding)
      ? (params.storedOnboarding as UserRoleProfile["onboarding"])
      : undefined;
  const normalizeTimestamp = (value: unknown) => {
    if (typeof value === "string") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    if (value && typeof value === "object" && "toDate" in value) {
      const toDate = (value as { toDate?: unknown }).toDate;
      if (typeof toDate === "function") {
        const parsed = toDate.call(value);
        return parsed instanceof Date && !Number.isNaN(parsed.getTime())
          ? parsed.toISOString()
          : undefined;
      }
    }
    return undefined;
  };
  const trialDays = Number(params.storedTrialDays);

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
    brandIds: Array.isArray(params.storedBrandIds)
      ? params.storedBrandIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined,
    workspaceIds: Array.isArray(params.storedWorkspaceIds)
      ? params.storedWorkspaceIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined,
    displayName: params.displayName || "",
    photoURL: params.photoURL || "",
    permissions,
    defaultRoute:
      typeof params.storedDefaultRoute === "string"
        ? params.storedDefaultRoute
        : ROLE_CONFIG[role].defaultRoute,
    temporaryPasswordIssued: params.storedTemporaryPasswordIssued === true,
    trialAccount: params.storedTrialAccount === true,
    trialDays: Number.isFinite(trialDays) && trialDays > 0 ? trialDays : undefined,
    trialStartAt: normalizeTimestamp(params.storedTrialStartAt),
    trialEndsAt: normalizeTimestamp(params.storedTrialEndsAt),
    onboarding,
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
