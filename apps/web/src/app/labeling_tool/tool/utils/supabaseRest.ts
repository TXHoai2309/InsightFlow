import { isLabelComplete, Item, Label, StoredLabel, Thread } from '../types';
import { parseCrawlerJson, RawComment, RawPost } from './dataPartition';

export type PlatformFilter =
  | 'facebook'
  | 'threads'
  | 'tiktok'
  | 'youtube'
  | 'google_maps'
  | 'befood'
  | 'news';

export type AssignmentView = 'pending' | 'ai_review' | 'completed';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseDateRange {
  from?: string;
  to?: string;
}

export interface PendingAssignmentCounts {
  totalPosts: number;
  totalComments: number;
  posts: number;
  comments: number;
  labeledPosts: number;
  labeledComments: number;
  aiPendingPosts: number;
  aiPendingComments: number;
  completedThreads: number;
}

interface SupabaseAssignment {
  assignment_id: string;
  entity_key: string;
  platform: string;
  entity_type: 'post' | 'comment';
  post_id: string;
  root_comment_id: string | null;
  queue_group: string;
  status: 'unassigned' | 'assigned' | 'completed' | 'skipped' | 'updated_review';
  data_version: number;
  content_hash: string | null;
}

interface SupabasePost {
  platform: string;
  post_id: string;
  url: string | null;
  source: string | null;
  brand_slug: string | null;
  brand: string | null;
  author: string | null;
  contact: string | null;
  language: string | null;
  posted_at: string | null;
  data_version: number;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  view_count: number | null;
  reply_count: number | null;
  star_count: number | null;
  labeling_status: string;
  needs_review: boolean;
  review_reason: string | null;
  payload_json: Record<string, unknown> | null;
}

interface SupabaseComment {
  platform: string;
  post_id: string;
  comment_id: string;
  parent_comment_id: string | null;
  url: string | null;
  username: string | null;
  contact: string | null;
  text: string | null;
  posted_at: string | null;
  data_version: number;
  like_count: number | null;
  reply_count: number | null;
  star_count: number | null;
  comment_level: number;
  labeling_status: string;
  needs_review: boolean;
  review_reason: string | null;
  payload_json: Record<string, unknown> | null;
}

interface SupabaseAnnotation {
  entity_key: string;
  platform: string;
  entity_type: 'post' | 'comment';
  post_id: string;
  comment_id: string | null;
  assignee: string;
  label: string | Record<string, unknown> | null;
  status: 'pending' | 'ai_pending' | 'completed' | 'skipped';
  labeled_version: number;
  needs_review: boolean;
  updated_at: string;
}

const ASSIGNMENT_SELECT = [
  'assignment_id',
  'entity_key',
  'platform',
  'entity_type',
  'post_id',
  'root_comment_id',
  'queue_group',
  'status',
  'data_version',
  'content_hash',
].join(',');

const POST_SELECT = [
  'platform',
  'post_id',
  'url',
  'source',
  'brand_slug',
  'brand',
  'author',
  'contact',
  'language',
  'posted_at',
  'data_version',
  'like_count',
  'comment_count',
  'share_count',
  'view_count',
  'reply_count',
  'star_count',
  'labeling_status',
  'needs_review',
  'review_reason',
  'payload_json',
].join(',');

const COMMENT_SELECT = [
  'platform',
  'post_id',
  'comment_id',
  'parent_comment_id',
  'url',
  'username',
  'contact',
  'text',
  'posted_at',
  'data_version',
  'like_count',
  'reply_count',
  'star_count',
  'comment_level',
  'labeling_status',
  'needs_review',
  'review_reason',
  'payload_json',
].join(',');

const ANNOTATION_SELECT = [
  'entity_key',
  'platform',
  'entity_type',
  'post_id',
  'comment_id',
  'assignee',
  'label',
  'status',
  'labeled_version',
  'needs_review',
  'updated_at',
].join(',');

const LOAD_CONCURRENCY = 4;
const MAX_COMMENTS_PER_POST = 500;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim().replace(/\/rest\/v1\/?$/, '');
  return trimmed.replace(/\/$/, '');
}

function endpoint(config: SupabaseConfig, table: string, query = ''): string {
  const base = normalizeUrl(config.url);
  return `${base}/rest/v1/${table}${query ? `?${query}` : ''}`;
}

async function request<T>(
  config: SupabaseConfig,
  table: string,
  query: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(endpoint(config, table, query), {
    ...init,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${table} ${response.status}: ${message}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function requestExactCount(
  config: SupabaseConfig,
  table: string,
  query: string,
): Promise<number> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(endpoint(config, table, query), {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });
    if (response.ok) {
      const total = response.headers.get('content-range')?.split('/').pop();
      return total && total !== '*' ? Number(total) || 0 : 0;
    }
    const message = await response.text();
    lastError = new Error(`Supabase ${table} ${response.status}: ${message}`);
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
      throw lastError;
    }
    await new Promise(resolve => setTimeout(resolve, 500 * (2 ** (attempt - 1))));
  }
  throw lastError ?? new Error(`Supabase ${table}: count failed`);
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function queueOrder(status: string): number {
  if (status === 'updated_review') return 0;
  if (status === 'unassigned') return 1;
  return 2;
}

function toQueueStatus(status: string): 'unassigned' | 'updated_review' | null {
  return status === 'unassigned' || status === 'updated_review' ? status : null;
}

export async function loadPendingAssignmentCounts(
  config: SupabaseConfig,
  platform: PlatformFilter,
): Promise<PendingAssignmentCounts> {
  const platformFilter = platform === 'news'
    ? 'in.(news,news_html)'
    : platform === 'befood'
      ? 'in.(be,befood)'
      : `eq.${platform}`;

  const annotationBase = {
    select: 'annotation_id',
    platform: platformFilter,
    status: 'in.(completed,skipped)',
    limit: '1',
  };

  const [
    labeledPosts,
    labeledComments,
    aiPendingPosts,
    aiPendingComments,
    totalPosts,
    totalComments,
  ] = await Promise.all([
    requestExactCount(config, 'annotations', new URLSearchParams({
      ...annotationBase,
      entity_type: 'eq.post',
    }).toString()),
    requestExactCount(config, 'annotations', new URLSearchParams({
      ...annotationBase,
      entity_type: 'eq.comment',
    }).toString()),
    requestExactCount(config, 'annotations', new URLSearchParams({
      ...annotationBase,
      status: 'eq.ai_pending',
      entity_type: 'eq.post',
    }).toString()),
    requestExactCount(config, 'annotations', new URLSearchParams({
      ...annotationBase,
      status: 'eq.ai_pending',
      entity_type: 'eq.comment',
    }).toString()),
    requestExactCount(config, 'posts', new URLSearchParams({
      select: 'post_id',
      platform: platformFilter,
      crawl_status: 'eq.active',
      limit: '1',
    }).toString()),
    requestExactCount(config, 'comments', new URLSearchParams({
      select: 'comment_id',
      platform: platformFilter,
      crawl_status: 'eq.active',
      limit: '1',
    }).toString()),
  ]);

  // Assignments and annotations overlap while a labeler is running. Keep the
  // dashboard categories mutually exclusive by deriving remaining work from
  // the crawled entity totals instead of adding queue rows to annotation rows.
  const safeLabeledPosts = Math.min(labeledPosts, totalPosts);
  const safeLabeledComments = Math.min(labeledComments, totalComments);
  const safeAiPendingPosts = Math.min(aiPendingPosts, Math.max(0, totalPosts - safeLabeledPosts));
  const safeAiPendingComments = Math.min(aiPendingComments, Math.max(0, totalComments - safeLabeledComments));
  const unassignedPosts = Math.max(0, totalPosts - safeLabeledPosts - safeAiPendingPosts);
  const unassignedComments = Math.max(0, totalComments - safeLabeledComments - safeAiPendingComments);

  return {
    totalPosts,
    totalComments,
    posts: unassignedPosts,
    comments: unassignedComments,
    labeledPosts: safeLabeledPosts,
    labeledComments: safeLabeledComments,
    aiPendingPosts: safeAiPendingPosts,
    aiPendingComments: safeAiPendingComments,
    completedThreads: safeLabeledPosts,
  };
}

function hasDateRange(dateRange: SupabaseDateRange): boolean {
  return Boolean(dateRange.from || dateRange.to);
}

function parseDateString(iso: string): Date | null {
  if (!iso) return null;
  try {
    const cleanStr = iso.trim();

    // 1. Check HH:mm(:ss) DD/MM/YYYY
    const hmDmYRegex = /^(?:(\d{1,2}):(\d{2})(?::(\d{2}))?\s+)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const matchHmDmY = cleanStr.match(hmDmYRegex);
    if (matchHmDmY) {
      const hour = matchHmDmY[1] ? parseInt(matchHmDmY[1], 10) : 0;
      const minute = matchHmDmY[2] ? parseInt(matchHmDmY[2], 10) : 0;
      const second = matchHmDmY[3] ? parseInt(matchHmDmY[3], 10) : 0;
      const day = parseInt(matchHmDmY[4], 10);
      const month = parseInt(matchHmDmY[5], 10) - 1; // 0-indexed
      const year = parseInt(matchHmDmY[6], 10);
      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Check DD/MM/YYYY HH:mm(:ss)
    const dmYRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const matchDmY = cleanStr.match(dmYRegex);
    if (matchDmY) {
      const day = parseInt(matchDmY[1], 10);
      const month = parseInt(matchDmY[2], 10) - 1;
      const year = parseInt(matchDmY[3], 10);
      const hour = matchDmY[4] ? parseInt(matchDmY[4], 10) : 0;
      const minute = matchDmY[5] ? parseInt(matchDmY[5], 10) : 0;
      const second = matchDmY[6] ? parseInt(matchDmY[6], 10) : 0;
      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }

    // 3. Check YYYY-MM-DD HH:mm(:ss)
    const YmdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const matchYmd = cleanStr.match(YmdRegex);
    if (matchYmd) {
      const year = parseInt(matchYmd[1], 10);
      const month = parseInt(matchYmd[2], 10) - 1;
      const day = parseInt(matchYmd[3], 10);
      const hour = matchYmd[4] ? parseInt(matchYmd[4], 10) : 0;
      const minute = matchYmd[5] ? parseInt(matchYmd[5], 10) : 0;
      const second = matchYmd[6] ? parseInt(matchYmd[6], 10) : 0;
      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }

    const fallback = new Date(iso);
    return isNaN(fallback.getTime()) ? null : fallback;
  } catch {
    return null;
  }
}

function isWithinDateRange(value: string | null | undefined, dateRange: SupabaseDateRange): boolean {
  if (!hasDateRange(dateRange)) return true;
  if (!value) return false;
  const dateVal = parseDateString(value);
  if (!dateVal) return false;
  const time = dateVal.getTime();
  if (dateRange.from) {
    const from = new Date(`${dateRange.from}T00:00:00`).getTime();
    if (time < from) return false;
  }
  if (dateRange.to) {
    const to = new Date(`${dateRange.to}T23:59:59.999`).getTime();
    if (time > to) return false;
  }
  return true;
}

function commentIdFromAssignment(assignment: SupabaseAssignment): string | null {
  if (assignment.root_comment_id) return assignment.root_comment_id;
  const parts = assignment.entity_key.split(':');
  return parts.length >= 4 ? parts[parts.length - 1] : null;
}

function assignmentPostedAt(
  assignment: SupabaseAssignment,
  post: SupabasePost,
  comments: SupabaseComment[],
): string | null {
  if (assignment.entity_type === 'post') return post.posted_at;
  const commentId = commentIdFromAssignment(assignment);
  if (!commentId) return null;
  return comments.find(comment => comment.comment_id === commentId)?.posted_at ?? null;
}

async function loadAssignmentCommentPostedAt(
  config: SupabaseConfig,
  assignment: SupabaseAssignment,
  signal?: AbortSignal,
): Promise<string | null> {
  const commentId = commentIdFromAssignment(assignment);
  if (!commentId) return null;
  const platform = assignment.platform;
  const platformQuery = platform === 'news' || platform === 'news_html'
    ? 'in.(news,news_html)'
    : platform === 'be' || platform === 'befood'
      ? 'in.(be,befood)'
      : `eq.${platform}`;

  const query = new URLSearchParams({
    select: 'posted_at,payload_json',
    platform: platformQuery,
    post_id: `eq.${assignment.post_id}`,
    comment_id: `eq.${commentId}`,
    limit: '1',
  }).toString();
  const rows = await request<Array<Pick<SupabaseComment, 'posted_at' | 'payload_json'>>>(
    config,
    'comments',
    query,
    { signal },
  );
  const row = rows[0];
  if (!row) return null;
  return row.posted_at ?? (row.payload_json?.posted_at as string | null) ?? null;
}
function postRowToRaw(row: SupabasePost): RawPost {
  const payload = row.payload_json ?? {};
  return {
    ...payload,
    platform: row.platform,
    post_id: row.post_id,
    url: row.url ?? String(payload.url ?? ''),
    source: row.source ?? String(payload.source ?? ''),
    nguon_chia: row.source ?? String(payload.nguon_chia ?? payload.source ?? row.platform),
    brand: row.brand ?? String(payload.brand ?? row.brand_slug ?? ''),
    tac_gia: row.author ?? String(payload.tac_gia ?? payload.author ?? ''),
    contact: row.contact ?? String(payload.contact ?? ''),
    ngon_ngu_bai_viet: row.language ?? String(payload.ngon_ngu_bai_viet ?? ''),
    thoi_gian_dang: row.posted_at ?? String(payload.thoi_gian_dang ?? payload.posted_at ?? ''),
    text: String(payload.text ?? ''),
    like_count: row.like_count ?? Number(payload.like_count ?? 0),
    cmt_count: row.comment_count ?? Number(payload.cmt_count ?? payload.comment_count ?? 0),
    share_count: row.share_count ?? Number(payload.share_count ?? 0),
    view_count: row.view_count ?? Number(payload.view_count ?? 0),
    reply_count: row.reply_count ?? Number(payload.reply_count ?? 0),
    star_count: row.star_count ?? (payload.star_count as number | undefined),
    _queue_status: row.needs_review ? 'updated_review' : (row.labeling_status as RawPost['_queue_status']),
    _data_version: row.data_version,
    comments: [],
  };
}

function commentRowToRaw(row: SupabaseComment): RawComment {
  const payload = row.payload_json ?? {};
  return {
    ...payload,
    platform: row.platform,
    post_id: row.post_id,
    comment_id: row.comment_id,
    parent_comment_id: row.parent_comment_id,
    url: row.url ?? String(payload.url ?? ''),
    username: row.username ?? String(payload.username ?? ''),
    contact: row.contact ?? String(payload.contact ?? ''),
    text: row.text ?? String(payload.text ?? ''),
    gio_comment: row.posted_at ?? String(payload.gio_comment ?? payload.posted_at ?? ''),
    like_count: row.like_count ?? Number(payload.like_count ?? 0),
    reply_count: row.reply_count ?? Number(payload.reply_count ?? 0),
    star_count: row.star_count ?? (payload.star_count as number | undefined),
    comment_level: row.comment_level,
    _queue_status: row.needs_review ? 'updated_review' : (row.labeling_status as RawComment['_queue_status']),
    _data_version: row.data_version,
    replies: [],
  };
}

function buildRawPost(post: SupabasePost, comments: SupabaseComment[]): RawPost {
  const rawPost = postRowToRaw(post);
  const rawComments = comments.map(commentRowToRaw);
  const byId = new Map(rawComments.map(comment => [String(comment.comment_id), comment]));
  const roots: RawComment[] = [];

  for (const comment of rawComments) {
    const parentId = comment.parent_comment_id ? String(comment.parent_comment_id) : '';
    const parent = parentId ? byId.get(parentId) : null;
    if (parent) {
      parent.replies = [...(parent.replies ?? []), comment];
    } else {
      roots.push(comment);
    }
  }

  rawPost.comments = roots;
  return rawPost;
}

function threadItems(thread: Thread): Item[] {
  return [
    thread.post,
    ...thread.comments.flatMap(entry => [entry.comment, ...entry.replies]),
  ];
}

function annotationToStoredLabel(row: SupabaseAnnotation): StoredLabel | null {
  try {
    const value = typeof row.label === 'string' ? JSON.parse(row.label) : row.label;
    if (!value || typeof value !== 'object') return null;
    const label = value as Partial<Label>;
    return {
      key: `${row.assignee}|${row.entity_key}`,
      person: row.assignee as StoredLabel['person'],
      entity_key: row.entity_key,
      labeled_by: row.assignee,
      labeled_at: row.updated_at,
      skipped: row.status === 'skipped' || (value as { skipped?: boolean }).skipped === true,
      data_version: row.labeled_version,
      sentiment: label.sentiment ?? null,
      topic: Array.isArray(label.topic) ? label.topic : [],
      relevance: label.relevance ?? null,
      urgency: label.urgency ?? null,
      intent: label.intent ?? null,
    };
  } catch {
    return null;
  }
}

export async function loadSupabaseThreads(
  config: SupabaseConfig,
  platform: PlatformFilter,
  limit: number,
  assignmentView: AssignmentView = 'pending',
  dateRange: SupabaseDateRange = {},
  brand?: string,
  signal?: AbortSignal,
): Promise<Thread[]> {
  const platformFilter = platform === 'news'
    ? 'in.(news,news_html)'
    : platform === 'befood'
      ? 'in.(be,befood)'
      : `eq.${platform}`;
  const threads: Thread[] = [];
  const includedPostKeys = new Set<string>();
  const needsClientFilter = hasDateRange(dateRange) || (brand && brand !== 'all');
  const pageSize = needsClientFilter
    ? Math.min(Math.max(limit * 3, 30), 100)
    : Math.min(limit, 50);
  let offset = 0;
  let exhausted = false;

  while (!exhausted && threads.length < limit) {
    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }
    let assignments: SupabaseAssignment[];
    if (assignmentView === 'completed' || assignmentView === 'ai_review') {
      // Gemini writes completed labels directly to annotations. Some historical
      // rows do not have a matching completed assignment, so annotations must
      // be the source of truth for the completed view.
      const annotationParams = new URLSearchParams({
        select: ANNOTATION_SELECT,
        platform: platformFilter,
        status: assignmentView === 'ai_review'
          ? 'eq.ai_pending'
          : 'in.(completed,skipped)',
        limit: String(pageSize),
        offset: String(offset),
        order: 'updated_at.desc',
      });
      if (assignmentView === 'completed') {
        annotationParams.set('entity_type', 'eq.post');
      }
      const completedAnnotations = await request<SupabaseAnnotation[]>(
        config,
        'annotations',
        annotationParams.toString(),
        { signal },
      );
      assignments = completedAnnotations.map(annotation => ({
        assignment_id: '',
        entity_key: annotation.entity_key,
        platform: annotation.platform,
        entity_type: annotation.entity_type,
        post_id: annotation.post_id,
        root_comment_id: annotation.comment_id,
        queue_group: '',
        status: annotation.status === 'skipped' ? 'skipped' : 'completed',
        data_version: annotation.labeled_version,
        content_hash: null,
      }));
    } else {
      const assignmentParams = new URLSearchParams({
        select: ASSIGNMENT_SELECT,
        platform: platformFilter,
        status: 'in.(updated_review,unassigned)',
        limit: String(pageSize),
        offset: String(offset),
        order: 'updated_at.desc',
      });
      assignments = await request<SupabaseAssignment[]>(
        config,
        'labeling_assignments',
        assignmentParams.toString(),
        { signal },
      );
    }
    assignments.sort((a, b) => queueOrder(a.status) - queueOrder(b.status));
    exhausted = assignments.length < pageSize;
    offset += assignments.length;

    const postIds = assignments.map(a => a.post_id);
    const uniquePostIds = Array.from(new Set(postIds));
    const postsList = uniquePostIds.length > 0
      ? await request<SupabasePost[]>(
          config,
          'posts',
          `select=${POST_SELECT}&platform=${platformFilter}&post_id=in.(${uniquePostIds.map(encode).join(',')})&crawl_status=eq.active`,
          { signal }
        )
      : [];
    const postMap = new Map(postsList.map(p => [p.post_id, p]));

    const results = await mapWithConcurrency(assignments, LOAD_CONCURRENCY, async (assignment) => {
      const postKey = `${assignment.platform}:${assignment.post_id}`;
      if (includedPostKeys.has(postKey)) return null;

      const post = postMap.get(assignment.post_id);
      if (!post) return null;

      // Brand filter check first
      if (brand && brand !== 'all') {
        const clean = (s: string) => s.toLowerCase().replace(/[\s-_]+/g, '').replace(/s$/, '');
        const target = clean(brand);
        const postBrand = clean(post.brand || '');
        const postBrandSlug = clean(post.brand_slug || '');
        if (!postBrand.includes(target) && !postBrandSlug.includes(target)) {
          return null;
        }
      }

      // Date range check
      let finalPostedAt = post.posted_at;
      let assignedPostedAt: string | null = null;
      if (assignment.entity_type === 'comment') {
        assignedPostedAt = await loadAssignmentCommentPostedAt(config, assignment, signal);
        finalPostedAt = assignedPostedAt;
      }
      const isReviewPlatform = ['google_maps', 'befood', 'be'].includes(assignment.platform);
      const shouldCheckDate = !(assignment.entity_type === 'post' && isReviewPlatform);
      if (shouldCheckDate && !isWithinDateRange(finalPostedAt, dateRange)) return null;

      // Lazily fetch comments and annotations in parallel only if the post matches brand/date filters!
      const annoPlatform = (assignment.platform === 'befood' || assignment.platform === 'be')
        ? 'in.(be,befood)'
        : `eq.${assignment.platform}`;
      const annotationQuery = new URLSearchParams({
        select: ANNOTATION_SELECT,
        platform: annoPlatform,
        post_id: `eq.${assignment.post_id}`,
        order: 'updated_at.desc',
      }).toString();

      const [comments, annotations] = await Promise.all([
        loadPostComments(
          config,
          assignment.platform,
          assignment.post_id,
          signal,
          commentIdFromAssignment(assignment),
        ),
        request<SupabaseAnnotation[]>(config, 'annotations', annotationQuery, { signal }),
      ]);

      const parsed = parseCrawlerJson([buildRawPost(post, comments)], false)[0];
      if (!parsed) return null;

      const postAssignments = assignments.filter(a => a.post_id === assignment.post_id);

      if (assignmentView === 'completed' && annotations.length === 0 && assignment.assignment_id) {
        await resetSupabaseAssignment(config, assignment.assignment_id);
        return null;
      }

      const annotationByEntity = new Map<string, SupabaseAnnotation>();
      for (const annotation of annotations) {
        const entityKey = annotation.entity_key.replace(/^be:/, 'befood:');
        // The response is newest-first, so keep the first label for each entity.
        if (!annotationByEntity.has(entityKey)) {
          annotationByEntity.set(entityKey, annotation);
        }
      }

      const activeAssignments = assignmentView === 'pending'
        ? postAssignments.filter(candidate => {
            const entityKey = candidate.entity_key.replace(/^be:/, 'befood:');
            const annotation = annotationByEntity.get(entityKey);
            return !annotation || annotation.labeled_version < candidate.data_version;
          })
        : postAssignments;
      if (assignmentView === 'pending' && activeAssignments.length === 0) {
        return null;
      }

      const activeAssignment = activeAssignments[0] ?? assignment;
      parsed._assignment_id = activeAssignment.assignment_id;
      parsed._assignment_entity_key = activeAssignment.entity_key;
      parsed._assigned_entity_keys = activeAssignments.map(
        candidate => candidate.entity_key.replace(/^be:/, 'befood:'),
      );
      parsed._data_source = 'supabase';
      parsed.post._queue_status = toQueueStatus(activeAssignment.status);
      parsed.post._data_version = post.data_version;

      for (const item of threadItems(parsed)) {
        const annotation = annotationByEntity.get(item._entity_key);
        const loadedLabel = annotation ? annotationToStoredLabel(annotation) : null;
        if (loadedLabel) {
          item._loaded_label = loadedLabel;
          item._annotation_status = annotation?.status;
        }
      }
      return { postKey, parsed };
    });
    for (const res of results) {
      if (res && !includedPostKeys.has(res.postKey)) {
        includedPostKeys.add(res.postKey);
        threads.push(res.parsed);
        if (threads.length >= limit) break;
      }
    }
  }

  threads.sort((a, b) => {
    const statusOrderA = queueOrder(a.post._queue_status || '');
    const statusOrderB = queueOrder(b.post._queue_status || '');
    if (statusOrderA !== statusOrderB) {
      return statusOrderA - statusOrderB;
    }
    const timeA = a.post._posted_at ? new Date(a.post._posted_at).getTime() : 0;
    const timeB = b.post._posted_at ? new Date(b.post._posted_at).getTime() : 0;
    return timeB - timeA;
  });

  return threads;
}

async function loadPostComments(
  config: SupabaseConfig,
  platform: string,
  postId: string,
  signal?: AbortSignal,
  focusedCommentId?: string | null,
): Promise<SupabaseComment[]> {
  const all: SupabaseComment[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (all.length < MAX_COMMENTS_PER_POST) {
    const currentPageSize = Math.min(pageSize, MAX_COMMENTS_PER_POST - all.length);
    const commentsQuery = `select=${COMMENT_SELECT}&platform=eq.${encode(platform)}&post_id=eq.${encode(postId)}&crawl_status=eq.active&order=comment_level.asc,posted_at.asc&limit=${currentPageSize}&offset=${offset}`;
    const page = await request<SupabaseComment[]>(config, 'comments', commentsQuery, { signal });
    all.push(...page);
    if (page.length < currentPageSize) break;
    offset += pageSize;
  }

  if (focusedCommentId && !all.some(comment => comment.comment_id === focusedCommentId)) {
    const focusedQuery = `select=${COMMENT_SELECT}&platform=eq.${encode(platform)}&post_id=eq.${encode(postId)}&comment_id=eq.${encode(focusedCommentId)}&crawl_status=eq.active&limit=1`;
    const focused = await request<SupabaseComment[]>(config, 'comments', focusedQuery, { signal });
    all.push(...focused.filter(comment => !all.some(existing => existing.comment_id === comment.comment_id)));
  }

  return all;
}

async function digest(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function saveSupabaseAnnotation(
  config: SupabaseConfig,
  params: {
    entityKey: string;
    platform: string;
    entityType: 'post' | 'comment' | 'reply';
    postId: string;
    commentId?: string | null;
    assignee: string;
    label: Label;
    dataVersion: number;
    skipped: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const mappedEntityKey = params.entityKey.replace(/^befood:/, 'be:');
  const mappedPlatform = params.platform === 'befood' ? 'be' : params.platform;
  const annotationId = (await digest(`${params.assignee}|${mappedEntityKey}`)).slice(0, 32);
  const labelJson = JSON.stringify(params.label);
  const status = params.skipped
    ? 'skipped'
    : isLabelComplete(params.label) ? 'completed' : 'pending';
  const row = {
    annotation_id: annotationId,
    entity_key: mappedEntityKey,
    platform: mappedPlatform,
    entity_type: params.entityType === 'reply' ? 'comment' : params.entityType,
    post_id: params.postId,
    comment_id: params.commentId ?? null,
    assignee: params.assignee,
    label: labelJson,
    note: null,
    status,
    labeled_version: params.dataVersion,
    needs_review: false,
    updated_at: now,
  };
  await request<void>(
    config,
    'annotations',
    `on_conflict=entity_key,assignee`,
    {
      method: 'POST',
      body: JSON.stringify([row]),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    },
  );

  await request<void>(
    config,
    'annotation_revisions',
    '',
    {
      method: 'POST',
      body: JSON.stringify([{
        revision_id: `${annotationId}_${Date.now()}`,
        annotation_id: annotationId,
        revision: Math.floor(Date.now() / 1000),
        data_version: params.dataVersion,
        label: labelJson,
        note: null,
        annotator: params.assignee,
        created_at: now,
      }]),
      headers: { Prefer: 'return=minimal' },
    },
  );
}

export async function approveSupabaseAiAnnotations(
  config: SupabaseConfig,
  items: Array<{
    entityKey: string;
    label: Label & { skipped?: boolean };
  }>,
  reviewer = 'InsightFlow Admin',
): Promise<number> {
  if (items.length === 0) return 0;
  const approved = await request<number>(
    config,
    'rpc/approve_ai_annotations',
    '',
    {
      method: 'POST',
      body: JSON.stringify({
        p_items: items.map(item => ({
          entity_key: item.entityKey.replace(/^befood:/, 'be:'),
          label: item.label,
        })),
        p_reviewer: reviewer,
      }),
      headers: { Prefer: 'return=representation' },
    },
  );
  return Number(approved) || 0;
}

export async function updateSupabaseAssignment(
  config: SupabaseConfig,
  assignmentId: string,
  status: 'completed' | 'skipped',
): Promise<void> {
  const now = new Date().toISOString();
  await request<void>(
    config,
    'labeling_assignments',
    `assignment_id=eq.${encode(assignmentId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        completed_at: now,
        updated_at: now,
      }),
      headers: { Prefer: 'return=minimal' },
    },
  );
}

export async function updateSupabasePostAssignments(
  config: SupabaseConfig,
  platform: string,
  postId: string,
  status: 'completed' | 'skipped',
): Promise<void> {
  const now = new Date().toISOString();
  const query = new URLSearchParams({
    platform: platform === 'befood' || platform === 'be' ? 'in.(be,befood)' : `eq.${platform}`,
    post_id: `eq.${postId}`,
    status: 'in.(unassigned,assigned,updated_review)',
  }).toString();
  await request<void>(
    config,
    'labeling_assignments',
    query,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        completed_at: now,
        updated_at: now,
      }),
      headers: { Prefer: 'return=minimal' },
    },
  );
}

export async function resetSupabaseAssignment(
  config: SupabaseConfig,
  assignmentId: string,
): Promise<void> {
  await request<void>(
    config,
    'labeling_assignments',
    `assignment_id=eq.${encode(assignmentId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'unassigned',
        assigned_at: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      }),
      headers: { Prefer: 'return=minimal' },
    },
  );
}
