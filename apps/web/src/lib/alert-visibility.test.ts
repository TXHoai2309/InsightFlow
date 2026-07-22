import assert from "node:assert/strict";
import test from "node:test";

import type { UserRoleProfile } from "./rbac";
import type { AlertData } from "../stores/alert.store";
import {
  canAlertBeVisibleToUser,
  getEffectiveAlertOwner,
  isAlertOwnedByUser,
} from "./alert-visibility";

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

test("recognizes a manager assignment stored as uid or display name", () => {
  const manager: UserRoleProfile = {
    ...employee,
    uid: "manager-1",
    email: "manager@highlandscoffee.com",
    displayName: "Highlands Brand Manager",
    role: "brand_manager",
    permissions: ["alerts", "leads", "reports"],
  };
  const processingAlert: AlertData = {
    ...skippedAlert,
    id: "processing-alert",
    status: "resolving",
    skipped_at: null,
    skipped_by_email: null,
    skipped_by_name: null,
    being_resolved_by: manager.uid,
  };

  assert.equal(isAlertOwnedByUser(processingAlert, manager), true);
  assert.equal(
    isAlertOwnedByUser(
      { ...processingAlert, being_resolved_by: manager.displayName },
      manager,
    ),
    true,
  );
});
