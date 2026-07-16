import type { Mention } from "@/types/dashboard";

export type MentionThreadNode = Mention & {
  children: MentionThreadNode[];
};

export type MentionThreadContext = {
  post: Mention | null;
  postId: string;
  target: Mention | null;
  comments: Mention[];
  tree: MentionThreadNode[];
  contextPath: Mention[];
  total: number;
  orphanedCount: number;
};

type BuildMentionThreadOptions = {
  targetId?: string;
  postId?: string;
};

function getMentionTime(mention: Mention) {
  const value = new Date(mention.posted_at || mention.created_at).getTime();
  return Number.isFinite(value) ? value : 0;
}

function sortByPostedAt(a: Mention, b: Mention) {
  return getMentionTime(a) - getMentionTime(b);
}

function findPostFromAncestors(
  target: Mention | undefined,
  mentionById: Map<string, Mention>,
) {
  if (!target) return undefined;
  if (target.content_type === "post") return target;

  const seen = new Set<string>();
  let cursor: Mention | undefined = target;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    if (cursor.content_type === "post") return cursor;
    cursor = cursor.parent_id ? mentionById.get(cursor.parent_id) : undefined;
  }
  return undefined;
}

function hasParentCycle(item: Mention, commentById: Map<string, Mention>) {
  const seen = new Set<string>([item.id]);
  let parentId = item.parent_id || "";

  while (parentId && commentById.has(parentId)) {
    if (seen.has(parentId)) return true;
    seen.add(parentId);
    parentId = commentById.get(parentId)?.parent_id || "";
  }

  return false;
}

export function mergeMentionThreadItems(...groups: Mention[][]) {
  const merged = new Map<string, Mention>();
  groups.forEach((group) => {
    group.forEach((mention) => {
      const current = merged.get(mention.id);
      const definedFields = Object.fromEntries(
        Object.entries(mention).filter(([, value]) => value !== undefined),
      ) as Partial<Mention>;
      merged.set(
        mention.id,
        current ? ({ ...current, ...definedFields } as Mention) : mention,
      );
    });
  });
  return Array.from(merged.values());
}

export function buildMentionThreadContext(
  mentions: Mention[],
  options: BuildMentionThreadOptions = {},
): MentionThreadContext {
  const mentionById = new Map(mentions.map((mention) => [mention.id, mention]));
  const target = options.targetId ? mentionById.get(options.targetId) : undefined;
  const ancestorPost = findPostFromAncestors(target, mentionById);
  const resolvedPostId =
    options.postId ||
    target?.post_id ||
    ancestorPost?.id ||
    (target?.content_type === "post" ? target.id : "");
  const post =
    (resolvedPostId ? mentionById.get(resolvedPostId) : undefined) ||
    ancestorPost ||
    mentions.find(
      (mention) =>
        mention.content_type === "post" &&
        (!resolvedPostId || mention.id === resolvedPostId),
    ) ||
    null;
  const postId = resolvedPostId || post?.id || "";

  const threadItems = mentions.filter((mention) => {
    if (mention.id === postId || mention.id === target?.id) return true;
    if (!postId) return mention.content_type !== "post";
    return mention.post_id === postId;
  });
  const comments = threadItems
    .filter((mention) => mention.id !== post?.id && mention.content_type !== "post")
    .sort(sortByPostedAt);
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const rootKey = postId || post?.id || "__thread_root__";
  const normalizedParentById = new Map<string, string>();
  let orphanedCount = 0;

  comments.forEach((comment) => {
    const requestedParent = comment.parent_id || "";
    const hasValidParent = Boolean(
      requestedParent &&
      requestedParent !== comment.id &&
      (requestedParent === rootKey || commentById.has(requestedParent)),
    );
    const isCyclic = hasValidParent && hasParentCycle(comment, commentById);
    const parentId = hasValidParent && !isCyclic ? requestedParent : rootKey;
    if (requestedParent && parentId === rootKey && requestedParent !== rootKey) {
      orphanedCount += 1;
    }
    normalizedParentById.set(comment.id, parentId);
  });

  const childrenByParent = new Map<string, Mention[]>();
  comments.forEach((comment) => {
    const parentId = normalizedParentById.get(comment.id) || rootKey;
    const children = childrenByParent.get(parentId) || [];
    children.push(comment);
    childrenByParent.set(parentId, children);
  });
  childrenByParent.forEach((children) => children.sort(sortByPostedAt));

  const emitted = new Set<string>();
  const buildTree = (parentId: string): MentionThreadNode[] =>
    (childrenByParent.get(parentId) || []).flatMap((comment) => {
      if (emitted.has(comment.id)) return [];
      emitted.add(comment.id);
      return [{ ...comment, children: buildTree(comment.id) }];
    });

  const tree = buildTree(rootKey);
  const resolvedTarget = target || null;
  const contextPath: Mention[] = [];

  if (resolvedTarget) {
    const reversePath: Mention[] = [];
    const seen = new Set<string>();
    let cursor: Mention | undefined = resolvedTarget;
    while (cursor && !seen.has(cursor.id) && cursor.id !== post?.id) {
      seen.add(cursor.id);
      reversePath.push(cursor);
      const parentId: string =
        normalizedParentById.get(cursor.id) || cursor.parent_id || "";
      cursor = parentId && parentId !== rootKey ? commentById.get(parentId) : undefined;
    }
    if (post) contextPath.push(post);
    contextPath.push(...reversePath.reverse());
  } else if (post) {
    contextPath.push(post);
  }

  return {
    post,
    postId,
    target: resolvedTarget,
    comments,
    tree,
    contextPath,
    total: comments.length,
    orphanedCount,
  };
}
