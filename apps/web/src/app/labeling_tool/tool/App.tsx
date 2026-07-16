"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Person, Label, Thread, TopicKey, TOPIC_HOTKEYS,
  EMPTY_LABEL, IRRELEVANT_PRESET_LABEL, isIrrelevantPreset,
  POSITIVE_COLD_PRESET_LABEL, isPositiveColdPreset,
  NEGATIVE_STAFF_ATTITUDE_PRESET_LABEL, isNegativeStaffAttitudePreset,
  POSITIVE_NONE_PRESET_LABEL, isPositiveNonePreset,
  isLabelComplete,
} from './types';
import { useData } from './hooks/useData';
import { useLabeling } from './hooks/useLabeling';
import ThreadView from './components/ThreadView';
import ProgressBar from './components/ProgressBar';
import Sidebar from './components/Sidebar';
import ExportButton from './components/ExportButton';
import {
  AssignmentView,
  approveSupabaseAiAnnotations,
  loadPendingAssignmentCounts,
  PendingAssignmentCounts,
  PlatformFilter,
  SupabaseConfig,
} from './utils/supabaseRest';

// ============================================================
// Small kbd style injection (used in Sidebar)
// ============================================================
const KBD_STYLE = `
  kbd.kbd {
    display: inline-block;
    padding: 1px 5px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: monospace;
    opacity: 0.75;
    margin-right: 2px;
  }
`;

const SUPABASE_URL_KEY = 'insightflow_supabase_url';
const SUPABASE_ANON_KEY = 'insightflow_supabase_anon_key';
const LABELING_SESSION_KEY = 'insightflow_labeling_session';
const SUPABASE_CONFIG_PATH = process.env.NEXT_PUBLIC_SUPABASE_CONFIG_PATH || '';

interface LabelingSession {
  platform: PlatformFilter;
  assignmentView: AssignmentView;
  limit: number;
  dateFrom: string;
  dateTo: string;
  brand: string;
  currentThreadId: string | null;
  savedAt: string;
}

function loadLabelingSession(): LabelingSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LABELING_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LabelingSession>;
    if (!parsed.platform || !parsed.assignmentView) return null;
    return {
      platform: parsed.platform,
      assignmentView: parsed.assignmentView,
      limit: Number(parsed.limit) || 20,
      dateFrom: parsed.dateFrom ?? '',
      dateTo: parsed.dateTo ?? '',
      brand: parsed.brand ?? 'all',
      currentThreadId: parsed.currentThreadId ?? null,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export default function App() {
  const initialSessionRef = useRef<LabelingSession | null>(loadLabelingSession());

  // ─── Person ────────────────────────────────────────────
  const person: Person = 'Person A';

  // ─── Data ──────────────────────────────────────────────
  const { threads: rawThreads, loading, error, postCount, itemCount, loadFromSupabase } = useData();
  const [dataMode, setDataMode] = useState<'file' | 'supabase'>('file');
  const [supabaseUrl, setSupabaseUrl] = useState(
    () => process.env.NEXT_PUBLIC_SUPABASE_URL || localStorage.getItem(SUPABASE_URL_KEY) || '',
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localStorage.getItem(SUPABASE_ANON_KEY) || '',
  );
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(
    () => initialSessionRef.current?.platform ?? 'facebook',
  );
  const [assignmentView, setAssignmentView] = useState<AssignmentView>(
    () => initialSessionRef.current?.assignmentView ?? 'pending',
  );
  const [supabaseLimit, setSupabaseLimit] = useState(
    () => initialSessionRef.current?.limit ?? 20,
  );
  const [queueDateFrom, setQueueDateFrom] = useState(
    () => initialSessionRef.current?.dateFrom ?? '',
  );
  const [queueDateTo, setQueueDateTo] = useState(
    () => initialSessionRef.current?.dateTo ?? '',
  );
  const [supabaseBrandQuery, setSupabaseBrandQuery] = useState(
    () => initialSessionRef.current?.brand ?? 'all',
  );
  const [pendingCounts, setPendingCounts] = useState<PendingAssignmentCounts | null>(null);
  const [pendingCountsLoading, setPendingCountsLoading] = useState(false);
  const [approvingAi, setApprovingAi] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [pendingRestoreThreadId, setPendingRestoreThreadId] = useState<string | null>(
    () => initialSessionRef.current?.currentThreadId ?? null,
  );
  const autoLoadAttemptedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelLoad = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    if (supabaseUrl.trim() && supabaseAnonKey.trim()) return;
    if (!SUPABASE_CONFIG_PATH.trim()) return;
    let cancelled = false;
    fetch(SUPABASE_CONFIG_PATH, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then((config: unknown) => {
        if (cancelled || !config || typeof config !== 'object') return;
        const record = config as Record<string, unknown>;
        const url = typeof record.supabaseUrl === 'string' ? record.supabaseUrl : '';
        const anonKey = typeof record.supabaseAnonKey === 'string' ? record.supabaseAnonKey : '';
        if (url && !supabaseUrl.trim()) setSupabaseUrl(url);
        if (anonKey && !supabaseAnonKey.trim()) setSupabaseAnonKey(anonKey);
      })
      .catch(() => {
        // Optional demo config file. Manual input remains available.
      });
    return () => {
      cancelled = true;
    };
  }, [supabaseAnonKey, supabaseUrl]);

  const activeSupabaseConfig = useMemo<SupabaseConfig | null>(() => {
    if (dataMode !== 'supabase') return null;
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return null;
    return { url: supabaseUrl.trim(), anonKey: supabaseAnonKey.trim() };
  }, [dataMode, supabaseAnonKey, supabaseUrl]);

  // ─── Filters ───────────────────────────────────────────
  const [brandFilter, setBrandFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [onlyRated, setOnlyRated] = useState(false);
  // skipGMapsSpam is applied at parse time; we store it so it can be toggled
  // and shown in the UI. Toggling re-triggers filtering on the raw threads.
  const [skipGMapsSpam, setSkipGMapsSpam] = useState(true);

  const filteredThreads = useMemo(() => {
    return rawThreads.filter(t => {
      if (brandFilter && t.post._brand !== brandFilter) return false;
      if (sourceFilter && t.post._source !== sourceFilter) return false;
      if (onlyRated && (t.post.stats.star_count === null || t.post.stats.star_count === undefined)) return false;
      return true;
    });
  }, [rawThreads, brandFilter, sourceFilter, onlyRated]);

  // ─── Labeling ──────────────────────────────────────────
  // AI-review edits stay local until the explicit approval RPC is called.
  const labeling = useLabeling(
    person,
    filteredThreads,
    assignmentView === 'ai_review' ? null : activeSupabaseConfig,
  );
  const {
    currentThreadIndex, labels, threadStates, stats, storageError,
    getLabel, setLabel, setItemSkipped, skipThread, unskipThread, completeThread,
    goNext, goPrev, jumpTo,
    focusedItemId, setFocusedItemId,
    totalThreads,
  } = labeling;

  // Reset to first thread when filters change
  const prevFilterRef = useRef({ brand: brandFilter, source: sourceFilter, onlyRated, skipGMapsSpam });
  useEffect(() => {
    const prev = prevFilterRef.current;
    if (prev.brand !== brandFilter || prev.source !== sourceFilter ||
      prev.onlyRated !== onlyRated || prev.skipGMapsSpam !== skipGMapsSpam) {
      jumpTo(0);
      prevFilterRef.current = { brand: brandFilter, source: sourceFilter, onlyRated, skipGMapsSpam };
    }
  }, [brandFilter, sourceFilter, onlyRated, skipGMapsSpam, jumpTo]);

  const currentThread: Thread | null = filteredThreads[currentThreadIndex] ?? null;

  const saveLabelingSession = useCallback((threadId: string | null) => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return;
    const session: LabelingSession = {
      platform: platformFilter,
      assignmentView,
      limit: supabaseLimit,
      dateFrom: queueDateFrom,
      dateTo: queueDateTo,
      brand: supabaseBrandQuery,
      currentThreadId: threadId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LABELING_SESSION_KEY, JSON.stringify(session));
  }, [
    assignmentView,
    platformFilter,
    queueDateFrom,
    queueDateTo,
    supabaseBrandQuery,
    supabaseAnonKey,
    supabaseLimit,
    supabaseUrl,
  ]);

  const completedThreadCount = useMemo(
    () => Object.values(threadStates).filter(
      state => state.status === 'completed' || state.status === 'skipped',
    ).length,
    [threadStates],
  );

  useEffect(() => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setPendingCounts(null);
      return;
    }
    let cancelled = false;
    setPendingCountsLoading(true);
    loadPendingAssignmentCounts(
      { url: supabaseUrl.trim(), anonKey: supabaseAnonKey.trim() },
      platformFilter,
    )
      .then(counts => {
        if (!cancelled) setPendingCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setPendingCounts(null);
      })
      .finally(() => {
        if (!cancelled) setPendingCountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [completedThreadCount, platformFilter, supabaseAnonKey, supabaseUrl]);

  // ─── All items in current thread (flat, ordered) ───────
  const threadItems = useMemo(() => {
    if (!currentThread) return [];
    return [
      currentThread.post,
      ...currentThread.comments.flatMap(c => [c.comment, ...c.replies]),
    ];
  }, [currentThread]);

  const aiCandidateItems = useMemo(
    () => threadItems.filter(item => item._annotation_status === 'ai_pending'),
    [threadItems],
  );

  // ─── Focused item index for Tab navigation ─────────────
  const focusedItemIndex = useMemo(() => {
    if (!focusedItemId) return -1;
    return threadItems.findIndex(i => i._internal_id === focusedItemId);
  }, [focusedItemId, threadItems]);

  // ─── Global hotkeys ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip if focus is inside an input/select/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      const key = e.key.toLowerCase();

      // Navigation (no focused item needed)
      if (key === 'arrowright') { e.preventDefault(); goNext(); return; }
      if (key === 'arrowleft' || key === 'p') { e.preventDefault(); goPrev(); return; }
      if (key === ' ') {
        e.preventDefault();
        if (currentThread) void skipThread(currentThread);
        return;
      }
      if (key === 'enter') {
        e.preventDefault();
        if (currentThread) void completeThread(currentThread);
        return;
      }
      if (key === 'tab') {
        e.preventDefault();
        if (threadItems.length === 0) return;
        const nextIdx = focusedItemIndex < 0
          ? 0
          : (focusedItemIndex + 1) % threadItems.length;
        setFocusedItemId(threadItems[nextIdx]._internal_id);
        // Scroll item into view
        const el = document.querySelector(`[data-item-id="${threadItems[nextIdx]._internal_id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      // Item-level hotkeys — need a focused item
      if (focusedItemIndex < 0 && !focusedItemId) return;
      const itemId = focusedItemId ?? (threadItems[0]?._internal_id);
      if (!itemId) return;

      if (key === 'i') {
        e.preventDefault();
        setItemSkipped(itemId, !getLabel(itemId)?.skipped);
        return;
      }

      const current = getLabel(itemId);
      const lbl: Label = current
        ? { sentiment: current.sentiment, topic: current.topic, relevance: current.relevance, urgency: current.urgency, intent: current.intent ?? null }
        : { sentiment: null, topic: [], relevance: null, urgency: null, intent: null };

      let updated = false;
      const next = { ...lbl };

      // Sentiment
      if (key === '1') { next.sentiment = 'positive'; updated = true; }
      else if (key === '2') { next.sentiment = 'negative'; updated = true; }
      else if (key === '3') { next.sentiment = 'neutral'; updated = true; }
      // Quick presets
      else if (key === '0') {
        const toggled = isIrrelevantPreset(lbl) ? EMPTY_LABEL : IRRELEVANT_PRESET_LABEL;
        next.sentiment = toggled.sentiment;
        next.topic = [...toggled.topic];
        next.relevance = toggled.relevance;
        next.urgency = toggled.urgency;
        next.intent = toggled.intent;
        updated = true;
      }
      else if (key === '7') {
        const toggled = isPositiveNonePreset(lbl) ? EMPTY_LABEL : POSITIVE_NONE_PRESET_LABEL;
        next.sentiment = toggled.sentiment;
        next.topic = [...toggled.topic];
        next.relevance = toggled.relevance;
        next.urgency = toggled.urgency;
        next.intent = toggled.intent;
        updated = true;
      }
      else if (key === '8') {
        const toggled = isNegativeStaffAttitudePreset(lbl) ? EMPTY_LABEL : NEGATIVE_STAFF_ATTITUDE_PRESET_LABEL;
        next.sentiment = toggled.sentiment;
        next.topic = [...toggled.topic];
        next.relevance = toggled.relevance;
        next.urgency = toggled.urgency;
        next.intent = toggled.intent;
        updated = true;
      }
      else if (key === '9') {
        const toggled = isPositiveColdPreset(lbl) ? EMPTY_LABEL : POSITIVE_COLD_PRESET_LABEL;
        next.sentiment = toggled.sentiment;
        next.topic = [...toggled.topic];
        next.relevance = toggled.relevance;
        next.urgency = toggled.urgency;
        next.intent = toggled.intent;
        updated = true;
      }
      // Topic toggles
      else if (key in TOPIC_HOTKEYS) {
        const topic = TOPIC_HOTKEYS[key] as TopicKey;
        next.topic = next.topic.includes(topic)
          ? next.topic.filter(t => t !== topic)
          : [...next.topic, topic];
        updated = true;
      }
      // Relevance
      else if (key === 'a') { next.relevance = true; updated = true; }
      else if (key === 's') { next.relevance = false; updated = true; }
      // Urgency
      else if (key === 'z') { next.urgency = 'low'; updated = true; }
      else if (key === 'x') { next.urgency = 'medium'; updated = true; }
      else if (key === 'c') { next.urgency = 'high'; updated = true; }
      else if (key === 'v') { next.urgency = 'urgent'; updated = true; }
      else if (key === 'd') { next.urgency = 'none'; updated = true; }
      // Intent
      else if (key === 'h') { next.intent = 'hot'; updated = true; }
      else if (key === 'm') { next.intent = 'warm'; updated = true; }
      else if (key === 'b') { next.intent = 'cold'; updated = true; }
      else if (key === 'n') { next.intent = 'none'; updated = true; }

      if (updated) {
        e.preventDefault();
        setLabel(itemId, next);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [
    goNext, goPrev, currentThread, skipThread, completeThread,
    threadItems, focusedItemIndex, focusedItemId,
    getLabel, setLabel, setFocusedItemId,
  ]);

  const handleSupabaseLoad = useCallback(async (restoreThreadId?: string | null) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    localStorage.setItem(SUPABASE_URL_KEY, supabaseUrl.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, supabaseAnonKey.trim());
    setDataMode('supabase');
    setPendingRestoreThreadId(restoreThreadId ?? currentThread?.post._entity_key ?? null);
    saveLabelingSession(restoreThreadId ?? currentThread?.post._entity_key ?? null);

    try {
      await loadFromSupabase(
        { url: supabaseUrl.trim(), anonKey: supabaseAnonKey.trim() },
        platformFilter,
        supabaseLimit,
        assignmentView,
        { from: queueDateFrom || undefined, to: queueDateTo || undefined },
        supabaseBrandQuery,
        controller.signal,
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [
    assignmentView,
    currentThread,
    loadFromSupabase,
    person,
    platformFilter,
    queueDateFrom,
    queueDateTo,
    supabaseBrandQuery,
    supabaseAnonKey,
    supabaseLimit,
    supabaseUrl,
    saveLabelingSession,
  ]);

  const handleApproveAiThread = useCallback(async () => {
    if (!activeSupabaseConfig || !currentThread || aiCandidateItems.length === 0) return;
    setApprovingAi(true);
    setApprovalMessage(null);
    try {
      const approvalItems = aiCandidateItems.map(item => {
        const label = getLabel(item._entity_key);
        if (!label || (!label.skipped && !isLabelComplete(label))) {
          throw new Error(`Nhãn AI chưa đầy đủ: ${item._entity_key}`);
        }
        return {
          entityKey: item._entity_key,
          label: {
            sentiment: label.sentiment,
            topic: label.topic,
            relevance: label.relevance,
            urgency: label.urgency,
            intent: label.intent,
            skipped: label.skipped,
          },
        };
      });
      const approved = await approveSupabaseAiAnnotations(
        activeSupabaseConfig,
        approvalItems,
      );
      setApprovalMessage(`Đã chấp nhận ${approved.toLocaleString()} nhãn AI.`);
      await handleSupabaseLoad(null);
    } catch (error) {
      setApprovalMessage(
        error instanceof Error ? `Không thể chấp nhận nhãn AI: ${error.message}` : 'Không thể chấp nhận nhãn AI.',
      );
    } finally {
      setApprovingAi(false);
    }
  }, [
    activeSupabaseConfig,
    aiCandidateItems,
    currentThread,
    getLabel,
    handleSupabaseLoad,
  ]);

  useEffect(() => {
    if (rawThreads.length === 0 || !pendingRestoreThreadId) return;
    const index = rawThreads.findIndex(thread => thread.post._entity_key === pendingRestoreThreadId);
    if (index >= 0) jumpTo(index);
    setPendingRestoreThreadId(null);
  }, [jumpTo, pendingRestoreThreadId, rawThreads]);

  useEffect(() => {
    if (!currentThread) return;
    saveLabelingSession(currentThread.post._entity_key);
  }, [currentThread, saveLabelingSession]);

  useEffect(() => {
    if (autoLoadAttemptedRef.current) return;
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return;
    const session = initialSessionRef.current;
    if (!session) return;
    autoLoadAttemptedRef.current = true;
    void handleSupabaseLoad(session.currentThreadId);
  }, [handleSupabaseLoad, supabaseAnonKey, supabaseUrl]);

  // ─── Render ────────────────────────────────────────────
  return (
    <>
      <style>{KBD_STYLE}</style>

      <div className="labeling-tool-scope min-h-screen bg-gray-100 dark:bg-slate-950">
        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-surface-600 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col gap-2">
            {/* Top row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Logo + title */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    InsightFlow Labeling
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Media Monitoring</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="flex items-center rounded-lg border border-gray-200 dark:border-surface-600 p-0.5"
                  role="group"
                  aria-label="Chế độ gán nhãn"
                >
                  <button
                    type="button"
                    onClick={() => setAssignmentView('pending')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${assignmentView === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-700'
                      }`}
                  >
                    Cần gán
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentView('ai_review')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${assignmentView === 'ai_review'
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-700'
                      }`}
                  >
                    AI chờ duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentView('completed')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${assignmentView === 'completed'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-700'
                      }`}
                  >
                    Đã gán
                  </button>
                </div>

                <select
                  value={platformFilter}
                  onChange={e => setPlatformFilter(e.target.value as PlatformFilter)}
                  className="select-control text-xs"
                  title="Nền tảng cần gán nhãn"
                >
                  <option value="facebook">Facebook</option>
                  <option value="threads">Threads</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="google_maps">Google Maps</option>
                  <option value="befood">BeFood</option>
                  <option value="news">News</option>
                </select>

                <select
                  value={supabaseBrandQuery}
                  onChange={e => setSupabaseBrandQuery(e.target.value)}
                  className="select-control text-xs w-32"
                  title="Thương hiệu cần gán nhãn"
                >
                  <option value="all">Tất cả Brand</option>
                  <option value="highlands-coffee">Highlands Coffee</option>
                  <option value="starbucks">Starbucks</option>
                  <option value="mixue">Mixue</option>
                </select>

                <input
                  type="number"
                  min={1}
                  max={100}
                  value={supabaseLimit}
                  onChange={e => setSupabaseLimit(Math.max(1, Number(e.target.value) || 20))}
                  className="select-control text-xs w-20"
                  title="Số thread cần tải"
                />

                <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  Từ
                  <input
                    type="date"
                    value={queueDateFrom}
                    onChange={e => setQueueDateFrom(e.target.value)}
                    className="select-control text-xs w-32"
                    title="Lọc theo ngày đăng của post/comment cần gán"
                  />
                </label>

                <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  Đến
                  <input
                    type="date"
                    value={queueDateTo}
                    onChange={e => setQueueDateTo(e.target.value)}
                    className="select-control text-xs w-32"
                    title="Lọc theo ngày đăng của post/comment cần gán"
                  />
                </label>

                {(queueDateFrom || queueDateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQueueDateFrom('');
                      setQueueDateTo('');
                    }}
                    className="btn-secondary text-xs"
                    title="Xóa lọc ngày"
                  >
                    Xóa ngày
                  </button>
                )}

                {loading ? (
                  <button
                    onClick={handleCancelLoad}
                    className="btn-secondary text-xs inline-flex items-center justify-center gap-2 min-w-[160px] border-red-200 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:text-red-400 font-semibold"
                    title="Hủy quá trình tải dữ liệu"
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border-2 border-red-500/40 border-t-red-500 animate-spin"
                      aria-hidden="true"
                    />
                    Hủy tải / Stop
                  </button>
                ) : (
                  <button
                    onClick={() => void handleSupabaseLoad()}
                    disabled={!person || !supabaseUrl.trim() || !supabaseAnonKey.trim()}
                    className="btn-primary text-xs disabled:opacity-70 inline-flex items-center justify-center gap-2 min-w-[160px]"
                    title={person
                      ? 'Tải dữ liệu / Load data'
                      : 'Chọn người gán nhãn trước khi tải Supabase'}
                  >
                    Tải data / Load data
                  </button>
                )}

                {/* Export */}
                {person && rawThreads.length > 0 && (
                  <ExportButton
                    person={person}
                    threads={rawThreads}
                    labels={labels}
                    threadStates={threadStates}
                  />
                )}
              </div>
            </div>

            {(!supabaseUrl.trim() || !supabaseAnonKey.trim()) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="select-control text-xs"
                  placeholder="Supabase URL"
                />
                <input
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  className="select-control text-xs"
                  placeholder="Supabase anon key"
                />
              </div>
            )}

            {/* Progress + stats row */}
            {rawThreads.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <ProgressBar current={currentThreadIndex} total={totalThreads} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {postCount} posts · {itemCount} items
                </div>
              </div>
            )}


          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Error banner */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
              ❌ {error}
            </div>
          )}
          {storageError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              Lỗi lưu tiến độ: {storageError}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div
              className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Đang tải dữ liệu / Loading data
                  <span className="inline-flex w-6 justify-start" aria-hidden="true">
                    <span className="animate-pulse">...</span>
                  </span>
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Đang lọc bài viết và bình luận theo nền tảng, ngày đã chọn.
                </p>
              </div>
              <div className="h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full w-1/3 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={handleCancelLoad}
                className="mt-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:text-red-400 px-4 py-2 text-sm font-semibold transition"
              >
                Hủy tải / Stop loading
              </button>
            </div>
          )}

          {/* Empty state */}
          {rawThreads.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-6xl">📂</div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Chưa có dữ liệu
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">
                Chọn nền tảng và nhấn Supabase để tải lô dữ liệu cần gán nhãn.
              </p>
            </div>
          )}

          {/* 2-column layout */}
          {currentThread && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
              {/* Left: Thread view */}
              <div>
                {assignmentView === 'ai_review' && (
                  <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-violet-900 dark:text-violet-100">
                          Nhãn AI đang chờ admin duyệt
                        </h2>
                        <p className="mt-1 text-xs text-violet-700 dark:text-violet-300">
                          Có {aiCandidateItems.length.toLocaleString()} nhãn AI trong thread này. Các chỉnh sửa chỉ được lưu chính thức sau khi chấp nhận.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleApproveAiThread()}
                        disabled={approvingAi || aiCandidateItems.length === 0}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {approvingAi
                          ? 'Đang cập nhật...'
                          : `✓ Chấp nhận ${aiCandidateItems.length.toLocaleString()} nhãn`}
                      </button>
                    </div>
                    {approvalMessage && (
                      <p className="mt-3 text-xs font-semibold text-violet-800 dark:text-violet-200">
                        {approvalMessage}
                      </p>
                    )}
                  </div>
                )}
                <ThreadView
                  thread={currentThread}
                  threadIndex={currentThreadIndex}
                  totalThreads={totalThreads}
                  getLabel={getLabel}
                  setLabel={setLabel}
                  setItemSkipped={setItemSkipped}
                  skipThread={skipThread}
                  unskipThread={unskipThread}
                  completeThread={completeThread}
                  onNext={goNext}
                  onPrev={goPrev}
                  focusedItemId={focusedItemId}
                  setFocusedItemId={setFocusedItemId}
                  threadState={threadStates[currentThread.post._entity_key] ?? null}
                />
              </div>

              {/* Right: Sidebar */}
              <div className="lg:sticky lg:top-[132px] lg:max-h-[calc(100vh-148px)] lg:overflow-y-auto lg:pr-1 self-start">
                <Sidebar
                  stats={stats}
                  postCount={postCount}
                  itemCount={itemCount}
                  pendingCounts={pendingCounts}
                  pendingCountsLoading={pendingCountsLoading}
                  platform={platformFilter}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
