import test from "node:test";
import assert from "node:assert/strict";
import { withOptionalColumnFallback } from "../lead-schema-compat";

test("retries a Lead write once without updated_by_name on an older schema", async () => {
  const writes: Array<Record<string, unknown>> = [];

  await withOptionalColumnFallback({
    payload: {
      owner_id: "employee-1",
      updated_by: "employee-1",
      updated_by_name: "Nguyễn An",
    },
    column: "updated_by_name",
    knownUnsupported: new Set<string>(),
    writer: async (payload) => {
      writes.push({ ...payload });
      if (writes.length === 1) {
        throw { code: "PGRST204", missingColumn: "updated_by_name" };
      }
    },
  });

  assert.equal(writes.length, 2);
  assert.equal(writes[0].updated_by_name, "Nguyễn An");
  assert.equal("updated_by_name" in writes[1], false);
  assert.equal(writes[1].updated_by, "employee-1");
  assert.equal(writes[1].owner_id, "employee-1");
});
