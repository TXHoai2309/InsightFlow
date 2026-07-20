import test from "node:test";
import assert from "node:assert/strict";
import {
  getAnnotationPlatformFilter,
  getDiscussionPeriodDays,
  isLocationReviewPlatform,
  parseVietnameseRelativeDate,
} from "./dashboard-display.ts";

test("maps crawler platform aliases to the dashboard annotation filters", () => {
  assert.equal(getAnnotationPlatformFilter("thread"), "in.(thread,threads)");
  assert.equal(getAnnotationPlatformFilter("be"), "in.(be,befood)");
  assert.equal(
    getAnnotationPlatformFilter("news"),
    "in.(news,news_html,news_rss)",
  );
  assert.equal(getAnnotationPlatformFilter("facebook"), "eq.facebook");
});

test("identifies location containers that must not count as mentions", () => {
  assert.equal(isLocationReviewPlatform("befood"), true);
  assert.equal(isLocationReviewPlatform("google_maps"), true);
  assert.equal(isLocationReviewPlatform("threads"), false);
});

test("uses the selected dashboard period instead of a fixed seven days", () => {
  assert.equal(getDiscussionPeriodDays({ timeRange: "30d" }), 30);
  assert.equal(getDiscussionPeriodDays({ timeRange: "7d" }), 7);
  assert.equal(
    getDiscussionPeriodDays({
      timeRange: "custom",
      customStartDate: "2026-07-01",
      customEndDate: "2026-07-17",
    }),
    17,
  );
});

test("derives all-time period from the actual mention dates", () => {
  assert.equal(
    getDiscussionPeriodDays({
      timeRange: "all",
      mentionDates: [
        "2026-07-01T12:00:00+07:00",
        "2026-07-03T08:00:00+07:00",
      ],
    }),
    3,
  );
});

test("parses BeFood relative timestamps against the ingestion time", () => {
  assert.equal(
    parseVietnameseRelativeDate("5 giờ trước", "2026-07-16T07:17:55Z"),
    "2026-07-16T02:17:55.000Z",
  );
  assert.equal(
    parseVietnameseRelativeDate("một tháng trước", "2026-07-16T07:17:55Z"),
    "2026-06-16T07:17:55.000Z",
  );
  assert.equal(parseVietnameseRelativeDate("không rõ", "2026-07-16T07:17:55Z"), null);
});
