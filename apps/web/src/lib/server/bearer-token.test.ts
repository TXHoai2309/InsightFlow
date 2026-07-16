import assert from "node:assert/strict";
import test from "node:test";
import { extractBearerToken } from "./bearer-token";

test("extractBearerToken extracts a standard bearer token", () => {
  assert.equal(extractBearerToken("Bearer firebase-token"), "firebase-token");
});

test("extractBearerToken accepts case-insensitive scheme and extra whitespace", () => {
  assert.equal(extractBearerToken("bearer   firebase-token  "), "firebase-token");
});

test("extractBearerToken rejects missing or malformed authorization values", () => {
  assert.equal(extractBearerToken(null), null);
  assert.equal(extractBearerToken(""), null);
  assert.equal(extractBearerToken("firebase-token"), null);
  assert.equal(extractBearerToken("Basic firebase-token"), null);
  assert.equal(extractBearerToken("Bearer    "), null);
});
