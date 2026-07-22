import {
  FieldValue,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import { db } from "@/lib/server/firebaseAdmin";
import type {
  CrawlRunEventLevel,
  CrawlRunEventRecord,
  CrawlRunEventType,
  CrawlRunRecord,
  CrawlRunStatus,
  CrawlRunType,
} from "@/types/crawlRuns";

const RUNS_COLLECTION = "crawl_runs";

type CreateCrawlRunInput = {
  runType: CrawlRunType;
  platforms: string[];
  workspaceId?: string;
  consultationId?: string;
  requestedBy?: string;
  metadata?: Record<string, unknown>;
};

type UpdateCrawlRunInput = Partial<Pick<
  CrawlRunRecord,
  | "status"
  | "currentPlatform"
  | "currentPhase"
  | "progressCurrent"
  | "progressTotal"
  | "postsFound"
  | "commentsFound"
  | "errorsCount"
  | "lastMessage"
  | "metadata"
>> & {
  heartbeatAt?: boolean;
  startedAt?: boolean;
  finishedAt?: boolean;
};

type AppendCrawlRunEventInput = {
  level?: CrawlRunEventLevel;
  platform?: string;
  phase?: string;
  eventType: CrawlRunEventType;
  message: string;
  progressCurrent?: number;
  progressTotal?: number;
  metadata?: Record<string, unknown>;
  update?: UpdateCrawlRunInput;
};

function cleanPlatforms(platforms: string[]) {
  return [...new Set(platforms.map((platform) => platform.trim()).filter(Boolean))];
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serializeValue(item)]),
    );
  }
  return value;
}

export function serializeCrawlRun(id: string, data: Record<string, unknown>): CrawlRunRecord {
  return {
    id,
    ...(serializeValue(data) as Omit<CrawlRunRecord, "id">),
  };
}

export function serializeCrawlRunEvent(
  id: string,
  runId: string,
  data: Record<string, unknown>,
): CrawlRunEventRecord {
  return {
    id,
    runId,
    ...(serializeValue(data) as Omit<CrawlRunEventRecord, "id" | "runId">),
  };
}

export async function createCrawlRun(input: CreateCrawlRunInput) {
  const reference = db.collection(RUNS_COLLECTION).doc();
  const now = FieldValue.serverTimestamp();
  await reference.set({
    runType: input.runType,
    status: "queued" satisfies CrawlRunStatus,
    platforms: cleanPlatforms(input.platforms),
    workspaceId: input.workspaceId || null,
    consultationId: input.consultationId || null,
    requestedBy: input.requestedBy || null,
    progressCurrent: 0,
    progressTotal: 0,
    postsFound: 0,
    commentsFound: 0,
    errorsCount: 0,
    metadata: input.metadata || {},
    createdAt: now,
    updatedAt: now,
  });
  return reference.id;
}

export async function updateCrawlRun(runId: string, input: UpdateCrawlRunInput) {
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const [key, value] of Object.entries(input)) {
    if (key === "heartbeatAt" || key === "startedAt" || key === "finishedAt") continue;
    if (value !== undefined) updates[key] = value;
  }
  if (input.heartbeatAt) updates.heartbeatAt = FieldValue.serverTimestamp();
  if (input.startedAt) updates.startedAt = FieldValue.serverTimestamp();
  if (input.finishedAt) updates.finishedAt = FieldValue.serverTimestamp();

  await db.collection(RUNS_COLLECTION).doc(runId).set(updates, { merge: true });
}

export async function appendCrawlRunEvent(runId: string, input: AppendCrawlRunEventInput) {
  const runReference = db.collection(RUNS_COLLECTION).doc(runId);
  const eventReference = runReference.collection("events").doc();
  const now = FieldValue.serverTimestamp();

  await eventReference.set({
    level: input.level || "info",
    platform: input.platform || null,
    phase: input.phase || null,
    eventType: input.eventType,
    message: input.message.slice(0, 2000),
    progressCurrent: input.progressCurrent ?? null,
    progressTotal: input.progressTotal ?? null,
    metadata: input.metadata || {},
    createdAt: now,
  });

  await runReference.set(
    {
      lastMessage: input.message.slice(0, 500),
      updatedAt: now,
      heartbeatAt: now,
      ...(input.progressCurrent === undefined
        ? {}
        : { progressCurrent: input.progressCurrent }),
      ...(input.progressTotal === undefined
        ? {}
        : { progressTotal: input.progressTotal }),
    },
    { merge: true },
  );
  if (input.update) await updateCrawlRun(runId, input.update);

  return eventReference.id;
}

export async function getCrawlRun(runId: string) {
  const snapshot = await db.collection(RUNS_COLLECTION).doc(runId).get();
  if (!snapshot.exists) return null;
  return serializeCrawlRun(snapshot.id, snapshot.data() || {});
}

export async function listCrawlRuns(limit = 50) {
  const snapshot = await db
    .collection(RUNS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(Math.min(Math.max(limit, 1), 200))
    .get();
  return snapshot.docs.map((run: QueryDocumentSnapshot) =>
    serializeCrawlRun(run.id, run.data()),
  );
}

export async function listCrawlRunEvents(runId: string, limit = 100) {
  const snapshot = await db
    .collection(RUNS_COLLECTION)
    .doc(runId)
    .collection("events")
    .orderBy("createdAt", "desc")
    .limit(Math.min(Math.max(limit, 1), 500))
    .get();

  return snapshot.docs
    .map((event: QueryDocumentSnapshot) =>
      serializeCrawlRunEvent(event.id, runId, event.data()),
    )
    .reverse();
}
