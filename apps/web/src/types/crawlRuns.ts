export const CRAWL_RUN_STATUSES = [
  "queued",
  "waiting_resource",
  "running",
  "labeling",
  "syncing",
  "completed",
  "partial",
  "failed",
  "cancelled",
] as const;

export type CrawlRunStatus = (typeof CRAWL_RUN_STATUSES)[number];

export type CrawlRunType = "production" | "trial";

export type CrawlRunEventLevel = "info" | "warn" | "error";

export type CrawlRunEventType =
  | "started"
  | "progress"
  | "heartbeat"
  | "completed"
  | "failed"
  | "cancelled";

export type CrawlRunTimestamp = string | number | Date | { toDate?: () => Date };

export interface CrawlRunRecord {
  id: string;
  runType: CrawlRunType;
  status: CrawlRunStatus;
  platforms: string[];
  currentPlatform?: string;
  currentPhase?: string;
  progressCurrent: number;
  progressTotal: number;
  postsFound: number;
  commentsFound: number;
  errorsCount: number;
  workspaceId?: string;
  consultationId?: string;
  startedAt?: CrawlRunTimestamp;
  finishedAt?: CrawlRunTimestamp;
  heartbeatAt?: CrawlRunTimestamp;
  lastMessage?: string;
  createdAt?: CrawlRunTimestamp;
  updatedAt?: CrawlRunTimestamp;
  metadata?: Record<string, unknown>;
}

export interface CrawlRunEventRecord {
  id: string;
  runId: string;
  level: CrawlRunEventLevel;
  platform?: string;
  phase?: string;
  eventType: CrawlRunEventType;
  message: string;
  progressCurrent?: number;
  progressTotal?: number;
  metadata?: Record<string, unknown>;
  createdAt?: CrawlRunTimestamp;
}
