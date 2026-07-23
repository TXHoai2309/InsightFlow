import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUserRoleProfile,
  canPerformAction,
  getEmployeeBusinessScope,
  getProfileRoleLabel,
} from "./rbac";

test("includes normalized trial access fields in the authenticated profile", () => {
  const profile = buildUserRoleProfile({
    uid: "trial-user",
    email: "demo@example.com",
    storedRole: "brand_manager",
    storedTrialAccount: true,
    storedTrialDays: 7,
    storedTrialStartAt: "2026-07-23T00:00:00.000Z",
    storedTrialEndsAt: {
      toDate: () => new Date("2026-07-30T00:00:00.000Z"),
    },
  });

  assert.equal(profile.trialAccount, true);
  assert.equal(profile.trialDays, 7);
  assert.equal(profile.trialStartAt, "2026-07-23T00:00:00.000Z");
  assert.equal(profile.trialEndsAt, "2026-07-30T00:00:00.000Z");
});

test("derives the dual business scope from alerts and leads permissions", () => {
  assert.equal(getEmployeeBusinessScope({
    role: "lead_employee",
    permissions: ["alerts", "leads"],
  }), "dual");
  assert.equal(getEmployeeBusinessScope({
    role: "crisis_employee",
    permissions: ["alerts", "leads"],
  }), "dual");
});

test("falls back to the base employee role for legacy profiles", () => {
  assert.equal(getEmployeeBusinessScope({ role: "crisis_staff" }), "crisis");
  assert.equal(getEmployeeBusinessScope({ role: "lead_staff" }), "lead");
});

test("shows a correct Vietnamese label for dual-operation employees", () => {
  const profile = {
    role: "lead_employee" as const,
    permissions: ["alerts", "leads"],
  };
  assert.equal(
    getProfileRoleLabel(profile),
    "Nhân viên xử lý khủng hoảng & khách hàng tiềm năng",
  );
  assert.equal(canPerformAction(profile, "view_crisis_queue"), true);
  assert.equal(canPerformAction(profile, "view_leads"), true);
});
