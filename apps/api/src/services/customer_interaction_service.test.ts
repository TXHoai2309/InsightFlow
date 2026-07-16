import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeBrand,
  normalizePlatform,
  normalizeProfileUrl,
  resolvePlatformIdentity,
} from "./customer_interaction_service";

test("normalizes current platform and brand aliases", () => {
  assert.equal(normalizePlatform("threads"), "thread");
  assert.equal(normalizePlatform("befood"), "be");
  assert.equal(normalizeBrand("Highlands Coffee"), "highlandcoffee");
  assert.equal(normalizeBrand("highlands-coffee"), "highlandcoffee");
});

test("prefers a platform author id over a profile URL", () => {
  const identity = resolvePlatformIdentity({
    platform: "youtube",
    contact: "https://www.youtube.com/@customer",
    payload_json: { author_id: "channel-123" },
  });
  assert.equal(identity?.method, "author_id");
  assert.equal(identity?.value, "channel-123");
  assert.equal(identity?.confidence, "high");
});

test("uses a validated same-platform profile URL when author id is absent", () => {
  const identity = resolvePlatformIdentity({
    platform: "tiktok",
    contact: "https://www.tiktok.com/@customer/?tracking=1",
    payload_json: {},
  });
  assert.equal(identity?.method, "profile_url");
  assert.equal(identity?.value, "https://tiktok.com/@customer");
  assert.equal(identity?.confidence, "medium");
});

test("preserves a Facebook profile id and rejects content URLs", () => {
  assert.equal(
    normalizeProfileUrl("https://www.facebook.com/profile.php?id=123&utm_source=test", "facebook"),
    "https://facebook.com/profile.php?id=123",
  );
  assert.equal(
    normalizeProfileUrl("https://www.facebook.com/posts/123", "facebook"),
    null,
  );
});

test("does not build identity from a display name or another platform URL", () => {
  assert.equal(resolvePlatformIdentity({ platform: "facebook", username: "Nguyen Van A" }), null);
  assert.equal(
    resolvePlatformIdentity({ platform: "facebook", contact: "https://tiktok.com/@customer" }),
    null,
  );
});
