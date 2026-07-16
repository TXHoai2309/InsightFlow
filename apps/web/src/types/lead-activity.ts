export type LeadActivityAvailability = "available" | "legacy_snapshot";

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

export interface LeadActivityHistoryData {
  availability: LeadActivityAvailability;
  total: number;
  events: LeadActivityEventDto[];
  nextCursor?: string;
}

export type LeadActivityLoadErrorCode =
  | "AUTH_REQUIRED"
  | "ACCESS_DENIED"
  | "TEMPORARY_ERROR";

