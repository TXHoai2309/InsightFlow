import { NextRequest, NextResponse } from "next/server";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { appendCrawlRunEvent, getCrawlRun, updateCrawlRun } from "@/lib/server/crawlRuns";

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

const EVENT_TYPES = new Set(["started", "progress", "heartbeat", "completed", "failed", "cancelled"]);
const IMPORTANT_MESSAGE = /(?:\bpass\b|\bcomplete(?:d)?\b|\bfinish(?:ed)?\b|\bfail(?:ed)?\b|\berror\b|\bwarn(?:ing)?\b|\[quality\]|\[summary\]|\[sync\]|\[local label\]|\[pipeline\])/i;

export async function POST(
  request: NextRequest,
  context: { params: { runId: string } },
) {
  if (!hasCrawlRunIngestAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = text(context.params.runId, 120);
  if (!runId) return NextResponse.json({ error: "Crawl run not found" }, { status: 404 });

  try {
    const body = await request.json();
    const message = text(body.message, 1000);
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
    const eventType = text(body.eventType, 30);
    if (!EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "eventType is invalid" }, { status: 400 });
    }

    // Heartbeats only renew the run. They are deliberately not persisted as
    // event rows because a long crawl can otherwise create thousands of
    // low-value log records.
    if (eventType === "heartbeat") {
      await updateCrawlRun(runId, {
        heartbeatAt: true,
        progressCurrent: Number.isFinite(body.progressCurrent) ? body.progressCurrent : undefined,
        progressTotal: Number.isFinite(body.progressTotal) ? body.progressTotal : undefined,
      });
      return NextResponse.json({ heartbeat: true });
    }

    const run = await getCrawlRun(runId);
    if (!run) {
      return NextResponse.json({ error: "Crawl run not found" }, { status: 404 });
    }

    const progressCurrent = Number.isFinite(body.progressCurrent) ? body.progressCurrent : undefined;
    const progressTotal = Number.isFinite(body.progressTotal) ? body.progressTotal : undefined;
    const level = text(body.level, 20) || "info";
    const platform = text(body.platform, 40) || undefined;
    const phase = text(body.phase, 40) || undefined;
    const significant = eventType !== "progress"
      || level === "warn"
      || level === "error"
      || Boolean(body.metadata?.important)
      || (progressCurrent !== undefined && progressCurrent !== run.progressCurrent)
      || (progressTotal !== undefined && progressTotal !== run.progressTotal)
      || (platform !== undefined && platform !== run.currentPlatform)
      || (phase !== undefined && phase !== run.currentPhase)
      || IMPORTANT_MESSAGE.test(message);

    if (!significant) {
      await updateCrawlRun(runId, {
        ...(body.update && typeof body.update === "object" ? body.update : {}),
        heartbeatAt: true,
        progressCurrent,
        progressTotal,
      });
      return NextResponse.json({ persisted: false });
    }

    const eventId = await appendCrawlRunEvent(runId, {
      level: level as "info" | "warn" | "error",
      platform,
      phase,
      eventType: eventType as "started" | "progress" | "heartbeat" | "completed" | "failed" | "cancelled",
      message,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : undefined,
      progressCurrent,
      progressTotal,
      update: body.update && typeof body.update === "object" ? body.update : undefined,
    });

    return NextResponse.json({ eventId }, { status: 201 });
  } catch (error) {
    console.error("[Crawl runs API] event error:", error);
    return NextResponse.json({ error: "Unable to append crawl event" }, { status: 500 });
  }
}
