import test from "node:test";
import assert from "node:assert/strict";
import type { Lead } from "@/types/dashboard";
import type { UserRoleProfile } from "./rbac";
import { matchesLeadWorkbenchView, type LeadWorkbenchView } from "./lead-workbench";
import {
  DEFAULT_LEAD_WORKBENCH_FILTERS,
  countActiveLeadFilters,
  filterLeadWorkbenchItems,
  readLeadWorkbenchFilters,
  writeLeadWorkbenchFilters,
} from "./lead-filters";
import {
  DEFAULT_LEAD_REPORT_FILTERS,
  filterLeadReportItems,
} from "./lead-report-filters";
import { buildLeadReportData } from "./lead-report";

const NOW = new Date("2026-07-16T08:00:00.000Z").getTime();
const PROFILE: UserRoleProfile = {
  uid: "employee-1",
  email: "employee@example.com",
  displayName: "Nhân viên",
  role: "lead_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["leads"],
  defaultRoute: "/leads",
};

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

test("queue counters are derived from the currently filtered lead set", () => {
  const facebookLeads: Lead[] = [
    makeLead({ id: "unassigned", status: "new", owner_id: undefined }),
    makeLead({ id: "waiting", status: "processing" }),
    makeLead({ id: "active", last_contact_at: "2026-07-16T07:15:00.000Z", contact_attempts: 1 }),
    makeLead({
      id: "follow-up",
      last_contact_at: "2026-07-16T07:15:00.000Z",
      result_type: "follow_up",
      follow_up_at: "2026-07-17T08:00:00.000Z",
    }),
    makeLead({ id: "closed", status: "completed" }),
    makeLead({ id: "skipped", status: "skipped" }),
  ];
  const hiddenByPlatform = makeLead({
    id: "thread-closed",
    platform: "thread",
    status: "completed",
  });
  const filtered = filterLeadWorkbenchItems(
    [...facebookLeads, hiddenByPlatform],
    { ...DEFAULT_LEAD_WORKBENCH_FILTERS, platform: "facebook" },
    NOW,
    PROFILE.uid,
  );
  const views: LeadWorkbenchView[] = [
    "unassigned",
    "priority",
    "active",
    "follow_up",
    "closed",
    "skipped",
  ];
  const counts = Object.fromEntries(
    views.map((view) => [
      view,
      filtered.filter((lead) => matchesLeadWorkbenchView(lead, view, NOW, PROFILE)).length,
    ]),
  );

  assert.deepEqual(counts, {
    unassigned: 1,
    priority: 1,
    active: 1,
    follow_up: 1,
    closed: 1,
    skipped: 1,
  });
});

test("report periods use the same latest-update timestamp as customer filters", () => {
  const recentlyUpdated = makeLead({
    id: "recently-updated",
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-07-16T07:30:00.000Z",
  });
  const staleUpdate = makeLead({
    id: "stale-update",
    created_at: "2026-07-16T07:00:00.000Z",
    updated_at: "2026-06-01T08:00:00.000Z",
  });
  const filtered = filterLeadReportItems(
    [recentlyUpdated, staleUpdate],
    { ...DEFAULT_LEAD_REPORT_FILTERS, timeRange: "7d" },
    PROFILE,
    NOW,
  );

  assert.deepEqual(filtered.map((lead) => lead.id), ["recently-updated"]);
});

test("lead trend assigns created, contacted and closed events to their actual days", () => {
  const report = buildLeadReportData([
    makeLead({
      id: "multi-day-lead",
      status: "completed",
      created_at: "2026-07-14T12:00:00.000Z",
      first_contacted_at: "2026-07-15T12:00:00.000Z",
      last_contact_at: "2026-07-15T12:00:00.000Z",
      result_recorded_at: "2026-07-16T07:00:00.000Z",
      closed_at: "2026-07-16T07:00:00.000Z",
      updated_at: "2026-07-16T07:00:00.000Z",
      result_type: "converted",
    }),
  ], PROFILE, NOW);
  const createdDay = report.responseTrend.at(-3);
  const contactedDay = report.responseTrend.at(-2);
  const closedDay = report.responseTrend.at(-1);

  assert.equal(createdDay?.created, 1);
  assert.equal(createdDay?.contacted, 0);
  assert.equal(contactedDay?.contacted, 1);
  assert.equal(contactedDay?.completed, 0);
  assert.equal(closedDay?.completed, 1);
});
