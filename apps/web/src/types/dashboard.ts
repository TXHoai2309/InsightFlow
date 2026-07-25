/**
 * US-13: Dashboard Types
 * Cập nhật platform list để khớp với nguồn dữ liệu thật từ crawler
 */

// ─── Platform type (mở rộng theo nguồn dữ liệu thật) ─────────────────────────
export type Platform =
  | "facebook"
  | "tiktok"
  | "youtube"
  | "thread"       // Threads (Meta)
  | "be"           // BeFood
  | "google_maps"  // Google Maps reviews
  | "news"         // Báo điện tử / báo online
  | (string & {});

export interface Mention {
  id: string;
  entity_key?: string;
  post_id?: string;
  comment_id?: string | null;
  parent_id?: string | null;
  workspace_id: string;       // = brand field từ Firestore
  platform: Platform;
  content: string;
  post_content?: string;
  comment_content?: string;
  content_type?: "post" | "comment" | "reply";
  original_content?: string;
  author: string;
  sentiment: "positive" | "negative" | "neutral";
  topic:
  | "quality"
  | "price"
  | "service"
  | "staff"
  | "delivery"
  | "experience"
  | "legal"
  | "operation"
  | "marketing"
  | "competitor"
  | "other"
  | (string & {});
  credibility_score: number;  // 0–100 (từ baseline_confidence × 100)
  created_at: string;         // ISO string (từ crawled_at)
  classified_at?: string;     // ISO string (annotation created/updated time)
  posted_at: string;          // ISO string (ngày đăng bài thật: post_date / created_at từ nguồn)
  url?: string;
  post_url?: string;
  comment_url?: string;
  source_url?: string;
  contact?: string;
  labels?: ClassificationLabel;
  star_count?: number | null;
  location_name?: string | null;
}

export interface Alert {
  id: string;
  workspace_id: string;
  severity: "critical" | "high" | "medium" | "low";
  signal_type: "mention_spike" | "high_reach" | "sensitive_topic";
  message: string;
  spike_multiplier?: number;
  affected_mentions_count?: number;
  created_at: string;
  resolved_at?: string;
  assigned_to?: string | null;
  status: "new" | "acknowledged" | "resolved";
}

export type LabelQueue = "lead" | "crisis" | "monitoring" | "none" | "review";

export type LabelSentiment = "positive" | "negative" | "neutral";
export type LabelTopic =
  | "quality"
  | "price"
  | "service"
  | "location"
  | "promotion"
  | "other";
export type LabelUrgency = "none" | "low" | "medium" | "high" | "urgent";
export type LabelIntent = "hot" | "warm" | "cold" | "none";

export interface ClassificationLabel {
  sentiment: LabelSentiment | null;
  topic: LabelTopic[];
  relevance: boolean | null;
  urgency: LabelUrgency | null;
  intent: LabelIntent | null;
}

export type LabelValue =
  | "lead_hot"
  | "lead_warm"
  | "lead_cold"
  | "not_lead"
  | "crisis_complaint"
  | "crisis_negative_high_risk"
  | "crisis_legal"
  | "spam"
  | "irrelevant"
  | "monitoring"
  | "needs_review";

export interface LabelChangeRequest {
  id: string;
  source_type: "lead" | "mention" | "comment" | "post";
  source_id: string;
  lead_id?: string;
  mention_id?: string;
  workspace_id: string;
  platform: Platform;
  author?: string;
  content_preview: string;
  source_url?: string;
  current_labels: ClassificationLabel;
  requested_labels: ClassificationLabel;
  changed_fields: Array<keyof ClassificationLabel>;
  current_queue: LabelQueue;
  requested_queue: LabelQueue;
  current_label?: LabelValue;
  requested_label?: LabelValue;
  reason_code: string;
  reason_note: string;
  evidence_checked: boolean;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_by: string;
  requested_by_name: string;
  requested_by_role: string;
  requested_at: string;
  updated_at?: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_by_role?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_note?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancelled_by_name?: string;
  cancel_reason?: string;
  applied_at?: string;
  audit_log_id?: string;
  revision_count?: number;
}

export interface Lead {
  id: string;
  mention_id?: string;
  source_mention_id?: string;
  parent_id?: string | null;
  content_type?: "post" | "comment" | "reply";
  post_id?: string;
  workspace_id: string;
  platform: Platform;
  author?: string;
  content: string;
  intent: "hot" | "warm" | "cold" | "none";
  current_label?: LabelValue;
  labels?: ClassificationLabel;
  intent_signals: string[];
  status: "new" | "processing" | "completed" | "skipped";
  created_at: string;
  updated_at?: string;
  expiry_at?: string;
  url?: string;
  post_url?: string;
  comment_url?: string;
  source_comment_url?: string;
  original_comment_url?: string;
  source_url?: string;
  label_correction_status?: "none" | "pending" | "approved" | "rejected";
  pending_label_request_id?: string;
  last_label_corrected_at?: string;

  // Contact Info
  phone?: string;
  email?: string;
  zalo_id?: string;
  messenger_id?: string;
  social_profile_url?: string;
  
  // CRM Tracking
  owner_id?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
  claimed_at?: string | null;
  first_contacted_at?: string;
  contact_attempts?: number;
  last_contact_at?: string;
  pending_result?: boolean;
  last_action_at?: string;
  last_action_type?: "open_source" | "message" | "call" | "email" | "open_profile" | "note" | "skip" | "restore";
  last_contact_channel?: string;
  result_type?:
    | "positive"
    | "no_response"
    | "follow_up"
    | "not_fit"
    | "converted"
    | "transfer_sales"
    | null;
  result_recorded_at?: string | null;
  follow_up_at?: string | null;
  closed_at?: string | null;
  sales_status?: "not_ready" | "ready_to_transfer" | "transferred";
  sales_owner_id?: string;
  sales_owner_name?: string;
  sales_transferred_at?: string;
  crm_deal_id?: string;
  notes?: string;
  posted_at?: string;
}

export interface Workspace {
  id: string;
  brand_name: string;
  scale: "small" | "medium" | "large";
  keywords: string[];
  synonyms: string[];
  priority: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_mentions: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  net_sentiment: number;
  hot_leads_today: number;
  alerts_today: number;
  trending_spike: number;
}

export interface TopSource {
  platform: Platform;
  count: number;
  percentage: number;
}

export interface TopTopic {
  name: string;
  count: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/** Một điểm dữ liệu trong biểu đồ xu hướng cảm xúc */
export interface SentimentTrendPoint {
  date: string;      // label hiển thị trên trục X
  positive: number;
  negative: number;
  neutral: number;
}

export interface DashboardFilters {
  workspace_id: string; // 'all' or specific workspace
  time_range: "all" | "24h" | "2d" | "3d" | "5d" | "7d" | "30d" | "custom" | "single";
  custom_start_date?: string; // YYYY-MM-DD
  custom_end_date?: string;   // YYYY-MM-DD
  single_date?: string;       // YYYY-MM-DD
  platform: string;
  sentiment: "all" | "positive" | "negative" | "neutral";
  topic?: "all" | Mention["topic"];
  urgency?: "all" | "pending" | "urgent" | "overdue" | "handled";
}
