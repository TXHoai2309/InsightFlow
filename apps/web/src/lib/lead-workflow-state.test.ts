import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLeadWorkflowLookupKeys,
  getMissingLeadWorkflowKeys,
  indexLeadWorkflowRows,
  mergeLeadWorkflowRows,
  type LeadWorkflowRow,
} from "./lead-workflow-state";

test("indexes a completed workflow row even when it is older than the latest 2,000 rows", () => {
  const rows: LeadWorkflowRow[] = Array.from({ length: 2501 }, (_, index) => ({
    id: `lead-${index}`,
    mention_id: `mention-${index}`,
    status: index === 2500 ? "completed" : "new",
    updated_at: new Date(Date.UTC(2026, 6, 22, 0, 0, 0) - index * 1000).toISOString(),
  }));

  const index = indexLeadWorkflowRows(rows);

  assert.equal(index.get("mention-2500")?.status, "completed");
});

test("indexes legacy workflow identities through id, mention_id and source_mention_id", () => {
  const row = {
    id: "workflow-row",
    mention_id: "mention-id",
    source_mention_id: "source-id",
    status: "completed",
  };

  const index = indexLeadWorkflowRows([row]);

  assert.equal(index.get("workflow-row"), row);
  assert.equal(index.get("mention-id"), row);
  assert.equal(index.get("source-id"), row);
});

test("prefers the newest workflow state when legacy rows share a mention key", () => {
  const older = {
    id: "old-row",
    mention_id: "mention-1",
    status: "new",
    updated_at: "2026-07-20T08:00:00.000Z",
  };
  const newer = {
    id: "new-row",
    source_mention_id: "mention-1",
    status: "completed",
    updated_at: "2026-07-21T08:00:00.000Z",
  };

  const index = indexLeadWorkflowRows([older, newer]);

  assert.equal(index.get("mention-1"), newer);
});

test("deduplicates lookup keys and only reports workflow identities that remain missing", () => {
  const keys = buildLeadWorkflowLookupKeys([
    { id: "mention-1" },
    { id: "mention-1" },
    { id: "mention-2" },
    { id: "" },
  ]);
  const rows = mergeLeadWorkflowRows(
    [{ id: "mention-1", status: "completed" }],
    [{ id: "mention-1", status: "completed" }],
  );

  assert.deepEqual(keys, ["mention-1", "mention-2"]);
  assert.equal(rows.length, 1);
  assert.deepEqual(getMissingLeadWorkflowKeys(keys, rows), ["mention-2"]);
});

test("merges account-scoped history outside the global recent window without losing workflow state", () => {
  const recentRows: LeadWorkflowRow[] = Array.from({ length: 2000 }, (_, index) => ({
    id: `recent-${index}`,
    mention_id: `recent-mention-${index}`,
    status: "new",
    updated_at: new Date(Date.UTC(2026, 6, 23) - index * 1000).toISOString(),
  }));
  const accountRows: LeadWorkflowRow[] = [
    {
      id: "owned-completed",
      mention_id: "owned-completed-mention",
      owner_id: "employee-1",
      status: "completed",
      updated_at: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "owned-skipped",
      mention_id: "owned-skipped-mention",
      owner_id: "employee-1",
      status: "skipped",
      updated_at: "2026-05-01T00:00:00.000Z",
    },
    {
      id: "owned-follow-up",
      mention_id: "owned-follow-up-mention",
      owner_id: "employee-1",
      status: "processing",
      follow_up_at: "2026-07-24T02:00:00.000Z",
      updated_at: "2026-04-01T00:00:00.000Z",
    },
  ];

  const index = indexLeadWorkflowRows(
    mergeLeadWorkflowRows(recentRows, accountRows),
  );

  assert.equal(index.get("owned-completed-mention")?.status, "completed");
  assert.equal(index.get("owned-skipped-mention")?.status, "skipped");
  assert.equal(index.get("owned-follow-up-mention")?.follow_up_at, "2026-07-24T02:00:00.000Z");
});
