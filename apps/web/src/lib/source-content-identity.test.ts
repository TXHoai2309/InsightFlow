import test from "node:test";
import assert from "node:assert/strict";
import {
  deduplicateSourceRecords,
  getSourceRecordNativeKey,
} from "./source-content-identity";

test("collapses one Threads object collected as both post and comment", () => {
  const records = [
    {
      id: "DbAO5PHEuKA",
      platform: "thread",
      content_type: "post",
      post_id: "DbAO5PHEuKA",
      author: "@c.hing_t",
      content: "Even Starbucks should not serve cold drinks",
      posted_at: "2026-07-20T05:52:29.000Z",
    },
    {
      id: "DbAO5PHEuKA",
      platform: "threads",
      content_type: "comment",
      post_id: "DbANO37koaT",
      comment_id: "DbAO5PHEuKA",
      author: "@c.hing_t",
      content: " Even  Starbucks should not serve cold drinks ",
      posted_at: "2026-07-20T05:52:29+00:00",
    },
  ];

  assert.equal(deduplicateSourceRecords(records).length, 1);
});

test("keeps the same native id when it belongs to different platforms", () => {
  const records = [
    {
      id: "same-id",
      platform: "facebook",
      content_type: "post",
      post_id: "same-id",
      content: "Complaint",
      posted_at: "2026-07-20T05:52:29.000Z",
    },
    {
      id: "same-id",
      platform: "threads",
      content_type: "post",
      post_id: "same-id",
      content: "Complaint",
      posted_at: "2026-07-20T05:52:29.000Z",
    },
  ];

  assert.notEqual(
    getSourceRecordNativeKey(records[0]),
    getSourceRecordNativeKey(records[1]),
  );
  assert.equal(deduplicateSourceRecords(records).length, 2);
});

test("does not collapse post and comment with the same id when their content differs", () => {
  const records = [
    {
      id: "shared-id",
      platform: "threads",
      content_type: "post",
      post_id: "shared-id",
      author: "@author",
      content: "Original post",
      posted_at: "2026-07-20T05:52:29.000Z",
    },
    {
      id: "shared-id",
      platform: "threads",
      content_type: "comment",
      post_id: "parent-id",
      comment_id: "shared-id",
      author: "@author",
      content: "A legitimate reply",
      posted_at: "2026-07-20T05:52:29.000Z",
    },
  ];

  assert.equal(deduplicateSourceRecords(records).length, 2);
});

test("uses the preferred operational record when duplicate workflow rows exist", () => {
  const records = [
    {
      id: "duplicate",
      source: "facebook",
      content_type: "comment",
      comment_id: "duplicate",
      text: "Complaint",
      created_at: "2026-07-20T05:52:29.000Z",
      status: "new",
    },
    {
      id: "duplicate-copy",
      source: "facebook",
      content_type: "comment",
      comment_id: "duplicate",
      text: "Updated complaint",
      created_at: "2026-07-20T05:53:29.000Z",
      status: "resolved",
    },
  ];

  const deduplicated = deduplicateSourceRecords(records, {
    selectPreferred: (_existing, candidate) => candidate,
  });

  assert.equal(deduplicated.length, 1);
  assert.equal(deduplicated[0].status, "resolved");
});
