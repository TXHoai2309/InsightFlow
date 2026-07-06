export interface BrandOption {
  id: string;
  name: string;
  domain: string;
}

export function slugifyBrandDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBrandEmailDomain(brandName?: string | null, fallbackDomain?: string | null) {
  const normalizedBrand = slugifyBrandDomain(brandName || "");
  if (normalizedBrand) return `${normalizedBrand}.com`;
  return (fallbackDomain || "").trim().toLowerCase();
}

export function buildBrandEmail(localPart: string, domain: string) {
  const cleanLocalPart = localPart
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^@+/, "")
    .split("@")[0];
  const cleanDomain = domain.trim().toLowerCase().replace(/^@+/, "");
  return cleanLocalPart && cleanDomain ? `${cleanLocalPart}@${cleanDomain}` : "";
}
