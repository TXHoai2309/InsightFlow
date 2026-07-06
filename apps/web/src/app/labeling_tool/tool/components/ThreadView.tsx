import React, { useCallback, useState } from 'react';
import { Thread, Label, EMPTY_LABEL, isLabelComplete, PlatformStats } from '../types';
import CommentItem from './CommentItem';
import LabelSelector from './LabelSelector';
import { highlightBrandSafe } from '../utils/dataPartition';
import { formatCount } from '../utils/parser';

interface ThreadViewProps {
  thread: Thread;
  threadIndex: number;
  totalThreads: number;
  getLabel: (itemId: string) => (Label & { skipped?: boolean; needs_review?: boolean }) | null;
  setLabel: (itemId: string, label: Label) => void;
  skipThread: (thread: Thread) => Promise<void>;
  unskipThread: (thread: Thread) => Promise<void>;
  completeThread: (thread: Thread) => Promise<{ ok: boolean; message?: string }>;
  onNext: () => void;
  onPrev: () => void;
  focusedItemId: string | null;
  setFocusedItemId: (id: string | null) => void;
  threadState: any;
}

function HighlightedText({ text, brand }: { text: string; brand: string }) {
  const parts = highlightBrandSafe(text, brand);
  return (
    <>
      {parts.map((p, i) =>
        p.highlight
          ? <mark key={i} className="brand-highlight">{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </>
  );
}

function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    let d: Date | null = null;
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
      d = new Date(year, month, day, hour, minute, second);
    }

    // 2. Check DD/MM/YYYY HH:mm(:ss)
    if (!d || isNaN(d.getTime())) {
      const dmYRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
      const matchDmY = cleanStr.match(dmYRegex);
      if (matchDmY) {
        const day = parseInt(matchDmY[1], 10);
        const month = parseInt(matchDmY[2], 10) - 1;
        const year = parseInt(matchDmY[3], 10);
        const hour = matchDmY[4] ? parseInt(matchDmY[4], 10) : 0;
        const minute = matchDmY[5] ? parseInt(matchDmY[5], 10) : 0;
        const second = matchDmY[6] ? parseInt(matchDmY[6], 10) : 0;
        d = new Date(year, month, day, hour, minute, second);
      }
    }

    // 3. Check YYYY-MM-DD HH:mm(:ss)
    if (!d || isNaN(d.getTime())) {
      const YmdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
      const matchYmd = cleanStr.match(YmdRegex);
      if (matchYmd) {
        const year = parseInt(matchYmd[1], 10);
        const month = parseInt(matchYmd[2], 10) - 1;
        const day = parseInt(matchYmd[3], 10);
        const hour = matchYmd[4] ? parseInt(matchYmd[4], 10) : 0;
        const minute = matchYmd[5] ? parseInt(matchYmd[5], 10) : 0;
        const second = matchYmd[6] ? parseInt(matchYmd[6], 10) : 0;
        d = new Date(year, month, day, hour, minute, second);
      }
    }

    if (!d || isNaN(d.getTime())) {
      d = new Date(iso);
    }

    if (isNaN(d.getTime())) return iso;

    return d.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function SourceIcon({ source }: { source: string }) {
  const s = source.toLowerCase();
  const icons: Record<string, string> = {
    facebook: '📘', tiktok: '🎵', youtube: '📺',
    instagram: '📸', threads: '🧵', befood: '🍱',
    'google maps': '🗺️', google_maps: '🗺️', 'báo html': '📰',
  };
  return <span title={source}>{icons[s] ?? '🌐'}</span>;
}

function QueueBadge({ status }: { status: unknown }) {
  if (status === 'updated_review') {
    return (
      <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
        Dữ liệu mới update · xem lại
      </span>
    );
  }
  if (status === 'unassigned') {
    return (
      <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
        Dữ liệu mới
      </span>
    );
  }
  return null;
}

function LabelStatusBadge({
  label,
}: {
  label: (Label & { skipped?: boolean; needs_review?: boolean }) | null;
}) {
  if (label?.skipped === true) {
    return (
      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full line-through">
        Da bo qua
      </span>
    );
  }
  if (label?.needs_review === true) {
    return (
      <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
        Xem lai
      </span>
    );
  }
  if (label && isLabelComplete(label)) {
    return (
      <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
        Da gan
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
      Chua gan
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// StatsBar — unified stats display for posts, per source
// ──────────────────────────────────────────────────────────────
interface StatsBarProps {
  stats: PlatformStats;
  source: string;
  extra?: Record<string, unknown>;
}

function StatsBar({ stats, source, extra = {} }: StatsBarProps) {
  const src = source.toLowerCase();

  // ── Google Maps / BeFood: special rating display ──
  if (src === 'google maps' || src === 'google_maps' || src === 'befood') {
    const hasStar = stats.star_count !== null && stats.star_count !== undefined;
    const hasReviews = stats.comment_count > 0;
    const crawled = stats.comment_crawled;
    const total = stats.comment_count;
    const tooltipText = crawled > 0 || total > 0
      ? `Đã cào ${crawled}/${total} đánh giá`
      : undefined;

    if (!hasStar && !hasReviews) return null;

    return (
      <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
        {hasStar && (
          <span className="flex items-center gap-1 text-yellow-500 font-semibold">
            ⭐ <span>{Number(stats.star_count).toFixed(1)}/5</span>
          </span>
        )}
        {hasReviews && (
          <span
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 cursor-help"
            title={tooltipText}
          >
            💬 <strong className="text-gray-700 dark:text-gray-300">{formatCount(total)}</strong>
            <span>đánh giá</span>
            {crawled > 0 && crawled < total && (
              <span className="text-gray-400 dark:text-gray-500">({formatCount(crawled)} đã cào)</span>
            )}
          </span>
        )}
        {/* BeFood branch area */}
        {src === 'befood' && typeof extra.branch_area === 'string' && extra.branch_area && (
          <span className="text-gray-500 dark:text-gray-400">
            📍 {extra.branch_area}
          </span>
        )}
      </div>
    );
  }

  // ── General sources — build stat items conditionally ──
  const items: React.ReactNode[] = [];

  if (stats.like_count > 0) {
    items.push(
      <span key="like" className="flex items-center gap-1">
        ❤️ <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.like_count)}</strong>
      </span>
    );
  }

  if (stats.comment_count > 0) {
    const label = src === 'threads' ? 'reply' : 'bình luận';
    items.push(
      <span key="cmt" className="flex items-center gap-1">
        💬 <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.comment_count)}</strong>
        <span>{label}</span>
      </span>
    );
  }

  if (stats.repost_count !== null && stats.repost_count !== undefined && stats.repost_count > 0) {
    items.push(
      <span key="repost" className="flex items-center gap-1">
        🔁 <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.repost_count)}</strong>
      </span>
    );
  }

  if (stats.share_count !== null && stats.share_count !== undefined && stats.share_count > 0) {
    const shareIcon = src === 'threads' ? '📤' : '🔄';
    items.push(
      <span key="share" className="flex items-center gap-1">
        {shareIcon} <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.share_count)}</strong>
      </span>
    );
  }

  if (stats.view_count !== null && stats.view_count !== undefined && stats.view_count > 0) {
    items.push(
      <span key="view" className="flex items-center gap-1">
        👁 <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.view_count)}</strong>
      </span>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
      {items}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main ThreadView
// ──────────────────────────────────────────────────────────────
export default function ThreadView({
  thread,
  threadIndex,
  totalThreads,
  getLabel,
  setLabel,
  skipThread,
  unskipThread,
  completeThread,
  onNext,
  onPrev,
  focusedItemId,
  setFocusedItemId,
  threadState,
}: ThreadViewProps) {
  const { post, comments } = thread;
  const [completionError, setCompletionError] = useState<string | null>(null);

  // _is_address_only is set on Item directly (not inside extra anymore)
  const isAddressOnly = post._is_address_only === true;

  const postLabel = getLabel(post._internal_id);
  const postLabelVal: Label = postLabel
    ? { sentiment: postLabel.sentiment, topic: postLabel.topic, relevance: postLabel.relevance, urgency: postLabel.urgency, intent: postLabel.intent ?? null }
    : EMPTY_LABEL;

  const isPostComplete = isLabelComplete(postLabelVal) && postLabel?.needs_review !== true;
  const isPostFocused = focusedItemId === post._internal_id;
  const isPostSkipped = postLabel?.skipped === true;

  const isPostAssigned = true;

  // For address-only posts, count doesn't include the synthetic post item
  const allItems = (isAddressOnly
    ? comments.flatMap(c => [c.comment, ...c.replies])
    : [post, ...comments.flatMap(c => [c.comment, ...c.replies])]
  ).filter(item => {
    if (thread._data_source === 'supabase' && thread._assigned_entity_keys) {
      return thread._assigned_entity_keys.includes(item._entity_key);
    }
    return true;
  });

  const countComplete = allItems.filter(i => {
    const l = getLabel(i._internal_id);
    return l && isLabelComplete(l) && !l.skipped && !l.needs_review;
  }).length;
  const countReview = allItems.filter(i => getLabel(i._internal_id)?.needs_review === true).length;
  const countSkipped = allItems.filter(i => getLabel(i._internal_id)?.skipped === true).length;
  const countMissing = Math.max(0, allItems.length - countComplete - countReview - countSkipped);

  const isThreadSkipped = threadState?.status === 'skipped' || (allItems.length > 0 && countSkipped === allItems.length);

  const handleSkip = useCallback(() => {
    setCompletionError(null);
    void skipThread(thread);
  }, [thread, skipThread]);
  const handleDone = useCallback(async () => {
    const result = await completeThread(thread);
    setCompletionError(result.ok ? null : result.message ?? 'Không thể hoàn thành thread.');
  }, [completeThread, thread]);

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation bar */}
      <div className="flex items-center justify-between card px-4 py-3">
        <button onClick={onPrev} disabled={threadIndex === 0}
          className="btn-secondary disabled:opacity-40 text-xs">
          ← Prev
        </button>

        <div className="text-center">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Thread {threadIndex + 1} / {totalThreads}
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {countComplete}/{allItems.length} items đã gán nhãn
          </div>

          {/* Stacked mini progress bar */}
          <div className="w-full min-w-[140px] max-w-[200px] mx-auto h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 flex overflow-hidden mt-1.5" title="Tiến độ gán nhãn trong thread này">
            {countComplete > 0 && (
              <div
                className="bg-emerald-500 dark:bg-emerald-600 transition-all duration-300"
                style={{ width: `${(countComplete / allItems.length) * 100}%` }}
              />
            )}
            {countMissing > 0 && (
              <div
                className="bg-orange-400 transition-all duration-300"
                style={{ width: `${(countMissing / allItems.length) * 100}%` }}
              />
            )}
            {countReview > 0 && (
              <div
                className="bg-amber-400 transition-all duration-300"
                style={{ width: `${(countReview / allItems.length) * 100}%` }}
              />
            )}
            {countSkipped > 0 && (
              <div
                className="bg-gray-400 dark:bg-gray-600 transition-all duration-300"
                style={{ width: `${(countSkipped / allItems.length) * 100}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs mt-1 flex-wrap">
            <span className="text-emerald-700 dark:text-emerald-400">Đã gán: {countComplete}</span>
            <span className="text-orange-700 dark:text-orange-400">Chưa gán: {countMissing}</span>
            {countReview > 0 && (
              <span className="text-amber-700 dark:text-amber-400">Xem lại: {countReview}</span>
            )}
            {countSkipped > 0 && (
              <span className="text-gray-500 dark:text-gray-400">Bỏ qua: {countSkipped}</span>
            )}
          </div>
        </div>

        <button onClick={onNext} disabled={threadIndex >= totalThreads - 1}
          className="btn-secondary disabled:opacity-40 text-xs">
          Next →
        </button>
      </div>

      {/* POST card */}
      {isAddressOnly ? (
        /* Address-only: show a collapsed info bar */
        <div className="card px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span>📍</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">Địa chỉ chi nhánh</span>
            <span className="text-gray-400">·</span>
            <SourceIcon source={post._source} />
            <span className="text-gray-600 dark:text-gray-400">{post._source}</span>
            <span className="text-gray-400">·</span>
            <span className="font-semibold text-purple-700 dark:text-purple-400">{post._brand}</span>
            <QueueBadge status={post._queue_status} />
            <LabelStatusBadge label={postLabel} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate max-w-lg">
            {post._text.replace('\n', ' · ')}
          </p>
          {/* Stats bar for address-only (shows rating/review counts for GMaps/BeFood) */}
          <StatsBar stats={post.stats} source={post._source} extra={post.extra as Record<string, unknown>} />
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            ↓ Hiển thị reviews bên dưới (post địa chỉ đã được lọc)
          </p>
        </div>
      ) : (
        /* Normal post card */
        <div
          className={`card p-4 border-l-4 transition-all duration-150
            ${!isPostAssigned ? 'border-l-gray-200 dark:border-l-surface-600'
              : isPostSkipped ? 'border-l-gray-400 opacity-50 item-skipped'
              : isPostComplete ? 'border-l-emerald-500 item-complete'
              : 'border-l-orange-400 item-unlabeled'}
            ${isPostFocused ? 'item-focused z-20 relative' : ''}
          `}
          onMouseEnter={() => setFocusedItemId(post._internal_id)}
          onClick={() => setFocusedItemId(post._internal_id)}
          data-item-id={post._internal_id}
        >
          {/* Post header — line 1: badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-lg">📝</span>
            <span className="font-bold text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
              POST
            </span>
            <SourceIcon source={post._source} />
            <span className="text-gray-600 dark:text-gray-400 text-sm">{post._source}</span>
            <span className="text-gray-400">·</span>
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">{post._brand}</span>
            <QueueBadge status={post._queue_status} />
            <LabelStatusBadge label={postLabel} />
          </div>

          {/* Post header — line 2: author + timestamp + link */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span className="font-medium text-gray-700 dark:text-gray-300">{post._author}</span>
            {post._posted_at && (
              <>
                <span className="text-gray-400">·</span>
                <span>{formatTime(post._posted_at)}</span>
              </>
            )}
            {post._url && (
              <a href={post._url} target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 ml-auto"
                onClick={e => e.stopPropagation()}>
                🔗 Link
              </a>
            )}
          </div>

          {/* Stats bar — shown BEFORE post content */}
          <StatsBar stats={post.stats} source={post._source} extra={post.extra as Record<string, unknown>} />

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-surface-600 my-2" />

          {/* Post content */}
          <div className={`text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap
            ${isPostSkipped ? 'line-through opacity-60' : ''}`}>
            <HighlightedText text={post._text} brand={post._brand} />
          </div>

          {/* Post labels */}
          {isPostAssigned && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-surface-600">
              <LabelSelector
                label={postLabelVal}
                onChange={(l) => setLabel(post._internal_id, l)}
                compact
              />
              {isPostFocused && (
                <p className="text-xs text-blue-500 dark:text-blue-400 opacity-70 mt-1">
                  ↑ Đang focus — phím tắt: 1/2/3 · q-y · a/s · z/x/c/v · 0
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Thread separator */}
      {comments.length > 0 && (
        <div className="thread-separator">
          <span className="text-xs text-gray-400 dark:text-gray-500 px-2">
            💬 {comments.length} bình luận · {comments.reduce((s, c) => s + c.replies.length, 0)} phản hồi
          </span>
        </div>
      )}

      {/* Comments + Replies */}
      {comments.map(({ comment, replies }) => (
        <div key={comment._internal_id} className="flex flex-col gap-2">
          <CommentItem
            item={comment}
            label={getLabel(comment._internal_id)}
            isFocused={focusedItemId === comment._internal_id}
            onFocus={setFocusedItemId}
            onChange={(l) => setLabel(comment._internal_id, l)}
            isAssigned={true}
          />
          {replies.map(reply => (
            <CommentItem
              key={reply._internal_id}
              item={reply}
              isReply
              label={getLabel(reply._internal_id)}
              isFocused={focusedItemId === reply._internal_id}
              onFocus={setFocusedItemId}
              onChange={(l) => setLabel(reply._internal_id, l)}
              isAssigned={true}
            />
          ))}
        </div>
      ))}

      {/* Empty thread notice */}
      {comments.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          Không có bình luận trong thread này.
        </p>
      )}

      {/* Action bar */}
      {completionError && (
        <div className="px-4 py-3 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded text-sm">
          {completionError}
        </div>
      )}
      <div className="flex items-center justify-between card px-4 py-3 mt-1">
        {isThreadSkipped ? (
          <button onClick={() => void unskipThread(thread)} className="btn-secondary text-sm gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
            ↩️ Khôi phục thread
          </button>
        ) : (
          <button onClick={handleSkip} className="btn-secondary text-sm gap-2">
            ⏭ Bỏ qua thread
          </button>
        )}
        <div className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          Space = Bỏ qua · Enter = Xong → Next
        </div>
        <button onClick={() => void handleDone()} className="btn-primary text-sm gap-2">
          ✅ Xong → Next
        </button>
      </div>
    </div>
  );
}
