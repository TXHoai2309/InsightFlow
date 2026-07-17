import test from "node:test";
import assert from "node:assert/strict";
import type { Lead } from "@/types/dashboard";
import {
  DEFAULT_LEAD_WORKBENCH_FILTERS,
  countActiveLeadFilters,
  filterLeadWorkbenchItems,
  readLeadWorkbenchFilters,
  writeLeadWorkbenchFilters,
} from "./lead-filters";

const NOW = new Date("2026-07-16T08:00:00.000Z").getTime();

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    workspace_id: "highlands-coffee",
    platform: "facebook",
    author: "Trần Minh Tín",
    content: "Tôi muốn hỏi mã ưu đãi",
    intent: "hot",
    intent_signals: ["Có ý định mua rõ ràng"],
    status: "processing",
    created_at: "2026-07-16T07:00:00.000Z",
    updated_at: "2026-07-16T07:30:00.000Z",
    expiry_at: "2026-07-16T07:45:00.000Z",
    owner_id: "employee-1",
    ...overrides,
  };
}

test("filters leads by accent-insensitive query, priority, SLA and ownership", () => {
  const matching = makeLead();
  const other = makeLead({
    id: "lead-2",
    author: "Khách khác",
    platform: "thread",
    intent: "warm",
    owner_id: "employee-2",
    expiry_at: "2026-07-17T08:00:00.000Z",
  });

  const result = filterLeadWorkbenchItems(
    [matching, other],
    {
      ...DEFAULT_LEAD_WORKBENCH_FILTERS,
      query: "tran minh tin",
      platform: "facebook",
      priority: "hot",
      sla: "overdue",
      ownership: "mine",
    },
    NOW,
    "employee-1",
  );

  assert.deepEqual(result.map((lead) => lead.id), ["lead-1"]);
});

test("counts only optional workbench filters and can include workspace for admins", () => {
  const filters = {
    ...DEFAULT_LEAD_WORKBENCH_FILTERS,
    workspaceId: "highlands-coffee",
    platform: "facebook",
    sla: "due_soon" as const,
  };

  assert.equal(countActiveLeadFilters(filters), 2);
  assert.equal(countActiveLeadFilters(filters, true), 3);
});

test("round-trips workbench filters through URL parameters", () => {
  const params = new URLSearchParams("view=active");
  const filters = {
    ...DEFAULT_LEAD_WORKBENCH_FILTERS,
    query: "voucher",
    platform: "thread",
    priority: "warm" as const,
    ownership: "staff" as const,
    ownerId: "employee-2",
    updatedRange: "7d" as const,
  };

  writeLeadWorkbenchFilters(params, filters);
  const restored = readLeadWorkbenchFilters(params);

  assert.equal(params.get("view"), "active");
  assert.deepEqual(restored, filters);
});
