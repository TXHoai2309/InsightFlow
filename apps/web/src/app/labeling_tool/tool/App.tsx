import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Person, Label, Thread, TopicKey, TOPIC_HOTKEYS } from './types';
import { getDarkMode, saveDarkMode, getDailyGoal } from './utils/storage';
import { useData } from './hooks/useData';
import { useLabeling } from './hooks/useLabeling';
import ThreadView from './components/ThreadView';
import ProgressBar from './components/ProgressBar';
import FilterPanel from './components/FilterPanel';
import Sidebar from './components/Sidebar';
import ExportButton from './components/ExportButton';
import { AssignmentView, PlatformFilter, SupabaseConfig } from './utils/supabaseRest';

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

function viteEnv(key: string): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return env?.[key] ?? '';
}

export default function App() {
  // ─── Dark mode ─────────────────────────────────────────
  const [dark, setDark] = useState<boolean>(getDarkMode);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    saveDarkMode(dark);
  }, [dark]);

  // ─── Daily goal ────────────────────────────────────────
  const [dailyGoal, setDailyGoal] = useState<number>(getDailyGoal);

  // ─── Person ────────────────────────────────────────────
  const person: Person = 'Person A';

  // ─── Data ──────────────────────────────────────────────
  const { threads: rawThreads, loading, error, postCount, itemCount, loadFromSupabase } = useData();
  const [dataMode, setDataMode] = useState<'file' | 'supabase'>('file');
  const [supabaseUrl, setSupabaseUrl] = useState(
    () => viteEnv('VITE_SUPABASE_URL') || localStorage.getItem(SUPABASE_URL_KEY) || '',
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    () => viteEnv('VITE_SUPABASE_ANON_KEY') || localStorage.getItem(SUPABASE_ANON_KEY) || '',
  );
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('facebook');
  const [assignmentView, setAssignmentView] = useState<AssignmentView>('pending');
  const [supabaseLimit, setSupabaseLimit] = useState(20);

  useEffect(() => {
    if (supabaseUrl.trim() && supabaseAnonKey.trim()) return;
    let cancelled = false;
    fetch('/supabase-config.json', { cache: 'no-store' })
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
  const labeling = useLabeling(person, filteredThreads, activeSupabaseConfig);
  const {
    currentThreadIndex, labels, threadStates, stats, storageError,
    getLabel, setLabel, skipThread, completeThread,
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

  // ─── All items in current thread (flat, ordered) ───────
  const threadItems = useMemo(() => {
    if (!currentThread) return [];
    return [
      currentThread.post,
      ...currentThread.comments.flatMap(c => [c.comment, ...c.replies]),
    ];
  }, [currentThread]);

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
      else if (key === 'z') { next.urgency = 'normal'; updated = true; }
      else if (key === 'x') { next.urgency = 'notable'; updated = true; }
      else if (key === 'c') { next.urgency = 'crisis'; updated = true; }
      // Intent
      else if (key === 'h') { next.intent = 'hot';  updated = true; }
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

  const handleSupabaseLoad = useCallback(async () => {
    localStorage.setItem(SUPABASE_URL_KEY, supabaseUrl.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, supabaseAnonKey.trim());
    setDataMode('supabase');
    await loadFromSupabase(
      { url: supabaseUrl.trim(), anonKey: supabaseAnonKey.trim() },
      platformFilter,
      supabaseLimit,
      assignmentView,
      person,
    );
  }, [assignmentView, loadFromSupabase, person, platformFilter, supabaseAnonKey, supabaseLimit, supabaseUrl]);

  // ─── Render ────────────────────────────────────────────
  return (
    <>
      <style>{KBD_STYLE}</style>

      <div className="min-h-screen bg-gray-100 dark:bg-surface-900">
        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-40 bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-600 shadow-sm">
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
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      assignmentView === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-700'
                    }`}
                  >
                    Cần gán
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentView('completed')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      assignmentView === 'completed'
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

                <input
                  type="number"
                  min={1}
                  max={100}
                  value={supabaseLimit}
                  onChange={e => setSupabaseLimit(Math.max(1, Number(e.target.value) || 20))}
                  className="select-control text-xs w-20"
                  title="Supabase thread limit"
                />

                <button
                  onClick={() => void handleSupabaseLoad()}
                  disabled={loading || !person || !supabaseUrl.trim() || !supabaseAnonKey.trim()}
                  className="btn-primary text-xs disabled:opacity-50"
                  title={person
                    ? 'Load from Supabase demo anon mode'
                    : 'Chọn người gán nhãn trước khi tải Supabase'}
                >
                  Supabase
                </button>

                {/* Dark mode toggle */}
                <button
                  onClick={() => setDark(d => !d)}
                  className="btn-secondary text-xs"
                  title="Toggle dark/light mode"
                >
                  {dark ? '☀️ Light' : '🌙 Dark'}
                </button>

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

            {/* Filter row */}
            {rawThreads.length > 0 && (
              <FilterPanel
                threads={rawThreads}
                brandFilter={brandFilter}
                sourceFilter={sourceFilter}
                onBrandChange={setBrandFilter}
                onSourceChange={setSourceFilter}
                onlyRated={onlyRated}
                onOnlyRatedChange={setOnlyRated}
                skipGMapsSpam={skipGMapsSpam}
                onSkipGMapsSpamChange={setSkipGMapsSpam}
              />
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              {/* Left: Thread view */}
              <div>
                <ThreadView
                  thread={currentThread}
                  threadIndex={currentThreadIndex}
                  totalThreads={totalThreads}
                  getLabel={getLabel}
                  setLabel={setLabel}
                  skipThread={skipThread}
                  completeThread={completeThread}
                  onNext={goNext}
                  onPrev={goPrev}
                  focusedItemId={focusedItemId}
                  setFocusedItemId={setFocusedItemId}
                />
              </div>

              {/* Right: Sidebar */}
              <div className="lg:sticky lg:top-[140px] self-start">
                <Sidebar
                  stats={stats}
                  postCount={postCount}
                  itemCount={itemCount}
                  dailyGoal={dailyGoal}
                  onDailyGoalChange={setDailyGoal}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
