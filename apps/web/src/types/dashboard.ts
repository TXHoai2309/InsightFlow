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
  | "news";        // Báo điện tử / báo online

export interface Mention {
  id: string;
  workspace_id: string;       // = brand field từ Firestore
  platform: Platform;
  content: string;
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
    | "competitor"
    | "other";
  credibility_score: number;  // 0–100 (từ baseline_confidence × 100)
  created_at: string;         // ISO string (từ crawled_at)
  posted_at: string;          // ISO string (ngày đăng bài thật: post_date / created_at từ nguồn)
  url?: string;
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
  status: "new" | "acknowledged" | "resolved";
}

export interface Lead {
  id: string;
  workspace_id: string;
  platform: Platform;
  content: string;
  intent: "hot" | "warm" | "cold" | "none";
  intent_signals: string[];
  status: "new" | "processing" | "completed" | "skipped";
  created_at: string;
  expiry_at?: string;
  url?: string;
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

/** Filter state của Dashboard — không có sentiment (đã bỏ) */
export interface DashboardFilters {
  workspace_id: string;            // "all" hoặc brand name cụ thể
  time_range: "all" | "24h" | "7d" | "30d";
  platform: "all" | Platform;
}
