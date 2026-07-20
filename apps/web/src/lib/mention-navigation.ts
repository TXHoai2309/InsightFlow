import type { Lead, Mention } from "@/types/dashboard";

export type MentionDetailTarget = {
  detailId: string;
  href: string;
  targetId?: string;
};

export type LeadMentionTarget = MentionDetailTarget & {
  canOpenMentionDetail: boolean;
  fallbackUrl?: string;
  matchedMention?: Mention;
};

function walkMentionAncestors(
  mention: Mention,
  mentionById: Map<string, Mention>,
): Mention[] {
  const ancestors: Mention[] = [mention];
  const visited = new Set<string>();
  let current: Mention | undefined = mention;

  while (
    current?.parent_id &&
    mentionById.has(current.parent_id) &&
    !visited.has(current.id)
  ) {
    visited.add(current.id);
    current = mentionById.get(current.parent_id);
    if (!current) break;
    ancestors.push(current);
  }

  return ancestors;
}

export function resolveMentionDisplayPost(
  mention: Mention,
  mentionById: Map<string, Mention>,
): Mention {
  const ancestors = walkMentionAncestors(mention, mentionById);
  const postAncestor = [...ancestors]
    .reverse()
    .find((item) => item.content_type === "post");

  return postAncestor || ancestors[ancestors.length - 1] || mention;
}

export function resolveMentionDetailTarget(
  mention: Mention,
  mentionById: Map<string, Mention>,
): MentionDetailTarget {
  const displayPost = resolveMentionDisplayPost(mention, mentionById);
  const detailId = displayPost.id;
  const targetId = mention.id !== detailId ? mention.id : undefined;
  const hash = targetId
    ? `#comment-${encodeURIComponent(targetId)}`
    : "";

  return {
    detailId,
    href: `/mentions/${encodeURIComponent(detailId)}${hash}`,
    targetId,
  };
}

function normalizeLookupText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getLeadMentionCandidateIds(lead: Lead) {
  return Array.from(
    new Set(
      [lead.mention_id, lead.source_mention_id, lead.post_id, lead.id]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export function getLeadPrimaryMentionId(lead: Lead) {
  return getLeadMentionCandidateIds(lead)[0] || "";
}

export function createLeadWorkbenchHref(lead: Lead) {
  const params = new URLSearchParams({ leadId: lead.id });
  const mentionId = getLeadPrimaryMentionId(lead);
  if (mentionId) params.set("mentionId", mentionId);
  return `/leads?${params.toString()}`;
}

export function findLeadByNavigationTarget(
  leads: Lead[],
  leadId?: string | null,
  mentionId?: string | null,
) {
  const normalizedLeadId = String(leadId || "").trim();
  const normalizedMentionId = String(mentionId || "").trim();

  if (normalizedLeadId) {
    const exactLead = leads.find((lead) => lead.id === normalizedLeadId);
    if (exactLead) return exactLead;
  }

  const candidateIds = [normalizedMentionId, normalizedLeadId].filter(Boolean);
  if (candidateIds.length === 0) return undefined;

  return leads.find((lead) => {
    const leadCandidateIds = new Set(getLeadMentionCandidateIds(lead));
    return candidateIds.some((candidateId) => leadCandidateIds.has(candidateId));
  });
}

function findMentionForLead(
  lead: Lead,
  mentionById: Map<string, Mention>,
): Mention | undefined {
  const directMatch = getLeadMentionCandidateIds(lead)
    .map((id) => mentionById.get(id))
    .find((item): item is Mention => Boolean(item));

  if (directMatch) return directMatch;

  const leadContent = normalizeLookupText(lead.content);
  const leadUrl = String(lead.url || lead.source_url || "").trim();
  if (!leadContent && !leadUrl) return undefined;

  return Array.from(mentionById.values()).find((mention) => {
    if (mention.platform !== lead.platform) return false;
    if (
      normalizeLookupText(mention.workspace_id) !==
      normalizeLookupText(lead.workspace_id)
    ) {
      return false;
    }

    const sameUrl = Boolean(leadUrl && mention.url === leadUrl);
    const sameContent = [
      mention.content,
      mention.comment_content,
      mention.post_content,
      mention.original_content,
    ].some((value) => normalizeLookupText(value) === leadContent);

    return sameContent || (sameUrl && Boolean(leadContent));
  });
}

export function resolveLeadMentionTarget(
  lead: Lead,
  mentionById: Map<string, Mention>,
): LeadMentionTarget {
  const matchedMention = findMentionForLead(lead, mentionById);
  if (matchedMention) {
    return {
      ...resolveMentionDetailTarget(matchedMention, mentionById),
      canOpenMentionDetail: true,
      fallbackUrl: lead.url || lead.source_url,
      matchedMention,
    };
  }

  const fallbackMentionId = getLeadMentionCandidateIds(lead)[0];
  if (fallbackMentionId) {
    return {
      detailId: fallbackMentionId,
      href: `/mentions/${encodeURIComponent(fallbackMentionId)}`,
      targetId: lead.content_type === "post" ? undefined : fallbackMentionId,
      canOpenMentionDetail: true,
      fallbackUrl: lead.url || lead.source_url,
    };
  }

  return {
    detailId: "",
    href: "",
    canOpenMentionDetail: false,
    fallbackUrl: lead.url || lead.source_url,
  };
}
