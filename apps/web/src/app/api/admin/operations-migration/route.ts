import { NextRequest, NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { verifyBearerToken } from "@/lib/server/auth";
import { hasCrawlRunIngestAccess } from "@/lib/server/crawlRunIngestAuth";
import { db } from "@/lib/server/firebaseAdmin";
import type { CrawlRunEventRecord, CrawlRunRecord } from "@/types/crawlRuns";
import {
  upsertConsultationSnapshot,
  upsertCrawlRunEventSnapshot,
  upsertCrawlRunSnapshot,
} from "@/lib/server/vpsOperationalStore";

function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serialize(item)]),
    );
  }
  return value;
}

async function requireAdmin(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  if (token.role === "admin") return token;
  const profile = await db.collection("users").doc(token.uid).get();
  return (profile.data()?.role || token.role) === "admin" ? token : null;
}

function importantEvent(event: CrawlRunEventRecord) {
  return event.level !== "info"
    || event.eventType !== "progress"
    || /(?:\bpass\b|\bcomplete(?:d)?\b|\bfinish(?:ed)?\b|\bfail(?:ed)?\b|\berror\b|\bwarn(?:ing)?\b|\[quality\]|\[summary\]|\[sync\]|\[local label\]|\[pipeline\])/i.test(event.message);
}

export async function POST(request: NextRequest) {
  if (!hasCrawlRunIngestAccess(request) && !(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const consultationSnapshot = await db.collection("consultations").get();
    for (const document of consultationSnapshot.docs) {
      await upsertConsultationSnapshot(
        document.id,
        serialize(document.data()) as Record<string, unknown>,
      );
    }

    const runSnapshot = await db.collection("crawl_runs").get();
    let eventsMigrated = 0;
    for (const document of runSnapshot.docs) {
      const run = {
        id: document.id,
        ...(serialize(document.data()) as Omit<CrawlRunRecord, "id">),
      };
      await upsertCrawlRunSnapshot(run);

      const eventsSnapshot = await document.ref
        .collection("events")
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();
      const events = eventsSnapshot.docs
        .map((eventDocument: QueryDocumentSnapshot) => ({
          id: eventDocument.id,
          runId: document.id,
          ...(serialize(eventDocument.data()) as Omit<CrawlRunEventRecord, "id" | "runId">),
        }))
        .filter(importantEvent);
      for (const event of events) {
        await upsertCrawlRunEventSnapshot(event);
        eventsMigrated += 1;
      }
    }

    return NextResponse.json({
      success: true,
      consultationsMigrated: consultationSnapshot.size,
      runsMigrated: runSnapshot.size,
      eventsMigrated,
      sourceDeleted: false,
    });
  } catch (error) {
    console.error("[Operations migration] failed:", error);
    return NextResponse.json(
      { error: "Unable to migrate Firebase operational data to VPS storage." },
      { status: 500 },
    );
  }
}
