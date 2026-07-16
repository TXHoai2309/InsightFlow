import assert from "node:assert/strict";
import test from "node:test";
import { verifyBearerToken } from "./auth";

test("verifyBearerToken uses an initialized Firebase Admin app", async () => {
  const originalConsoleError = console.error;
  let reportedCode: string | undefined;

  console.error = (...args: unknown[]) => {
    if (args[0] === "[Auth] verifyIdToken failed") {
      reportedCode = (args[1] as { code?: string } | undefined)?.code;
    }
  };

  try {
    assert.equal(await verifyBearerToken("Bearer invalid-token"), null);
  } finally {
    console.error = originalConsoleError;
  }

  assert.ok(reportedCode, "Firebase Admin should reject the invalid token");
  assert.notEqual(reportedCode, "app/no-app");
});
