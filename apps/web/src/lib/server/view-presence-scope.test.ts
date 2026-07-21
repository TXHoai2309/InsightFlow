import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessViewPresence,
  getScopedPresenceDocumentId,
  normalizePresenceBrandKey,
} from "./view-presence-scope";

test("normalizes a presence brand scope consistently", () => {
  assert.equal(normalizePresenceBrandKey(" Highlands Coffee "), "highlands-coffee");
});

test("requires a brand scope and the relevant queue permission", () => {
  const allowedRoles = new Set(["brand_manager", "lead_employee"]);
  assert.equal(canAccessViewPresence({
    brandKey: "highlands-coffee",
    role: "crisis_employee",
    permissions: ["leads"],
    requiredPermission: "leads",
    allowedRoles,
  }), true);
  assert.equal(canAccessViewPresence({
    brandKey: "",
    role: "lead_employee",
    permissions: ["leads"],
    requiredPermission: "leads",
    allowedRoles,
  }), false);
  assert.equal(canAccessViewPresence({
    brandKey: "highlands-coffee",
    role: "crisis_employee",
    permissions: ["alerts"],
    requiredPermission: "leads",
    allowedRoles,
  }), false);
});

test("isolates identical resource IDs between brands", () => {
  assert.notEqual(
    getScopedPresenceDocumentId("brand-a", "shared-id"),
    getScopedPresenceDocumentId("brand-b", "shared-id"),
  );
});
