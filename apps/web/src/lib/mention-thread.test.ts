import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMentionThreadContext,
  mergeMentionThreadItems,
} from "./mention-thread";
import type { Mention } from "@/types/dashboard";

function mention(
  id: string,
  contentType: NonNullable<Mention["content_type"]>,
  parentId: string | null,
  postedAt: string,
): Mention {
  return {
    id,
    post_id: contentType === "post" ? id : "post-1",
    comment_id: contentType === "post" ? null : id,
    parent_id: parentId,
    workspace_id: "brand-1",
    platform: "facebook",
    content: id,
    content_type: contentType,
    author: id,
    sentiment: "neutral",
    topic: "other",
    credibility_score: 100,
    created_at: postedAt,
    posted_at: postedAt,
  };
}

test("builds the complete context path and nested reply tree", () => {
  const post = mention("post-1", "post", null, "2026-07-16T01:00:00.000Z");
  const comment = mention("comment-1", "comment", "post-1", "2026-07-16T01:01:00.000Z");
  const reply = mention("reply-1", "reply", "comment-1", "2026-07-16T01:02:00.000Z");
  const sibling = mention("comment-2", "comment", "post-1", "2026-07-16T01:03:00.000Z");

  const context = buildMentionThreadContext(
    [reply, sibling, post, comment],
    { targetId: reply.id, postId: post.id },
  );

  assert.equal(context.post?.id, post.id);
  assert.deepEqual(context.contextPath.map((item) => item.id), [
    post.id,
    comment.id,
    reply.id,
  ]);
  assert.equal(context.total, 3);
  assert.equal(context.tree[0].id, comment.id);
  assert.equal(context.tree[0].children[0].id, reply.id);
  assert.equal(context.tree[1].id, sibling.id);
});

test("attaches missing or cyclic parents to the root without recursing forever", () => {
  const post = mention("post-1", "post", null, "2026-07-16T01:00:00.000Z");
  const orphan = mention("orphan", "reply", "missing", "2026-07-16T01:01:00.000Z");
  const cycleA = mention("cycle-a", "reply", "cycle-b", "2026-07-16T01:02:00.000Z");
  const cycleB = mention("cycle-b", "reply", "cycle-a", "2026-07-16T01:03:00.000Z");

  const context = buildMentionThreadContext(
    [post, orphan, cycleA, cycleB],
    { targetId: orphan.id, postId: post.id },
  );

  assert.equal(context.tree.length, 3);
  assert.equal(context.orphanedCount, 3);
  assert.deepEqual(context.contextPath.map((item) => item.id), [post.id, orphan.id]);
});

test("merges newer thread details without duplicating nodes", () => {
  const base = {
    ...mention("comment-1", "comment", "post-1", "2026-07-16T01:00:00.000Z"),
    post_content: "Bài viết gốc",
  };
  const enriched = {
    ...base,
    content: "Nội dung đầy đủ",
    author: "Khách hàng",
    post_content: undefined,
  };

  const merged = mergeMentionThreadItems([base], [enriched]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].content, "Nội dung đầy đủ");
  assert.equal(merged[0].author, "Khách hàng");
  assert.equal(merged[0].post_content, "Bài viết gốc");
});
