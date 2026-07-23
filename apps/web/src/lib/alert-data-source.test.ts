import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the operational alert store does not load Lead workflow data", () => {
  const storeSource = readFileSync(
    new URL("../stores/alert.store.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    storeSource,
    /DashboardService\.fetchAlertMentions\(/,
    "Alert Store must use the isolated mention snapshot",
  );
  assert.doesNotMatch(
    storeSource,
    /DashboardService\.fetchRawData\(/,
    "Alert Store must not wait for the combined Lead workflow loader",
  );
});

test("the dedicated alert reader only delegates to the mention snapshot", () => {
  const serviceSource = readFileSync(
    new URL("./services/dashboard.ts", import.meta.url),
    "utf8",
  );
  const methodStart = serviceSource.indexOf("static async fetchAlertMentions");
  const nextMethod = serviceSource.indexOf("static async fetchRawData", methodStart);

  assert.notEqual(methodStart, -1);
  assert.notEqual(nextMethod, -1);

  const methodSource = serviceSource.slice(methodStart, nextMethod);
  assert.match(methodSource, /fetchSupabaseMentions\(opts\)/);
  assert.doesNotMatch(methodSource, /fetchSupabaseLeadWorkflowRows/);
});
