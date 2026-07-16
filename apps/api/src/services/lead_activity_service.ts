type SupabaseRow = Record<string, any>;

export interface LeadActivityRequester {
  brandId?: string;
  brandName?: string;
}

export interface LeadActivityEventDto {
  id: string;
  eventType: string;
  actorType: "employee" | "system";
  actorName: string;
  actorRole?: string;
  fromStatus?: string;
  toStatus?: string;
  channel?: string;
  resultType?: string;
  description?: string;
  occurredAt: string;
  source: "live" | "backfill";
  details?: {
    actionType?: string;
    fromOwnerName?: string;
    toOwnerName?: string;
    followUpFrom?: string;
    followUpTo?: string;
  };
}

export interface LeadActivityHistoryDto {
  availability: "available" | "legacy_snapshot";
  total: number;
  events: LeadActivityEventDto[];
  nextCursor?: string;
}

const LEAD_SELECT = [
  "id",
  "mention_id",
  "source_mention_id",
  "workspace_id",
  "brand",
].join(",");

const EVENT_SELECT = [
  "id",
  "lead_id",
  "event_type",
  "actor_type",
  "actor_name",
  "actor_role",
  "from_status",
  "to_status",
  "channel",
  "result_type",
  "description",
  "metadata",
  "event_source",
  "occurred_at",
].join(",");

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return { url: url.replace(/\/+$/, ""), key };
}

function normalizeBrand(value: unknown) {
  const brand = String(value || "").toLowerCase().replace(/[\s_.-]/g, "").trim();
  if (brand.includes("highland")) return "highlandcoffee";
  if (brand.includes("starbuck")) return "starbucks";
  if (brand.includes("mixue")) return "mixue";
  return brand;
}

async function supabaseQuery(table: string, params: URLSearchParams, count = false) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...(count ? { Prefer: "count=exact" } : {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Supabase ${table} query failed (${response.status}): ${body.slice(0, 400)}`);
    (error as any).statusCode = response.status;
    (error as any).responseBody = body;
    throw error;
  }
  const contentRange = response.headers.get("content-range") || "";
  const totalPart = contentRange.split("/")[1];
  return {
    rows: (await response.json()) as SupabaseRow[],
    total: totalPart && totalPart !== "*" ? Number(totalPart) : undefined,
  };
}

async function findLead(leadId: string) {
  for (const column of ["id", "mention_id", "source_mention_id"]) {
    const params = new URLSearchParams({ select: LEAD_SELECT, limit: "1" });
    params.set(column, `eq.${leadId}`);
    const { rows } = await supabaseQuery("leads", params);
    if (rows[0]) return rows[0];
  }
  return null;
}

type ActivityCursor = { occurredAt: string; id: string };

function encodeCursor(cursor: ActivityCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value?: string): ActivityCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed.occurredAt !== "string" || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function isMissingActivityTable(error: any) {
  const message = String(error?.responseBody || error?.message || "");
  return (
    message.includes("lead_activity_events") &&
    (message.includes("PGRST205") || message.includes("42P01") || message.includes("schema cache"))
  );
}

function readOptional(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function mapEvent(row: SupabaseRow): LeadActivityEventDto {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const details = {
    actionType: readOptional(metadata.action_type),
    fromOwnerName: readOptional(metadata.from_owner_name),
    toOwnerName: readOptional(metadata.to_owner_name),
    followUpFrom: readOptional(metadata.from),
    followUpTo: readOptional(metadata.to),
  };
  return {
    id: String(row.id),
    eventType: String(row.event_type || "system"),
    actorType: row.actor_type === "employee" ? "employee" : "system",
    actorName: readOptional(row.actor_name) || (row.actor_type === "employee" ? "Nhân viên xử lý" : "Hệ thống"),
    actorRole: readOptional(row.actor_role),
    fromStatus: readOptional(row.from_status),
    toStatus: readOptional(row.to_status),
    channel: readOptional(row.channel),
    resultType: readOptional(row.result_type),
    description: readOptional(row.description),
    occurredAt: String(row.occurred_at),
    source: row.event_source === "backfill" ? "backfill" : "live",
    details: Object.values(details).some(Boolean) ? details : undefined,
  };
}

export async function getLeadActivityHistory(options: {
  leadId: string;
  requester: LeadActivityRequester;
  cursor?: string;
  limit?: number;
}): Promise<LeadActivityHistoryDto | null> {
  const lead = await findLead(options.leadId);
  if (!lead) return null;

  const requesterBrand = normalizeBrand(options.requester.brandId || options.requester.brandName);
  const leadBrand = normalizeBrand(lead.workspace_id || lead.brand);
  if (!requesterBrand || requesterBrand !== leadBrand) {
    const error = new Error("Lead is outside the user's brand scope.");
    (error as any).statusCode = 403;
    throw error;
  }

  const limit = Math.min(50, Math.max(5, Number(options.limit || 20)));
  const cursor = decodeCursor(options.cursor);
  const params = new URLSearchParams({
    select: EVENT_SELECT,
    lead_id: `eq.${lead.id}`,
    order: "occurred_at.desc,id.desc",
    limit: String(limit + 1),
  });
  if (cursor) {
    params.set(
      "or",
      `(occurred_at.lt.${cursor.occurredAt},and(occurred_at.eq.${cursor.occurredAt},id.lt.${cursor.id}))`,
    );
  }

  try {
    const result = await supabaseQuery("lead_activity_events", params, !cursor);
    const hasMore = result.rows.length > limit;
    const pageRows = result.rows.slice(0, limit);
    const last = pageRows[pageRows.length - 1];
    return {
      availability: "available",
      total: result.total ?? pageRows.length,
      events: pageRows.map(mapEvent),
      nextCursor: hasMore && last
        ? encodeCursor({ occurredAt: String(last.occurred_at), id: String(last.id) })
        : undefined,
    };
  } catch (error) {
    if (isMissingActivityTable(error)) {
      return { availability: "legacy_snapshot", total: 0, events: [] };
    }
    throw error;
  }
}
