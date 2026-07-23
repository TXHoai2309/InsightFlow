import test from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultLeadDateFilterState,
  readLeadDateFilterSession,
  writeLeadDateFilterSession,
} from "./lead-filter-session";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

test("defaults a new login session to today", () => {
  const storage = createStorage();
  const identity = { userId: "employee-1", loginSessionId: "login-1" };

  assert.equal(readLeadDateFilterSession(storage, identity), null);
  assert.deepEqual(getDefaultLeadDateFilterState(), {
    updatedRange: "today",
    customStartDate: undefined,
    customEndDate: undefined,
  });
});

test("restores the selected date range during the same login session", () => {
  const storage = createStorage();
  const identity = { userId: "employee-1", loginSessionId: "login-1" };

  writeLeadDateFilterSession(storage, identity, {
    updatedRange: "custom",
    customStartDate: "2026-07-01",
    customEndDate: "2026-07-22",
  });

  assert.deepEqual(readLeadDateFilterSession(storage, identity), {
    updatedRange: "custom",
    customStartDate: "2026-07-01",
    customEndDate: "2026-07-22",
  });
});

test("does not reuse a date range after a new login", () => {
  const storage = createStorage();
  writeLeadDateFilterSession(
    storage,
    { userId: "employee-1", loginSessionId: "login-1" },
    { updatedRange: "30d" },
  );

  assert.equal(
    readLeadDateFilterSession(storage, {
      userId: "employee-1",
      loginSessionId: "login-2",
    }),
    null,
  );
});
