const DEMO_ROUTE_MAP = [
  ["/dashboard/lead-monitoring", "/demo/lead-monitoring"],
  ["/dashboard/insights", "/demo/insights"],
  ["/dashboard", "/demo"],
  ["/mentions", "/demo/mentions"],
  ["/alerts", "/demo/alerts"],
  ["/crisis", "/demo/alerts"],
  ["/leads", "/demo/leads"],
  ["/contacts", "/demo/leads"],
  ["/reports", "/demo/reports"],
] as const;

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/about", "/contact"]);

export function isDemoPath(pathname: string | null | undefined) {
  return Boolean(pathname && (pathname === "/demo" || pathname.startsWith("/demo/")));
}

export function isDemoRuntime() {
  return typeof window !== "undefined" && isDemoPath(window.location.pathname);
}

/**
 * Translate an authenticated application URL to its equivalent demo URL.
 * Query strings and hashes are preserved so filters and selected records keep
 * working when the shared production components are rendered under /demo.
 */
export function toDemoHref(href: string) {
  if (!href) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

  if (isDemoPath(pathname)) return href;

  const route = DEMO_ROUTE_MAP.find(([source]) =>
    pathname === source || pathname.startsWith(`${source}/`),
  );
  if (!route) return null;

  const [source, target] = route;
  return `${target}${pathname.slice(source.length)}${query}${hash}`;
}

export function isPublicDemoExit(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

