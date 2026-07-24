import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_DATA_COUNTS,
  dummyAlerts,
  dummyLeads,
  dummyMentions,
  dummyStaff,
} from "./demoData";
import { toDemoHref } from "./demo-navigation";

test("demo dataset contains 300 canonical mentions with derived operational data", () => {
  assert.deepEqual(DEMO_DATA_COUNTS, {
    mentions: 300,
    leads: 120,
    alerts: 100,
  });
  assert.equal(new Set(dummyMentions.map((item) => item.id)).size, 300);
  assert.equal(new Set(dummyLeads.map((item) => item.id)).size, 120);
  assert.equal(new Set(dummyAlerts.map((item) => item.id)).size, 100);

  const mentionIds = new Set(dummyMentions.map((item) => item.id));
  dummyMentions.forEach((mention) => {
    if (mention.parent_id) assert.ok(mentionIds.has(mention.parent_id));
  });
  dummyLeads.forEach((lead) => {
    assert.ok(lead.mention_id && mentionIds.has(lead.mention_id));
  });
});

test("demo data covers filters, queues and session-local assignment choices", () => {
  assert.deepEqual(
    new Set(dummyMentions.map((item) => item.platform)),
    new Set(["facebook", "tiktok", "youtube", "thread", "google_maps", "news", "be"]),
  );
  assert.deepEqual(
    new Set(dummyMentions.map((item) => item.sentiment)),
    new Set(["positive", "negative", "neutral"]),
  );
  assert.deepEqual(
    new Set(dummyLeads.map((item) => item.status)),
    new Set(["new", "processing", "completed", "skipped"]),
  );
  assert.ok(dummyLeads.some((item) => item.result_type === "follow_up" && item.follow_up_at));
  assert.ok(dummyLeads.some((item) => item.result_type === "converted"));
  assert.ok(dummyLeads.some((item) => !item.owner_id));
  assert.deepEqual(
    new Set(dummyAlerts.map((item) => item.status)),
    new Set(["new", "acknowledged", "resolved"]),
  );
  assert.ok(dummyStaff.some((item) => item.permissions.includes("leads")));
  assert.ok(dummyStaff.some((item) => item.permissions.includes("alerts")));

  const timestamps = dummyMentions.map((item) => new Date(item.posted_at).getTime());
  assert.ok(Math.max(...timestamps) - Math.min(...timestamps) >= 50 * 24 * 60 * 60 * 1000);
});

test("demo navigation keeps filters and record paths inside the public demo", () => {
  assert.equal(toDemoHref("/dashboard"), "/demo");
  assert.equal(toDemoHref("/alerts?status=new"), "/demo/alerts?status=new");
  assert.equal(toDemoHref("/leads?intent=hot"), "/demo/leads?intent=hot");
  assert.equal(
    toDemoHref("/mentions/demo-mention-001#comment-demo-mention-002"),
    "/demo/mentions/demo-mention-001#comment-demo-mention-002",
  );
  assert.equal(toDemoHref("/reports"), "/demo/reports");
  assert.equal(toDemoHref("/team/staff"), null);
});

