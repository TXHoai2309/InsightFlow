import type { LabelIntent, Lead } from "@/types/dashboard";

export type QualifiedLeadIntent = Exclude<LabelIntent, "none">;

const QUALIFIED_LEAD_INTENTS = new Set<QualifiedLeadIntent>([
  "hot",
  "warm",
  "cold",
]);

export function isQualifiedLeadIntent(
  intent: unknown,
): intent is QualifiedLeadIntent {
  return QUALIFIED_LEAD_INTENTS.has(
    String(intent || "")
      .toLowerCase()
      .trim() as QualifiedLeadIntent,
  );
}

export function isIntentLead(
  lead: Pick<Lead, "intent"> | null | undefined,
) {
  return isQualifiedLeadIntent(lead?.intent);
}
