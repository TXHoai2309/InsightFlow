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
  const [hostname, currentPort] = host.split(":");

  if (hostname && isLocalOrPrivateHost(hostname)) {
    const apiPort = process.env.API_PORT || (currentPort === "3001" ? "3002" : "3001");
    return `http://${hostname}:${apiPort}`;
  }

  return "http://localhost:3001";
}

export async function readApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text || response.statusText || "API response is not valid JSON.",
    };
  }
}
