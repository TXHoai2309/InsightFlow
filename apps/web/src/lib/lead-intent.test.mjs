import test from "node:test";
import assert from "node:assert/strict";
import {
  isIntentLead,
  isQualifiedLeadClassification,
} from "./lead-intent.ts";

test("routes the contradictory label from the Mixue screenshot to crisis, not leads", () => {
  const labels = {
    sentiment: "negative",
    topic: ["service", "quality"],
    relevance: true,
    urgency: "high",
    intent: "hot",
  };

  assert.equal(isQualifiedLeadClassification("hot", labels), false);
  assert.equal(isIntentLead({ intent: "hot", labels }), false);
});

test("excludes medium negative and urgent labels before considering intent", () => {
  assert.equal(
    isQualifiedLeadClassification("warm", {
      sentiment: "negative",
      urgency: "medium",
      relevance: true,
      intent: "warm",
    }),
    false,
  );
  assert.equal(
    isQualifiedLeadClassification("cold", {
      sentiment: "neutral",
      urgency: "urgent",
      relevance: true,
      intent: "cold",
    }),
    false,
  );
});

test("keeps valid lead classifications with explicit brand relevance", () => {
  assert.equal(
    isQualifiedLeadClassification("hot", {
      sentiment: "positive",
      urgency: "high",
      relevance: true,
      intent: "hot",
    }),
    true,
  );
  assert.equal(
    isQualifiedLeadClassification("hot", {
      sentiment: "negative",
      urgency: "low",
      relevance: true,
      intent: "hot",
    }),
    true,
  );
});

test("rejects lead-like rows without explicit brand relevance", () => {
  assert.equal(isIntentLead({ intent: "cold" }), false);
  assert.equal(
    isQualifiedLeadClassification("hot", {
      sentiment: "positive",
      urgency: "low",
      relevance: null,
      intent: "hot",
    }),
    false,
  );
});

test("honors explicit none and irrelevant labels over stale lead intent", () => {
  assert.equal(
    isQualifiedLeadClassification("hot", {
      relevance: true,
      intent: "none",
    }),
    false,
  );
  assert.equal(
    isQualifiedLeadClassification("hot", {
      relevance: false,
      intent: "hot",
    }),
    false,
  );
});
