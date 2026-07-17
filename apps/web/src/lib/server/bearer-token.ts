export function extractBearerToken(authorization: string | null): string | null {
  if (typeof authorization !== "string") return null;

  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
}
