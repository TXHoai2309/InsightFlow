export function normalizeBrandName(name: string): string {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[\s\-_.]/g, "")
    .trim();

  if (normalized.includes("highland")) return "highlandcoffee";
  if (normalized.includes("starbuck")) return "starbucks";
  if (normalized.includes("mixue")) return "mixue";
  return normalized;
}
