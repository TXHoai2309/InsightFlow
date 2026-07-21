import test from "node:test";
import assert from "node:assert/strict";
import {
  inferQueueFromLabels,
  isCrisisClassificationLabel,
} from "./label-change.ts";

test("routes a negative high complaint to crisis even when intent is hot", () => {
  const label = {
    sentiment: "negative",
    topic: ["service", "quality"],
    relevance: true,
    urgency: "high",
    intent: "hot",
  };

  assert.equal(inferQueueFromLabels(label), "crisis");
  assert.equal(isCrisisClassificationLabel(label), true);
});

test("does not turn every negative mention into a crisis alert", () => {
  assert.equal(
    isCrisisClassificationLabel({
      sentiment: "negative",
      relevance: true,
      urgency: "low",
      intent: "hot",
    }),
    false,
  );
});

test("keeps urgent non-negative labels in the crisis queue", () => {
  assert.equal(
    isCrisisClassificationLabel({
      sentiment: "neutral",
      relevance: true,
      urgency: "urgent",
      intent: "none",
    }),
    true,
  );
});

test("excludes irrelevant labels before crisis routing", () => {
  assert.equal(
    isCrisisClassificationLabel({
      sentiment: "negative",
      relevance: false,
      urgency: "high",
      intent: "none",
    }),
    false,
  );
});

test("does not alert when brand relevance is missing", () => {
  assert.equal(
    isCrisisClassificationLabel({
      sentiment: "negative",
      relevance: null,
      urgency: "high",
      intent: "none",
    }),
    false,
  );
});
