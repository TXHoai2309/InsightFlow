import {
  ExportPayload,
  ExportItem,
  Person,
  StoredLabel,
  StoredThreadState,
  Thread,
} from '../types';

function itemVersion(item: Thread['post']): number {
  const version = Number(item._data_version ?? 1);
  return Number.isFinite(version) && version > 0 ? version : 1;
}

function threadVersionToken(thread: Thread): string {
  const items = [
    ...(thread.post._is_address_only ? [] : [thread.post]),
    ...thread.comments.flatMap(comment => [comment.comment, ...comment.replies]),
  ];
  return items
    .map(item => `${item._entity_key}@${itemVersion(item)}`)
    .sort()
    .join('|');
}

/**
 * Build export payload.
 *
 * For each labeled item, the export record contains:
 *   1. ALL original crawler fields (spread from Item which extends RawItem)
 *   2. The 4 tool identity fields (_internal_id, _content_type, _parent_id, _source)
 *   3. labels, labeled_by, labeled_at
 *
 * The nested `comments` / `replies` arrays from the raw post are deliberately
 * stripped from the exported post/comment record to avoid redundancy (each
 * comment appears as its own top-level item).
 */
export function buildExport(
  person: Person,
  threads: Thread[],
  allLabels: Record<string, StoredLabel>,
  threadStates: Record<string, StoredThreadState>,
): ExportPayload {
  const items: ExportItem[] = [];

  let totalLabeled = 0;
  let totalSkipped = 0;
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let crisis = 0;

  // Flatten all items in thread order
  const allItems = threads.flatMap(t => [
    t.post,
    ...t.comments.flatMap(c => [c.comment, ...c.replies]),
  ]);

  for (const item of allItems) {
    const stored = allLabels[item._internal_id];
    if (!stored) continue;     // not yet labeled — omit from export

    if (stored.skipped) {
      totalSkipped++;
    } else {
      totalLabeled++;
      if (stored.sentiment === 'positive') positive++;
      else if (stored.sentiment === 'negative') negative++;
      else if (stored.sentiment === 'neutral') neutral++;
      if (stored.urgency === 'crisis') crisis++;
    }

    // Destructure out the fields we don't want in the export:
    // - stats: UI-computed, not original crawler data
    // - _author, _posted_at, _text, _brand, _url, _is_address_only: computed display helpers
    // - comments / replies: nested arrays (redundant since each item is its own export record)
    const {
      stats: _stats,
      _author: __author,
      _posted_at: __posted_at,
      _text: __text,
      _brand: __brand,
      _url: __url,
      _is_address_only: __is_address_only,
      comments: _comments,     // drop nested comment array from post
      replies: _replies,       // drop nested reply array from comment
      ...rawFields
    } = item as Item & { comments?: unknown; replies?: unknown };

    const exportRecord: ExportItem = {
      // All original crawler fields (no renaming, no dropping)
      ...rawFields,

      // Tool identity fields (underscore prefix)
      _internal_id: item._internal_id,
      _entity_key: item._entity_key,
      _platform: item._platform,
      _content_type: item._content_type,
      _parent_id: item._parent_id,
      _source: item._source,

      // Label data appended
      labels: {
        sentiment: stored.sentiment,
        topic: stored.topic,
        relevance: stored.relevance,
        urgency: stored.urgency,
        intent: stored.intent ?? null,
      },
      labeled_by: stored.labeled_by,
      labeled_at: stored.labeled_at,
      labeling_status: stored.skipped ? 'skipped' : 'completed',
      labeled_version: stored.data_version,
    };

    items.push(exportRecord);
  }

  const exportedThreads = threads.flatMap(thread => {
    const state = threadStates[thread.post._entity_key];
    if (!state || state.version_token !== threadVersionToken(thread)) return [];
    return [{
      entity_key: thread.post._entity_key,
      platform: thread.post._platform,
      post_id: String(thread.post.post_id ?? thread.post.id ?? ''),
      status: state.status,
      completed_at: state.completed_at,
      data_version: state.data_version,
    }];
  });

  return {
    exported_at: new Date().toISOString(),
    labeled_by: person,
    total_labeled: totalLabeled,
    total_skipped: totalSkipped,
    summary: { positive, negative, neutral, crisis },
    items,
    threads: exportedThreads,
  };
}

export function downloadJson(payload: ExportPayload, person: Person) {
  const ts = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .slice(0, 15);
  const personSlug = person.replace(' ', '').toLowerCase();
  const filename = `labeled_${personSlug}_${ts}.json`;

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Type alias for local use (Item has extra fields not in ExportItem)
type Item = import('../types').Item;
