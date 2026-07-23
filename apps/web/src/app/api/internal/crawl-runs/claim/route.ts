import { NextRequest, NextResponse } from "next/server";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import {
  appendCrawlRunEvent,
} from "@/lib/server/crawlRuns";
import {
  claimTrialCrawlRun,
  failStaleTrialCrawlRuns,
} from "@/lib/server/vpsOperationalStore";

const DEFAULT_LEASE_SECONDS = 15 * 60;
const STALE_HEARTBEAT_SECONDS = 15 * 60;

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function stringList(value: unknown, maxItems = 30) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => text(item, 80))
    .filter(Boolean)
    .slice(0, maxItems))];
}

export async function POST(request: NextRequest) {
  if (!hasCrawlRunIngestAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const workerId = text(body.workerId, 120);
    const capabilities = stringList(body.platforms);
    const requestedLease = Number(body.leaseSeconds);
    const leaseSeconds = Number.isFinite(requestedLease)
      ? Math.min(Math.max(Math.round(requestedLease), 60), 60 * 60)
      : DEFAULT_LEASE_SECONDS;

    if (!workerId) {
      return NextResponse.json({ error: "workerId is required" }, { status: 400 });
    }

    const staleBefore = new Date(Date.now() - STALE_HEARTBEAT_SECONDS * 1000).toISOString();
    const staleRuns = await failStaleTrialCrawlRuns(staleBefore);
    for (const staleRun of staleRuns) {
      await appendCrawlRunEvent(staleRun.id, {
        eventType: "failed",
        level: "error",
        phase: "worker_lost",
        message: "Worker trial mất heartbeat; phiên cào đã được đóng để có thể cào lại.",
        update: {
          status: "failed",
          currentPhase: "worker_lost",
          finishedAt: true,
          errorsCount: Math.max(staleRun.errorsCount || 0, 1),
        },
      });
    }

    const claimedRun = await claimTrialCrawlRun({ workerId, capabilities, leaseSeconds });
    if (!claimedRun) {
      return new NextResponse(null, { status: 204 });
    }

    await appendCrawlRunEvent(claimedRun.id, {
      eventType: "progress",
      phase: "claimed",
      message: `Worker ${workerId} đã nhận phiên cào trial.`,
      update: {
        status: "waiting_resource",
        currentPhase: "claimed",
        heartbeatAt: true,
      },
      metadata: { workerId, leaseSeconds },
    });

    return NextResponse.json({ run: claimedRun });
  } catch (error) {
    console.error("[Crawl runs API] claim error:", error);
    return NextResponse.json({ error: "Unable to claim crawl run" }, { status: 500 });
  }
}
