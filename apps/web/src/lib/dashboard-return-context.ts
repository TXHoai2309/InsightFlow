import { isDemoPath, toDemoHref } from "@/lib/demo-navigation";

export type DashboardReturnOrigin = "lead-monitoring" | "crisis-monitoring";
export type DashboardNavigationMode = "app" | "demo";

export interface DashboardReturnContext {
  token: string;
  origin: DashboardReturnOrigin;
  mode: DashboardNavigationMode;
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

export function getDashboardNavigationMode(
  pathname?: string | null,
): DashboardNavigationMode {
  const currentPathname =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  return isDemoPath(currentPathname) ? "demo" : "app";
}

export function getDashboardReturnPath(
  origin: DashboardReturnOrigin,
  mode: DashboardNavigationMode,
) {
  const appPath = DASHBOARD_RETURN_CONFIG[origin].path;
  return mode === "demo" ? toDemoHref(appPath) || "/demo" : appPath;
}

function getStorageKey(token: string, mode: DashboardNavigationMode) {
  return `${STORAGE_PREFIX}${mode}.${token}`;
}

export function getAppScrollTop() {
  if (typeof window === "undefined") return 0;
  const scrollRoot = document.querySelector<HTMLElement>('[data-app-scroll-root="true"]');
  return scrollRoot?.scrollTop || window.scrollY || 0;
}

export function saveDashboardReturnContext(context: DashboardReturnContext) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    getStorageKey(context.token, context.mode),
    JSON.stringify(context),
  );
}

export function loadDashboardReturnContext(
  token: string | null,
  mode: DashboardNavigationMode = getDashboardNavigationMode(),
) {
  if (typeof window === "undefined" || !token) return null;
  const scopedKey = getStorageKey(token, mode);
  // Existing authenticated return contexts used an unscoped key. They remain
  // readable in the real application, but Demo must never consume them.
  const candidateKeys =
    mode === "app" ? [scopedKey, `${STORAGE_PREFIX}${token}`] : [scopedKey];

  for (const storageKey of candidateKeys) {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) continue;
      const context = JSON.parse(raw) as DashboardReturnContext;
      const config = DASHBOARD_RETURN_CONFIG[context.origin];
      const savedAt = new Date(context.savedAt).getTime();
      const contextMode =
        context.mode || getDashboardNavigationMode(context.returnPath);
      const expectedReturnPath = config
        ? getDashboardReturnPath(context.origin, mode)
        : "";
      if (
        !config ||
        contextMode !== mode ||
        expectedReturnPath !== context.returnPath ||
        !Number.isFinite(savedAt) ||
        Date.now() - savedAt > MAX_CONTEXT_AGE_MS
      ) {
        window.sessionStorage.removeItem(storageKey);
        continue;
      }
      return context;
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }
  return null;
}

export function createDashboardReturnHref(
  origin: DashboardReturnOrigin,
  token: string,
  mode: DashboardNavigationMode = "app",
) {
  const params = new URLSearchParams({ dashboardReturnToken: token });
  return `${getDashboardReturnPath(origin, mode)}?${params.toString()}`;
}

export function appendDashboardReturnParams(
  href: string,
  origin: DashboardReturnOrigin,
  token: string,
  mode: DashboardNavigationMode = "app",
) {
  const safeHref =
    mode === "demo" ? toDemoHref(href) || "/demo" : href;
  const [pathAndQuery, hash = ""] = safeHref.split("#", 2);
  const [path, query = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("dashboardReturnOrigin", origin);
  params.set("dashboardReturnTo", getDashboardReturnPath(origin, mode));
  params.set("dashboardReturnToken", token);
  const nextHref = `${path}?${params.toString()}`;
  return hash ? `${nextHref}#${hash}` : nextHref;
}

export function readDashboardReturnNavigation(
  params: Pick<URLSearchParams, "get">,
  mode: DashboardNavigationMode = "app",
): DashboardReturnNavigation | null {
  const origin = params.get("dashboardReturnOrigin") as DashboardReturnOrigin | null;
  const returnPath = params.get("dashboardReturnTo") || "";
  const token = params.get("dashboardReturnToken") || "";
  if (!origin || !token) return null;
  const config = DASHBOARD_RETURN_CONFIG[origin];
  if (!config) return null;

  const appReturnPath = getDashboardReturnPath(origin, "app");
  const demoReturnPath = getDashboardReturnPath(origin, "demo");
  if (returnPath !== appReturnPath && returnPath !== demoReturnPath) return null;

  const safeReturnPath = getDashboardReturnPath(origin, mode);
  return {
    origin,
    token,
    returnPath: safeReturnPath,
    href: createDashboardReturnHref(origin, token, mode),
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
