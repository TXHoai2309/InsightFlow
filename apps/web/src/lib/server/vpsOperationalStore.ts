import { randomUUID } from "crypto";
import type {
  CrawlRunEventRecord,
  CrawlRunRecord,
  CrawlRunStatus,
  CrawlRunType,
} from "@/types/crawlRuns";

type JsonRecord = Record<string, unknown>;

type ConsultationRow = {
  id: string;
  status: string;
  email: string | null;
  data: JsonRecord;
  created_at: string;
  updated_at: string;
};

type CrawlRunRow = {
  id: string;
  run_type: CrawlRunType;
  status: CrawlRunStatus;
  platforms: string[] | null;
  current_platform: string | null;
  current_phase: string | null;
  progress_current: number | null;
  progress_total: number | null;
  posts_found: number | null;
  comments_found: number | null;
  errors_count: number | null;
  workspace_id: string | null;
  consultation_id: string | null;
  requested_by: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  lease_expires_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  heartbeat_at: string | null;
  last_message: string | null;
  metadata: JsonRecord | null;
  created_at: string;
  updated_at: string;
};

type CrawlRunEventRow = {
  id: string | number;
  run_id: string;
  level: "info" | "warn" | "error";
  platform: string | null;
  phase: string | null;
  event_type: CrawlRunEventRecord["eventType"];
  message: string;
  progress_current: number | null;
  progress_total: number | null;
  metadata: JsonRecord | null;
  created_at: string;
};

function timestampIso(value: unknown, fallback = nowIso()) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback;
}

function operationalConfig() {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!baseUrl || !serviceKey) {
    throw new Error(
      "VPS operational storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return { baseUrl, serviceKey };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, serviceKey } = operationalConfig();
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`VPS operational request failed (${response.status}): ${responseText.slice(0, 1000)}`);
  }
  if (!responseText) return undefined as T;
  return JSON.parse(responseText) as T;
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function nowIso() {
  return new Date().toISOString();
}

function consultationFromRow(row: ConsultationRow) {
  return {
    ...row.data,
    id: row.id,
    status: row.status,
    email: row.email || row.data.email || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as JsonRecord & { id: string };
}

export async function createConsultation(data: JsonRecord) {
  const id = randomUUID().replace(/-/g, "");
  const timestamp = nowIso();
  const status = typeof data.status === "string" ? data.status : "pending";
  const email = typeof data.email === "string" ? data.email : null;
  const rows = await request<ConsultationRow[]>("ops_consultations", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id,
      status,
      email,
      data: { ...data, status, email, createdAt: timestamp, updatedAt: timestamp },
      created_at: timestamp,
      updated_at: timestamp,
    }),
  });
  if (!rows?.[0]) throw new Error("VPS consultation insert returned no row.");
  return consultationFromRow(rows[0]);
}

export async function getConsultation(id: string) {
  const rows = await request<ConsultationRow[]>(
    `ops_consultations?id=eq.${encode(id)}&select=*&limit=1`,
  );
  return rows?.[0] ? consultationFromRow(rows[0]) : null;
}

export async function listConsultations(limit = 500) {
  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 1000);
  const rows = await request<ConsultationRow[]>(
    `ops_consultations?select=*&order=created_at.desc&limit=${safeLimit}`,
  );
  return (rows || []).map(consultationFromRow);
}

export async function updateConsultation(id: string, patch: JsonRecord) {
  const current = await getConsultation(id);
  if (!current) return null;
  const timestamp = nowIso();
  const next: JsonRecord = { ...current, ...patch, id, updatedAt: timestamp };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) delete next[key];
  }
  const status = typeof next.status === "string" ? next.status : "pending";
  const email = typeof next.email === "string" ? next.email : null;
  const rows = await request<ConsultationRow[]>(
    `ops_consultations?id=eq.${encode(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status, email, data: next, updated_at: timestamp }),
    },
  );
  return rows?.[0] ? consultationFromRow(rows[0]) : null;
}

export async function upsertConsultationSnapshot(id: string, data: JsonRecord) {
  const createdAt = timestampIso(data.createdAt);
  const updatedAt = timestampIso(data.updatedAt, createdAt);
  const status = typeof data.status === "string" ? data.status : "pending";
  const email = typeof data.email === "string" ? data.email : null;
  const rows = await request<ConsultationRow[]>("ops_consultations?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id,
      status,
      email,
      data: { ...data, id, status, email, createdAt, updatedAt },
      created_at: createdAt,
      updated_at: updatedAt,
    }),
  });
  return rows?.[0] ? consultationFromRow(rows[0]) : null;
}

function runFromRow(row: CrawlRunRow): CrawlRunRecord {
  return {
    id: row.id,
    runType: row.run_type,
    status: row.status,
    platforms: row.platforms || [],
    currentPlatform: row.current_platform || undefined,
    currentPhase: row.current_phase || undefined,
    progressCurrent: row.progress_current || 0,
    progressTotal: row.progress_total || 0,
    postsFound: row.posts_found || 0,
    commentsFound: row.comments_found || 0,
    errorsCount: row.errors_count || 0,
    workspaceId: row.workspace_id || undefined,
    consultationId: row.consultation_id || undefined,
    startedAt: row.started_at || undefined,
    finishedAt: row.finished_at || undefined,
    heartbeatAt: row.heartbeat_at || undefined,
    lastMessage: row.last_message || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata || {},
  };
}

export type CreateRunInput = {
  runType: CrawlRunType;
  platforms: string[];
  workspaceId?: string;
  consultationId?: string;
  requestedBy?: string;
  metadata?: JsonRecord;
};

export async function insertCrawlRun(input: CreateRunInput) {
  const id = randomUUID().replace(/-/g, "");
  const timestamp = nowIso();
  const rows = await request<CrawlRunRow[]>("ops_crawl_runs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id,
      run_type: input.runType,
      status: "queued",
      platforms: [...new Set(input.platforms.map((item) => item.trim()).filter(Boolean))],
      workspace_id: input.workspaceId || null,
      consultation_id: input.consultationId || null,
      requested_by: input.requestedBy || null,
      progress_current: 0,
      progress_total: 0,
      posts_found: 0,
      comments_found: 0,
      errors_count: 0,
      metadata: input.metadata || {},
      created_at: timestamp,
      updated_at: timestamp,
    }),
  });
  if (!rows?.[0]) throw new Error("VPS crawl run insert returned no row.");
  return id;
}

export async function selectCrawlRun(id: string) {
  const rows = await request<CrawlRunRow[]>(`ops_crawl_runs?id=eq.${encode(id)}&select=*&limit=1`);
  return rows?.[0] ? runFromRow(rows[0]) : null;
}

export async function selectCrawlRuns(limit = 50) {
  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 200);
  const rows = await request<CrawlRunRow[]>(
    `ops_crawl_runs?select=*&order=created_at.desc&limit=${safeLimit}`,
  );
  return (rows || []).map(runFromRow);
}

export async function upsertCrawlRunSnapshot(run: CrawlRunRecord) {
  const createdAt = timestampIso(run.createdAt);
  const updatedAt = timestampIso(run.updatedAt, createdAt);
  const rows = await request<CrawlRunRow[]>("ops_crawl_runs?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: run.id,
      run_type: run.runType,
      status: run.status,
      platforms: run.platforms || [],
      current_platform: run.currentPlatform || null,
      current_phase: run.currentPhase || null,
      progress_current: run.progressCurrent || 0,
      progress_total: run.progressTotal || 0,
      posts_found: run.postsFound || 0,
      comments_found: run.commentsFound || 0,
      errors_count: run.errorsCount || 0,
      workspace_id: run.workspaceId || null,
      consultation_id: run.consultationId || null,
      started_at: run.startedAt ? timestampIso(run.startedAt) : null,
      finished_at: run.finishedAt ? timestampIso(run.finishedAt) : null,
      heartbeat_at: run.heartbeatAt ? timestampIso(run.heartbeatAt) : null,
      last_message: run.lastMessage || null,
      metadata: run.metadata || {},
      created_at: createdAt,
      updated_at: updatedAt,
    }),
  });
  return rows?.[0] ? runFromRow(rows[0]) : null;
}

export async function patchCrawlRun(id: string, patch: Partial<CrawlRunRecord> & {
  claimedBy?: string | null;
  claimedAt?: string | null;
  leaseExpiresAt?: string | null;
}, expectedStatus?: CrawlRunStatus) {
  const columnMap: Record<string, string> = {
    status: "status",
    platforms: "platforms",
    currentPlatform: "current_platform",
    currentPhase: "current_phase",
    progressCurrent: "progress_current",
    progressTotal: "progress_total",
    postsFound: "posts_found",
    commentsFound: "comments_found",
    errorsCount: "errors_count",
    workspaceId: "workspace_id",
    consultationId: "consultation_id",
    startedAt: "started_at",
    finishedAt: "finished_at",
    heartbeatAt: "heartbeat_at",
    lastMessage: "last_message",
    metadata: "metadata",
    claimedBy: "claimed_by",
    claimedAt: "claimed_at",
    leaseExpiresAt: "lease_expires_at",
  };
  const payload: JsonRecord = { updated_at: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && columnMap[key]) payload[columnMap[key]] = value;
  }
  const statusFilter = expectedStatus ? `&status=eq.${encode(expectedStatus)}` : "";
  const rows = await request<CrawlRunRow[]>(`ops_crawl_runs?id=eq.${encode(id)}${statusFilter}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return rows?.[0] ? runFromRow(rows[0]) : null;
}

export async function patchQueuedCrawlRun(id: string, patch: Partial<CrawlRunRecord>) {
  const updated = await patchCrawlRun(id, patch, "queued");
  if (updated) return { reason: null, run: updated };
  const current = await selectCrawlRun(id);
  if (!current) return { reason: "not_found" as const, run: null };
  return { reason: "not_queued" as const, run: current };
}

export async function claimTrialCrawlRun(params: {
  workerId: string;
  capabilities: string[];
  leaseSeconds: number;
}) {
  const rows = await request<CrawlRunRow[]>("rpc/claim_trial_ops_crawl_run", {
    method: "POST",
    body: JSON.stringify({
      p_worker_id: params.workerId,
      p_capabilities: params.capabilities,
      p_lease_seconds: params.leaseSeconds,
    }),
  });
  return rows?.[0] ? runFromRow(rows[0]) : null;
}

export async function failStaleTrialCrawlRuns(staleBefore: string) {
  const timestamp = nowIso();
  const rows = await request<CrawlRunRow[]>(
    (
      "ops_crawl_runs?run_type=eq.trial"
      + "&status=in.(running,labeling,syncing)"
      + `&heartbeat_at=lt.${encode(staleBefore)}`
    ),
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "failed",
        current_phase: "worker_lost",
        finished_at: timestamp,
        lease_expires_at: null,
        last_message: "Worker trial mất heartbeat; phiên cào đã được đóng để có thể cào lại.",
        updated_at: timestamp,
      }),
    },
  );
  return (rows || []).map(runFromRow);
}

export async function insertCrawlRunEvent(
  runId: string,
  input: Omit<CrawlRunEventRecord, "id" | "runId" | "createdAt">,
) {
  const rows = await request<CrawlRunEventRow[]>("ops_crawl_run_events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      run_id: runId,
      level: input.level || "info",
      platform: input.platform || null,
      phase: input.phase || null,
      event_type: input.eventType,
      message: input.message.slice(0, 2000),
      progress_current: input.progressCurrent ?? null,
      progress_total: input.progressTotal ?? null,
      metadata: input.metadata || {},
      created_at: nowIso(),
    }),
  });
  if (!rows?.[0]) throw new Error("VPS crawl event insert returned no row.");
  return String(rows[0].id);
}

export async function selectCrawlRunEvents(runId: string, limit = 100) {
  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 500);
  const rows = await request<CrawlRunEventRow[]>(
    `ops_crawl_run_events?run_id=eq.${encode(runId)}&select=*&order=created_at.desc&limit=${safeLimit}`,
  );
  return (rows || []).reverse().map((row): CrawlRunEventRecord => ({
    id: String(row.id),
    runId: row.run_id,
    level: row.level,
    platform: row.platform || undefined,
    phase: row.phase || undefined,
    eventType: row.event_type,
    message: row.message,
    progressCurrent: row.progress_current ?? undefined,
    progressTotal: row.progress_total ?? undefined,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  }));
}

export async function upsertCrawlRunEventSnapshot(event: CrawlRunEventRecord) {
  const rows = await request<CrawlRunEventRow[]>(
    "ops_crawl_run_events?on_conflict=run_id,source_event_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        run_id: event.runId,
        source_event_id: event.id,
        level: event.level || "info",
        platform: event.platform || null,
        phase: event.phase || null,
        event_type: event.eventType,
        message: event.message.slice(0, 2000),
        progress_current: event.progressCurrent ?? null,
        progress_total: event.progressTotal ?? null,
        metadata: event.metadata || {},
        created_at: timestampIso(event.createdAt),
      }),
    },
  );
  return rows?.[0] || null;
}
