import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EMPTY_LABEL,
  Item,
  Label,
  Person,
  StoredLabel,
  StoredThreadState,
  Thread,
  isLabelComplete,
} from '../types';
import {
  computeStats,
  getAllLabels,
  getProgress,
  getThreadStates,
  LabelStats,
  saveLabel,
  saveProgress,
  saveThreadState,
} from '../utils/storage';
import {
  saveSupabaseAnnotation,
  SupabaseConfig,
  updateSupabaseAssignment,
} from '../utils/supabaseRest';

export type DisplayLabel = StoredLabel & { needs_review: boolean };

interface CompletionResult {
  ok: boolean;
  message?: string;
}

interface UseLabelingReturn {
  currentThreadIndex: number;
  labels: Record<string, StoredLabel>;
  threadStates: Record<string, StoredThreadState>;
  stats: LabelStats;
  storageError: string | null;
  getLabel: (itemId: string) => DisplayLabel | null;
  setLabel: (itemId: string, label: Label) => void;
  skipThread: (thread: Thread) => Promise<void>;
  completeThread: (thread: Thread) => Promise<CompletionResult>;
  goNext: () => void;
  goPrev: () => void;
  jumpTo: (idx: number) => void;
  focusedItemId: string | null;
  setFocusedItemId: (id: string | null) => void;
  totalThreads: number;
}

function itemVersion(item: Item): number {
  const version = Number(item._data_version ?? 1);
  return Number.isFinite(version) && version > 0 ? version : 1;
}

function threadItems(thread: Thread): Item[] {
  return thread.post._is_address_only
    ? thread.comments.flatMap(comment => [comment.comment, ...comment.replies])
    : [thread.post, ...thread.comments.flatMap(comment => [comment.comment, ...comment.replies])];
}

function threadVersionToken(thread: Thread): string {
  return threadItems(thread)
    .map(item => `${item._entity_key}@${itemVersion(item)}`)
    .sort()
    .join('|');
}

function itemPostId(item: Item): string {
  return String(item.post_id ?? '');
}

function itemCommentId(item: Item): string | null {
  if (item._content_type === 'post') return null;
  return String(item.comment_id ?? '').trim() || null;
}

export function useLabeling(
  person: Person | null,
  threads: Thread[],
  supabaseConfig?: SupabaseConfig | null,
): UseLabelingReturn {
  const [currentThreadIndex, setCurrentThreadIndex] = useState(0);
  const [labels, setLabels] = useState<Record<string, StoredLabel>>({});
  const labelsRef = useRef<Record<string, StoredLabel>>({});
  const [threadStates, setThreadStates] = useState<Record<string, StoredThreadState>>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const pendingLabelWritesRef = useRef(new Map<string, number>());
  const completingThreadsRef = useRef(new Set<string>());

  const itemsById = useMemo(() => {
    const result: Record<string, Item> = {};
    for (const thread of threads) {
      result[thread.post._internal_id] = thread.post;
      for (const entry of thread.comments) {
        result[entry.comment._internal_id] = entry.comment;
        for (const reply of entry.replies) result[reply._internal_id] = reply;
      }
    }
    return result;
  }, [threads]);

  const threadsByItemId = useMemo(() => {
    const result: Record<string, Thread> = {};
    for (const thread of threads) {
      for (const item of threadItems(thread)) result[item._internal_id] = thread;
    }
    return result;
  }, [threads]);

  useEffect(() => {
    let cancelled = false;
    if (!person) return;

    Promise.all([getAllLabels(person), getThreadStates(person), getProgress(person)])
      .then(([storedLabels, storedThreads, progress]) => {
        if (cancelled) return;
        const mergedLabels = { ...storedLabels };
        for (const thread of threads) {
          for (const item of threadItems(thread)) {
            if (item._loaded_label) {
              mergedLabels[item._entity_key] = item._loaded_label;
            } else if (thread._data_source === 'supabase') {
              delete mergedLabels[item._entity_key];
            }
          }
        }
        labelsRef.current = mergedLabels;
        setLabels(mergedLabels);
        setThreadStates(storedThreads);
        if (!progress) {
          setCurrentThreadIndex(0);
          return;
        }
        const byId = progress.current_thread_id
          ? threads.findIndex(thread => thread.post._entity_key === progress.current_thread_id)
          : -1;
        const fallback = Math.min(
          progress.current_thread_index,
          Math.max(0, threads.length - 1),
        );
        setCurrentThreadIndex(byId >= 0 ? byId : fallback);
      })
      .catch(error => {
        if (!cancelled) setStorageError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
    };
  }, [person, threads]);

  const stats = useMemo(() => {
    const currentEntityKeys = new Set(
      threads.flatMap(threadItems).map(item => item._entity_key),
    );
    const currentLabels = Object.fromEntries(
      Object.entries(labels).filter(([entityKey]) => currentEntityKeys.has(entityKey)),
    );
    const currentStats = computeStats(currentLabels);
    currentStats.todayLabeled = computeStats(labels).todayLabeled;
    return currentStats;
  }, [labels, threads]);

  const getLabel = useCallback((itemId: string): DisplayLabel | null => {
    const stored = labelsRef.current[itemId];
    if (!stored) return null;
    const item = itemsById[itemId];
    const needsReview = Boolean(
      item
      && !stored.skipped
      && stored.data_version < itemVersion(item),
    );
    return { ...stored, needs_review: needsReview };
  }, [itemsById]);

  const persistLabel = useCallback(async (
    item: Item,
    label: Label,
    skipped: boolean,
  ): Promise<StoredLabel> => {
    if (!person) throw new Error('Chưa chọn người gán nhãn.');
    const optimistic: StoredLabel = {
      ...label,
      key: `${person}|${item._entity_key}`,
      person,
      entity_key: item._entity_key,
      labeled_by: person,
      labeled_at: new Date().toISOString(),
      skipped,
      data_version: itemVersion(item),
    };
    labelsRef.current = { ...labelsRef.current, [item._entity_key]: optimistic };
    setLabels(labelsRef.current);
    try {
      const stored = await saveLabel(
        person,
        item._entity_key,
        label,
        itemVersion(item),
        skipped,
      );
      if (supabaseConfig) {
        await saveSupabaseAnnotation(supabaseConfig, {
          entityKey: item._entity_key,
          platform: item._platform,
          entityType: item._content_type,
          postId: itemPostId(item),
          commentId: itemCommentId(item),
          assignee: person,
          label,
          dataVersion: itemVersion(item),
          skipped,
        });
      }
      labelsRef.current = { ...labelsRef.current, [item._entity_key]: stored };
      setLabels(labelsRef.current);
      return stored;
    } catch (error) {
      const restored = await getAllLabels(person);
      labelsRef.current = restored;
      setLabels(restored);
      throw error;
    }
  }, [person, supabaseConfig]);

  const completeThreadWhenReady = useCallback(async (thread: Thread) => {
    if (!person) return;
    if (thread._data_source === 'supabase' && !supabaseConfig) return;
    const items = threadItems(thread);
    if (items.some(item => pendingLabelWritesRef.current.has(item._entity_key))) return;
    if (items.some(item => {
      const label = labelsRef.current[item._entity_key];
      return !label || label.skipped || !isLabelComplete(label);
    })) return;

    const threadId = thread.post._entity_key;
    const versionToken = threadVersionToken(thread);
    const existingState = threadStates[threadId];
    if (existingState?.status === 'completed' && existingState.version_token === versionToken) return;
    if (completingThreadsRef.current.has(threadId)) return;

    completingThreadsRef.current.add(threadId);
    try {
      const state = await saveThreadState(
        person,
        threadId,
        'completed',
        itemVersion(thread.post),
        versionToken,
      );
      if (supabaseConfig && thread._assignment_id) {
        await updateSupabaseAssignment(supabaseConfig, thread._assignment_id, 'completed');
      }
      setThreadStates(previous => ({ ...previous, [state.thread_id]: state }));
    } finally {
      completingThreadsRef.current.delete(threadId);
    }
  }, [person, supabaseConfig, threadStates]);

  useEffect(() => {
    for (const thread of threads) {
      void completeThreadWhenReady(thread).catch(error => {
        setStorageError(error instanceof Error ? error.message : String(error));
      });
    }
  }, [completeThreadWhenReady, labels, threads]);

  const setLabelForItem = useCallback((itemId: string, label: Label) => {
    const item = itemsById[itemId];
    if (!item) return;
    setStorageError(null);
    const pendingWrites = pendingLabelWritesRef.current;
    pendingWrites.set(item._entity_key, (pendingWrites.get(item._entity_key) ?? 0) + 1);
    const releasePendingWrite = () => {
      const remaining = pendingWrites.get(item._entity_key) ?? 0;
      if (remaining <= 1) pendingWrites.delete(item._entity_key);
      else pendingWrites.set(item._entity_key, remaining - 1);
    };
    void persistLabel(item, label, false)
      .then(async () => {
        releasePendingWrite();
        const thread = threadsByItemId[itemId];
        if (thread) await completeThreadWhenReady(thread);
      })
      .catch(error => {
        releasePendingWrite();
        setStorageError(error instanceof Error ? error.message : String(error));
      });
  }, [completeThreadWhenReady, itemsById, persistLabel, threadsByItemId]);

  const persistProgress = useCallback((index: number) => {
    if (!person) return;
    const threadId = threads[index]?.post._entity_key ?? null;
    void saveProgress(person, index, threadId).catch(error => {
      setStorageError(error instanceof Error ? error.message : String(error));
    });
  }, [person, threads]);

  const goNext = useCallback(() => {
    setCurrentThreadIndex(index => {
      const next = Math.min(index + 1, threads.length - 1);
      persistProgress(next);
      return next;
    });
    setFocusedItemId(null);
  }, [persistProgress, threads.length]);

  const goPrev = useCallback(() => {
    setCurrentThreadIndex(index => {
      const next = Math.max(index - 1, 0);
      persistProgress(next);
      return next;
    });
    setFocusedItemId(null);
  }, [persistProgress]);

  const jumpTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, threads.length - 1));
    setCurrentThreadIndex(clamped);
    persistProgress(clamped);
    setFocusedItemId(null);
  }, [persistProgress, threads.length]);

  const skipThread = useCallback(async (thread: Thread) => {
    if (!person) return;
    setStorageError(null);
    try {
      const items = threadItems(thread);
      const saved = await Promise.all(items.map(item => {
        const existing = labelsRef.current[item._entity_key];
        if (existing && !existing.skipped && isLabelComplete(existing)) return existing;
        const value: Label = existing
          ? {
              sentiment: existing.sentiment,
              topic: existing.topic,
              relevance: existing.relevance,
              urgency: existing.urgency,
              intent: existing.intent,
            }
          : EMPTY_LABEL;
        return persistLabel(item, value, true);
      }));
      const nextLabels = { ...labelsRef.current };
      for (const label of saved) nextLabels[label.entity_key] = label;
      labelsRef.current = nextLabels;
      setLabels(nextLabels);
      const state = await saveThreadState(
        person,
        thread.post._entity_key,
        'skipped',
        itemVersion(thread.post),
        threadVersionToken(thread),
      );
      if (supabaseConfig && thread._assignment_id) {
        await updateSupabaseAssignment(supabaseConfig, thread._assignment_id, 'skipped');
      }
      setThreadStates(previous => ({ ...previous, [state.thread_id]: state }));
      goNext();
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : String(error));
    }
  }, [goNext, persistLabel, person, supabaseConfig]);

  const completeThread = useCallback(async (thread: Thread): Promise<CompletionResult> => {
    if (!person) return { ok: false, message: 'Chưa chọn người gán nhãn.' };
    const items = threadItems(thread);
    const missing = items.filter(item => {
      const label = labelsRef.current[item._entity_key];
      return !label || label.skipped || !isLabelComplete(label);
    });
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Còn ${missing.length} item chưa gán đủ nhãn.`,
      };
    }

    setStorageError(null);
    try {
      const reviewed = await Promise.all(items.map(item => {
        const label = labelsRef.current[item._entity_key];
        if (label.data_version >= itemVersion(item)) return label;
        return persistLabel(item, {
          sentiment: label.sentiment,
          topic: label.topic,
          relevance: label.relevance,
          urgency: label.urgency,
          intent: label.intent,
        }, false);
      }));
      const nextLabels = { ...labelsRef.current };
      for (const label of reviewed) nextLabels[label.entity_key] = label;
      labelsRef.current = nextLabels;
      setLabels(nextLabels);
      const state = await saveThreadState(
        person,
        thread.post._entity_key,
        'completed',
        itemVersion(thread.post),
        threadVersionToken(thread),
      );
      if (supabaseConfig && thread._assignment_id) {
        await updateSupabaseAssignment(supabaseConfig, thread._assignment_id, 'completed');
      }
      setThreadStates(previous => ({ ...previous, [state.thread_id]: state }));
      goNext();
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStorageError(message);
      return { ok: false, message };
    }
  }, [goNext, persistLabel, person, supabaseConfig]);

  return {
    currentThreadIndex,
    labels,
    threadStates,
    stats,
    storageError,
    getLabel,
    setLabel: setLabelForItem,
    skipThread,
    completeThread,
    goNext,
    goPrev,
    jumpTo,
    focusedItemId,
    setFocusedItemId,
    totalThreads: threads.length,
  };
}
