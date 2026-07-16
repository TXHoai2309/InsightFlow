export type CustomerInteractionSourceType = "alert" | "lead";

export type CustomerInteractionErrorCode =
  | "AUTH_REQUIRED"
  | "SOURCE_NOT_FOUND"
  | "ACCESS_DENIED"
  | "BRAND_SCOPE_MISMATCH"
  | "INVALID_REQUEST"
  | "TEMPORARY_ERROR";

export interface CustomerInteractionLoadError {
  code: CustomerInteractionErrorCode;
  status?: number;
  message?: string;
}

export interface CustomerInteractionItem {
  id: string;
  sourceId: string;
  contentType: "post" | "comment" | "reply";
  platform: string;
  author: string;
  content: string;
  postedAt: string;
  sourceUrl?: string;
  postId: string;
  commentId?: string;
  parentCommentId?: string;
  parentPostContent?: string;
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  intent: "hot" | "warm" | "cold" | "none";
  urgency?: string;
  topics: string[];
  classificationStatus: "classified" | "unclassified";
  businessSignals: Array<"lead" | "crisis" | "monitoring">;
  leadStatus?: string;
  crisisStatus?: string;
  isCurrent: boolean;
}

export interface CustomerInteractionHistoryData {
  availability: "available" | "insufficient_identity";
  reason?: string;
  subject?: {
    displayName: string;
    platform: string;
    profileUrl?: string;
    identityMethod: "author_id" | "profile_url";
    identityConfidence: "high" | "medium";
  };
  summary?: {
    totalInteractions: number;
    firstInteractionAt?: string;
    lastInteractionAt?: string;
    interactionsLast30Days: number;
    sentiment: { positive: number; neutral: number; negative: number; unknown: number };
    leadSignals: number;
    crisisSignals: number;
    latestTransition?: "lead_to_crisis" | "crisis_to_lead";
    truncated: boolean;
  };
  items: CustomerInteractionItem[];
  nextCursor?: string;
}
