import assert from "node:assert/strict";
import test from "node:test";

import type { UserRoleProfile } from "./rbac";
import type { AlertData } from "../stores/alert.store";
import { canAlertBeVisibleToUser, getEffectiveAlertOwner } from "./alert-visibility";

const employee: UserRoleProfile = {
  uid: "employee-1",
  email: "crisis@example.com",
  displayName: "Nhân viên Crisis",
  role: "crisis_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["alerts"],
  defaultRoute: "/alerts",
};

const skippedAlert: AlertData = {
  id: "skipped-alert",
  brand: "Highlands Coffee",
  source: "facebook",
  text: "Nội dung không liên quan",
  sentiment: "negative",
  topic: "service",
  severity: "high",
  negativity_score: 80,
  created_at: "2026-07-20T08:00:00.000Z",
  status: "skipped",
  skipped_at: "2026-07-20T09:00:00.000Z",
  skipped_by_email: employee.email,
  skipped_by_name: employee.displayName,
};

test("keeps a skipped alert visible to the employee who skipped it", () => {
  assert.equal(getEffectiveAlertOwner(skippedAlert), employee.email);
  assert.equal(canAlertBeVisibleToUser(skippedAlert, employee), true);
});

test("does not expose a skipped alert to another employee", () => {
  assert.equal(
    canAlertBeVisibleToUser(skippedAlert, {
      ...employee,
      uid: "employee-2",
      email: "other@example.com",
      displayName: "Nhân viên khác",
    }),
    false,
  );
});
