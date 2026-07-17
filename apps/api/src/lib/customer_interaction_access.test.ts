import test from "node:test";
import assert from "node:assert/strict";
import { canUseCustomerInteractionSource } from "./customer_interaction_access";

test("single-operation employees only access their assigned interaction source", () => {
  assert.equal(canUseCustomerInteractionSource({
    role: "crisis_employee",
    permissions: ["alerts"],
    sourceType: "alert",
  }), true);
  assert.equal(canUseCustomerInteractionSource({
    role: "crisis_employee",
    permissions: ["alerts"],
    sourceType: "lead",
  }), false);
  assert.equal(canUseCustomerInteractionSource({
    role: "lead_employee",
    permissions: ["leads"],
    sourceType: "lead",
  }), true);
  assert.equal(canUseCustomerInteractionSource({
    role: "lead_employee",
    permissions: ["leads"],
    sourceType: "alert",
  }), false);
});

test("dual-operation employees access both alert and lead history regardless of base role", () => {
  for (const role of ["crisis_employee", "lead_employee"] as const) {
    for (const sourceType of ["alert", "lead"] as const) {
      assert.equal(canUseCustomerInteractionSource({
        role,
        permissions: ["alerts", "leads"],
        sourceType,
      }), true);
    }
  }
});

test("legacy employee profiles fall back to their base role", () => {
  assert.equal(canUseCustomerInteractionSource({
    role: "crisis_staff",
    sourceType: "alert",
  }), true);
  assert.equal(canUseCustomerInteractionSource({
    role: "lead_staff",
    sourceType: "lead",
  }), true);
});

test("brand managers access both sources while unknown roles are denied", () => {
  assert.equal(canUseCustomerInteractionSource({
    role: "brand_manager",
    sourceType: "alert",
  }), true);
  assert.equal(canUseCustomerInteractionSource({
    role: "brand_manager",
    sourceType: "lead",
  }), true);
  assert.equal(canUseCustomerInteractionSource({
    role: "admin",
    permissions: ["alerts", "leads"],
    sourceType: "alert",
  }), false);
});
