import type {
  CrawlRunEventLevel,
  CrawlRunEventType,
  CrawlRunRecord,
  CrawlRunType,
} from "@/types/crawlRuns";
import {
  insertCrawlRun,
  insertCrawlRunEvent,
  patchCrawlRun,
  selectCrawlRun,
  selectCrawlRunEvents,
  selectCrawlRuns,
  type CreateRunInput,
} from "@/lib/server/vpsOperationalStore";

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
  | "platforms"
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

export async function createCrawlRun(input: CreateCrawlRunInput) {
  return insertCrawlRun(input as CreateRunInput);
}

export async function updateCrawlRun(runId: string, input: UpdateCrawlRunInput) {
  const timestamp = new Date().toISOString();
  const updates: Partial<CrawlRunRecord> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "heartbeatAt" || key === "startedAt" || key === "finishedAt") continue;
    if (value !== undefined) (updates as Record<string, unknown>)[key] = value;
  }
  if (input.heartbeatAt) updates.heartbeatAt = timestamp;
  if (input.startedAt) updates.startedAt = timestamp;
  if (input.finishedAt) updates.finishedAt = timestamp;
  return patchCrawlRun(runId, updates);
}

export async function appendCrawlRunEvent(runId: string, input: AppendCrawlRunEventInput) {
  const eventId = await insertCrawlRunEvent(runId, {
    level: input.level || "info",
    platform: input.platform,
    phase: input.phase,
    eventType: input.eventType,
    message: input.message.slice(0, 2000),
    progressCurrent: input.progressCurrent,
    progressTotal: input.progressTotal,
    metadata: input.metadata || {},
  });

  await patchCrawlRun(runId, {
    lastMessage: input.message.slice(0, 500),
    heartbeatAt: new Date().toISOString(),
    ...(input.progressCurrent === undefined ? {} : { progressCurrent: input.progressCurrent }),
    ...(input.progressTotal === undefined ? {} : { progressTotal: input.progressTotal }),
  });
  if (input.update) await updateCrawlRun(runId, input.update);
  return eventId;
}

export async function getCrawlRun(runId: string) {
  return selectCrawlRun(runId);
}

export async function listCrawlRuns(limit = 50) {
  return selectCrawlRuns(limit);
}

export async function listCrawlRunEvents(runId: string, limit = 100) {
  return selectCrawlRunEvents(runId, limit);
}
