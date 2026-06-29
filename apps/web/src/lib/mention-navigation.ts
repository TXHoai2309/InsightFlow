import type { Mention } from "@/types/dashboard";

export type MentionDetailTarget = {
  detailId: string;
  href: string;
  targetId?: string;
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
