import test from "node:test";
import assert from "node:assert/strict";
import type { Lead } from "@/types/dashboard";
import type { UserRoleProfile } from "./rbac";
import { getLeadFollowUpMeta, matchesLeadWorkbenchView } from "./lead-workbench";

const profile: UserRoleProfile = {
  uid: "lead-employee-1",
  email: "lead@example.com",
  displayName: "Nguyễn Lead",
  role: "lead_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["leads"],
  defaultRoute: "/leads",
};

function lead(overrides: Partial<Lead>): Lead {
  return {
    id: "lead-default",
    workspace_id: "highlands-coffee",
    platform: "facebook",
    author: "Khách hàng",
    content: "Nội dung cần xử lý",
    intent: "warm",
    intent_signals: [],
    status: "new",
    created_at: "2026-07-20T08:00:00.000Z",
    ...overrides,
  };
}

test("separates completed and skipped leads into different workbench views", () => {
  const completed = lead({ id: "completed", status: "completed", owner_id: profile.uid });
  const skipped = lead({ id: "skipped", status: "skipped", owner_id: profile.uid });

  assert.equal(matchesLeadWorkbenchView(completed, "closed", Date.now(), profile), true);
  assert.equal(matchesLeadWorkbenchView(completed, "skipped", Date.now(), profile), false);
  assert.equal(matchesLeadWorkbenchView(skipped, "closed", Date.now(), profile), false);
  assert.equal(matchesLeadWorkbenchView(skipped, "skipped", Date.now(), profile), true);
});

test("places a restored lead back into active even when legacy contact fields are missing", () => {
  const restored = lead({
    status: "processing",
    owner_id: profile.uid,
    last_action_type: "restore",
    last_action_at: "2026-07-20T09:00:00.000Z",
    pending_result: false,
  });

  assert.equal(matchesLeadWorkbenchView(restored, "active", Date.now(), profile), true);
  assert.equal(matchesLeadWorkbenchView(restored, "closed", Date.now(), profile), false);
  assert.equal(matchesLeadWorkbenchView(restored, "skipped", Date.now(), profile), false);
});

test("places future follow-up appointments in follow-up and excludes them from active", () => {
  const now = new Date("2026-07-20T09:00:00+07:00").getTime();
  const scheduled = lead({
    id: "future-follow-up",
    status: "processing",
    owner_id: profile.uid,
    last_contact_at: "2026-07-20T01:30:00.000Z",
    result_type: "follow_up",
    follow_up_at: "2026-07-21T09:00:00+07:00",
  });

  assert.equal(matchesLeadWorkbenchView(scheduled, "follow_up", now, profile), true);
  assert.equal(matchesLeadWorkbenchView(scheduled, "active", now, profile), false);
});

test("keeps legacy open appointments visible when result_type was not persisted", () => {
  const now = new Date("2026-07-20T09:00:00+07:00").getTime();
  const legacy = lead({
    id: "legacy-follow-up",
    status: "processing",
    owner_id: profile.uid,
    result_type: null,
    follow_up_at: "2026-07-22T09:00:00+07:00",
  });

  assert.equal(matchesLeadWorkbenchView(legacy, "follow_up", now, profile), true);
  assert.equal(matchesLeadWorkbenchView(legacy, "active", now, profile), false);
  assert.equal(matchesLeadWorkbenchView(legacy, "priority", now, profile), false);
});

test("ignores stale follow-up timestamps after another result or a terminal status", () => {
  const now = new Date("2026-07-20T09:00:00+07:00").getTime();
  const changedResult = lead({
    id: "changed-result",
    status: "processing",
    owner_id: profile.uid,
    result_type: "positive",
    follow_up_at: "2026-07-21T09:00:00+07:00",
    last_contact_at: "2026-07-20T01:30:00.000Z",
  });
  const closed = lead({
    id: "closed-follow-up",
    status: "completed",
    owner_id: profile.uid,
    result_type: "follow_up",
    follow_up_at: "2026-07-21T09:00:00+07:00",
  });

  assert.equal(matchesLeadWorkbenchView(changedResult, "follow_up", now, profile), false);
  assert.equal(matchesLeadWorkbenchView(changedResult, "active", now, profile), true);
  assert.equal(matchesLeadWorkbenchView(closed, "follow_up", now, profile), false);
  assert.equal(matchesLeadWorkbenchView(closed, "closed", now, profile), true);
});

test("classifies active follow-up appointments by actionable time bucket", () => {
  const now = new Date("2026-07-20T10:00:00+07:00").getTime();
  const overdue = getLeadFollowUpMeta(lead({
    status: "processing",
    result_type: "follow_up",
    follow_up_at: "2026-07-20T09:00:00+07:00",
  }), now);
  const today = getLeadFollowUpMeta(lead({
    status: "processing",
    result_type: "follow_up",
    follow_up_at: "2026-07-20T14:00:00+07:00",
  }), now);
  const future = getLeadFollowUpMeta(lead({
    status: "processing",
    result_type: "follow_up",
    follow_up_at: "2026-07-21T09:00:00+07:00",
  }), now);

  assert.equal(overdue.bucket, "overdue");
  assert.equal(overdue.isDueToday, true);
  assert.equal(today.bucket, "today");
  assert.equal(today.isDueToday, true);
  assert.equal(future.bucket, "future");
  assert.equal(future.isDueToday, false);
  assert.equal(future.isActive, true);
});
