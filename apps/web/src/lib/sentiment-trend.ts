import type {
  DashboardFilters,
  Mention,
  SentimentTrendPoint,
} from "@/types/dashboard";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_TREND_POINTS = 90;

type TrendMention = Pick<Mention, "posted_at" | "sentiment">;

function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addMention(
  point: SentimentTrendPoint,
  sentiment: TrendMention["sentiment"],
) {
  if (sentiment === "positive") point.positive += 1;
  else if (sentiment === "negative") point.negative += 1;
  else point.neutral += 1;
}

function formatDay(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function buildDayBuckets(
  mentions: Array<{ mention: TrendMention; timestamp: number }>,
  startMs: number,
  endMs: number,
  bucketDays: number,
) {
  const bucketMs = bucketDays * DAY_MS;
  const pointCount = Math.max(1, Math.ceil((endMs - startMs) / bucketMs));
  const points: SentimentTrendPoint[] = Array.from(
    { length: pointCount },
    (_, index) => {
      const bucketStart = startMs + index * bucketMs;
      const bucketEnd = Math.min(endMs, bucketStart + bucketMs);
      return {
        date:
          bucketDays === 1
            ? formatDay(bucketStart)
            : `${formatDay(bucketStart)}–${formatDay(bucketEnd - 1)}`,
        positive: 0,
        negative: 0,
        neutral: 0,
      };
    },
  );

  mentions.forEach(({ mention, timestamp }) => {
    if (timestamp < startMs || timestamp >= endMs) return;
    const index = Math.floor((timestamp - startMs) / bucketMs);
    if (index >= 0 && index < points.length) {
      addMention(points[index], mention.sentiment);
    }
  });

  return points;
}

/**
 * Build a bounded chart series without discarding records from the selected
 * period. Long ranges use wider day buckets so the chart remains responsive
 * while the sum of every bucket still equals the overview sentiment totals.
 */
export function buildSentimentTrend(
  mentions: TrendMention[],
  timeRange: DashboardFilters["time_range"],
  nowMs = Date.now(),
): SentimentTrendPoint[] {
  const validMentions = mentions
    .map((mention) => ({
      mention,
      timestamp: new Date(mention.posted_at).getTime(),
    }))
    .filter(({ timestamp }) => Number.isFinite(timestamp));

  if (timeRange === "24h") {
    const endMs = nowMs;
    const startMs = endMs - 24 * HOUR_MS;
    const points: SentimentTrendPoint[] = Array.from(
      { length: 24 },
      (_, index) => {
        const bucketEnd = startMs + (index + 1) * HOUR_MS;
        const date = new Date(bucketEnd);
        return {
          date: `${String(date.getHours()).padStart(2, "0")}:00`,
          positive: 0,
          negative: 0,
          neutral: 0,
        };
      },
    );

    validMentions.forEach(({ mention, timestamp }) => {
      if (timestamp < startMs || timestamp > endMs) return;
      const index = Math.min(
        points.length - 1,
        Math.floor((timestamp - startMs) / HOUR_MS),
      );
      if (index >= 0) addMention(points[index], mention.sentiment);
    });

    return points;
  }

  const fixedDays: Partial<
    Record<DashboardFilters["time_range"], number>
  > = {
    "2d": 2,
    "3d": 3,
    "5d": 5,
    "7d": 7,
    "30d": 30,
  };
  const dayCount = fixedDays[timeRange];

  if (dayCount) {
    const todayStart = startOfLocalDay(nowMs);
    const startMs = todayStart - (dayCount - 1) * DAY_MS;
    return buildDayBuckets(
      validMentions,
      startMs,
      todayStart + DAY_MS,
      1,
    );
  }

  if (validMentions.length === 0) return [];

  const timestamps = validMentions.map(({ timestamp }) => timestamp);
  const startMs = startOfLocalDay(Math.min(...timestamps));
  const endMs = startOfLocalDay(Math.max(...timestamps)) + DAY_MS;
  const spanDays = Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));
  const bucketDays = Math.max(1, Math.ceil(spanDays / MAX_TREND_POINTS));

  return buildDayBuckets(validMentions, startMs, endMs, bucketDays);
}

