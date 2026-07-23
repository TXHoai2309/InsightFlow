import { NextRequest, NextResponse } from "next/server";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { appendCrawlRunEvent, createCrawlRun } from "@/lib/server/crawlRuns";

const SUPPORTED_PLATFORMS = new Set([
  "facebook",
  "threads",
  "tiktok",
  "youtube",
  "google_maps",
  "befood",
  "news_html",
]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function platformList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => text(item, 40).toLowerCase())
    .filter((item) => SUPPORTED_PLATFORMS.has(item)))];
}

export async function POST(request: NextRequest) {
  if (!hasCrawlRunIngestAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const platforms = platformList(body.platforms);
    const label = text(body.label, 160) || "Production crawl";
    const workerId = text(body.workerId, 120) || "production-worker";
    const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata as Record<string, unknown>
      : {};

    if (!platforms.length) {
      return NextResponse.json({ error: "At least one supported platform is required" }, { status: 400 });
    }

    const runId = await createCrawlRun({
      runType: "production",
      platforms,
      requestedBy: workerId,
      metadata: { ...metadata, label, workerId },
    });

    await appendCrawlRunEvent(runId, {
      eventType: "started",
      platform: platforms.length === 1 ? platforms[0] : undefined,
      phase: "starting",
      message: `Bắt đầu ${label}.`,
      progressCurrent: 0,
      progressTotal: platforms.length,
      metadata: { important: true, workerId },
      update: {
        status: "running",
        currentPlatform: platforms.length === 1 ? platforms[0] : undefined,
        currentPhase: "starting",
        startedAt: true,
        heartbeatAt: true,
      },
    });

    return NextResponse.json({ runId, status: "running" }, { status: 201 });
  } catch (error) {
    console.error("[Crawl runs API] production start error:", error);
    return NextResponse.json({ error: "Unable to start production crawl run" }, { status: 500 });
  }
}
