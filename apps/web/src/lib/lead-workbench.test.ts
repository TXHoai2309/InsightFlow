import test from "node:test";
import assert from "node:assert/strict";
import type { Lead } from "@/types/dashboard";
import type { UserRoleProfile } from "./rbac";
import { matchesLeadWorkbenchView } from "./lead-workbench";

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
