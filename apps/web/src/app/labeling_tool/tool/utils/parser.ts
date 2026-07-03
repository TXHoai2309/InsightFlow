/**
 * src/utils/parser.ts
 * 
 * Helpers for:
 *   1. Detecting address-only post text (Google Maps / BeFood)
 *   2. Formatting source-specific extra fields for display
 *   3. Building unified PlatformStats from raw crawler data
 *   4. Google Maps UI spam detection
 */

import { PlatformStats, EMPTY_STATS } from '../types';

// ============================================================
// 1. Address-only text detection
// ============================================================

/**
 * Google Maps posts are "address-only" when the text contains
 * the special location pin character (\ue0c8) that Google Maps
 * injects into branch listing texts, like:
 *   "Mixue 84A Đàm Quang Trung - \ue0c8\n84a P. Đàm Quang Trung..."
 *
 * BeFood posts are "address-only" when the text is just a
 * restaurant name + "\n" + full address string (no review content).
 * Detection: text has exactly 1 newline, no punctuation-terminated
 * sentences, and contains known address markers.
 */

const ADDRESS_MARKERS = [
  'Phường', 'Quận', 'Huyện', 'Đường', 'Phố',
  'Hà Nội', 'TP.HCM', 'Việt Nam', 'Xã', 'Thị trấn',
  'Hồ Chí Minh', 'Thành phố', 'tỉnh',
];

/** A line looks like a Vietnamese address: has multiple commas and address markers */
function isAddressLine(line: string): boolean {
  const hasMarker = ADDRESS_MARKERS.some(m => line.includes(m));
  const hasCommas = (line.match(/,/g) ?? []).length >= 1;
  const hasSentencePunct = /[.!?]/.test(line);
  return hasMarker && hasCommas && !hasSentencePunct;
}

const GOOGLE_MAPS_PIN_CHAR = '\ue0c8';

/** Check if text is purely a branch name + address (no review content). */
export function isAddressOnlyText(text: string): boolean {
  if (!text || text.length === 0) return true;

  // Google Maps: contains the location pin unicode character
  if (text.includes(GOOGLE_MAPS_PIN_CHAR)) return true;

  // Short text (< 80 chars) that contains address markers → likely address
  if (text.length < 80) {
    const hasAddressMarker = ADDRESS_MARKERS.some(m => text.includes(m));
    if (hasAddressMarker) return true;
  }

  // 2-line pattern: line 1 = branch name, line 2 = address
  // Works for both BeFood (>80 chars) and longer Google Maps entries
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length <= 2 && lines.length >= 1) {
    const secondLine = lines[1] ?? '';
    if (secondLine && isAddressLine(secondLine)) return true;
    // Single line that is itself an address
    if (lines.length === 1 && isAddressLine(lines[0])) return true;
  }

  return false;
}

// ============================================================
// 2. Google Maps UI spam detection
// ============================================================

/**
 * These strings appear in Google Maps footer/UI elements that
 * get mistakenly crawled alongside review text. If a comment
 * contains any of these fixed phrases, it is UI spam.
 */
const GOOGLE_MAPS_SPAM_PHRASES = [
  'Đăng nhập',
  'Dữ liệu bản đồ',
  'Điều khoản',
  'Quyền riêng tư',
  'Gửi ý kiến phản hồi',
];

/** Returns true if this comment text is a Google Maps UI artifact (spam). */
export function isGoogleMapsSpam(text: string): boolean {
  if (!text) return false;
  return GOOGLE_MAPS_SPAM_PHRASES.some(phrase => text.includes(phrase));
}

// ============================================================
// 3. Number formatting helpers
// ============================================================

/** Format large numbers: 1200 → "1.2K", 1_500_000 → "1.5M" */
export function formatCount(n: number | string | undefined | null): string {
  if (n === null || n === undefined) return '0';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(num));
}

// ============================================================
// 4. buildStats — unified platform stats from raw crawler item
// ============================================================

type RawLike = Record<string, unknown>;

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  return 0;
}

function numOrNull(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? null : n; }
  return null;
}

/**
 * Build a PlatformStats object from a raw crawler item (post or comment).
 *
 * @param raw  - the raw post/comment object (top-level keys + optional .extra)
 * @param source - normalised source string (lowercase)
 * @param contentType - 'post' | 'comment' | 'reply'
 */
export function buildStats(
  raw: RawLike,
  source: string,
  contentType: 'post' | 'comment' | 'reply'
): PlatformStats {
  const src = source.toLowerCase();
  const extra = (raw.extra ?? {}) as RawLike;

  // Helper: get field from raw first, then extra
  const get = (key: string): unknown => raw[key] ?? extra[key];

  const stats: PlatformStats = { ...EMPTY_STATS };

  // ── COMMENT / REPLY level ─────────────────────────────────
  if (contentType === 'comment' || contentType === 'reply') {
    if (src === 'google maps' || src === 'google_maps' || src === 'befood') {
      // Review-level star rating from raw.star_count or extra.rating
      const ratingRaw = get('star_count') ?? get('rating');
      stats.star_count = numOrNull(ratingRaw);
      stats.like_count = num(get('like_count'));
    } else {
      // TikTok / Facebook / Threads / YouTube comment
      stats.like_count = num(get('like_count'));
      stats.comment_count = num(get('reply_count'));  // replies to this comment
    }
    return stats;
  }

  // ── POST level — per-source mapping ──────────────────────
  if (src === 'tiktok') {
    stats.like_count      = num(get('like_count'));
    stats.comment_count   = num(get('cmt_count'));
    const crawled = get('crawled_cmt_count');
    stats.comment_crawled = crawled !== undefined && crawled !== null
      ? num(crawled) : num(get('cmt_count'));
    stats.share_count     = numOrNull(get('share_count'));
    stats.view_count      = numOrNull(get('view_count'));
    stats.star_count      = null;
    stats.repost_count    = null;

  } else if (src === 'facebook') {
    stats.like_count    = num(get('like_count'));
    const cmt = get('cmt_count');
    stats.comment_count = cmt !== undefined && cmt !== null
      ? num(cmt) : num(get('reply_count'));
    stats.share_count   = numOrNull(get('share_count'));
    stats.view_count    = null;
    stats.star_count    = null;
    stats.repost_count  = null;

  } else if (src === 'threads') {
    stats.like_count    = num(get('like_count'));
    stats.comment_count = num(get('reply_count'));
    stats.share_count   = numOrNull(get('share_count'));
    stats.repost_count  = numOrNull(get('repost_count'));
    stats.view_count    = null;
    stats.star_count    = null;

  } else if (src === 'youtube') {
    stats.like_count    = num(get('like_count'));
    stats.comment_count = num(get('reply_count'));
    stats.view_count    = numOrNull(get('view_count'));
    stats.share_count   = null;
    stats.repost_count  = null;
    stats.star_count    = null;

  } else if (src === 'google maps' || src === 'google_maps') {
    stats.star_count          = numOrNull(get('star_count'));
    stats.comment_count       = num(get('cmt_count'));
    stats.comment_crawled     = num(get('crawled_cmt_count'));
    stats.review_count_total  = numOrNull(get('cmt_count'));
    stats.like_count          = 0;
    stats.view_count          = null;
    stats.share_count         = null;
    stats.repost_count        = null;

  } else if (src === 'befood') {
    // star_count may live in raw top-level or extra.rating
    const rating = get('star_count') ?? extra.rating;
    stats.star_count          = numOrNull(rating);
    stats.comment_count       = num(get('cmt_count'));
    stats.comment_crawled     = num(get('crawled_cmt_count'));
    stats.review_count_total  = numOrNull(get('cmt_count'));
    stats.like_count          = 0;
    stats.view_count          = null;
    stats.share_count         = null;
    stats.repost_count        = null;

  } else {
    // Generic fallback
    stats.like_count    = num(get('like_count'));
    stats.comment_count = num(get('cmt_count') ?? get('reply_count'));
    stats.share_count   = numOrNull(get('share_count'));
    stats.view_count    = numOrNull(get('view_count'));
  }

  return stats;
}

// ============================================================
// 5. Source-specific extra field extractors (legacy — kept for compat)
// ============================================================

export interface GoogleMapsReviewExtra {
  rating?: number | null;
}

export interface BeeFoodPostExtra {
  rating?: string | number | null;
  review_count_total?: string | number | null;
  branch_area?: string | null;
  address?: string | null;
  restaurant_name?: string | null;
}

export interface BeeFoodCommentExtra {
  rating?: number | null;
  source?: string | null;
}

export interface TikTokPostExtra {
  view_count?: number | null;
  share_count?: number | null;
}

/** Extract Google Maps review rating from comment.extra */
export function getGoogleMapsRating(extra: Record<string, unknown>): number | null {
  const r = extra?.rating;
  if (typeof r === 'number') return r;
  if (typeof r === 'string') {
    const n = parseFloat(r);
    return isNaN(n) ? null : n;
  }
  return null;
}

/** Extract BeFood post-level info from post.extra */
export function getBeeFoodPostInfo(extra: Record<string, unknown>): BeeFoodPostExtra | null {
  if (!extra) return null;
  const rating = extra.rating;
  const review_count = extra.review_count_total;
  if (rating === undefined && review_count === undefined) return null;
  return {
    rating: rating as string | number | null,
    review_count_total: review_count as string | number | null,
    branch_area: (extra.branch_area as string) ?? null,
    address: (extra.address as string) ?? null,
    restaurant_name: (extra.restaurant_name as string) ?? null,
  };
}

/** Extract BeFood comment-level rating from comment.extra */
export function getBeeFoodCommentRating(extra: Record<string, unknown>): { rating: number | null; isApi: boolean } {
  const r = extra?.rating;
  const rating = typeof r === 'number' ? r : (typeof r === 'string' ? parseFloat(r) : null);
  const isApi = extra?.source === 'api';
  return { rating: isNaN(rating as number) ? null : rating, isApi };
}

/** Extract TikTok post stats */
export function getTikTokStats(extra: Record<string, unknown>): TikTokPostExtra | null {
  const vc = extra?.view_count;
  const sc = extra?.share_count;
  if (vc === undefined && sc === undefined) return null;
  return {
    view_count: (vc as number) ?? 0,
    share_count: (sc as number) ?? 0,
  };
}
