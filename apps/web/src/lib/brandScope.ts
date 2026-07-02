import { normalizeBrandName } from "@/lib/services/dashboard";
import { UserRoleProfile } from "@/lib/rbac";

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

export function isRecordInBrandScope(record: BrandScopedRecord, scopedBrandKey: string | null) {
  if (!scopedBrandKey) return true;
  const rawBrand = String(record.workspace_id || record.brand || record.brandName || "");
  return normalizeBrandName(rawBrand) === scopedBrandKey;
}

export function filterByBrandScope<T>(records: T[], profile?: UserRoleProfile | null) {
  const scopedBrandKey = getScopedBrandKey(profile);
  return records.filter((record) => isRecordInBrandScope(record as BrandScopedRecord, scopedBrandKey));
}
