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

export type AssignmentView = 'pending' | 'completed';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
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
  assignee: string;
  label: string | Record<string, unknown> | null;
  status: 'pending' | 'completed' | 'skipped';
  labeled_version: number;
  needs_review: boolean;
  updated_at: string;
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
      skipped: row.status === 'skipped',
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
  assignee = 'Person A',
): Promise<Thread[]> {
  const platformFilter = platform === 'news'
    ? 'in.(news,news_html)'
    : `eq.${platform}`;
  const assignmentQuery = new URLSearchParams({
    select: '*',
    platform: platformFilter,
    status: assignmentView === 'completed'
      ? 'eq.completed'
      : 'in.(updated_review,unassigned)',
    limit: String(limit),
    order: assignmentView === 'completed' ? 'updated_at.desc' : 'updated_at.asc',
  }).toString();
  const assignments = await request<SupabaseAssignment[]>(
    config,
    'labeling_assignments',
    assignmentQuery,
  );
  assignments.sort((a, b) => queueOrder(a.status) - queueOrder(b.status));

  const threads: Thread[] = [];
  for (const assignment of assignments) {
    const postQuery = `select=*&platform=eq.${encode(assignment.platform)}&post_id=eq.${encode(assignment.post_id)}&limit=1`;
    const posts = await request<SupabasePost[]>(config, 'posts', postQuery);
    const post = posts[0];
    if (!post) continue;

    const comments = await loadPostComments(config, assignment.platform, assignment.post_id);
    const parsed = parseCrawlerJson([buildRawPost(post, comments)], false)[0];
    if (!parsed) continue;

    parsed._assignment_id = assignment.assignment_id;
    parsed._assignment_entity_key = assignment.entity_key;
    parsed._data_source = 'supabase';
    parsed.post._queue_status = toQueueStatus(assignment.status);
    parsed.post._data_version = post.data_version;

    const annotationQuery = new URLSearchParams({
      select: 'entity_key,assignee,label,status,labeled_version,needs_review,updated_at',
      platform: `eq.${assignment.platform}`,
      post_id: `eq.${assignment.post_id}`,
      assignee: `eq.${assignee}`,
    }).toString();
    const annotations = await request<SupabaseAnnotation[]>(
      config,
      'annotations',
      annotationQuery,
    );
    if (assignmentView === 'completed' && annotations.length === 0) {
      await resetSupabaseAssignment(config, assignment.assignment_id);
      continue;
    }
    const annotationByEntity = new Map(
      annotations.map(annotation => [annotation.entity_key, annotation]),
    );
    for (const item of threadItems(parsed)) {
      const annotation = annotationByEntity.get(item._entity_key);
      const loadedLabel = annotation ? annotationToStoredLabel(annotation) : null;
      if (loadedLabel) item._loaded_label = loadedLabel;
    }
    threads.push(parsed);
  }
  return threads;
}

async function loadPostComments(
  config: SupabaseConfig,
  platform: string,
  postId: string,
): Promise<SupabaseComment[]> {
  const all: SupabaseComment[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const commentsQuery = `select=*&platform=eq.${encode(platform)}&post_id=eq.${encode(postId)}&order=comment_level.asc,posted_at.asc&limit=${pageSize}&offset=${offset}`;
    const page = await request<SupabaseComment[]>(config, 'comments', commentsQuery);
    all.push(...page);
    if (page.length < pageSize) return all;
    offset += pageSize;
  }
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
  const annotationId = (await digest(`${params.assignee}|${params.entityKey}`)).slice(0, 32);
  const labelJson = JSON.stringify(params.label);
  const status = params.skipped
    ? 'skipped'
    : isLabelComplete(params.label) ? 'completed' : 'pending';
  const row = {
    annotation_id: annotationId,
    entity_key: params.entityKey,
    platform: params.platform,
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
        revision: Date.now(),
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
