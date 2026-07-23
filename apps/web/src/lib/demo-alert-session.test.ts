import test from "node:test";
import assert from "node:assert/strict";
import {
  clearDemoAlertWorkflowSession,
  hydrateDemoAlertWorkflows,
  persistDemoAlertWorkflow,
  type DemoSessionStorage,
} from "./demo-alert-session";
import type { AlertData } from "../stores/alert.store";

class MemorySessionStorage implements DemoSessionStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

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

test("persists and hydrates Demo workflow within the provided session", () => {
  const storage = new MemorySessionStorage();
  const updated = alert({
    status: "resolving",
    being_resolved_by: "demo@example.com",
    being_resolved_at: "2026-07-23T09:00:00.000Z",
    resolution_history: [
      {
        attempt_number: 1,
        timestamp: "2026-07-23T09:00:00.000Z",
        note: "Đã nhận xử lý",
        resolved_by_email: "demo@example.com",
        resolved_by_name: "Khách xem Demo",
        action_type: "claim",
      },
    ],
  });

  persistDemoAlertWorkflow(updated, storage);
  const [hydrated] = hydrateDemoAlertWorkflows([alert()], storage);

  assert.equal(hydrated.status, "resolving");
  assert.equal(hydrated.being_resolved_by, "demo@example.com");
  assert.equal(hydrated.resolution_history?.[0]?.action_type, "claim");
});

test("keeps cleared workflow fields cleared after Demo refresh", () => {
  const storage = new MemorySessionStorage();
  const restored = alert({
    status: "resolving",
    resolved_at: undefined,
    resolved_by_name: null,
    being_resolved_by: "demo@example.com",
  });

  persistDemoAlertWorkflow(restored, storage);
  const [hydrated] = hydrateDemoAlertWorkflows(
    [
      alert({
        status: "resolved",
        resolved_at: "2026-07-23T10:00:00.000Z",
        resolved_by_name: "Demo cũ",
      }),
    ],
    storage,
  );

  assert.equal(hydrated.status, "resolving");
  assert.equal(hydrated.resolved_at, null);
  assert.equal(hydrated.resolved_by_name, null);
});

test("never stores or overlays a non-Demo alert", () => {
  const storage = new MemorySessionStorage();
  const realAlert = alert({
    id: "production-alert-001",
    source_id: "production-alert-001",
    status: "resolved",
  });

  persistDemoAlertWorkflow(realAlert, storage);
  const [hydrated] = hydrateDemoAlertWorkflows(
    [{ ...realAlert, status: "new" }],
    storage,
  );

  assert.equal(hydrated.status, "new");
});

test("restores original Demo workflow after the session is cleared", () => {
  const storage = new MemorySessionStorage();
  persistDemoAlertWorkflow(
    alert({
      status: "resolved",
      resolved_at: "2026-07-23T10:00:00.000Z",
      resolved_by_name: "Khách xem Demo",
    }),
    storage,
  );

  clearDemoAlertWorkflowSession(storage);
  const [hydrated] = hydrateDemoAlertWorkflows([alert()], storage);

  assert.equal(hydrated.status, "new");
  assert.equal(hydrated.resolved_at, undefined);
  assert.equal(hydrated.resolved_by_name, undefined);
});
