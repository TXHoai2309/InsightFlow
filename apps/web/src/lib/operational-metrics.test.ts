import test from "node:test";
import assert from "node:assert/strict";
import type { UserRoleProfile } from "./rbac";
import type { AlertData } from "@/stores/alert.store";
import type { Lead } from "@/types/dashboard";
import {
  buildAlertOperationalMetrics,
  buildLeadOperationalMetrics,
  filterNegativeOperationalAlerts,
  filterOperationalAlerts,
  filterOperationalLeads,
  getAlertCanonicalSeverity,
  isAlertWithinTimeScope,
  isHighPriorityAlert,
  isAlertInReviewWindow,
  normalizeAlertSeverity,
} from "./operational-metrics";

const manager: UserRoleProfile = {
  uid: "manager-1",
  email: "manager@highlandscoffee.com",
  displayName: "Brand Manager",
  role: "brand_manager",
  companyDomain: "highlandscoffee.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["view_dashboard", "view_leads", "view_crisis_queue"],
  defaultRoute: "/dashboard",
};

function lead(overrides: Partial<Lead>): Lead {
  return {
    id: "lead-default",
    workspace_id: "highlands-coffee",
    platform: "facebook",
    content: "Need information",
    intent: "hot",
    labels: { relevance: true, sentiment: "neutral", urgency: "low", intent: "hot", topic: [] },
    intent_signals: [],
    status: "new",
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function alert(overrides: Partial<AlertData>): AlertData {
  return {
    id: "alert-default",
    brand: "Highlands Coffee",
    source: "facebook",
    text: "Complaint",
    sentiment: "negative",
    topic: "service",
    severity: "high",
    negativity_score: 80,
    created_at: "2026-07-01T00:00:00.000Z",
    status: "new",
    ...overrides,
  };
}

test("lead operational total uses the same all-time brand scope as the customer workbench", () => {
  const leads = [
    lead({ id: "highlands-new" }),
    lead({ id: "highlands-closed", status: "completed", owner_id: "employee" }),
    lead({ id: "other-brand", workspace_id: "starbucks" }),
    lead({ id: "not-intent", intent: "none", labels: { relevance: false, sentiment: "neutral", urgency: "low", intent: "none", topic: [] } }),
  ];
  const scoped = filterOperationalLeads(leads, { profile: manager });
  const metrics = buildLeadOperationalMetrics(scoped, manager, new Date("2026-07-21T00:00:00.000Z").getTime());

  assert.equal(metrics.total, 2);
  assert.equal(metrics.unassigned, 1);
  assert.equal(metrics.closed, 1);
});

test("alert review window uses completion time for terminal alerts", () => {
  const now = new Date("2026-07-21T00:00:00.000Z").getTime();
  const recentlyResolved = alert({
    id: "old-but-recently-resolved",
    created_at: "2026-01-01T00:00:00.000Z",
    status: "resolved",
    resolved_at: "2026-07-20T00:00:00.000Z",
  });

  assert.equal(isAlertInReviewWindow(recentlyResolved, now), true);
});

test("alert operational scope deduplicates records and exposes queue-compatible totals", () => {
  const now = new Date("2026-07-21T00:00:00.000Z").getTime();
  const alerts = [
    alert({ id: "short", source_id: "same", text: "short" }),
    alert({ id: "complete", source_id: "same", post_url: "https://example.com/post" }),
    alert({ id: "resolved", status: "resolved", resolved_at: "2026-07-20T00:00:00.000Z" }),
    alert({ id: "other-brand", brand: "Starbucks" }),
  ];
  const scoped = filterOperationalAlerts(alerts, { profile: manager, nowMs: now });
  const metrics = buildAlertOperationalMetrics(scoped);

  assert.equal(metrics.total, 2);
  assert.equal(metrics.active, 1);
  assert.equal(metrics.resolved, 1);
  assert.equal(metrics.highActive, 1);
});

test("urgent is normalized as critical and counted in the shared high-priority metric", () => {
  const alerts = [
    alert({ id: "critical", severity: "critical" }),
    alert({ id: "urgent", severity: "urgent" }),
    alert({ id: "high", severity: "high" }),
    alert({ id: "medium", severity: "medium" }),
    alert({ id: "resolved-urgent", severity: "urgent", status: "resolved" }),
  ];

  assert.equal(normalizeAlertSeverity("urgent"), "critical");
  assert.equal(isHighPriorityAlert(alerts[1]), true);
  assert.equal(
    getAlertCanonicalSeverity(
      alert({ severity: "low", urgency: "urgent" }),
    ),
    "critical",
  );
  assert.equal(buildAlertOperationalMetrics(alerts).highActive, 3);
});

test("shared alert time scope uses exact calendar and custom ranges", () => {
  const item = alert({ created_at: "2026-06-15T08:00:00.000Z" });
  const nowMs = new Date("2026-07-23T12:00:00.000Z").getTime();

  assert.equal(
    isAlertWithinTimeScope(item, { timeRange: "30d", nowMs }),
    false,
  );
  assert.equal(
    isAlertWithinTimeScope(item, {
      timeRange: "custom",
      customStartDate: "2026-06-01",
      customEndDate: "2026-06-30",
      nowMs,
    }),
    true,
  );
});

test("alert operational scope collapses a native Threads object stored as post and comment", () => {
  const now = new Date("2026-07-21T00:00:00.000Z").getTime();
  const alerts = [
    alert({
      id: "threads-post",
      source: "thread",
      source_id: "DbAO5PHEuKA",
      post_id: "DbAO5PHEuKA",
      content_type: "post",
      author: "@c.hing_t",
      text: "Same negative source content",
      created_at: "2026-07-20T05:52:29.000Z",
    }),
    alert({
      id: "threads-comment",
      source: "threads",
      source_id: "DbAO5PHEuKA",
      post_id: "DbANO37koaT",
      comment_id: "DbAO5PHEuKA",
      content_type: "comment",
      author: "@c.hing_t",
      text: "Same negative source content",
      created_at: "2026-07-20T05:52:29.000Z",
    }),
  ];

  const scoped = filterOperationalAlerts(alerts, { profile: manager, nowMs: now });

  assert.equal(scoped.length, 1);
  assert.equal(buildAlertOperationalMetrics(scoped).active, 1);
});

test("keeps every negative mention in Alerts but only threshold-qualified items in Crisis", () => {
  const now = new Date("2026-07-21T00:00:00.000Z").getTime();
  const alerts = [
    alert({ id: "negative-low", sentiment: "negative", relevance: true, urgency: "low", intent: "none", severity: "low" }),
    alert({ id: "negative-medium", sentiment: "negative", relevance: true, urgency: "medium", intent: "none", severity: "medium" }),
    alert({ id: "neutral-urgent", sentiment: "neutral", relevance: true, urgency: "urgent", intent: "none", severity: "critical" }),
  ];

  const alertQueue = filterOperationalAlerts(alerts, { profile: manager, nowMs: now });
  const crisisQueue = filterOperationalAlerts(alerts, {
    profile: manager,
    nowMs: now,
    crisisOnly: true,
    dateBasis: "created_at",
  });

  assert.deepEqual(alertQueue.map((item) => item.id), ["negative-low", "negative-medium", "neutral-urgent"]);
  assert.deepEqual(crisisQueue.map((item) => item.id), ["negative-medium", "neutral-urgent"]);
});

test("report and alert page share the same negative, brand-scoped, deduplicated queue", () => {
  const now = new Date("2026-07-21T00:00:00.000Z").getTime();
  const alerts = [
    alert({ id: "negative-short", source_id: "same-negative", text: "short" }),
    alert({ id: "negative-complete", source_id: "same-negative", being_resolved_by: "agent@highlandscoffee.com" }),
    alert({ id: "neutral", sentiment: "neutral" }),
    alert({ id: "other-brand", brand: "Starbucks" }),
  ];

  const scoped = filterNegativeOperationalAlerts(alerts, {
    profile: manager,
    nowMs: now,
    reviewWindowDays: 36_500,
    dateBasis: "created_at",
  });

  assert.deepEqual(scoped.map((item) => item.id), ["negative-complete"]);
});
test("Crisis calendar window is anchored to publication time, not a recent closing action", () => {
  const now = new Date("2026-07-21T00:00:00.000Z").getTime();
  const oldResolved = alert({
    id: "old-resolved",
    relevance: true,
    urgency: "high",
    intent: "none",
    created_at: "2026-01-01T00:00:00.000Z",
    status: "resolved",
    resolved_at: "2026-07-20T00:00:00.000Z",
  });

  assert.equal(filterOperationalAlerts([oldResolved], { profile: manager, nowMs: now }).length, 1);
  assert.equal(filterOperationalAlerts([oldResolved], {
    profile: manager,
    nowMs: now,
    crisisOnly: true,
    dateBasis: "created_at",
  }).length, 0);
});
