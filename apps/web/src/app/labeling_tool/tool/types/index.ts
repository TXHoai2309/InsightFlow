// ============================================================
// InsightFlow Labeling Tool — Core Types
// ============================================================

export type Sentiment = 'positive' | 'negative' | 'neutral' | null;
export type TopicKey = 'quality' | 'price' | 'service' | 'location' | 'promotion' | 'recruitment' | 'other';
export type Urgency = 'low' | 'medium' | 'high' | 'urgent' | 'none' | null;
export type Intent = 'hot' | 'warm' | 'cold' | 'none' | null;
export type Person = 'Person A' | 'Person B' | 'Person C' | 'Person D';

export const PERSONS: Person[] = ['Person A', 'Person B', 'Person C', 'Person D'];

export const SENTIMENT_LABELS: Record<NonNullable<Sentiment>, string> = {
  positive: 'Tích cực',
  negative: 'Tiêu cực',
  neutral: 'Trung tính',
};

export const TOPIC_LABELS: Record<TopicKey, string> = {
  quality: 'Chất lượng',
  price: 'Giá',
  service: 'Dịch vụ',
  location: 'Địa điểm',
  promotion: 'Khuyến mãi',
  recruitment: 'Tuyển dụng',
  other: 'Khác',
};

export const TOPIC_HOTKEYS: Record<string, TopicKey> = {
  q: 'quality',
  w: 'price',
  e: 'service',
  r: 'location',
  t: 'promotion',
  y: 'recruitment',
  u: 'other',
};

export const URGENCY_LABELS: Record<NonNullable<Urgency>, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
  none: 'None',
};

export const INTENT_LABELS: Record<NonNullable<Intent>, { label: string; emoji: string; tooltip: string }> = {
  hot:  { label: 'Hot',  emoji: '🔥', tooltip: 'Quan tâm mạnh — có ý định mua/ứng tuyển ngay' },
  warm: { label: 'Warm', emoji: '🌡️', tooltip: 'Quan tâm vừa — đang tìm hiểu, cân nhắc' },
  cold: { label: 'Cold', emoji: '🧊', tooltip: 'Ít quan tâm — đề cập nhưng không có ý định' },
  none: { label: 'None', emoji: '➖', tooltip: 'Không liên quan đến mua hàng/tuyển dụng' },
};

export interface Label {
  sentiment: Sentiment;
  topic: TopicKey[];
  relevance: boolean | null;
  urgency: Urgency;
  intent: Intent;
}

export const EMPTY_LABEL: Label = {
  sentiment: null,
  topic: [],
  relevance: null,
  urgency: null,
  intent: null,
};

/** Nhãn mặc định cho "Không liên quan" — gán nhanh bằng phím 0 */
export const IRRELEVANT_PRESET_LABEL: Label = {
  sentiment: 'neutral',
  topic: ['other'],
  relevance: false,
  urgency: 'none',
  intent: 'none',
};

export function isIrrelevantPreset(label: Label): boolean {
  return (
    label.sentiment === 'neutral' &&
    label.relevance === false &&
    label.urgency === 'none' &&
    label.intent === 'none' &&
    label.topic.length === 1 &&
    label.topic[0] === 'other'
  );
}

/** Nhãn mặc định cho "Tích cực, Cold" — gán nhanh bằng phím 9 */
export const POSITIVE_COLD_PRESET_LABEL: Label = {
  sentiment: 'positive',
  topic: ['other'],
  relevance: true,
  urgency: 'none',
  intent: 'cold',
};

export function isPositiveColdPreset(label: Label): boolean {
  return (
    label.sentiment === 'positive' &&
    label.relevance === true &&
    label.urgency === 'none' &&
    label.intent === 'cold' &&
    label.topic.length === 1 &&
    label.topic[0] === 'other'
  );
}

/** Nhãn mặc định cho "Tích cực, None" — gán nhanh bằng phím 8 */
export const POSITIVE_NONE_PRESET_LABEL: Label = {
  sentiment: 'positive',
  topic: ['other'],
  relevance: true,
  urgency: 'none',
  intent: 'none',
};

export function isPositiveNonePreset(label: Label): boolean {
  return (
    label.sentiment === 'positive' &&
    label.relevance === true &&
    label.urgency === 'none' &&
    label.intent === 'none' &&
    label.topic.length === 1 &&
    label.topic[0] === 'other'
  );
}

export function isLabelComplete(label: Label | undefined): boolean {
  if (!label) return false;
  return (
    label.sentiment !== null &&
    label.relevance !== null &&
    label.urgency !== null &&
    label.intent !== null
    // topic can be empty — it's valid to have no topic
  );
}

// -------------------------------------------------------
// Platform stats — unified stats object per source/content type
// -------------------------------------------------------
export interface PlatformStats {
  like_count: number;
  comment_count: number;       // tổng comment thật (cmt_count)
  comment_crawled: number;     // số đã cào (crawled_cmt_count)
  share_count: number | null;
  repost_count: number | null;
  view_count: number | null;
  star_count: number | null;   // rating 1-5
  review_count_total: number | null;  // tổng đánh giá (BeFood/GMaps)
}

export const EMPTY_STATS: PlatformStats = {
  like_count: 0,
  comment_count: 0,
  comment_crawled: 0,
  share_count: null,
  repost_count: null,
  view_count: null,
  star_count: null,
  review_count_total: null,
};

// -------------------------------------------------------
// Raw item schema — supports ALL crawler output schemas.
// Field names are kept exactly as the crawler produces them.
// Vietnamese-named fields coexist with English fallbacks.
// -------------------------------------------------------
export interface RawItem {
  // ── Post-level crawler fields ──────────────────────────
  post_id?: string;
  tac_gia?: string;             // author (post) — Vietnamese
  nguon_chia?: string;          // source — Vietnamese
  thoi_gian_dang?: string;      // posted_at — Vietnamese
  thoi_gian_cao?: string;       // crawled_at — Vietnamese
  ngon_ngu_bai_viet?: string;   // language
  text?: string;                // post/comment content
  brand?: string;
  url?: string;
  contact?: string;
  keywords_match?: string[];
  extra?: Record<string, unknown>;

  // ── Comment/reply-level crawler fields ─────────────────
  comment_id?: string;
  username?: string;            // author (comment)
  gio_comment?: string;         // posted_at (comment)
  gio_cao?: string;             // crawled_at (comment)
  parent_comment_id?: string | null;
  replies?: unknown[];
  author_id?: string;

  // ── Shared English-name fallbacks (some crawlers use these) ──
  id?: string;
  source?: string;
  author?: string;
  author_name?: string;
  posted_at?: string;
  original_text?: string;
  clean_text?: string;
  parent_id?: string | null;
  content_type?: 'post' | 'comment' | 'reply';

  // ── Stats fields (top-level on the raw object) ─────────
  like_count?: number;
  cmt_count?: number;           // tổng số comment thật
  crawled_cmt_count?: number;   // số comment đã cào được
  reply_count?: number;
  star_count?: number;          // số sao (GMaps, BeFood)
  share_count?: number;         // lượt chia sẻ
  repost_count?: number;        // lượt đăng lại (Threads)
  view_count?: number;          // lượt xem
  video_id?: string;
  stats_enriched?: boolean;
  platform?: string;
  _queue_status?: 'unassigned' | 'updated_review' | null;
  _data_version?: number;
  _updated_fields?: string[];

  // ── Allow any additional crawler fields ─────────────────
  [key: string]: unknown;
}

// -------------------------------------------------------
// Normalized Item used internally by the tool.
// Extends RawItem so ALL original crawler fields are preserved.
// Tool-added fields are prefixed with _ to avoid collisions.
// -------------------------------------------------------
export interface Item extends RawItem {
  // ── Identity & tree structure ─────────────────────────
  _internal_id: string;                          // unique id used by the tool
  _entity_key: string;                           // stable database-compatible identity
  _platform: string;                             // canonical platform slug
  _content_type: 'post' | 'comment' | 'reply';  // what type of item this is
  _parent_id: string | null;                     // parent item's _internal_id
  _source: string;                               // normalized source for filtering

  // ── Pre-computed display helpers (typed string) ────────
  _author: string;      // tac_gia (post) | username (comment)
  _posted_at: string;   // thoi_gian_dang (post) | gio_comment (comment)
  _text: string;        // always item.text
  _brand: string;       // item.brand normalized
  _url: string;         // item.url normalized
  _is_address_only: boolean;

  // ── UI-only computed stats ─────────────────────────────
  stats: PlatformStats;
  _loaded_label?: StoredLabel;
}

export interface Thread {
  post: Item;
  comments: Array<{
    comment: Item;
    replies: Item[];
  }>;
  _assignment_id?: string;
  _assignment_entity_key?: string;
  _assigned_entity_keys?: string[];
  _data_source?: 'file' | 'supabase';
}

// -------------------------------------------------------
// Storage schema
// -------------------------------------------------------
export interface StoredLabel extends Label {
  key: string;
  person: Person;
  entity_key: string;
  labeled_by: string;
  labeled_at: string;
  skipped: boolean;
  data_version: number;
}

export interface StoredProgress {
  person: Person;
  current_thread_index: number;
  current_thread_id: string | null;
  last_updated: string;
}

export interface StoredThreadState {
  key: string;
  person: Person;
  thread_id: string;
  status: 'completed' | 'skipped';
  data_version: number;
  version_token: string;
  completed_at: string;
}

// -------------------------------------------------------
// Export schema — Item spread + labels appended
// ExportItem is the full raw item with labels added.
// No fields are renamed or removed.
// -------------------------------------------------------
export interface ExportItem extends RawItem {
  // All RawItem fields inherited (crawler data preserved)

  // Tool fields (underscore prefix)
  _internal_id: string;
  _entity_key: string;
  _platform: string;
  _content_type: 'post' | 'comment' | 'reply';
  _parent_id: string | null;
  _source: string;

  // Label fields appended
  labels: {
    sentiment: Sentiment;
    topic: TopicKey[];
    relevance: boolean | null;
    urgency: Urgency;
    intent: Intent;
  };
  labeled_by: string;
  labeled_at: string;
  labeling_status: 'completed' | 'skipped';
  labeled_version: number;
}

export interface ExportThreadState {
  entity_key: string;
  platform: string;
  post_id: string;
  status: 'completed' | 'skipped';
  completed_at: string;
  data_version: number;
}

export interface ExportPayload {
  exported_at: string;
  labeled_by: string;
  total_labeled: number;
  total_skipped: number;
  summary: {
    positive: number;
    negative: number;
    neutral: number;
    urgent: number;
  };
  items: ExportItem[];
  threads: ExportThreadState[];
}
