import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCompactCrisisDuration,
  getCrisisAssigneeDisplayName,
  getCrisisSlaInfo,
} from "./crisis-table-display";
import type { AlertData } from "../stores/alert.store";

function alert(overrides: Partial<AlertData> = {}): AlertData {
  return {
    id: "demo-mention-001",
    source_id: "demo-mention-001",
    brand: "Demo Brand",
    source: "facebook",
    text: "Demo alert",
    sentiment: "negative",
    topic: "service",
    severity: "high",
    negativity_score: 80,
    created_at: "2026-07-23T08:00:00.000Z",
    status: "new",
    ...overrides,
  };
}

test("formats crisis durations with compact minute, hour, day and month units", () => {
  assert.equal(formatCompactCrisisDuration(45), "45 phút");
  assert.equal(formatCompactCrisisDuration(7 * 60 + 20), "7 giờ 20 phút");
  assert.equal(formatCompactCrisisDuration(19 * 24 * 60 + 22 * 60), "19 ngày 22 giờ");
  assert.equal(formatCompactCrisisDuration(35 * 24 * 60), "1 tháng 5 ngày");
});

test("formats overdue SLA using the next suitable unit", () => {
  const now = Date.parse("2026-07-23T12:00:00.000Z");
  const elapsedMinutes = 2 * 60 + 35 * 24 * 60;
  const createdAt = new Date(now - elapsedMinutes * 60_000).toISOString();
  const result = getCrisisSlaInfo(
    alert({ severity: "high", created_at: createdAt, detected_at: createdAt }),
    now,
  );

  assert.equal(result.isOverdue, true);
  assert.equal(result.label, "Quá 1 tháng 5 ngày");
});

test("shows an exact SLA boundary as due instead of overdue", () => {
  const now = Date.parse("2026-07-23T12:00:00.000Z");
  const createdAt = new Date(now - 2 * 60 * 60_000).toISOString();
  const result = getCrisisSlaInfo(
    alert({ severity: "high", created_at: createdAt, detected_at: createdAt }),
    now,
  );

  assert.equal(result.isOverdue, false);
  assert.equal(result.label, "Đến hạn");
});

test("shows a terminal alert without an overdue duration", () => {
  const result = getCrisisSlaInfo(
    alert({
      status: "resolved",
      resolved_at: "2026-07-23T10:00:00.000Z",
    }),
  );

  assert.equal(result.isOverdue, false);
  assert.equal(result.label, "Đã kết thúc");
});

test("resolves an assignee email to the staff full name", () => {
  const name = getCrisisAssigneeDisplayName(
    alert({ being_resolved_by: "linh.demo@insightflow.vn" }),
    [
      {
        uid: "demo-dual-01",
        email: "linh.demo@insightflow.vn",
        displayName: "Trần Khánh Linh",
      },
    ],
  );

  assert.equal(name, "Trần Khánh Linh");
});

test("shows the recorded full name after the active ownership lock is released", () => {
  const name = getCrisisAssigneeDisplayName(
    alert({
      status: "resolved",
      being_resolved_by: null,
      resolved_by_email: "demo@example.com",
      resolved_by_name: "Khách xem Demo",
    }),
    [],
  );

  assert.equal(name, "Khách xem Demo");
});

test("never exposes an unmatched assignee email as the primary label", () => {
  const name = getCrisisAssigneeDisplayName(
    alert({ being_resolved_by: "nguyen.van.a@example.com" }),
    [],
  );

  assert.equal(name, "Nguyen Van A");
});
