import assert from "node:assert/strict";
import test from "node:test";

import {
  canSkipAlert,
  canRestoreAlert,
  getAlertWorkflowStatus,
  getPersistedAlertStatus,
  isResolvedAlert,
  isSkippedAlert,
  isTerminalAlert,
} from "./alertWorkflow";

test("preserves skipped as a separate terminal workflow state", () => {
  const alert = {
    status: "skipped",
    skipped_at: "2026-07-20T08:00:00.000Z",
    being_resolved_by: "crisis@example.com",
  };

  assert.equal(getAlertWorkflowStatus(alert), "skipped");
  assert.equal(getPersistedAlertStatus(alert), "skipped");
  assert.equal(isSkippedAlert(alert), true);
  assert.equal(isResolvedAlert(alert), false);
  assert.equal(isTerminalAlert(alert), true);
});

test("normalizes legacy ignored values to skipped", () => {
  assert.equal(getAlertWorkflowStatus({ resolution_status: "ignored" }), "skipped");
  assert.equal(getPersistedAlertStatus({ resolution_status: "dismissed" }), "skipped");
});

test("keeps active and resolved statuses unchanged", () => {
  assert.equal(getAlertWorkflowStatus({ status: "new" }), "pending");
  assert.equal(getAlertWorkflowStatus({ status: "resolving" }), "processing");
  assert.equal(getAlertWorkflowStatus({ status: "contact_failed" }), "contact_failed");
  assert.equal(getAlertWorkflowStatus({ status: "resolved" }), "resolved");
});

test("allows skip only for the owner of a processing alert", () => {
  assert.equal(canSkipAlert({ status: "resolving", being_resolved_by: "CRISIS@example.com" }, "crisis@example.com"), true);
  assert.equal(canSkipAlert({ status: "resolving", being_resolved_by: "other@example.com" }, "crisis@example.com"), false);
  assert.equal(canSkipAlert({ status: "contact_failed", being_resolved_by: "crisis@example.com" }, "crisis@example.com"), false);
  assert.equal(canSkipAlert({ status: "new" }, "crisis@example.com"), false);
});

test("allows terminal alerts to be restored by the previous actor or a manager", () => {
  const actor = { uid: "employee-1", email: "crisis@example.com", displayName: "Nhân viên Crisis" };

  assert.equal(canRestoreAlert({ status: "resolved", resolved_by_email: actor.email }, actor), true);
  assert.equal(canRestoreAlert({ status: "skipped", skipped_by_uid: actor.uid }, actor), true);
  assert.equal(canRestoreAlert({ status: "resolved", resolved_by_email: "other@example.com" }, actor), false);
  assert.equal(canRestoreAlert({ status: "new" }, actor, true), false);
  assert.equal(canRestoreAlert({ status: "skipped", skipped_by_email: "other@example.com" }, actor, true), true);
});
