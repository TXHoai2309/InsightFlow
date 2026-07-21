export type DashboardReturnOrigin = "lead-monitoring" | "crisis-monitoring";

export interface DashboardReturnContext {
  token: string;
  origin: DashboardReturnOrigin;
  returnPath: string;
  filter: string;
  page: number;
  searchText?: string;
  selectedItemId: string;
  scrollTop: number;
  savedAt: string;
}

export interface DashboardReturnNavigation {
  origin: DashboardReturnOrigin;
  token: string;
  returnPath: string;
  href: string;
  label: string;
}

const STORAGE_PREFIX = "insightflow.dashboard.returnContext.";
const MAX_CONTEXT_AGE_MS = 2 * 60 * 60 * 1000;

export const DASHBOARD_RETURN_CONFIG: Record<DashboardReturnOrigin, {
  token: string;
  path: string;
  label: string;
}> = {
  "lead-monitoring": {
    token: "lead-monitoring",
    path: "/dashboard/lead-monitoring",
    label: "Quay lại Lead Monitoring",
  },
  "crisis-monitoring": {
    token: "crisis-monitoring",
    path: "/dashboard/insights",
    label: "Quay lại Crisis Monitoring",
  },
};

export function getAppScrollTop() {
  if (typeof window === "undefined") return 0;
  const scrollRoot = document.querySelector<HTMLElement>('[data-app-scroll-root="true"]');
  return scrollRoot?.scrollTop || window.scrollY || 0;
}

export function saveDashboardReturnContext(context: DashboardReturnContext) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${context.token}`, JSON.stringify(context));
}

export function loadDashboardReturnContext(token: string | null) {
  if (typeof window === "undefined" || !token) return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${token}`);
    if (!raw) return null;
    const context = JSON.parse(raw) as DashboardReturnContext;
    const config = DASHBOARD_RETURN_CONFIG[context.origin];
    const savedAt = new Date(context.savedAt).getTime();
    if (
      !config ||
      config.path !== context.returnPath ||
      !Number.isFinite(savedAt) ||
      Date.now() - savedAt > MAX_CONTEXT_AGE_MS
    ) {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}${token}`);
      return null;
    }
    return context;
  } catch {
    return null;
  }
}

export function createDashboardReturnHref(origin: DashboardReturnOrigin, token: string) {
  const config = DASHBOARD_RETURN_CONFIG[origin];
  const params = new URLSearchParams({ dashboardReturnToken: token });
  return `${config.path}?${params.toString()}`;
}

export function appendDashboardReturnParams(
  href: string,
  origin: DashboardReturnOrigin,
  token: string,
) {
  const config = DASHBOARD_RETURN_CONFIG[origin];
  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const [path, query = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("dashboardReturnOrigin", origin);
  params.set("dashboardReturnTo", config.path);
  params.set("dashboardReturnToken", token);
  const nextHref = `${path}?${params.toString()}`;
  return hash ? `${nextHref}#${hash}` : nextHref;
}

export function readDashboardReturnNavigation(
  params: Pick<URLSearchParams, "get">,
): DashboardReturnNavigation | null {
  const origin = params.get("dashboardReturnOrigin") as DashboardReturnOrigin | null;
  const returnPath = params.get("dashboardReturnTo") || "";
  const token = params.get("dashboardReturnToken") || "";
  if (!origin || !token) return null;
  const config = DASHBOARD_RETURN_CONFIG[origin];
  if (!config || config.path !== returnPath) return null;
  return {
    origin,
    token,
    returnPath,
    href: createDashboardReturnHref(origin, token),
    label: config.label,
  };
}

export function removeDashboardReturnTokenFromCurrentUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.delete("dashboardReturnToken");
  const query = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}
