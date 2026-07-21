import { NextRequest, NextResponse } from "next/server";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { appendCrawlRunEvent, getCrawlRun } from "@/lib/server/crawlRuns";

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

const EVENT_TYPES = new Set(["started", "progress", "heartbeat", "completed", "failed", "cancelled"]);

export async function POST(
  request: NextRequest,
  context: { params: { runId: string } },
) {
  if (!hasCrawlRunIngestAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = text(context.params.runId, 120);
  if (!runId || !(await getCrawlRun(runId))) {
    return NextResponse.json({ error: "Crawl run not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const message = text(body.message, 1000);
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
    const eventType = text(body.eventType, 30);
    if (!EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "eventType is invalid" }, { status: 400 });
    }

    const eventId = await appendCrawlRunEvent(runId, {
      level: body.level,
      platform: text(body.platform, 40) || undefined,
      phase: text(body.phase, 40) || undefined,
      eventType: eventType as "started" | "progress" | "heartbeat" | "completed" | "failed" | "cancelled",
      message,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : undefined,
      progressCurrent: Number.isFinite(body.progressCurrent) ? body.progressCurrent : undefined,
      progressTotal: Number.isFinite(body.progressTotal) ? body.progressTotal : undefined,
      update: body.update && typeof body.update === "object" ? body.update : undefined,
    });

    return NextResponse.json({ eventId }, { status: 201 });
  } catch (error) {
    console.error("[Crawl runs API] event error:", error);
    return NextResponse.json({ error: "Unable to append crawl event" }, { status: 500 });
  }
}
