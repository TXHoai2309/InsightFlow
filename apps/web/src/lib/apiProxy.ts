import type { NextRequest } from "next/server";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function isLocalOrPrivateHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export function getApiBaseUrl(request: NextRequest) {
  const configuredUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) return normalizeBaseUrl(configuredUrl);

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  if (hostname && isLocalOrPrivateHost(hostname)) {
    return `http://${hostname}:3001`;
  }

  return "http://localhost:3001";
}
