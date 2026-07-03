import { Item, Thread, EMPTY_STATS } from '../types';
import { isAddressOnlyText, isGoogleMapsSpam, buildStats } from './parser';

// ============================================================
// Raw crawler JSON schema (nested structure from crawler output)
// ============================================================

export interface RawReply {
  comment_id?: string;
  username?: string;
  text?: string;
  gio_comment?: string;
  gio_cao?: string;
  parent_comment_id?: string | null;
  contact?: string;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RawComment extends RawReply {
  replies?: RawReply[];
}

export interface RawPost {
  post_id?: string;
  tac_gia?: string;          // author
  text?: string;
  nguon_chia?: string;       // source
  brand?: string;
  thoi_gian_dang?: string;   // posted_at
  thoi_gian_cao?: string;    // crawled_at
  url?: string;
  contact?: string;
  extra?: Record<string, unknown>;
  comments?: RawComment[];
  // Fallback English names
  [key: string]: unknown;
}

function canonicalPlatform(raw: Record<string, unknown>, displaySource: string): string {
  let value = String(raw.platform ?? raw.source ?? displaySource)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (value === 'be') {
    value = 'befood';
  }
  return value || 'unknown';
}

function entityKey(
  platform: string,
  type: 'post' | 'comment',
  postId: string,
  commentId?: string,
): string {
  return commentId
    ? `${platform}:${type}:${postId}:${commentId}`
    : `${platform}:${type}:${postId}`;
}

// ============================================================
// Normalize a raw post → Item
// Spreads ALL raw fields and adds _-prefixed tool fields.
// ============================================================
function normalizePost(raw: RawPost, index: number): Item {
  const source = String(raw.nguon_chia ?? raw['source'] ?? '');
  const platform = canonicalPlatform(raw, source);
  const brand  = String(raw.brand ?? '');
  const id     = String(raw.post_id ?? raw['id'] ?? `post_${index}`);
  const stableId = entityKey(platform, 'post', id);
  const text   = String(raw.text ?? raw['original_text'] ?? '');
  const url    = String(raw.url ?? '');
  const author = String(raw.tac_gia ?? raw['author'] ?? '');
  const postedAt = String(raw.thoi_gian_dang ?? raw['posted_at'] ?? '');

  const isReviewPlatform = ['google_maps', 'befood'].includes(platform);
  const isAddressOnly = isReviewPlatform && isAddressOnlyText(text.trim());

  // Build stats from the full raw object (top-level fields + extra)
  const statsRaw: Record<string, unknown> = {
    ...raw,
    extra: raw.extra ?? {},
  };

  return {
    // ── Spread ALL original crawler fields (preserves 100%) ──
    ...raw,

    // ── Tool-managed identity fields ──────────────────────────
    _internal_id: stableId,
    _entity_key: stableId,
    _platform: platform,
    _content_type: 'post',
    _parent_id: null,
    _source: source,

    // ── Pre-computed typed display helpers ────────────────────
    _author: author,
    _posted_at: postedAt,
    _text: text,
    _brand: brand,
    _url: url,
    _is_address_only: isAddressOnly,

    // ── UI stats ──────────────────────────────────────────────
    stats: buildStats(statsRaw, source, 'post'),
  };
}

// ============================================================
// Normalize a raw comment/reply → Item
// Spreads ALL raw fields and adds _-prefixed tool fields.
// ============================================================
function normalizeComment(
  raw: RawComment | RawReply,
  type: 'comment' | 'reply',
  parentId: string,
  postId: string,
  platform: string,
  postSource: string,
  postBrand: string,
  fallbackIndex: number
): Item {
  const id     = String(raw.comment_id ?? `${type}_${fallbackIndex}`);
  const stableId = entityKey(platform, 'comment', postId, id);
  const author = String(raw.username ?? '');
  const text   = String(raw.text ?? '');
  const postedAt = String(raw.gio_comment ?? '');
  const url    = String((raw as Record<string, unknown>).url ?? '');

  // Build stats for this comment
  const statsRaw: Record<string, unknown> = {
    ...raw,
    extra: raw.extra ?? {},
  };

  return {
    // ── Spread ALL original crawler fields ────────────────────
    ...raw,

    // ── Tool-managed identity fields ──────────────────────────
    _internal_id: stableId,
    _entity_key: stableId,
    _platform: platform,
    _content_type: type,
    _parent_id: parentId,
    _source: postSource,

    // ── Pre-computed typed display helpers ────────────────────
    _author: author,
    _posted_at: postedAt,
    _text: text,
    _brand: postBrand,
    _url: url,
    _is_address_only: false,

    // ── UI stats ──────────────────────────────────────────────
    stats: buildStats(statsRaw, postSource, type),
  };
}

// ============================================================
// Parse nested crawler JSON → Thread[]
// ============================================================
export function parseCrawlerJson(rawPosts: RawPost[], filterGMapsSpam = true): Thread[] {
  const threads: Thread[] = [];
  let fallbackIdx = 0;

  for (let pi = 0; pi < rawPosts.length; pi++) {
    const rawPost = rawPosts[pi];
    const postText = String(rawPost.text ?? '').trim();
    const source   = String(rawPost.nguon_chia ?? rawPost['source'] ?? '');
    const srcLower = source.toLowerCase();
    const platform = canonicalPlatform(rawPost, source);
    const isAddressOnly = ['google_maps', 'befood'].includes(platform)
      && isAddressOnlyText(postText);

    if (isAddressOnly) {
      // Address-only: skip if no comments (no reviews to label)
      if (!(rawPost.comments ?? []).length) continue;

      // Build a synthetic post item (marked _is_address_only = true)
      // ALL raw post fields are preserved via spread in normalizePost
      const syntheticPost: Item = {
        ...normalizePost(rawPost, pi),
        _is_address_only: true,
      };
      const postId = String(rawPost.post_id ?? rawPost['id'] ?? `post_${pi}`);

      const comments = (rawPost.comments ?? [])
        .filter(rawComment => {
          if (filterGMapsSpam && (srcLower === 'google maps' || srcLower === 'google_maps')) {
            return !isGoogleMapsSpam(String(rawComment.text ?? ''));
          }
          return true;
        })
        .map(rawComment => {
          const comment = normalizeComment(
            rawComment, 'comment',
            syntheticPost._internal_id, postId, syntheticPost._platform,
            syntheticPost._source, syntheticPost._brand,
            ++fallbackIdx
          );
          const replies = (rawComment.replies ?? []).map(rawReply =>
            normalizeComment(rawReply as RawReply, 'reply', comment._internal_id,
              postId, syntheticPost._platform, syntheticPost._source,
              syntheticPost._brand, ++fallbackIdx)
          );
          return { comment, replies };
        });

      threads.push({ post: syntheticPost, comments });
      continue;
    }

    // Normal post
    const post = normalizePost(rawPost, pi);
    const postId = String(rawPost.post_id ?? rawPost['id'] ?? `post_${pi}`);

    const comments = (rawPost.comments ?? [])
      .filter(rawComment => {
        if (filterGMapsSpam && (srcLower === 'google maps' || srcLower === 'google_maps')) {
          return !isGoogleMapsSpam(String(rawComment.text ?? ''));
        }
        return true;
      })
      .map(rawComment => {
        const comment = normalizeComment(
          rawComment, 'comment',
          post._internal_id, postId, post._platform, post._source, post._brand,
          ++fallbackIdx
        );
        const replies = (rawComment.replies ?? []).map(rawReply =>
          normalizeComment(rawReply as RawReply, 'reply', comment._internal_id,
            postId, post._platform, post._source, post._brand, ++fallbackIdx)
        );
        return { comment, replies };
      });

    threads.push({ post, comments });
  }

  return threads;
}

// ============================================================
// Seed-based LCG shuffle (deterministic, seed=42)
// ============================================================
function lcgShuffle<T>(arr: T[], seed: number = 42): T[] {
  const result = [...arr];
  let state = seed;
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  const rand = () => {
    state = (a * state + c) % m;
    return state / m;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================
// Partition threads by person (legacy — kept for compatibility)
// ============================================================
const TOTAL_SPRINT1 = 784;
const PARTITION_SIZES = [261, 261, 262];

export type PersonKey = 'Person A' | 'Person B' | 'Person C';

function personIndex(person: PersonKey): number {
  return { 'Person A': 0, 'Person B': 1, 'Person C': 2 }[person];
}

export function applyPartition(threads: Thread[], person: PersonKey): {
  threads: Thread[];
  postCount: number;
  itemCount: number;
} {
  const shuffled = lcgShuffle(threads, 42).slice(0, TOTAL_SPRINT1);
  const idx = personIndex(person);
  const start = PARTITION_SIZES.slice(0, idx).reduce((a, b) => a + b, 0);
  const end = start + PARTITION_SIZES[idx];
  const myThreads = shuffled.slice(start, end);

  const itemCount = myThreads.reduce(
    (sum, t) => sum + 1 + t.comments.reduce((s, c) => s + 1 + c.replies.length, 0),
    0
  );

  return { threads: myThreads, postCount: myThreads.length, itemCount };
}

// ============================================================
// Brand highlight helper
// ============================================================
export function highlightBrandSafe(text: string, brand: string): Array<{ text: string; highlight: boolean }> {
  if (!brand || !text) return [{ text, highlight: false }];
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  const lower = brand.toLowerCase();
  return parts.map(part => ({
    text: part,
    highlight: part.toLowerCase() === lower,
  }));
}

export { EMPTY_STATS };
