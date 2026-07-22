const DAY_MS = 24 * 60 * 60 * 1000;

const FIXED_PERIOD_DAYS: Record<string, number> = {
  "24h": 1,
  "2d": 2,
  "3d": 3,
  "5d": 5,
  "7d": 7,
  "30d": 30,
  single: 1,
};

const LOCATION_REVIEW_PLATFORMS = new Set([
  "be",
  "befood",
  "google_maps",
  "googlemap",
]);

export function isLocationReviewPlatform(platform: unknown): boolean {
  return LOCATION_REVIEW_PLATFORMS.has(String(platform || "").toLowerCase());
}

export function getAnnotationPlatformFilter(platform: string): string {
  if (platform === "be") return "in.(be,befood)";
  if (platform === "thread") return "in.(thread,threads)";
  if (platform === "news") return "in.(news,news_html,news_rss)";
  return `eq.${platform}`;
}

export function parseVietnameseRelativeDate(
  value: unknown,
  referenceValue: unknown,
): string | null {
  const match = String(value || "")
    .trim()
    .toLowerCase()
    .match(/^(một|\d+)\s*(phút|giờ|ngày|tuần|tháng|năm)\s*trước$/u);
  if (!match) return null;

  const reference = new Date(String(referenceValue || ""));
  if (!Number.isFinite(reference.getTime())) return null;

  const amount = match[1] === "một" ? 1 : Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  switch (match[2]) {
    case "phút":
      reference.setUTCMinutes(reference.getUTCMinutes() - amount);
      break;
    case "giờ":
      reference.setUTCHours(reference.getUTCHours() - amount);
      break;
    case "ngày":
      reference.setUTCDate(reference.getUTCDate() - amount);
      break;
    case "tuần":
      reference.setUTCDate(reference.getUTCDate() - amount * 7);
      break;
    case "tháng":
      reference.setUTCMonth(reference.getUTCMonth() - amount);
      break;
    case "năm":
      reference.setUTCFullYear(reference.getUTCFullYear() - amount);
      break;
  }

  return reference.toISOString();
}

function calendarDayStart(value: string | number | Date): number | null {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Start of an inclusive calendar-day window in the browser timezone. */
export function getCalendarPeriodStartMs(days: number, now = new Date()): number {
  const normalizedDays = Math.max(1, Math.floor(days));
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (normalizedDays - 1));
  return start.getTime();
}

export function isWithinCalendarPeriod(
  value: unknown,
  days: number,
  now = new Date(),
): boolean {
  const time = new Date(String(value || "")).getTime();
  return (
    Number.isFinite(time) &&
    time >= getCalendarPeriodStartMs(days, now) &&
    time <= now.getTime()
  );
}

function inclusiveCalendarDays(start: number, end: number): number {
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

export function getDiscussionPeriodDays(options: {
  timeRange: string;
  customStartDate?: string | null;
  customEndDate?: string | null;
  mentionDates?: Array<string | number | Date>;
}): number {
  const fixed = FIXED_PERIOD_DAYS[options.timeRange];
  if (fixed) return fixed;

  if (options.timeRange === "custom") {
    const start = options.customStartDate
      ? calendarDayStart(`${options.customStartDate}T00:00:00`)
      : null;
    const end = options.customEndDate
      ? calendarDayStart(`${options.customEndDate}T00:00:00`)
      : null;
    if (start !== null && end !== null) {
      return inclusiveCalendarDays(Math.min(start, end), Math.max(start, end));
    }
  }

  const timestamps = (options.mentionDates || [])
    .map(calendarDayStart)
    .filter((value): value is number => value !== null);
  if (timestamps.length < 2) return 1;
  return inclusiveCalendarDays(Math.min(...timestamps), Math.max(...timestamps));
}
