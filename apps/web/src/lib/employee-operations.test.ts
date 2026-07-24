import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEmployeeOperationsData,
  filterEmployeeOperationsTasks,
  formatOperationsDueTime,
  type EmployeeOperationsTask,
} from "./employee-operations";
import type { UserRoleProfile } from "./rbac";
import type { AlertData } from "../stores/alert.store";
import type { Lead } from "../types/dashboard";

function task(
  id: string,
  createdAt: string,
  completedAt?: string,
): EmployeeOperationsTask {
  return {
    id,
    role: "lead_employee",
    status: completedAt ? "completed" : "processing",
    title: id,
    detail: "WARM · facebook",
    brand: "workspace",
    customer: "Khách hàng",
    source: "facebook",
    priority: "warm",
    createdAt,
    completedAt,
    isOverdue: false,
    href: `/leads?leadId=${id}`,
  };
}

test("filters the operations board by Vietnam calendar days and defaults can use today", () => {
  const nowMs = new Date("2026-07-23T12:00:00+07:00").getTime();
  const tasks = [
    task("today", "2026-07-23T00:30:00+07:00"),
    task("yesterday", "2026-07-22T23:30:00+07:00"),
    task("seven-days", "2026-07-17T08:00:00+07:00"),
    task("outside-seven-days", "2026-07-16T23:59:59+07:00"),
    task(
      "completed-today",
      "2026-07-20T08:00:00+07:00",
      "2026-07-23T09:00:00+07:00",
    ),
  ];

  assert.deepEqual(
    filterEmployeeOperationsTasks(tasks, "today", nowMs).map((item) => item.id),
    ["today", "completed-today"],
  );
  assert.deepEqual(
    filterEmployeeOperationsTasks(tasks, "yesterday", nowMs).map((item) => item.id),
    ["yesterday"],
  );
  assert.deepEqual(
    filterEmployeeOperationsTasks(tasks, "last7Days", nowMs).map((item) => item.id),
    ["today", "yesterday", "seven-days", "completed-today"],
  );
});

test("formats the actual elapsed overdue duration", () => {
  const nowMs = new Date("2026-07-23T12:00:00+07:00").getTime();

  assert.equal(
    formatOperationsDueTime("2026-07-22T09:45:00+07:00", nowMs),
    "Quá hạn 1 ngày 2 giờ",
  );
  assert.equal(
    formatOperationsDueTime("2026-07-23T11:42:00+07:00", nowMs),
    "Quá hạn 18 phút",
  );
  assert.equal(
    formatOperationsDueTime("2026-07-23T13:00:00+07:00", nowMs),
    "Còn 1 giờ",
  );
});

const crisisProfile: UserRoleProfile = {
  uid: "crisis-employee",
  email: "crisis@example.com",
  displayName: "Nhân viên khủng hoảng",
  role: "crisis_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["alerts"],
  defaultRoute: "/alerts",
};

function alert(id: string, status: string): AlertData {
  return {
    id,
    brand: "Highlands Coffee",
    source: "facebook",
    text: id,
    sentiment: "negative",
    topic: "service",
    severity: "high",
    negativity_score: 80,
    created_at: "2026-07-23T08:00:00+07:00",
    status,
    being_resolved_by: status === "resolving" ? crisisProfile.email : undefined,
    skipped_at: status === "skipped" ? "2026-07-23T09:00:00+07:00" : undefined,
    skipped_by_email: status === "skipped" ? crisisProfile.email : undefined,
  };
}

test("maps crisis workflow states without leaking skipped alerts into urgent", () => {
  const data = buildEmployeeOperationsData({
    profile: crisisProfile,
    alerts: [
      alert("pending", "new"),
      alert("processing", "resolving"),
      alert("contact-again", "contact_failed"),
      alert("waiting", "contact_waiting"),
      alert("skipped", "skipped"),
    ],
    nowMs: new Date("2026-07-23T09:30:00+07:00").getTime(),
  });

  assert.deepEqual(
    Object.fromEntries(data.tasks.map(({ id, status }) => [id, status])),
    {
      pending: "urgent",
      processing: "processing",
      "contact-again": "processing",
      waiting: "waiting",
    },
  );
});

const leadProfile: UserRoleProfile = {
  uid: "lead-employee",
  email: "lead@example.com",
  displayName: "Nhân viên tiềm năng",
  role: "lead_employee",
  companyDomain: "example.com",
  brandId: "highlands-coffee",
  brandName: "Highlands Coffee",
  permissions: ["leads"],
  defaultRoute: "/leads",
};

function lead(id: string, overrides: Partial<Lead> = {}): Lead {
  return {
    id,
    workspace_id: "highlands-coffee",
    platform: "facebook",
    content: id,
    intent: "warm",
    labels: {
      relevance: true,
      intent: "warm",
      sentiment: "positive",
      urgency: "low",
      topic: ["other"],
    },
    intent_signals: [],
    status: "new",
    created_at: "2026-07-23T08:00:00+07:00",
    owner_id: leadProfile.uid,
    owner_email: leadProfile.email,
    ...overrides,
  };
}

test("maps potential-customer workflow states and excludes skipped leads", () => {
  const data = buildEmployeeOperationsData({
    profile: leadProfile,
    leads: [
      lead("new"),
      lead("processing", { status: "processing" }),
      lead("follow-up", {
        status: "processing",
        result_type: "follow_up",
        follow_up_at: "2026-07-23T11:00:00+07:00",
      }),
      lead("waiting", {
        status: "processing",
        result_type: "no_response",
      }),
      lead("skipped", { status: "skipped" }),
      lead("completed", {
        status: "completed",
        closed_at: "2026-07-23T09:00:00+07:00",
      }),
    ],
    nowMs: new Date("2026-07-23T09:30:00+07:00").getTime(),
  });

  assert.deepEqual(
    Object.fromEntries(data.tasks.map(({ id, status }) => [id, status])),
    {
      new: "urgent",
      processing: "processing",
      "follow-up": "processing",
      waiting: "waiting",
      completed: "completed",
    },
  );
});

test("filters potential-customer operations by each workflow business timestamp", () => {
  const nowMs = new Date("2026-07-23T12:00:00+07:00").getTime();
  const data = buildEmployeeOperationsData({
    profile: leadProfile,
    leads: [
      lead("new-today", {
        created_at: "2026-07-23T08:00:00+07:00",
        posted_at: "2026-07-23T07:55:00+07:00",
      }),
      lead("new-yesterday", {
        created_at: "2026-07-23T08:00:00+07:00",
        posted_at: "2026-07-22T20:00:00+07:00",
      }),
      lead("processing-today", {
        intent: "cold",
        labels: {
          relevance: true,
          intent: "cold",
          sentiment: "positive",
          urgency: "low",
          topic: ["other"],
        },
        status: "processing",
        created_at: "2026-07-20T08:00:00+07:00",
        last_action_at: "2026-07-23T09:00:00+07:00",
      }),
      lead("follow-up-today", {
        status: "processing",
        created_at: "2026-07-18T08:00:00+07:00",
        result_type: "follow_up",
        follow_up_at: "2026-07-23T15:00:00+07:00",
      }),
      lead("follow-up-tomorrow", {
        status: "processing",
        created_at: "2026-07-18T08:00:00+07:00",
        result_type: "follow_up",
        follow_up_at: "2026-07-24T09:00:00+07:00",
      }),
      lead("waiting-today", {
        intent: "cold",
        labels: {
          relevance: true,
          intent: "cold",
          sentiment: "positive",
          urgency: "low",
          topic: ["other"],
        },
        status: "processing",
        created_at: "2026-07-19T08:00:00+07:00",
        result_type: "no_response",
        result_recorded_at: "2026-07-23T10:00:00+07:00",
      }),
      lead("overdue-thirty-days-updated-today", {
        status: "processing",
        created_at: "2026-06-15T08:00:00+07:00",
        last_action_at: "2026-07-23T10:30:00+07:00",
        updated_at: "2026-07-23T10:30:00+07:00",
      }),
      lead("completed-today-from-old-lead", {
        status: "completed",
        created_at: "2026-07-10T08:00:00+07:00",
        closed_at: "2026-07-23T11:00:00+07:00",
      }),
    ],
    nowMs,
  });

  assert.deepEqual(
    filterEmployeeOperationsTasks(data.tasks, "today", nowMs)
      .map((item) => item.id)
      .sort(),
    [
      "completed-today-from-old-lead",
      "follow-up-today",
      "new-today",
      "processing-today",
      "waiting-today",
    ],
  );
  assert.equal(
    filterEmployeeOperationsTasks(data.tasks, "last7Days", nowMs).some(
      (item) => item.id === "overdue-thirty-days-updated-today",
    ),
    false,
  );
});
