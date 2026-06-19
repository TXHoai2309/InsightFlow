/**
 * US-13: Tổng quan Dashboard
 * Định nghĩa types cho các widget và data structure
 */

export interface Mention {
  id: string;
  workspace_id: string;
  platform: string;
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
  credibility_score: number;
  created_at: string;
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
  platform: string;
  content: string;
  intent: "hot" | "warm" | "cold" | "none";
  intent_signals: string[];
  status: "new" | "processing" | "completed" | "skipped";
  created_at: string;
  expiry_at?: string; // Hot lead expiry (30 min)
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
  net_sentiment: number; // percentage
  hot_leads_today: number;
  alerts_today: number;
  trending_spike: number; // recent spike multiplier
}

export interface TopSource {
  platform: string;
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

export interface DashboardFilters {
  workspace_id: string; // 'all' or specific workspace
  time_range: "24h" | "7d" | "30d";
  platform: string;
  sentiment: "all" | "positive" | "negative" | "neutral";
  topic?: "all" | string;
}
