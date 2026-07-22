import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp, Transaction } from "firebase-admin/firestore";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  appendCrawlRunEvent,
  getCrawlRun,
} from "@/lib/server/crawlRuns";

const RUNS_COLLECTION = "crawl_runs";
const DEFAULT_LEASE_SECONDS = 15 * 60;

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

function timestampMillis(value: unknown) {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function supportsRun(run: Record<string, unknown>, capabilities: string[]) {
  if (!capabilities.length) return true;
  const requested = stringList(run.platforms);
  return requested.every((platform) => capabilities.includes(platform));
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

    const nowMillis = Date.now();
    const claimedRunId = await db.runTransaction(async (transaction: Transaction) => {
      const queuedQuery = db.collection(RUNS_COLLECTION).where("status", "==", "queued").limit(50);
      const waitingQuery = db.collection(RUNS_COLLECTION).where("status", "==", "waiting_resource").limit(50);
      const [queuedSnapshot, waitingSnapshot] = await Promise.all([
        transaction.get(queuedQuery),
        transaction.get(waitingQuery),
      ]);

      const candidates = [...queuedSnapshot.docs, ...waitingSnapshot.docs]
        .filter((snapshot) => {
          const run = snapshot.data() as Record<string, unknown>;
          if (run.runType !== "trial" || !supportsRun(run, capabilities)) return false;
          if (run.status === "queued") return true;
          return timestampMillis(run.leaseExpiresAt) <= nowMillis;
        })
        .sort((left, right) => (
          timestampMillis((left.data() as Record<string, unknown>).createdAt)
          - timestampMillis((right.data() as Record<string, unknown>).createdAt)
        ));

      const selected = candidates[0];
      if (!selected) return null;

      transaction.set(selected.ref, {
        status: "waiting_resource",
        currentPhase: "claimed",
        claimedBy: workerId,
        claimedAt: FieldValue.serverTimestamp(),
        leaseExpiresAt: new Date(nowMillis + leaseSeconds * 1000),
        heartbeatAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return selected.id;
    });

    if (!claimedRunId) {
      return new NextResponse(null, { status: 204 });
    }

    await appendCrawlRunEvent(claimedRunId, {
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

    return NextResponse.json({ run: await getCrawlRun(claimedRunId) });
  } catch (error) {
    console.error("[Crawl runs API] claim error:", error);
    return NextResponse.json({ error: "Unable to claim crawl run" }, { status: 500 });
  }
}
