interface PresenceAccessInput {
  brandKey: string;
  role: string;
  permissions: string[];
  requiredPermission: string;
  allowedRoles: ReadonlySet<string>;
}

export function normalizePresenceBrandKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function canAccessViewPresence({
  brandKey,
  role,
  permissions,
  requiredPermission,
  allowedRoles,
}: PresenceAccessInput) {
  return Boolean(
    brandKey &&
    (permissions.includes(requiredPermission) || allowedRoles.has(role)),
  );
}

export function getScopedPresenceDocumentId(brandKey: string, resourceId: string) {
  return `${brandKey}::${resourceId}`;
}
