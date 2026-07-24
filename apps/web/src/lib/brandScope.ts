import { normalizeBrandName } from "@/lib/brand-normalization";
import {
  canPerformAction,
  type BusinessAction,
  type UserRoleProfile,
} from "@/lib/rbac";

export interface BrandScopedRecord {
  workspace_id?: string;
  brand?: string;
  brandName?: string;
  brand_slug?: string;
  brand_id?: string;
}

export function getScopedBrandKey(profile?: UserRoleProfile | null) {
  if (!profile || profile.role === "admin") return null;
  const rawBrand = profile.brandName || profile.brandId || "";
  return rawBrand ? normalizeBrandName(rawBrand) : null;
}

function getScopedBrandKeys(profile?: UserRoleProfile | null) {
  if (!profile || profile.role === "admin") return [];
  const candidates = [
    profile.brandName,
    profile.brandId,
    ...(Array.isArray(profile.brandIds) ? profile.brandIds : []),
    ...(Array.isArray(profile.workspaceIds) ? profile.workspaceIds : []),
  ];
  return Array.from(new Set(candidates
    .map((value) => normalizeBrandName(String(value || "")))
    .filter(Boolean)));
}

export function hasRequiredBrandScope(profile?: UserRoleProfile | null) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return Boolean(getScopedBrandKey(profile));
}

export function hasBusinessBrandScope(profile?: UserRoleProfile | null) {
  if (!profile || profile.role === "admin") return false;
  return Boolean(getScopedBrandKey(profile));
}

export function isRecordInBrandScope(record: BrandScopedRecord, scopedBrandKey: string | null) {
  if (!scopedBrandKey) return true;
  const rawBrands = [
    record.workspace_id,
    record.brand,
    record.brandName,
    record.brand_slug,
    record.brand_id,
  ];
  return rawBrands.some((rawBrand) => normalizeBrandName(String(rawBrand || "")) === scopedBrandKey);
}

export function isSameBrandScope(
  profile: UserRoleProfile | null | undefined,
  record: BrandScopedRecord,
) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  const scopedBrandKeys = getScopedBrandKeys(profile);
  if (scopedBrandKeys.length === 0) return false;
  return scopedBrandKeys.some((key) => isRecordInBrandScope(record, key));
}

export function assertBrandScopedAccess(
  profile: UserRoleProfile | null | undefined,
  record: BrandScopedRecord,
) {
  if (!isSameBrandScope(profile, record)) {
    throw new Error("Record is outside the user's brand scope.");
  }
}

export function filterByBrandScope<T>(records: T[], profile?: UserRoleProfile | null) {
  const scopedBrandKey = getScopedBrandKey(profile);
  if (!scopedBrandKey) return records;
  const scopedBrandKeys = getScopedBrandKeys(profile);
  return records.filter((record) => {
    const scopedRecord = record as BrandScopedRecord;
    return scopedBrandKeys.some((key) => isRecordInBrandScope(scopedRecord, key));
  });
}

export function filterByBusinessPolicy<T>(
  records: T[],
  profile: UserRoleProfile | null | undefined,
  action: BusinessAction,
) {
  if (!profile || !canPerformAction(profile, action)) return [];
  if (profile.role !== "admin" && !hasBusinessBrandScope(profile)) return [];
  return filterByBrandScope(records, profile);
}
