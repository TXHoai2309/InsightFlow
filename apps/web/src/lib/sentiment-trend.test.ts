import test from "node:test";
import assert from "node:assert/strict";
import { buildSentimentTrend } from "./sentiment-trend";

function totals(points: ReturnType<typeof buildSentimentTrend>) {
  return points.reduce(
    (result, point) => ({
      positive: result.positive + point.positive,
      negative: result.negative + point.negative,
      neutral: result.neutral + point.neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 },
  );
}

test("all-time trend keeps records older than 90 days while bounding chart points", () => {
  const mentions = [
    { posted_at: "2021-01-01T08:00:00.000Z", sentiment: "negative" as const },
    { posted_at: "2025-12-01T08:00:00.000Z", sentiment: "negative" as const },
    { posted_at: "2026-07-23T08:00:00.000Z", sentiment: "positive" as const },
  ];

  const points = buildSentimentTrend(
    mentions,
    "all",
    new Date("2026-07-23T12:00:00.000Z").getTime(),
  );

  assert.ok(points.length <= 90);
  assert.deepEqual(totals(points), {
    positive: 1,
    negative: 2,
    neutral: 0,
  });
});

test("neutral sentiment is preserved in the aggregated trend", () => {
  const points = buildSentimentTrend(
    [
      {
        posted_at: "2026-07-23T08:00:00.000Z",
        sentiment: "neutral",
      },
    ],
    "all",
  );

  assert.deepEqual(totals(points), {
    positive: 0,
    negative: 0,
    neutral: 1,
  });
});
