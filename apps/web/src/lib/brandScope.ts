import { normalizeBrandName } from "@/lib/services/dashboard";
import {
  canPerformAction,
  type BusinessAction,
  type UserRoleProfile,
} from "@/lib/rbac";

export interface BrandScopedRecord {
  workspace_id?: string;
  brand?: string;
  brandName?: string;
}

export function getScopedBrandKey(profile?: UserRoleProfile | null) {
  if (!profile || profile.role === "admin") return null;
  const rawBrand = profile.brandName || profile.brandId || "";
  return rawBrand ? normalizeBrandName(rawBrand) : null;
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
  const rawBrand = String(record.workspace_id || record.brand || record.brandName || "");
  return normalizeBrandName(rawBrand) === scopedBrandKey;
}

export function isSameBrandScope(
  profile: UserRoleProfile | null | undefined,
  record: BrandScopedRecord,
) {
  if (!profile) return false;
  const scopedBrandKey = getScopedBrandKey(profile);
  if (!scopedBrandKey) return profile.role === "admin";
  return isRecordInBrandScope(record, scopedBrandKey);
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
  return records.filter((record) => isRecordInBrandScope(record as BrandScopedRecord, scopedBrandKey));
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
