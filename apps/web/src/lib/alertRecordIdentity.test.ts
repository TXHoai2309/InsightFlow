import assert from "node:assert/strict";
import test from "node:test";

import { isSameAlertRecord } from "./alertRecordIdentity";

test("matches a comment only by its own entity or comment id", () => {
  const firstComment = {
    id: "tiktok:comment:post-1:comment-1",
    source_id: "comment-1",
    post_id: "post-1",
    comment_id: "comment-1",
    content_type: "comment",
  };

  assert.equal(isSameAlertRecord(firstComment, "tiktok:comment:post-1:comment-1"), true);
  assert.equal(isSameAlertRecord(firstComment, "comment-1"), true);
  assert.equal(isSameAlertRecord(firstComment, "post-1"), false);
  assert.equal(isSameAlertRecord(firstComment, "comment-2"), false);
});

test("allows a post-level alert to match its post id", () => {
  const postAlert = {
    id: "tiktok:post:post-1",
    source_id: "post-1",
    post_id: "post-1",
    content_type: "post",
  };

  assert.equal(isSameAlertRecord(postAlert, "post-1"), true);
});

test("keeps sibling comments on the same post independent", () => {
  const siblingComment = {
    id: "tiktok:comment:post-1:comment-2",
    source_id: "comment-2",
    post_id: "post-1",
    comment_id: "comment-2",
    content_type: "comment",
  };

  assert.equal(isSameAlertRecord(siblingComment, "comment-1"), false);
  assert.equal(isSameAlertRecord(siblingComment, "tiktok:comment:post-1:comment-1"), false);
});
