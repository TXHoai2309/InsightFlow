import type {
  ClassificationLabel,
  LabelIntent,
  Lead,
} from "@/types/dashboard";

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

/**
 * Applies the same queue precedence used by inferQueueFromLabels. Operational
 * lead queues require an explicit brand relevance decision so unreviewed or
 * unrelated mentions cannot leak into customer workflows.
 */
export function isQualifiedLeadClassification(
  intent: unknown,
  labels?: Partial<ClassificationLabel> | null,
) {
  const effectiveIntent = labels?.intent ?? intent;
  if (!isQualifiedLeadIntent(effectiveIntent)) return false;
  if (!labels || labels.relevance !== true) return false;

  const sentiment = String(labels?.sentiment || "").toLowerCase().trim();
  const urgency = String(labels?.urgency || "").toLowerCase().trim();
  if (urgency === "urgent") return false;
  if (
    sentiment === "negative" &&
    (urgency === "high" || urgency === "medium")
  ) {
    return false;
  }

  return true;
}

export function isIntentLead(
  lead: Pick<Lead, "intent"> & Partial<Pick<Lead, "labels">> | null | undefined,
) {
  return isQualifiedLeadClassification(lead?.intent, lead?.labels);
}
