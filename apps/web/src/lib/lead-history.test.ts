import test from "node:test";
import assert from "node:assert/strict";
import type { Lead } from "@/types/dashboard";
import {
  buildLeadHistoryEvents,
  mapLeadActivityEvent,
} from "./lead-history";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    workspace_id: "highlands-coffee",
    platform: "facebook",
    author: "Khách hàng",
    content: "Nội dung khách hàng không được đưa vào nhật ký xử lý",
    intent: "hot",
    status: "new",
    created_at: "2026-07-01T08:00:00.000Z",
    ...overrides,
  } as Lead;
}

test("legacy Lead history contains operational milestones without customer content", () => {
  const lead = makeLead();
  const events = buildLeadHistoryEvents(lead);

  assert.equal(events.length, 1);
  assert.equal(events[0].actor, "system");
  assert.equal(events[0].title, "Lead được hệ thống ghi nhận");
  assert.equal(events[0].source, "derived");
  assert.equal(events.some((event) => event.description === lead.content), false);
});

test("maps status audit events with a readable before and after value", () => {
  const event = mapLeadActivityEvent({
    id: "event-1",
    eventType: "status_changed",
    actorType: "employee",
    actorName: "Nguyễn An",
    fromStatus: "new",
    toStatus: "processing",
    occurredAt: "2026-07-02T08:00:00.000Z",
    source: "live",
  });

  assert.equal(event.kind, "status");
  assert.equal(event.title, "Thay đổi trạng thái");
  assert.equal(event.description, "Mới phát hiện → Đang xử lý");
  assert.equal(event.source, "live");
});

test("keeps backfilled events explicitly marked as reconstructed data", () => {
  const event = mapLeadActivityEvent({
    id: "event-2",
    eventType: "assigned",
    actorType: "employee",
    actorName: "Nhân viên xử lý",
    occurredAt: "2026-07-02T08:00:00.000Z",
    source: "backfill",
    details: { toOwnerName: "Trần Bình" },
  });

  assert.equal(event.kind, "assigned");
  assert.equal(event.description, "Người phụ trách: Trần Bình");
  assert.equal(event.source, "backfill");
});

